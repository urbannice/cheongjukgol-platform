"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function TrashRow({
  id,
  label,
  restoreAction,
  deleteAction,
}: {
  id: string;
  label: string;
  restoreAction: (id: string) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="card bg-[var(--color-bg)] p-3 flex items-center justify-between gap-3">
      <span className="text-sm truncate">{label}</span>
      <div className="flex gap-2 flex-shrink-0">
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await restoreAction(id); router.refresh(); })}
          className="text-xs btn-secondary py-1.5 px-3"
        >
          복구
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("영구삭제하면 되돌릴 수 없습니다. 정말 삭제할까요?")) {
              startTransition(async () => { await deleteAction(id); router.refresh(); });
            }
          }}
          className="text-xs text-red-600"
        >
          영구삭제
        </button>
      </div>
    </div>
  );
}
