# Sistem Informasi Verifikasi Soal

## Project Description

Aplikasi web untuk mengelola proses verifikasi soal pada perguruan tinggi, termasuk master data dosen, mata kuliah, PLO, CLO, penugasan koordinator/verifikator, periode verifikasi, upload soal, revisi, verifikasi, monitoring, dan berita acara.

## Business Rules

- Satu Mata Kuliah dapat memiliki banyak PLO.
- Satu Mata Kuliah dapat memiliki banyak CLO.
- Satu CLO dapat memiliki banyak PLO.
- Penugasan Koordinator berlaku berdasarkan Mata Kuliah dan Periode.
- Saat periode Koordinator berakhir, Super Admin dapat menetapkan Koordinator baru tanpa menghapus histori.
- Verifikator hanya dapat memverifikasi soal sesuai assignment aktif.
- Pengunggah soal tidak boleh memverifikasi soal miliknya sendiri.

- PLO dan CLO menggunakan template Excel untuk import dan dapat diekspor.

- File transaksi disimpan melalui Laravel Storage, bukan langsung di public.

## Features

- Role-based access control untuk SuperAdmin, Koordinator Mata Kuliah, dan Verifikator.
- Master data: Dosen, Mata Kuliah, PLO, CLO, Kategori Soal.
- Periode verifikasi dan tahun ajaran.
- Penugasan Koordinator dan Verifikator per Mata Kuliah dan Periode.
- Excel import/export untuk PLO, CLO, dan Mata Kuliah.
- Upload soal dengan private storage.
- Workflow soal: Draft, Submitted, In Review, Revision, Resubmitted, Approved, Rejected.
- Riwayat revisi, verifikasi, dan audit log.
- Berita Acara.
- UI merah-putih yang responsif.

## Roles

- SuperAdmin: master data, periode, penugasan, import/export, monitoring.
- Dosen Koordinator Mata Kuliah: upload soal/revisi, melihat status, Berita Acara sesuai kewenangan.
- Dosen Verifikator: verifikasi soal dan memberi catatan.

## Tech Stack

- Backend: Laravel, PHP, Inertia
- Frontend: React, TypeScript, Inertia React, Vite
- UI: Tailwind CSS, shadcn/ui, Lucide Icons
- Database: PostgreSQL atau MySQL
- Excel: Laravel Excel / Maatwebsite Excel
- PDF: Laravel-compatible PDF generator
- Testing: PHPUnit / Pest

## Requirements

- PHP 8.x
- Composer
- Node.js
- NPM/Yarn
- Database server (PostgreSQL/MySQL)

## Installation

1. Copy `.env.example` ke `.env`.
2. Jalankan `composer install`.
3. Jalankan `npm install`.
4. Buat database dan atur konfigurasi di `.env`.
5. Jalankan `php artisan key:generate`.
6. Jalankan `php artisan migrate`.
7. Jalankan `php artisan db:seed` jika diperlukan.
8. Jalankan `npm run dev`.

## Environment

- `APP_NAME`
- `APP_URL`
- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`

## Database Configuration

- Gunakan `DB_CONNECTION=mysql` atau `DB_CONNECTION=pgsql`.
- Pastikan database sudah tersedia sebelum migrate.

## Development

- Backend: `php artisan serve`
- Frontend: `npm run dev`

## Testing

- Jalankan `php artisan test`
- Atau `vendor/bin/phpunit`

## Folder Structure

- `app/`
- `database/`
- `resources/js/`
- `routes/`
- `tests/`
- `docs/`

## Documentation

- `docs/PRD.md`
- `docs/DATABASE.md`
- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `docs/RULES.md`
- `docs/SCHEMA.md`
- `docs/DESIGN.md`
- `docs/AGENT.md`

## Notes

Dokumentasi dibuat sebagai sumber kebenaran untuk fase awal development. Implementasi fitur harus mengikuti dokumen ini sebelum melakukan perubahan besar.
