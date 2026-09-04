import Link from "next/link";
import { LogoMark } from "@/components/landing/logo-mark";
import { SiteHeader } from "@/components/landing/site-header";

const historyRows = [
  {
    role: "Social Media Assistant",
    org: "Kopi Sore UMK",
    period: "Jun - Agu 2026",
    rating: "4.8",
  },
  {
    role: "Helper Acara",
    org: "CommunityFest EO",
    period: "Mar - Apr 2026",
    rating: "4.6",
  },
  {
    role: "Desain Grafis (Project)",
    org: "Toko Rakyat",
    period: "Jan - Feb 2026",
    rating: "4.9",
  },
];

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 11.5l2.2 2.2L15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 19h5c2.8 0 4-1.6 4-3.5S14.2 8 17 8h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M17.5 4.5L21 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4.5" cy="19" r="1.4" fill="currentColor" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 1.8l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.5.9-5.5-4-3.9 5.5-.8 2.5-5z" />
    </svg>
  );
}

export default function Home() {
  const marqueeItems = ["UMKM", "Startup", "Event Organizer", "Sekolah", "Komunitas"];
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-32 md:pt-36 lg:grid-cols-12 lg:gap-10 lg:pb-28 lg:pt-40">
          <div className="lg:col-span-7">
            <div className="rise">
              <Link
                href="#cara-kerja"
                className="group inline-flex w-fit items-center gap-3 rounded-full border border-line bg-white py-1 pl-4 pr-1 text-sm font-medium text-ink-2 shadow-[0_8px_20px_-12px_rgba(13,9,7,0.15)] transition-colors hover:border-primary/40 hover:text-ink"
              >
                <span className="text-nowrap">
                  Baru: <span className="font-semibold text-ink">Verified Work History</span>
                </span>
                <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-tint transition-colors group-hover:bg-tint-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="m-auto size-3 text-primary"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </div>
            <h1 className="rise rise-2 mt-7 text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-[3.4rem] lg:leading-[1.06]">
              Pengalaman kerja pertamamu,{" "}
              <span className="text-primary">terverifikasi.</span>
            </h1>
            <p className="rise rise-3 mt-6 max-w-[62ch] text-lg leading-relaxed text-ink-2">
              Platform untuk SMA/SMK dan Young Talent. Kerja di project nyata,
              jadi riwayat terverifikasi dua pihak.
            </p>
            <div className="rise rise-4 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(36,71,249,0.55)] transition-colors hover:bg-primary-dark"
              >
                Cari Pengalaman (Talent)
              </Link>
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-xl border border-line bg-white px-6 text-[15px] font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Rekrut Talent (Hirer)
              </Link>
            </div>
            <p className="rise rise-5 mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2">
              <span>Match berbasis skill &amp; interest</span>
              <span aria-hidden className="text-line">
                ·
              </span>
              <span>Meeting &amp; consent</span>
              <span aria-hidden className="text-line">
                ·
              </span>
              <span>Pembayaran simulasi escrow</span>
              <span aria-hidden className="text-line">
                ·
              </span>
              <span>Rating dua arah</span>
            </p>
          </div>

          <div className="rise rise-5 lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              <div
                aria-hidden
                className="absolute inset-x-6 top-6 h-full rounded-2xl border border-line bg-tint-2"
              />
              <div className="relative rounded-2xl bg-white p-6 shadow-[0_24px_48px_-24px_rgba(13,9,7,0.18)]">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold">Riwayat Kerja</p>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#EAFBF1] px-2.5 py-1 text-xs font-semibold text-[#15803D]">
                    <ShieldIcon className="h-3.5 w-3.5" />
                    VERIFIED
                  </span>
                </div>
                <ul className="mt-2">
                  {historyRows.map((row) => (
                    <li
                      key={row.role}
                      className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">
                          {row.role}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-ink-2">
                          {row.org} · {row.period}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                        <StarIcon className="h-3.5 w-3.5 text-warning" />
                        {row.rating}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-2">
                  Contoh tampilan · diverifikasi kedua pihak kontrak
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="bg-tint">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <h2 className="max-w-[24ch] text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
              Dari profil, jadi bukti kerja.
            </h2>
            <p className="mt-4 max-w-[64ch] text-lg leading-relaxed text-ink-2">
              Tiga hal yang membuat pengalaman di Flex Network berbeda dari
              sekadar daftar lowongan: cocok berdasarkan skill, berjalan lewat
              kontrak, dan berakhir jadi riwayat yang bisa dibuktikan.
            </p>

            <div className="mt-12 grid gap-6 lg:grid-cols-12">
              <article className="rounded-2xl border border-line bg-white p-7 lg:col-span-7 lg:p-9">
                <ShieldIcon className="h-7 w-7 text-primary" />
                <h3 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
                  Verified Work History
                </h3>
                <p className="mt-3 max-w-[58ch] leading-relaxed text-ink-2">
                  Output utama di Flex Network. Kerja selesai di-rating kedua
                  pihak - talent dan hirer - lalu tercatat permanen sebagai
                  riwayat kerja terverifikasi yang melekat pada profil.
                </p>
                <ul className="mt-7 divide-y divide-line border-y border-line">
                  <li className="flex items-center gap-3 py-3 text-[15px]">
                    <span className="font-semibold tabular-nums text-primary">
                      1
                    </span>
                    Kedua pihak memberi rating setelah kerja selesai
                  </li>
                  <li className="flex items-center gap-3 py-3 text-[15px]">
                    <span className="font-semibold tabular-nums text-primary">
                      2
                    </span>
                    Sistem mencatat status VERIFIED dengan tanggal verifikasi
                  </li>
                  <li className="flex items-center gap-3 py-3 text-[15px]">
                    <span className="font-semibold tabular-nums text-primary">
                      3
                    </span>
                    Riwayat tampil di profil - bukti untuk seleksi berikutnya
                  </li>
                </ul>
              </article>

              <div className="flex flex-col gap-6 lg:col-span-5">
                <article className="flex-1 rounded-2xl border border-line bg-white p-7">
                  <TargetIcon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-bold tracking-tight">
                    Match yang transparan
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                    Skor kecocokan dihitung server-side: 70% kesesuaian skill,
                    30% interest. Deterministik, tanpa AI.
                  </p>
                  <div className="mt-5 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Skill</span>
                        <span className="tabular-nums">70%</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-tint">
                        <div className="h-2 w-[70%] rounded-full bg-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Interest</span>
                        <span className="tabular-nums">30%</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-tint">
                        <div className="h-2 w-[30%] rounded-full bg-accent" />
                      </div>
                    </div>
                  </div>
                </article>

                <article className="flex-1 rounded-2xl border border-line bg-white p-7">
                  <RouteIcon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-lg font-bold tracking-tight">
                    Alur yang berproteksi
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                    Setiap tahap terjaga status dan hak aksesnya:
                  </p>
                  <ol className="mt-3 space-y-2 text-[15px] text-ink-2">
                    <li>Profil &amp; skill</li>
                    <li>Opportunity &amp; match</li>
                    <li>Kontrak &amp; pembayaran</li>
                    <li>Kerja &amp; rating</li>
                  </ol>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Dipercaya oleh berbagai pihak"
          className="overflow-hidden border-y border-line bg-tint py-5"
        >
          <div className="marquee flex w-max items-center gap-12 text-sm font-medium text-ink-2">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center gap-12 whitespace-nowrap">
                {item}
                <span aria-hidden className="h-1 w-1 rounded-full bg-line" />
              </span>
            ))}
          </div>
        </section>

        <section className="bg-primary">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
              Pengalaman pertamamu dimulai di sini.
            </h2>
            <p className="mx-auto mt-4 max-w-[58ch] text-lg leading-relaxed text-[#DDE5FE]">
              Daftar gratis, lengkapi profil skill dan interest, lalu temukan
              opportunity pertamamu - atau buka pintu untuk Young Talent di
              project kamu.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-xl bg-white px-6 text-[15px] font-semibold text-primary transition-colors hover:bg-tint"
              >
                Cari Pengalaman (Talent)
              </Link>
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-xl border border-white/50 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Rekrut Talent (Hirer)
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-tint">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-7 w-7" />
                <span className="text-[15px] font-bold tracking-tight">
                  Flex Network
                </span>
              </div>
              <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-ink-2">
                Platform experience-driven yang menghubungkan Young Talent
                dengan Hirer untuk pengalaman kerja nyata.
              </p>
              <div className="mt-5 flex gap-2.5">
                <a
                  href="https://github.com/flex-network"
                  aria-label="GitHub"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-2 transition-colors hover:border-primary hover:text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8a9.56 9.56 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/flexnetwork"
                  aria-label="Twitter"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-2 transition-colors hover:border-primary hover:text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                    <path d="M18.9 2H22l-6.55 7.48L23 22h-6.32l-4.95-6.47L6.07 22H3l7-8-7.42-12h6.5l4.47 5.92L18.9 2ZM17.8 20h1.7L7.38 3.9H5.5L17.8 20Z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/flexnetwork"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-2 transition-colors hover:border-primary hover:text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M19 2a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h14ZM8.34 18.34V9.98H5.67v8.36h2.67ZM6.98 8.59a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1ZM18.34 18.34v-4.7c0-2.52-1.35-3.7-3.15-3.7-1.45 0-2.1.8-2.47 1.36V9.98h-2.67c.04.86 0 8.36 0 8.36h2.67v-4.67c0-.25.02-.5.1-.68.2-.5.67-1.02 1.46-1.02.93 0 1.46.7 1.46 1.74v4.63h2.6Z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/flexnetwork"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-2 transition-colors hover:border-primary hover:text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4.2" />
                    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Produk</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                <li>
                  <Link href="/opportunities" className="hover:text-ink">
                    Cari Opportunity
                  </Link>
                </li>
                <li>
                  <Link href="/matching/recommendations" className="hover:text-ink">
                    Rekomendasi Match
                  </Link>
                </li>
                <li>
                  <Link href="/work-history" className="hover:text-ink">
                    Work History
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Akun</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                <li>
                  <Link href="/login" className="hover:text-ink">
                    Masuk
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-ink">
                    Daftar
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-ink">
                    Profil
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Kontak</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                <li>
                  <a href="mailto:hello@flexnetwork.id" className="hover:text-ink">
                    hello@flexnetwork.id
                  </a>
                </li>
                <li className="leading-relaxed">Jakarta, Indonesia</li>
                <li>
                  <a href="#cara-kerja" className="hover:text-ink">
                    Cara Kerja
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-sm text-ink-2 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Flex Network</p>
            <p>Built for Young Talent and Hirer in Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
