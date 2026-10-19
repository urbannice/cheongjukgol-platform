"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { writeAdminLog } from "@/lib/log";
import { deleteStorageObjects, replaceSingleFile } from "@/lib/storage";
import { isValidSlug, suggestSlug } from "@/lib/slug";

async function requireSession() {
  const session = await getAdminSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  return session;
}

function field(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createSchoolAction(formData: FormData) {
  const session = await requireSession();
  const supabase = createAdminClient();

  const name = field(formData, "name");
  if (!name) return { error: "학교명을 입력해주세요." };

  let slug = field(formData, "slug") ?? suggestSlug(name);
  if (!isValidSlug(slug)) {
    return { error: "URL 주소(slug)는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다." };
  }

  const { data, error } = await supabase
    .from("schools")
    .insert({
      name,
      slug,
      short_description: field(formData, "short_description"),
      description: field(formData, "description"),
      area: field(formData, "area"),
      location_name: field(formData, "location_name"),
      address: field(formData, "address"),
      representative_name: field(formData, "representative_name"),
      representative_bio: field(formData, "representative_bio"),
      phone: field(formData, "phone"),
      email: field(formData, "email"),
      target_group: field(formData, "target_group"),
      program_name: field(formData, "program_name"),
      program_description: field(formData, "program_description"),
      program_schedule: field(formData, "program_schedule"),
      has_activists: formData.get("has_activists") === "on",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 URL 주소입니다. 다른 값을 입력해주세요." };
    return { error: `저장 중 오류가 발생했습니다: ${error.message}` };
  }

  await writeAdminLog({
    session,
    targetType: "school",
    targetId: data.id,
    targetLabel: data.name,
    action: "created",
    detail: "새 마을학교 등록",
  });

  revalidatePath("/admin/schools");
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/contact");
  revalidatePath("/");
  redirect(`/admin/schools/${data.id}`);
}

export async function updateSchoolAction(schoolId: string, formData: FormData) {
  const session = await requireSession();
  const supabase = createAdminClient();

  const name = field(formData, "name");
  if (!name) return { error: "학교명을 입력해주세요." };

  const { data: before } = await supabase.from("schools").select("name, slug").eq("id", schoolId).single();

  const requestedSlug = field(formData, "slug");
  const updates: Record<string, unknown> = {
    name,
    short_description: field(formData, "short_description"),
    description: field(formData, "description"),
    area: field(formData, "area"),
    location_name: field(formData, "location_name"),
    address: field(formData, "address"),
    representative_name: field(formData, "representative_name"),
    representative_bio: field(formData, "representative_bio"),
    phone: field(formData, "phone"),
    email: field(formData, "email"),
    target_group: field(formData, "target_group"),
    program_name: field(formData, "program_name"),
    program_description: field(formData, "program_description"),
    program_schedule: field(formData, "program_schedule"),
    has_activists: formData.get("has_activists") === "on",
    show_representative_name: formData.get("show_representative_name") === "on",
    show_phone: formData.get("show_phone") === "on",
    show_email: formData.get("show_email") === "on",
    address_visibility: field(formData, "address_visibility") ?? "full",
    updated_at: new Date().toISOString(),
  };

  if (requestedSlug && before && requestedSlug !== before.slug) {
    if (!isValidSlug(requestedSlug)) {
      return { error: "URL 주소(slug)는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다." };
    }
    await supabase.from("slug_history").insert({ school_id: schoolId, old_slug: before.slug });
    updates.slug = requestedSlug;
  }

  const { error } = await supabase.from("schools").update(updates).eq("id", schoolId);
  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 URL 주소입니다." };
    return { error: `저장 중 오류가 발생했습니다: ${error.message}` };
  }

  // SNS / 외부링크는 화면에서 여러 개를 한 번에 관리하므로, 매번 통째로 다시 저장합니다.
  const linksRaw = formData.get("contact_links");
  if (typeof linksRaw === "string") {
    try {
      const links = JSON.parse(linksRaw) as {
        link_type: string;
        label: string | null;
        url: string;
        is_visible: boolean;
      }[];
      await supabase.from("school_contact_links").delete().eq("school_id", schoolId);
      const rows = links
        .filter((l) => l.url && l.url.trim() !== "")
        .map((l, idx) => ({
          school_id: schoolId,
          link_type: l.link_type || "other",
          label: l.label?.trim() || null,
          url: l.url.trim(),
          display_order: idx,
          is_visible: l.is_visible,
        }));
      if (rows.length > 0) {
        await supabase.from("school_contact_links").insert(rows);
      }
    } catch {
      // 링크 형식이 잘못된 경우, 나머지 정보 저장은 그대로 진행하고 링크만 건너뜁니다.
    }
  }

  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    targetLabel: name,
    action: "updated",
    detail: requestedSlug && before && requestedSlug !== before.slug ? "정보 수정 + URL 주소 변경" : "정보 수정",
  });

  revalidatePath("/admin/schools");
  revalidatePath(`/admin/schools/${schoolId}`);
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath(`/schools/${before?.slug}`);
  revalidatePath("/contact");
  revalidatePath("/");
  return { success: true };
}

