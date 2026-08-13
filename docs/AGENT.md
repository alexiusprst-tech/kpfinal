Agent Instructions — Sistem Informasi Verifikasi Soal

1. Identitas Project

Nama project:

Sistem Informasi Verifikasi Soal

Tujuan utama:

Membangun aplikasi web untuk mengelola proses pengunggahan, penugasan, verifikasi, revisi, monitoring, import/export data akademik, dan pembuatan Berita Acara.

Stack utama:

Laravel 8.x

PHP 8.2

Inertia.js

PostgreSQL

Tailwind CSS

Vite

Laravel Eloquent

Laravel Authentication

Laravel Policies/Gates

Gunakan dokumentasi berikut sebagai sumber acuan:

PRD.md
DATABASE.md
SCHEMA.md
API.md
ARCHITECTURE.md
DESIGN.md
RULES.md
README.md

Jika terdapat konflik antar dokumentasi, prioritaskan:

1. DATABASE.md / SCHEMA.md
2. PRD.md
3. RULES.md
4. ARCHITECTURE.md
5. API.md
6. DESIGN.md
7. README.md

Jangan melakukan perubahan besar berdasarkan asumsi.

2. Peran Agent

Agent bertugas sebagai software engineer yang membangun aplikasi secara bertahap.

Agent harus:

Memahami struktur project sebelum mengubah kode.

Mengikuti dokumentasi project.

Menjaga konsistensi arsitektur.

Mengutamakan keamanan.

Mengutamakan maintainability.

Menggunakan reusable components.

Menghindari duplikasi kode.

Tidak membuat fitur di luar scope tanpa instruksi.

Tidak mengganti teknologi utama tanpa instruksi.

Agent bukan hanya membuat UI.

Setiap fitur harus mempertimbangkan:

Database
↓
Model
↓
Authorization
↓
Validation
↓
Controller
↓
Route
↓
Inertia Page
↓
UI Component
↓
Testing

3. Aturan Utama

3.1 Jangan Mengubah Requirement Secara Sepihak

Jangan:

Menghapus fitur.

Mengubah workflow.

Mengubah role.

Mengubah struktur database.

Mengubah business rule.

Mengganti stack.

tanpa instruksi eksplisit.

Jika terdapat masalah teknis, cari solusi yang mempertahankan requirement.

4. Role Sistem

Sistem memiliki tiga role:

SUPER_ADMIN
KOORDINATOR
VERIFIKATOR

Super Admin

Email development:

admin@telkomuniversity.ac.id

Tanggung jawab:

Master data.

Periode.

Penugasan.

Monitoring.

Import/export.

Berita Acara.

Audit.

Koordinator

Email development:

dosenmk@telkomuniversity.ac.id

Tanggung jawab:

Mengelola soal sesuai penugasan.

Upload soal.

Melihat hasil verifikasi.

Upload revisi.

Submit ulang.

Verifikator

Email development:

dosenverif@telkomuniversity.ac.id

Tanggung jawab:

Melihat soal yang ditugaskan.

Review soal.

Approve.

Request revision.

Reject.

5. Authorization

Authorization wajib diterapkan di backend.

Jangan hanya menyembunyikan menu menggunakan frontend.

Setiap action sensitif harus memiliki pemeriksaan:

User authenticated?
↓
User active?
↓
Role allowed?
↓
Has assignment?
↓
Period valid?
↓
Resource accessible?
↓
Action allowed?

Gunakan:

Middleware.

Policies.

Gates.

Form Request authorization.

Jangan mempercayai:

role dari request.

user_id dari frontend.

mata_kuliah_id dari input tanpa validasi.

periode_id dari frontend tanpa pemeriksaan.

status yang dikirim client.

Ambil identitas user dari authenticated session.

6. Database

Database utama:

PostgreSQL

Gunakan schema yang sudah didefinisikan.

Jangan membuat tabel duplicate.

Relasi penting:

Mata Kuliah
 ├── many-to-many PLO
 └── many-to-many CLO

CLO
 └── many-to-many PLO

Periode
 ├── Koordinator
 └── Verifikator

Mata Kuliah + Periode
 └── Koordinator

Mata Kuliah + Periode
 └── Verifikator

Soal
 ├── Mata Kuliah
 ├── Periode
 ├── Kategori
 └── User uploader

Soal
 └── Revisi

Soal
 └── Verifikasi

Jangan menghapus histori hanya untuk mengganti data aktif.

7. Workflow Soal

Workflow wajib dipertahankan:

DRAFT
  ↓
SUBMITTED
  ↓
IN_REVIEW
  ↓
APPROVED

atau:

IN_REVIEW
  ↓
