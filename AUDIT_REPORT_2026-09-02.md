# LAPORAN AUDIT & PEMBERSIHAN DUPLIKASI KODE — SIDANG KP

**Target Sistem:** Aplikasi Web Verifikasi Soal Asesmen (Sidang KP)
**Teknologi:** Laravel 11/12 (PHP 8.2), Inertia.js (React 19, Tailwind CSS v4), PostgreSQL / SQLite
**Tanggal Audit:** 2 September 2026
**Metode:** Pembacaan penuh kode aktual di working tree (bukan asumsi dari laporan audit sebelumnya)

---

## 1. Catatan atas Laporan Audit Sebelumnya

`AUDIT_REPORT.md` (19 Agustus 2026) mengklaim seluruh 29 temuan telah **100% resolved**. Verifikasi ulang terhadap kode saat ini menunjukkan:

- **Klaim keamanan OWASP** (rate limiting, IDOR/BOLA, validasi upload file, mass assignment, SQL injection, session regeneration) — **sebagian besar masih akurat** dan terverifikasi konsisten dengan kode saat ini.
- **Klaim "codebase bersih dari duplikasi"** — **tidak akurat**. Ditemukan duplikasi signifikan di backend maupun frontend, termasuk beberapa yang menyembunyikan inkonsistensi perilaku nyata (lihat Bagian 3).
- **Klaim "100% navigasi SPA"** — sebagian besar benar untuk sidebar, tapi ditemukan minimal satu tombol navigasi (`Verifikator/Soal/Index.jsx:116`, tombol "Review") yang masih memakai `<a href>` biasa alih-alih `<Link>` Inertia (belum diperbaiki — lihat Bagian 4).

---

## 2. Perubahan yang Sudah Diterapkan (Konsolidasi Duplikasi Aman)

Seluruh perubahan berikut adalah **refactor murni tanpa mengubah perilaku aplikasi** — kode yang identik dipindahkan ke satu sumber lalu dipanggil dari beberapa tempat. Diverifikasi dengan `php -l`, `php artisan test` (33/33 test lulus), dan `npm run build` (sukses tanpa error) setelah setiap batch perubahan.

### Backend (Laravel)

| File | Duplikasi yang dikonsolidasi |
| --- | --- |
| `Verifikator/BeritaAcaraController.php` | Blok "logo base64" (2x) → `getLogoBase64()`; cek `isAssigned` verifikator (3x) → `isAssignedVerifikator()` |
| `Verifikator/SoalController.php` | Cek `isAssigned` verifikator (3x) → `isAssignedVerifikator()` |
| `Koordinator/SoalController.php` | Query kategori aktif (3x) → `activeExamCategoriesQuery()`; cek "soal masih aktif" (2x) → `hasActiveSoal()`; cek `isAssigned` koordinator (2x) → `isAssignedKoordinator()` |
| `Koordinator/RevisiController.php` | Cek `isAssignedKoor`/`isAssignedVerif` (2x masing-masing, di `download()` & `preview()`) → `isAssignedKoordinator()` / `isAssignedVerifikator()` |
| `SuperAdmin/KelompokVerifikasiController.php` | Rules validasi 25 baris (`store` vs `update`) → `kelompokVerifikasiRules()` + `kelompokVerifikasiMessages()`; loop validasi separation-of-duties 34 baris (`store` vs `update`) → `validateSeparationOfDuties()` |
| `SuperAdmin/TahunAjaranController.php` | **Dihapus** — dead code, tidak pernah dirutekan (semua path `tahun-ajaran/*` di-redirect ke `periode.index` di `routes/web.php:119`) |

### Frontend (React/Inertia)

