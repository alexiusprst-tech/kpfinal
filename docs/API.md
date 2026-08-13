API & Route Contract — Sistem Informasi Verifikasi Soal

Version: 1.0Status: DevelopmentBackend: Laravel 8.x / PHP 8.2Frontend: Inertia.jsDatabase: PostgreSQLAuthentication: Laravel Authentication / SessionAuthorization: Role Middleware + Policies

1. Purpose

Dokumen ini mendefinisikan kontrak endpoint aplikasi Sistem Informasi Verifikasi Soal.

Karena aplikasi menggunakan Laravel + Inertia.js, endpoint utama digunakan untuk:

Menampilkan halaman Inertia.

Mengirim form.

Melakukan CRUD.

Upload file.

Import Excel.

Export Excel.

Assignment Koordinator.

Assignment Verifikator.

Workflow soal.

Verifikasi soal.

Berita Acara.

Audit dan monitoring.

API internal aplikasi tidak boleh dianggap sebagai public API kecuali secara khusus dinyatakan kemudian.

2. General Conventions

2.1 Base URL

Development:

http://localhost:8000

Production mengikuti konfigurasi APP_URL.

2.2 Authentication

Semua endpoint aplikasi selain authentication membutuhkan:

auth

User harus login terlebih dahulu.

2.3 Authorization

Selain authentication, endpoint harus menggunakan authorization sesuai role:

SUPER_ADMIN
KOORDINATOR
VERIFIKATOR

Authorization tidak boleh hanya dilakukan pada frontend.

Backend wajib melakukan:

Authentication
→ Role Check
→ Policy / Resource Authorization
→ Business Rule

3. Role Matrix

Modul

SUPER_ADMIN

KOORDINATOR

VERIFIKATOR

Dashboard

✓

✓

✓

User

✓

-

-

Dosen

✓

Read sesuai kebutuhan

Read sesuai kebutuhan

Tahun Ajaran

✓

Read

Read

Periode

✓

Read

Read

Mata Kuliah

✓

Read

Read

PLO

✓

Read

Read

CLO

✓

Read

Read

Kategori Soal

✓

Read

Read

Assignment Koordinator

✓

-

-

Assignment Verifikator

✓

-

-

Upload Soal

-

✓

-

Submit Soal

-

✓

-

Revisi Soal

-

✓

-

Verifikasi Soal

-

-

✓

Berita Acara

✓

✓

Read

Import Excel

✓

-

-

Export Excel

✓

-

-

Audit Log

✓

-

-

4. HTTP Methods

Gunakan HTTP method sesuai operasi:

GET       → Read / Page
POST      → Create / Action
PUT       → Full Update
PATCH     → Partial Update
DELETE    → Delete

Untuk workflow action, gunakan POST.

Contoh:

POST /koordinator/soal/{id}/submit
POST /verifikator/soal/{id}/verify
POST /superadmin/penugasan/koordinator

5. Standard HTTP Status Codes

Code

Meaning

Penggunaan

200

OK

Request berhasil

201

Created

Resource berhasil dibuat

204

No Content

Delete berhasil tanpa response body

400

Bad Request

Request tidak valid secara umum

401

Unauthenticated

User belum login

403

Forbidden

User tidak memiliki akses

404

Not Found

Resource tidak ditemukan

409

Conflict

Konflik data/business rule

422

Unprocessable Entity

Validation error

429

Too Many Requests

Rate limit

500

Internal Server Error

Kesalahan server

503

Service Unavailable

Service/database sementara tidak tersedia

402 Payment Required tidak digunakan karena sistem tidak memiliki fitur pembayaran.

6. Standard Validation Response

Untuk request yang gagal validasi:

HTTP 422

Contoh:

{
    "message": "The given data was invalid.",
    "errors": {
        "email": [
            "The email field is required."
        ]
    }
}

Untuk aplikasi Inertia, validation error dikirim melalui mekanisme session/error bag Laravel + Inertia.

7. Authentication

7.1 Login

GET /login
POST /login

Access

Public.

POST Request

email
password
remember

Success

302 Redirect

Redirect ke dashboard berdasarkan role.

Failure

422

7.2 Logout

POST /logout

Access

