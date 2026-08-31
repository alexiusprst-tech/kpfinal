Versi: 1.0Status: DevelopmentPlatform: Web ApplicationBackend: Laravel 8.x + PHP 8.2Frontend: Inertia.jsDatabase: PostgreSQLUI: Red & White, clean, modern, professionalTarget Implementasi: Antigravity

1. Ringkasan Produk

Sistem Informasi Verifikasi Soal adalah aplikasi berbasis web untuk mengelola proses pengunggahan, penugasan, verifikasi, revisi, pemantauan status, dan pembuatan berita acara soal secara terstruktur.

Sistem memiliki tiga role utama:

Super Admin

Koordinator MK / Dosen MK

Dosen Verifikator

Sistem harus mendukung proses akademik berbasis periode verifikasi. Setiap periode dapat memiliki penugasan Koordinator MK dan Verifikator yang berbeda.

Aplikasi menggunakan Laravel sebagai backend, Inertia.js sebagai penghubung server-side Laravel dengan frontend, dan PostgreSQL sebagai database.

2. Tujuan Produk

2.1 Tujuan Utama

Membangun sistem terpusat untuk:

Mengelola master data akademik.

Mengelola periode verifikasi soal.

Menetapkan Koordinator MK.

Menetapkan Dosen Verifikator.

Mengunggah soal.

Mengelola revisi soal.

Melakukan verifikasi soal.

Memberikan catatan verifikasi.

Memantau status verifikasi.

Menghasilkan Berita Acara.

Mengelola PLO, CLO, dan Mata Kuliah melalui import/export Excel.

Menyediakan dashboard monitoring.

Menyimpan audit aktivitas pengguna.

2.2 Tujuan Bisnis

Sistem diharapkan:

Mengurangi proses manual.

Mengurangi penggunaan dokumen terpisah.

Meminimalkan kesalahan pencatatan.

Memperjelas tanggung jawab setiap role.

Mempermudah monitoring progres verifikasi.

Menyediakan histori aktivitas.

Mempermudah pembuatan laporan dan berita acara.

3. Scope Produk

3.1 In Scope

Fitur yang wajib tersedia:

Authentication.

Authorization berdasarkan role.

Dashboard.

Manajemen Dosen.

Manajemen Mata Kuliah.

Manajemen PLO.

Manajemen CLO.

Manajemen Kategori Soal.

Manajemen Tahun Ajaran.

Manajemen Periode Verifikasi.

Penetapan Koordinator MK.

Penetapan Dosen Verifikator.

Upload soal.

Download soal.

Upload revisi soal.

Histori revisi.

Verifikasi soal.

Catatan verifikasi.

Status soal.

Monitoring status verifikasi.

Berita Acara.

Import Excel.

Export Excel.

Import log.

Audit log.

Notifikasi/status informasi yang relevan.

Seeder akun demo/development.

3.2 Out of Scope

Untuk versi awal, sistem tidak mencakup:

Mobile application native.

Integrasi SSO kampus.

Integrasi sistem akademik eksternal.

Penilaian mahasiswa.

Bank soal untuk mahasiswa.

Online examination.

Pembuatan soal langsung di browser.

AI-generated questions.

4. User Roles

4.1 Super Admin

Super Admin merupakan pengelola utama sistem.

Hak akses

Melihat dashboard.

Mengelola Dosen.

Mengelola Mata Kuliah.

Mengelola PLO.

Mengelola CLO.

Mengelola Kategori Soal.

Mengelola Tahun Ajaran.

Mengelola Periode Verifikasi.

Menetapkan Koordinator MK.

Menetapkan Verifikator.

Mengakhiri penugasan.

Mengubah status periode.

Melihat seluruh soal.

Melihat seluruh status verifikasi.

Melihat histori aktivitas.

Melihat import log.

Generate/download laporan.

Mengelola data melalui import/export.

Mengelola akun pengguna sesuai kewenangan sistem.

Akun development

Email:

admin@telkomuniversity.ac.id

