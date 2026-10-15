import { getSiteSettings } from "@/lib/siteSettings";
import { OG_SIZE, renderShareCard, toBackgroundPng, toLogoPng } from "@/lib/ogImage";

// 카카오톡/문자/페이스북 등으로 사이트 링크를 공유했을 때 함께 보이는
// 미리보기 이미지(오픈그래프 이미지)입니다. 홈 화면의 메인 이미지를 배경으로 쓰고,
// 메인 이미지가 없으면 로고와 연합회 이름만 담은 기본 카드를 보여줍니다.
// 관리자가 사이트 설정에서 메인 이미지·로고·연합회 이름·슬로건을 바꾸면,
// 이 미리보기 이미지도 코드 수정 없이 자동으로 최신 내용을 반영합니다.
export const revalidate = 60;
export const alt = "담양마을학교 연합회";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const settings = await getSiteSettings();
  const [bgSrc, logoSrc] = await Promise.all([
    toBackgroundPng(settings.hero_image),
    toLogoPng(settings.logo_image),
  ]);

  return renderShareCard({
    bgSrc,
    logoSrc,
    title: settings.association_name,
    subtitle: settings.association_slogan,
  });
}