Authenticated.

Success

302 Redirect /login

8. Current User

GET /profile

Menampilkan profile user.

Access

Authenticated.

PATCH /profile

Update profile.

Access

Authenticated.

Request

name
email

Password harus menggunakan endpoint terpisah.

9. Dashboard API / Inertia Routes

Dashboard bersifat role-specific.

GET /superadmin/dashboard

Role

SUPER_ADMIN

Data

total_dosen
total_mata_kuliah
total_plo
total_clo
total_periode
total_soal
total_approved
total_revision
total_rejected
active_period
recent_activities

GET /koordinator/dashboard

Role

KOORDINATOR

Data

Hanya berdasarkan penugasan user:

assigned_mata_kuliah
total_soal
draft
submitted
in_review
revision
approved
rejected
recent_activity

GET /verifikator/dashboard

Role

VERIFIKATOR

Data

Berdasarkan penugasan:

assigned_mata_kuliah
pending_verification
approved
revision
rejected
recent_verification

10. User Management

User management hanya dapat dilakukan oleh Super Admin.

GET /superadmin/users

List users.

Query

search
role
status
page
per_page

Role

SUPER_ADMIN

POST /superadmin/users

Create user.

Request

name
email
password
role
status

Validation

name       → required|string|max:150
email      → required|email|unique
password   → required
role       → SUPER_ADMIN|KOORDINATOR|VERIFIKATOR
status     → ACTIVE|INACTIVE

GET /superadmin/users/{id}

Show user.

PATCH /superadmin/users/{id}

Update user.

DELETE /superadmin/users/{id}

Delete/deactivate user sesuai aturan sistem.

Super Admin tidak boleh menghapus account yang masih diperlukan oleh audit atau historical records secara destructive.

11. Dosen

GET /superadmin/dosen

List dosen.

Query

search
status
page
per_page

POST /superadmin/dosen

Create dosen.

Request

kode_dosen
nama_lengkap
email
user_id
status

Rules

kode_dosen harus unique.

user_id harus valid jika diberikan.

Satu user hanya boleh terhubung dengan satu dosen.

GET /superadmin/dosen/{id}

Detail dosen.

PATCH /superadmin/dosen/{id}

Update dosen.

DELETE /superadmin/dosen/{id}

Soft delete dosen.

12. Tahun Ajaran

GET /superadmin/tahun-ajaran

List tahun ajaran.

POST /superadmin/tahun-ajaran

Create tahun ajaran.

Request

nama
tahun_mulai
tahun_selesai
status

Rule

tahun_selesai = tahun_mulai + 1

Contoh:

2026/2027
2026 → 2027

GET /superadmin/tahun-ajaran/{id}

Detail.

PATCH /superadmin/tahun-ajaran/{id}

Update.

DELETE /superadmin/tahun-ajaran/{id}

Delete jika tidak memiliki dependency.

13. Periode Verifikasi

GET /superadmin/periode

List periode.

Query

tahun_ajaran_id
status
search
page
per_page

POST /superadmin/periode

Create periode.

Request

tahun_ajaran_id
nama
tanggal_mulai
tanggal_selesai
deadline_upload
status

Rules

tanggal_selesai >= tanggal_mulai
deadline_upload::DATE >= tanggal_mulai

GET /superadmin/periode/{id}

Detail periode.

PATCH /superadmin/periode/{id}

Update periode.

POST /superadmin/periode/{id}/activate

Activate periode.

Role

SUPER_ADMIN

POST /superadmin/periode/{id}/close

Close periode.

Role

SUPER_ADMIN

DELETE /superadmin/periode/{id}

Delete periode hanya jika tidak melanggar dependency database.

14. Mata Kuliah

GET /superadmin/mata-kuliah

List mata kuliah.

Query

search
status
page
per_page

POST /superadmin/mata-kuliah

Create.

Request

kode_mk
nama_mk
sks
status

Validation

kode_mk → required|unique
nama_mk → required|max:200
sks → integer|min:1|max:10

GET /superadmin/mata-kuliah/{id}

Detail.

PATCH /superadmin/mata-kuliah/{id}

Update.

DELETE /superadmin/mata-kuliah/{id}

