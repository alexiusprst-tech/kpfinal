Sistem Informasi Verifikasi Soal

Dokumentasi struktur data dan aturan relasi database untuk aplikasi Sistem Informasi Verifikasi Soal.

Database: PostgreSQLPrimary Key: UUIDID Generator: gen_random_uuid() dari extension pgcrypto

1. Tujuan

Dokumen ini mendefinisikan database schema secara konseptual dan implementatif, meliputi:

entitas utama;

atribut setiap entitas;

relasi antarentitas;

cardinality;

foreign key;

status dan lifecycle data;

aturan bisnis yang harus dijaga pada level aplikasi;

struktur data untuk import/export PLO, CLO, dan Mata Kuliah;

struktur penugasan Koordinator dan Verifikator;

struktur upload, revisi, verifikasi, dan Berita Acara;

audit dan histori aktivitas.

Dokumen ini harus menjadi acuan ketika membuat:

Laravel Models;

migrations;

Eloquent relationships;

Form Request validation;

Controllers/Services;

API Resources;

seeders;

dashboard queries.

2. Arsitektur Relasi Utama

Relasi utama sistem:

USERS
  │
  ├── DOSEN
  │
  ├── AUDIT LOGS
  ├── IMPORT LOGS
  ├── SOAL (uploaded_by)
  ├── REVISI SOAL
  ├── VERIFIKASI (verifikator)
  └── PENUGASAN (assigned_by)

TAHUN AJARAN
  │
  └── PERIODE VERIFIKASI
          │
          ├── PENUGASAN KOORDINATOR
          ├── PENUGASAN VERIFIKATOR
          ├── SOAL
          └── BERITA ACARA

MATA KULIAH
  │
  ├── MATA KULIAH ↔ PLO
  ├── MATA KULIAH ↔ CLO
  ├── PENUGASAN KOORDINATOR
  ├── PENUGASAN VERIFIKATOR
  ├── SOAL
  └── BERITA ACARA

PLO
  │
  ├── MATA KULIAH ↔ PLO
  └── CLO ↔ PLO

CLO
  │
  ├── MATA KULIAH ↔ CLO
  └── CLO ↔ PLO

SOAL
  │
  ├── REVISI SOAL
  └── VERIFIKASI

KATEGORI SOAL
  │
  └── SOAL

3. Entity Relationship Overview

users
  1 ───────── 0..1 dosen

tahun_ajaran
  1 ───────── N periode_verifikasi

mata_kuliah
  N ───────── N plo
       melalui mata_kuliah_plo

mata_kuliah
  N ───────── N clo
       melalui mata_kuliah_clo

clo
  N ───────── N plo
       melalui clo_plo

dosen
  N ───────── N mata_kuliah
       melalui penugasan_koordinator

dosen
  N ───────── N mata_kuliah
       melalui penugasan_verifikator

periode_verifikasi
  1 ───────── N penugasan_koordinator

periode_verifikasi
  1 ───────── N penugasan_verifikator

mata_kuliah
  1 ───────── N soal

periode_verifikasi
  1 ───────── N soal

kategori_soal
  1 ───────── N soal

soal
  1 ───────── N revisi_soal

soal
  1 ───────── N verifikasi

periode_verifikasi
  1 ───────── N berita_acara

mata_kuliah
  1 ───────── N berita_acara

4. Entity: users

Menyimpan akun autentikasi seluruh pengguna sistem.

Fields

Field

Type

Null

Default

Key

id

UUID

No

gen_random_uuid()

PK

name

VARCHAR(150)

No

-



email

VARCHAR(150)

No

-

UNIQUE

password

VARCHAR(255)

No

-



role

user_role

No

-



status

user_status

No

ACTIVE



email_verified_at

TIMESTAMP

Yes

NULL



remember_token

VARCHAR(100)

Yes

NULL



created_at

TIMESTAMP

No

CURRENT_TIMESTAMP



updated_at

TIMESTAMP

No

CURRENT_TIMESTAMP



Role

SUPER_ADMIN
KOORDINATOR
VERIFIKATOR

