"use client";

import { useState } from "react";

export default function ContactQrPanel({ contactUrl }: { contactUrl: string }) {
  const [copied, setCopied] = useState(false);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    contactUrl
  )}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(contactUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근이 막힌 브라우저에서는 조용히 무시합니다.
    }
  }

  return (
    <div className="card p-5 max-w-sm">
      <p className="font-semibold mb-1">마을학교 연락처 QR</p>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        리플렛이나 현수막에 인쇄할 수 있는, 모든 마을학교 연락처 페이지의 QR 코드입니다.
      </p>
      <div className="bg-white rounded-lg p-3 flex justify-center mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrImageUrl} alt="연락처 페이지 QR 코드" width={200} height={200} />
      </div>
      <p className="text-xs text-[var(--color-text-muted)] break-all mb-4">{contactUrl}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className="btn-secondary text-sm">
          {copied ? "복사됨!" : "링크 복사"}
        </button>
        <a href={qrImageUrl} download="cheongjukgol-contact-qr.png" className="btn-secondary text-sm">
          QR 이미지 저장
        </a>
        <a href={contactUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
          연락처 페이지 미리보기
        </a>
      </div>
    </div>
  );
}