| File | Duplikasi yang dikonsolidasi |
| --- | --- |
| `Components/Toast.jsx` | **Dihapus** — wrapper `FlashAlert` yang tidak pernah diimpor di manapun (dead code asli) |
| 16 halaman (`Koordinator/Soal/{Create,Edit,Show,Revisi}.jsx`, `Koordinator/MataKuliah/Show.jsx`, `Verifikator/Soal/{Index,Show}.jsx`, `Verifikator/BeritaAcara/{Index,Show}.jsx`, `SuperAdmin/{CLO,TahunAjaran,MataKuliah,KategoriSoal,Periode,KelompokVerifikasi(Index,Show)}/Index.jsx`) | Definisi lokal `function Toast({flash}){ return <FlashAlert type="toast" flash={flash}/> }` (identik di 16 file) dihapus; render diganti langsung ke `<FlashAlert flash={flash}/>`. Aman karena `FlashAlert` (`Components/FlashAlert.jsx`) tidak pernah membaca prop `type` — output 100% identik. |
| `Components/StatCard.jsx` (baru) | Komponen `StatCard` yang identik byte-per-byte di `SuperAdmin/Dashboard.jsx`, `Koordinator/Dashboard.jsx`, `Verifikator/Dashboard.jsx` → satu komponen bersama |
| `Utils/date.js` (baru) | `formatDate`/`formatDateTime`/`relativeTime` yang identik di `TahunAjaran/Index.jsx`, `KelompokVerifikasi/{Create,Show,Index}.jsx`, `KategoriSoal/Index.jsx`, `Periode/Index.jsx` (alias `fmt`/`fmtDT`), `SuperAdmin/Dashboard.jsx`, `Koordinator/MataKuliah/Show.jsx` → satu util bersama |

---

## 3. Duplikasi yang SENGAJA TIDAK Diubah (Butuh Keputusan Bisnis)

Item berikut adalah duplikasi kode yang secara tekstual mirip, **tetapi menyembunyikan behavior yang sudah tidak konsisten** antar salinan. Menggabungkannya berarti memilih satu perilaku "benar" — sebuah keputusan alur bisnis, bukan sekadar refactor teknis. Sesuai instruksi untuk tidak mengasumsikan perubahan alur, item ini dibiarkan apa adanya dan didokumentasikan agar Anda bisa memutuskan.

### 3.1 Logika "cek penugasan aktif" (hasActiveKoor/hasActiveVerif) — 9 lokasi, 3 perilaku berbeda
Query `PenugasanKoordinator`/`PenugasanVerifikator` di-exists() diulang di `LoginController.php` (2x), `CheckRole.php`, `HandleInertiaRequests.php`, `Koordinator/DashboardController.php`, `Verifikator/DashboardController.php`, `KelompokVerifikasiController.php`, `routes/web.php` (2x). **Perilaku hasil berbeda-beda** saat dosen tidak lagi punya penugasan aktif:
- `LoginController::syncDosenRole` → set `role = null`
- `HandleInertiaRequests.php` → sengaja **tidak** mengubah kolom (komentar: "kolom role NOT NULL")
- `KelompokVerifikasiController::syncAffectedDosenRoles` & `DosenController::cabutPenugasan` → set `role = 'DOSEN'`

**Rekomendasi:** perlu diputuskan perilaku mana yang benar sebelum disatukan menjadi satu helper.

### 3.2 Toast notifikasi tampil dobel (bug, bukan murni duplikasi)
`AuthenticatedLayout.jsx` sudah memiliki listener global untuk `flash` (baris ~175) yang memanggil `showToast()`. Karena hampir semua halaman anak juga merender `<FlashAlert flash={flash}/>` (setelah konsolidasi di Bagian 2, render tetap dipertahankan apa adanya, prilaku bug ini **tidak diubah** — hanya sumber duplikasinya yang dirapikan), dua listener membaca `flash` yang sama dan **toast SweetAlert2 muncul dua kali** di hampir setiap halaman.

**Rekomendasi:** hapus salah satu — baik listener global di Layout, atau render `<FlashAlert>` di tiap halaman anak.