REVISION
  ↓
RESUBMITTED
  ↓
IN_REVIEW

atau:

IN_REVIEW
  ↓
REJECTED

Jangan mengizinkan transisi status yang tidak valid.

Contoh:

DRAFT → APPROVED

tidak diperbolehkan.

Status harus berubah melalui workflow yang benar.

8. Periode

Semua proses soal harus terkait periode.

Status periode:

DRAFT
ACTIVE
INACTIVE
CLOSED

Aturan:

DRAFT belum digunakan untuk proses aktif.

ACTIVE dapat digunakan.

INACTIVE tidak digunakan untuk aktivitas aktif.

CLOSED tidak menerima aktivitas baru.

Upload soal harus memeriksa:

periode status
deadline upload
penugasan user
mata kuliah

9. Koordinator

Super Admin dapat menetapkan Koordinator berdasarkan:

Mata Kuliah + Periode

Satu kombinasi:

Mata Kuliah + Periode

hanya memiliki satu Koordinator berdasarkan constraint database.

Jika Koordinator lama berakhir:

Koordinator lama
↓
ENDED
↓
Super Admin memilih dosen baru
↓
Koordinator baru
↓
ACTIVE

Jangan menghapus penugasan lama.

Histori harus tetap tersedia.

10. Verifikator

Verifikator hanya dapat memproses soal sesuai penugasan.

Sebelum verifikasi:

Check assignment
Check period
Check soal status
Check user role

Hasil verifikasi:

APPROVED
REVISION
REJECTED

Verifikator harus dapat memberikan catatan.

11. Revisi

Setiap revisi harus membuat record baru.

Gunakan version:

1
2
3
...

Jangan overwrite histori file sebelumnya.

Pastikan:

UNIQUE(soal_id, version)

tetap dihormati.

12. Upload File

Validasi minimal:

Extension.

MIME type.

File size.

Nama file.

User authorization.

Periode.

Mata Kuliah.

Jangan menyimpan file tanpa validasi.

Jangan menggunakan nama file user secara langsung sebagai path tanpa sanitasi.

Gunakan storage abstraction Laravel.

Jangan mengakses file sensitif secara bebas melalui public URL jika file tersebut membutuhkan authorization.

13. PLO, CLO, Mata Kuliah

Sistem wajib mendukung:

1 Mata Kuliah → banyak PLO
1 Mata Kuliah → banyak CLO
1 CLO → banyak PLO
1 PLO → banyak CLO

Gunakan pivot table yang sudah tersedia.

Jangan membuat kolom seperti:

plo_1
plo_2
plo_3

atau:

clo_1
clo_2

Relasi harus tetap normalized.

14. Import Excel

Import PLO dan CLO menggunakan Excel.

Alur:

Download Template
↓
User mengisi Excel
↓
Upload
↓
Validasi
↓
Preview/processing
↓
Import
↓
Import Log
↓
Result

Hasil:

SUCCESS
FAILED
PARTIAL

Jika sebagian data gagal, jangan membuat sistem menganggap seluruh data sukses.

Tampilkan:

Total rows.

Success rows.

Failed rows.

Error summary.

15. Export

Export digunakan untuk:

PLO.

CLO.

Mata Kuliah jika tersedia.

Data laporan sesuai kebutuhan.

Export harus menggunakan data database aktual.

Jangan membuat file berdasarkan data hardcoded.

16. Inertia.js

Gunakan Inertia sebagai bridge antara Laravel dan frontend.

Jangan membuat SPA architecture terpisah jika tidak diperlukan.

Prinsip:

Laravel Route
↓
Controller
↓
Inertia::render()
↓
Page Component

Gunakan props yang jelas.

Contoh konsep:

return Inertia::render('SuperAdmin/Dashboard', [
    'statistics' => $statistics,
    'recentActivities' => $recentActivities,
]);

Frontend tidak boleh menjadi sumber kebenaran business logic.

17. Controller

Controller harus tetap tipis.

Hindari controller yang terlalu besar.

Jika business logic kompleks:

Service.

Action.

Policy.

Form Request.

Query scope.

dapat digunakan sesuai kebutuhan.

Contoh struktur:

app/
├── Actions/
├── Http/
│   ├── Controllers/
│   └── Requests/
├── Models/
├── Policies/
└── Services/

Jangan membuat abstraction berlebihan untuk logic sederhana.

18. Validation

Gunakan Form Request untuk validasi kompleks.

Validasi harus dilakukan server-side.

Contoh:

required
string
max
exists
unique
file
mimes
max
date

Validasi harus sesuai business rule.

Jangan hanya mengandalkan HTML validation.

19. Eloquent

