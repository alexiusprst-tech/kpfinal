# 🎨 Design System & UI Specification: Sistem Verifikasi Soal

Dokumen ini mendokumentasikan spesifikasi antarmuka pengembang (UI/UX Design System) untuk **Sistem Verifikasi Soal**. Dokumentasi ini berfungsi sebagai acuan standar visual, tata letak, komponen, dan palet warna dalam pengembangan aplikasi web ini.

---

## 1. 🌟 Prinsip Desain & Aesthetics

- **Modern & Professional**: Menggunakan antarmuka bersih berbasis kartu (*card-based layout*) dengan sudut melengkung (*rounded-16px*) dan bayangan lembut (*soft ambient shadows*).
- **Struktur Hirarki Jelas**: Pemanfaatan kontras warna dan bobot tipografi (*font-weight*) yang kuat untuk memudahkan pengguna memindai informasi dengan cepat.
- **Konsistensi Visual**: Penggunaan grid seragam (6 kolom untuk statistik utama, 4 kolom untuk status, dan 2 kolom untuk konten utama).
- **Responsive Layout**: Menyesuaikan tampilan secara adaptif mulai dari desktop resolusi tinggi hingga perangkat seluler.

---

## 2. 🎨 Palet Warna (Color Tokens)

### 🔴 Primary & Sidebar (Maroon Red)
| Token Name | HEX Code | Pengunaan |
| :--- | :--- | :--- |
| `sidebar-bg` | `#801720` | Background utama Sidebar Navigasi |
| `sidebar-hover` | `rgba(255, 255, 255, 0.12)` | Hover state menu sidebar |
| `sidebar-active` | `rgba(255, 255, 255, 0.20)` | Active state menu sidebar |
| `primary-dark` | `#9B1724` | Elemen aksen maroon gelap & progress bar |

### ⚪ Background & Surfaces
| Token Name | HEX Code | Pengunaan |
| :--- | :--- | :--- |
| `bg-body` | `#F0F3F8` | Background halaman utama (*cool light gray*) |
| `card-bg` | `#FFFFFF` | Surface container kartu & panel |
| `border-color` | `#E2E8F0` | Border halus komponen & pemisah baris |

### 🔤 Tipografi (Text Colors)
| Token Name | HEX Code | Pengunaan |
| :--- | :--- | :--- |
| `text-dark` | `#1E293B` | Judul utama, angka statistik, teks tebal |
| `text-muted` | `#64748B` | Subjudul, label sekunder, keterangan |
| `text-light` | `#94A3B8` | Waktu, border subtle, placeholder |

### 🟢🟡🟠🔴 Status & Alert Colors
| Status | Accent Color | Light Badge BG | Dark Text / Icon |
| :--- | :--- | :--- | :--- |
| **Menunggu** | `#F97316` (Orange) | `#FFEDD5` | `#EA580C` |
| **Revisi** | `#EAB308` (Kuning) | `#FEF3C7` | `#D97706` |
| **Disetujui** | `#10B981` (Hijau) | `#DCFCE7` | `#15803D` |
| **Ditolak** | `#EF4444` (Merah) | `#FEE2E2` | `#DC2626` |
| **Blue Accent** | `#3B82F6` (Biru) | `#EFF6FF` | `#2563EB` |
| **Purple Accent** | `#A855F7` (Ungu) | `#F3E8FF` | `#9333EA` |

---

## 3. 🔤 Tipografi (Typography System)

- **Font Family**: `'Plus Jakarta Sans', sans-serif`
- **Font Scale & Weights**:

| Style Role | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- |
| **Page Title (H1)** | `22px` | `800` (ExtraBold) | `1.2` |
| **Card Section Title** | `15px` | `800` (ExtraBold) | `1.3` |
| **Stat Big Number** | `26px - 30px` | `800` (ExtraBold) | `1.1` |
| **Sub-Header / Label** | `13px - 14px` | `700` (Bold) | `1.4` |
| **Body Regular** | `12px - 13px` | `500` (Medium) | `1.5` |
| **Caption / Badge** | `10px - 11px` | `600 - 700` (Bold) | `1.2` |

---

## 4. 📐 Tata Letak & Grid System (Layout Architecture)

Aplikasi ini dibagi menjadi 2 area utama:

```
+-------------------------------------------------------------------------+
| SIDEBAR      | TOP HEADER (Dashboard Overview, Actions, Notification)    |
| (#801720)    +----------------------------------------------------------+
| Width: 240px | QUICK ACTION BUTTONS ROW                                 |
|              +----------------------------------------------------------+
|              | ROW 1: STATS GRID (6 Columns)                            |
|              | [Dosen] [MK] [PLO] [CLO] [Bank Soal] [Progress]          |
|              +----------------------------------------------------------+
|              | ROW 2: STATUS CARDS GRID (4 Columns)                     |
|              | [Menunggu] [Revisi] [Disetujui] [Ditolak]                 |
|              +----------------------------------------------------------+
|              | MAIN CONTENT (2 Columns Layout)                          |
|              | +----------------------------------+ +------------------+|
|              | | Left Col (Grouped Bar Chart)     | | Right Col        ||
|              | | "Tren Verifikasi Soal"           | | - Perhatian||
|              | |                                  | | - Aktivitas      ||
|              | +----------------------------------+ +------------------+|
+-------------------------------------------------------------------------+
```

