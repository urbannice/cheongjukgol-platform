"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SchoolFilter from "@/components/SchoolFilter";
import { ACTIVITY_CATEGORY_LABEL, type ActivityCategory, type ActivityType } from "@/lib/types";

export interface ActivityBrowserItem {
  id: string;
  title: string;
  activity_type: ActivityType;
  activity_category: ActivityCategory;
  school_id: string | null;
  school_name: string | null;
  activity_date: string | null;
  cover_image_url: string | null;
}

export interface ActivityFilterParams {
  category?: string | null;
  type?: string | null;
  school?: string | null;
  year?: string | null;
}

const VALID_CATEGORIES: ActivityCategory[] = ["school", "joint_program", "network"];

// "/activities" 주소의 검색조건(?category=…&year=… 등)을 읽어 목록을 보여줍니다.
// 페이지는 미리 만들어 두고(빠르게 열리도록) 필터는 화면 안에서 처리합니다.
export function ActivityBrowserFromUrl(props: Omit<Parameters<typeof ActivityBrowser>[0], "params">) {
  const searchParams = useSearchParams();
  return (
    <ActivityBrowser
      {...props}
      params={{
        category: searchParams.get("category"),
        type: searchParams.get("type"),
        school: searchParams.get("school"),
        year: searchParams.get("year"),
      }}
    />
  );
}

export function ActivityBrowser({
  activities,
  schools,
  associationName,
  params,
}: {
  activities: ActivityBrowserItem[];
  schools: { id: string; name: string }[];
  associationName: string;
  params: ActivityFilterParams;
}) {
  const { category, type, school, year } = params;

  // category=joint_program,network 처럼 콤마로 여러 개를 한 번에 받을 수도 있습니다.
  // (예: 담양마을학교 연합회 페이지의 "전체 연합활동 보기" 링크)
  const categoryList = category
    ? category.split(",").filter((c): c is ActivityCategory => VALID_CATEGORIES.includes(c as ActivityCategory))
    : undefined;
  const singleCategory = categoryList && categoryList.length === 1 ? categoryList[0] : undefined;
  const validType = !categoryList && (type === "school" || type === "community") ? type : undefined;

  const byKind = activities.filter(
    (a) =>
      (!validType || a.activity_type === validType) &&
      (!categoryList || categoryList.includes(a.activity_category))
  );

  // 연도별 아카이브: 새 연도의 활동이 등록되면 별도 코드 수정 없이 자동으로 버튼이 생깁니다.
  const years = Array.from(
    new Set(byKind.map((a) => a.activity_date?.slice(0, 4)).filter((y): y is string => !!y))
  ).sort((a, b) => b.localeCompare(a));
  const selectedYear = year && years.includes(year) ? year : undefined;

  const visible = byKind.filter(
    (a) => (!school || a.school_id === school) && (!year || a.activity_date?.startsWith(year))
  );

  // 연도 버튼을 눌러도 현재 선택된 카테고리·학교 필터가 유지되도록 쿼리를 함께 만들어줍니다.
  const buildYearHref = (y?: string) => {
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (validType) qs.set("type", validType);
    if (school) qs.set("school", school);
    if (y) qs.set("year", y);
    const s = qs.toString();
    return s ? `/activities?${s}` : "/activities";
  };

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        <FilterLink
          label="전체"
          active={!categoryList && !validType}
          href={selectedYear ? `/activities?year=${selectedYear}` : "/activities"}
        />
        {VALID_CATEGORIES.map((c) => (
          <FilterLink
            key={c}
            label={ACTIVITY_CATEGORY_LABEL[c]}
            active={singleCategory === c}
            href={`/activities?category=${c}${year ? `&year=${year}` : ""}`}
          />
        ))}
      </div>

      {years.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterLink label="전체 연도" active={!selectedYear} href={buildYearHref(undefined)} />
          {years.map((y) => (
            <FilterLink key={y} label={`${y}년`} active={selectedYear === y} href={buildYearHref(y)} />
          ))}
        </div>
      )}

      {/* 마을학교 활동일 때만 "학교별 보기"가 의미 있어서, 공동활동/역량강화네트워크에서는 숨깁니다. */}
      {singleCategory !== "joint_program" && singleCategory !== "network" && (
        <div className="mt-4">
          <SchoolFilter
            schools={schools}
            selected={school ?? undefined}
            type={validType}
            category={singleCategory}
            year={selectedYear}
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--color-text-muted)]">등록된 활동이 없습니다.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((a) => (
            <Link key={a.id} href={`/activities/${a.id}`} className="card block group">
              <div className="aspect-[4/3] bg-[var(--color-surface)] overflow-hidden">
                {a.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.cover_image_url}
                    alt={a.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span className="category-label">{ACTIVITY_CATEGORY_LABEL[a.activity_category]}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">{a.school_name ?? associationName}</p>
                <p className="mt-1 font-semibold line-clamp-2">{a.title}</p>
                {a.activity_date && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{a.activity_date}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function FilterLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
        active
          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]"
      }`}
    >
      {label}
    </Link>
  );
}
