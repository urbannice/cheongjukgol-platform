import Link from "next/link";
import { getStorageUsageSummary } from "@/lib/adminData";

export const dynamic = "force-dynamic";

const MENU = [
  { href: "/admin/schools", title: "마을학교 관리", desc: "학교 추가·수정·공개관리·순서변경" },
  { href: "/admin/activities", title: "마을학교 활동 관리", desc: "개별 마을학교 활동 등록·수정" },
  { href: "/admin/community", title: "연합활동 관리", desc: "연합회 연합활동 등록·수정" },
  { href: "/admin/logs", title: "수정 기록", desc: "누가 언제 무엇을 수정했는지 확인" },
  { href: "/admin/trash", title: "휴지통", desc: "삭제한 학교·활동·자료 복구" },
];

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0MB";
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)}MB`;
  return `${(mb / 1024).toFixed(2)}GB`;
}

export default async function AdminDashboardPage() {
  const usage = await getStorageUsageSummary().catch(() => null);

  // 무료 Supabase 프로젝트 기준 1GB를 임시 기준선으로 사용해 대략적인 사용률을 보여줍니다.
  // (실제 요금제/한도와 다를 수 있어 화면에도 "근사치" 안내를 함께 표시합니다.)
  const BASELINE_BYTES = 1024 * 1024 * 1024;
  const percent = usage ? Math.min(100, Math.round((usage.total / BASELINE_BYTES) * 100)) : 0;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">관리자 대시보드</h1>

      <div className="card bg-[var(--color-bg)] p-5 mb-4">
        <p className="font-semibold">저장공간 관리</p>
        {usage ? (
          <>
            <div className="mt-3 h-2.5 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              사진·문서·영상 합계 약 {formatBytes(usage.total)} 사용 중 (약 {percent}%)
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[var(--color-text-muted)] text-xs">사진</p>
                <p className="font-semibold">{formatBytes(usage.image)}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)] text-xs">문서</p>
                <p className="font-semibold">{formatBytes(usage.document)}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)] text-xs">영상</p>
                <p className="font-semibold">{formatBytes(usage.video)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            저장공간 사용량을 불러오지 못했습니다.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className="card bg-[var(--color-bg)] p-5 block">
            <p className="font-semibold">{m.title}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