export async function updateSchoolImageAction(
  schoolId: string,
  field: "representative_photo" | "activist_photo" | "contact_image",
  storagePath: string
) {
  if (field !== "representative_photo" && field !== "activist_photo" && field !== "contact_image") {
    throw new Error("잘못된 이미지 항목입니다.");
  }
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("schools").select(`name, ${field}`).eq("id", schoolId).single();
  const { error } = await supabase.from("schools").update({ [field]: storagePath }).eq("id", schoolId);
  if (!error) await replaceSingleFile((data as any)?.[field], storagePath);
  const labelMap = {
    representative_photo: "대표자 사진",
    activist_photo: "프로그램 활동 대표사진",
    contact_image: "연락처 페이지 대표이미지",
  } as const;
  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    targetLabel: data?.name ?? null,
    action: "updated",
    detail: `${labelMap[field]} 변경`,
  });
  revalidatePath(`/admin/schools/${schoolId}`);
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/contact");
}

export async function updateSchoolHeroImageAction(schoolId: string, storagePath: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("schools").select("name, hero_image").eq("id", schoolId).single();
  const { error } = await supabase.from("schools").update({ hero_image: storagePath }).eq("id", schoolId);
  if (!error) await replaceSingleFile(data?.hero_image, storagePath);
  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    targetLabel: data?.name ?? null,
    action: "updated",
    detail: "대표 이미지 변경",
  });
  revalidatePath(`/admin/schools/${schoolId}`);
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/contact");
  revalidatePath("/");
}

export async function toggleSchoolVisibilityAction(schoolId: string, isVisible: boolean) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("schools").select("name").eq("id", schoolId).single();
  await supabase.from("schools").update({ is_visible: isVisible }).eq("id", schoolId);
  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    targetLabel: data?.name ?? null,
    action: isVisible ? "made_visible" : "made_hidden",
    detail: isVisible ? "홈페이지 공개로 전환" : "홈페이지 비공개로 전환",
  });
  revalidatePath("/admin/schools");
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/contact");
  revalidatePath("/");
}

export async function updateSchoolStatusAction(schoolId: string, status: "active" | "inactive" | "archived") {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("schools").select("name").eq("id", schoolId).single();
  const updates: Record<string, unknown> = { status };
  if (status === "archived") updates.archived_at = new Date().toISOString();
  await supabase.from("schools").update(updates).eq("id", schoolId);
  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    targetLabel: data?.name ?? null,
    action: "status_changed",
    detail: `상태를 ${status}로 변경`,
  });
  revalidatePath("/admin/schools");
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/contact");
  revalidatePath("/");
}

export async function reorderSchoolAction(schoolId: string, direction: "up" | "down") {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data: all } = await supabase
    .from("schools")
    .select("id, display_order")
    .is("deleted_at", null)
    .order("display_order", { ascending: true });
  if (!all) return;

  const idx = all.findIndex((s) => s.id === schoolId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= all.length) return;

  const a = all[idx];
  const b = all[swapIdx];
  await supabase.from("schools").update({ display_order: b.display_order }).eq("id", a.id);
  await supabase.from("schools").update({ display_order: a.display_order }).eq("id", b.id);

  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    action: "reordered",
    detail: `노출 순서 ${direction === "up" ? "위로" : "아래로"} 이동`,
  });

  revalidatePath("/admin/schools");
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/contact");
  revalidatePath("/");
}

export async function softDeleteSchoolAction(schoolId: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("schools").select("name").eq("id", schoolId).single();
  await supabase
    .from("schools")
    .update({ deleted_at: new Date().toISOString(), is_visible: false })
    .eq("id", schoolId);
  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    targetLabel: data?.name ?? null,
    action: "deleted",
    detail: "휴지통으로 이동",
  });
  revalidatePath("/admin/schools");
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/contact");
  revalidatePath("/");
}

export async function restoreSchoolAction(schoolId: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("schools").select("name").eq("id", schoolId).single();
  await supabase.from("schools").update({ deleted_at: null }).eq("id", schoolId);
  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    targetLabel: data?.name ?? null,
    action: "restored",
    detail: "휴지통에서 복구",
  });
  revalidatePath("/admin/schools");
  revalidatePath("/admin/trash");
}

export async function permanentlyDeleteSchoolAction(schoolId: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("schools")
    .select("name, hero_image, representative_photo, activist_photo, contact_image")
    .eq("id", schoolId)
    .single();

  // 학교에 딸린 대표사진들 + 갤러리 사진(media_assets)까지 함께 정리해서
  // Storage에 고아 파일이 남지 않도록 합니다.
  const { data: mediaRows } = await supabase
    .from("media_assets")
    .select("id, file_url, thumbnail_url")
    .eq("school_id", schoolId);
  await deleteStorageObjects([
    data?.hero_image,
    data?.representative_photo,
    data?.activist_photo,
    data?.contact_image,
    ...((mediaRows ?? []).flatMap((m) => [m.file_url, m.thumbnail_url])),
  ]);
  if (mediaRows && mediaRows.length > 0) {
    await supabase
      .from("media_assets")
      .delete()
      .in("id", mediaRows.map((m) => m.id));
  }
  await supabase.from("school_contact_links").delete().eq("school_id", schoolId);
  await supabase.from("slug_history").delete().eq("school_id", schoolId);

  await supabase.from("schools").delete().eq("id", schoolId);
  await writeAdminLog({
    session,
    targetType: "school",
    targetId: schoolId,
    targetLabel: data?.name ?? null,
    action: "permanently_deleted",
    detail: "영구 삭제",
  });
  revalidatePath("/admin/trash");
}