Role:

SUPER_ADMIN

5. Koordinator MK / Dosen MK

Koordinator MK adalah dosen yang ditunjuk Super Admin untuk menangani satu Mata Kuliah pada periode tertentu.

Hak akses

Login.

Melihat dashboard sesuai penugasan.

Melihat Mata Kuliah yang menjadi tanggung jawab.

Mengunggah soal.

Mengunduh template soal jika tersedia.

Mengunggah revisi soal.

Melihat status verifikasi soal.

Melihat catatan dari Verifikator.

Memperbaiki soal berdasarkan catatan.

Mengirim ulang soal setelah revisi.

Melihat histori revisi.

Melihat/generate Berita Acara sesuai kewenangan.

Akun development

Email:

dosenmk@telkomuniversity.ac.id

Role:

KOORDINATOR

6. Dosen Verifikator

Verifikator bertanggung jawab melakukan pemeriksaan terhadap soal yang telah dikirim.

Hak akses

Login.

Melihat dashboard verifikasi.

Melihat soal yang ditugaskan.

Download soal.

Melakukan verifikasi.

Memberikan catatan.

Menentukan hasil:

Approved

Revision

Rejected

Melihat histori verifikasi.

Melihat status soal yang pernah diverifikasi.

Akun development

Email:

dosenverif@telkomuniversity.ac.id

Role:

VERIFIKATOR

7. Authentication & Authorization

7.1 Authentication

Sistem menggunakan authentication Laravel.

Minimal fitur:

Login.

Logout.

Session authentication.

Password hashing.

Remember me.

Email verification jika diaktifkan.

Proteksi route.

7.2 Authorization

Akses halaman dan aksi harus diperiksa berdasarkan:

Role pengguna.

Status akun.

Periode aktif.

Penugasan pengguna.

Kepemilikan/akses terhadap Mata Kuliah.

Status soal.

Jangan hanya mengandalkan pembatasan pada UI. Semua endpoint/controller wajib memiliki authorization server-side.

8. Master Data

8.1 Dosen

Data minimal:

Kode Dosen.

Nama Lengkap.

Email.

User Account.

Status.

Fitur:

List.

Search.

Filter.

Create.

Edit.

Activate/deactivate.

Detail.

8.2 Mata Kuliah

Data:

Kode MK.

Nama MK.

SKS.

Status.

Relasi:

Satu Mata Kuliah dapat memiliki banyak PLO.

Satu Mata Kuliah dapat memiliki banyak CLO.

Satu CLO dapat terhubung dengan banyak PLO.

8.3 PLO

Data:

Kode PLO.

Deskripsi.

Fitur:

Create.

Edit.

Delete/soft delete.

Import Excel.

Export Excel.

Search.

Alur Import PLO

Super Admin membuka halaman PLO.

Klik Download Template.

Sistem menyediakan file Excel template.

Super Admin mengisi data secara manual.

File Excel di-upload.

Sistem melakukan validasi.

Data valid diproses.

Import log dibuat.

Sistem menampilkan hasil import.

Super Admin dapat export data PLO.

8.4 CLO

Data:

Kode CLO.

Deskripsi.

Alur import/export sama dengan PLO.

Relasi penting

Satu Mata Kuliah dapat memiliki lebih dari satu CLO.

8.5 Relasi PLO dan CLO

Sistem harus mendukung:

Satu Mata Kuliah → banyak PLO.

Satu Mata Kuliah → banyak CLO.

Satu CLO → banyak PLO.

Satu PLO → banyak CLO.

Relasi menggunakan tabel pivot:

mata_kuliah_plo

mata_kuliah_clo

clo_plo

9. Tahun Ajaran

Super Admin dapat:

Membuat Tahun Ajaran.

Mengubah Tahun Ajaran.

Mengaktifkan/nonaktifkan.

Melihat daftar Tahun Ajaran.

Contoh:

2026/2027

Validasi:

tahun_selesai = tahun_mulai + 1

10. Periode Verifikasi

