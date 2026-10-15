"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { deleteStorageObject } from "@/lib/storage";
import { writeAdminLog } from "@/lib/log";
import { defaultVisibilityFor } from "@/lib/mediaVisibility";
import type { MediaCategory, MediaType, MediaVisibility } from "@/lib/types";

async function requireSession() {
  const session = await getAdminSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  return session;
}

export async function addMediaAssetAction(input: {
  activityId?: string | null;
  schoolId?: string | null;
  mediaType: MediaType;
  category?: MediaCategory | null;
  title?: string | null;
  description?: string | null;
  filePath?: string | null;
  thumbnailPath?: string | null;
  externalUrl?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  visibility?: MediaVisibility;
}) {
  const session = await requireSession();
  const supabase = createAdminClient();

  let countQuery = supabase
    .from("media_assets")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);
  countQuery = input.activityId
    ? countQuery.eq("activity_id", input.activityId)
    : countQuery.eq("school_id", input.schoolId ?? "").is("activity_id", null);
  const { count } = await countQuery;

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      activity_id: input.activityId ?? null,
      school_id: input.schoolId ?? null,
      media_type: input.mediaType,
      category: input.category ?? null,
      title: input.title ?? null,
      description: input.description ?? null,
      file_url: input.filePath ?? null,
      thumbnail_url: input.thumbnailPath ?? null,
      external_url: input.externalUrl ?? null,
      original_file_name: input.originalFileName ?? null,
      mime_type: input.mimeType ?? null,
      file_size: input.fileSize ?? null,
      display_order: count ?? 0,
      visibility: input.visibility ?? defaultVisibilityFor(input.mediaType),
      created_by: `${session.editorName} / ${session.editorOrg}`,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await writeAdminLog({
    session,
    targetType: "media_asset",
    targetId: data.id,
    targetLabel: input.title ?? input.originalFileName ?? input.externalUrl ?? null,
    action: "created",
    detail: `${mediaTypeLabel(input.mediaType)} 자료 추가`,
  });

  if (input.activityId) revalidatePath(`/admin/activities/${input.activityId}`);
  if (input.schoolId) {
    revalidatePath(`/admin/schools/${input.schoolId}`);
    revalidatePath("/schools");
    revalidatePath("/schools/[slug]", "page");
  }
  revalidatePath("/activities");
  revalidatePath("/activities/[id]", "page");
  return data;
}

// 관리자가 갤러리 사진 순서를 바꿀 때, 한 번에 여러 장의 순서를 새로 지정합니다.
export async function reorderMediaAssetsAction(orderedIds: string[]) {
  const session = await requireSession();
  const supabase = createAdminClient();
  await Promise.all(
    orderedIds.map((id, idx) => supabase.from("media_assets").update({ display_order: idx }).eq("id", id))
  );
  await writeAdminLog({
    session,
    targetType: "media_asset",
    targetId: null,
    targetLabel: null,
    action: "reordered",
    detail: "사진 순서 변경",
  });
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/activities");
  revalidatePath("/activities/[id]", "page");
}

export async function updateMediaVisibilityAction(id: string, visibility: MediaVisibility) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("media_assets").select("activity_id, title").eq("id", id).single();
  await supabase.from("media_assets").update({ visibility }).eq("id", id);
  await writeAdminLog({
    session,
    targetType: "media_asset",
    targetId: id,
    targetLabel: data?.title ?? null,
    action: "visibility_changed",
    detail: visibility === "public" ? "공개로 전환" : "관리자 전용으로 전환",
  });
  if (data?.activity_id) revalidatePath(`/admin/activities/${data.activity_id}`);
  revalidatePath("/activities");
  revalidatePath("/activities/[id]", "page");
}

export async function softDeleteMediaAction(id: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("media_assets").select("activity_id, school_id, title").eq("id", id).single();
  await supabase.from("media_assets").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  await writeAdminLog({
    session,
    targetType: "media_asset",
    targetId: id,
    targetLabel: data?.title ?? null,
    action: "deleted",
    detail: "휴지통으로 이동",
  });
  if (data?.activity_id) revalidatePath(`/admin/activities/${data.activity_id}`);
  if (data?.school_id) {
    revalidatePath(`/admin/schools/${data.school_id}`);
    revalidatePath("/schools");
    revalidatePath("/schools/[slug]", "page");
  }
  revalidatePath("/activities");
  revalidatePath("/activities/[id]", "page");
}

export async function restoreMediaAction(id: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("media_assets").select("title").eq("id", id).single();
  await supabase.from("media_assets").update({ deleted_at: null }).eq("id", id);
  await writeAdminLog({
    session,
    targetType: "media_asset",
    targetId: id,
    targetLabel: data?.title ?? null,
    action: "restored",
    detail: "휴지통에서 복구",
  });
  revalidatePath("/admin/trash");
}

export async function permanentlyDeleteMediaAction(id: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("media_assets")
    .select("file_url, thumbnail_url, title")
    .eq("id", id)
    .single();
  if (data?.file_url) await deleteStorageObject(data.file_url);
  if (data?.thumbnail_url) await deleteStorageObject(data.thumbnail_url);
  await supabase.from("media_assets").delete().eq("id", id);
  await writeAdminLog({
    session,
    targetType: "media_asset",
    targetId: id,
    targetLabel: data?.title ?? null,
    action: "permanently_deleted",
    detail: "영구 삭제",
  });
  revalidatePath("/admin/trash");
}

function mediaTypeLabel(t: MediaType) {
  return { image: "사진", video: "영상", document: "문서", external_video: "외부영상", external_link: "링크" }[t];
}
