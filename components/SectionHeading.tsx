import Link from "next/link";

// 메인페이지 섹션 제목의 공통 레이아웃입니다.
// Eyebrow(작은 라벨) → Title(큰 제목) → Description(설명) → CTA 순서로,
// 항상 왼쪽 정렬로 통일해서 씁니다.
export default function SectionHeading({
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
}) {
  return (
    <div className={`text-left ${className}`}>
      {eyebrow && <p className="section-label">{eyebrow}</p>}
      <h2 className="mt-3 text-xl sm:text-2xl font-bold leading-snug">{title}</h2>
      {description && (
        <p className="mt-4 sm:mt-5 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed max-w-xl whitespace-pre-line">
          {description}
        </p>
      )}
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="inline-block mt-6 sm:mt-7 text-sm font-medium text-[var(--color-accent)]"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
