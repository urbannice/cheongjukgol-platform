"use client";

import { useState } from "react";
import { uploadFileDirect } from "@/lib/uploadClient";
import { showToast } from "@/lib/toast";
import { clearSiteSettingsImageAction } from "@/app/admin/site-settings/actions";

type ImageField =
  | "logo_image"
  | "hero_image"
  | "about_image"
  | "about_logo_image"
  | "community_image"
  | "org_logo_image"
  | "org2_logo_image";

export default function SiteSettingsImageUploader({
  field,
  label,
  hint,
  aspect = "16/9",
  fit = "cover",
  currentUrl,
  allowClear = false,
}: {
  field: ImageField;
  label: string;
  hint?: string;
  aspect?: string;
  fit?: "cover" | "contain";
  currentUrl: string | null;
  allowClear?: boolean;
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
        scope: "settings",
        ownerId: field,
        kind: "hero",
        fileKind: "image",
      });
      const res = await fetch("/api/admin/site-settings-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, path }),
      });
      if (!res.ok) throw new Error("저장 중 오류가 발생했습니다.");
      setPreview(previewUrl);
      showToast();
    } catch (e: any) {
      setError(e.message ?? "업로드 중 오류가 발생했습니다. 기존 이미지가 그대로 유지됩니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    if (!confirm("이미지를 삭제하고 기본값으로 되돌릴까요?")) return;
    setBusy(true);
    setError(null);
    try {
      await clearSiteSettingsImageAction(field);
      setPreview(null);
      showToast("삭제되었습니다.");
    } catch (e: any) {
      setError(e.message ?? "삭제 중 오류가 발생했습니다.");
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
          <img
            src={preview}
            alt={label}
            className={`w-full h-full ${fit === "contain" ? "object-contain p-2" : "object-cover"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">
            등록된 이미지 없음
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="btn-secondary cursor-pointer inline-flex text-sm">
          {busy ? "처리 중..." : "이미지 변경"}
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
        {allowClear && preview && (
          <button
            type="button"
            onClick={handleClear}
            disabled={busy}
            className="text-xs text-red-600 underline underline-offset-2"
          >
            삭제
          </button>
        )}
      </div>
      {hint && <p className="mt-2 text-xs text-[var(--color-text-muted)]">{hint}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
