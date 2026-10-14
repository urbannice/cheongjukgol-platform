"use client";

import { useTransition } from "react";
import {
  reorderSchoolAction,
  softDeleteSchoolAction,
  toggleSchoolVisibilityAction,
  updateSchoolStatusAction,
} from "@/app/admin/schools/actions";

export default function SchoolListActions({
  schoolId,
  isVisible,
  status,
  isFirst,
  isLast,
}: {
  schoolId: string;
  isVisible: boolean;
  status: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        disabled={isFirst || pending}
        onClick={() => startTransition(() => reorderSchoolAction(schoolId, "up"))}
        className="w-7 h-7 rounded-md border border-[var(--color-border)] disabled:opacity-30"
        title="위로"
      >
        ↑
      </button>
      <button
        disabled={isLast || pending}
        onClick={() => startTransition(() => reorderSchoolAction(schoolId, "down"))}
        className="w-7 h-7 rounded-md border border-[var(--color-border)] disabled:opacity-30"
        title="아래로"
      >
        ↓
      </button>
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => updateSchoolStatusAction(schoolId, e.target.value as any))
        }
        className="text-xs border border-[var(--color-border)] rounded-md px-2 py-1"
      >
        <option value="active">운영중</option>
        <option value="inactive">운영종료</option>
        <option value="archived">보관</option>
      </select>
      <button
        disabled={pending}
        onClick={() => startTransition(() => toggleSchoolVisibilityAction(schoolId, !isVisible))}
        className="text-xs btn-secondary py-1.5 px-3"
      >
        {isVisible ? "비공개로" : "공개로"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("이 학교를 휴지통으로 이동할까요? 활동 기록은 함께 보관되며 언제든 복구할 수 있습니다.")) {
            startTransition(() => softDeleteSchoolAction(schoolId));
          }
        }}
        className="text-xs text-red-600 px-2"
      >
        삭제
      </button>
    </div>
  );
}