Relationship

users 1 ─── 0..1 dosen
users 1 ─── N soal
users 1 ─── N revisi_soal
users 1 ─── N verifikasi
users 1 ─── N import_logs
users 1 ─── N audit_logs

5. Entity: dosen

Menyimpan master data dosen.

Field

Type

Null

Default

Key

id

UUID

No

gen_random_uuid()

PK

kode_dosen

VARCHAR(50)

No

-

UNIQUE

nama_lengkap

VARCHAR(150)

No

-



email

VARCHAR(150)

Yes

NULL



user_id

UUID

Yes

NULL

UNIQUE, FK

status

user_status

No

ACTIVE



created_at

TIMESTAMP

No

CURRENT_TIMESTAMP



updated_at

TIMESTAMP

No

CURRENT_TIMESTAMP



deleted_at

TIMESTAMP

Yes

NULL



Relationship

dosen.user_id → users.id

ON DELETE SET NULL.

Dosen dapat digunakan sebagai:

Koordinator MK;

Verifikator;

pemilik akun pengguna jika memiliki user_id.

6. Entity: tahun_ajaran

Menyimpan tahun akademik.

Field

Type

Null

Default

id

UUID

No

gen_random_uuid()

nama

VARCHAR(50)

No

-

tahun_mulai

SMALLINT

No

-

tahun_selesai

SMALLINT

No

-

status

user_status

No

ACTIVE

created_at

TIMESTAMP

No

CURRENT_TIMESTAMP

updated_at

TIMESTAMP

No

CURRENT_TIMESTAMP

Constraint

tahun_selesai = tahun_mulai + 1

Contoh:

2026/2027
tahun_mulai  = 2026
tahun_selesai = 2027

7. Entity: periode_verifikasi

Menyimpan periode pelaksanaan verifikasi soal.

Field

Type

Null

Default

id

UUID

No

gen_random_uuid()

tahun_ajaran_id

UUID

No

-

nama

VARCHAR(100)

No

-

tanggal_mulai

DATE

No

-

tanggal_selesai

DATE

No

-

deadline_upload

TIMESTAMP

No

-

status

periode_status

No

DRAFT

created_at

TIMESTAMP

No

CURRENT_TIMESTAMP

updated_at

TIMESTAMP

No

CURRENT_TIMESTAMP

Relationship

periode_verifikasi.tahun_ajaran_id
        ↓
tahun_ajaran.id

Status

DRAFT
ACTIVE
INACTIVE
CLOSED

Business Rule

tanggal_selesai >= tanggal_mulai
deadline_upload::DATE >= tanggal_mulai

8. Entity: mata_kuliah

Master mata kuliah.

Field

Type

Null

Default

id

UUID

No

gen_random_uuid()

kode_mk

VARCHAR(50)

No

-

nama_mk

VARCHAR(200)

No

-

sks

SMALLINT

No

-

status

user_status

No

ACTIVE

created_at

TIMESTAMP

No

CURRENT_TIMESTAMP

updated_at

TIMESTAMP

No

CURRENT_TIMESTAMP

deleted_at

TIMESTAMP

Yes

NULL

Constraint

sks > 0 AND sks <= 10

9. Entity: plo

Program Learning Outcome.

Field

Type

Null

Default

id

UUID

No

gen_random_uuid()

kode_plo

VARCHAR(50)

No

-

deskripsi

TEXT

No

-

created_at

TIMESTAMP

No

CURRENT_TIMESTAMP

updated_at

TIMESTAMP

No

CURRENT_TIMESTAMP

deleted_at

TIMESTAMP

Yes

NULL

kode_plo bersifat UNIQUE.

10. Entity: clo

Course Learning Outcome.

Field

Type

Null

Default

id

UUID

No

gen_random_uuid()

kode_clo

VARCHAR(50)

No

-

deskripsi

TEXT

No

-

created_at

TIMESTAMP

No

CURRENT_TIMESTAMP

updated_at

TIMESTAMP

No

CURRENT_TIMESTAMP

deleted_at

TIMESTAMP