Periode merupakan dasar seluruh proses verifikasi.

Data:

Tahun Ajaran.

Nama periode.

Tanggal mulai.

Tanggal selesai.

Deadline upload.

Status.

Status:

DRAFT

ACTIVE

INACTIVE

CLOSED

Aturan

Hanya periode ACTIVE yang dapat digunakan untuk proses aktif.

Periode CLOSED tidak dapat menerima aktivitas baru.

Deadline upload harus diperhatikan ketika upload soal.

Super Admin dapat mengakhiri periode.

Ketika periode berakhir, penugasan terkait dapat berstatus ENDED.

11. Penetapan Koordinator MK

Super Admin dapat menunjuk Koordinator MK.

Penugasan memiliki:

Dosen.

Mata Kuliah.

Periode.

Tanggal mulai.

Tanggal selesai.

Status.

User yang menetapkan.

Business Rule

Untuk satu:

Mata Kuliah + Periode

hanya boleh memiliki satu Koordinator aktif berdasarkan constraint database.

Pergantian Koordinator

Jika masa penugasan Koordinator telah habis:

Penugasan lama berstatus ENDED.

Super Admin dapat memilih dosen lain.

Super Admin menetapkan dosen tersebut sebagai Koordinator baru.

Sistem menyimpan histori penugasan sebelumnya.

Penugasan baru memiliki periode/tanggal penugasan yang sesuai.

Sistem tidak boleh menghapus histori penugasan lama hanya karena terjadi pergantian Koordinator.

12. Penetapan Verifikator

Super Admin dapat menetapkan Verifikator untuk:

Mata Kuliah.

Periode.

Data penugasan:

Dosen.

Mata Kuliah.

Periode.

Status.

Tanggal mulai.

Tanggal selesai.

Assigned by.

Satu Mata Kuliah dapat memiliki lebih dari satu Verifikator jika dibutuhkan.

13. Upload Soal

Koordinator hanya dapat upload soal untuk Mata Kuliah yang menjadi tanggung jawabnya.

Data soal:

Mata Kuliah.

Periode.

Kategori Soal.

Judul.

Nama File.

File Path.

MIME Type.

File Size.

Uploaded By.

Status.

Status awal:

DRAFT

Setelah dikirim:

SUBMITTED

Kemudian:

IN_REVIEW

14. Workflow Verifikasi

Workflow utama:

DRAFT
  ↓
SUBMITTED
  ↓
IN_REVIEW
  ↓
┌───────────────┬──────────────┐
↓               ↓              ↓
APPROVED     REVISION       REJECTED
                ↓
           RESUBMITTED
                ↓
           IN_REVIEW

14.1 Approved

Soal dinyatakan lolos verifikasi.

14.2 Revision

Soal membutuhkan perbaikan.

Verifikator wajib dapat memberikan catatan revisi.

14.3 Rejected

Soal ditolak.

Catatan dapat diberikan oleh Verifikator.

15. Revisi Soal

Setiap revisi harus disimpan sebagai histori.

Data:

Soal.

Version.

Nama file.

File path.

MIME type.

File size.

Catatan.

Uploaded by.

Uploaded at.

Contoh:

Version 1
Version 2
Version 3

Sistem tidak boleh menimpa file revisi sebelumnya.

16. Verifikasi Soal

Verifikator dapat memilih:

APPROVED

REVISION

REJECTED

Verifikasi menyimpan:

Soal.

Verifikator.

Action.

Catatan.

Timestamp.

Setiap aktivitas verifikasi harus tercatat.

17. Berita Acara

Sistem menyediakan fitur Berita Acara untuk hasil verifikasi.

Data minimal:

Nomor.

Periode.

Mata Kuliah.

Koordinator.

Dibuat oleh.

Jumlah soal.

Jumlah approved.

Jumlah revision.

Jumlah rejected.

Tanggal.

File berita acara.

Sistem harus dapat menghasilkan/download dokumen berita acara.

18. Import & Export Excel

18.1 Data yang Didukung

