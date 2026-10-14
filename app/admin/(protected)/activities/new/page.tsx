import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { writeAdminLog } from "@/lib/log";

// 기본정보를 먼저 저장해야만 사진을 올릴 수 있었던 불편함을 없애기 위해,
// "새 활동 등록"을 누르면 임시(초안) 활동을 바로 만들고, 기본정보 입력 +
// 사진 업로드 + 대표사진 선택을 한 화면에서 이어서 할 수 있게 합니다.
export default async function NewSchoolActivityPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("activities")
    .insert({
      activity_type: "school",
      activity_category: "school",
      title: "제목 미정",
      status: "draft",
      created_by: `${session.editorName} / ${session.editorOrg}`,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("활동을 새로 만들지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  await writeAdminLog({
    session,
    targetType: "activity",
    targetId: data.id,
    targetLabel: "제목 미정",
    action: "created",
    detail: "새 활동 임시 생성",
  });

  redirect(`/admin/activities/${data.id}`);
}
