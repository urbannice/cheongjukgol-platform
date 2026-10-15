import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  findCurrentSlugFromHistory,
  getActivityYears,
  getSchoolActivities,
  getSchoolBySlug,
  getSchoolMedia,
} from "@/lib/publicData";
import { buildMapSearchUrl } from "@/lib/maps";
import { getSiteSettings } from "@/lib/siteSettings";
import { SCHOOL_CONTACT_LINK_LABEL } from "@/lib/types";
import GalleryLightbox from "@/components/GalleryLightbox";

// 링크를 공유했을 때 미리보기에 학교 이름과 한줄 소개가 보이도록 제목·설명을 정합니다.
// (미리보기 사진은 같은 폴더의 opengraph-image.tsx가 만듭니다)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [school, settings] = await Promise.all([getSchoolBySlug(slug), getSiteSettings()]);
  if (!school) return {};
  const title = `${school.name} | ${settings.association_name}`;
  const description = school.short_description ?? settings.association_slogan;
  return { title, description, openGraph: { title, description } };
}

export default async function SchoolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { slug } = await params;
  const { year } = await searchParams;
  let school = await getSchoolBySlug(slug);

  if (!school) {
    const newSlug = await findCurrentSlugFromHistory(slug);
    if (newSlug) redirect(`/schools/${newSlug}`);
    notFound();
  }

  const years = await getActivityYears({ type: "school", schoolId: school.id });
  // 활동 기록이 쌓인 학교에서만 연도 필터를 보여줍니다.
  // 활동이 적은 학교(연도가 하나뿐이거나 없음)는 필터 없이 그대로 보여줘 썰렁해 보이지 않게 합니다.
  const showYearFilter = years.length > 1;
  const selectedYear = showYearFilter && year && years.includes(year) ? year : undefined;

  const [activities, media] = await Promise.all([
    getSchoolActivities(school.id, 12, selectedYear),
    getSchoolMedia(school.id),
  ]);

  const addressText =
    school.address_visibility === "full"
      ? school.address
      : school.address_visibility === "area_only"
      ? school.area
      : null;

  const mapQuery = addressText ?? school.location_name ?? null;

  return (
    <div>
      <div className="container-page py-10 sm:py-14 max-w-3xl">
        {/* 1. 대표이미지 / 학교명 / 한 줄 소개 */}
        {/* 대표이미지는 화면 가로를 꽉 채우면 PC에서 너무 크게 보여, 본문 폭에 맞춘 카드 모양으로 보여줍니다. */}
        {school.hero_image_url && (
          <div className="mb-8 aspect-[16/9] rounded-[20px] overflow-hidden bg-[var(--color-surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={school.hero_image_url} alt={school.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold">{school.name}</h1>
        {school.short_description && (
          <p className="mt-3 text-lg text-[var(--color-text-muted)]">{school.short_description}</p>
        )}

        {/* 2. 마을학교 소개 */}
        {school.description && (
          <p className="mt-8 leading-relaxed whitespace-pre-line">{school.description}</p>
        )}

        {/* 3. 기본정보 */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {school.area && <InfoItem label="활동지역" value={school.area} />}
          {school.location_name && <InfoItem label="운영장소" value={school.location_name} />}
          {addressText && (
            <InfoItem
              label="주소"
              value={
                <a
                  href={buildMapSearchUrl(mapQuery ?? addressText)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[var(--color-border)] underline-offset-2"
                >
                  {addressText}
                </a>
              }
            />
          )}
          {school.show_phone && school.phone && (
            <InfoItem
              label="연락처"
              value={
                <a href={`tel:${school.phone.replace(/[^0-9+]/g, "")}`} className="underline underline-offset-2">
                  {school.phone}
                </a>
              }
            />
          )}
        </div>

        {/* 4. 대표자 소개: 모바일은 사진→이름→소개 순 세로, 데스크톱은 사진|글 좌우 배치 */}
        {(school.representative_name || school.representative_bio) && (
          <div className="mt-10 card p-5 flex flex-col sm:flex-row gap-5">
            {school.representative_photo_url && (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] overflow-hidden bg-[var(--color-surface)] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={school.representative_photo_url}
                  alt={school.representative_name ?? "대표자"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="font-semibold">대표자 소개</p>
              {school.show_representative_name && school.representative_name && (
                <p className="mt-1 text-sm font-medium">{school.representative_name}</p>
              )}
              {school.representative_bio && (
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{school.representative_bio}</p>
              )}
            </div>
          </div>
        )}

        {/* 5. 프로그램 (마을활동가 안내문 + 활동 대표사진 포함) */}
        {(school.program_name ||
          school.program_description ||
          school.program_schedule ||
          school.target_group ||
          school.has_activists) && (
          <div className="mt-10">
            <p className="font-semibold mb-4">프로그램</p>
            <div className="card p-5 space-y-3">
              {school.program_name && <InfoItem label="대표 프로그램" value={school.program_name} />}
              {school.program_description && (
                <p className="text-sm leading-relaxed whitespace-pre-line">{school.program_description}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {school.program_schedule && <InfoItem label="운영시간" value={school.program_schedule} />}
                {school.target_group && <InfoItem label="주요 활동 대상" value={school.target_group} />}
              </div>
              {school.has_activists && (
                <p className="text-sm text-[var(--color-text-muted)] pt-1">
                  마을활동가분들과 함께 만들어가고 있습니다.
                </p>
              )}
              {school.activist_photo_url && (
                <div className="aspect-[16/9] rounded-lg overflow-hidden bg-[var(--color-surface)] mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={school.activist_photo_url}
                    alt="프로그램 활동 대표사진"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. 최근 활동 */}
        {(activities.length > 0 || showYearFilter) && (
          <div className="mt-14">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <p className="font-semibold">활동 기록</p>
              {showYearFilter && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/schools/${slug}`}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      !selectedYear
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]"
                    }`}
                  >
                    전체 연도
                  </Link>
                  {years.map((y) => (
                    <Link
                      key={y}
                      href={`/schools/${slug}?year=${y}`}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        selectedYear === y
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]"
                      }`}
                    >
                      {y}년
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                선택한 연도에 등록된 활동이 없습니다.
              </p>
            ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {activities.map((a) => (
                <Link
                  key={a.id}
                  href={`/activities/${a.id}`}
                  className="card min-w-[180px] w-[180px] flex-shrink-0"
                >
                  <div className="aspect-[4/3] bg-[var(--color-surface)] overflow-hidden">
                    {a.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.cover_image_url}
                        alt={a.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2">{a.title}</p>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        )}

        {/* 8. 활동 갤러리 / 영상 / 자료 */}
        {media.filter((m) => m.media_type === "image" && m.url).length > 0 && (
          <div className="mt-14">
            <p className="font-semibold mb-4">활동 갤러리</p>
            <GalleryLightbox
              images={media
                .filter((m) => m.media_type === "image" && m.url)
                .map((m) => ({ id: m.id, url: m.url!, thumbUrl: (m as any).thumbUrl ?? m.url!, alt: m.title ?? school!.name }))}
            />
          </div>
        )}

        {/* 9. SNS / 외부링크 */}
        {school.contactLinks && school.contactLinks.length > 0 && (
          <div className="mt-14 flex flex-wrap gap-3">
            {school.contactLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary inline-flex"
              >
                {link.label || SCHOOL_CONTACT_LINK_LABEL[link.link_type]}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
