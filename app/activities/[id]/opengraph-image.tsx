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

  // 활동 제목은 카드 그림에 넣지 않습니다(제목은 공유 미리보기의 글자 부분에만 나옵니다).
  // 그림에는 활동한 마을학교 이름(연합활동이면 연합회 이름)과 활동 날짜만 보여줍니다.
  const activity = result?.activity;
  const schoolName = activity?.schools?.name ?? null;

  return renderShareCard({
    bgSrc,
    label: schoolName ? settings.association_name : null,
    title: schoolName ?? settings.association_name,
    subtitle: activity ? activity.activity_date : settings.association_slogan,
  });
}
