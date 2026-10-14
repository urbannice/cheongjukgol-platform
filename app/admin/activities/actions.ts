"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { writeAdminLog } from "@/lib/log";
import { deleteStorageObjects } from "@/lib/storage";
import type { ActivityCategory, ActivityType } from "@/lib/types";

function normalizeCategory(value: string | null, activityType: ActivityType | null): ActivityCategory {
  if (activityType === "school") return "school";
  return value === "network" ? "network" : "joint_program";
}

async function requireSession() {
  const session = await getAdminSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  return session;
}

function field(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createActivityAction(formData: FormData) {
  const session = await requireSession();
  const supabase = createAdminClient();

  const activityType = field(formData, "activity_type") as ActivityType | null;
  const title = field(formData, "title");
  const publish = formData.get("intent") === "publish";

  if (!title) return { error: "활동명을 입력해주세요." };
  if (activityType === "school" && !field(formData, "school_id")) {
    return { error: "학교를 선택해주세요." };
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({
      activity_type: activityType,
      activity_category: normalizeCategory(field(formData, "activity_category"), activityType),
      school_id: activityType === "school" ? field(formData, "school_id") : null,
      title,
      activity_date: field(formData, "activity_date"),
      description: field(formData, "description"),
      status: publish ? "published" : "draft",
      created_by: `${session.editorName} / ${session.editorOrg}`,
    })
    .select()
    .single();

  if (error) return { error: `저장 중 오류가 발생했습니다: ${error.message}` };

  if (activityType === "community") {
    const schoolIds = formData.getAll("participating_schools") as string[];
    if (schoolIds.length > 0) {
      await supabase
        .from("activity_schools")
        .insert(schoolIds.map((school_id) => ({ activity_id: data.id, school_id })));
    }
  }

  await writeAdminLog({
    session,
    targetType: activityType === "community" ? "community_activity" : "activity",
    targetId: data.id,
    targetLabel: title,
    action: "created",
    detail: publish ? "활동 등록 및 공개" : "활동 임시저장",
  });

  revalidatePath("/admin/activities");
  revalidatePath("/admin/community");
  revalidatePath("/activities");
  revalidatePath("/community");
  revalidatePath("/");
  redirect(`/admin/activities/${data.id}`);
}

export async function updateActivityAction(activityId: string, formData: FormData) {
  const session = await requireSession();
  const supabase = createAdminClient();

  const title = field(formData, "title");
  if (!title) return { error: "활동명을 입력해주세요." };

  const { data: existing } = await supabase
    .from("activities")
    .select("activity_type, status")
    .eq("id", activityId)
    .single();

  const intent = formData.get("intent");
  let status = existing?.status ?? "draft";
  if (intent === "publish") status = "published";
  if (intent === "unpublish") status = "archived";
  if (intent === "save_draft" && existing?.status === "draft") status = "draft";

  if (intent === "publish" && existing?.activity_type === "school" && !field(formData, "school_id")) {
    return { error: "공개하려면 학교를 선택해주세요." };
  }

  const updates: Record<string, unknown> = {
    title,
    activity_date: field(formData, "activity_date"),
    description: field(formData, "description"),
    status,
    updated_at: new Date().toISOString(),
  };
  if (existing?.activity_type === "school") {
    updates.school_id = field(formData, "school_id");
    updates.activity_category = "school";
  } else {
    updates.activity_category = normalizeCategory(
      field(formData, "activity_category"),
      (existing?.activity_type as ActivityType) ?? null
    );
  }

  const { error } = await supabase.from("activities").update(updates).eq("id", activityId);
  if (error) return { error: `저장 중 오류가 발생했습니다: ${error.message}` };

  if (existing?.activity_type === "community") {
    const schoolIds = formData.getAll("participating_schools") as string[];
    await supabase.from("activity_schools").delete().eq("activity_id", activityId);
    if (schoolIds.length > 0) {
      await supabase
        .from("activity_schools")
        .insert(schoolIds.map((school_id) => ({ activity_id: activityId, school_id })));
    }
  }

  await writeAdminLog({
    session,
    targetType: existing?.activity_type === "community" ? "community_activity" : "activity",
    targetId: activityId,
    targetLabel: title,
    action: "updated",
    detail:
      intent === "publish" ? "공개로 전환" : intent === "unpublish" ? "공개 중지(보관)" : "정보 수정",
  });

  revalidatePath("/admin/activities");
  revalidatePath("/admin/community");
  revalidatePath(`/admin/activities/${activityId}`);
  revalidatePath("/activities");
  revalidatePath("/community");
  revalidatePath("/");
  return { success: true };
}

// "자료 관리"에 이미 올려둔 사진 중 하나를 대표 사진으로 지정합니다.
// 대표 사진은 별도 파일이 아니라 자료 목록의 사진 파일을 그대로 가리키므로,
// 이전 대표 사진이 지금도 자료 목록(다른 사진)으로 쓰이고 있다면 절대 파일을 지우지 않습니다.
// (예전 방식으로 대표 이미지만 따로 올렸던 경우에만, 더 이상 안 쓰이는 그 파일을 정리합니다.)
export async function setActivityCoverAction(activityId: string, filePath: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("activities")
    .select("cover_image")
    .eq("id", activityId)
    .single();

  const { error } = await supabase
    .from("activities")
    .update({ cover_image: filePath })
    .eq("id", activityId);

  if (!error && existing?.cover_image && existing.cover_image !== filePath) {
    const { data: stillUsed } = await supabase
      .from("media_assets")
      .select("id")
      .eq("file_url", existing.cover_image)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (!stillUsed) {
      await deleteStorageObjects([existing.cover_image]);
    }
  }

  await writeAdminLog({
    session,
    targetType: "activity",
    targetId: activityId,
    action: "updated",
    detail: "대표 사진 변경",
  });
  revalidatePath(`/admin/activities/${activityId}`);
  revalidatePath("/activities");
  revalidatePath("/community");
  revalidatePath("/");
}

export async function softDeleteActivityAction(activityId: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("activities").select("title").eq("id", activityId).single();
  await supabase.from("activities").update({ deleted_at: new Date().toISOString() }).eq("id", activityId);
  await writeAdminLog({
    session,
    targetType: "activity",
    targetId: activityId,
    targetLabel: data?.title ?? null,
    action: "deleted",
    detail: "휴지통으로 이동",
  });
  revalidatePath("/admin/activities");
  revalidatePath("/admin/community");
  revalidatePath("/activities");
  revalidatePath("/community");
  revalidatePath("/");
}

export async function restoreActivityAction(activityId: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase.from("activities").select("title").eq("id", activityId).single();
  await supabase.from("activities").update({ deleted_at: null }).eq("id", activityId);
  await writeAdminLog({
    session,
    targetType: "activity",
    targetId: activityId,
    targetLabel: data?.title ?? null,
    action: "restored",
    detail: "휴지통에서 복구",
  });
  revalidatePath("/admin/trash");
}

export async function permanentlyDeleteActivityAction(activityId: string) {
  const session = await requireSession();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("activities")
    .select("title, cover_image")
    .eq("id", activityId)
    .single();

  // 활동에 딸린 사진/영상/문서(media_assets)도 함께 정리합니다 — 그냥 두면
  // DB에는 없는데 Storage에만 파일이 남는 "고아 파일"이 계속 쌓이게 됩니다.
  const { data: mediaRows } = await supabase
    .from("media_assets")
    .select("id, file_url, thumbnail_url")
    .eq("activity_id", activityId);
  await deleteStorageObjects([
    data?.cover_image,
    ...((mediaRows ?? []).flatMap((m) => [m.file_url, m.thumbnail_url])),
  ]);
  if (mediaRows && mediaRows.length > 0) {
    await supabase
      .from("media_assets")
      .delete()
      .in("id", mediaRows.map((m) => m.id));
  }
  await supabase.from("activity_schools").delete().eq("activity_id", activityId);

  await supabase.from("activities").delete().eq("id", activityId);
  await writeAdminLog({
    session,
    targetType: "activity",
    targetId: activityId,
    targetLabel: data?.title ?? null,
    action: "permanently_deleted",
    detail: "영구 삭제",
  });
  revalidatePath("/admin/trash");
}
