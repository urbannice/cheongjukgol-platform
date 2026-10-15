import { getSchoolBySlug } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { OG_SIZE, renderShareCard, toBackgroundPng } from "@/lib/ogImage";

// 개별 마을학교 링크를 공유했을 때, 그 학교의 대표사진이 담긴 미리보기 이미지를
// 보여줍니다. 관리자가 그 학교의 대표이미지·소개글을 바꾸면 이 카드도
// 코드 수정 없이 자동으로 최신 내용을 반영합니다.
export const revalidate = 60;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [school, settings] = await Promise.all([getSchoolBySlug(slug), getSiteSettings()]);

  return renderShareCard({
    bgSrc: await toBackgroundPng(school?.hero_image),
    label: settings.association_name,
    title: school?.name ?? settings.association_name,
    subtitle: school?.short_description ?? settings.association_slogan,
  });
}