Gunakan Eloquent relationships.

Contoh:

User
Dosen
TahunAjaran
PeriodeVerifikasi
MataKuliah
PLO
CLO
KategoriSoal
PenugasanKoordinator
PenugasanVerifikator
Soal
RevisiSoal
Verifikasi
BeritaAcara
ImportLog
AuditLog

Hindari N+1 query.

Gunakan eager loading jika dibutuhkan.

Contoh:

Soal::with([
    'mataKuliah',
    'periode',
    'kategori',
    'uploadedBy',
]);

20. Dashboard

Dashboard harus menggunakan data real.

Jangan menggunakan:

const totalSoal = 125;

Gunakan data dari backend.

Super Admin:

Total Dosen.

Total Mata Kuliah.

Total PLO.

Total CLO.

Total Soal.

Approved.

Revision.

Rejected.

Pending.

Active Period.

Koordinator:

Assigned courses.

Total soal.

Pending verification.

Revision.

Approved.

Rejected.

Verifikator:

Assigned questions.

Waiting review.

Approved.

Revision.

Rejected.

21. UI/UX

Tema utama:

Merah + Putih

Prinsip:

Professional.

Clean.

Modern.

Minimal.

Consistent.

Responsive.

Gunakan red sebagai primary action/branding.

White sebagai primary surface.

Gunakan warna status secara konsisten:

Approved  → green
Revision  → orange
Rejected  → red
Pending   → yellow/orange
Info      → blue

Jangan menggunakan terlalu banyak warna dekoratif.

22. Component Reusability

Gunakan reusable components untuk:

Button.

Input.

Select.

Modal.

Dialog.

Table.

Badge.

Card.

Dropdown.

Pagination.

Search.

Filter.

Empty State.

Loading State.

Error State.

Confirmation Dialog.

Toast/Notification.

Jangan membuat komponen duplikat untuk fungsi yang sama.

23. UX State

Setiap halaman data harus memiliki:

Loading

Menampilkan loading state saat request berjalan.

Empty

Contoh:

Belum ada data.

Berikan action jika relevan.

Error

Tampilkan pesan yang mudah dipahami.

Success

Gunakan toast/feedback setelah:

Create.

Update.

Delete.

Import.

Export.

Upload.

Verification.

Confirmation

Action destruktif harus memiliki confirmation.

24. Search & Filter

List besar harus mendukung:

Search.

Filter.

Pagination.

Gunakan server-side query untuk dataset besar.

Jangan mengambil seluruh tabel ke frontend jika tidak diperlukan.

25. Audit Log

Aktivitas kritis harus dicatat.

Contoh:

CREATE
UPDATE
DELETE
LOGIN
LOGOUT
IMPORT
EXPORT
UPLOAD_SOAL
UPLOAD_REVISI
VERIFY
ASSIGN_KOORDINATOR
ASSIGN_VERIFIKATOR
CHANGE_PERIOD_STATUS

Simpan:

User.

Action.

Entity.

Entity ID.

Old values.

New values.

IP.

User Agent.

Timestamp.

26. Error Handling

Jangan menampilkan stack trace kepada user pada production.

Gunakan:

Validation errors.

Authorization errors.

Not found.

Business rule errors.

Generic server errors.

Error harus informatif tetapi tidak membocorkan informasi sensitif.

27. Security

Wajib:

Password hashing.

CSRF.

Authorization.

Input validation.

File validation.

SQL injection protection melalui Eloquent/query builder.

XSS protection.

Secure session.

Route protection.

Policy.

Audit log.

Jangan:

Hardcode password production.

Hardcode secret.

Menyimpan credential di frontend.

Mempercayai role dari client.

Membuka semua file melalui public path.

Menonaktifkan security middleware untuk mempermudah development.

28. Seeder

Development account:

admin@telkomuniversity.ac.id
dosenmk@telkomuniversity.ac.id
dosenverif@telkomuniversity.ac.id

Seeder harus:

Idempotent.

Aman dijalankan ulang.

Menggunakan password hash.

Membuat relasi Dosen untuk akun dosen.

Tidak membuat duplicate user.

Gunakan firstOrCreate/updateOrCreate sesuai kebutuhan.

29. Testing

Fitur penting harus memiliki test.

Minimal:

Authentication

Login valid.

Login invalid.

Inactive user ditolak.

Authorization

Super Admin dapat mengakses admin.

Koordinator tidak dapat mengakses admin.

Verifikator tidak dapat mengakses admin.

Soal

Upload sesuai penugasan.

Upload di luar penugasan ditolak.

Submit.

Verification.

Revision.

Resubmit.

Assignment

Koordinator dapat ditetapkan.