Yes

NULL

kode_clo bersifat UNIQUE.

11. Relasi Mata Kuliah ↔ PLO

Table:

mata_kuliah_plo

Relasi:

Mata Kuliah N ───── N PLO

Fields

Field

Type

Key

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



Constraint

UNIQUE (mata_kuliah_id, plo_id)

Business Rule

Satu Mata Kuliah dapat memiliki lebih dari satu PLO.

Contoh:

Pemrograman Web
 ├── PLO-01
 ├── PLO-02
 └── PLO-04

12. Relasi Mata Kuliah ↔ CLO

Table:

mata_kuliah_clo

Relasi:

Mata Kuliah N ───── N CLO

Satu mata kuliah dapat memiliki lebih dari satu CLO.

Contoh:

Pemrograman Web
 ├── CLO-01
 ├── CLO-02
 └── CLO-03

Constraint:

UNIQUE (mata_kuliah_id, clo_id)

13. Relasi CLO ↔ PLO

Table:

clo_plo

Relasi:

CLO N ───── N PLO

Satu CLO dapat berkontribusi terhadap lebih dari satu PLO.

Contoh:

CLO-01
 ├── PLO-01
 └── PLO-03

Constraint:

UNIQUE (clo_id, plo_id)

14. Entity: kategori_soal

Master kategori soal.

Field

Type

Null

id

UUID

No

nama

VARCHAR(100)

No

deskripsi

TEXT

Yes

status

user_status

No

created_at

TIMESTAMP

No

updated_at

TIMESTAMP

No

deleted_at

TIMESTAMP

Yes

Kategori digunakan oleh setiap soal.

15. Entity: penugasan_koordinator

Menentukan dosen yang menjadi Koordinator MK pada periode tertentu.

Field

Type

Null

id

UUID

No

dosen_id

UUID

No

mata_kuliah_id

UUID

No

periode_id

UUID

No

status

penugasan_status

No

tanggal_mulai

DATE

No

tanggal_selesai

DATE

Yes

assigned_by

UUID

No

created_at

TIMESTAMP

No

updated_at

TIMESTAMP

No

Unique Rule

UNIQUE (mata_kuliah_id, periode_id)

Artinya satu Mata Kuliah hanya memiliki satu penugasan Koordinator pada satu periode.

Assignment Flow

Super Admin
     ↓
Pilih Periode
     ↓
Pilih Mata Kuliah
     ↓
Pilih Dosen
     ↓
Tetapkan sebagai Koordinator

Jika periode berakhir:

ACTIVE
  ↓
ENDED
  ↓
Super Admin dapat menetapkan Koordinator baru
untuk periode berikutnya

16. Entity: penugasan_verifikator

Menentukan dosen yang bertugas melakukan verifikasi soal.

Field

Type

Null

id

UUID

No

dosen_id

UUID

No

mata_kuliah_id

UUID

No

periode_id

UUID

No

status

penugasan_status

No

tanggal_mulai

DATE

No

tanggal_selesai

DATE

Yes

assigned_by

UUID

No

created_at

TIMESTAMP

No

updated_at

TIMESTAMP

No

Tidak terdapat UNIQUE constraint pada kombinasi:

mata_kuliah_id + periode_id

sehingga schema saat ini memungkinkan lebih dari satu Verifikator untuk MK dan periode yang sama.

17. Entity: soal

Menyimpan file soal yang diunggah.

Field

Type

Null

id

UUID

No

mata_kuliah_id

UUID

No

periode_id

UUID

No

kategori_soal_id

UUID

No

uploaded_by

UUID

No

judul

VARCHAR(255)

No

nama_file

VARCHAR(255)

No

file_path

TEXT

No

file_mime_type

VARCHAR(100)

No

file_size

BIGINT

No

status

soal_status

No

submitted_at

TIMESTAMP

Yes

approved_at

TIMESTAMP

Yes

created_at

TIMESTAMP

No

updated_at

TIMESTAMP

No

deleted_at

TIMESTAMP

Yes

Status Lifecycle

DRAFT
  ↓
