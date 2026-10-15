import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import ToastHost from "@/components/admin/ToastHost";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-[var(--color-bg-warm)]">
      <div className="bg-[var(--color-text)] text-white">
        <div className="container-page flex items-center justify-between h-14 text-sm">
          <div className="flex items-center gap-4 overflow-x-auto">
            <Link href="/admin/dashboard" className="font-semibold whitespace-nowrap">
              관리자
            </Link>
            <Link href="/admin/schools" className="whitespace-nowrap opacity-80 hover:opacity-100">
              마을학교
            </Link>
            <Link href="/admin/activities" className="whitespace-nowrap opacity-80 hover:opacity-100">
              마을학교 활동
            </Link>
            <Link href="/admin/community" className="whitespace-nowrap opacity-80 hover:opacity-100">
              연합활동
            </Link>
            <Link href="/admin/site-settings" className="whitespace-nowrap opacity-80 hover:opacity-100">
              사이트 설정
            </Link>
            <Link href="/admin/logs" className="whitespace-nowrap opacity-80 hover:opacity-100">
              수정기록
            </Link>
            <Link href="/admin/trash" className="whitespace-nowrap opacity-80 hover:opacity-100">
              휴지통
            </Link>
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap pl-3">
            <span className="opacity-80 hidden sm:inline">
              {session?.editorName} · {session?.editorOrg}
            </span>
            <form action={logoutAction}>
              <button type="submit" className="opacity-80 hover:opacity-100">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="container-page py-8">{children}</div>
      <ToastHost />
    </div>
  );
}
