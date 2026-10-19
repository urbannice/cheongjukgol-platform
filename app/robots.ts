import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/siteSettings";
import { resolveSiteBaseUrl } from "@/lib/siteUrl";

// 검색엔진에게 둘러봐도 되는 곳을 알려주는 파일(/robots.txt)입니다.
// 공개 페이지는 모두 허용하고, 관리자 화면과 내부 주소는 검색에 나오지 않게 막습니다.
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const base = resolveSiteBaseUrl(settings.site_base_url);
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
