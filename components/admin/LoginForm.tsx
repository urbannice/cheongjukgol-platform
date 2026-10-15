"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

type State = { error?: string } | null;

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    return (await loginAction(formData)) ?? null;
  }, null);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">관리자번호</label>
        <input
          type="password"
          name="passcode"
          required
          className="w-full border border-[var(--color-border)] rounded-md px-3 py-2.5"
          inputMode="numeric"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">수정자 이름</label>
        <input
          type="text"
          name="editorName"
          required
          placeholder="예: 홍길동"
          className="w-full border border-[var(--color-border)] rounded-md px-3 py-2.5"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">소속</label>
        <input
          type="text"
          name="editorOrg"
          required
          placeholder="예: 늘푸름수북마을학교 또는 담양마을학교 연합회"
          className="w-full border border-[var(--color-border)] rounded-md px-3 py-2.5"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "확인 중..." : "로그인"}
      </button>
    </form>
  );
}
