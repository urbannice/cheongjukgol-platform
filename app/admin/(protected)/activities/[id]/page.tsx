import { notFound } from "next/navigation";
import { getActivityByIdAdmin, listAllSchools } from "@/lib/adminData";
import ActivityBasicForm, { ACTIVITY_FORM_ID } from "@/components/admin/ActivityBasicForm";
import ActivityFormButtons from "@/components/admin/ActivityFormButtons";
import MediaManager from "@/components/admin/MediaManager";
import { updateActivityAction, softDeleteActivityAction } from "@/app/admin/activities/actions";
import DeleteActivityButton from "@/components/admin/DeleteActivityButton";

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getActivityByIdAdmin(id);
  if (!result) notFound();
  const { activity, media, participatingSchoolIds } = result;

  const schools = await listAllSchools();
  const boundAction = updateActivityAction.bind(null, id);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {activity.activity_type === "community" ? "연합활동 수정" : "마을학교 활동 수정"}
        </h1>
        <DeleteActivityButton activityId={id} action={softDeleteActivityAction} />
      </div>

      <ActivityBasicForm
        activity={activity}
        activityType={activity.activity_type}
        schools={schools}
        participatingSchoolIds={participatingSchoolIds}
        action={boundAction}
      />

      <div>
        <p className="text-sm font-medium mb-2">자료 관리</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">
          사진을 올린 뒤 목록에서 하나를 골라 대표 사진으로 지정해주세요. (사진을 한 장만 올리면
          자동으로 대표 사진이 됩니다.) 대표 사진을 따로 올릴 필요는 없습니다.
        </p>
        <MediaManager activityId={id} initialMedia={media as any} initialCoverPath={activity.cover_image} />
      </div>

      <div className="card bg-[var(--color-bg)] p-5">
        <p className="text-sm font-medium mb-3">사진·자료까지 다 올리셨나요?</p>
        <ActivityFormButtons status={activity.status} formId={ACTIVITY_FORM_ID} />
      </div>
    </div>
  );
}