SUBMITTED
  ↓
IN_REVIEW
  ├── APPROVED
  ├── REVISION
  │      ↓
  │   RESUBMITTED
  │      ↓
  │   IN_REVIEW
  └── REJECTED

18. Entity: revisi_soal

Menyimpan versi file revisi soal.

Field

Type

Null

id

UUID

No

soal_id

UUID

No

version

INTEGER

No

nama_file

VARCHAR(255)

No

file_path

TEXT

No

file_mime_type

VARCHAR(100)

No

file_size

BIGINT

No

catatan

TEXT

Yes

uploaded_by

UUID

No

uploaded_at

TIMESTAMP

No

Constraint

UNIQUE (soal_id, version)
version > 0
file_size > 0

Contoh:

Soal #001
 ├── Revision v1
 ├── Revision v2
 └── Revision v3

19. Entity: verifikasi

Menyimpan histori tindakan Verifikator terhadap soal.

Field

Type

Null

id

UUID

No

soal_id

UUID

No

verifikator_id

UUID

No

action

verifikasi_action

No

catatan

TEXT

Yes

created_at

TIMESTAMP

No

Action

APPROVED
REVISION
REJECTED

Setiap proses verifikasi menghasilkan record histori.

20. Entity: berita_acara

Menyimpan data Berita Acara hasil proses verifikasi.

Field

Type

Null

id

UUID

No

nomor

VARCHAR(100)

No

periode_id

UUID

No

mata_kuliah_id

UUID

No

koordinator_id

UUID

No

dibuat_oleh

UUID

No

jumlah_soal

INTEGER

No

jumlah_approved

INTEGER

No

jumlah_revision

INTEGER

No

jumlah_rejected

INTEGER

No

tanggal

DATE

No

file_path

TEXT

Yes

created_at

TIMESTAMP

No

updated_at

TIMESTAMP

No

nomor bersifat UNIQUE.

21. Entity: import_logs

Mencatat proses import data.

Field

Type

Null

id

UUID

No

type

import_type

No

filename

VARCHAR(255)

No

total_rows

INTEGER

No

success_rows

INTEGER

No

failed_rows

INTEGER

No

status

import_status

No

error_summary

JSONB

Yes

imported_by

UUID

No

created_at

TIMESTAMP

No

updated_at

TIMESTAMP

No

Import Type

PLO
CLO
MATA_KULIAH

Import Status

PROCESSING
SUCCESS
FAILED
PARTIAL

22. Entity: audit_logs

Menyimpan histori aktivitas pengguna.

Field

Type

Null

id

UUID

No

user_id

UUID

Yes

action

VARCHAR(100)

No

entity_type

VARCHAR(100)

Yes

entity_id

UUID

Yes

old_values

JSONB

Yes

new_values

JSONB

Yes

ip_address

INET

Yes

user_agent

TEXT

Yes

created_at

TIMESTAMP

No

Audit log tidak boleh menghambat proses utama apabila logging mengalami kegagalan non-kritis.

23. Enum Schema

user_role

SUPER_ADMIN
KOORDINATOR
VERIFIKATOR

user_status

ACTIVE
INACTIVE

periode_status

DRAFT
ACTIVE
INACTIVE
CLOSED

penugasan_status

ACTIVE
INACTIVE
ENDED

soal_status

DRAFT
SUBMITTED
IN_REVIEW
REVISION
RESUBMITTED
APPROVED
REJECTED

import_type

PLO
CLO
MATA_KULIAH

import_status

PROCESSING
SUCCESS
FAILED
PARTIAL

verifikasi_action

APPROVED
REVISION
REJECTED

24. Mapping Role

SUPER_ADMIN

Memiliki akses terhadap:

Dashboard
Dosen
Mata Kuliah
PLO
CLO
Kategori Soal
Tahun Ajaran
Periode Verifikasi
Koordinator MK
Dosen Verifikator
Import Data
Audit Log
Monitoring
Berita Acara

Super Admin dapat:

mengelola master data;

import/export PLO;

import/export CLO;

import/export Mata Kuliah;

