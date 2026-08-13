Architecture — Sistem Informasi Verifikasi Soal

Version: 1.0Status: DevelopmentArchitecture Style: Monolithic Web Application + Inertia.jsBackend: Laravel 8.x / PHP 8.2Frontend: Inertia.jsDatabase: PostgreSQLBuild Tool: ViteCSS: Tailwind CSS

1. Architecture Overview

Sistem menggunakan arsitektur modular monolith.

Laravel menjadi application backend sekaligus server utama, sedangkan Inertia.js digunakan sebagai bridge antara Laravel dan frontend.

Arsitektur utama:

┌──────────────────────────────────────────────────────┐
│                    Client Browser                    │
│                                                      │
│        Inertia Pages + UI Components                 │
└───────────────────────┬──────────────────────────────┘
                        │
                        │ HTTP / Inertia
                        ▼
┌──────────────────────────────────────────────────────┐
│                  Laravel Application                  │
│                                                      │
│  Routes                                               │
│    ↓                                                  │
│  Middleware                                           │
│    ↓                                                  │
│  Controllers                                          │
│    ↓                                                  │
│  Form Requests / Policies                             │
│    ↓                                                  │
│  Services / Actions                                   │
│    ↓                                                  │
│  Eloquent Models                                      │
└───────────────┬──────────────────────┬───────────────┘
                │                      │
                ▼                      ▼
┌────────────────────────┐   ┌─────────────────────────┐
│      PostgreSQL        │   │   Laravel File Storage  │
│                        │   │                         │
│ Users                  │   │ Soal                    │
│ Dosen                  │   │ Revisi                  │
│ Mata Kuliah            │   │ Template Excel          │
│ PLO / CLO              │   │ Export                  │
│ Periode                │   │ Berita Acara            │
│ Penugasan              │   │                         │
│ Soal                   │   │                         │
│ Verifikasi             │   │                         │
│ Audit Log              │   │                         │
└────────────────────────┘   └─────────────────────────┘

2. Architectural Principles

Project harus mengikuti prinsip:

Single Source of Truth

Server-side Authorization

Database Integrity

Separation of Concerns

Reusable Components

Minimal Duplication

Secure File Handling

Role-based Access

Auditable Business Operations

Maintainable Code

3. Application Architecture

Gunakan layered architecture sederhana.

Presentation Layer
        ↓
HTTP Layer
        ↓
Application / Business Layer
        ↓
Domain / Model Layer
        ↓
Persistence Layer

Implementasi Laravel:

Inertia Pages
     ↓
Routes
     ↓
Middleware
     ↓
Controllers
     ↓
Form Requests
     ↓
Policies
     ↓
Services / Actions
     ↓
Eloquent Models
     ↓
PostgreSQL

Tidak semua fitur wajib menggunakan Service.

Gunakan abstraction hanya ketika business logic memang kompleks atau reusable.

4. Presentation Layer

Frontend menggunakan Inertia.js.

Struktur:

resources/js/
├── Components/
├── Layouts/
├── Pages/
│   ├── Auth/
│   ├── SuperAdmin/
│   ├── Koordinator/
│   └── Verifikator/
├── Hooks/
├── Lib/
└── app.js

4.1 Pages

Page mewakili halaman utama aplikasi.

Contoh:

SuperAdmin/Dashboard
SuperAdmin/Dosen/Index
SuperAdmin/MataKuliah/Index
SuperAdmin/PLO/Index
SuperAdmin/CLO/Index
SuperAdmin/Periode/Index
SuperAdmin/Penugasan/Koordinator
SuperAdmin/Penugasan/Verifikator

Koordinator/Dashboard
Koordinator/Soal/Index
Koordinator/Soal/Create
Koordinator/Soal/Show
Koordinator/Soal/Revision

Verifikator/Dashboard
Verifikator/Soal/Index
Verifikator/Soal/Show

5. Layout Architecture

Gunakan layout berdasarkan role.

AuthenticatedLayout
        │
        ├── SuperAdminLayout
        │
        ├── KoordinatorLayout
        │
        └── VerifikatorLayout

Jika memungkinkan, gunakan shared authenticated layout dengan navigation configuration berdasarkan role.

