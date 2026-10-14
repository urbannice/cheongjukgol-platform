"use client";

import { useState } from "react";
import { uploadFileDirect } from "@/lib/uploadClient";
import { showToast } from "@/lib/toast";

export default function SchoolImageUploader({
  schoolId,
  field,
  label,
  aspect = "4/3",
  currentUrl,
}: {
  schoolId: string;
  field: "representative_photo" | "activist_photo" | "contact_image";
  label: string;
  aspect?: string;
  currentUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { path, previewUrl } = await uploadFileDirect({
        file,
        scope: "schools",
        ownerId: schoolId,
        kind: "images",
        fileKind: "image",
      });
      const res = await fetch("/api/admin/school-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, field, path }),
      });
      if (!res.ok) throw new Error("저장 중 오류가 발생했습니다.");
      setPreview(previewUrl);
      showToast();
    } catch (e: any) {
      setError(e.message ?? "업로드 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div
        className="bg-[var(--color-surface)] rounded-lg overflow-hidden mb-3"
        style={{ aspectRatio: aspect }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">
            등록된 이미지 없음
          </div>
        )}
      </div>
      <label className="btn-secondary cursor-pointer inline-flex text-sm">
        {busy ? "업로드 중..." : "이미지 변경"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