membuat periode;

mengaktifkan/menutup periode;

menetapkan Koordinator;

mengganti Koordinator pada periode berikutnya;

menetapkan Verifikator;

melihat statistik sistem.

KOORDINATOR

Akses utama:

Dashboard
Upload Soal
Upload Revisi
Download Template Soal
Melihat Status Verifikasi
Berita Acara

Koordinator hanya dapat mengelola data berdasarkan penugasan aktifnya.

VERIFIKATOR

Akses utama:

Dashboard
Daftar Soal
Detail Soal
Verifikasi Soal
Memberikan Catatan
Melihat Riwayat Verifikasi

Verifikator hanya dapat memproses soal berdasarkan penugasan aktif.

25. Scope Data Berdasarkan Penugasan

Semua endpoint yang berkaitan dengan soal wajib melakukan pengecekan:

user
 ↓
role
 ↓
periode aktif
 ↓
mata kuliah
 ↓
penugasan

Contoh:

GET /soal

untuk Verifikator tidak boleh mengembalikan seluruh soal.

Query harus dibatasi berdasarkan:

penugasan_verifikator.dosen_id
penugasan_verifikator.periode_id
penugasan_verifikator.mata_kuliah_id

26. Aturan Upload Soal

Upload soal hanya diperbolehkan jika:

periode.status = ACTIVE

dan:

current_datetime <= deadline_upload

serta pengguna mempunyai penugasan yang valid.

File yang diterima mengikuti kebijakan aplikasi. Schema database menyimpan metadata:

nama_file
file_path
file_mime_type
file_size

27. Aturan Revisi

Jika status soal:

REVISION

maka Koordinator dapat mengunggah revisi.

Setiap revisi:

version = version sebelumnya + 1

Setelah revisi berhasil:

REVISION
   ↓
RESUBMITTED

Kemudian soal masuk kembali ke proses verifikasi:

RESUBMITTED
   ↓
IN_REVIEW

28. Aturan Verifikasi

Verifikator dapat memilih:

APPROVED
REVISION
REJECTED

APPROVED

soal.status = APPROVED
soal.approved_at = current_timestamp

REVISION

soal.status = REVISION

Catatan revisi wajib diisi untuk tindakan REVISION.

REJECTED

soal.status = REJECTED

Catatan penolakan disarankan wajib pada level aplikasi.

29. Aturan Koordinator

Penetapan Koordinator berbasis periode.

Contoh:

Periode 2026/2027 Ganjil
MK Pemrograman Web
→ Dosen A

Ketika periode berakhir:

Dosen A
→ ENDED

Pada periode berikutnya:

MK Pemrograman Web
→ Dosen B

Data historis Dosen A tetap disimpan.

Jangan menghapus assignment lama hanya karena periode telah selesai.

30. Import PLO

Flow:

Super Admin
    ↓
Download Template Excel
    ↓
Isi Template
    ↓
Upload Excel
    ↓
Validasi File
    ↓
Validasi Header
    ↓
Validasi Row
    ↓
Import
    ↓
import_logs
    ↓
SUCCESS / PARTIAL / FAILED

Data utama masuk ke:

plo

Jika import gagal sebagian:

error_summary JSONB

digunakan untuk menyimpan detail error.

31. Import CLO

Flow:

Download Template
       ↓
Isi Excel
       ↓
Upload
       ↓
Validasi
       ↓
Import
       ↓
clo

Relasi CLO dengan PLO dikelola melalui:

clo_plo

Relasi CLO dengan Mata Kuliah melalui:

mata_kuliah_clo

32. Import Mata Kuliah

Flow:

Download Template Excel
       ↓
Isi Template
       ↓
Upload
       ↓
Validasi
       ↓
Import
       ↓
mata_kuliah

Relasi PLO dan CLO tidak harus dimasukkan pada saat import Mata Kuliah jika proses aplikasi memisahkannya.

Relasi dapat dikelola setelah master data tersedia.

33. Export Data

Data berikut harus mendukung export:

PLO
CLO
Mata Kuliah

