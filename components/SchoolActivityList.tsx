"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface SchoolActivityItem {
  id: string;
  title: string;
  activity_date: string | null;
  cover_image_url: string | null;
}

// 화면에 한 번에 보여줄 활동 개수 (연도별로 볼 때도 같습니다)
const VISIBLE_LIMIT = 12;

// 마을학교 상세 페이지의 "활동 기록" 목록과 연도 필터입니다.
// 학교 페이지를 미리 만들어 두고(빠르게 열리도록) 연도 고르기는 화면 안에서 처리합니다.
// 예전처럼 "/schools/{slug}?year=2025" 주소로 열어도 그 연도가 선택된 채로 보입니다.
export function SchoolActivityListFromUrl(props: { slug: string; activities: SchoolActivityItem[] }) {
  const searchParams = useSearchParams();
  return <SchoolActivityList {...props} year={searchParams.get("year")} />;
}

export function SchoolActivityList({
  slug,
  activities,
  year,
}: {
  slug: string;
  activities: SchoolActivityItem[];
  year: string | null;
}) {
  // 새 연도의 활동이 등록되면 코드 수정 없이 자동으로 필터 목록에 나타납니다. (최신 연도가 먼저)
  const years = Array.from(
    new Set(activities.map((a) => a.activity_date?.slice(0, 4)).filter((y): y is string => !!y))
  ).sort((a, b) => b.localeCompare(a));

  // 활동 기록이 쌓인 학교에서만 연도 필터를 보여줍니다.
  // 활동이 적은 학교(연도가 하나뿐이거나 없음)는 필터 없이 그대로 보여줘 썰렁해 보이지 않게 합니다.
  const showYearFilter = years.length > 1;
  const selectedYear = showYearFilter && year && years.includes(year) ? year : undefined;

  const visible = (
    selectedYear ? activities.filter((a) => a.activity_date?.startsWith(selectedYear)) : activities
  ).slice(0, VISIBLE_LIMIT);

  if (visible.length === 0 && !showYearFilter) return null;

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs border transition-colors ${
      active
        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]"
    }`;

  return (
    <div className="mt-14">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="font-semibold">활동 기록</p>
        {showYearFilter && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/schools/${slug}`} scroll={false} className={chipClass(!selectedYear)}>
              전체 연도
            </Link>
            {years.map((y) => (
              <Link
                key={y}
                href={`/schools/${slug}?year=${y}`}
                scroll={false}
                className={chipClass(selectedYear === y)}
              >
                {y}년
              </Link>
            ))}
          </div>
        )}
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">선택한 연도에 등록된 활동이 없습니다.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {visible.map((a) => (
            <Link key={a.id} href={`/activities/${a.id}`} className="card min-w-[180px] w-[180px] flex-shrink-0">
              <div className="aspect-[4/3] bg-[var(--color-surface)] overflow-hidden">
                {a.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.cover_image_url} alt={a.title} loading="lazy" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium line-clamp-2">{a.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
