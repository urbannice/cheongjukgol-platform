import type { MetadataRoute } from "next";
import { getPublishedActivities, getVisibleSchools } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { resolveSiteBaseUrl } from "@/lib/siteUrl";

// 네이버·구글 같은 검색엔진에 사이트의 페이지 목록을 알려주는 사이트맵(/sitemap.xml)입니다.
// 공개된 마을학교와 활동이 자동으로 목록에 들어가므로, 새로 올려도 코드를 고칠 필요가 없습니다.
// 1시간마다 새로 만듭니다.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, schools, activities] = await Promise.all([
    getSiteSettings(),
    getVisibleSchools(),
    getPublishedActivities({ orderBy: "created_at" }),
  ]);
  const base = resolveSiteBaseUrl(settings.site_base_url);

  const fixedPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/schools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/activities`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/community`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const schoolPages: MetadataRoute.Sitemap = schools.map((s) => ({
    url: `${base}/schools/${s.slug}`,
    lastModified: s.updated_at,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const activityPages: MetadataRoute.Sitemap = activities.map((a) => ({
    url: `${base}/activities/${a.id}`,
    lastModified: a.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...fixedPages, ...schoolPages, ...activityPages];
}