Minimal:

PLO.

CLO.

Mata Kuliah jika fitur import MK diaktifkan.

18.2 Template

Template harus tersedia dalam format:

.xlsx

Template harus memiliki header yang jelas.

Contoh PLO:

kode_plo

deskripsi

PLO01

Mampu menerapkan ...

Contoh CLO:

kode_clo

deskripsi

CLO01

Mampu memahami ...

18.3 Validasi Import

Sistem harus memvalidasi:

Extension file.

Ukuran file.

Header.

Kolom wajib.

Data kosong.

Duplikasi kode.

Format data.

Relasi jika diperlukan.

Hasil import:

SUCCESS.

FAILED.

PARTIAL.

Semua proses dicatat dalam import_logs.

19. Dashboard Super Admin

Dashboard harus menggunakan desain yang telah ditentukan:

Dominan putih.

Primary red.

Navy/dark text.

Card modern.

Rounded corners.

Clean spacing.

Responsive.

Sidebar merah.

Content background abu-abu sangat terang.

KPI

Minimal:

Total Dosen.

Total Mata Kuliah.

Total PLO.

Total CLO.

Total Bank Soal.

Progress Verifikasi.

Menunggu.

Revisi.

Disetujui.

Ditolak.

Informasi tambahan

Periode aktif.

Notifikasi.

Tren verifikasi.

Perhatian.

Aktivitas terbaru.

Dashboard harus mengambil data nyata dari database, bukan hardcoded.

20. Dashboard Koordinator

Menampilkan:

Mata Kuliah yang ditugaskan.

Periode aktif.

Jumlah soal.

Menunggu verifikasi.

Revisi.

Disetujui.

Ditolak.

Soal yang membutuhkan tindakan.

Histori upload/revisi.

21. Dashboard Verifikator

Menampilkan:

Jumlah soal yang ditugaskan.

Menunggu verifikasi.

Sedang direview.

Approved.

Revision.

Rejected.

Daftar soal yang harus diverifikasi.

Aktivitas verifikasi terakhir.

22. Audit Log

Aktivitas penting harus dicatat.

Contoh:

Login.

Logout.

Create.

Update.

Delete.

Import.

Export.

Upload soal.

Upload revisi.

Verifikasi.

Penetapan Koordinator.

Penetapan Verifikator.

Perubahan periode.

Data audit:

User.

Action.

Entity type.

Entity ID.

Old values.

New values.

IP.

User agent.

Timestamp.

23. UI/UX Requirements

23.1 Design System

Gunakan:

Red sebagai warna utama.

White sebagai warna dasar.

Navy/dark text.

Light gray background.

Green untuk Approved.

Orange/yellow untuk Revision/Pending.

Red untuk Rejected.

Blue untuk informasi.

23.2 Prinsip

Clean.

Minimalis.

Profesional.

Konsisten.

Tidak terlalu banyak dekorasi.

Fokus pada data.

Responsive.

Accessible.

Reusable components.

23.3 Layout

Desktop:

┌──────────────┬─────────────────────────────┐
│   Sidebar    │ Header                      │
│              ├─────────────────────────────┤
│ Navigation   │ Page Content                │
│              │                             │
│              │                             │
└──────────────┴─────────────────────────────┘

Sidebar:

Logo sistem.

Dashboard.

Master Data.

Periode.

Penugasan.

Monitoring.

Laporan.

Logout.

Menu harus berubah sesuai role.

24. Teknologi

Backend

Laravel 8.x.

PHP 8.2.

Laravel Eloquent.

Laravel Authentication.

Form Request Validation.

Policies/Gates.

Storage.

Queues jika dibutuhkan.

Frontend

Inertia.js.

React atau Vue sesuai implementasi project.

Tailwind CSS.

Reusable UI components.

Chart library untuk dashboard jika diperlukan.

Database

PostgreSQL.

UUID primary keys.

PostgreSQL ENUM.

JSONB untuk audit/error metadata.

File

Public/storage atau Laravel Storage sesuai kebutuhan.