Export tidak menghapus data.

Format utama:

.xlsx

34. File Storage Schema

Database hanya menyimpan path file.

Contoh:

storage/questions/{periode}/{mata-kuliah}/{uuid}.pdf

Revisi:

storage/questions/{periode}/{mata-kuliah}/{soal}/{version}.pdf

Template:

storage/templates/plo.xlsx
storage/templates/clo.xlsx
storage/templates/mata-kuliah.xlsx

Berita Acara:

storage/berita-acara/{periode}/{mata-kuliah}/{nomor}.pdf

Jangan menyimpan binary file langsung di PostgreSQL.

35. Referential Integrity

CASCADE

Digunakan pada relasi dependent:

mata_kuliah_plo → mata_kuliah
mata_kuliah_plo → plo

mata_kuliah_clo → mata_kuliah
mata_kuliah_clo → clo

clo_plo → clo
clo_plo → plo

revisi_soal → soal
verifikasi → soal

RESTRICT

Digunakan untuk menjaga histori penting:

soal → mata_kuliah
soal → periode_verifikasi
soal → kategori_soal
soal → users

penugasan → dosen
penugasan → mata_kuliah
penugasan → periode

berita_acara → periode
berita_acara → mata_kuliah
berita_acara → dosen

SET NULL

Digunakan pada:

dosen.user_id → users.id
audit_logs.user_id → users.id

36. Soft Delete

Entity yang mempunyai:

deleted_at

menggunakan soft delete pada Laravel.

Entity tersebut:

dosen
mata_kuliah
plo
clo
kategori_soal
soal

Data soft deleted tidak boleh tampil pada query normal.

Gunakan:

Model::query()

untuk data aktif/non-deleted.

Gunakan:

Model::withTrashed()

hanya ketika kebutuhan administratif/historis memerlukannya.

37. Laravel Model Mapping

Table

Model

users

User

dosen

Dosen

tahun_ajaran

TahunAjaran

periode_verifikasi

PeriodeVerifikasi

mata_kuliah

MataKuliah

plo

Plo

clo

Clo

mata_kuliah_plo

MataKuliahPlo

mata_kuliah_clo

MataKuliahClo

clo_plo

CloPlo

kategori_soal

KategoriSoal

penugasan_koordinator

PenugasanKoordinator

penugasan_verifikator

PenugasanVerifikator

soal

Soal

revisi_soal

RevisiSoal

verifikasi

Verifikasi

berita_acara

BeritaAcara

import_logs

ImportLog

audit_logs

AuditLog

38. Eloquent Relationship Summary

User

User
 ├── hasOne(Dosen)
 ├── hasMany(Soal, uploaded_by)
 ├── hasMany(RevisiSoal, uploaded_by)
 ├── hasMany(Verifikasi, verifikator_id)
 ├── hasMany(ImportLog, imported_by)
 └── hasMany(AuditLog, user_id)

Dosen

Dosen
 ├── belongsTo(User)
 ├── hasMany(PenugasanKoordinator)
 ├── hasMany(PenugasanVerifikator)
 └── hasMany(BeritaAcara, koordinator_id)

MataKuliah

MataKuliah
 ├── belongsToMany(Plo)
 ├── belongsToMany(Clo)
 ├── hasMany(PenugasanKoordinator)
 ├── hasMany(PenugasanVerifikator)
 ├── hasMany(Soal)
 └── hasMany(BeritaAcara)

PLO

Plo
 ├── belongsToMany(MataKuliah)
 └── belongsToMany(Clo)

CLO

Clo
 ├── belongsToMany(MataKuliah)
 └── belongsToMany(Plo)

PeriodeVerifikasi

PeriodeVerifikasi
 ├── belongsTo(TahunAjaran)
 ├── hasMany(PenugasanKoordinator)
 ├── hasMany(PenugasanVerifikator)
 ├── hasMany(Soal)
 └── hasMany(BeritaAcara)

Soal

