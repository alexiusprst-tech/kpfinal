# USER FLOW
## Sistem Informasi Verifikasi dan Manajemen Data PLO, CLO, Mata Kuliah, dan Dosen

> Catatan: `Curriculum` hanya digunakan sebagai parent/konteks data pada database dan bukan merupakan menu atau proses bisnis utama.

---

## 1. Aktor Sistem

| Aktor | Hak Akses Utama |
|---|---|
| Super Admin | Mengelola seluruh data master, user, import, PLO, CLO, mapping, dan konfigurasi |
| Koordinator | Mengelola dan memvalidasi data Mata Kuliah, PLO, CLO, dan mapping |
| Verifikator | Memeriksa dan memverifikasi data yang ditugaskan |

---

## 2. Flow Utama

```text
                         LOGIN
                           │
                           ▼
                      DASHBOARD
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
           DOSEN       MATA KULIAH       PLO
                           │             │
                           ▼             │
                          CLO ◄──────────┘
                           │
                           ▼
                    MAPPING CLO-PLO
                           │
                           ▼
                       VERIFIKASI
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                  REVISI       APPROVED
```

---

## 3. Login Flow

```text
[Login]
   │
   ▼
Input Username/Email
   │
   ▼
Input Password
   │
   ▼
Klik "Masuk"
   │
   ▼
Validasi Akun
   │
   ├── Gagal ──► Tampilkan Error ──► Kembali Login
   │
   └── Berhasil
         │
         ▼
       Cek Role
         ├── Super Admin ──► Dashboard
         ├── Koordinator ──► Dashboard
         └── Verifikator ──► Dashboard
```

---

## 4. Dashboard Flow

Dashboard menampilkan:

- Jumlah Mata Kuliah
- Jumlah PLO
- Jumlah CLO
- Jumlah Mapping CLO-PLO
- Jumlah Dosen
- Data menunggu verifikasi
- Data revisi
- Aktivitas terbaru

```text
LOGIN
  │
  ▼
DASHBOARD
  ├── Statistik
  ├── Aktivitas Terbaru
  ├── Menunggu Verifikasi
  └── Quick Action
```

---

## 5. Flow Master Data Dosen

### Daftar Dosen

```text
Dashboard
   ↓
Master Data
   ↓
Dosen
   ↓
Daftar Dosen
   ├── Search
   ├── Filter Kategori
   ├── Edit
   └── Hapus
```

Field:

| Field | Contoh |
|---|---|
| Nama Lengkap | Qilbaaini Effendi Muftikhali, S.Kom., M.Kom. |
| Kode Dosen | QLB |
| Kategori Dosen | Dosen Tetap / LB |

### Tambah Dosen

```text
Daftar Dosen
     ↓
Tambah Dosen
     ↓
Form
     ├── Nama Lengkap
     ├── Kode Dosen
     └── Kategori Dosen
     ↓
Validasi
     ├── Tidak Valid → Error
     └── Valid → Simpan
```

---

## 6. Flow Mata Kuliah

### Daftar Mata Kuliah

```text
Dashboard
   ↓
Master Data
   ↓
Mata Kuliah
   ↓
Daftar Mata Kuliah
```

Field:

| Field | Keterangan |
|---|---|
| Semester | Semester mata kuliah |
| Kode | Kode mata kuliah |
| Nama MK | Nama mata kuliah |
| Nama MK English | Nama bahasa Inggris |
| SKS | Bobot SKS |
| Kategori | Kategori mata kuliah |
| Aksi | Detail/Edit/Hapus |

### Tambah Mata Kuliah

```text
Mata Kuliah
    ↓
Tambah
    ↓
Form
    ├── Semester
    ├── Kode
    ├── Nama MK (INA)
    ├── Nama MK (ENG)
    ├── SKS
    └── Kategori
    ↓
Validasi
    ├── Tidak Valid → Error
    └── Valid → Simpan
```

---

## 7. Flow PLO

PLO menggunakan alur **Download Template → Isi Manual → Import → Validasi → Preview → Upload/Simpan → Edit → Export**.

