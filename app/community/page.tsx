import Link from "next/link";
import { getPublishedActivities } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { ACTIVITY_CATEGORY_LABEL } from "@/lib/types";

export const revalidate = 60;

export default async function CommunityPage() {
  const [settings, jointPrograms, networkActivities] = await Promise.all([
    getSiteSettings(),
    getPublishedActivities({ category: "joint_program", limit: 4 }),
    getPublishedActivities({ category: "network", limit: 4 }),
  ]);

  return (
    <div>
      {/* 01 Hero */}
      <section className="bg-[var(--color-bg-warm)] py-16 sm:py-24">
        <div className="container-page">
          <p className="section-label">{settings.association_name}</p>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold leading-snug whitespace-pre-line">
            {settings.association_slogan}
          </h1>
        </div>
      </section>

      {/* 02 연합회 소개 */}
      <section className="container-page py-14 sm:py-20 max-w-2xl">
        <p className="section-label">연합회 소개</p>
        <h2 className="mt-3 text-xl sm:text-2xl font-bold">{settings.community_title}</h2>
        <p className="mt-4 text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">
          {settings.community_text}
        </p>
      </section>

      {/* 03 함께 만드는 활동 */}
      <section className="py-14 sm:py-20 bg-[var(--color-bg-warm)]">
        <div className="container-page">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="category-label">{ACTIVITY_CATEGORY_LABEL.joint_program}</p>
              <h2 className="mt-3 text-xl sm:text-2xl font-bold">함께 만드는 공동활동</h2>
            </div>
            <Link href="/activities?category=joint_program" className="text-sm text-[var(--color-secondary)] font-medium whitespace-nowrap">
              더 보기 →
            </Link>
          </div>
          <ActivityStrip activities={jointPrograms} emptyMessage="아직 등록된 공동활동이 없습니다." />
        </div>
      </section>

      {/* 04 역량강화네트워크 */}
      <section className="py-14 sm:py-20">
        <div className="container-page">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="category-label">{ACTIVITY_CATEGORY_LABEL.network}</p>
              <h2 className="mt-3 text-xl sm:text-2xl font-bold">{ACTIVITY_CATEGORY_LABEL.network}</h2>
            </div>
            <Link href="/activities?category=network" className="text-sm text-[var(--color-secondary)] font-medium whitespace-nowrap">
              더 보기 →
            </Link>
          </div>
          <ActivityStrip
            activities={networkActivities}
            emptyMessage={`아직 등록된 ${ACTIVITY_CATEGORY_LABEL.network} 활동이 없습니다.`}
          />
        </div>
      </section>

      {/* 05 전체 연합활동 보기 */}
      <section className="container-page pb-16 sm:pb-24 text-center">
        <Link href="/activities?category=joint_program,network" className="btn-primary">
          전체 연합활동 보기
        </Link>
      </section>
    </div>
  );
}

function ActivityStrip({
  activities,
  emptyMessage,
}: {
  activities: {
    id: string;
    title: string;
    activity_date: string | null;
    cover_image_url: string | null;
  }[];
  emptyMessage: string;
}) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] py-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            <p className="font-semibold line-clamp-2">{a.title}</p>
            {a.activity_date && (
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{a.activity_date}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
