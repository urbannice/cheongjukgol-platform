import { getActivityById } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { OG_SIZE, renderShareCard, toBackgroundPng } from "@/lib/ogImage";

// 활동 링크를 공유했을 때, 그 활동의 대표사진(없으면 첫 번째 사진)이 담긴
// 미리보기 이미지를 보여줍니다. 사진이 하나도 없으면 홈 화면 메인 이미지를 대신 씁니다.
export const revalidate = 60;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, settings] = await Promise.all([getActivityById(id), getSiteSettings()]);

  const firstImage = result?.media.find((m) => m.media_type === "image" && m.file_url)?.file_url;
  const bgSrc =
    (await toBackgroundPng(result?.activity.cover_image ?? firstImage)) ??
    (await toBackgroundPng(settings.hero_image));

  const activity = result?.activity;
  const label = activity?.schools
    ? `${settings.association_name} · ${activity.schools.name}`
    : settings.association_name;

  return renderShareCard({
    bgSrc,
    label,
    title: activity?.title ?? settings.association_name,
    subtitle: activity?.activity_date ?? (activity ? null : settings.association_slogan),
  });
}
