import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin/dashboard");

  return (
    <div className="container-page py-20 max-w-sm">
      <h1 className="text-xl font-bold">공동 관리자 로그인</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        관리자번호를 알고 계신 관계자분은 누구든 접속하실 수 있습니다.
      </p>
      <LoginForm />
    </div>
  );
}
