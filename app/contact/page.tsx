import type { Metadata } from "next";
import Link from "next/link";
import { getContactDirectory } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { buildMapSearchUrl } from "@/lib/maps";
import { SCHOOL_CONTACT_LINK_LABEL } from "@/lib/types";

export const revalidate = 60;

// 검색 결과와 브라우저 탭에 보이는 제목·설명입니다. (제목 뒤에 연합회 이름이 자동으로 붙습니다)
export const metadata: Metadata = {
  title: "연락하기",
  description: "담양 지역 마을학교별 연락처와 위치 안내입니다.",
};

export default async function ContactPage() {
  const [schools, settings] = await Promise.all([getContactDirectory(), getSiteSettings()]);

  return (
    <div className="container-page py-10 sm:py-14 max-w-xl">
      <p className="section-label">마을학교 연락처</p>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold">담양마을학교 연락처</h1>
      <p className="mt-2 text-[var(--color-text-muted)]">
        {settings.association_name}와 함께하는 마을학교의 연락처와 운영장소를 확인하세요.
      </p>

      <div className="mt-8 space-y-5">
        {schools.map((school) => {
          const addressText =
            school.address_visibility === "full"
              ? school.address
              : school.address_visibility === "area_only"
              ? school.area
              : null;
          const locationLabel = school.location_name ?? addressText;
          const mapQuery = addressText ?? school.location_name;

          return (
            <div key={school.id} className="card p-4">
              <div className="flex gap-4">
                {school.contact_display_image_url ? (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] overflow-hidden bg-[var(--color-surface)] flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={school.contact_display_image_url}
                      alt={school.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg">{school.name}</p>
                  {school.show_representative_name && school.representative_name && (
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      대표자 {school.representative_name}
                    </p>
                  )}

                  <div className="mt-3 space-y-2 text-sm">
                    {school.show_phone && school.phone && (
                      <ContactRow
                        label={school.phone}
                        href={`tel:${school.phone.replace(/[^0-9+]/g, "")}`}
                        icon="phone"
                        actionLabel="전화하기"
                      />
                    )}
                    {school.show_email && school.email && (
                      <ContactRow
                        label={school.email}
                        href={`mailto:${school.email}`}
                        icon="mail"
                        actionLabel="메일 보내기"
                      />
                    )}
                  </div>

                  {school.contactLinks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {school.contactLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                        >
                          {link.label || SCHOOL_CONTACT_LINK_LABEL[link.link_type]}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {locationLabel && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">{locationLabel}</span>
                  <a
                    href={buildMapSearchUrl(mapQuery ?? locationLabel)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 whitespace-nowrap"
                  >
                    지도에서 보기
                  </a>
                </div>
              )}

              <Link href={`/schools/${school.slug}`} className="btn-secondary mt-4 inline-flex text-sm w-full justify-center">
                마을학교 상세보기
              </Link>
            </div>
          );
        })}

        {schools.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
            등록된 마을학교가 아직 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  label,
  href,
  icon,
  actionLabel,
}: {
  label: string;
  href: string;
  icon: "phone" | "mail";
  actionLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <a href={href} className="flex-1 min-w-0 truncate underline underline-offset-2">
        {label}
      </a>
      <a
        href={href}
        aria-label={actionLabel}
        title={actionLabel}
        className="flex-shrink-0 w-9 h-9 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors"
      >
        {icon === "phone" ? <PhoneIcon /> : <MailIcon />}
      </a>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
