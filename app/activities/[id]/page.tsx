import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getActivityById } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { ACTIVITY_CATEGORY_LABEL, MEDIA_CATEGORY_LABEL } from "@/lib/types";
import GalleryLightbox from "@/components/GalleryLightbox";

export const revalidate = 60;

// 활동 페이지는 처음 방문할 때 한 번 만들어 저장해 두고, 60초마다 새 내용으로 갱신합니다.
// (빈 목록을 돌려주면 배포할 때 미리 만들지 않고, 방문할 때 만들어 저장합니다)
export function generateStaticParams() {
  return [];
}

// 링크를 공유했을 때 미리보기에 활동 제목이 보이도록 제목·설명을 정합니다.
// (미리보기 사진은 같은 폴더의 opengraph-image.tsx가 만듭니다)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [result, settings] = await Promise.all([getActivityById(id), getSiteSettings()]);
  if (!result) return {};
  const { activity } = result;
  const title = `${activity.title} | ${settings.association_name}`;
  const who = activity.schools?.name ?? settings.association_name;
  const summary = activity.description?.replace(/\s+/g, " ").trim().slice(0, 100);
  const description = summary || [who, activity.activity_date].filter(Boolean).join(" · ");
  return { title, description, openGraph: { title, description } };
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, settings] = await Promise.all([getActivityById(id), getSiteSettings()]);
  if (!result) notFound();
  const { activity, media, participatingSchools, coverImageUrl } = result;

  const images = media.filter((m) => m.media_type === "image" && m.url);
  const videos = media.filter((m) => (m.media_type === "video" || m.media_type === "external_video") && m.url);
  const documents = media.filter((m) => m.media_type === "document" && m.url);
  const links = media.filter((m) => m.media_type === "external_link" && m.url);

  return (
    <div className="container-page py-14 sm:py-20 max-w-3xl">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="category-label">{ACTIVITY_CATEGORY_LABEL[activity.activity_category]}</span>
        <p className="text-sm text-[var(--color-secondary)] font-medium">
          {activity.schools ? (
            <Link href={`/schools/${activity.schools.slug}`}>{activity.schools.name}</Link>
          ) : (
            settings.association_name
          )}
        </p>
      </div>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{activity.title}</h1>
      {activity.activity_date && (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{activity.activity_date}</p>
      )}

      {coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={activity.title}
          className="mt-8 w-full rounded-xl object-cover aspect-[16/9]"
        />
      )}

      {activity.description && (
        <p className="mt-8 leading-relaxed whitespace-pre-line">{activity.description}</p>
      )}

      {participatingSchools.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-semibold mb-2">참여 마을학교</p>
          <div className="flex flex-wrap gap-2">
            {participatingSchools.map((s: any) => (
              <Link
                key={s.id}
                href={`/schools/${s.slug}`}
                className="text-xs px-3 py-1 rounded-full border border-[var(--color-border)]"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-12">
          <p className="font-semibold mb-4">사진</p>
          <GalleryLightbox
            images={images.map((m) => ({
              id: m.id,
              url: m.url!,
              thumbUrl: (m as any).thumbUrl ?? m.url!,
              alt: m.title ?? activity.title,
            }))}
          />
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-12">
          <p className="font-semibold mb-4">영상</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((m) =>
              m.media_type === "external_video" ? (
                <a
                  key={m.id}
                  href={m.url!}
                  target="_blank"
                  rel="noreferrer"
                  className="card p-4 block hover:border-[var(--color-accent)]"
                >
                  <p className="text-sm font-medium">{m.title ?? "외부 영상 보러가기"}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">{m.url}</p>
                </a>
              ) : (
                <video key={m.id} src={m.url!} controls className="w-full rounded-md" />
              )
            )}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-12">
          <p className="font-semibold mb-4">첨부자료</p>
          <div className="space-y-2">
            {documents.map((m) => (
              <a
                key={m.id}
                href={m.url!}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between card px-4 py-3 hover:border-[var(--color-accent)]"
              >
                <span className="text-sm font-medium">
                  {m.title ?? m.original_file_name ?? "첨부자료"}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {m.category ? MEDIA_CATEGORY_LABEL[m.category] : ""}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-12">
          <p className="font-semibold mb-4">관련링크</p>
          <div className="space-y-2">
            {links.map((m) => (
              <a
                key={m.id}
                href={m.url!}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-[var(--color-accent)] underline underline-offset-2"
              >
                {m.title ?? m.url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