### 3.3 Dua endpoint ganti password dengan audit-log tidak konsisten
`PasswordController::update` (`PUT /password`) mencatat `AuditLog::record(..., 'CHANGE_PASSWORD', ...)`, sedangkan `ProfileController::updatePassword` (`POST /profile/password`) — fungsi bisnis yang sama — **tidak mencatat** ke audit log sama sekali. `ProfileController::updateProfile`, `updateSignature`, `deleteSignature` juga tidak ter-audit-log.

### 3.4 Migration `2026_09_02_000000` — foreign key hilang permanen
`make_tahun_ajaran_id_nullable_in_periode_verifikasi_table.php` men-drop foreign key `tahun_ajaran_id → tahun_ajaran.id` untuk membuat kolom nullable, tapi **tidak pernah membuatnya lagi**. `down()` juga tidak mengembalikan FK tersebut (tidak reversible). Selama ini tidak menimbulkan error karena `PeriodeController::store` memang sudah tidak lagi menerima/memvalidasi `tahun_ajaran_id` — tapi integritas referensial kolom ini sekarang tidak dijaga level database sama sekali.

### 3.5 Warna badge status tidak konsisten antar halaman
`STATUS_CONFIG`/`StatusBadge` didefinisikan ulang di 11 file dengan skema warna yang **berbeda-beda** untuk status yang secara semantik sama (mis. `IN_REVIEW` berwarna `bg-purple-100` di satu halaman tapi `bg-purple-50 border` di halaman lain). Tidak digabungkan karena menyatukan berarti mengubah tampilan salah satu halaman.

### 3.6 CheckRole middleware — whitelist route tidak simetris antar role
Dosen tanpa penugasan aktif diizinkan mengakses `koordinator.dashboard`, `koordinator.soal.index/create/show`, `koordinator.mata-kuliah.show` tanpa 403 — tapi **tidak ada** whitelist setara untuk `verifikator.soal.index`/`verifikator.berita-acara.index`. Tidak jelas apakah ini disengaja.

---

## 4. Temuan Lain yang Belum Ditindaklanjuti (Bukan Duplikasi)

- **`<a href>` bukan `<Link>` Inertia:** `Verifikator/Soal/Index.jsx:116` (tombol "Review") memicu full-page reload alih-alih navigasi SPA.
- **Constraint integritas hanya aktif di PostgreSQL:** trigger di migration `2026_08_29_000003` dan unique constraint di `2026_08_20_000002` dibungkus `if (DB::getDriverName() === 'pgsql')` — aturan bisnis kritikal (1 dosen tidak boleh jadi koordinator sekaligus verifikator di MK yang sama, dst.) hanya dijaga kode aplikasi di lingkungan non-Postgres (mis. SQLite untuk testing).
- **Pola pagination tidak konsisten:** 3 implementasi berbeda tersebar di 9 file (`dangerouslySetInnerHTML` dengan label Laravel vs ikon Chevron vs komponen `<Link>` Inertia). Tidak digabungkan karena berdampak visual pada banyak halaman sekaligus.
- **Komponen `Modal` generik** ditulis ulang di 5 file dengan struktur serupa (bukan identik — ada variasi `maxWidth` & sedikit styling). Tidak digabungkan pada pembersihan kali ini karena butuh verifikasi lebih rinci per file.

---

## 5. Verifikasi

- `php artisan test` → **33 passed (138 assertions)**, dijalankan setelah seluruh perubahan backend.
- `php -l` pada seluruh file backend yang diubah → tidak ada syntax error.
- `npm run build` (frontend) → sukses tanpa error, dijalankan dua kali (setelah konsolidasi Toast/StatCard, dan setelah konsolidasi date helpers).
- Tidak ada perubahan pada alur bisnis, aturan otorisasi, atau tampilan — seluruh konsolidasi bersifat refactor murni (kode identik dipindah ke satu sumber).