Soft delete.

15. PLO

GET /superadmin/plo

List PLO.

Query

search
page
per_page

POST /superadmin/plo

Create PLO.

Request

kode_plo
deskripsi

GET /superadmin/plo/{id}

Detail PLO.

PATCH /superadmin/plo/{id}

Update PLO.

DELETE /superadmin/plo/{id}

Soft delete PLO.

16. CLO

GET /superadmin/clo

List CLO.

POST /superadmin/clo

Create CLO.

Request

kode_clo
deskripsi

GET /superadmin/clo/{id}

Detail CLO.

PATCH /superadmin/clo/{id}

Update CLO.

DELETE /superadmin/clo/{id}

Soft delete CLO.

17. Relasi Mata Kuliah ↔ PLO

Satu Mata Kuliah dapat memiliki lebih dari satu PLO.

GET /superadmin/mata-kuliah/{id}/plo

List PLO yang terhubung.

POST /superadmin/mata-kuliah/{id}/plo

Assign PLO.

Request

plo_id

Rule

Duplikasi kombinasi:

mata_kuliah_id + plo_id

tidak diperbolehkan.

DELETE /superadmin/mata-kuliah/{id}/plo/{ploId}

Remove relation.

18. Relasi Mata Kuliah ↔ CLO

Satu Mata Kuliah dapat memiliki lebih dari satu CLO.

GET /superadmin/mata-kuliah/{id}/clo

List CLO.

POST /superadmin/mata-kuliah/{id}/clo

Assign CLO.

Request

clo_id

DELETE /superadmin/mata-kuliah/{id}/clo/{cloId}

Remove relation.

19. Relasi CLO ↔ PLO

Satu CLO dapat terhubung ke satu atau lebih PLO.

Satu PLO juga dapat terhubung ke banyak CLO.

GET /superadmin/clo/{id}/plo

List PLO untuk CLO.

POST /superadmin/clo/{id}/plo

Assign PLO.

Request

plo_id

DELETE /superadmin/clo/{id}/plo/{ploId}

Remove relation.

20. Kategori Soal

GET /superadmin/kategori-soal

List kategori.

POST /superadmin/kategori-soal

Create.

Request

nama
deskripsi
status

GET /superadmin/kategori-soal/{id}

Detail.

PATCH /superadmin/kategori-soal/{id}

Update.

DELETE /superadmin/kategori-soal/{id}

Soft delete.

21. Assignment Koordinator

Assignment Koordinator dikelola oleh Super Admin.

GET /superadmin/penugasan/koordinator

List assignment.

Query

periode_id
mata_kuliah_id
dosen_id
status
page
per_page

POST /superadmin/penugasan/koordinator

Assign Koordinator.

Request

dosen_id
mata_kuliah_id
periode_id
tanggal_mulai
tanggal_selesai

Rules

Dosen harus valid.

Mata Kuliah harus valid.

Periode harus valid.

Periode harus memungkinkan assignment.

Kombinasi:

mata_kuliah_id + periode_id

hanya boleh memiliki satu Koordinator aktif berdasarkan constraint database.6. assigned_by diambil dari authenticated user.7. Assignment harus dibuat dalam transaction.8. Audit log harus dibuat.

PATCH /superadmin/penugasan/koordinator/{id}

Update assignment.

POST /superadmin/penugasan/koordinator/{id}/end

Mengakhiri assignment.

Effect

status = ENDED
tanggal_selesai = current date

POST /superadmin/penugasan/koordinator/{id}/replace

Mengganti Koordinator.

Flow

Old Koordinator
    ↓
ENDED
    ↓
New Koordinator
    ↓
ACTIVE

Operasi harus menggunakan transaction.

22. Assignment Verifikator

GET /superadmin/penugasan/verifikator

List assignment.

POST /superadmin/penugasan/verifikator

Assign Verifikator.

Request

dosen_id
mata_kuliah_id
periode_id
tanggal_mulai
tanggal_selesai

Rules

Dosen harus valid.

Mata kuliah harus valid.

Periode harus valid.

assigned_by berasal dari authenticated user.

Assignment dicatat dalam audit log.

Verifikator tidak boleh memverifikasi soal miliknya sendiri.

