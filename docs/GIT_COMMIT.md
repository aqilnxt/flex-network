# GIT_COMMIT.md — Commit Message Convention

Gunakan Conventional Commits untuk semua pesan commit.

## Format

<type>(<scope>): <deskripsi singkat imperative lowercase>

Contoh:
feat(auth): add login server action using supabase auth
fix(profile): resolve typescript type error on update profile form
docs(agents): update progress status for migration sprint 1

## Type yang Digunakan

- feat: menambahkan fitur baru
- fix: memperbaiki bug
- docs: mengubah/menambahkan dokumentasi
- style: merapikan format kode tanpa mengubah fungsi
- refactor: mengubah struktur kode tanpa mengubah fitur
- chore: tugas rutin build/update dependensi/konfigurasi
- test: menambahkan atau memperbaiki test

## Aturan

- Huruf kecil semua pada header
- Tidak pakai titik di akhir judul
- Gunakan imperative verb: add, create, fix, change (bukan added/fixing)
- Maksimal 72 karakter pada judul
- Body optional untuk perubahan besar, pisahkan dengan baris kosong