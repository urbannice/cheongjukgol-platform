import "server-only";
import { createPublicClient } from "@/lib/supabase/publicClient";

// "/media/..." 주소로 들어온 파일이 방문자에게 보여줘도 되는 파일인지 확인합니다.
// 보관함(media)은 비공개라서, 경로만 알면 아무 파일이나 열리는 일이 없도록
// 실제로 공개 화면에 쓰이고 있는 파일만 통과시킵니다.
// (관리자 전용 문서, 숨긴 마을학교, 공개 전(draft)·보관(archived) 활동, 삭제된 항목의 파일은 열리지 않습니다)

const SETTINGS_IMAGE_FIELDS = [
  "logo_image",
  "hero_image",
  "about_image",
  "about_logo_image",
  "community_image",
  "org_logo_image",
  "org2_logo_image",
] as const;

const SCHOOL_IMAGE_FIELDS = ["hero_image", "representative_photo", "activist_photo", "contact_image"] as const;

// 보관함 경로 규칙(lib/storage.ts의 buildStoragePath)에 맞는 모양인지 먼저 확인합니다.
// 업로드할 때 파일 이름의 영문·숫자·._- 이외 글자는 모두 _ 로 바뀌므로, 그 밖의 글자가 있으면 거절합니다.
export function isWellFormedMediaPath(path: string) {
  if (!/^(schools|activities|settings)\//.test(path)) return false;
  return path.split("/").every((s) => /^[A-Za-z0-9._-]+$/.test(s) && s !== "." && s !== "..");
}

async function isPublicSchool(schoolId: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .maybeSingle();
  return !!data;
}

async function isPublishedActivity(activityId: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("activities")
    .select("id")
    .eq("id", activityId)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  return !!data;
}

async function isSiteSettingsImage(path: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("site_settings")
    .select(SETTINGS_IMAGE_FIELDS.join(","))
    .eq("id", "main")
    .maybeSingle();
  if (!data) return false;
  const row = data as unknown as Record<string, string | null>;
  return SETTINGS_IMAGE_FIELDS.some((f) => row[f] === path);
}

async function isPublicSchoolImage(path: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("schools")
    .select(SCHOOL_IMAGE_FIELDS.join(","))
    .or(SCHOOL_IMAGE_FIELDS.map((f) => `${f}.eq."${path}"`).join(","))
    .eq("is_visible", true)
    .is("deleted_at", null)
    .limit(1);
  return (data ?? []).length > 0;
}

async function isPublishedActivityCover(path: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("activities")
    .select("id")
    .eq("cover_image", path)
    .eq("status", "published")
    .is("deleted_at", null)
    .limit(1);
  return (data ?? []).length > 0;
}

// 자료(사진/영상) 목록에 공개로 등록된 파일인지, 그리고 그 자료가 속한 학교/활동도 공개 상태인지 확인합니다.
async function isPublicMediaAsset(path: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("media_assets")
    .select("activity_id, school_id")
    .or(`file_url.eq."${path}",thumbnail_url.eq."${path}"`)
    .eq("visibility", "public")
    .is("deleted_at", null);
  for (const row of (data ?? []) as { activity_id: string | null; school_id: string | null }[]) {
    if (row.activity_id) {
      if (await isPublishedActivity(row.activity_id)) return true;
    } else if (row.school_id) {
      if (await isPublicSchool(row.school_id)) return true;
    }
  }
  return false;
}

export async function isPublicMediaPath(path: string) {
  if (!isWellFormedMediaPath(path)) return false;
  if (path.startsWith("settings/")) return isSiteSettingsImage(path);
  const checks = await Promise.all([
    isPublicSchoolImage(path),
    isPublishedActivityCover(path),
    isPublicMediaAsset(path),
  ]);
  return checks.some(Boolean);
}
