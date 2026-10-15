import "server-only";
import { createPublicClient } from "@/lib/supabase/publicClient";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createSignedViewUrl } from "@/lib/storage";

export interface SiteSettings {
  id: string;
  logo_image: string | null;
  hero_image: string | null;
  hero_title: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_url: string;
  about_title: string;
  about_text: string;
  about_body: string;
  about_image: string | null;
  about_logo_image: string | null;
  community_title: string;
  community_text: string;
  community_image: string | null;
  closing_message: string;
  footer_text: string;
  footer_contact: string | null;
  copyright_text: string;
  show_about: boolean;
  show_recent_activities: boolean;
  show_community: boolean;
  site_base_url: string | null;
  // 연합회 공식 명칭/슬로건 — 사이트 전체(헤더/푸터/소개/연합회 페이지)에서 공통으로 씁니다.
  association_name: string;
  association_slogan: string;
  // 지원기관(담양교육지원청) 표기 — 연합회 자체 로고와 분리해서 관리합니다.
  org_name: string;
  org_logo_image: string | null;
  org_support_text: string;
  // 두 번째 지원기관(담양군) — 담양교육지원청과 별도로 로고/기관명을 관리합니다.
  org2_name: string;
  org2_logo_image: string | null;
  updated_at: string;
  updated_by: string | null;
}

const DEFAULT_ASSOCIATION_NAME = "담양마을학교 연합회";
const DEFAULT_ASSOCIATION_SLOGAN = "마을과 함께, 마음이 자랍니다.";
const DEFAULT_ORG_NAME = "담양교육지원청";
const DEFAULT_ORG_SUPPORT_TEXT = "지원 · 담양교육지원청";
const DEFAULT_ORG2_NAME = "담양군";

const DEFAULT_ABOUT_BODY =
  "담양마을학교 연합회는 담양 지역의 마을학교들이 서로의 경험과 활동을 나누고 함께 성장하기 위해 만들어진 마을교육 네트워크입니다.\n\n각 마을학교는 지역의 특성과 사람, 자연을 바탕으로 학교 밖 다양한 경험을 만들어갑니다.\n\n담양교육지원청의 지원을 바탕으로 마을학교 간 공동활동과 역량강화, 네트워크 활동을 이어갑니다.\n\n참여하는 마을학교의 수와 이름은 시간이 지나며 달라질 수 있으며, 이 아카이브는 그 변화의 과정을 함께 기록해 나갑니다.";

// 홈페이지/헤더/소개 페이지에서 방문자에게 보여줄 사이트 설정을 가져옵니다. (공개 읽기)
// site_settings 테이블이 아직 없거나(마이그레이션 전) DB 연결이 잠시 불안정해도
// 사이트 전체가 죽지 않도록, 문제가 생기면 기본 문구로 조용히 대체합니다.
export async function getSiteSettings(): Promise<
  SiteSettings & {
    logo_image_url: string | null;
    hero_image_url: string | null;
    about_image_url: string | null;
    about_logo_image_url: string | null;
    community_image_url: string | null;
    org_logo_image_url: string | null;
    org2_logo_image_url: string | null;
  }
> {
  let row: Partial<SiteSettings> = {};
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
    row = (data ?? {}) as Partial<SiteSettings>;
  } catch {
    row = {};
  }
  const settings: SiteSettings = {
    id: "main",
    logo_image: row.logo_image ?? null,
    hero_image: row.hero_image ?? null,
    hero_title: row.hero_title ?? "마을에서 배우고, 마을과 함께 성장합니다.",
    hero_description:
      row.hero_description ??
      "전남 담양 지역의 여러 마을학교가 함께 모여, 각자의 마을에서 아이들과 어른들이 배우고 성장하는 이야기를 만들어가고 있습니다.",
    hero_cta_text: row.hero_cta_text ?? "마을학교 만나보기",
    hero_cta_url: row.hero_cta_url ?? "/schools",
    about_title: row.about_title ?? "담양마을학교 연합회 소개",
    about_text:
      row.about_text ??
      "전남 담양 지역의 여러 마을학교가 함께 모여, 각자의 마을에서 아이들과 어른들이 배우고 성장하는 이야기를 만들어가고 있습니다.",
    about_body: row.about_body ?? DEFAULT_ABOUT_BODY,
    about_image: row.about_image ?? null,
    about_logo_image: row.about_logo_image ?? null,
    community_title: row.community_title ?? "담양마을학교 연합회 연합활동",
    community_text:
      row.community_text ??
      "10개 마을학교가 서로의 경험과 활동을 나누며 함께 성장하기 위해 만나고 있습니다.",
    community_image: row.community_image ?? null,
    closing_message: row.closing_message ?? DEFAULT_ASSOCIATION_SLOGAN,
    footer_text:
      row.footer_text ?? "담양마을학교 연합회는 담양 지역 마을학교들이 함께 만들어가는 교육공동체입니다.",
    footer_contact: row.footer_contact ?? null,
    copyright_text: row.copyright_text ?? `© ${DEFAULT_ASSOCIATION_NAME}`,
    show_about: row.show_about ?? true,
    show_recent_activities: row.show_recent_activities ?? true,
    show_community: row.show_community ?? true,
    site_base_url: row.site_base_url ?? null,
    association_name: row.association_name ?? DEFAULT_ASSOCIATION_NAME,
    association_slogan: row.association_slogan ?? DEFAULT_ASSOCIATION_SLOGAN,
    org_name: row.org_name ?? DEFAULT_ORG_NAME,
    org_logo_image: row.org_logo_image ?? null,
    org_support_text: row.org_support_text ?? DEFAULT_ORG_SUPPORT_TEXT,
    org2_name: row.org2_name ?? DEFAULT_ORG2_NAME,
    org2_logo_image: row.org2_logo_image ?? null,
    updated_at: row.updated_at ?? new Date().toISOString(),
    updated_by: row.updated_by ?? null,
  };

  const safeSignedUrl = async (path: string | null) => {
    if (!path) return null;
    try {
      return await createSignedViewUrl(path);
    } catch {
      return null;
    }
  };

  const [
    logo_image_url,
    hero_image_url,
    about_image_url,
    about_logo_image_url,
    community_image_url,
    org_logo_image_url,
    org2_logo_image_url,
  ] = await Promise.all([
    safeSignedUrl(settings.logo_image),
    safeSignedUrl(settings.hero_image),
    safeSignedUrl(settings.about_image),
    safeSignedUrl(settings.about_logo_image),
    safeSignedUrl(settings.community_image),
    safeSignedUrl(settings.org_logo_image),
    safeSignedUrl(settings.org2_logo_image),
  ]);

  return {
    ...settings,
    logo_image_url,
    hero_image_url,
    about_image_url,
    about_logo_image_url,
    community_image_url,
    org_logo_image_url,
    org2_logo_image_url,
  };
}

// 관리자 화면에서 폼에 채워 넣을 원본 값을 가져옵니다.
export async function getSiteSettingsAdmin() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
  return data as SiteSettings | null;
}