Contoh:

AuthenticatedLayout
├── Sidebar
├── Header
├── Breadcrumb
└── Main Content

Menu ditentukan oleh role.

6. Component Architecture

Gunakan reusable components.

Components/
├── UI/
│   ├── Button
│   ├── Input
│   ├── Select
│   ├── Badge
│   ├── Modal
│   ├── Dialog
│   ├── Card
│   ├── Table
│   ├── Pagination
│   └── Toast
│
├── Forms/
│   ├── FormInput
│   ├── FormSelect
│   └── FileUpload
│
├── Dashboard/
│   ├── StatCard
│   ├── ActivityList
│   └── StatusChart
│
└── DataTable/
    ├── Search
    ├── Filter
    └── TablePagination

Jangan membuat komponen yang sama berkali-kali.

7. HTTP Layer

Struktur:

app/Http/
├── Controllers/
├── Middleware/
└── Requests/

Controllers

Controller bertugas:

Menerima request.

Memanggil validation.

Memanggil service/action jika diperlukan.

Mengambil data.

Mengembalikan Inertia response.

Redirect setelah mutation.

Controller tidak boleh berisi business logic panjang.

Contoh:

public function store(StoreSoalRequest $request)
{
    $soal = $this->soalService->create(
        $request->validated(),
        $request->user()
    );

    return redirect()
        ->route('koordinator.soal.index')
        ->with('success', 'Soal berhasil diunggah.');
}

8. Form Request Layer

Gunakan Form Request untuk:

Input validation.

Authorization sederhana.

File validation.

Business input constraints.

Contoh:

StoreDosenRequest
UpdateDosenRequest

StoreMataKuliahRequest
UpdateMataKuliahRequest

StorePLORequest
UpdatePLORequest

StoreCLORequest
UpdateCLORequest

StorePeriodeRequest
UpdatePeriodeRequest

StoreSoalRequest
SubmitSoalRequest
StoreRevisiSoalRequest

VerifySoalRequest
AssignKoordinatorRequest
AssignVerifikatorRequest

Tidak semua endpoint harus memiliki Request class jika logic sangat sederhana.

9. Authorization Architecture

Authorization merupakan bagian penting.

Gunakan:

Middleware
+
Policies
+
Gates

Role Middleware

Contoh:

role:SUPER_ADMIN
role:KOORDINATOR
role:VERIFIKATOR

Resource Policy

Contoh:

SoalPolicy
PeriodePolicy
PenugasanPolicy
BeritaAcaraPolicy

Policy harus memeriksa ownership/assignment.

Contoh konsep:

User
 ↓
Role valid?
 ↓
Resource valid?
 ↓
User assigned?
 ↓
Period valid?
 ↓
Action allowed?

Jangan hanya mengandalkan role.

10. Business/Application Layer

Gunakan Service/Action ketika logic melibatkan beberapa model atau beberapa langkah.

Contoh:

app/
├── Services/
│   ├── SoalService.php
│   ├── VerificationService.php
│   ├── AssignmentService.php
│   ├── ImportService.php
│   └── BeritaAcaraService.php
│
└── Actions/
    ├── UploadSoal.php
    ├── SubmitSoal.php
    ├── VerifySoal.php
    ├── AssignKoordinator.php
    └── AssignVerifikator.php

Tidak wajib menggunakan seluruh struktur tersebut sejak awal.

11. Domain Model Architecture

Model utama:

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

12. Core Relationships

User ↔ Dosen

users
  1
  │
  │ optional
  ▼
dosen

Satu account dapat terhubung ke satu record Dosen.

Tahun Ajaran ↔ Periode

tahun_ajaran
      1
      │
      │ has many
      ▼
periode_verifikasi

Mata Kuliah ↔ PLO

mata_kuliah
      │
      │ many-to-many
      ▼
mata_kuliah_plo
      ▲
      │
      │
     plo

Mata Kuliah ↔ CLO

mata_kuliah
      │
      │ many-to-many
      ▼
mata_kuliah_clo
      ▲
      │
      │
     clo

CLO ↔ PLO

clo
 │
 │ many-to-many
 ▼