### 1. Sidebar Navigasi (`.sidebar`)
- **Lebar**: `240px` (Fixed Left).
- **Komponen Brand**: Shield logo dengan ikon terverifikasi + Judul "Sistem Verifikasi Soal".
- **Kategori Menu**: *Master Data*, *Periode*, *Penugasan*, *Monitoring*, *Laporan*.
- **Footer Card User**:
  - Avatar bundar "SA" (Super Admin).
  - Nama & Email User.
  - Indicator pill aktif: `Periode: 2026/2027 Ganjil` (Dot hijau menyala).

### 2. Header & Action Bar (`.header-top`, `.quick-action-buttons`)
- **Title**: `Dashboard Overview` dengan deskripsi real-time.
- **Top Actions**: Tombol bundar notifikasi (dengan badge `3` merah) & tombol dark slate `#1E293B` `Generate Laporan`.
- **Quick Action Buttons**: Tombol kapsul seragam (`+ Tambah Dosen`, `Import Data`, `Tetapkan Penugasan`, `Pengaturan Periode`).

### 3. Baris Statistik Utama (`.top-stats-grid` - 6 Kolom)
Tampilan 6 kartu sejajar secara konsisten:
1. **Total Dosen**: Angka `128`, Badge `+12%`, Subteks `Aktif 115`.
2. **Total Mata Kuliah**: Angka `86`, Badge `0%`, Subteks `Aktif 80`.
3. **Total PLO**: Angka `24`, Icon Target Blue, Subteks `Program Outcome`.
4. **Total CLO**: Angka `126`, Icon Activity Green, Subteks `Course Outcome`.
5. **Total Bank Soal**: Angka `1.245`, Badge `+24%`, Subteks `Terverifikasi 672`.
6. **Progress Verifikasi**: Angka `54% Selesai`, Bar merah maroon, Badge `Periode Aktif`.

### 4. Baris Kartu Status (`.status-grid` - 4 Kolom)
Kartu dengan angka besar dan indikator dot berwarna:
- **MENUNGGU**: Dot Orange `#F97316` | Value `312`
- **REVISI**: Dot Kuning `#CA8A04` | Value `189`
- **DISETUJUI**: Dot Hijau `#10B981` | Value `672`
- **DITOLAK**: Dot Merah `#EF4444` | Value `72`

### 5. Layout Konten Utama (2 Kolom)
- **Kolom Kiri (Wide ~68%)**:
  - Panel **Tren Verifikasi Soal**: Grouped Bar Chart (Chart.js) yang menampilkan data batangan **Menunggu** (Orange) dan **Disetujui** (Hijau) per tanggal (`20 Mei` hingga `17 Jun`).
- **Kolom Kanan (Side ~32%)**:
  - Panel **Perhatian**: Daftar 3 item tugas mendesak (*Sistem Informasi (UTS)*, *Pemrograman Web*, *Basis Data (UAS)*) dengan badge angka serta link `Lihat Semua Tugas ->`.
  - Panel **Aktivitas Terkini**: Timeline vertical dengan indikator dot hijau berisi log aktivitas terbaru (*Import PLO berhasil*).

---

## 5. 🛠 Spesifikasi Komponen & UI Elements

### Cart Container (`.card-panel`, `.stat-box`, `.status-box`)
```css
background: #FFFFFF;
border-radius: 16px;
padding: 18px 22px;
border: 1px solid rgba(226, 232, 240, 0.7);
box-shadow: 0 1px 3px rgba(0,0,0,0.03);
```

### Pill Badge (`.pill-badge`)
```css
font-size: 11px;
font-weight: 700;
padding: 3px 8px;
border-radius: 20px;
```

### Quick Action Button (`.qa-btn`)
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
padding: 8px 14px;
border-radius: 8px;
font-size: 12px;
font-weight: 600;
color: #1E293B;
```

---

## 6. 📱 Responsive Breakpoints

- **Desktop (>= 1200px)**: Sidebar `240px` (Fixed), Grid Statistik 6 Kolom, Content Grid 2 Kolom.
- **Tablet (768px - 1199px)**: Grid Statistik menyesuaikan menjadi 3 Kolom, Content Grid bertumpuk menjadi 1 Kolom.
- **Mobile (< 768px)**: Sidebar mengecil menjadi ikon (`70px`), Padding halaman menyesuaikan menjadi `16px`, Grid Statistik & Status menyesuaikan menjadi 2 Kolom.

---

## 7. 📁 File Implementasi Utama

- **Blade View Template**: [`resources/views/dashboard.blade.php`](file:///c:/Users/Acer/sidangkp/resources/views/dashboard.blade.php)
- **Standalone HTML Preview**: [`public/dashboard-preview.html`](file:///c:/Users/Acer/sidangkp/public/dashboard-preview.html)
- **Web Route**: [`routes/web.php`](file:///c:/Users/Acer/sidangkp/routes/web.php)
