import Link from "next/link";
import { getSiteSettings } from "@/lib/siteSettings";

// 담양교육지원청/담양군 공식 홈페이지 주소입니다. 로고를 누르면 각 기관 사이트로 바로 이동합니다.
const ORG_SITE_URL = "https://dyed.jne.go.kr/dyed/main.do?sysId=dyed";
const ORG2_SITE_URL = "https://www.damyang.go.kr/";

export default async function SiteFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-warm)] mt-16">
      <div className="container-page py-10 text-sm text-[var(--color-text-muted)] space-y-4">
        <div>
          <p className="font-semibold text-[var(--color-text)]">{settings.association_name}</p>
          <p className="mt-1">{settings.association_slogan}</p>
          <p className="mt-2 whitespace-pre-line">{settings.footer_text}</p>
          {settings.footer_contact && <p className="mt-1">{settings.footer_contact}</p>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/about" className="hover:text-[var(--color-secondary)]">
            소개
          </Link>
          <Link href="/schools" className="hover:text-[var(--color-secondary)]">
            마을학교
          </Link>
          <Link href="/activities" className="hover:text-[var(--color-secondary)]">
            전체활동
          </Link>
          <Link href="/community" className="hover:text-[var(--color-secondary)]">
            연합활동
          </Link>
          <Link href="/contact" className="hover:text-[var(--color-secondary)]">
            연락하기
          </Link>
          <Link href="/admin" className="hover:text-[var(--color-secondary)]">
            관리자 로그인
          </Link>
        </div>

        {/* 지원기관 표기 — 연합회 자체 로고와 분리하되, 눈에 잘 띄도록 별도 영역으로 강조합니다. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 px-4 sm:px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)]">
          <div className="flex items-center gap-3">
            {settings.org_logo_image_url ? (
              <a href={ORG_SITE_URL} target="_blank" rel="noreferrer" className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.org_logo_image_url}
                  alt={settings.org_name}
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </a>
            ) : null}
            {settings.org2_logo_image_url ? (
              <a href={ORG2_SITE_URL} target="_blank" rel="noreferrer" className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.org2_logo_image_url}
                  alt={settings.org2_name}
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </a>
            ) : null}
          </div>
          <div>
            <p className="text-[11px] tracking-wide text-[var(--color-text-muted)]">지원기관</p>
            <p className="mt-0.5 text-sm sm:text-base font-semibold text-[var(--color-text)]">
              {settings.org_support_text || `지원 · ${settings.org_name} · ${settings.org2_name}`}
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)]">{settings.copyright_text}</p>
      </div>
    </footer>
  );
}