Soal
 ├── belongsTo(MataKuliah)
 ├── belongsTo(PeriodeVerifikasi)
 ├── belongsTo(KategoriSoal)
 ├── belongsTo(User, uploaded_by)
 ├── hasMany(RevisiSoal)
 └── hasMany(Verifikasi)

39. Transaction Requirements

Gunakan database transaction untuk operasi yang memodifikasi beberapa tabel.

Import

BEGIN
  validate
  create/update master data
  create relationship
  update import_logs
COMMIT

Jika terjadi error fatal:

ROLLBACK

Verification

BEGIN
  create verifikasi
  update soal.status
  update approved_at jika APPROVED
  create audit_logs
COMMIT

Assignment

BEGIN
  close/terminate previous assignment jika diperlukan
  create assignment baru
  create audit log
COMMIT

40. Dashboard Data Mapping

Dashboard Super Admin menggunakan agregasi dari:

users
dosen
mata_kuliah
plo
clo
soal
periode_verifikasi
penugasan_koordinator
penugasan_verifikator

KPI utama:

Total Dosen
Total Mata Kuliah
Total PLO
Total CLO
Total Soal
Soal Menunggu Verifikasi
Soal Revisi
Soal Disetujui
Soal Ditolak
Progress Verifikasi
Periode Aktif

Progress:

approved / total_soal * 100

Harus menghindari division by zero.

41. Data Consistency Rules

Aplikasi wajib memastikan:

Email user unik.

Kode dosen unik.

Kode mata kuliah unik.

Kode PLO unik.

Kode CLO unik.

Kategori soal unik.

Satu MK hanya memiliki satu Koordinator untuk satu periode.

Assignment historis tidak dihapus ketika periode berakhir.

Soal hanya dapat diupload pada periode yang sesuai.

Verifikator hanya dapat memverifikasi soal yang menjadi kewenangannya.

Revision version tidak boleh duplikat.

Import harus memiliki import log.

File database hanya menyimpan metadata/path, bukan binary file.

Audit aktivitas penting harus dicatat.

Relasi many-to-many tidak boleh memiliki duplicate pair.

42. Security Rules

Jangan percaya:

user_id
role
periode_id
mata_kuliah_id

yang dikirim dari frontend.

Semua harus diverifikasi melalui authenticated user dan database.

Contoh:

Frontend:
periode_id = ABC

Backend:
cek apakah periode ABC benar-benar dapat diakses user

Authorization harus dilakukan pada server.

43. Schema Change Policy

Jika ada perubahan schema:

Jangan mengubah database production secara manual.

Buat Laravel migration.

Update DATABASE.md.

Update SCHEMA.md.

Update model.

Update validation.

Update API documentation.

Update seeders.

Jalankan test.

Review dampak terhadap data existing.

44. Source of Truth

Prioritas sumber kebenaran schema:

Laravel Migration
      ↓
Database PostgreSQL
      ↓
DATABASE.md
      ↓
SCHEMA.md
      ↓
Laravel Models
      ↓
API / Frontend

Jika terjadi ketidaksesuaian, jangan langsung menyesuaikan frontend.

Periksa:

Migration
Database
Model
Documentation

terlebih dahulu.

45. Final Schema Principle

Schema dirancang untuk mendukung sistem verifikasi soal berbasis periode dengan tiga role utama:

SUPER_ADMIN
     ↓
Mengelola master data,
periode, Koordinator,
Verifikator, import/export

KOORDINATOR
     ↓
Mengunggah soal,
mengunggah revisi,
melihat status,
menghasilkan Berita Acara

VERIFIKATOR
     ↓
Memeriksa soal,
memberikan catatan,
approve/revision/reject

Model data mempertahankan histori melalui:

penugasan
verifikasi
revisi_soal
audit_logs
import_logs

dan mendukung hubungan:

1 Mata Kuliah
   ├── banyak PLO
   ├── banyak CLO
   └── banyak Soal

1 CLO
   └── banyak PLO

1 Soal
   └── banyak Revisi
   └── banyak Riwayat Verifikasi

Dokumen ini harus dijaga konsisten dengan schema PostgreSQL dan implementasi Laravel selama pengembangan.
