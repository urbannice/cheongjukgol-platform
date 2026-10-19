import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  findCurrentSlugFromHistory,
  getSchoolActivities,
  getSchoolBySlug,
  getSchoolMedia,
} from "@/lib/publicData";
import { buildMapSearchUrl } from "@/lib/maps";
import { getSiteSettings } from "@/lib/siteSettings";
import { SCHOOL_CONTACT_LINK_LABEL } from "@/lib/types";
import GalleryLightbox from "@/components/GalleryLightbox";
import { SchoolActivityList, SchoolActivityListFromUrl } from "@/components/SchoolActivityList";

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
  const description = school.short_description ?? settings.association_slogan;
  return {
    title: school.name,
    description,
    openGraph: { title: `${school.name} | ${settings.association_name}`, description },
  };
}

// 학교 페이지는 처음 방문할 때 한 번 만들어 저장해 두고, 60초마다 새 내용으로 갱신합니다.
// (빈 목록을 돌려주면 배포할 때 미리 만들지 않고, 방문할 때 만들어 저장합니다)
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await getSchoolBySlug(slug);

  if (!school) {
    const newSlug = await findCurrentSlugFromHistory(slug);
    if (newSlug) redirect(`/schools/${newSlug}`);
    notFound();
  }

  // 연도별로 보기는 화면 안에서 처리하므로, 이 학교의 공개 활동을 한 번에 가져옵니다.
  const [activities, media] = await Promise.all([
    getSchoolActivities(school.id, 300),
    getSchoolMedia(school.id),
  ]);
  const activityItems = activities.map((a) => ({
    id: a.id,
    title: a.title,
    activity_date: a.activity_date,
    cover_image_url: a.cover_image_url,
  }));

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

        {/* 7. 최근 활동 (연도 필터는 화면 안에서 처리합니다) */}
        <Suspense fallback={<SchoolActivityList slug={school.slug} activities={activityItems} year={null} />}>
          <SchoolActivityListFromUrl slug={school.slug} activities={activityItems} />
        </Suspense>

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
