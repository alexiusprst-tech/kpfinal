<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Laporan Verifikasi Soal</title>
<style>
    @page { 
        margin: 110px 35px 50px 35px; 
    }
    body { 
        font-family: 'Helvetica', 'Arial', sans-serif; 
        font-size: 11px; 
        color: #1e293b; 
        line-height: 1.4;
    }
    
    header { 
        position: fixed; 
        top: -90px; 
        left: 0px; 
        right: 0px; 
        height: 80px; 
        border-bottom: 2px solid #801720;
        padding-bottom: 8px;
    }
    
    footer { 
        position: fixed; 
        bottom: -35px; 
        left: 0px; 
        right: 0px; 
        height: 25px; 
        font-size: 8px; 
        color: #94a3b8; 
        text-align: right; 
        border-top: 1px solid #e2e8f0; 
        padding-top: 4px; 
    }

    table { 
        border-collapse: collapse; 
        width: 100%; 
    }
    
    .head-table td { 
        vertical-align: middle; 
    }
    .head-table .logo-cell { 
        width: 65px; 
    }
    .head-table .logo-cell img { 
        width: 55px; 
    }
    .head-table .title-main { 
        font-size: 14px; 
        font-weight: bold; 
        color: #801720;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .head-table .title-sub { 
        font-size: 9px; 
        color: #64748b; 
    }
    .head-table .meta-cell {
        text-align: right;
        font-size: 8.5px;
        color: #475569;
    }

    .doc-title-container {
        text-align: center;
        margin: 15px 0 15px 0;
    }
    .doc-title {
        font-size: 13px;
        font-weight: bold;
        color: #0f172a;
        text-transform: uppercase;
        margin: 0;
        padding: 0;
    }
    .doc-subtitle {
        font-size: 10px;
        color: #64748b;
        margin-top: 3px;
    }

    /* Stats Grid */
    .stats-table {
        margin-bottom: 15px;
    }
    .stat-box {
        border: 1px solid #e2e8f0;
        background-color: #f8fafc;
        border-radius: 6px;
        padding: 8px 10px;
        text-align: center;
    }
    .stat-num {
        font-size: 16px;
        font-weight: bold;
        color: #0f172a;
        margin-bottom: 2px;
    }
    .stat-label {
        font-size: 8.5px;
        font-weight: bold;
        color: #64748b;
        text-transform: uppercase;
    }

    /* Status Pill Table */
    .status-summary-table {
        margin-bottom: 15px;
    }
    .status-box {
        padding: 6px 8px;
        border-radius: 4px;
        text-align: center;
    }
    .status-approved { background-color: #dcfce7; color: #166534; }
    .status-pending  { background-color: #ffedd5; color: #9a3412; }
    .status-revision { background-color: #fef3c7; color: #854d0e; }
    .status-rejected { background-color: #fee2e2; color: #991b1b; }

    /* Data Table */
    .data-table {
        margin-top: 10px;
        font-size: 9.5px;
    }
    .data-table th {
        background-color: #1e293b;
        color: #ffffff;
        font-weight: bold;
        padding: 6px 8px;
        text-align: left;
        border: 1px solid #1e293b;
    }
    .data-table td {
        padding: 5px 8px;
        border: 1px solid #cbd5e1;
        vertical-align: middle;
    }
    .data-table tr:nth-child(even) td {
        background-color: #f8fafc;
    }

    .badge {
        display: inline-block;
        padding: 2px 6px;
        font-size: 8px;
        font-weight: bold;
        border-radius: 3px;
        text-align: center;
    }
    .badge-approved { background-color: #dcfce7; color: #15803d; }
    .badge-submitted, .badge-in_review, .badge-resubmitted { background-color: #ffedd5; color: #ea580c; }
    .badge-revision { background-color: #fef3c7; color: #b45309; }
    .badge-rejected { background-color: #fee2e2; color: #dc2626; }

    .sign-table {
        margin-top: 25px;
        width: 100%;
    }
    .sign-table td {
        vertical-align: top;
        font-size: 9.5px;
    }
    .sign-space {
        height: 45px;
    }
</style>
</head>
<body>

<header>
    <table class="head-table">
        <tr>
            <td class="logo-cell">
                @if(file_exists(public_path('images/logo-telkom.png')))
                    <img src="{{ public_path('images/logo-telkom.png') }}" alt="Logo">
                @endif
            </td>
            <td>
                <div class="title-main">UNIVERSITAS TELKOM</div>
                <div class="title-sub">Sistem Manajemen & Verifikasi Soal Ujian Akademik</div>
                <div class="title-sub">Jl. Minangkabau Barat No.50, RT.1/RW.1, Ps. Manggis, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta</div>
            </td>
            <td class="meta-cell">
                <div><strong>Laporan Sistem</strong></div>
                <div>Tanggal: {{ $tanggalCetak }}</div>
                <div>Periode: {{ $namaPeriode }}</div>
            </td>
        </tr>
    </table>
</header>

<footer>
    Dicetak otomatis oleh Sistem Verifikasi Soal Telkom University pada {{ date('d/m/Y H:i:s') }}
</footer>

<div class="doc-title-container">
    <h1 class="doc-title">
        @if($jenisLaporan === 'rekap')
            Laporan Rekapitulasi Verifikasi Soal
        @elseif($jenisLaporan === 'detail_soal')
            Laporan Detail Status Bank Soal
        @else
            Laporan Kinerja Pengelolaan Soal
        @endif
    </h1>
    <div class="doc-subtitle">Periode: {{ $namaPeriode }} &bull; Status Progress: {{ $progressPct }}% Disetujui</div>
</div>

<!-- TOP STATS -->
<table class="stats-table">
    <tr>
        <td style="width: 20%; padding: 3px;">
            <div class="stat-box">
                <div class="stat-num">{{ $totalDosen }}</div>
                <div class="stat-label">Total Dosen</div>
            </div>
        </td>
        <td style="width: 20%; padding: 3px;">
            <div class="stat-box">
                <div class="stat-num">{{ $totalMataKuliah }}</div>
                <div class="stat-label">Total MK</div>
            </div>
        </td>
        <td style="width: 20%; padding: 3px;">
            <div class="stat-box">
                <div class="stat-num">{{ $totalPlo }}</div>
                <div class="stat-label">Total PLO</div>
            </div>
        </td>
        <td style="width: 20%; padding: 3px;">
            <div class="stat-box">
                <div class="stat-num">{{ $totalClo }}</div>
                <div class="stat-label">Total CLO</div>
            </div>
        </td>
        <td style="width: 20%; padding: 3px;">
            <div class="stat-box">
                <div class="stat-num">{{ $totalSoal }}</div>
                <div class="stat-label">Total Soal</div>
            </div>
        </td>
    </tr>
</table>

<!-- STATUS BREAKDOWN -->
<table class="status-summary-table">
    <tr>
        <td style="width: 25%; padding: 3px;">
            <div class="status-box status-approved">
                <div style="font-size: 13px; font-weight: bold;">{{ $totalApproved }}</div>
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">Disetujui (Approved)</div>
            </div>
        </td>
        <td style="width: 25%; padding: 3px;">
            <div class="status-box status-pending">
                <div style="font-size: 13px; font-weight: bold;">{{ $totalPending }}</div>
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">Menunggu Verifikasi</div>
            </div>
        </td>
        <td style="width: 25%; padding: 3px;">
            <div class="status-box status-revision">
                <div style="font-size: 13px; font-weight: bold;">{{ $totalRevision }}</div>
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">Perlu Revisi</div>
            </div>
        </td>
        <td style="width: 25%; padding: 3px;">
            <div class="status-box status-rejected">
                <div style="font-size: 13px; font-weight: bold;">{{ $totalRejected }}</div>
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">Ditolak</div>
            </div>
        </td>
    </tr>
</table>

<!-- DATA TABLE -->
<div style="margin-top: 10px; font-size: 10px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px;">
    Daftar Berkas Soal Terdaftar ({{ $soalList->count() }} Data)
</div>

<table class="data-table">
    <thead>
        <tr>
            <th style="width: 25px; text-align: center;">No</th>
            <th style="width: 60px;">Kode MK</th>
            <th>Mata Kuliah</th>
            <th style="width: 75px;">Kategori</th>
            <th>Dosen Pengampu</th>
            <th style="width: 65px; text-align: center;">Status</th>
            <th style="width: 75px; text-align: center;">Tgl Submit</th>
        </tr>
    </thead>
    <tbody>
        @forelse($soalList as $index => $s)
            <tr>
                <td style="text-align: center;">{{ $index + 1 }}</td>
                <td><strong>{{ $s->mataKuliah->kode_mk ?? '-' }}</strong></td>
                <td>{{ $s->mataKuliah->nama_mk ?? '-' }}</td>
                <td>{{ $s->kategori->nama ?? '-' }}</td>
                <td>{{ $s->uploadedBy->dosen->nama_lengkap ?? $s->uploadedBy->name ?? '-' }}</td>
                <td style="text-align: center;">
                    @php
                        $st = strtolower($s->status);
                        $badgeClass = 'badge-' . $st;
                    @endphp
                    <span class="badge {{ $badgeClass }}">{{ $s->status }}</span>
                </td>
                <td style="text-align: center; color: #64748b;">
                    {{ $s->created_at ? $s->created_at->format('d/m/Y') : '-' }}
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="7" style="text-align: center; padding: 15px; color: #94a3b8;">
                    Tidak ada data soal untuk periode ini.
                </td>
            </tr>
        @endforelse
    </tbody>
</table>

<!-- SIGNATURE SECTION -->
<table class="sign-table">
    <tr>
        <td style="width: 60%;"></td>
        <td style="width: 40%; text-align: center;">
            <div>Jakarta, {{ $tanggalCetak }}</div>
            <div style="font-weight: bold; margin-top: 2px;">Administrator Sistem</div>
            <div class="sign-space"></div>
            <div style="font-weight: bold; text-decoration: underline;">Super Admin Akademik</div>
            <div style="font-size: 8.5px; color: #64748b;">Universitas Telkom</div>
        </td>
    </tr>
</table>

</body>
</html>
