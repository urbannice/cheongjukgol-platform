"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DeleteActivityButton({
  activityId,
  action,
}: {
  activityId: string;
  action: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("이 활동을 휴지통으로 이동할까요? 언제든 복구할 수 있습니다.")) {
          startTransition(async () => {
            await action(activityId);
            router.push("/admin/activities");
          });
        }
      }}
      className="text-sm text-red-600"
    >
      활동 삭제
    </button>
  );
}
