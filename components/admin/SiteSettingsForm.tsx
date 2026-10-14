"use client";

import { useEffect, useActionState } from "react";
import { showToast } from "@/lib/toast";
import type { SiteSettings } from "@/lib/siteSettings";
import SiteSettingsImageUploader from "@/components/admin/SiteSettingsImageUploader";

type State = { error?: string; success?: boolean } | null;

type ImageUrls = {
  logoUrl: string | null;
  heroUrl: string | null;
  aboutUrl: string | null;
  aboutLogoUrl: string | null;
  communityUrl: string | null;
  orgLogoUrl: string | null;
  org2LogoUrl: string | null;
};

export default function SiteSettingsForm({
  settings,
  action,
  images,
}: {
  settings: SiteSettings | null;
  action: (formData: FormData) => Promise<State>;
  images: ImageUrls;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    return (await action(formData)) ?? null;
  }, null);

  useEffect(() => {
    if (state?.success) showToast();
  }, [state]);

  return (
    <form action={formAction} className="space-y-10 max-w-3xl">
      <Section title="연합회 정보" hint="사이트 곳곳(헤더, 푸터, 소개, 연합회 페이지)에서 공통으로 쓰이는 공식 명칭과 로고입니다.">
        <div className="max-w-md">
          <SiteSettingsImageUploader
            field="logo_image"
            label="연합회 로고 (헤더용, 선택)"
            hint="등록하면 상단 헤더의 연합회 이름 글자 대신 표시됩니다. 가로로 긴 이미지를 권장합니다. 담양교육지원청 로고와는 별도이니 섞어서 올리지 마세요."
            aspect="3/1"
            fit="contain"
            currentUrl={images.logoUrl}
            allowClear
          />
        </div>
        <Field label="공식명칭">
          <input name="association_name" defaultValue={settings?.association_name} className="input" />
        </Field>
        <Field label="슬로건">
          <input name="association_slogan" defaultValue={settings?.association_slogan} className="input" />
        </Field>
      </Section>

      <Section
        title="지원기관"
        hint="연합회를 지원하는 담양교육지원청·담양군 표기입니다. 공식 로고 원본 파일을 그대로 올려주세요(새로 그리거나 다른 로고와 합치지 않습니다). 헤더에는 노출하지 않고, 푸터와 소개 페이지에 연합회 로고와 구분되게 표시됩니다."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="max-w-xs">
            <SiteSettingsImageUploader
              field="org_logo_image"
              label="담양교육지원청 공식 로고"
              aspect="3/1"
              fit="contain"
              currentUrl={images.orgLogoUrl}
              allowClear
            />
          </div>
          <div className="max-w-xs">
            <SiteSettingsImageUploader
              field="org2_logo_image"
              label="담양군 공식 로고"
              aspect="3/1"
              fit="contain"
              currentUrl={images.org2LogoUrl}
              allowClear
            />
          </div>
        </div>
        <Field label="기관명">
          <input name="org_name" defaultValue={settings?.org_name} className="input" />
        </Field>
        <Field label="지원기관 표기문구" hint="예: 지원 · 담양교육지원청">
          <input name="org_support_text" defaultValue={settings?.org_support_text} className="input" />
        </Field>
        <Field label="두 번째 지원기관명" hint="예: 담양군">
          <input name="org2_name" defaultValue={settings?.org2_name} className="input" />
        </Field>
      </Section>

      <Section title="메인 화면 (Hero)" hint="홈페이지 맨 위에 가장 크게 보이는 영역입니다.">
        <div className="max-w-md">
          <SiteSettingsImageUploader
            field="hero_image"
            label="메인배너 이미지"
            hint="홈페이지 첫 화면에 크게 표시됩니다. 가로로 넓은 사진을 권장합니다."
            aspect="16/9"
            currentUrl={images.heroUrl}
            allowClear
          />
        </div>
        <Field label="메인 제목">
          <input name="hero_title" defaultValue={settings?.hero_title} className="input" />
        </Field>
        <Field label="메인 설명 문구">
          <textarea name="hero_description" defaultValue={settings?.hero_description} rows={3} className="input" />
        </Field>
        <Field label="버튼 문구">
          <input name="hero_cta_text" defaultValue={settings?.hero_cta_text} className="input" />
        </Field>
        <Field label="버튼 연결 주소" hint="예: /schools (마을학교 목록 페이지)">
          <input name="hero_cta_url" defaultValue={settings?.hero_cta_url} className="input" />
        </Field>
      </Section>

      <Section title="소개 페이지" hint="홈페이지 요약 카드와 /about 소개 페이지에 쓰이는 사진과 문구입니다.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SiteSettingsImageUploader
            field="about_logo_image"
            label="소개페이지 타이틀 로고"
            hint="소개 페이지 맨 위 제목 자리에 표시됩니다. 배경이 투명한 로고 이미지를 올려도 자연스럽게 보입니다. 등록하지 않으면 글자 제목(연합회 공식명칭)이 대신 표시됩니다."
            aspect="3/1"
            fit="contain"
            currentUrl={images.aboutLogoUrl}
            allowClear
          />
          <SiteSettingsImageUploader
            field="about_image"
            label="소개 페이지 사진"
            hint="소개 페이지 본문 위쪽에 표시되는 사진입니다."
            aspect="4/3"
            currentUrl={images.aboutUrl}
            allowClear
          />
        </div>
        <Field label="섹션 제목">
          <input name="about_title" defaultValue={settings?.about_title} className="input" />
        </Field>
        <Field label="홈페이지 요약 문구" hint="홈 화면 카드에 짧게 보이는 소개 문구">
          <textarea name="about_text" defaultValue={settings?.about_text} rows={3} className="input" />
        </Field>
        <Field label="소개 페이지(/about) 본문" hint="소개 페이지 전체에 보이는 긴 설명입니다.">
          <textarea name="about_body" defaultValue={settings?.about_body} rows={6} className="input" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="show_about" defaultChecked={settings?.show_about ?? true} />
          홈페이지에 이 섹션 보이기
        </label>
      </Section>

      <Section title="연합회 소개" hint="담양마을학교 연합회 페이지(/community)와 홈페이지 요약 카드에 쓰이는 사진과 문구입니다.">
        <div className="max-w-xs">
          <SiteSettingsImageUploader
            field="community_image"
            label="연합회 소개 사진"
            aspect="4/3"
            currentUrl={images.communityUrl}
            allowClear
          />
        </div>
        <Field label="섹션 제목">
          <input name="community_title" defaultValue={settings?.community_title} className="input" />
        </Field>
        <Field label="소개 문구">
          <textarea name="community_text" defaultValue={settings?.community_text} rows={3} className="input" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="show_community" defaultChecked={settings?.show_community ?? true} />
          홈페이지에 이 섹션 보이기
        </label>
      </Section>

      <Section title="최근 활동">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="show_recent_activities"
            defaultChecked={settings?.show_recent_activities ?? true}
          />
          홈페이지에 "최근 마을학교 활동" 섹션 보이기
        </label>
      </Section>

      <Section title="공동체 메시지" hint="홈페이지 하단, Footer 바로 위에 크게 강조되는 문구입니다.">
        <Field label="강조 문구">
          <textarea name="closing_message" defaultValue={settings?.closing_message} rows={2} className="input" />
        </Field>
      </Section>

      <Section title="Footer">
        <Field label="소개 문구">
          <textarea name="footer_text" defaultValue={settings?.footer_text} rows={2} className="input" />
        </Field>
        <Field label="연락처 정보" hint="예: 전화번호, 이메일 등 (선택)">
          <input name="footer_contact" defaultValue={settings?.footer_contact ?? ""} className="input" />
        </Field>
        <Field label="Copyright 문구">
          <input name="copyright_text" defaultValue={settings?.copyright_text} className="input" />
        </Field>
      </Section>

      <Section
        title="사이트 기본 주소 (선택)"
        hint="지금은 비워두면 됩니다. 나중에 자체 도메인(예: https://cheongjukgol.kr)을 연결하면 여기에 입력해주세요. QR 코드 생성 등에 사용됩니다."
      >
        <Field label="기본 주소">
          <input
            name="site_base_url"
            defaultValue={settings?.site_base_url ?? ""}
            placeholder="https://cheongjukgol-platform.netlify.app"
            className="input"
          />
        </Field>
      </Section>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-[var(--color-primary)]">저장이 완료되었습니다.</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "저장 중..." : "저장하기"}
      </button>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--color-border)] pt-6 first:border-t-0 first:pt-0">
      <h2 className="font-semibold mb-1">{title}</h2>
      {hint && <p className="text-xs text-[var(--color-text-muted)] mb-4">{hint}</p>}
      <div className="space-y-4 mt-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>}
    </div>
  );
}