PATCH /superadmin/penugasan/verifikator/{id}

Update assignment.

POST /superadmin/penugasan/verifikator/{id}/end

End assignment.

23. Import Excel

Import dilakukan oleh Super Admin.

Jenis:

PLO
CLO
MATA_KULIAH

GET /superadmin/import/{type}/template

Download template Excel.

Type

plo
clo
mata-kuliah

Response

XLSX file

POST /superadmin/import/{type}

Upload/import Excel.

Request

file

Validation

file → required|file
extension → xlsx/xls sesuai library yang digunakan

Processing

Upload
 ↓
Validate header
 ↓
Validate rows
 ↓
Insert/update
 ↓
Record ImportLog
 ↓
Return result

Result

total_rows
success_rows
failed_rows
status
error_summary

Status:

PROCESSING
SUCCESS
FAILED
PARTIAL

24. Import Log

GET /superadmin/import-logs

List history import.

Query

type
status
imported_by
date_from
date_to
page
per_page

GET /superadmin/import-logs/{id}

Detail import.

25. Export Excel

GET /superadmin/export/plo

Export PLO.

Response

XLSX

GET /superadmin/export/clo

Export CLO.

GET /superadmin/export/mata-kuliah

Export Mata Kuliah.

GET /superadmin/export/plo-clo

Export mapping PLO-CLO jika fitur diaktifkan.

26. Soal — Koordinator

Koordinator hanya dapat mengelola soal pada Mata Kuliah dan Periode yang ditugaskan.

GET /koordinator/soal

List soal.

Query

search
mata_kuliah_id
periode_id
kategori_soal_id
status
page
per_page

Backend wajib membatasi query berdasarkan assignment Koordinator.

GET /koordinator/soal/create

Halaman upload soal.

POST /koordinator/soal

Upload soal.

Request

mata_kuliah_id
periode_id
kategori_soal_id
judul
file

Validation

mata_kuliah_id → required|exists
periode_id → required|exists
kategori_soal_id → required|exists
judul → required|max:255
file → required|file

Format file mengikuti konfigurasi sistem.

Minimal yang direkomendasikan:

PDF
DOC
DOCX

Rules

User harus Koordinator.

Koordinator harus ditugaskan pada Mata Kuliah.

Periode harus aktif.

Upload tidak boleh melewati deadline.

File harus valid.

File disimpan menggunakan Laravel Storage.

Record soal dibuat.

Audit log dibuat.

Default:

status = DRAFT

27. Detail Soal

GET /koordinator/soal/{id}

Menampilkan detail soal.

Authorization

User harus merupakan Koordinator yang memiliki akses terhadap Mata Kuliah/Periode tersebut.

28. Submit Soal

POST /koordinator/soal/{id}/submit

Submit soal untuk verifikasi.

Rules

Status yang diperbolehkan:

DRAFT
RESUBMITTED

Result

SUBMITTED

Set:

submitted_at = current timestamp

29. Revisi Soal

GET /koordinator/soal/{id}/revision

Halaman upload revisi.

POST /koordinator/soal/{id}/revision

Upload revisi.

Request

file
catatan

Rules

Soal harus berstatus REVISION.

User harus memiliki assignment.

File harus valid.

Version dibuat incrementally.

Record masuk ke revisi_soal.

Status soal menjadi:

RESUBMITTED

Audit log dibuat.

30. Riwayat Revisi

GET /koordinator/soal/{id}/revisions

Menampilkan seluruh versi revisi.

31. Download Soal

GET /koordinator/soal/{id}/download

Download file soal.

Authorization

Harus memiliki akses terhadap soal.

32. Download Revisi

GET /koordinator/soal/{id}/revisions/{revisionId}/download

Download file revisi.

33. Verifikator — Queue

GET /verifikator/soal

List soal yang harus diverifikasi.

Query

search
mata_kuliah_id
periode_id
status
page
per_page

Backend hanya boleh mengembalikan soal yang berada pada assignment Verifikator.

Status utama:

SUBMITTED
IN_REVIEW
RESUBMITTED

34. Start Review

POST /verifikator/soal/{id}/review

Menandai soal sebagai sedang direview.

Result

