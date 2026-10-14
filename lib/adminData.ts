import "server-only";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createSignedViewUrls } from "@/lib/storage";
import type { Activity, ActivityCategory, MediaAsset, School, SchoolContactLink } from "@/lib/types";

export async function listAllSchools(includeDeleted = false) {
  const supabase = createAdminClient();
  let query = supabase.from("schools").select("*").order("display_order", { ascending: true });
  if (!includeDeleted) query = query.is("deleted_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return data as School[];
}

export async function getSchoolByIdAdmin(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("schools").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as School | null;
}

export async function getSchoolContactLinksAdmin(schoolId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("school_contact_links")
    .select("*")
    .eq("school_id", schoolId)
    .order("display_order", { ascending: true });
  return (data ?? []) as SchoolContactLink[];
}

export async function listAllActivities(params: {
  type?: "school" | "community";
  category?: ActivityCategory;
  includeDeleted?: boolean;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("activities")
    .select("*, schools!activities_school_id_fkey(name, slug)")
    .order("created_at", { ascending: false });
  if (params.type) query = query.eq("activity_type", params.type);
  if (params.category) query = query.eq("activity_category", params.category);
  if (!params.includeDeleted) query = query.is("deleted_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return data as (Activity & { schools: { name: string; slug: string } | null })[];
}

export async function getActivityByIdAdmin(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("activities").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: media } = await supabase
    .from("media_assets")
    .select("*")
    .eq("activity_id", id)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  const { data: participating } = await supabase
    .from("activity_schools")
    .select("school_id")
    .eq("activity_id", id);

  const mediaRows = (media ?? []) as MediaAsset[];
  const paths = mediaRows.map((m) => m.file_url).filter((p): p is string => !!p);
  const signed = paths.length ? await createSignedViewUrls(paths) : {};

  return {
    activity: data as Activity,
    media: mediaRows.map((m) => ({ ...m, url: m.file_url ? signed[m.file_url] ?? null : m.external_url })),
    participatingSchoolIds: (participating ?? []).map((p) => p.school_id),
  };
}

export type AdminLogRow = {
  id: string;
  occurred_at: string;
  editor_name: string;
  editor_org: string;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  action: string;
  detail: string | null;
  // 아래는 admin_logs 테이블에 없는, 화면 표시/필터용으로 조회 시 덧붙이는 값입니다.
  school_name?: string | null;
};

export const ADMIN_LOG_PAGE_SIZE = 50;

// 수정기록 화면은 한 번에 전부 불러오지 않고, 최근 것부터 페이지 단위로 불러옵니다.
// before를 넘기면 그 시각보다 이전 기록을 이어서 가져옵니다("더보기").
export async function listAdminLogsPage(params: { before?: string; limit?: number } = {}) {
  const supabase = createAdminClient();
  const limit = params.limit ?? ADMIN_LOG_PAGE_SIZE;

  let query = supabase
    .from("admin_logs")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (params.before) query = query.lt("occurred_at", params.before);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as AdminLogRow[];

  // 마을학교 활동 기록은 로그 자체에 학교 이름이 남아있지 않아서(활동명만 기록),
  // 학교별 필터가 가능하도록 관련된 마을학교 이름을 별도로 찾아 붙여줍니다.
  const activityIds = Array.from(
    new Set(
      rows
        .filter((r) => r.target_type === "activity" && r.target_id)
        .map((r) => r.target_id as string)
    )
  );

  let schoolNameByActivityId: Record<string, string> = {};
  if (activityIds.length > 0) {
    const { data: acts } = await supabase
      .from("activities")
      .select("id, schools!activities_school_id_fkey(name)")
      .in("id", activityIds);
    for (const a of (acts ?? []) as any[]) {
      const schoolName = Array.isArray(a.schools) ? a.schools[0]?.name : a.schools?.name;
      if (schoolName) schoolNameByActivityId[a.id] = schoolName;
    }
  }

  const logs = rows.map((r) => ({
    ...r,
    school_name:
      r.target_type === "school"
        ? r.target_label ?? null
        : r.target_type === "activity" && r.target_id
        ? schoolNameByActivityId[r.target_id] ?? null
        : null,
  }));

  const nextCursor = rows.length === limit ? rows[rows.length - 1].occurred_at : null;
  return { logs, nextCursor };
}

export async function listTrashedSchools() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("schools")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  return (data ?? []) as School[];
}

export async function listTrashedActivities() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("activities")
    .select("*, schools!activities_school_id_fkey(name)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  return (data ?? []) as (Activity & { schools: { name: string } | null })[];
}

// 관리자 대시보드의 "저장공간 관리" 카드에 쓸 대략적인 사용량입니다.
// media_assets에 기록된 file_size(사진/영상/문서 실제 업로드분)만 합산하므로,
// 학교 대표사진·Hero 이미지처럼 file_size를 남기지 않는 일부 파일은 빠져 있어
// 실제 Supabase Storage 사용량과는 차이가 있을 수 있습니다(근사치).
export async function getStorageUsageSummary() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("media_assets")
    .select("media_type, file_size")
    .is("deleted_at", null)
    .not("file_size", "is", null);

  const rows = (data ?? []) as { media_type: MediaAsset["media_type"]; file_size: number }[];
  const totals = { image: 0, document: 0, video: 0, other: 0 };
  for (const r of rows) {
    if (r.media_type === "image") totals.image += r.file_size;
    else if (r.media_type === "document") totals.document += r.file_size;
    else if (r.media_type === "video") totals.video += r.file_size;
    else totals.other += r.file_size;
  }
  const total = totals.image + totals.document + totals.video + totals.other;
  return { ...totals, total };
}

export async function listTrashedMedia() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("media_assets")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  return (data ?? []) as MediaAsset[];
}
