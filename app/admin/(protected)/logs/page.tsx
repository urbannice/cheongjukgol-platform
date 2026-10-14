import { listAdminLogsPage } from "@/lib/adminData";
import AdminLogsView from "@/components/admin/AdminLogsView";

export default async function AdminLogsPage() {
  const { logs, nextCursor } = await listAdminLogsPage();

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">수정 기록</h1>
      {logs.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">수정 기록이 아직 없습니다.</p>
      ) : (
        <AdminLogsView initialLogs={logs} initialNextCursor={nextCursor} />
      )}
    </div>
  );
}