clo_plo
 ▲
 │
plo

Periode ↔ Koordinator

periode
   │
   ▼
penugasan_koordinator
   ▲
   │
dosen

Periode ↔ Verifikator

periode
   │
   ▼
penugasan_verifikator
   ▲
   │
dosen

Soal

Mata Kuliah
     │
     ├─────────┐
     │         │
   Soal     Periode
     │
     ├── Revisi
     │
     └── Verifikasi

13. Database Architecture

Database menggunakan PostgreSQL.

Primary key:

UUID

Generated menggunakan:

gen_random_uuid()

Extension:

pgcrypto

Database harus menjaga:

Unique constraints.

Foreign keys.

Check constraints.

Cascade rules.

Restrict rules.

Index.

Application tidak boleh menjadi satu-satunya tempat validasi data.

14. Transaction Architecture

Gunakan database transaction untuk operasi yang memodifikasi beberapa record.

Contoh:

Assign Koordinator

BEGIN
 ↓
End old assignment if needed
 ↓
Create new assignment
 ↓
Audit log
 ↓
COMMIT

Verification

BEGIN
 ↓
Create verification record
 ↓
Update soal status
 ↓
Update timestamps
 ↓
Audit log
 ↓
COMMIT

Import

BEGIN
 ↓
Validate rows
 ↓
Insert/update valid data
 ↓
Record errors
 ↓
Create import log
 ↓
COMMIT

Jika proses membutuhkan partial import, desain transaction harus mengikuti kebijakan import yang digunakan.

15. Soal Workflow Architecture

Workflow:

                  ┌──────────────┐
                  │    DRAFT     │
                  └──────┬───────┘
                         │ submit
                         ▼
                  ┌──────────────┐
                  │  SUBMITTED   │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  IN_REVIEW   │
                  └──────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
      APPROVED       REVISION       REJECTED
                         │
                         │ upload revision
                         ▼
                    RESUBMITTED
                         │
                         ▼
                    IN_REVIEW

Transisi harus dikontrol backend.

16. File Storage Architecture

File utama:

Soal
Revisi
Template Excel
Export Excel
Berita Acara

Gunakan Laravel Storage.

Rekomendasi struktur:

storage/app/
├── soal/
├── revisi/
├── templates/
├── exports/
└── berita-acara/

Jangan menyimpan file bisnis secara langsung berdasarkan path dari user.

Generate path dari server.

Contoh konsep:

soal/{periode}/{mata_kuliah}/{uuid}/filename.ext

17. File Access

File yang bersifat sensitif harus memiliki authorization.

Alur:

User request file
        ↓
Authentication
        ↓
Authorization
        ↓
Check assignment/resource
        ↓
Stream/download file

Jangan membuat semua file soal dapat diakses bebas hanya karena mengetahui URL.

18. Import Architecture

Import PLO/CLO:

Frontend
   ↓
Upload Excel
   ↓
Laravel Request
   ↓
File Validation
   ↓
Import Service
   ↓
Spreadsheet Reader
   ↓
Row Validation
   ↓
Database
   ↓
Import Log
   ↓
Inertia Result

Import harus menghasilkan informasi:

total_rows
success_rows
failed_rows
status
error_summary

19. Export Architecture

Frontend
   ↓
Export Request
   ↓
Authorization
   ↓
Query Database
   ↓
Generate XLSX
   ↓
Download Response

Export tidak boleh mengambil data dari frontend.

20. Dashboard Architecture

Dashboard menggunakan aggregation query.

Contoh:

Database
 ↓
Query / Service
 ↓
Dashboard Controller
 ↓
Inertia Props
 ↓
StatCard / Chart / Table

Jangan melakukan query database langsung dari frontend.

Dashboard harus mempertimbangkan role.

SUPER_ADMIN
    ↓
Global statistics

KOORDINATOR
    ↓
Assigned statistics

VERIFIKATOR
    ↓
Verification statistics

21. Query Optimization

Gunakan:

Pagination.

Eager loading.

Query scopes.

Index.

Aggregation query.

Select kolom yang diperlukan.

Hindari:

SELECT *

untuk query besar jika tidak diperlukan.

