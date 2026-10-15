"use client";

import { useEffect, useActionState, useState } from "react";
import { showToast } from "@/lib/toast";
import { ACTIVITY_CATEGORY_LABEL, type Activity, type ActivityCategory, type School } from "@/lib/types";

type State = { error?: string; success?: boolean } | null;

export const ACTIVITY_FORM_ID = "activity-basic-form";

export default function ActivityBasicForm({
  activity,
  activityType,
  schools,
  participatingSchoolIds = [],
  action,
}: {
  activity?: Activity;
  activityType: "school" | "community";
  schools: School[];
  participatingSchoolIds?: string[];
  action: (formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useActionState<State, FormData>(async (_prev, formData) => {
    // 이 폼 바깥(사진 업로드 아래쪽)에 있는 저장 버튼도 form="..." 속성으로 같은 폼에 연결돼 있어서,
    // 어느 버튼을 눌렀는지는 버튼 자체의 name="intent" 값으로 formData에 이미 담겨 옵니다.
    if (!formData.has("intent")) formData.set("intent", "save");
    return (await action(formData)) ?? null;
  }, null);

  useEffect(() => {
    if (state?.success) showToast();
  }, [state]);
  const [category, setCategory] = useState<ActivityCategory>(
    activity?.activity_category === "network" ? "network" : "joint_program"
  );

  const isPublished = activity?.status === "published";
  const isArchived = activity?.status === "archived";

  return (
    <form id={ACTIVITY_FORM_ID} action={formAction} className="card bg-[var(--color-bg)] p-5 space-y-4">
      <input type="hidden" name="activity_type" value={activityType} />

      {activityType === "community" && (
        <div>
          <label className="block text-sm font-medium mb-1">활동 구분 *</label>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">
            아이들과 함께하는 공동 프로그램인지, 대표자·관계자들이 진행하는 회의·연수인지 먼저
            선택해주세요.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm border border-[var(--color-border)] rounded-md px-3 py-2 cursor-pointer">
              <input
                type="radio"
                name="activity_category"
                value="joint_program"
                checked={category === "joint_program"}
                onChange={() => setCategory("joint_program")}
              />
              함께하는 공동활동 (아이들과 함께하는 연합 프로그램)
            </label>
            <label className="flex items-center gap-2 text-sm border border-[var(--color-border)] rounded-md px-3 py-2 cursor-pointer">
              <input
                type="radio"
                name="activity_category"
                value="network"
                checked={category === "network"}
                onChange={() => setCategory("network")}
              />
              {ACTIVITY_CATEGORY_LABEL.network} (대표자 연수·역량강화교육·워크숍·회의 등)
            </label>
          </div>
        </div>
      )}

      {activityType === "school" && (
        <div>
          <label className="block text-sm font-medium mb-1">마을학교 *</label>
          <select name="school_id" defaultValue={activity?.school_id ?? ""} required className="input">
            <option value="" disabled>
              학교를 선택해주세요
            </option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {activityType === "community" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            참여 마을학교 {category === "joint_program" ? "(여러 곳 선택 가능)" : "(선택사항)"}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-[var(--color-border)] rounded-md p-3 max-h-48 overflow-y-auto">
            {schools.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="participating_schools"
                  value={s.id}
                  defaultChecked={participatingSchoolIds.includes(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">활동명 *</label>
        <input name="title" defaultValue={activity?.title} required className="input" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">활동 날짜</label>
        <input type="date" name="activity_date" defaultValue={activity?.activity_date ?? ""} className="input" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">활동 소개</label>
        <textarea name="description" defaultValue={activity?.description ?? ""} rows={5} className="input" />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">저장이 완료되었습니다.</p>}

      {/* 저장/공개하기 버튼은 사진·자료까지 다 올린 뒤 누를 수 있도록 이 화면 맨 아래에만 둡니다. */}
      {activity && (
        <p className="text-xs text-[var(--color-text-muted)]">
          현재 상태: {isPublished ? "공개중" : isArchived ? "보관됨" : "임시저장"}
        </p>
      )}
    </form>
  );
}
