import Link from "next/link";
import {
  getActiveSchoolCount,
  getVisibleSchools,
  getPublishedActivities,
} from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { ACTIVITY_CATEGORY_LABEL, type ActivityCategory } from "@/lib/types";
import SectionHeading from "@/components/SectionHeading";
import ActivityCarousel from "@/components/ActivityCarousel";

// 홈페이지는 60초 동안 미리 만들어둔 화면을 보여주고, 관리자가 내용을 저장하면
// 그 즉시 새로 만들어서 보여줍니다 (관리자 저장 시 revalidatePath로 즉시 갱신).
export const revalidate = 60;

export default async function HomePage() {
  const [schoolCount, schools, recentSchoolActivities, recentCommunityActivities, settings] =
    await Promise.all([
      getActiveSchoolCount(),
      getVisibleSchools(),
      getPublishedActivities({ type: "school", limit: 8, orderBy: "created_at" }),
      getPublishedActivities({ type: "community", limit: 2, orderBy: "created_at" }),
      getSiteSettings(),
    ]);

  return (
    <div>
      {/* 01 Hero */}
      <section className="relative">
        <div
          className={`relative bg-[var(--color-bg-warm)] overflow-hidden ${
            settings.hero_image_url ? "min-h-[420px] sm:min-h-[560px]" : ""
          }`}
        >
          {settings.hero_image_url && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.hero_image_url}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 35%" }}
              />
              {/* 배너 사진이 자주 바뀌어도 글자·버튼이 항상 잘 보이도록,
                  사진 색상과 무관한 우리 브랜드의 짙은 녹색(Primary Dark) 톤으로 덮습니다. */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(5, 32, 23, 0.58)" }}
              />
            </div>
          )}
          <div
            className={`relative container-page text-center py-24 sm:py-32 ${
              settings.hero_image_url ? "text-white" : ""
            }`}
          >
            <p
              className={`section-label ${settings.hero_image_url ? "!text-white/90" : ""}`}
            >
              {settings.association_name}
            </p>
            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight whitespace-pre-line">
              {settings.hero_title}
            </h1>
            {settings.hero_description && (
              <p
                className={`mt-5 max-w-xl mx-auto text-sm sm:text-base leading-relaxed ${
                  settings.hero_image_url ? "text-white/90" : "text-[var(--color-text-muted)]"
                }`}
              >
                {settings.hero_description}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {/* 배경 사진 위에서는 초록 버튼이 배경과 섞여 안 보일 수 있어서,
                  사진이 있을 때는 흰 배경 버튼으로 바꿔 항상 또렷하게 보이도록 합니다. */}
              <Link
                href={settings.hero_cta_url}
                className={
                  settings.hero_image_url
                    ? "btn-primary !bg-white !text-[var(--color-primary)] hover:!bg-white/90"
                    : "btn-primary"
                }
              >
                {settings.hero_cta_text}
              </Link>
              <Link
                href="/activities"
                className={settings.hero_image_url ? "btn-secondary !text-white !border-white/60" : "btn-secondary"}
              >
                우리의 활동 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 02 바로가기 메뉴 */}
      <section className="py-10 sm:py-14 bg-[var(--color-bg-warm)]">
        <div className="container-page grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <QuickLink href="/about" label="소개" desc="어떤 공동체인지 소개합니다" />
          <QuickLink href="/schools" label="마을학교" desc={`${schoolCount}개 마을학교 만나보기`} />
          <QuickLink href="/activities" label="전체활동" desc="모든 활동을 한곳에서" />
          <QuickLink href="/community" label="연합활동" desc="함께 만드는 이야기" />
          <QuickLink href="/contact" label="연락하기" desc="마을학교 연락처 안내" />
        </div>
      </section>

      {/* 03 함께하는 마을학교 */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4 mb-8">
            <SectionHeading eyebrow="마을학교" title={`함께하는 ${schoolCount}개의 마을학교`} />
            <Link
              href="/schools"
              className="shrink-0 text-sm text-[var(--color-accent)] font-medium whitespace-nowrap"
            >
              전체 보기 →
            </Link>
          </div>
          {schools.length === 0 ? (
            <EmptyState message="아직 공개된 마을학교가 없습니다." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {schools.slice(0, 10).map((school) => (
                <Link key={school.id} href={`/schools/${school.slug}`} className="card block group">
                  <div className="aspect-square bg-[var(--color-surface)] overflow-hidden">
                    {school.hero_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={school.hero_image_url}
                        alt={school.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)] text-center px-2">
                        {school.name}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold line-clamp-1">{school.name}</p>
                    {school.short_description && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">
                        {school.short_description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 04 최근 마을학교 활동 — Carousel */}
      {settings.show_recent_activities && recentSchoolActivities.length > 0 && (
        <section className="py-16 sm:py-20 bg-[var(--color-bg-warm)]">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4 mb-8">
              <SectionHeading eyebrow="최근 소식" title="최근 마을학교 활동" />
              <Link
                href="/activities"
                className="shrink-0 text-sm text-[var(--color-accent)] font-medium whitespace-nowrap"
              >
                전체 보기 →
              </Link>
            </div>
            <ActivityCarousel activities={recentSchoolActivities} orgLabel={settings.association_name} />
          </div>
        </section>
      )}

      {/* 05 담양마을학교 연합회 소개 */}
      {settings.show_about && (
        <section className="py-16 sm:py-20">
          <div className="container-page grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 items-center">
            <div className={settings.about_image_url ? "order-2 sm:order-1" : ""}>
              <SectionHeading
                eyebrow={settings.association_name}
                title={settings.about_title}
                description={settings.about_text}
                ctaHref="/about"
                ctaLabel={`${settings.association_name} 알아보기 →`}
              />
            </div>
            {settings.about_image_url && (
              <div className="order-1 sm:order-2 aspect-[4/3] rounded-xl overflow-hidden bg-[var(--color-surface)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.about_image_url} alt={settings.about_title} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 06 마을교육공동체 연합활동 */}
      {settings.show_community && (
        <section className="py-16 sm:py-20 bg-[var(--color-bg-warm)]">
          <div className="container-page">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 items-center mb-8">
              <SectionHeading
                eyebrow={settings.association_name}
                title={settings.community_title}
                description={settings.community_text}
              />
              {settings.community_image_url && (
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[var(--color-surface)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.community_image_url}
                    alt={settings.community_title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            {recentCommunityActivities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {recentCommunityActivities.map((a) => (
                  <ActivityCard key={a.id} activity={a} orgLabel={settings.association_name} />
                ))}
              </div>
            ) : (
              <EmptyState message="등록된 연합활동이 아직 없습니다." />
            )}
            <Link href="/community" className="inline-block mt-6 text-sm font-medium text-[var(--color-accent)]">
              연합활동 전체 보기 →
            </Link>
          </div>
        </section>
      )}

      {/* 07 Community Message — 푸터 바로 위, 메인 브랜드 컬러(Bottle Green) 배경으로 마무리 */}
      <section className="py-20 sm:py-28 text-center bg-[var(--color-primary)]">
        <div className="container-page">
          <p className="text-xl sm:text-2xl font-semibold leading-relaxed whitespace-pre-line text-white">
            {settings.closing_message}
          </p>
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-secondary)] hover:shadow-sm"
    >
      <p className="font-semibold text-[15px] sm:text-base text-[var(--color-primary)]">{label}</p>
      <p className="mt-1.5 text-xs text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center">
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}

function ActivityCard({
  activity,
  orgLabel,
}: {
  activity: {
    id: string;
    title: string;
    activity_date: string | null;
    cover_image_url: string | null;
    schools: { name: string } | null;
    activity_category: ActivityCategory;
  };
  orgLabel: string;
}) {
  return (
    <Link href={`/activities/${activity.id}`} className="card block group">
      <div className="aspect-[4/3] bg-[var(--color-surface)] overflow-hidden">
        {activity.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activity.cover_image_url}
            alt={activity.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
      <div className="p-4">
        <span className="category-label">{ACTIVITY_CATEGORY_LABEL[activity.activity_category]}</span>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {activity.schools?.name ?? orgLabel}
        </p>
        <p className="mt-1 font-semibold line-clamp-1">{activity.title}</p>
        {activity.activity_date && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{activity.activity_date}</p>
        )}
      </div>
    </Link>
  );
}
