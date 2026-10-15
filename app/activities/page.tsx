import { Suspense } from "react";
import { getPublishedActivities, getVisibleSchools } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { ActivityBrowser, ActivityBrowserFromUrl, type ActivityBrowserItem } from "@/components/ActivityBrowser";

// 공개된 활동 전체를 미리 만들어 두고(60초마다 갱신), 분류·연도·학교 필터는 화면 안에서 처리합니다.
// 그래서 필터를 바꿔도 서버를 다시 거치지 않아 빠르게 바뀝니다.
export const revalidate = 60;

export default async function ActivitiesPage() {
  const [activities, schools, settings] = await Promise.all([
    getPublishedActivities({ orderBy: "created_at" }),
    getVisibleSchools(),
    getSiteSettings(),
  ]);

  // 화면에 필요한 값만 넘깁니다.
  const items: ActivityBrowserItem[] = activities.map((a) => ({
    id: a.id,
    title: a.title,
    activity_type: a.activity_type,
    activity_category: a.activity_category,
    school_id: a.school_id,
    school_name: a.schools?.name ?? null,
    activity_date: a.activity_date,
    cover_image_url: a.cover_image_url,
  }));
  const schoolOptions = schools.map((s) => ({ id: s.id, name: s.name }));
  const browserProps = { activities: items, schools: schoolOptions, associationName: settings.association_name };

  return (
    <div className="container-page py-14 sm:py-20">
      <p className="section-label">전체활동</p>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold">전체활동</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        마을학교의 일상부터 함께 만드는 {settings.association_name}의 기록까지 한곳에서 만나보세요.
      </p>

      {/* 미리 만들어 둔 화면에는 필터 없는 전체 목록을 넣어두고, 브라우저에서 주소의 필터를 읽어 바로 바꿉니다. */}
      <Suspense fallback={<ActivityBrowser {...browserProps} params={{}} />}>
        <ActivityBrowserFromUrl {...browserProps} />
      </Suspense>
    </div>
  );
}