Tidak boleh duplicate untuk MK + periode.

Koordinator lama dapat berakhir.

Import

Excel valid berhasil.

Excel invalid ditolak.

Partial import tercatat.

30. Git

Gunakan commit yang jelas.

Contoh:

feat: add super admin dashboard
feat: add question upload workflow
feat: add coordinator assignment
fix: prevent duplicate coordinator assignment
fix: validate question upload deadline
refactor: extract verification service
docs: update schema documentation

Jangan membuat commit dengan pesan:

update
fix
test
asdf

untuk perubahan penting.

31. File Organization

Gunakan struktur yang konsisten.

Contoh:

app/
├── Http/
│   ├── Controllers/
│   └── Requests/
├── Models/
├── Policies/
├── Services/
└── Actions/

resources/
├── js/
│   ├── Components/
│   ├── Layouts/
│   ├── Pages/
│   │   ├── SuperAdmin/
│   │   ├── Koordinator/
│   │   └── Verifikator/
│   └── app.js

Gunakan PascalCase untuk component/page React/Vue.

32. Development Process

Sebelum mengimplementasikan fitur:

Step 1

Baca dokumentasi terkait.

Step 2

Periksa database/model yang sudah ada.

Step 3

Periksa route/controller yang sudah ada.

Step 4

Periksa component yang dapat digunakan kembali.

Step 5

Implementasikan backend.

Step 6

Implementasikan Inertia page.

Step 7

Implementasikan UI.

Step 8

Implementasikan authorization.

Step 9

Implementasikan validation.

Step 10

Test.

Step 11

Periksa regression.

Step 12

Update dokumentasi jika diperlukan.

33. Jangan Membuat Fake Implementation

Dilarang membuat fitur terlihat bekerja menggunakan:

fake data
hardcoded statistics
fake API response
setTimeout()
dummy JSON
static table

kecuali secara eksplisit diminta untuk prototype.

Jika database sudah tersedia, gunakan database.

34. Jangan Overengineering

Jangan membuat:

Service untuk logic satu baris.

Repository layer tanpa kebutuhan.

Abstraction berlebihan.

Generic CRUD framework.

Komponen yang terlalu kompleks.

Gunakan solusi paling sederhana yang tetap maintainable.

35. Perubahan Database

Jika fitur membutuhkan perubahan database:

Periksa DATABASE.md.

Periksa SCHEMA.md.

Tentukan perubahan.

Buat migration.

Update model.

Update dokumentasi.

Test migration.

Test rollback jika relevan.

Jangan mengedit database production secara manual dari application code.

36. Definition of Done

Fitur dianggap selesai jika:

Backend selesai.

Database sesuai.

Authorization selesai.

Validation selesai.

Inertia page selesai.

UI konsisten.

Loading state tersedia.

Empty state tersedia.

Error state tersedia.

Success feedback tersedia.

Testing dilakukan.

Tidak ada hardcoded business data.

Tidak ada error console yang tidak ditangani.

Tidak merusak fitur existing.

37. Prioritas Implementasi

Implementasikan dengan urutan:

Phase 1
Foundation
↓
Authentication
↓
Role Authorization
↓
Layout
↓
Database Models

Phase 2
Master Data
↓
Dosen
↓
Mata Kuliah
↓
PLO
↓
CLO
↓
Kategori Soal
↓
Import/Export

Phase 3
Periode
↓
Tahun Ajaran
↓
Periode Verifikasi
↓
Koordinator
↓
Verifikator

Phase 4
Question Workflow
↓
Upload
↓
Submit
↓
Review
↓
Revision
↓
Resubmit
↓
Approval/Rejection

Phase 5
Reporting
↓
Dashboard
↓
Monitoring
↓
Berita Acara
↓
Audit Log

Phase 6
Quality
↓
Testing
↓
Security
↓
Performance
↓
Responsive
↓
UI Consistency

38. Final Instruction

Saat menerima instruksi baru dari user:

Pahami requirement.

Cek dokumentasi.

Cek implementation existing.

Jangan menghapus fitur existing tanpa alasan.

Gunakan database real.

Ikuti role authorization.

Ikuti workflow.

Gunakan reusable component.

Pertahankan UI merah-putih.

Test perubahan.

Laporkan file yang diubah.

Laporkan jika ada dependency atau migration yang diperlukan.

Jika requirement user bertentangan dengan database atau business rule:

Jangan diam-diam mengubah.

Identifikasi konflik.

Pilih solusi yang paling aman dan konsisten.

Jika perubahan requirement memang diperlukan, update dokumentasi terkait.

Target akhir: aplikasi siap digunakan, bukan sekadar mockup UI.