```text
Menu PLO
   ↓
Download Template
   ↓
Isi Excel Secara Manual
   ↓
Import File
   ↓
Validasi Data
   ├── Tidak Valid → Tampilkan Error → Perbaiki Excel → Import Ulang
   │
   └── Valid
        ↓
      Preview
        ↓
   Review Data
        ├── Batal → Kembali
        └── Upload / Simpan
              ↓
          Data PLO Tersimpan
              ↓
       ┌──────┴──────┐
       ▼             ▼
      Edit         Export
```

### Template PLO

| KODE PLO | Program Learning Outcome / Capaian Pembelajaran |
|---|---|
| PLO01 | Mampu ... |
| PLO02 | Mampu ... |

### Validasi PLO

Sistem memeriksa:
- Header sesuai template.
- Kode PLO tidak kosong.
- Deskripsi PLO tidak kosong.
- Format data sesuai.
- Kode PLO tidak duplikat.
- File tidak kosong.

### Edit PLO

Data yang sudah tersimpan dapat diedit langsung melalui sistem.

```text
Daftar PLO
   ↓
Pilih PLO
   ↓
Edit
   ↓
Ubah Data
   ↓
Validasi
   ↓
Simpan Perubahan
```

### Export PLO

```text
Daftar PLO
   ↓
Export
   ↓
Excel
   ↓
PLO.xlsx
```

---

## 8. Flow CLO

CLO dikelola berdasarkan Mata Kuliah. Satu Mata Kuliah dapat memiliki banyak CLO, dan CLO dapat dipetakan ke satu atau beberapa PLO.

```text
Menu CLO
   ↓
Pilih Mata Kuliah
   ↓
Download Template CLO
   ↓
Isi Excel Secara Manual
   ↓
Import File
   ↓
Validasi Data
   ├── Tidak Valid → Tampilkan Error → Perbaiki Excel → Import Ulang
   │
   └── Valid
        ↓
      Preview
        ↓
   Review Data
        ├── Batal → Kembali
        └── Upload / Simpan
              ↓
          CLO Tersimpan
              ↓
       Mapping CLO → PLO
              ↓
       ┌──────┴──────┐
       ▼             ▼
      Edit         Export
```

### Template CLO & Mapping

| PLO | Kode CLO | CLO | Bloom | MK |
|---|---|---|---|---|
| PLO01 | CLO01 | Mampu ... | 4 - Analyze | Algoritma dan Pemrograman |
| PLO02 | CLO02 | Mampu ... | 6 - Create | Pengembangan Aplikasi Website |

### Detail Flow CLO

**1. Pilih Mata Kuliah**

```text
Menu CLO
   ↓
Pilih Mata Kuliah
   ↓
Detail Mata Kuliah
```

**2. Download Template**

```text
Detail Mata Kuliah
   ↓
Download Template CLO
   ↓
Template CLO.xlsx
```

**3. Isi Manual**

User mengisi:
- PLO
- Kode CLO
- CLO
- Bloom
- MK

```text
Template
   ↓
Isi Manual
   ↓
Simpan Excel
```

**4. Import**

```text
CLO
 ↓
Import Excel
 ↓
Pilih File
 ↓
Import
```

**5. Validasi**

Sistem memeriksa:
- Header sesuai template.
- Mata Kuliah ditemukan.
- Kode CLO tidak kosong.
- Deskripsi CLO tidak kosong.
- PLO ditemukan.
- Bloom Level sesuai.
- CLO tidak duplikat.
- Mapping CLO-PLO tidak duplikat.

**6. Preview**

```text
┌───────┬─────────┬──────────────────────┬────────────┬──────────────────────────┐
│ PLO   │ Kode CLO│ CLO                  │ Bloom      │ MK                       │
├───────┼─────────┼──────────────────────┼────────────┼──────────────────────────┤
│ PLO01 │ CLO01   │ Mampu menganalisis...│ 4 - Analyze│ Algoritma dan Pemrograman│
│ PLO02 │ CLO02   │ Mampu mengembangkan..│ 6 - Create │ Pengembangan Aplikasi... │
└───────┴─────────┴──────────────────────┴────────────┴──────────────────────────┘

[ Kembali ]                    [ Upload / Simpan ]
```

**7. Upload / Simpan**

```text
Preview
   ↓
Upload / Simpan
   ↓
Create / Update CLO
   ↓
Create / Update Mapping CLO-PLO
   ↓
Database
```

**8. Edit CLO melalui Sistem**

