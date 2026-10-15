import Link from "next/link";
import { listAllSchools } from "@/lib/adminData";
import SchoolListActions from "@/components/admin/SchoolListActions";

export default async function AdminSchoolsPage() {
  const schools = await listAllSchools();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">마을학교 관리</h1>
        <Link href="/admin/schools/new" className="btn-primary">
          + 새 학교 추가
        </Link>
      </div>

      <div className="space-y-3">
        {schools.map((school, i) => (
          <div key={school.id} className="card bg-[var(--color-bg)] p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/admin/schools/${school.id}`} className="font-semibold hover:underline">
                  {school.name}
                </Link>
                <StatusBadge label={statusLabel(school.status)} />
                {!school.is_visible && <StatusBadge label="비공개" tone="muted" />}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">/schools/{school.slug}</p>
            </div>
            <SchoolListActions
              schoolId={school.id}
              isVisible={school.is_visible}
              status={school.status}
              isFirst={i === 0}
              isLast={i === schools.length - 1}
            />
          </div>
        ))}
        {schools.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">등록된 마을학교가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  return { active: "운영중", inactive: "운영종료", archived: "보관" }[status] ?? status;
}

function StatusBadge({ label, tone = "accent" }: { label: string; tone?: "accent" | "muted" }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${
        tone === "accent"
          ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)]"
          : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
      }`}
    >
      {label}
    </span>
  );
}
