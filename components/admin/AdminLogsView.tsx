"use client";

import { useMemo, useState } from "react";
import { loadMoreAdminLogsAction } from "@/app/admin/logs/actions";
import type { AdminLogRow } from "@/lib/adminData";

const ACTION_LABEL: Record<string, string> = {
  created: "등록",
  updated: "수정",
  deleted: "삭제(휴지통 이동)",
  restored: "복구",
  permanently_deleted: "영구삭제",
  made_visible: "공개 전환",
  made_hidden: "비공개 전환",
  status_changed: "상태 변경",
  reordered: "순서 변경",
  visibility_changed: "공개범위 변경",
};

// 관리자가 고르는 "수정유형" 필터는 세부 action을 등록/수정/삭제/복원 4가지로 묶어서 보여줍니다.
function actionGroup(action: string): "created" | "updated" | "deleted" | "restored" | "other" {
  if (action === "created") return "created";
  if (action === "deleted") return "deleted";
  if (action === "restored") return "restored";
  if (action === "permanently_deleted") return "deleted";
  if (
    ["updated", "made_visible", "made_hidden", "status_changed", "reordered", "visibility_changed"].includes(
      action
    )
  ) {
    return "updated";
  }
  return "other";
}

const ACTION_GROUP_LABEL: Record<string, string> = {
  created: "등록",
  updated: "수정",
  deleted: "삭제",
  restored: "복원",
};

function formatDateKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const PERIOD_OPTIONS = [
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
  { value: "all", label: "전체" },
];

export default function AdminLogsView({
  initialLogs,
  initialNextCursor,
}: {
  initialLogs: AdminLogRow[];
  initialNextCursor: string | null;
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const [period, setPeriod] = useState("30");
  const [school, setSchool] = useState("");
  const [actionType, setActionType] = useState("");
  const [admin, setAdmin] = useState("");

  const schoolOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) if (l.school_name) set.add(l.school_name);
    return Array.from(set).sort();
  }, [logs]);

  const adminOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) if (l.editor_name) set.add(l.editor_name);
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = period === "all" ? null : now - Number(period) * 24 * 60 * 60 * 1000;
    return logs.filter((l) => {
      if (cutoff !== null && new Date(l.occurred_at).getTime() < cutoff) return false;
      if (school && l.school_name !== school) return false;
      if (actionType && actionGroup(l.action) !== actionType) return false;
      if (admin && l.editor_name !== admin) return false;
      return true;
    });
  }, [logs, period, school, actionType, admin]);

  const groups = useMemo(() => {
    const map = new Map<string, AdminLogRow[]>();
    for (const l of filtered) {
      const key = formatDateKey(l.occurred_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return Array.from(map.entries());
  }, [filtered]);

  async function handleLoadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const { logs: more, nextCursor: newCursor } = await loadMoreAdminLogsAction(nextCursor);
      setLogs((prev) => [...prev, ...more]);
      setNextCursor(newCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm bg-[var(--color-bg)]"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {schoolOptions.length > 1 && (
          <select
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm bg-[var(--color-bg)]"
          >
            <option value="">학교 전체</option>
            {schoolOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm bg-[var(--color-bg)]"
        >
          <option value="">수정유형 전체</option>
          {Object.entries(ACTION_GROUP_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {adminOptions.length > 1 && (
          <select
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
            className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm bg-[var(--color-bg)]"
          >
            <option value="">관리자 전체</option>
            {adminOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-3">
        {groups.map(([dateKey, entries]) => (
          <details
            key={dateKey}
            open={isToday(entries[0].occurred_at)}
            className="card bg-[var(--color-bg)] p-4 group"
          >
            <summary className="cursor-pointer list-none flex items-center justify-between">
              <span className="font-semibold">{dateKey}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{entries.length}건</span>
            </summary>
            <div className="mt-3 space-y-2.5 border-t border-[var(--color-border)] pt-3">
              {entries.map((log) => (
                <div key={log.id} className="text-sm">
                  <p className="text-xs text-[var(--color-text-muted)]">{formatTime(log.occurred_at)}</p>
                  <p className="mt-0.5">
                    <span className="font-medium">
                      {log.editor_org} / {log.editor_name}
                    </span>{" "}
                    — {log.target_label ?? log.target_type}{" "}
                    <span className="text-[var(--color-accent-dark)]">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
                  </p>
                  {log.detail && (
                    <p className="text-[var(--color-text-muted)] mt-0.5">{log.detail}</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">조건에 맞는 수정 기록이 없습니다.</p>
        )}
      </div>

      {nextCursor && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="btn-secondary"
          >
            {loadingMore ? "불러오는 중..." : "이전 기록 더보기"}
          </button>
        </div>
      )}
    </div>
  );
}
