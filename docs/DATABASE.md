DATABASE.md

Sistem Informasi Verifikasi Soal

1. Overview

Dokumen ini adalah dokumentasi database PostgreSQL dan harus mengikuti SQL schema yang diberikan sebagai source of truth. Tidak ada tabel, enum, kolom, atau relasi tambahan di luar schema tersebut.

Database mendukung:

Authentication dan 3 role: SUPER_ADMIN, KOORDINATOR, VERIFIKATOR

Master Dosen, Mata Kuliah, PLO, CLO, Kategori Soal

Tahun Ajaran dan Periode Verifikasi

Penugasan Koordinator dan Verifikator

Upload dan revisi soal

Verifikasi soal

Berita Acara

Import log

Audit log

2. Technology

Komponen

Nilai

Database

PostgreSQL

Extension

pgcrypto

UUID

gen_random_uuid()

Primary Key

UUID

JSON

JSONB

Network

INET

Timestamp

TIMESTAMP

Date

DATE

Extension:

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

3. ENUM

user_role

SUPER_ADMIN, KOORDINATOR, VERIFIKATOR

user_status

ACTIVE, INACTIVE

periode_status

DRAFT, ACTIVE, INACTIVE, CLOSED

penugasan_status

ACTIVE, INACTIVE, ENDED

ENDED digunakan untuk mempertahankan histori penugasan setelah masa assignment selesai.

soal_status

DRAFT, SUBMITTED, IN_REVIEW, REVISION, RESUBMITTED, APPROVED, REJECTED

Alur umum:

DRAFT -> SUBMITTED -> IN_REVIEW
                       |-> APPROVED
                       |-> REVISION -> RESUBMITTED -> IN_REVIEW
                       `-> REJECTED

import_type

PLO, CLO, MATA_KULIAH

import_status

PROCESSING, SUCCESS, FAILED, PARTIAL

verifikasi_action

APPROVED, REVISION, REJECTED

4. Tables

Schema memiliki 19 tabel:

users

dosen

tahun_ajaran

periode_verifikasi

mata_kuliah

plo

clo

mata_kuliah_plo

mata_kuliah_clo

clo_plo

kategori_soal

penugasan_koordinator

penugasan_verifikator

soal

revisi_soal

verifikasi

berita_acara

import_logs

audit_logs

5. users

Akun pengguna aplikasi.

Column

Type

Constraint

id

UUID

PK, default gen_random_uuid()

name

VARCHAR(150)

NOT NULL

email

VARCHAR(150)

NOT NULL, UNIQUE

password

VARCHAR(255)

NOT NULL

role

user_role

NOT NULL

status

user_status

NOT NULL, default ACTIVE

email_verified_at

TIMESTAMP

NULL

remember_token

VARCHAR(100)

NULL

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

Role yang valid:

SUPER_ADMIN

KOORDINATOR

VERIFIKATOR

6. dosen

Master data dosen.

Column

Type

Constraint

id

UUID

PK

kode_dosen

VARCHAR(50)

UNIQUE, NOT NULL

nama_lengkap

VARCHAR(150)

NOT NULL

email

VARCHAR(150)

NULL

user_id

UUID

UNIQUE, FK users

status

user_status

default ACTIVE

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

deleted_at

TIMESTAMP

NULL

FK:

dosen.user_id -> users.id
ON DELETE SET NULL

7. tahun_ajaran

Master tahun akademik.

Column

Type

Constraint

id

UUID

PK

nama

VARCHAR(50)

UNIQUE, NOT NULL

tahun_mulai

SMALLINT

NOT NULL

tahun_selesai

SMALLINT

NOT NULL

status

user_status

default ACTIVE

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

Constraint:

tahun_selesai = tahun_mulai + 1

Contoh valid: 2026/2027.

8. periode_verifikasi

Periode pelaksanaan verifikasi.

Column

Type

Constraint

id

UUID

PK

tahun_ajaran_id

UUID

FK, NOT NULL

nama

VARCHAR(100)

NOT NULL

tanggal_mulai

DATE

NOT NULL

tanggal_selesai

DATE

NOT NULL

deadline_upload

TIMESTAMP

NOT NULL

status

periode_status

default DRAFT

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

FK:

periode_verifikasi.tahun_ajaran_id -> tahun_ajaran.id
ON DELETE RESTRICT

Constraints:

tanggal_selesai >= tanggal_mulai
deadline_upload::DATE >= tanggal_mulai

9. mata_kuliah

Master mata kuliah.

Column

Type

Constraint

id

UUID

PK

kode_mk

VARCHAR(50)

UNIQUE, NOT NULL

nama_mk

VARCHAR(200)

NOT NULL

sks

SMALLINT

NOT NULL

status

user_status

default ACTIVE

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

deleted_at

TIMESTAMP

NULL

Constraint:

sks > 0 AND sks <= 10

10. plo

Program Learning Outcome.

Column

Type

Constraint

id

UUID

PK

kode_plo

VARCHAR(50)

UNIQUE, NOT NULL

deskripsi

TEXT

NOT NULL

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

deleted_at

TIMESTAMP

NULL

11. clo

Course Learning Outcome.

Column

Type

Constraint

id

UUID

PK

kode_clo

VARCHAR(50)

UNIQUE, NOT NULL

deskripsi

TEXT

NOT NULL

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

deleted_at

TIMESTAMP

NULL

12. Relasi Mata Kuliah - PLO

Tabel: mata_kuliah_plo

Many-to-many:

mata_kuliah 1 --- N mata_kuliah_plo N --- 1 plo

Column

Type

Constraint

id

UUID

PK

mata_kuliah_id

UUID

FK

plo_id

UUID

FK

created_at

TIMESTAMP

NOT NULL

Constraint:

UNIQUE (mata_kuliah_id, plo_id)

Delete:

mata_kuliah -> CASCADE
plo -> CASCADE

13. Relasi Mata Kuliah - CLO

Tabel: mata_kuliah_clo

Many-to-many:

mata_kuliah 1 --- N mata_kuliah_clo N --- 1 clo

Column

Type

Constraint

id

UUID

PK

mata_kuliah_id

UUID

FK

clo_id

UUID

FK

created_at

TIMESTAMP

NOT NULL

Constraint:

UNIQUE (mata_kuliah_id, clo_id)

14. Relasi CLO - PLO

Tabel: clo_plo

Many-to-many:

clo 1 --- N clo_plo N --- 1 plo

Column

Type

Constraint

id

UUID

PK

clo_id

UUID

FK

plo_id

UUID

FK

created_at

TIMESTAMP

NOT NULL

Constraint:

UNIQUE (clo_id, plo_id)

Business Rule Learning Outcome

1 Mata Kuliah dapat memiliki banyak PLO.

1 Mata Kuliah dapat memiliki banyak CLO.

1 CLO dapat memiliki banyak PLO.

1 PLO dapat memiliki banyak CLO.

1 PLO dapat digunakan oleh banyak Mata Kuliah.

1 CLO dapat digunakan oleh banyak Mata Kuliah.

15. kategori_soal

Master kategori soal.

Column

Type

Constraint

id

UUID

PK

nama

VARCHAR(100)

UNIQUE, NOT NULL

deskripsi

TEXT

NULL

status

user_status

default ACTIVE

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

deleted_at

TIMESTAMP

NULL

16. penugasan_koordinator

Assignment Dosen sebagai Koordinator untuk Mata Kuliah pada Periode tertentu.

Column

Type

Constraint

id

UUID

PK

dosen_id

UUID

FK dosen

mata_kuliah_id

UUID

FK mata_kuliah

periode_id

UUID

FK periode_verifikasi

status

penugasan_status

default ACTIVE

tanggal_mulai

DATE

NOT NULL

tanggal_selesai

DATE

NULL

assigned_by

UUID

FK users

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

Constraint penting:

UNIQUE (mata_kuliah_id, periode_id)

Artinya satu Mata Kuliah hanya memiliki satu Koordinator dalam satu periode.

Saat masa penugasan berakhir:

ACTIVE -> ENDED

Histori assignment lama tidak dihapus. Super Admin dapat menetapkan Koordinator baru pada periode berikutnya.

17. penugasan_verifikator

Assignment Dosen sebagai Verifikator.

Column

Type

Constraint

id

UUID

PK

dosen_id

UUID

FK dosen

mata_kuliah_id

UUID

FK mata_kuliah

periode_id

UUID

FK periode_verifikasi

status

penugasan_status

default ACTIVE

tanggal_mulai

DATE

NOT NULL

tanggal_selesai

DATE

NULL

assigned_by

UUID

FK users

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

Catatan: schema saat ini tidak memiliki UNIQUE constraint pada mata_kuliah_id + periode_id, sehingga satu Mata Kuliah pada satu periode dapat memiliki lebih dari satu Verifikator.

18. soal

Data soal yang diupload.

Column

Type

Constraint

id

UUID

PK

mata_kuliah_id

UUID

FK

periode_id

UUID

FK

kategori_soal_id

UUID

FK

uploaded_by

UUID

FK users

judul

VARCHAR(255)

NOT NULL

nama_file

VARCHAR(255)

NOT NULL

file_path

TEXT

NOT NULL

file_mime_type

VARCHAR(100)

NOT NULL

file_size

BIGINT

CHECK > 0

status

soal_status

default DRAFT

submitted_at

TIMESTAMP

NULL

approved_at

TIMESTAMP

NULL

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

deleted_at

TIMESTAMP

NULL

FK:

mata_kuliah_id -> mata_kuliah.id
periode_id -> periode_verifikasi.id
kategori_soal_id -> kategori_soal.id
uploaded_by -> users.id

Semua FK pada tabel soal menggunakan ON DELETE RESTRICT.

19. revisi_soal

Menyimpan versi revisi soal.

Column

Type

Constraint

id

UUID

PK

soal_id

UUID

FK

version

INTEGER

> 0

nama_file

VARCHAR(255)

NOT NULL

file_path

TEXT

NOT NULL

file_mime_type

VARCHAR(100)

NOT NULL

file_size

BIGINT

> 0

catatan

TEXT

NULL

uploaded_by

UUID

FK users

uploaded_at

TIMESTAMP

NOT NULL

Constraint:

UNIQUE (soal_id, version)

Contoh:

Soal A
- Version 1
- Version 2
- Version 3

File versi lama tidak boleh ditimpa.

Delete:

soal -> revisi_soal = CASCADE

20. verifikasi

Histori tindakan Verifikator.

Column

Type

Constraint

id

UUID

PK

soal_id

UUID

FK

verifikator_id

UUID

FK users

action

verifikasi_action

NOT NULL

catatan

TEXT

NULL

created_at

TIMESTAMP

NOT NULL

Action:

APPROVED

REVISION

REJECTED

Setiap tindakan disimpan sebagai histori.

21. berita_acara

Menyimpan Berita Acara hasil verifikasi.

Column

Type

Constraint

id

UUID

PK

nomor

VARCHAR(100)

UNIQUE, NOT NULL

periode_id

UUID

FK

mata_kuliah_id

UUID

FK

koordinator_id

UUID

FK dosen

dibuat_oleh

UUID

FK users

jumlah_soal

INTEGER

default 0

jumlah_approved

INTEGER

default 0

jumlah_revision

INTEGER

default 0

jumlah_rejected

INTEGER

default 0

tanggal

DATE

NOT NULL

file_path

TEXT

NULL

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

Semua FK menggunakan ON DELETE RESTRICT.

22. import_logs

Histori import Excel.

Column

Type

Constraint

id

UUID

PK

type

import_type

NOT NULL

filename

VARCHAR(255)

NOT NULL

total_rows

INTEGER

default 0

success_rows

INTEGER

default 0

failed_rows

INTEGER

default 0

status

import_status

default PROCESSING

error_summary

JSONB

NULL

imported_by

UUID

FK users

created_at

TIMESTAMP

NOT NULL

updated_at

TIMESTAMP

NOT NULL

Supported:

PLO
CLO
MATA_KULIAH

Flow:

Download Template
-> Isi Excel
-> Upload
-> Validate
-> Import
-> Simpan import_logs
-> SUCCESS / FAILED / PARTIAL

PLO minimal:

kode_plo
deskripsi

CLO minimal:

kode_clo
deskripsi

Mata Kuliah minimal:

kode_mk
nama_mk
sks

23. audit_logs

Histori aktivitas sistem.

Column

Type

Constraint

id

UUID

PK

user_id

UUID

NULL, FK

action

VARCHAR(100)

NOT NULL

entity_type

VARCHAR(100)

NULL

entity_id

UUID

NULL

old_values

JSONB

NULL

new_values

JSONB

NULL

ip_address

INET

NULL

user_agent

TEXT

NULL

created_at

TIMESTAMP

NOT NULL

FK:

audit_logs.user_id -> users.id
ON DELETE SET NULL

Contoh action:

LOGIN
LOGOUT
CREATE
UPDATE
DELETE
IMPORT
EXPORT
ASSIGN_KOORDINATOR
ASSIGN_VERIFIKATOR
UPLOAD_SOAL
UPLOAD_REVISI
VERIFY_SOAL
GENERATE_BERITA_ACARA

24. Foreign Key Map

dosen.user_id
 -> users.id

periode_verifikasi.tahun_ajaran_id
 -> tahun_ajaran.id

mata_kuliah_plo.mata_kuliah_id
 -> mata_kuliah.id

mata_kuliah_plo.plo_id
 -> plo.id

mata_kuliah_clo.mata_kuliah_id
 -> mata_kuliah.id

mata_kuliah_clo.clo_id
 -> clo.id

clo_plo.clo_id
 -> clo.id

clo_plo.plo_id
 -> plo.id

penugasan_koordinator.dosen_id
 -> dosen.id

penugasan_koordinator.mata_kuliah_id
 -> mata_kuliah.id

penugasan_koordinator.periode_id
 -> periode_verifikasi.id

penugasan_koordinator.assigned_by
 -> users.id

penugasan_verifikator.dosen_id
 -> dosen.id

penugasan_verifikator.mata_kuliah_id
 -> mata_kuliah.id

penugasan_verifikator.periode_id
 -> periode_verifikasi.id

penugasan_verifikator.assigned_by
 -> users.id

soal.mata_kuliah_id
 -> mata_kuliah.id

soal.periode_id
 -> periode_verifikasi.id

soal.kategori_soal_id
 -> kategori_soal.id

soal.uploaded_by
 -> users.id

revisi_soal.soal_id
 -> soal.id

revisi_soal.uploaded_by
 -> users.id

verifikasi.soal_id
 -> soal.id

verifikasi.verifikator_id
 -> users.id

berita_acara.periode_id
 -> periode_verifikasi.id

berita_acara.mata_kuliah_id
 -> mata_kuliah.id

berita_acara.koordinator_id
 -> dosen.id

berita_acara.dibuat_oleh
 -> users.id

import_logs.imported_by
 -> users.id

audit_logs.user_id
 -> users.id

25. Delete Policy

CASCADE

Digunakan pada:

mata_kuliah_plo -> mata_kuliah / plo

mata_kuliah_clo -> mata_kuliah / clo

clo_plo -> clo / plo

revisi_soal -> soal

RESTRICT

Digunakan pada relasi yang harus mempertahankan histori:

periode

assignment

soal

verifikasi

berita acara

import logs

SET NULL

Digunakan pada:

dosen.user_id

audit_logs.user_id

26. Soft Delete

Kolom deleted_at tersedia pada:

dosen

mata_kuliah

plo

clo

kategori_soal

soal

Laravel model terkait harus menggunakan SoftDeletes.

Record soft deleted tidak dianggap sebagai data aktif.

27. Index

Index yang didefinisikan schema:

idx_dosen_status
idx_mata_kuliah_status
idx_periode_status
idx_periode_tahun_ajaran

idx_mk_plo_mata_kuliah
idx_mk_plo_plo
idx_mk_clo_mata_kuliah
idx_mk_clo_clo
idx_clo_plo_clo
idx_clo_plo_plo

idx_penugasan_koordinator_periode
idx_penugasan_koordinator_dosen
idx_penugasan_verifikator_periode
idx_penugasan_verifikator_dosen

idx_soal_mata_kuliah
idx_soal_periode
idx_soal_status
idx_revisi_soal

idx_verifikasi_soal
idx_verifikasi_verifikator

idx_audit_user
idx_audit_entity
idx_import_user

28. Role Data Scope

SUPER_ADMIN

Akses seluruh data.

KOORDINATOR

Data dibatasi berdasarkan:

penugasan_koordinator

Koordinator hanya dapat mengakses Mata Kuliah dan Periode yang menjadi assignment aktifnya.

VERIFIKATOR

Data dibatasi berdasarkan:

penugasan_verifikator

Verifikator hanya dapat mengakses soal sesuai assignment aktifnya.

Authorization wajib dilakukan di backend, bukan hanya dengan menyembunyikan menu frontend.

29. File Storage

Database hanya menyimpan metadata file:

nama_file
file_path
file_mime_type
file_size

File fisik direkomendasikan disimpan melalui Laravel Storage:

storage/app/public/soal/
storage/app/public/revisi/
storage/app/public/berita-acara/

Gunakan:

php artisan storage:link

Jangan menyimpan binary file langsung di database.

30. Transaction Rules

Gunakan database transaction untuk:

Import Excel

Assignment Koordinator

Assignment Verifikator

Upload soal

Upload revisi

Proses verifikasi

Generate Berita Acara

Contoh:

DB::transaction(function () {
    // operasi database
});

Jika proses gagal, perubahan database harus rollback.

31. Dashboard Data

Dashboard harus mengambil angka dari database, bukan hardcode.

Contoh:

Total Dosen       -> COUNT(dosen)
Dosen Aktif       -> COUNT(dosen WHERE status = ACTIVE)
Total Mata Kuliah -> COUNT(mata_kuliah)
Total PLO         -> COUNT(plo)
Total CLO         -> COUNT(clo)
Total Soal        -> COUNT(soal)
Disetujui         -> COUNT(soal WHERE status = APPROVED)
Revisi            -> COUNT(soal WHERE status = REVISION)
Ditolak           -> COUNT(soal WHERE status = REJECTED)

Definisi "Menunggu Verifikasi" harus mengikuti business rule aplikasi dan status soal.

32. Laravel Model Mapping

Model utama:

User
Dosen
TahunAjaran
PeriodeVerifikasi
MataKuliah
Plo
Clo
KategoriSoal
PenugasanKoordinator
PenugasanVerifikator
Soal
RevisiSoal
Verifikasi
BeritaAcara
ImportLog
AuditLog

Pivot:

mata_kuliah_plo
mata_kuliah_clo
clo_plo

Dapat menggunakan belongsToMany() jika tidak memerlukan model pivot khusus.

33. Relationship Summary

User
 ├── hasOne Dosen
 ├── hasMany Soal
 ├── hasMany Verifikasi
 ├── hasMany ImportLog
 └── hasMany AuditLog

Dosen
 ├── belongsTo User
 ├── hasMany PenugasanKoordinator
 ├── hasMany PenugasanVerifikator
 └── hasMany BeritaAcara

TahunAjaran
 └── hasMany PeriodeVerifikasi

PeriodeVerifikasi
 ├── belongsTo TahunAjaran
 ├── hasMany PenugasanKoordinator
 ├── hasMany PenugasanVerifikator
 ├── hasMany Soal
 └── hasMany BeritaAcara

MataKuliah
 ├── belongsToMany Plo
 ├── belongsToMany Clo
 ├── hasMany PenugasanKoordinator
 ├── hasMany PenugasanVerifikator
 ├── hasMany Soal
 └── hasMany BeritaAcara

Plo
 ├── belongsToMany MataKuliah
 └── belongsToMany Clo

Clo
 ├── belongsToMany MataKuliah
 └── belongsToMany Plo

Soal
 ├── belongsTo MataKuliah
 ├── belongsTo PeriodeVerifikasi
 ├── belongsTo KategoriSoal
 ├── belongsTo User
 ├── hasMany RevisiSoal
 └── hasMany Verifikasi

RevisiSoal
 ├── belongsTo Soal
 └── belongsTo User

Verifikasi
 ├── belongsTo Soal
 └── belongsTo User

BeritaAcara
 ├── belongsTo PeriodeVerifikasi
 ├── belongsTo MataKuliah
 ├── belongsTo Dosen
 └── belongsTo User

34. Development Seeder Accounts

Akun development:

Role

Email

SUPER_ADMIN

admin@telkomuniversity.ac.id

KOORDINATOR

dosenmk@telkomuniversity.ac.id

VERIFIKATOR

dosenverif@telkomuniversity.ac.id

Password development:

Password123!

Password wajib di-hash menggunakan Laravel Hash. Seeder harus idempotent dan tidak membuat duplicate account.

35. Migration Rules

Implementasi Laravel harus:

Mengikuti schema ini.

Membuat foreign key sesuai dependency.

Mempertahankan UUID.

Mempertahankan ENUM yang telah ditentukan.

Mempertahankan unique constraint.

Mempertahankan check constraint.

Mempertahankan index.

Tidak mengubah business rule untuk mengatasi error sementara.

Perubahan setelah migration berjalan dilakukan melalui migration baru.

Untuk reset database development:

php artisan migrate:fresh --seed

36. Source of Truth

Struktur database wajib konsisten dengan SQL schema:

users
dosen
tahun_ajaran
periode_verifikasi
mata_kuliah
plo
clo
mata_kuliah_plo
mata_kuliah_clo
clo_plo
kategori_soal
penugasan_koordinator
penugasan_verifikator
soal
revisi_soal
verifikasi
berita_acara
import_logs
audit_logs

Jika requirement baru membutuhkan perubahan database:

Requirement
    ↓
Database Design
    ↓
Laravel Migration
    ↓
Model + Relationship
    ↓
Backend
    ↓
Frontend
    ↓
Testing
    ↓
Update DATABASE.md

Jangan menambahkan tabel atau mengubah constraint secara diam-diam.
