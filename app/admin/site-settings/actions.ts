"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { writeAdminLog } from "@/lib/log";
import { deleteStorageObjects, replaceSingleFile } from "@/lib/storage";

async function requireSession() {
  const session = await getAdminSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  return session;
}

function field(formData: FormData, key: string, fallback = "") {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : fallback;
}

export async function updateSiteSettingsAction(formData: FormData) {
  const session = await requireSession();
  const supabase = createAdminClient();

  const updates = {
    hero_title: field(formData, "hero_title") || "마을에서 배우고, 마을과 함께 성장합니다.",
    hero_description: field(formData, "hero_description"),
    hero_cta_text: field(formData, "hero_cta_text") || "마을학교 만나보기",
    hero_cta_url: field(formData, "hero_cta_url") || "/schools",
    about_title: field(formData, "about_title"),
    about_text: field(formData, "about_text"),
    about_body: field(formData, "about_body"),
    community_title: field(formData, "community_title"),
    community_text: field(formData, "community_text"),
    closing_message: field(formData, "closing_message"),
    footer_text: field(formData, "footer_text"),
    footer_contact: field(formData, "footer_contact") || null,
    copyright_text: field(formData, "copyright_text") || "© 담양마을학교 연합회",
    show_about: formData.get("show_about") === "on",
    show_recent_activities: formData.get("show_recent_activities") === "on",
    show_community: formData.get("show_community") === "on",
    site_base_url: field(formData, "site_base_url") || null,
    association_name: field(formData, "association_name") || "담양마을학교 연합회",
    association_slogan: field(formData, "association_slogan") || "마을과 함께, 마음이 자랍니다.",
    org_name: field(formData, "org_name") || "담양교육지원청",
    org_support_text: field(formData, "org_support_text") || "지원 · 담양교육지원청",
    org2_name: field(formData, "org2_name") || "담양군",
    updated_at: new Date().toISOString(),
    updated_by: `${session.editorName} (${session.editorOrg})`,
  };

  const { error } = await supabase.from("site_settings").update(updates).eq("id", "main");
  if (error) return { error: `저장 중 오류가 발생했습니다: ${error.message}` };

  await writeAdminLog({
    session,
    targetType: "site_settings",
    targetId: "main",
    targetLabel: "사이트 설정",
    action: "updated",
    detail: "홈페이지 문구/설정 수정",
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/community");
  revalidatePath("/contact");
  revalidatePath("/admin/site-settings");
  return { success: true };
}

const IMAGE_FIELDS = [
  "logo_image",
  "hero_image",
  "about_image",
  "about_logo_image",
  "community_image",
  "org_logo_image",
  "org2_logo_image",
] as const;
type ImageField = (typeof IMAGE_FIELDS)[number];

const IMAGE_LABEL: Record<ImageField, string> = {
  logo_image: "사이트 로고",
  hero_image: "메인배너 이미지",
  about_image: "소개 페이지 사진",
  about_logo_image: "소개페이지 타이틀 로고",
  community_image: "연합회 소개 사진",
  org_logo_image: "담양교육지원청 로고",
  org2_logo_image: "담양군 로고",
};

export async function updateSiteSettingsImageAction(field: ImageField, storagePath: string) {
  if (!IMAGE_FIELDS.includes(field)) throw new Error("잘못된 이미지 항목입니다.");
  const session = await requireSession();
  const supabase = createAdminClient();

  const { data: existing } = await supabase.from("site_settings").select(field).eq("id", "main").single();

  const { error } = await supabase
    .from("site_settings")
    .update({ [field]: storagePath, updated_at: new Date().toISOString(), updated_by: `${session.editorName} (${session.editorOrg})` })
    .eq("id", "main");
  // 새 이미지가 안전하게 저장된 뒤에만 이전 파일을 정리합니다.
  if (!error) await replaceSingleFile((existing as any)?.[field], storagePath);

  await writeAdminLog({
    session,
    targetType: "site_settings",
    targetId: "main",
    targetLabel: "사이트 설정",
    action: "updated",
    detail: `${IMAGE_LABEL[field]} 변경`,
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/community");
  revalidatePath("/contact");
  revalidatePath("/admin/site-settings");
}

// 이미지를 삭제해서 기본값(기본 로고/텍스트 타이틀 등)으로 되돌립니다.
export async function clearSiteSettingsImageAction(field: ImageField) {
  if (!IMAGE_FIELDS.includes(field)) throw new Error("잘못된 이미지 항목입니다.");
  const session = await requireSession();
  const supabase = createAdminClient();

  const { data: existing } = await supabase.from("site_settings").select(field).eq("id", "main").single();

  const { error } = await supabase
    .from("site_settings")
    .update({ [field]: null, updated_at: new Date().toISOString(), updated_by: `${session.editorName} (${session.editorOrg})` })
    .eq("id", "main");
  if (!error) await deleteStorageObjects([(existing as any)?.[field]]);

  await writeAdminLog({
    session,
    targetType: "site_settings",
    targetId: "main",
    targetLabel: "사이트 설정",
    action: "updated",
    detail: `${IMAGE_LABEL[field]} 삭제(기본값 복원)`,
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/community");
  revalidatePath("/contact");
  revalidatePath("/admin/site-settings");
}
