import Link from "next/link";
import { getSiteSettings } from "@/lib/siteSettings";
import MobileNav from "@/components/MobileNav";

export default async function SiteHeader() {
  const settings = await getSiteSettings();

  return (
    <header className="relative border-b border-[var(--color-border)] bg-[var(--color-white)] sticky top-0 z-40">
      <div className="container-page flex items-center justify-between h-24 sm:h-28 py-3">
        <Link href="/" className="font-bold text-lg tracking-tight flex items-center">
          {settings.logo_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_image_url} alt={settings.association_name} className="h-12 sm:h-16 w-auto" />
          ) : (
            settings.association_name
          )}
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
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
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
