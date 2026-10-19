import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/siteSettings";

export const revalidate = 60;

// 검색 결과와 브라우저 탭에 보이는 제목·설명입니다. (제목 뒤에 연합회 이름이 자동으로 붙습니다)
export const metadata: Metadata = {
  title: "소개",
  description: "담양 지역 마을학교들이 함께 만든 마을교육공동체, 담양마을학교 연합회(청죽골마을교육공동체)를 소개합니다.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  // 소개 페이지 전용 로고를 따로 등록하지 않았다면, 헤더 로고로 대신 채우지 않고
  // 글자 제목(연합회 명칭)을 그대로 보여줍니다.
  const titleLogoUrl = settings.about_logo_image_url;

  return (
    <div className="container-page py-16 sm:py-24 max-w-2xl">
      <p className="section-label">소개</p>
      <h1 className="mt-3">
        {titleLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={titleLogoUrl}
            alt={settings.association_name}
            className="max-w-[220px] sm:max-w-[280px] w-full h-auto max-h-24 sm:max-h-28 object-contain"
          />
        ) : (
          <span className="text-2xl sm:text-3xl font-bold">{settings.association_name}</span>
        )}
      </h1>

      {settings.about_image_url && (
        <div className="mt-8 aspect-[16/9] rounded-xl overflow-hidden bg-[var(--color-surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.about_image_url}
            alt={settings.about_title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-[var(--color-text)] whitespace-pre-line">
        {settings.about_body}
      </div>

      <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] p-6 sm:p-8">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">함께 만들어가는 구조</p>
        <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-3 text-center">
          <div className="flex-1 rounded-lg bg-[var(--color-white)] border border-[var(--color-border)] px-4 py-4">
            <p className="text-xs text-[var(--color-text-muted)]">지원기관</p>
            <p className="mt-1 font-semibold">{settings.org_name}</p>
          </div>
          <div className="flex items-center justify-center text-[var(--color-text-muted)] sm:rotate-0 rotate-90">→</div>
          <div className="flex-1 rounded-lg bg-[var(--color-white)] border border-[var(--color-border)] px-4 py-4">
            <p className="text-xs text-[var(--color-text-muted)]">연합체</p>
            <p className="mt-1 font-semibold">{settings.association_name}</p>
          </div>
          <div className="flex items-center justify-center text-[var(--color-text-muted)] sm:rotate-0 rotate-90">→</div>
          <div className="flex-1 rounded-lg bg-[var(--color-white)] border border-[var(--color-border)] px-4 py-4">
            <p className="text-xs text-[var(--color-text-muted)]">운영 주체</p>
            <p className="mt-1 font-semibold">각 마을학교</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          {settings.org_name}의 지원을 바탕으로 {settings.association_name}가 마을학교 간 연결과 공동활동을
          만들어가고, 실제 프로그램은 각 마을학교가 지역의 특성에 맞게 운영합니다.
        </p>
      </div>
    </div>
  );
}