```text
Daftar CLO
   ↓
Pilih CLO
   ↓
Edit
   ↓
Form Edit
   ├── Kode CLO
   ├── Deskripsi CLO
   ├── Bloom Level
   └── Mapping PLO
   ↓
Validasi
   ↓
Simpan Perubahan
```

**9. Export CLO**

```text
Daftar CLO
   ↓
Export
   ↓
Excel
   ↓
CLO.xlsx
```

---

## 9. Flow Mapping CLO-PLO

Mapping merupakan bagian dari pengelolaan CLO. Mapping dapat dibuat dari hasil import Excel maupun dikelola langsung melalui sistem.

```text
CLO
 │
 ├──────► PLO01
 ├──────► PLO02
 └──────► PLO03
```

### Kelola Mapping

```text
Detail CLO
    ↓
Mapping PLO
    ↓
Tambah / Edit / Hapus
    ↓
Validasi
    ↓
Simpan
```

Satu CLO dapat memiliki beberapa PLO, dan satu PLO dapat digunakan oleh banyak CLO.

---

## 10. Flow Import PLO & CLO Secara Umum

Pola import wajib konsisten:

```text
DOWNLOAD TEMPLATE
       ↓
ISI MANUAL
       ↓
IMPORT EXCEL
       ↓
VALIDASI
       │
       ├── INVALID
       │     ↓
       │  Tampilkan Detail Error
       │     ↓
       │  Perbaiki File Excel
       │     ↓
       │  Import Ulang
       │
       └── VALID
             ↓
          PREVIEW
             ↓
        REVIEW USER
             │
             ├── BATAL
             │
             └── UPLOAD / SIMPAN
                    ↓
                 DATABASE
                    ↓
              DATA TERSIMPAN
                    ↓
             ┌──────┴──────┐
             ▼             ▼
           EDIT          EXPORT
```

### Import vs Edit

**Import** digunakan untuk memasukkan banyak data:

```text
Excel → Import → Validasi → Preview → Upload/Simpan → Database
```

**Edit** digunakan untuk mengubah data yang sudah tersimpan:

```text
Database → Pilih Data → Edit → Validasi → Simpan → Database Updated
```

---

## Tambah PLO

```text
Daftar PLO
    ↓
Tambah PLO
    ↓
Form
    ├── Kode PLO
    ├── Deskripsi
    └── Kategori
    ↓
Validasi
    ├── Tidak Valid → Error
    └── Valid → Simpan
```

---

## 8. Flow CLO

CLO merupakan capaian pembelajaran yang dimiliki oleh suatu Mata Kuliah.

```text
Mata Kuliah
    ↓
Detail Mata Kuliah
    ↓
Tab CLO
    ↓
Daftar CLO
```

Struktur:

```text
Mata Kuliah
 ├── CLO01
 │    ├── Deskripsi
 │    └── Bloom Level
 ├── CLO02
 │    ├── Deskripsi
 │    └── Bloom Level
 └── CLO03
      ├── Deskripsi
      └── Bloom Level
```

### Tambah CLO

```text
Detail Mata Kuliah
       ↓
Tab CLO
       ↓
Tambah CLO
       ↓
Form
       ├── Kode/Nomor CLO
       ├── Deskripsi CLO
       └── Bloom Level
       ↓
Validasi
       ├── Tidak Valid → Error
       └── Valid → Simpan
```

---

## 9. Flow Mapping CLO-PLO

```text
Menu Mapping CLO-PLO
       ↓
Pilih Mata Kuliah
       ↓
Pilih CLO
       ↓
Pilih PLO
       ↓
Review Mapping
       ↓
Simpan
       ↓
Validasi
       ├── Tidak Valid → Error
       └── Valid → Mapping Tersimpan
```

### Relasi

Sistem mendukung many-to-many antara CLO dan PLO.

```text
Mata Kuliah
     │
     ▼
    CLO
     │
     ├────────► PLO01
     ├────────► PLO02
     └────────► PLO03
```

Satu CLO dapat dipetakan ke beberapa PLO dan satu PLO dapat digunakan oleh banyak CLO.

---

## 10. Flow Import Excel

