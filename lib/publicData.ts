import "server-only";
import { createPublicClient } from "@/lib/supabase/publicClient";
import { mediaUrlMap } from "@/lib/mediaUrl";
import type { Activity, ActivityCategory, MediaAsset, School, SchoolContactLink } from "@/lib/types";

async function withSignedUrl<
  T extends {
    hero_image: string | null;
    representative_photo?: string | null;
    activist_photo?: string | null;
    contact_image?: string | null;
  }
>(rows: T[]) {
  const allPaths = rows.flatMap((r) =>
    [r.hero_image, r.representative_photo, r.activist_photo, r.contact_image].filter(
      (p): p is string => !!p
    )
  );
  const signed = allPaths.length ? mediaUrlMap(allPaths) : {};
  return rows.map((r) => ({
    ...r,
    hero_image_url: r.hero_image ? signed[r.hero_image] ?? null : null,
    representative_photo_url: r.representative_photo ? signed[r.representative_photo] ?? null : null,
    activist_photo_url: r.activist_photo ? signed[r.activist_photo] ?? null : null,
    contact_image_url: r.contact_image ? signed[r.contact_image] ?? null : null,
    // 연락처 페이지 전용 이미지: 관리자가 별도로 올린 이미지 > 대표자 사진 > 학교 대표이미지 순으로 사용합니다.
    // (프로그램 활동 대표사진은 일부러 fallback에서 제외합니다)
    contact_display_image_url:
      (r.contact_image ? signed[r.contact_image] : null) ??
      (r.representative_photo ? signed[r.representative_photo] : null) ??
      (r.hero_image ? signed[r.hero_image] : null) ??
      null,
  }));
}

// 공개 상태인 마을학교의 연락처 링크(인스타그램/블로그 등)를 한 번에 가져옵니다.
export async function getVisibleContactLinksBySchoolIds(schoolIds: string[]) {
  if (schoolIds.length === 0) return {} as Record<string, SchoolContactLink[]>;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("school_contact_links")
    .select("*")
    .in("school_id", schoolIds)
    .eq("is_visible", true)
    .order("display_order", { ascending: true });
  const rows = (data ?? []) as SchoolContactLink[];
  const map: Record<string, SchoolContactLink[]> = {};
  for (const row of rows) {
    if (!map[row.school_id]) map[row.school_id] = [];
    map[row.school_id].push(row);
  }
  return map;
}

// "/contact" 페이지용: 공개 상태 마을학교 전체 + 연락처 정보를 한 번에 준비합니다.
export async function getContactDirectory() {
  const schools = await getVisibleSchools();
  const linksMap = await getVisibleContactLinksBySchoolIds(schools.map((s) => s.id));
  return schools.map((s) => ({ ...s, contactLinks: linksMap[s.id] ?? [] }));
}

export async function getActiveSchoolCount() {
  const supabase = createPublicClient();
  const { count } = await supabase
    .from("schools")
    .select("*", { count: "exact", head: true })
    .eq("is_visible", true)
    .is("deleted_at", null);
  return count ?? 0;
}

export async function getVisibleSchools() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("is_visible", true)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return withSignedUrl((data ?? []) as School[]);
}

export async function getSchoolBySlug(slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withUrl] = await withSignedUrl([data as School]);
  const linksMap = await getVisibleContactLinksBySchoolIds([withUrl.id]);
  return { ...withUrl, contactLinks: linksMap[withUrl.id] ?? [] };
}

// 예전 slug로 접속했을 때, 현재 slug를 찾아 QR 주소가 깨지지 않도록 합니다.
export async function findCurrentSlugFromHistory(oldSlug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("slug_history")
    .select("school_id")
    .eq("old_slug", oldSlug)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { data: school } = await supabase
    .from("schools")
    .select("slug")
    .eq("id", data.school_id)
    .maybeSingle();
  return school?.slug ?? null;
}

