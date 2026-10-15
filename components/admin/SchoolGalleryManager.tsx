"use client";

import { useRef, useState } from "react";
import { uploadFileDirect } from "@/lib/uploadClient";
import { addMediaAssetAction, softDeleteMediaAction, reorderMediaAssetsAction } from "@/app/admin/media/actions";
import { MAX_GALLERY_UPLOAD_BATCH, FILE_SIZE_LIMITS } from "@/lib/types";
import type { MediaAsset } from "@/lib/types";

type GalleryItem = {
  key: string;
  id: string | null; // DB에 저장되기 전에는 null
  url: string | null;
  status: "uploading" | "done" | "error";
  fileName: string;
  error?: string;
  file?: File;
};

export default function SchoolGalleryManager({
  schoolId,
  initialMedia,
}: {
  schoolId: string;
  initialMedia: (MediaAsset & { url: string | null })[];
}) {
  const [items, setItems] = useState<GalleryItem[]>(
    initialMedia
      .filter((m) => m.media_type === "image")
      .map((m) => ({ key: m.id, id: m.id, url: m.url, status: "done", fileName: m.original_file_name ?? "" }))
  );
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doneCount = items.filter((i) => i.status === "done").length;
  const uploadingCount = items.filter((i) => i.status === "uploading").length;

  function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).slice(0, MAX_GALLERY_UPLOAD_BATCH);
    const newItems: GalleryItem[] = files.map((file) => ({
      key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      id: null,
      url: URL.createObjectURL(file),
      status: "uploading",
      fileName: file.name,
      file,
    }));
    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadOne(item));
  }

  async function uploadOne(item: GalleryItem) {
    if (!item.file) return;
    if (item.file.size > FILE_SIZE_LIMITS.image) {
      setItems((prev) =>
        prev.map((i) => (i.key === item.key ? { ...i, status: "error", error: "용량이 너무 큽니다 (최대 15MB)" } : i))
      );
      return;
    }
    try {
      const { path, thumbPath, size, mimeType, originalFileName } = await uploadFileDirect({
        file: item.file,
        scope: "schools",
        ownerId: schoolId,
        kind: "images",
        fileKind: "image",
        generateThumbnail: true,
      });
      const created = await addMediaAssetAction({
        schoolId,
        mediaType: "image",
        filePath: path,
        thumbnailPath: thumbPath,
        fileSize: size,
        mimeType,
        originalFileName,
      });
      // 미리보기는 처음 선택했을 때 만든 로컬 이미지 링크(item.url)를 그대로 사용합니다.
      setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, id: created.id, status: "done" } : i)));
    } catch (e: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.key === item.key ? { ...i, status: "error", error: e.message ?? "업로드 중 오류가 발생했습니다." } : i
        )
      );
    }
  }

  function retry(item: GalleryItem) {
    setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: "uploading", error: undefined } : i)));
    uploadOne(item);
  }

  function removeLocalFailed(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  async function deleteItem(item: GalleryItem) {
    if (!item.id) return;
    if (!confirm("이 사진을 삭제할까요?")) return;
    await softDeleteMediaAction(item.id);
    setItems((prev) => prev.filter((i) => i.key !== item.key));
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    const orderedIds = next.map((i) => i.id).filter((id): id is string => !!id);
    await reorderMediaAssetsAction(orderedIds);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? "border-[var(--color-primary)] bg-[var(--color-surface)]/60" : "border-[var(--color-border)]"
        }`}
      >
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          사진을 여기에 끌어다 놓거나, 한 번에 여러 장을 선택할 수 있습니다. (최대 {MAX_GALLERY_UPLOAD_BATCH}장)
        </p>
        <label className="btn-secondary cursor-pointer inline-flex text-sm">
          + 사진 여러 장 추가
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {uploadingCount > 0 && (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          {items.length}장 중 {doneCount}장 업로드 완료, {uploadingCount}장 업로드 중...
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((item, idx) => (
            <div key={item.key} className="relative">
              <div className="aspect-square rounded-md overflow-hidden bg-[var(--color-surface)]">
                {item.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.fileName}
                    className={`w-full h-full object-cover ${item.status === "uploading" ? "opacity-50" : ""}`}
                  />
                )}
              </div>

              {item.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white bg-black/30 rounded-md">
                  업로드 중...
                </div>
              )}

              {item.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 rounded-md p-1">
                  <p className="text-[10px] text-white text-center">{item.error ?? "실패"}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => retry(item)}
                      className="text-[10px] text-white underline"
                    >
                      다시 시도
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLocalFailed(item.key)}
                      className="text-[10px] text-white underline"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {item.status === "done" && (
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-black/40 rounded-md flex flex-col items-center justify-center gap-1 p-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="text-xs text-white disabled:opacity-30"
                      aria-label="앞으로 이동"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="text-xs text-white disabled:opacity-30"
                      aria-label="뒤로 이동"
                    >
                      →
                    </button>
                  </div>
                  <button type="button" onClick={() => deleteItem(item)} className="text-xs text-white underline">
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