```text
Import Data
     ↓
Pilih Jenis Import
     ├── Mata Kuliah
     ├── Kategori Mata Kuliah
     ├── PLO
     └── CLO & Mapping
     ↓
Download Template
     ↓
Isi Excel
     ↓
Upload
     ↓
Validasi Header & Data
     ├── Tidak Valid → Error
     └── Valid
            ↓
         Preview
            ↓
        Konfirmasi
            ↓
        Proses Import
            ↓
       Simpan Database
            ↓
       Import Berhasil
```

---

## 11. Template Import

### Mata Kuliah

Wajib:

```text
Semester
Kode
Nama MK (INA)
SKS
```

Opsional:

```text
Nama MK (ENG)
```

### Kategori Mata Kuliah

```text
Kategori
Nama Mata Kuliah
```

### PLO

```text
KODE PLO
Program Learning Outcome / Capaian Pembelajaran Kuliah
```

### CLO & Mapping

```text
PLO
Kode CLO
CLO
Bloom
MK
```

---

## 12. Flow Proses Import CLO & Mapping

```text
Upload Excel
      ↓
Validasi Header
      ↓
Baca Data CLO
      ↓
Cari Mata Kuliah
      ↓
Cari PLO
      ↓
Create / Find CLO
      ↓
Mapping CLO → PLO
      ↓
Simpan
```

Contoh:

```text
PLO02 | PLO02-CLO02 | Mampu mengembangkan solusi... | 6 - Create | Pengembangan Aplikasi Website
```

Diproses menjadi:

```text
PLO02
  └── CLO02
       ├── Description
       ├── Bloom = 6 - Create
       └── Course = Pengembangan Aplikasi Website
```

---

## 13. Validasi Import

### Mata Kuliah

- Nama Mata Kuliah tidak boleh kosong.
- Semester harus angka 1–14.
- SKS harus angka positif.
- Kode kosong dapat dibuat otomatis.
- Kode duplikat ditangani sistem.

### Kategori

- Kategori tidak boleh kosong.
- Nama Mata Kuliah tidak boleh kosong.
- Nilai kategori dapat diteruskan pada baris berikutnya jika menggunakan merged cell.

### PLO

- Kode PLO tidak boleh kosong.
- Deskripsi PLO tidak boleh kosong.
- Kode duplikat ditangani sistem.

### CLO & Mapping

- Mata Kuliah tidak boleh kosong.
- Kode CLO tidak boleh kosong.
- PLO harus ditemukan.
- Mata Kuliah harus ditemukan.
- CLO yang sama tidak dibuat berulang.
- Mapping yang sama tidak dibuat duplikat.

---

## 14. Flow CRUD

### Create

```text
Tambah
  ↓
Isi Form
  ↓
Validasi
  ↓
Simpan
  ↓
Notifikasi
```

### Read

```text
Buka Menu
  ↓
Ambil Data
  ↓
Tampilkan Table
```

### Update

```text
Edit
  ↓
Data Lama
  ↓
Ubah
  ↓
Validasi
  ↓
Update
```

### Delete

```text
Hapus
  ↓
Konfirmasi
  ↓
Cek Relasi
  ↓
Hapus
  ↓
Notifikasi
```

---

## 15. Flow Verifikasi

```text
Data Masuk
    ↓
Menunggu Verifikasi
    ↓
Verifikator Membuka Data
    ↓
Review
    ├── Sesuai → APPROVED
    │
    └── Tidak Sesuai
          ↓
       REVISION
          ↓
       Perbaikan
          ↓
      Submit Ulang
          ↓
      RESUBMITTED
          ↓
      Verifikasi
```

Status:

```text
DRAFT
  ↓
SUBMITTED
  ↓
IN_REVIEW
  ├──→ REVISION
  │      ↓
  │   RESUBMITTED
  │      ↓
  └──────┘
  ↓
APPROVED
```

---

## 16. Flow Activity Log

```text
User melakukan aktivitas
        ↓
Activity Log Service
        ↓
Simpan Log
        ├── User
        ├── Action
        ├── Module
        ├── Description
        ├── Data ID
        └── Timestamp
```

Action:

```text
LOGIN
LOGOUT
CREATE
UPDATE
DELETE
IMPORT
VERIFY
```

---

## 17. Role-Based Flow

### Super Admin

```text
Login
  ↓
Dashboard
  ├── User Management
  ├── Dosen
  ├── Mata Kuliah
  ├── PLO
  ├── CLO
  ├── Mapping CLO-PLO
  ├── Import Data
  ├── Verifikasi
  └── Activity Log
```

