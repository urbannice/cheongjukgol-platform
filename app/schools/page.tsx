import Link from "next/link";
import { getVisibleSchools } from "@/lib/publicData";

export const revalidate = 60;

export default async function SchoolsPage() {
  const schools = await getVisibleSchools();
  const active = schools.filter((s) => s.status !== "archived");
  const archived = schools.filter((s) => s.status === "archived");

  return (
    <div className="container-page py-14 sm:py-20">
      <p className="section-label">마을학교 디렉토리</p>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold">참여 마을학교</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        함께하는 {active.length}개의 마을학교를 소개합니다.
      </p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {active.map((school) => (
          <SchoolCard key={school.id} school={school} />
        ))}
      </div>

      {archived.length > 0 && (
        <details className="mt-14">
          <summary className="cursor-pointer text-sm text-[var(--color-text-muted)]">
            지난 마을학교 보기
          </summary>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {archived.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function SchoolCard({
  school,
}: {
  school: {
    id: string;
    name: string;
    slug: string;
    area: string | null;
    short_description: string | null;
    hero_image_url: string | null;
  };
}) {
  return (
    <Link href={`/schools/${school.slug}`} className="card block group">
      <div className="aspect-[4/3] bg-[var(--color-surface)] overflow-hidden">
        {school.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={school.hero_image_url}
            alt={school.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            {school.name}
          </div>
        )}
      </div>
      <div className="p-4">
        {school.area && <p className="text-xs text-[var(--color-text-muted)]">{school.area}</p>}
        <p className="mt-1 font-semibold">{school.name}</p>
        {school.short_description && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">
            {school.short_description}
          </p>
        )}
      </div>
    </Link>
  );
}