export async function getPublishedActivities(params: {
  type?: "school" | "community";
  category?: ActivityCategory | ActivityCategory[];
  schoolId?: string;
  year?: string;
  limit?: number;
  // 여러 마을학교의 활동을 한꺼번에 모아 보여주는 화면(홈 최근소식, 전체활동)은 "방금 새로 올라온 소식"이
  // 기준이라 등록순(created_at)이 맞고, 특정 학교 하나만의 활동 목록은 그 학교의 활동 이력이 기준이라
  // 실제 활동일자(activity_date)가 맞습니다. 학교가 지난 활동을 뒤늦게 올려도 "새 소식"으로 보이도록,
  // 기본값은 activity_date이며 여러 학교를 모아 보여줄 때만 created_at을 명시적으로 지정합니다.
  orderBy?: "activity_date" | "created_at";
}) {
  const supabase = createPublicClient();
  let query = supabase
    .from("activities")
    .select("*, schools!activities_school_id_fkey(name, slug)")
    .eq("status", "published")
    .is("deleted_at", null);

  if (params.orderBy === "created_at") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("activity_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  if (params.type) query = query.eq("activity_type", params.type);
  if (params.category) {
    query = Array.isArray(params.category)
      ? query.in("activity_category", params.category)
      : query.eq("activity_category", params.category);
  }
  if (params.schoolId) query = query.eq("school_id", params.schoolId);
  if (params.year) {
    query = query.gte("activity_date", `${params.year}-01-01`).lte("activity_date", `${params.year}-12-31`);
  }
  if (params.limit) query = query.limit(params.limit);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as (Activity & { schools: { name: string; slug: string } | null })[];
  const paths = rows.map((r) => r.cover_image).filter((p): p is string => !!p);
  const signed = paths.length ? mediaUrlMap(paths) : {};
  return rows.map((r) => ({
    ...r,
    cover_image_url: r.cover_image ? signed[r.cover_image] ?? null : null,
  }));
}

export async function getActivityById(id: string) {
  const supabase = createPublicClient();
  const { data: activity, error } = await supabase
    .from("activities")
    .select("*, schools!activities_school_id_fkey(name, slug)")
    .eq("id", id)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!activity) return null;

  const { data: media } = await supabase
    .from("media_assets")
    .select("*")
    .eq("activity_id", id)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  const mediaRows = (media ?? []) as MediaAsset[];
  const activityRow = activity as Activity & { schools: { name: string; slug: string } | null };
  const paths = mediaRows
    .flatMap((m) => [m.file_url, m.thumbnail_url])
    .concat(activityRow.cover_image ? [activityRow.cover_image] : [])
    .filter((p): p is string => !!p);
  const signed = paths.length ? mediaUrlMap(paths) : {};

  const { data: participatingSchools } = await supabase
    .from("activity_schools")
    .select("schools(id, name, slug)")
    .eq("activity_id", id);

  return {
    activity: activityRow,
    // 대표 사진은 자료관리 사진 목록 중 하나를 가리키는 값이라, 목록의 첫 번째 사진이 아니라
    // 실제로 지정된 그 사진의 주소를 그대로 보여줘야 합니다.
    coverImageUrl: activityRow.cover_image ? signed[activityRow.cover_image] ?? null : null,
    media: mediaRows.map((m) => ({
      ...m,
      url: m.file_url ? signed[m.file_url] ?? null : m.external_url,
      // 목록/그리드에서는 이 가벼운 썸네일을 우선 쓰고, 없으면 원본 최적화 이미지로 대신합니다.
      thumbUrl: m.thumbnail_url ? signed[m.thumbnail_url] ?? null : m.file_url ? signed[m.file_url] ?? null : m.external_url,
    })),
    participatingSchools: (participatingSchools ?? [])
      .map((r: any) => r.schools)
      .filter(Boolean),
  };
}

export async function getSchoolActivities(schoolId: string, limit = 12, year?: string) {
  return getPublishedActivities({ type: "school", schoolId, limit, year });
}

// 새 연도의 활동이 등록되면 코드 수정 없이 자동으로 필터 목록에 나타나도록,
// activity_date에서 연도만 뽑아 목록으로 만듭니다. (최신 연도가 먼저 오도록 정렬)
export async function getActivityYears(params: {
  type?: "school" | "community";
  category?: ActivityCategory | ActivityCategory[];
  schoolId?: string;
}) {
  const supabase = createPublicClient();
  let query = supabase
    .from("activities")
    .select("activity_date")
    .eq("status", "published")
    .is("deleted_at", null)
    .not("activity_date", "is", null);

  if (params.type) query = query.eq("activity_type", params.type);
  if (params.category) {
    query = Array.isArray(params.category)
      ? query.in("activity_category", params.category)
      : query.eq("activity_category", params.category);
  }
  if (params.schoolId) query = query.eq("school_id", params.schoolId);

  const { data } = await query;
  const years = new Set<string>();
  for (const row of (data ?? []) as { activity_date: string | null }[]) {
    const y = row.activity_date?.slice(0, 4);
    if (y) years.add(y);
  }
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export async function getSchoolMedia(schoolId: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("media_assets")
    .select("*")
    .eq("school_id", schoolId)
    .is("activity_id", null)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("display_order", { ascending: true });
  const rows = (data ?? []) as MediaAsset[];
  const paths = rows.flatMap((r) => [r.file_url, r.thumbnail_url]).filter((p): p is string => !!p);
  const signed = paths.length ? mediaUrlMap(paths) : {};
  return rows.map((r) => ({
    ...r,
    url: r.file_url ? signed[r.file_url] ?? null : r.external_url,
    thumbUrl: r.thumbnail_url ? signed[r.thumbnail_url] ?? null : r.file_url ? signed[r.file_url] ?? null : r.external_url,
  }));
}
