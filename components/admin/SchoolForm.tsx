"use client";

import { useEffect, useActionState, useState } from "react";
import { showToast } from "@/lib/toast";
import type { School, SchoolContactLink, SchoolContactLinkType } from "@/lib/types";
import { SCHOOL_CONTACT_LINK_LABEL } from "@/lib/types";

type State = { error?: string; success?: boolean } | null;

type LinkRow = {
  link_type: SchoolContactLinkType;
  label: string;
  url: string;
  is_visible: boolean;
};

export default function SchoolForm({
  school,
  contactLinks = [],
  action,
}: {
  school?: School;
  contactLinks?: SchoolContactLink[];
  action: (formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    return (await action(formData)) ?? null;
  }, null);

  useEffect(() => {
    if (state?.success) showToast();
  }, [state]);

  const [links, setLinks] = useState<LinkRow[]>(
    contactLinks.length
      ? contactLinks.map((l) => ({
          link_type: l.link_type,
          label: l.label ?? "",
          url: l.url,
          is_visible: l.is_visible,
        }))
      : []
  );

  function updateLink(idx: number, patch: Partial<LinkRow>) {
    setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLink(idx: number) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={formAction} className="space-y-8 max-w-2xl">
      <input type="hidden" name="contact_links" value={JSON.stringify(links)} />

      <Section title="기본정보">
        <Field label="학교명 *">
          <input name="name" defaultValue={school?.name} required className="input" />
        </Field>
        <Field
          label={school ? "URL 주소 (slug)" : "URL 주소 (slug, 비워두면 자동 생성)"}
          hint={
            school
              ? "변경하면 예전 QR 주소는 새 주소로 자동 연결됩니다. 꼭 필요할 때만 바꿔주세요."
              : "영문 소문자·숫자·하이픈만 사용 (예: neulpureum)"
          }
        >
          <input
            name="slug"
            defaultValue={school?.slug}
            placeholder="neulpureum"
            className="input"
            pattern="[a-z0-9-]+"
          />
        </Field>
        <Field label="한 줄 소개">
          <input name="short_description" defaultValue={school?.short_description ?? ""} className="input" />
        </Field>
        <Field label="마을학교 소개">
          <textarea name="description" defaultValue={school?.description ?? ""} rows={5} className="input" />
        </Field>
        <Field label="활동지역">
          <input name="area" defaultValue={school?.area ?? ""} className="input" placeholder="예: 수북면" />
        </Field>
        <Field label="마을학교 운영장소" hint="건물명이나 장소 이름 (예: 수북마을회관)">
          <input name="location_name" defaultValue={school?.location_name ?? ""} className="input" />
        </Field>
        <Field label="주소">
          <input name="address" defaultValue={school?.address ?? ""} className="input" />
        </Field>
        {school && (
          <Field label="주소 공개범위">
            <select name="address_visibility" defaultValue={school.address_visibility} className="input">
              <option value="full">전체 주소 공개</option>
              <option value="area_only">활동지역만 공개</option>
              <option value="hidden">비공개</option>
            </select>
          </Field>
        )}
      </Section>

      <Section title="대표자" hint="마을학교마다 대표자 1명의 정보를 소개합니다.">
        <Field label="대표자명">
          <input name="representative_name" defaultValue={school?.representative_name ?? ""} className="input" />
        </Field>
        <Field label="대표자 소개" hint="여러 줄로 자유롭게 작성할 수 있습니다.">
          <textarea
            name="representative_bio"
            defaultValue={school?.representative_bio ?? ""}
            rows={4}
            className="input"
          />
        </Field>
        {school && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="show_representative_name" defaultChecked={school.show_representative_name} />
            대표자명 공개
          </label>
        )}
        <p className="text-xs text-[var(--color-text-muted)]">
          대표자 사진은 이 페이지 위쪽의 &quot;대표자 사진&quot; 항목에서 올릴 수 있습니다.
        </p>
      </Section>

      <Section
        title="연락처"
        hint="마을학교 연락처 페이지에 표시되는 대표 이미지는 이 페이지 위쪽의 &quot;연락처 페이지 대표이미지&quot; 항목에서 올릴 수 있습니다."
      >
        <Field label="전화번호">
          <input name="phone" defaultValue={school?.phone ?? ""} className="input" placeholder="010-0000-0000" />
        </Field>
        <Field label="이메일">
          <input name="email" type="email" defaultValue={school?.email ?? ""} className="input" />
        </Field>
        {school && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="show_phone" defaultChecked={school.show_phone} />
              전화번호 공개
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="show_email" defaultChecked={school.show_email} />
              이메일 공개
            </label>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">SNS / 외부링크</p>
          <div className="space-y-3">
            {links.map((link, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 bg-[var(--color-surface)]/40 p-2 rounded-md">
                <select
                  value={link.link_type}
                  onChange={(e) => updateLink(idx, { link_type: e.target.value as SchoolContactLinkType })}
                  className="input w-auto text-sm"
                >
                  {Object.entries(SCHOOL_CONTACT_LINK_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(idx, { url: e.target.value })}
                  placeholder="https://..."
                  className="input flex-1 min-w-[160px] text-sm"
                />
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={link.is_visible}
                    onChange={(e) => updateLink(idx, { is_visible: e.target.checked })}
                  />
                  공개
                </label>
                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  className="text-xs text-red-600 whitespace-nowrap"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setLinks((prev) => [...prev, { link_type: "instagram", label: "", url: "", is_visible: true }])
            }
            className="btn-secondary text-sm mt-3"
          >
            + 링크 추가
          </button>
        </div>
      </Section>

      <Section title="프로그램">
        <Field label="대표 프로그램">
          <input name="program_name" defaultValue={school?.program_name ?? ""} className="input" />
        </Field>
        <Field label="프로그램 내용">
          <textarea name="program_description" defaultValue={school?.program_description ?? ""} rows={3} className="input" />
        </Field>
        <Field label="운영시간" hint="예: 매주 토요일 10:00~12:00 / 월 2회 / 방학 집중운영 등 자유롭게 입력">
          <input name="program_schedule" defaultValue={school?.program_schedule ?? ""} className="input" />
        </Field>
        <Field label="주요 활동 대상">
          <input name="target_group" defaultValue={school?.target_group ?? ""} className="input" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="has_activists" defaultChecked={school?.has_activists ?? false} />
          마을활동가와 함께 운영
        </label>
        <p className="text-xs text-[var(--color-text-muted)]">
          켜두면 방문자 페이지 프로그램 영역에 &quot;마을활동가분들과 함께 만들어가고 있습니다&quot;라는 문구가
          함께 표시됩니다. 개별 이름이나 프로필은 관리하지 않습니다. 프로그램 활동 대표사진은 이 페이지
          위쪽에서 올릴 수 있습니다.
        </p>
      </Section>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">저장이 완료되었습니다.</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "저장 중..." : "저장하기"}
      </button>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card bg-[var(--color-bg)] p-5">
      <p className="font-semibold mb-1">{title}</p>
      {hint && <p className="text-xs text-[var(--color-text-muted)] mb-3">{hint}</p>}
      <div className="space-y-4 mt-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}
