# PROMPTS.md — Template Prompt AI

## 1. Mulai Sesi

Baca /AGENTS.md dan /docs/PROGRESS.md. Jangan ubah progress tanpa konfirmasi saya. Setelah paham, konfirmasi posisi project dan next task.

## 2. Perencanaan Task (Plan First)

Kita akan mengerjakan task: {TASK}.
Baca dokumen terkait jika perlu.
Buat rencana perubahan file beserta alur logika singkat 3-5 poin.
Jangan tulis kode dulu. Tunggu persetujuan saya.

## 3. Eksekusi File per File

Setuju. Sekarang buatkan file {FILE_PATH} sesuai rencana tadi.

## 4. Setelah Selesai Task

Update /docs/PROGRESS.md sesuai hasil task ini.
Tambahkan ke bagian "Sudah Selesai".
Ubah bagian "Sedang Dikerjakan".
Catat keputusan penting di Decision Log jika ada.

## 5. Minta Commit

Baca /GIT_COMMIT.md.
Tuliskan pesan git commit untuk perubahan ini sesuai format Conventional Commits.

## 6. Debugging

Ada error di {FILE_PATH}.
Ini pesan error-nya:
{PASTE_ERROR}
Baca /AGENTS.md dan /docs/PROGRESS.md dulu.
Usulkan penyebab paling mungkin dan perbaikan minimal.
Jangan ubah banyak file sekaligus.

## 7. Lanjutkan Progress Terakhir

Baca /docs/PROGRESS.md. Cari bagian "Next Task". Kerjakan task tersebut dengan mengikuti workflow di atas.

### 8. Panggil Skill Spesifik

- **Brainstorming (Complex):**
  `Panggil skill "brainstorming" dengan klasifikasi ARCHITECTURAL untuk task: [DESKRIPSI]. Jangan tulis kode.`
- **Brainstorming (Sederhana):**
  `Panggil skill "brainstorming" dengan klasifikasi BOUNDED untuk task: [DESKRIPSI].`
- **Writing Plans:**
  `Panggil skill "writing-plans". Buat implementation plan dari spec di docs/superpowers/specs/[FILE].md`
- **Grill Me:**
  `Panggil skill "grilling". Evaluasi rencana/desain ini: [DESKRIPSI].`
- **UI/UX Impeccable:**
  `Panggil skill "impeccable" dengan command "craft" untuk halaman [NAMA]. Baca docs/DESIGN.md.`
- **Deploy to Vercel:**
  `Panggil skill "deploy-to-vercel". Deploy ke preview (bukan production).`
  - **UI/UX Pro Max:**
    `Panggil skill "ui-ux-pro-max". Cari rekomendasi style/color/font untuk [PROJECT_TYPE / KEYWORD] dengan --design-system.`

### 9. Update Progress (Wajib Setelah Task)

Task {N} selesai. Sekarang update /docs/PROGRESS.md:

- Pindahkan task yang selesai ke "Sudah Selesai"
- Update "Sedang Dikerjakan" dengan task berikutnya
- Tambahkan ke Decision Log jika perlu

Jangan ubah bagian lain. Langsung gas.

### 10. Cari Skill Dulu (Sebelum Eksekusi)

[MODE: PLAN]
Task: {DESKRIPSI TASK}.

Sebelum eksekusi, cari dulu skill yang relevan pake `find-skills`.
Jalankan: `npx skills find {KEYWORD}`.
Kalo nemu skill populer (>1K install), tawarkan ke saya.
Kalo ga ada, lanjut manual.

Jangan tulis kode sebelum skill discovery selesai.
