"use client";

import { useState } from "react";
import { uploadFileDirect } from "@/lib/uploadClient";
import { showToast } from "@/lib/toast";

export default function HeroImageUploader({
  schoolId,
  currentUrl,
}: {
  schoolId: string;
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
        kind: "hero",
        fileKind: "image",
      });
      const res = await fetch("/api/admin/school-hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, path }),
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
      <div className="aspect-[16/9] bg-[var(--color-surface)] rounded-lg overflow-hidden mb-3">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="대표 이미지" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-secondary cursor-pointer inline-flex">
          {busy ? "업로드 중..." : "대표 이미지 변경"}
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
        <p className="text-xs text-[var(--color-text-muted)]">
          권장 크기: 가로 1600 × 세로 900px 이상 (가로로 긴 사진)
          <br className="hidden sm:block" /> 화면 크기에 따라 위아래·좌우가 잘릴 수 있으니 중요한 부분은 사진
          가운데에 배치해주세요.
        </p>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
