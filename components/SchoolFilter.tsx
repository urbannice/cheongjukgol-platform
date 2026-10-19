"use client";

import { useRouter } from "next/navigation";

export default function SchoolFilter({
  schools,
  selected,
  type,
  category,
  year,
}: {
  schools: { id: string; name: string }[];
  selected?: string;
  type?: string;
  category?: string;
  year?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        else if (type) params.set("type", type);
        if (year) params.set("year", year);
        if (e.target.value) params.set("school", e.target.value);
        router.push(`/activities?${params.toString()}`);
      }}
      className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm bg-[var(--color-bg)]"
    >
      <option value="">학교별 보기 (전체)</option>
      {schools.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