Hindari N+1.

Contoh:

Soal::with(['mataKuliah', 'periode', 'kategori'])
    ->paginate(15);

22. Routing Architecture

Gunakan route group berdasarkan role.

Konsep:

Route::middleware(['auth', 'role:SUPER_ADMIN'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(...);

Koordinator:

/koordinator/*

Verifikator:

/verifikator/*

Public:

/login

Route naming harus konsisten.

23. Inertia Data Flow

Flow standar:

Browser
  ↓
Inertia Request
  ↓
Laravel Route
  ↓
Middleware
  ↓
Controller
  ↓
Query/Service
  ↓
Eloquent
  ↓
PostgreSQL
  ↓
Controller
  ↓
Inertia Props
  ↓
Page Component

Mutation:

Form
 ↓
Inertia POST/PUT/PATCH/DELETE
 ↓
Validation
 ↓
Authorization
 ↓
Service/Action
 ↓
Database
 ↓
Redirect
 ↓
Flash Message

24. Shared Inertia Data

Data yang diperlukan hampir seluruh halaman dapat dibagikan melalui Inertia middleware.

Contoh:

auth.user
flash.success
flash.error
permissions
navigation

Jangan mengirim data besar sebagai shared props jika tidak diperlukan.

25. Error Handling Architecture

HTTP error:

400 → Bad Request
401 → Unauthenticated
403 → Forbidden
404 → Not Found
422 → Validation Error
429 → Too Many Requests
500 → Server Error

UI harus memberikan feedback yang mudah dipahami.

Production tidak boleh menampilkan:

Stack trace.

SQL query.

Credential.

Internal path.

Secret.

26. Audit Architecture

Audit log dibuat setelah operasi penting.

Contoh:

Create
Update
Delete
Import
Export
Upload
Revision
Verification
Assignment
Period change

Data:

user_id
action
entity_type
entity_id
old_values
new_values
ip_address
user_agent
created_at

Audit log harus immutable dari sisi user biasa.

27. Security Architecture

Security layer:

Browser
 ↓
HTTPS
 ↓
Laravel Session
 ↓
CSRF
 ↓
Authentication
 ↓
Role Middleware
 ↓
Policy
 ↓
Validation
 ↓
Business Logic
 ↓
Database Constraints

Security tidak boleh hanya dilakukan di frontend.

28. Deployment Architecture

Development:

Browser
   ↓
Laravel Development Server
   ↓
PostgreSQL

Production konsep:

Internet
   ↓
Reverse Proxy / Web Server
   ↓
Laravel Application
   ├── PHP
   ├── Inertia
   └── Vite-built assets
   ↓
PostgreSQL
   ↓
File Storage

Environment variables:

APP_ENV
APP_KEY
APP_URL

DB_CONNECTION
DB_HOST
DB_PORT
DB_DATABASE
DB_USERNAME
DB_PASSWORD

FILESYSTEM_DISK

Jangan commit .env.

29. Environment Separation

Minimal:

.env
.env.example

Development dan production harus memiliki credential berbeda.

Akun development tidak boleh digunakan sebagai production account.

30. Logging

Gunakan Laravel logging.

Log untuk:

Unexpected exception.

Import failure.

File processing failure.

Critical business failure.

Jangan log:

Password.

Token.

Secret.

Sensitive file content.

31. Performance Architecture

Prioritas:

Database indexes.

Pagination.

Eager loading.

Query optimization.

Asset optimization.

Caching jika diperlukan.

Queue untuk pekerjaan berat.

Jangan menambahkan caching sebelum mengetahui kebutuhan.

32. Queue Candidates

Queue dapat digunakan untuk proses yang berpotensi lama:

Import Excel besar.

Generate Berita Acara kompleks.

Generate report besar.

File processing.

Untuk dataset kecil, synchronous processing masih diperbolehkan.

33. Testing Architecture

Testing dibagi:

Unit Tests
Feature Tests
Browser/UI Tests jika diperlukan

Prioritas Feature Test:

Authentication
Authorization
Assignment
Question Upload
Question Workflow
Verification
Revision
Import
Export
Berita Acara

34. Maintainability

Kode harus:

Mudah dibaca.

Konsisten.

Tidak duplikatif.

Memiliki naming jelas.

Tidak memiliki magic values berlebihan.

Menggunakan enum/status yang konsisten.

Mengikuti Laravel conventions.

Contoh naming:

StoreSoalRequest
VerifySoalRequest
SoalController
SoalService
SoalPolicy
Soal

35. Documentation Dependency

Setiap perubahan arsitektur harus memeriksa:

PRD.md
DATABASE.md
SCHEMA.md
API.md
DESIGN.md
RULES.md
AGENT.md
README.md

Jika perubahan mempengaruhi salah satu dokumen, update dokumentasi terkait.

36. Architecture Decision Rules

Rule 1

Gunakan Laravel convention sebelum membuat custom abstraction.

Rule 2

Gunakan Eloquent sebelum raw SQL.

Raw SQL hanya digunakan jika query kompleks dan memang diperlukan.

Rule 3

Gunakan Inertia untuk navigasi aplikasi.

Jangan membuat REST API terpisah untuk kebutuhan internal halaman jika tidak diperlukan.

Rule 4

Gunakan Policy untuk resource authorization.

Rule 5

Gunakan Form Request untuk validasi kompleks.

Rule 6

Gunakan Service/Action hanya ketika logic kompleks atau reusable.

Rule 7

Database constraint tetap wajib walaupun validation sudah ada.

Rule 8

Frontend bukan sumber kebenaran business rule.

37. Architecture Folder Reference

Struktur target:

project/
├── app/
│   ├── Actions/
│   ├── Console/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   ├── Policies/
│   ├── Providers/
│   └── Services/
│
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
│
├── resources/
│   ├── css/
│   └── js/
│       ├── Components/
│       ├── Layouts/
│       ├── Pages/
│       │   ├── Auth/
│       │   ├── SuperAdmin/
│       │   ├── Koordinator/
│       │   └── Verifikator/
│       ├── Hooks/
│       ├── Lib/
│       └── app.js
│
├── routes/
│   ├── web.php
│   └── auth.php
│
├── storage/
│
├── tests/
│   ├── Feature/
│   └── Unit/
│
├── docs/
│   ├── PRD.md
│   ├── DATABASE.md
│   ├── SCHEMA.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DESIGN.md
│   ├── RULES.md
│   ├── AGENT.md
│   └── README.md
│
└── package.json

38. End-to-End Example

Upload Soal

Koordinator
    ↓
Open Upload Page
    ↓
Select Mata Kuliah
    ↓
Select Kategori
    ↓
Select File
    ↓
Submit
    ↓
Laravel Route
    ↓
Auth Middleware
    ↓
Role Middleware
    ↓
StoreSoalRequest
    ↓
SoalPolicy
    ↓
Check Assignment
    ↓
Check Period
    ↓
Check Deadline
    ↓
SoalService
    ↓
Store File
    ↓
Create Soal
    ↓
Audit Log
    ↓
Redirect
    ↓
Inertia Page
    ↓
Success Toast

39. End-to-End Verification

Verifikator
    ↓
Verification Queue
    ↓
Open Soal
    ↓
Download File
    ↓
Review
    ↓
Select Action
    ↓
APPROVED / REVISION / REJECTED
    ↓
VerifySoalRequest
    ↓
SoalPolicy
    ↓
VerificationService
    ↓
Transaction
    ├── Create Verification
    ├── Update Soal Status
    └── Create Audit Log
    ↓
Commit
    ↓
Redirect
    ↓
Inertia
    ↓
Success Feedback

40. Final Architecture Goal

Arsitektur akhir harus menghasilkan sistem yang:

Modular.

Maintainable.

Secure.

Role-based.

Database-driven.

Inertia-based.

Responsive.

Auditable.

Scalable untuk kebutuhan aplikasi akademik.

Tidak overengineered.

Prioritas arsitektur:

Correctness
    ↓
Security
    ↓
Data Integrity
    ↓
Maintainability
    ↓
Performance
    ↓
UI Consistency

Jangan mengorbankan correctness, security, atau data integrity hanya demi implementasi yang lebih cepat.