IN_REVIEW

Rules

Verifikator harus memiliki assignment untuk Mata Kuliah + Periode soal.

35. Detail Soal Verifikator

GET /verifikator/soal/{id}

Menampilkan:

judul
mata kuliah
kategori
periode
uploaded_by
file
status
riwayat revisi
riwayat verifikasi

36. Verifikasi Soal

POST /verifikator/soal/{id}/verify

Request

action
catatan

Action

APPROVED
REVISION
REJECTED

Rules

User harus Verifikator.

Verifikator harus ditugaskan.

Tidak boleh memverifikasi soal sendiri.

Soal harus dalam status review yang valid.

Catatan wajib untuk REVISION dan REJECTED.

Record verifikasi dibuat.

Status soal diperbarui.

Audit log dibuat.

Semua perubahan dilakukan dalam transaction.

Approved

action = APPROVED

Result:

soal.status = APPROVED
approved_at = current timestamp

Revision

action = REVISION

Result:

soal.status = REVISION

catatan wajib diisi.

Rejected

action = REJECTED

Result:

soal.status = REJECTED

catatan wajib diisi.

37. Riwayat Verifikasi

GET /verifikator/soal/{id}/verifications

Menampilkan history:

verifikator
action
catatan
created_at

38. Download Soal Verifikator

GET /verifikator/soal/{id}/download

Download soal yang dapat diakses oleh Verifikator.

39. Berita Acara

Berita Acara dapat digunakan berdasarkan hasil verifikasi per Mata Kuliah dan Periode.

GET /berita-acara

List Berita Acara sesuai role.

GET /berita-acara/create

Form generate Berita Acara.

POST /berita-acara

Generate Berita Acara.

Request

periode_id
mata_kuliah_id

Rules

Periode valid.

Mata Kuliah valid.

Koordinator harus dapat ditentukan.

Data soal dihitung dari database.

Summary status dihitung dari data aktual.

Nomor BA harus unique.

dibuat_oleh berasal dari authenticated user.

Audit log dibuat.

40. Berita Acara Data

Field summary:

jumlah_soal
jumlah_approved
jumlah_revision
jumlah_rejected
tanggal

Nilai harus dihitung berdasarkan database, bukan input manual dari frontend.

41. Download Berita Acara

GET /berita-acara/{id}/download

Download file Berita Acara.

Authorization wajib dilakukan.

42. Audit Logs

Audit log hanya dapat dilihat oleh Super Admin.

GET /superadmin/audit-logs

Query

user_id
action
entity_type
entity_id
date_from
date_to
page
per_page

GET /superadmin/audit-logs/{id}

Detail audit log.

43. Common Query Parameters

List endpoint dapat menggunakan:

search
status
sort
direction
page
per_page

Pagination default:

per_page = 15

Maximum:

per_page = 100

Backend harus membatasi nilai pagination.

44. Search Rules

Search harus menggunakan field yang relevan.

Contoh Dosen:

kode_dosen
nama_lengkap
email

Mata Kuliah:

kode_mk
nama_mk

PLO:

kode_plo
deskripsi

CLO:

kode_clo
deskripsi

Soal:

judul
nama_file

45. Sorting

Sorting harus menggunakan whitelist field.

Contoh:

created_at
updated_at
nama
status

Jangan menerima raw SQL column dari request tanpa whitelist.

46. Pagination Response

Untuk endpoint yang menggunakan pagination:

{
    "data": [],
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
}

Untuk Inertia, pagination dapat dikirim sebagai props.

47. Flash Messages

Setelah mutation menggunakan redirect + flash message.

Success:

success

Error:

error

Warning:

warning

Contoh:

return redirect()
    ->back()
    ->with('success', 'Data berhasil disimpan.');

48. 403 Forbidden

Digunakan ketika:

User sudah login.

User tidak memiliki role yang diperlukan.

User tidak memiliki assignment terhadap resource.

User mencoba mengakses resource role lain.

User mencoba melakukan action yang tidak diperbolehkan.

Contoh:

Verifikator → /superadmin/users

Response:

403 Forbidden

UI harus menampilkan halaman:

Akses Ditolak

Jangan membocorkan informasi internal.

