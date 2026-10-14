"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ACTIVITY_CATEGORY_LABEL, type ActivityCategory } from "@/lib/types";

type ActivityRow = {
  id: string;
  title: string;
  status: string;
  activity_date: string | null;
  activity_category?: ActivityCategory;
  schools: { name: string } | null;
};

export default function ActivityListView({
  title,
  newHref,
  activities,
}: {
  title: string;
  newHref: string;
  activities: ActivityRow[];
}) {
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [school, setSchool] = useState("");

  // 기록이 쌓일수록 예전 활동을 찾기 쉽도록, 연도·활동유형·학교로 필터링합니다.
  // 새 연도/새 학교가 추가돼도 코드 수정 없이 목록에서 자동으로 뽑아옵니다.
  const years = useMemo(() => {
    const set = new Set<string>();
    for (const a of activities) {
      const y = a.activity_date?.slice(0, 4);
      if (y) set.add(y);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [activities]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of activities) {
      if (a.activity_category) set.add(a.activity_category);
    }
    return Array.from(set) as ActivityCategory[];
  }, [activities]);

  const schoolNames = useMemo(() => {
    const set = new Set<string>();
    for (const a of activities) {
      if (a.schools?.name) set.add(a.schools.name);
    }
    return Array.from(set).sort();
  }, [activities]);

  const filtered = activities.filter((a) => {
    if (year && a.activity_date?.slice(0, 4) !== year) return false;
    if (category && a.activity_category !== category) return false;
    if (school && a.schools?.name !== school) return false;
    return true;
  });

  const hasFilterOptions = years.length > 1 || categories.length > 1 || schoolNames.length > 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{title}</h1>
        <Link href={newHref} className="btn-primary">
          + 활동 추가
        </Link>
      </div>

      {hasFilterOptions && (
        <div className="flex flex-wrap gap-2 mb-5">
          {years.length > 1 && (
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm bg-[var(--color-bg)]"
            >
              <option value="">연도 전체</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          )}
          {categories.length > 1 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm bg-[var(--color-bg)]"
            >
              <option value="">활동유형 전체</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {ACTIVITY_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          )}
          {schoolNames.length > 1 && (
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm bg-[var(--color-bg)]"
            >
              <option value="">학교 전체</option>
              {schoolNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((a) => (
          <Link
            key={a.id}
            href={`/admin/activities/${a.id}`}
            className="card bg-[var(--color-bg)] p-4 flex items-center justify-between gap-4 block"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{a.title}</span>
                <StatusBadge status={a.status} />
                {a.activity_category && (
                  <span className="category-label">{ACTIVITY_CATEGORY_LABEL[a.activity_category]}</span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {a.schools?.name ?? "담양마을학교 연합회 연합활동"}
                {a.activity_date ? ` · ${a.activity_date}` : ""}
              </p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">
            {activities.length === 0 ? "등록된 활동이 없습니다." : "조건에 맞는 활동이 없습니다."}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = { draft: "임시저장", published: "공개중", archived: "보관됨" }[status] ?? status;
  const tone =
    status === "published"
      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)]"
      : "bg-[var(--color-surface)] text-[var(--color-text-muted)]";
  return <span className={`text-xs px-2 py-0.5 rounded-full ${tone}`}>{label}</span>;
}