File soal.

File revisi.

Template Excel.

Export Excel.

Berita acara.

25. Security Requirements

Sistem wajib:

Hash password.

CSRF protection.

Authorization server-side.

Validate uploaded files.

Batasi MIME type.

Batasi ukuran file.

Hindari direct trust terhadap input user.

Gunakan policy untuk akses soal.

Mencegah akses file yang tidak berwenang.

Audit aktivitas kritis.

Menggunakan prepared queries/Eloquent.

Tidak menyimpan password plaintext.

26. Performance Requirements

Target:

Dashboard normal < 2 detik pada dataset development.

Pagination untuk list data.

Search server-side.

Filter server-side.

Hindari N+1 query.

Gunakan eager loading jika diperlukan.

Index database sesuai schema.

File upload tidak memblokir request terlalu lama jika ukuran besar.

27. Responsive Requirements

Sistem harus dapat digunakan pada:

Desktop.

Laptop.

Tablet.

Prioritas utama:

Desktop/Laptop.

Sidebar harus dapat menjadi responsive/collapsible pada layar kecil.

28. Data Integrity

Aturan database harus dihormati.

Contoh:

Email user unique.

Kode dosen unique.

Kode MK unique.

Kode PLO unique.

Kode CLO unique.

Kategori soal unique.

Relasi pivot tidak boleh duplicate.

Satu MK + periode memiliki maksimal satu Koordinator.

Histori revisi memiliki version unik per soal.

Jangan mengubah schema secara sembarangan tanpa memperbarui DATABASE.md dan SCHEMA.md.

29. Seed Development Accounts

Buat akun development berikut:

Role

Email

Super Admin

admin@telkomuniversity.ac.id

Koordinator MK

dosenmk@telkomuniversity.ac.id

Verifikator

dosenverif@telkomuniversity.ac.id

Password development harus dikelola melalui seeder/configuration dan tidak di-hardcode ke frontend.

Untuk environment production, gunakan password baru yang aman.

Akun Koordinator dan Verifikator harus memiliki data Dosen yang sesuai agar fitur penugasan dapat diuji.

30. Acceptance Criteria

Authentication

User dapat login.

User dengan role tidak valid ditolak.

User inactive tidak dapat login.

Logout berfungsi.

Route protected.

Super Admin

Dashboard tampil.

CRUD Dosen.

CRUD Mata Kuliah.

CRUD PLO.

CRUD CLO.

CRUD Kategori Soal.

CRUD Tahun Ajaran.

CRUD Periode.

Penetapan Koordinator.

Penetapan Verifikator.

Import Excel.

Export Excel.

Audit log.

Koordinator

Hanya melihat penugasan sendiri.

Dapat upload soal.

Dapat melihat status.

Dapat melihat catatan.

Dapat upload revisi.

Dapat submit ulang.

Verifikator

Hanya melihat soal yang ditugaskan.

Dapat download soal.

Dapat memberikan catatan.

Dapat approve.

Dapat meminta revisi.

Dapat reject.

Berita Acara

Data statistik sesuai database.

Nomor berita acara unique.

Dokumen dapat dibuat.

Dokumen dapat di-download.

31. Definition of Done

Sebuah fitur dianggap selesai jika:

Database sudah sesuai.

Model tersedia.

Migration tersedia jika menggunakan migration.

Controller tersedia.

Route tersedia.

Authorization tersedia.

Validation tersedia.

Inertia page tersedia.

UI konsisten dengan design system.

Loading state tersedia.

Empty state tersedia.

Error state tersedia.

Success feedback tersedia.

Pagination tersedia jika diperlukan.

Audit log diterapkan untuk aktivitas penting.

Tidak ada hardcoded data untuk data bisnis.

Fitur diuji melalui role yang sesuai.

Dokumentasi diperbarui jika terjadi perubahan arsitektur/schema.

32. Development Priority

Implementasi dilakukan secara bertahap.

Phase 1 — Foundation

Laravel setup.

