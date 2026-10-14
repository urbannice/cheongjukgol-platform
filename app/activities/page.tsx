import Link from "next/link";
import { getActivityYears, getPublishedActivities, getVisibleSchools } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import SchoolFilter from "@/components/SchoolFilter";
import { ACTIVITY_CATEGORY_LABEL, type ActivityCategory } from "@/lib/types";

// 이 페이지는 검색조건(필터)에 따라 매번 다른 내용을 보여주므로 미리 저장해두지 않고
// 방문할 때마다 새로 만듭니다 (필터 없는 다른 페이지들과 달리 캐시 대상이 아님).
const VALID_CATEGORIES: ActivityCategory[] = ["school", "joint_program", "network"];

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; type?: string; school?: string; year?: string }>;
}) {
  const { category, type, school, year } = await searchParams;

  // category=joint_program,network 처럼 콤마로 여러 개를 한 번에 받을 수도 있습니다.
  // (예: 담양마을학교 연합회 페이지의 "전체 연합활동 보기" 링크)
  const categoryList = category
    ? (category.split(",").filter((c): c is ActivityCategory =>
        VALID_CATEGORIES.includes(c as ActivityCategory)
      ) as ActivityCategory[])
    : undefined;
  const singleCategory = categoryList && categoryList.length === 1 ? categoryList[0] : undefined;
  const validType = !categoryList && (type === "school" || type === "community") ? type : undefined;

  const [activities, schools, settings, years] = await Promise.all([
    getPublishedActivities({
      type: validType,
      category: categoryList,
      schoolId: school,
      year,
      orderBy: "created_at",
    }),
    getVisibleSchools(),
    getSiteSettings(),
    getActivityYears({ type: validType, category: categoryList }),
  ]);

  const selectedYear = year && years.includes(year) ? year : undefined;

  // 연도 버튼을 눌러도 현재 선택된 카테고리·학교 필터가 유지되도록 쿼리를 함께 만들어줍니다.
  const buildYearHref = (y?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (validType) params.set("type", validType);
    if (school) params.set("school", school);
    if (y) params.set("year", y);
    const qs = params.toString();
    return qs ? `/activities?${qs}` : "/activities";
  };

  return (
    <div className="container-page py-14 sm:py-20">
      <p className="section-label">전체활동</p>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold">전체활동</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        마을학교의 일상부터 함께 만드는 {settings.association_name}의 기록까지 한곳에서 만나보세요.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <FilterLink
          label="전체"
          active={!categoryList && !validType}
          href={selectedYear ? `/activities?year=${selectedYear}` : "/activities"}
        />
        <FilterLink
          label={ACTIVITY_CATEGORY_LABEL.school}
          active={singleCategory === "school"}
          href={`/activities?category=school${year ? `&year=${year}` : ""}`}
        />
        <FilterLink
          label={ACTIVITY_CATEGORY_LABEL.joint_program}
          active={singleCategory === "joint_program"}
          href={`/activities?category=joint_program${year ? `&year=${year}` : ""}`}
        />
        <FilterLink
          label={ACTIVITY_CATEGORY_LABEL.network}
          active={singleCategory === "network"}
          href={`/activities?category=network${year ? `&year=${year}` : ""}`}
        />
      </div>

      {/* 연도별 아카이브: 새 연도의 활동이 등록되면 별도 코드 수정 없이 자동으로 버튼이 생깁니다. */}
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
            selected={school}
            type={validType}
            category={singleCategory}
            year={selectedYear}
          />
        </div>
      )}

      {activities.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--color-text-muted)]">등록된 활동이 없습니다.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((a) => (
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
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {a.schools?.name ?? settings.association_name}
                </p>
                <p className="mt-1 font-semibold line-clamp-2">{a.title}</p>
                {a.activity_date && (
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{a.activity_date}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
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
