"use client";

import { useState } from "react";
import { uploadFileDirect } from "@/lib/uploadClient";
import {
  addMediaAssetAction,
  softDeleteMediaAction,
  updateMediaVisibilityAction,
} from "@/app/admin/media/actions";
import { setActivityCoverAction } from "@/app/admin/activities/actions";
import type { MediaAsset, MediaCategory } from "@/lib/types";
import { ALL_DOCUMENT_EXTENSIONS, MEDIA_CATEGORY_LABEL, PRESENTATION_EXTENSIONS } from "@/lib/types";

type MediaItem = MediaAsset & { url: string | null };

export default function MediaManager({
  activityId,
  initialMedia,
  initialCoverPath,
}: {
  activityId: string;
  initialMedia: MediaItem[];
  initialCoverPath?: string | null;
}) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [open, setOpen] = useState<string | null>("images");
  const [coverPath, setCoverPath] = useState<string | null>(initialCoverPath ?? null);

  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video" || m.media_type === "external_video");
  const documents = media.filter((m) => m.media_type === "document");
  const links = media.filter((m) => m.media_type === "external_link");

  function onCreated(item: MediaItem) {
    setMedia((prev) => [...prev, item]);
    // 대표 사진을 아직 따로 지정한 적이 없다면, 맨 처음 올린 사진을 자동으로 대표 사진으로 지정합니다.
    // (관리자가 사진을 한 장만 올리는 경우가 많아, 매번 따로 "대표 사진으로 지정"을 누르지 않아도 됩니다.
    // 다른 사진을 대표로 쓰고 싶으면 목록에서 언제든 다시 지정할 수 있습니다.)
    if (item.media_type === "image" && !coverPath && item.file_url) {
      setCoverPath(item.file_url);
      setActivityCoverAction(activityId, item.file_url);
    }
  }
  function onDeleted(id: string) {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }
  function onVisibilityChanged(id: string, visibility: "public" | "admin_only") {
    setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, visibility } : m)));
  }
  async function onSetCover(path: string) {
    setCoverPath(path);
    await setActivityCoverAction(activityId, path);
  }

  return (
    <div className="space-y-3">
      <AccordionSection
        title="사진"
        open={open === "images"}
        onToggle={() => setOpen(open === "images" ? null : "images")}
      >
        <p className="text-xs text-[var(--color-text-muted)]">
          사진을 올린 뒤, 목록에서 하나를 골라 &quot;대표 사진으로 지정&quot;을 눌러주세요.
        </p>
        <ImageUploadArea activityId={activityId} onCreated={onCreated} />
        <MediaGrid
          items={images}
          coverPath={coverPath}
          onDeleted={onDeleted}
          onVisibilityChanged={onVisibilityChanged}
          onSetCover={onSetCover}
        />
      </AccordionSection>

      <AccordionSection
        title="영상"
        open={open === "videos"}
        onToggle={() => setOpen(open === "videos" ? null : "videos")}
      >
        <VideoUploadArea activityId={activityId} onCreated={onCreated} />
        <MediaList items={videos} onDeleted={onDeleted} onVisibilityChanged={onVisibilityChanged} />
      </AccordionSection>

      <AccordionSection
        title="첨부자료"
        open={open === "documents"}
        onToggle={() => setOpen(open === "documents" ? null : "documents")}
      >
        <DocumentUploadArea activityId={activityId} onCreated={onCreated} />
        <MediaList items={documents} onDeleted={onDeleted} onVisibilityChanged={onVisibilityChanged} showCategory />
      </AccordionSection>

      <AccordionSection
        title="관련링크"
        open={open === "links"}
        onToggle={() => setOpen(open === "links" ? null : "links")}
      >
        <LinkAddArea activityId={activityId} onCreated={onCreated} />
        <MediaList items={links} onDeleted={onDeleted} onVisibilityChanged={onVisibilityChanged} />
      </AccordionSection>
    </div>
  );
}

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card bg-[var(--color-bg)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 font-semibold"
      >
        {title}
        <span className="text-[var(--color-text-muted)]">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

function ImageUploadArea({
  activityId,
  onCreated,
}: {
  activityId: string;
  onCreated: (item: MediaItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setBusy(true);
    setError(null);
    const failed: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const { path, thumbPath, previewUrl, size, mimeType, originalFileName } = await uploadFileDirect({
          file,
          scope: "activities",
          ownerId: activityId,
          kind: "images",
          fileKind: "image",
          generateThumbnail: true,
        });
        const created = await addMediaAssetAction({
          activityId,
          mediaType: "image",
          filePath: path,
          thumbnailPath: thumbPath,
          fileSize: size,
          mimeType,
          originalFileName,
        });
        onCreated({ ...(created as MediaAsset), url: previewUrl });
      } catch (e: any) {
        failed.push(file.name);
      }
    }
    if (failed.length > 0) {
      setError(`${failed.join(", ")} 업로드에 실패했습니다. 다시 시도해주세요.`);
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="btn-secondary cursor-pointer inline-flex">
        {busy ? "업로드 중..." : "+ 사진 추가 (여러 장 가능)"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function MediaGrid({
  items,
  coverPath,
  onDeleted,
  onVisibilityChanged,
  onSetCover,
}: {
  items: MediaItem[];
  coverPath?: string | null;
  onDeleted: (id: string) => void;
  onVisibilityChanged: (id: string, v: "public" | "admin_only") => void;
  onSetCover?: (path: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((m) => {
        const isCover = !!m.file_url && m.file_url === coverPath;
        return (
          <div key={m.id} className={`relative group ${isCover ? "ring-2 ring-[var(--color-primary)] rounded-md" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url ?? ""} alt="" className="aspect-square object-cover rounded-md w-full" />
            {isCover && (
              <span className="absolute top-1 left-1 text-[10px] bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded-full">
                대표 사진
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-1 p-1">
              <VisibilityToggle item={m} onVisibilityChanged={onVisibilityChanged} small />
              {onSetCover && m.file_url && !isCover && (
                <button
                  type="button"
                  onClick={() => onSetCover(m.file_url!)}
                  className="text-[10px] text-white underline"
                >
                  대표 사진으로 지정
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm("이 사진을 삭제할까요?")) {
                    softDeleteMediaAction(m.id).then(() => onDeleted(m.id));
                  }
                }}
                className="text-xs text-white underline"
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MediaList({
  items,
  onDeleted,
  onVisibilityChanged,
  showCategory,
}: {
  items: MediaItem[];
  onDeleted: (id: string) => void;
  onVisibilityChanged: (id: string, v: "public" | "admin_only") => void;
  showCategory?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-3 border border-[var(--color-border)] rounded-md px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {m.title || m.original_file_name || m.external_url}
            </p>
            {showCategory && m.category && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {MEDIA_CATEGORY_LABEL[m.category]}
              </p>
            )}
          </div>
          <VisibilityToggle item={m} onVisibilityChanged={onVisibilityChanged} />
          <button
            type="button"
            onClick={() => {
              if (confirm("삭제할까요?")) {
                softDeleteMediaAction(m.id).then(() => onDeleted(m.id));
              }
            }}
            className="text-xs text-red-600 flex-shrink-0"
          >
            삭제
          </button>
        </div>
      ))}
    </div>
  );
}

function VisibilityToggle({
  item,
  onVisibilityChanged,
  small,
}: {
  item: MediaItem;
  onVisibilityChanged: (id: string, v: "public" | "admin_only") => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const next = item.visibility === "public" ? "admin_only" : "public";
        updateMediaVisibilityAction(item.id, next).then(() => onVisibilityChanged(item.id, next));
      }}
      className={`${small ? "text-[10px] text-white" : "text-xs"} px-2 py-1 rounded-full flex-shrink-0 ${
        item.visibility === "public"
          ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)]"
          : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
      } ${small ? "!bg-transparent !text-white underline" : ""}`}
    >
      {item.visibility === "public" ? "공개" : "관리자 전용"}
    </button>
  );
}

function VideoUploadArea({
  activityId,
  onCreated,
}: {
  activityId: string;
  onCreated: (item: MediaItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { path, size, mimeType, originalFileName } = await uploadFileDirect({
        file,
        scope: "activities",
        ownerId: activityId,
        kind: "videos",
        fileKind: "video",
      });
      const created = await addMediaAssetAction({
        activityId,
        mediaType: "video",
        filePath: path,
        fileSize: size,
        mimeType,
        originalFileName,
      });
      onCreated({ ...(created as MediaAsset), url: null });
    } catch (e: any) {
      setError(e.message ?? "업로드 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleYoutube() {
    if (!ytUrl.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await addMediaAssetAction({
        activityId,
        mediaType: "external_video",
        externalUrl: ytUrl.trim(),
        title: ytTitle.trim() || null,
      });
      onCreated({ ...(created as MediaAsset), url: ytUrl.trim() });
      setYtUrl("");
      setYtTitle("");
    } catch (e: any) {
      setError(e.message ?? "등록 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">YouTube 등 영상 링크 등록 (권장)</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">
          영상은 유튜브 등에 올린 뒤 링크로 등록하는 방법을 우선 사용해주세요. Storage 용량을
          거의 쓰지 않고, 재생도 더 빠르고 안정적입니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={ytTitle}
            onChange={(e) => setYtTitle(e.target.value)}
            placeholder="영상 제목 (선택)"
            className="input sm:w-40"
          />
          <input
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="YouTube 등 영상 링크 주소"
            className="input flex-1"
          />
          <button type="button" onClick={handleYoutube} disabled={busy} className="btn-primary text-sm">
            링크 등록
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-3">
        <p className="text-sm font-medium mb-1">영상 파일 직접 업로드</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">
          매우 짧은 영상 등 링크 등록이 어려운 경우에만 사용해주세요. 용량이 큰 영상은 Storage
          공간을 빠르게 소모하니, 가능하면 위의 YouTube 링크 등록을 이용해주세요. (최대 200MB)
        </p>
        <label className="btn-secondary cursor-pointer inline-flex text-sm">
          {busy ? "처리 중..." : "영상 파일 선택"}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function DocumentUploadArea({
  activityId,
  onCreated,
}: {
  activityId: string;
  onCreated: (item: MediaItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<MediaCategory | "">("");

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALL_DOCUMENT_EXTENSIONS.includes(ext)) {
      setError("PDF, HWP, Word, PPT, Excel 파일만 등록할 수 있습니다.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fileKind = PRESENTATION_EXTENSIONS.includes(ext) ? "presentation" : "document";
      const { path, size, mimeType, originalFileName } = await uploadFileDirect({
        file,
        scope: "activities",
        ownerId: activityId,
        kind: "documents",
        fileKind,
      });
      const created = await addMediaAssetAction({
        activityId,
        mediaType: "document",
        filePath: path,
        fileSize: size,
        mimeType,
        originalFileName,
        category: category || null,
      });
      onCreated({ ...(created as MediaAsset), url: null });
    } catch (e: any) {
      setError(e.message ?? "업로드 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">
        등록한 문서는 기본적으로 &quot;관리자 전용&quot;으로 저장됩니다. 방문자에게 공개하려면
        등록 후 목록에서 공개로 바꿔주세요.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MediaCategory | "")}
          className="input w-auto"
        >
          <option value="">분류 선택 (선택)</option>
          {Object.entries(MEDIA_CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="btn-secondary cursor-pointer inline-flex text-sm">
          {busy ? "업로드 중..." : "파일 선택"}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.hwp,.ppt,.pptx,.xls,.xlsx"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function LinkAddArea({
  activityId,
  onCreated,
}: {
  activityId: string;
  onCreated: (item: MediaItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await addMediaAssetAction({
        activityId,
        mediaType: "external_link",
        externalUrl: url.trim(),
        title: title.trim() || null,
      });
      onCreated({ ...(created as MediaAsset), url: url.trim() });
      setTitle("");
      setUrl("");
    } catch (e: any) {
      setError(e.message ?? "등록 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 (예: 관련기사)"
          className="input sm:w-48"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="링크 주소"
          className="input flex-1"
        />
        <button type="button" onClick={handleAdd} disabled={busy} className="btn-primary text-sm">
          + 링크 추가
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
