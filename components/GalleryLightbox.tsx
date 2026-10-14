"use client";

import { useEffect, useState } from "react";

type GalleryImage = { id: string; url: string; thumbUrl?: string | null; alt: string };

export default function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <div
        className={
          images.length === 1
            ? "grid grid-cols-1"
            : "grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 auto-rows-[140px] sm:auto-rows-[180px]"
        }
      >
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpenIndex(idx)}
            className={`overflow-hidden rounded-lg bg-[var(--color-surface)] ${
              idx === 0 && images.length > 1 ? "col-span-2 row-span-2 aspect-auto" : ""
            } ${images.length === 1 ? "aspect-[16/9]" : ""}`}
          >
            {/* 목록에서는 가벼운 썸네일을 먼저 보여주고, 클릭하면 원본급 사진을 불러옵니다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumbUrl ?? img.url}
              alt={img.alt}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute top-4 right-4 text-white text-2xl leading-none"
            aria-label="닫기"
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
                }}
                className="absolute left-2 sm:left-6 text-white text-3xl px-2"
                aria-label="이전 사진"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
                }}
                className="absolute right-2 sm:right-6 text-white text-3xl px-2"
                aria-label="다음 사진"
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIndex].url}
            alt={images[openIndex].alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
