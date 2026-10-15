"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ACTIVITY_CATEGORY_LABEL, type ActivityCategory } from "@/lib/types";

type ActivityItem = {
  id: string;
  title: string;
  activity_date: string | null;
  cover_image_url: string | null;
  schools: { name: string } | null;
  activity_category: ActivityCategory;
};

const AUTOPLAY_INTERVAL = 2800;

// 최근 마을학교 활동을 옆으로 넘겨보는 캐러셀입니다.
// 화살표/스와이프로도 넘길 수 있고, 가만히 두면 자동으로 한 장씩 넘어갑니다.
// 사용자가 직접 넘기거나 마우스를 올려두면 잠시 멈췄다가 다시 자동으로 넘어갑니다.
export default function ActivityCarousel({
  activities,
  orgLabel,
}: {
  activities: ActivityItem[];
  orgLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 화살표를 누르거나 모바일에서 손가락으로 넘긴 직후에는 잠시 자동재생을 멈췄다가,
  // 얼마 후 다시 자동으로 넘어가도록 합니다.
  function pauseTemporarily() {
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setIsPaused(false), 4000);
  }

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  function scrollByAmount(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.85;

    // 마지막 카드 근처에서 다음으로 넘기면 처음으로 자연스럽게 돌아갑니다.
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - step * 0.5;
    if (dir === 1 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  useEffect(() => {
    if (activities.length < 2) return;
    // 움직임에 민감한 사용자를 위해, 시스템에서 애니메이션 최소화를 켜둔 경우 자동재생을 하지 않습니다.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      if (!isPaused) scrollByAmount(1);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, activities.length]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={pauseTemporarily}
    >
      <style>{`.activity-carousel-track::-webkit-scrollbar{display:none}`}</style>
      <div
        ref={trackRef}
        className="activity-carousel-track flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {activities.map((a) => (
          <Link
            key={a.id}
            data-card
            href={`/activities/${a.id}`}
            className="card block group snap-start shrink-0 w-[80%] sm:w-[46%] lg:w-[30%]"
          >
            <div className="aspect-[4/3] bg-[var(--color-surface)] overflow-hidden">
              {a.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.cover_image_url}
                  alt={a.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            <div className="p-4">
              <span className="category-label">{ACTIVITY_CATEGORY_LABEL[a.activity_category]}</span>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {a.schools?.name ?? orgLabel}
              </p>
              <p className="mt-1 font-semibold line-clamp-1">{a.title}</p>
              {a.activity_date && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{a.activity_date}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {activities.length > 1 && (
        <div className="hidden sm:flex items-center gap-2 mt-5 justify-end">
          <button
            type="button"
            aria-label="이전 활동"
            onClick={() => {
              pauseTemporarily();
              scrollByAmount(-1);
            }}
            className="w-9 h-9 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] hover:border-[var(--color-secondary)] transition-colors"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="다음 활동"
            onClick={() => {
              pauseTemporarily();
              scrollByAmount(1);
            }}
            className="w-9 h-9 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] hover:border-[var(--color-secondary)] transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
