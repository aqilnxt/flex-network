"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "./logo-mark";

const menuItems = [
  { name: "Cara Kerja", href: "#cara-kerja" },
  { name: "Opportunity", href: "/opportunities" },
];

export function SiteHeader() {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <nav
        data-state={menuState ? "active" : undefined}
        aria-label="Navigasi utama"
        className={`mx-auto flex max-w-6xl items-center justify-between gap-6 rounded-2xl px-6 py-3 transition-all duration-300 lg:px-8 ${
          isScrolled
            ? "max-w-3xl border border-line bg-white shadow-[0_12px_32px_-16px_rgba(13,9,7,0.22)]"
            : "max-w-6xl border border-transparent"
        }`}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Flex Network - beranda">
          <LogoMark className="h-8 w-8" />
          <span className="text-[17px] font-bold tracking-tight text-ink">
            Flex Network
          </span>
        </Link>

        <ul className="hidden items-center gap-8 text-[15px] font-medium text-ink-2 md:flex">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href} className="transition-colors hover:text-ink">
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-primary px-4 py-2 text-[15px] font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Daftar
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuState((v) => !v)}
          aria-expanded={menuState}
          aria-label={menuState ? "Tutup menu" : "Buka menu"}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-tint hover:text-ink md:hidden"
        >
          <span className="sr-only">Menu</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className={`h-6 w-6 text-ink transition-all duration-200 ${
              menuState ? "scale-0 -rotate-180 opacity-0" : ""
            }`}
            aria-hidden
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className={`absolute h-6 w-6 text-ink transition-all duration-200 ${
              menuState ? "" : "rotate-180 scale-0 opacity-0"
            }`}
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </nav>

      <div
        className={`mx-auto mt-2 max-w-6xl rounded-2xl border border-line bg-white p-6 shadow-[0_24px_48px_-24px_rgba(13,9,7,0.24)] transition-all duration-300 md:hidden ${
          menuState ? "" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <ul className="space-y-4 text-[15px] font-medium text-ink-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setMenuState(false)}
                className="block transition-colors hover:text-ink"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-3">
          <Link
            href="/login"
            onClick={() => setMenuState(false)}
            className="flex h-11 items-center justify-center rounded-xl border border-line text-[15px] font-semibold text-ink"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            onClick={() => setMenuState(false)}
            className="flex h-11 items-center justify-center rounded-xl bg-primary text-[15px] font-semibold text-white"
          >
            Daftar
          </Link>
        </div>
      </div>
    </header>
  );
}