49. 404 Not Found

Digunakan ketika resource tidak ditemukan.

Contoh:

GET /koordinator/soal/{id}

Jika soal tidak ditemukan:

404 Not Found

Gunakan route model binding jika sesuai.

50. 409 Conflict

Digunakan untuk konflik business rule.

Contoh:

Mata Kuliah + Periode
sudah memiliki Koordinator aktif.

Atau:

Assignment duplicate

Atau:

Workflow transition tidak valid.

51. 422 Validation Error

Digunakan untuk:

Field kosong.

Format salah.

Email tidak valid.

File tidak valid.

SKS di luar range.

Action tidak valid.

Catatan tidak diberikan saat revision/rejected.

Contoh:

{
    "message": "The given data was invalid.",
    "errors": {
        "catatan": [
            "Catatan wajib diisi."
        ]
    }
}

52. 500 Internal Server Error

Digunakan untuk unexpected server failure.

Frontend hanya menampilkan pesan umum:

Terjadi kesalahan pada server.
Silakan coba lagi.

Jangan menampilkan:

SQL
Stack trace
File path
Environment variables
Credentials

Detail error dicatat melalui Laravel logging.

53. 503 Service Unavailable

Digunakan jika service penting sementara tidak tersedia.

Contoh:

Database unavailable
Storage unavailable
Queue unavailable

Frontend:

Layanan sedang tidak tersedia.
Silakan coba kembali beberapa saat lagi.

54. File Upload Security

Semua upload wajib:

Validate extension.

Validate MIME type.

Validate size.

Generate server-side storage path.

Jangan menggunakan filename user sebagai storage path langsung.

Jangan menyimpan file sensitif pada public URL tanpa authorization.

Gunakan Laravel Storage.

55. File Download Security

Sebelum download:

Authentication
 ↓
Role
 ↓
Resource authorization
 ↓
Assignment check
 ↓
File exists
 ↓
Download

Jika tidak berhak:

403

Jika file/resource tidak ditemukan:

404

56. Import Error Handling

Import Excel dapat menghasilkan:

SUCCESS
PARTIAL
FAILED

Contoh:

{
    "status": "PARTIAL",
    "total_rows": 100,
    "success_rows": 95,
    "failed_rows": 5,
    "errors": [
        {
            "row": 12,
            "field": "kode_plo",
            "message": "Kode PLO sudah digunakan."
        }
    ]
}

Detail implementasi dapat menggunakan import_logs.error_summary.

57. Database Error Handling

Constraint database harus diterjemahkan menjadi response yang dapat dipahami user.

Contoh:

Unique violation
→ 409 Conflict

Foreign key violation
→ 409 Conflict

Check violation
→ 422 Validation Error

Jangan menampilkan raw PostgreSQL error kepada user.

58. Idempotency & Duplicate Prevention

Operation yang dapat menyebabkan duplicate harus memiliki protection.

Database sudah memiliki unique constraints untuk:

users.email
dosen.kode_dosen
tahun_ajaran.nama
mata_kuliah.kode_mk
plo.kode_plo
clo.kode_clo
kategori_soal.nama
mata_kuliah_plo
mata_kuliah_clo
clo_plo
penugasan_koordinator
revisi_soal version
berita_acara.nomor

Backend harus tetap melakukan validation sebelum database constraint.

59. Transaction Requirements

Transaction wajib digunakan pada:

Assign Koordinator
Replace Koordinator
Assign Verifikator
Submit Soal jika melibatkan beberapa perubahan
Upload Revision
Verification
Generate Berita Acara
Import data dengan beberapa operasi database

Konsep:

DB::transaction(function () {
    // business operation
});

60. API Naming Convention

Gunakan URL yang konsisten.

Benar:

/superadmin/dosen
/superadmin/mata-kuliah
/superadmin/periode
/koordinator/soal
/verifikator/soal

Hindari:

/getAllDosen
/saveDosen
/doVerification

Action menggunakan endpoint:

POST /{resource}/{id}/{action}

Contoh:

POST /koordinator/soal/uuid/submit
POST /verifikator/soal/uuid/verify
POST /superadmin/periode/uuid/activate

61. UUID Parameters

Resource ID menggunakan UUID.