Inertia setup.

Authentication.

PostgreSQL.

Migration/schema.

Models.

Seeders.

Layout.

Sidebar.

Role authorization.

Phase 2 — Master Data

Dosen.

Mata Kuliah.

PLO.

CLO.

Kategori Soal.

Import/export Excel.

Phase 3 — Periode & Penugasan

Tahun Ajaran.

Periode Verifikasi.

Koordinator.

Verifikator.

Phase 4 — Soal

Upload.

Download.

Submit.

Revision.

Resubmit.

Phase 5 — Verification

Queue/list verification.

Detail soal.

Approved.

Revision.

Rejected.

Catatan.

Phase 6 — Monitoring & Report

Dashboard.

Status monitoring.

Berita Acara.

Audit log.

Activity history.

Phase 7 — Quality

Validation.

Authorization review.

UI consistency.

Responsive.

Performance.

Testing.

Bug fixing.

33. Critical Business Rules

Super Admin adalah pengelola utama sistem.

Koordinator MK ditetapkan berdasarkan Mata Kuliah dan Periode.

Ketika penugasan Koordinator berakhir, Super Admin dapat menetapkan Koordinator baru.

Histori Koordinator lama tetap tersimpan.

Satu Mata Kuliah dapat memiliki lebih dari satu CLO.

Satu Mata Kuliah dapat memiliki lebih dari satu PLO.

Satu CLO dapat memiliki lebih dari satu PLO.

Soal hanya dapat diproses dalam periode yang sesuai.

Upload soal harus memperhatikan deadline.

Verifikator hanya boleh memproses soal yang menjadi tanggung jawabnya.

Hasil verifikasi harus memiliki histori.

Revisi tidak boleh menghapus versi sebelumnya.

Import PLO/CLO menggunakan Excel.

Template Excel harus dapat di-download.

Hasil import harus dicatat.

Data penting tidak boleh dihapus secara permanen jika menggunakan soft delete.

Authorization harus diterapkan pada backend.

Dashboard harus menggunakan data database aktual.

UI tidak boleh memiliki hardcoded business statistics.

Semua perubahan penting harus dapat dilacak melalui audit log.

34. Prinsip Implementasi untuk Antigravity

Saat membangun aplikasi:

Ikuti PRD ini sebagai sumber kebutuhan produk.

Ikuti DATABASE.md untuk database.

Ikuti SCHEMA.md untuk struktur dan relasi.

Jangan membuat tabel baru tanpa alasan yang jelas.

Jangan mengubah nama kolom yang sudah ditentukan tanpa memperbarui dokumentasi.

Jangan membuat fitur di luar scope tanpa instruksi.

Jangan menggunakan mock data setelah database tersedia.

Gunakan data real dari PostgreSQL.

Prioritaskan reusable components.

Prioritaskan authorization server-side.

Prioritaskan clean architecture.

Jangan mengorbankan keamanan demi kecepatan implementasi.

Pertahankan konsistensi UI merah-putih.

Jangan mengubah desain dashboard utama secara sembarangan.

Setiap fitur baru harus mengikuti role dan business rules.

Jika menemukan konflik antara implementasi dan dokumentasi, jangan menebak; dokumentasikan konflik dan pilih solusi yang paling konsisten dengan database serta business rules.

35. Final Product Goal

Produk akhir harus menjadi aplikasi web Sistem Informasi Verifikasi Soal yang:

Profesional.

Stabil.

Aman.

Responsive.

Role-based.

Terintegrasi database PostgreSQL.

Menggunakan Laravel + Inertia.

Mendukung import/export Excel.

Mendukung workflow verifikasi.

Mendukung revisi dan histori.

Mendukung pergantian Koordinator berdasarkan periode.

Menyediakan monitoring real-time/semi real-time sesuai kebutuhan.

Menyediakan laporan dan Berita Acara.

Memiliki UI modern dengan identitas warna merah dan putih.

Siap dikembangkan lebih lanjut tanpa merusak struktur sistem.
