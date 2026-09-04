import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flex Network - Pengalaman Kerja Nyata untuk Young Talent",
  description:
    "Platform experience-driven yang menghubungkan pelajar SMA/SMK dan Young Talent dengan UMKM serta startup untuk pengalaman kerja nyata, diakhiri Verified Work History.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#0D0907]">
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html:
              "<!-- FLEX LANDING CONTRACT | THESIS: bukti kerja terverifikasi jualan halaman ini, bukan janji; menolak hero gradien + 3 kartu seragam kategori SaaS. | OWN-WORLD: putih membawa ruang, Royal Blue #2447F9 hanya di action + satu band CTA penuh, tint #F3F6FF untuk section fitur, hijau #22C55E hanya badge VERIFIED; komponen = kartu radius 16 border 1px + shadow offset lembut, tombol pill, Inter 400-800. | STORY: visitor paham ini platform pengalaman kerja nyata untuk pelajar SMA/SMK & UMKM, percaya karena melihat artefak Verified Work History, lalu memilih CTA Talent atau Hirer. | FIRST VIEWPORT: nav putih tipis; kiri 7/12 - tagline Inter 800 + subcopy + dua tombol (Cari Pengalaman (Talent) primary, Rekrut Talent (Hirer) outline) + strip fakta produk; kanan 5/12 - kartu mock Riwayat Kerja Terverifikasi dengan badge VERIFIED dan rating, caption 'Contoh tampilan'. | FORM: proof-first hero, komposisi asimetris 1 lead + 2 kartu pendukung, seed key flex-landing-proof. | FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->",
          }}
        />
        {children}
      </body>
    </html>
  );
}