### Koordinator

```text
Login
  ↓
Dashboard
  ├── Mata Kuliah
  ├── PLO
  ├── CLO
  ├── Mapping CLO-PLO
  ├── Import Data
  └── Validasi
```

### Verifikator

```text
Login
  ↓
Dashboard
  ↓
Data Ditugaskan
  ↓
Review
  ├── Approved
  └── Revision
```

---

## 18. Search & Filter Flow

```text
Daftar Data
    ↓
Search / Filter
    ↓
Masukkan Keyword
    ↓
Sistem Memproses
    ↓
Tampilkan Hasil
```

Filter:

- Kode
- Nama
- Semester
- Kategori
- PLO
- CLO
- Bloom Level
- Kategori Dosen
- Status Verifikasi

---

## 19. Error Handling Flow

```text
User melakukan aksi
        ↓
Validasi Sistem
        ├── Valid → Lanjut Proses
        │
        └── Invalid
              ↓
        Tampilkan Error
              ↓
        User Memperbaiki
              ↓
        Submit Kembali
```

Contoh:

```text
Baris 12:
Kode PLO tidak boleh kosong.
```

```text
Baris 15:
Nama Mata Kuliah tidak boleh kosong.
```

```text
Baris 20:
Semester harus berupa angka antara 1 sampai 14.
```

---

## 20. Navigasi Sistem

```text
Dashboard
│
├── Master Data
│   ├── Dosen
│   ├── Mata Kuliah
│   └── PLO
│
├── CLO
│   └── CLO berdasarkan Mata Kuliah
│
├── Mapping
│   └── Mapping CLO-PLO
│
├── Import Data
│   ├── Mata Kuliah
│   ├── Kategori
│   ├── PLO
│   └── CLO & Mapping
│
├── Verifikasi
│   ├── Menunggu Verifikasi
│   ├── Revisi
│   └── Terverifikasi
│
└── Activity Log
```

---

## 21. Struktur Relasi Data

`Curriculum` tetap digunakan sebagai parent data, tetapi tidak menjadi flow menu.

```text
                    Curriculum
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
         Course                    PLO
            │
            ▼
           CLO
            │
            │ Mapping
            ▼
           PLO
```

Relasi utama:

```text
Curriculum
 ├── hasMany Courses
 │       └── hasMany CLOs
 │
 └── hasMany PLOs

CLO
 └── belongsToMany PLOs
```

---

## 22. End-to-End Flow

```text
                         LOGIN
                           │
                           ▼
                      DASHBOARD
                           │
                           ▼
                    MASTER DATA
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
      DOSEN           MATA KULIAH            PLO
                           │                  │
                           ▼                  │
                          CLO ◄────────────────
                           │
                           ▼
                    MAPPING CLO-PLO
                           │
                           ▼
                         SUBMIT
                           │
                           ▼
                       VERIFIKASI
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
               REVISION           APPROVED
                  │
                  ▼
             RESUBMITTED
                  │
                  ▼
              VERIFIKASI
```

---

## 23. Prinsip User Flow

1. **Simple** — proses dibuat sesingkat mungkin.
2. **Role-Based** — menu dan aksi mengikuti hak akses.
3. **Validated** — data divalidasi sebelum disimpan.
4. **Traceable** — aktivitas dicatat melalui Activity Log.
5. **Consistent** — pola CRUD dan validasi konsisten.
6. **Relationship-Aware** — hubungan Mata Kuliah, CLO, dan PLO tetap terjaga.
7. **Import-Friendly** — data dapat dimasukkan melalui template Excel.
8. **Error-Friendly** — kesalahan ditampilkan secara spesifik.
9. **No Curriculum Workflow** — Curriculum tidak memiliki menu atau alur bisnis tersendiri.

---

## 24. Ringkasan

```text
LOGIN
  ↓
DASHBOARD
  ↓
DOSEN
  ↓
MATA KULIAH
  ↓
CLO
  ↓
PLO
  ↓
MAPPING CLO-PLO
  ↓
VERIFIKASI
  ↓
APPROVED
```

**Fokus utama sistem:**

```text
MATA KULIAH
      │
      ▼
     CLO
      │
      ▼
MAPPING
      │
      ▼
     PLO
      │
      ▼
 VERIFIKASI
```