Contoh:

/superadmin/dosen/550e8400-e29b-41d4-a716-446655440000

Jangan expose integer auto-increment jika schema menggunakan UUID.

62. API Security Rules

Wajib:

Authentication
Authorization
CSRF protection
Validation
Rate limiting untuk endpoint sensitif
File validation
Database constraints
Audit logging

Endpoint login dan upload/import harus mendapatkan perlindungan rate limiting yang sesuai.

63. Backend Source of Truth

Frontend tidak boleh menentukan:

role
uploaded_by
assigned_by
approved_at
version
status final
jumlah_soal
jumlah_approved
nomor berita acara

Nilai tersebut harus ditentukan atau diverifikasi oleh backend.

64. Status Transition Contract

Status soal:

DRAFT
SUBMITTED
IN_REVIEW
REVISION
RESUBMITTED
APPROVED
REJECTED

Transition:

DRAFT
  → SUBMITTED

SUBMITTED
  → IN_REVIEW

IN_REVIEW
  → APPROVED
  → REVISION
  → REJECTED

REVISION
  → RESUBMITTED

RESUBMITTED
  → IN_REVIEW

Invalid transition harus ditolak:

409 Conflict

65. Role-Specific Route Summary

SUPER_ADMIN

/superadmin/dashboard
/superadmin/users
/superadmin/dosen
/superadmin/tahun-ajaran
/superadmin/periode
/superadmin/mata-kuliah
/superadmin/plo
/superadmin/clo
/superadmin/kategori-soal
/superadmin/penugasan/koordinator
/superadmin/penugasan/verifikator
/superadmin/import
/superadmin/export
/superadmin/import-logs
/superadmin/audit-logs

KOORDINATOR

/koordinator/dashboard
/koordinator/soal
/koordinator/soal/create
/koordinator/soal/{id}
/koordinator/soal/{id}/submit
/koordinator/soal/{id}/revision
/koordinator/soal/{id}/revisions
/koordinator/soal/{id}/download
/berita-acara

VERIFIKATOR

/verifikator/dashboard
/verifikator/soal
/verifikator/soal/{id}
/verifikator/soal/{id}/review
/verifikator/soal/{id}/verify
/verifikator/soal/{id}/verifications
/verifikator/soal/{id}/download
/berita-acara

66. Implementation Rule for Antigravity

Saat mengimplementasikan endpoint:

Periksa PRD.md.

Periksa DATABASE.md.

Periksa SCHEMA.md.

Periksa ARCHITECTURE.md.

Periksa RULES.md.

Periksa DESIGN.md.

Implementasikan route.

Implementasikan middleware/policy.

Implementasikan validation.

Implementasikan controller.

Gunakan service/action jika logic kompleks.

Implementasikan Inertia page.

Tambahkan audit log jika diperlukan.

Tambahkan feature test.

Pastikan response/error sesuai dokumen ini.

Jangan membuat endpoint baru yang bertentangan dengan dokumentasi.

Jika kebutuhan baru memang memerlukan endpoint baru, dokumentasikan terlebih dahulu.

67. Definition of Done

Endpoint dianggap selesai jika:

Route tersedia.

Authentication benar.

Authorization benar.

Validation tersedia.

Business rule diterapkan.

Database constraint tetap aman.

Error handling tersedia.

Audit log dibuat jika diperlukan.

Inertia page terhubung.

Loading state tersedia.

Success state tersedia.

Error state tersedia.

Feature test tersedia untuk logic penting.

Tidak ada authorization hanya di frontend.

Tidak ada hardcoded user/role pada business logic.

Dokumentasi API diperbarui jika endpoint berubah.

68. Final Principle

API/route layer harus menjadi kontrak antara:

Frontend
    ↕
Inertia
    ↕
Laravel
    ↕
Business Logic
    ↕
PostgreSQL

Prioritas implementasi:

Security
    ↓
Authorization
    ↓
Validation
    ↓
Business Rules
    ↓
Data Integrity
    ↓
Consistent Response
    ↓
UI Feedback

Jangan mengandalkan frontend untuk keamanan atau validasi business rule.

Semua keputusan penting harus divalidasi ulang di backend.
