// 사이트의 기본 주소를 한 곳에서 관리합니다.
// 우선순위: 관리자가 "사이트 설정"에 직접 입력한 주소 > 배포 환경변수 > 기본값
// 이렇게 하면 나중에 자체 도메인을 연결해도 코드를 고칠 필요가 없습니다.
const FALLBACK_SITE_URL = "https://cheongjukgol-platform.netlify.app";

export function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

export function resolveSiteBaseUrl(siteBaseUrlSetting?: string | null) {
  const fromSetting = siteBaseUrlSetting?.trim();
  if (fromSetting) return normalizeBaseUrl(fromSetting);

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  return FALLBACK_SITE_URL;
}
