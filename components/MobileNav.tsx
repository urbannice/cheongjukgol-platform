"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/about", label: "소개" },
  { href: "/schools", label: "마을학교" },
  { href: "/activities", label: "전체활동" },
  { href: "/community", label: "연합활동" },
  { href: "/contact", label: "연락하기" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label="메뉴 열기"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center justify-center gap-[5px] w-9 h-9"
      >
        <span
          className={`block h-[2px] w-6 bg-[var(--color-primary)] transition-transform ${
            open ? "translate-y-[7px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-6 bg-[var(--color-primary)] transition-opacity ${
            open ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-6 bg-[var(--color-primary)] transition-transform ${
            open ? "-translate-y-[7px] -rotate-45" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full bg-[var(--color-white)] border-b border-[var(--color-border)] shadow-sm">
          <nav className="container-page py-3 flex flex-col">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-[15px] font-medium text-[var(--color-text)] border-b border-[var(--color-border)] last:border-0"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
