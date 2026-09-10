<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { 
        margin: 30px 40px 35px 40px; 
    }
    body { 
        font-family: 'Times New Roman', Times, serif; 
        font-size: 11px; 
        color: #000000; 
        line-height: 1.25; 
        margin: 0;
        padding: 0;
    }
    
    .footer { 
        position: fixed; 
        bottom: -20px; 
        left: 0px; 
        right: 0px; 
        height: 20px; 
        font-size: 9px; 
        color: #666666; 
        text-align: left; 
        font-family: 'Arial', sans-serif; 
    }

    table { border-collapse: collapse; width: 100%; }

    /* Form No top left */
    .form-no {
        font-size: 9.5px;
        color: #444444;
        margin-bottom: 4px;
        font-family: 'Arial', sans-serif;
    }

    /* Header Table */
    .head-table {
        border-collapse: collapse;
        border: 1.5px solid #000000;
        width: 100%;
        margin-bottom: 12px;
    }
    .head-table td { 
        border: 1.5px solid #000000; 
        padding: 3px 5px; 
        vertical-align: middle; 
        line-height: 1.2; 
    }
    .head-table .logo-cell { 
        width: 20%; 
        text-align: center; 
        padding: 4px 6px !important;
        vertical-align: middle;
    }
    .head-table .logo-cell img { 
        max-height: 82px; 
        max-width: 95%; 
        width: auto;
        height: auto;
        display: block; 
        margin: 0 auto; 
    }
    .head-table .title-main { 
        font-family: 'Arial', sans-serif; 
        font-weight: bold; 
        font-size: 13px; 
        text-align: center; 
        width: 54%; 
    }
    .head-table .title-sub { 
        font-family: 'Arial', sans-serif; 
        font-size: 8.5px; 
        text-align: center; 
        width: 54%; 
    }
    .head-table .title-doc { 
        font-family: 'Arial', sans-serif; 
        font-size: 9.5px; 
        font-weight: bold; 
        text-align: center; 
        width: 54%; 
        line-height: 1.3;
    }
    .head-table .meta-label { 
        font-family: 'Arial', sans-serif; 
        width: 14%; 
        font-size: 9px; 
    }
    .head-table .meta-value { 
        font-family: 'Arial', sans-serif; 
        width: 14%; 
        font-size: 9px; 
    }

    h1.doctitle { 
        font-family: 'Times New Roman', Times, serif; 
        text-align: center; 
        font-size: 13px; 
        font-weight: bold; 
        margin: 10px 0 10px 0; 
        text-transform: uppercase; 
        line-height: 1.3;
    }

    .meta-table {
        width: 100%;
        margin-bottom: 2px;
    }
    .meta-table td { 
        padding: 1.5px 0; 
        vertical-align: top; 
        font-size: 11px; 
        font-family: 'Times New Roman', Times, serif; 
    }
    .meta-table .label { width: 175px; }
    .meta-table .sep { width: 15px; text-align: center; }

    .eval-table { 
        margin-top: 6px; 
        margin-bottom: 6px;
        width: 100%; 
        border-collapse: collapse;
        border: 1.5px solid #000000;
    }
    .eval-table th, .eval-table td { 
        border: 1px solid #000000; 
        padding: 3px 5px; 
        font-size: 10px; 
        vertical-align: top; 
        font-family: 'Times New Roman', Times, serif; 
    }
    .eval-table th { 
        background: #f0f0f0; 
        text-align: center; 
        font-weight: bold; 
    }

    .kesimpulan { 
        margin-top: 8px; 
        font-size: 11px; 
        font-family: 'Times New Roman', Times, serif; 
    }

    .date-text {
        text-align: center;
        margin: 12px 0 5px 0;
        font-size: 11px;
        font-family: 'Times New Roman', Times, serif;
    }

    /* Signature Box Table */
    .sign-box {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #000000;
        margin-top: 4px;
    }
    .sign-col {
        width: 33.33%;
        border: 1.5px solid #000000;
        padding: 5px 6px 6px 6px;
        vertical-align: top;
        height: 105px;
    }
    .sign-role {
        font-weight: bold;
        font-size: 11px;
        text-align: center;
        font-family: 'Times New Roman', Times, serif;
    }
    .sign-img-container {
        height: 55px;
        text-align: center;
        margin: 3px 0;
    }
    .ttd-img {
        max-height: 52px;
        max-width: 110px;
        object-fit: contain;
        display: block;
        margin: 0 auto;
    }
    .sign-name {
        font-size: 10.5px;
        text-align: center;
        font-family: 'Times New Roman', Times, serif;
    }

    .page-break { page-break-before: always; }

    /* Lembar Soal Styling (Standard Telkom University) */
    .lembar-soal-container {
        font-family: 'Arial', 'Helvetica', sans-serif;
        color: #000000;
        line-height: 1.3;
        margin-top: 0;
    }
    .ls-form-no {
        font-size: 11px;
        font-weight: normal;
        margin-bottom: 6px;
        font-family: 'Arial', sans-serif;
    }
    .ls-header-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #000000;
        margin-bottom: 12px;
    }
    .ls-header-table td {
        border: 1.5px solid #000000;
        padding: 5px 8px;
        font-size: 11px;
        vertical-align: middle;
        font-family: 'Arial', sans-serif;
    }
    .ls-logo-cell {
        width: 22%;
        text-align: center;
        padding: 4px 6px !important;
        vertical-align: middle;
    }
    .ls-logo-img {
        max-height: 80px;
        max-width: 95%;
        width: auto;
        height: auto;
        display: block;
        margin: 0 auto;
    }
    .ls-title-cell {
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        letter-spacing: 0.5px;
        padding: 6px !important;
    }
    .ls-label-cell {
        font-weight: normal;
        width: 16%;
    }
    .ls-value-cell {
        width: 32%;
    }
    .ls-label-cell-right {
        font-weight: normal;
        width: 14%;
    }
    .ls-value-cell-right {
        width: 16%;
    }

    .ls-block-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #000000;
        margin-top: 10px;
    }
    .ls-block-table td {
        border: 1.5px solid #000000;
        padding: 7px 10px;
        font-size: 11px;
        vertical-align: middle;
        font-family: 'Arial', sans-serif;
    }
    .ls-block-label {
        width: 22%;
        font-weight: bold;
        text-align: center;
        line-height: 1.3;
    }
    .ls-block-content {
        font-weight: normal;
        line-height: 1.4;
    }

    .ls-clo-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #000000;
        margin-top: 10px;
    }
    .ls-clo-table th {
        border: 1.5px solid #000000;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: bold;
        text-align: left;
        font-family: 'Arial', sans-serif;
    }
    .ls-clo-table td {
        border: 1.5px solid #000000;
        padding: 7px 10px;
        font-size: 11px;
        vertical-align: middle;
        font-family: 'Arial', sans-serif;
    }
    .ls-clo-code {
        font-weight: bold;
        display: inline-block;
        margin-right: 12px;
    }
    .ls-weight-col {
        width: 15%;
        text-align: right;
        font-weight: bold;
    }

    .soal-title-container {
        text-align: center;
        margin-top: 10px;
        margin-bottom: 10px;
    }
    .soal-title-badge {
        background-color: #FFFF00;
        padding: 3px 14px;
        font-size: 11px;
        font-weight: bold;
        border: 1px solid #000000;
        display: inline-block;
        font-family: 'Arial', sans-serif;
    }

    .area-soal-box {
        border: 1.5px solid #000000;
        margin-bottom: 14px;
        padding: 10px 12px;
        min-height: 80px;
        background-color: #ffffff;
        font-size: 11px;
        line-height: 1.5;
        font-family: 'Arial', sans-serif;
    }
    .soal-text {
        font-size: 11px;
        color: #000000;
        white-space: normal;
        word-wrap: break-word;
        font-family: 'Arial', sans-serif;
    }
    .soal-empty {
        color: #888888;
        font-style: italic;
        font-size: 10.5px;
    }

    .clo-group {
        page-break-inside: avoid;
    }
    .plo-group {
        page-break-inside: avoid;
    }
</style>
</head>
<body>

<div class="footer">
    Fakultas Rekayasa Industri &ndash; S1 Sistem Informasi
</div>

<!-- ========================================== -->
<!-- HALAMAN 1: BERITA ACARA VERIFIKASI SOAL   -->
<!-- ========================================== -->
<div class="form-no">Form No : 100-S1SI-001-R1</div>

<table class="head-table">
    <tr>
        <td class="logo-cell" rowspan="4">
            @if(!empty($logo_base64))
                <img src="{{ $logo_base64 }}">
            @elseif(file_exists(public_path('images/logo-telkom.png')))
                <img src="{{ public_path('images/logo-telkom.png') }}">
            @else
                <strong style="font-size: 11px;">Telkom<br>University</strong>
            @endif
        </td>
        <td class="title-main">UNIVERSITAS TELKOM</td>
        <td class="meta-label">No. Dokumen</td>
        <td class="meta-value"></td>
    </tr>
    <tr>
        <td class="title-sub">Jl. Telekomunikasi No. 1, DayeuhKolot, Kab. Bandung 40257</td>
        <td class="meta-label">No. Revisi</td>
        <td class="meta-value"></td>
    </tr>
    <tr>
        <td class="title-doc" rowspan="2">
            BERITA ACARA VERIFIKASI SOAL ASESMEN<br>
            OBE SEMESTER {{ strtoupper($periode->jenis_periode ?? 'GANJIL') }} {{ $periode->tahun_akademik ?? ($periode->tahunAjaran->tahun_mulai . '/' . $periode->tahunAjaran->tahun_selesai) }}
        </td>
        <td class="meta-label">Berlaku Efektif</td>
        <td class="meta-value"></td>
    </tr>
    <tr>
        <td class="meta-label">Halaman</td>
        <td class="meta-value"></td>
    </tr>
</table>

<h1 class="doctitle">BERITA ACARA EVALUASI KESESUAIAN SOAL ASESMEN<br>DENGAN CLO MATA KULIAH</h1>

<table class="meta-table">
    <tr>
        <td class="label">Semester/Tahun Akademik</td>
        <td class="sep">:</td>
        <td>{{ ucfirst($periode->jenis_periode ?? 'Ganjil') }} {{ $periode->tahun_akademik ?? ($periode->tahunAjaran->tahun_mulai . '/' . $periode->tahunAjaran->tahun_selesai) }}</td>
    </tr>
    <tr>
        <td class="label">Periode Semester</td>
        <td class="sep">:</td>
        <td>{{ \Carbon\Carbon::parse($periode->tanggal_mulai)->locale('id')->isoFormat('D MMMM YYYY') }} s.d. {{ \Carbon\Carbon::parse($periode->tanggal_selesai)->locale('id')->isoFormat('D MMMM YYYY') }}</td>
    </tr>
    <tr>
        <td class="label">Fakultas</td>
        <td class="sep">:</td>
        <td>Rekayasa Industri</td>
    </tr>
</table>

<p style="margin: 6px 0 2px 0; font-size: 11px;">Saya sebagai evaluator</p>
<table class="meta-table">
    <tr>
        <td class="label">Nama Evaluator</td>
        <td class="sep">:</td>
        <td>{{ $evaluatorNama }}</td>
    </tr>
    <tr>
        <td class="label">Kode Dosen</td>
        <td class="sep">:</td>
        <td>{{ $evaluatorKode }}</td>
    </tr>
    <tr>
        <td class="label">Program Studi</td>
        <td class="sep">:</td>
        <td>{{ $programStudi }}</td>
    </tr>
</table>

<p style="margin: 6px 0 2px 0; font-size: 11px;">Menyatakan bahwa telah dilakukan evaluasi kesesuaian antara soal ujian dengan CLO yang diujikan untuk mata kuliah sebagai berikut.</p>
<table class="meta-table">
    <tr>
        <td class="label">Kode Mata Kuliah</td>
        <td class="sep">:</td>
        <td>{{ $mataKuliah->kode_mk }}</td>
    </tr>
    <tr>
        <td class="label">Nama Mata Kuliah</td>
        <td class="sep">:</td>
        <td>{{ $mataKuliah->nama_mk }}</td>
    </tr>
    <tr>
        <td class="label">Program Studi</td>
        <td class="sep">:</td>
        <td>{{ $programStudi }}</td>
    </tr>
    <tr>
        <td class="label">Dosen Koordinator</td>
        <td class="sep">:</td>
        <td>{{ $koordinatorNama }}</td>
    </tr>
</table>

<p style="margin: 6px 0 3px 0; font-size: 11px;">Dengan hasil evaluasi sebagai berikut:</p>

@php
    $cloKode = $clos->pluck('kode_clo')->implode(', ') ?: '-';

    $rekomendasi = function ($soal) {
        return match ($soal->status) {
            'APPROVED' => 'Soal sudah sesuai dengan CLO.',
            'REVISION' => 'Soal perlu diperbaiki: ' . ($soal->latestVerifikasi->catatan ?? '-'),
            'REJECTED' => 'Soal ditolak: ' . ($soal->latestVerifikasi->catatan ?? '-'),
            default => '-',
        };
    };

    /**
     * Resolve nilai clo_feedback: support format lama (string) dan baru (object/array).
     * Mengembalikan ['no_soal' => '', 'catatan' => '', 'rekomendasi' => '']
     */
    $resolveCloFeedback = function ($val) {
        if (is_string($val)) {
            return ['no_soal' => '-', 'catatan' => $val ?: '-', 'rekomendasi' => '-'];
        }
        if (is_array($val)) {
            return [
                'no_soal'     => $val['no_soal']     ?? '-',
                'catatan'     => $val['catatan']     ?? '-',
                'rekomendasi' => $val['rekomendasi'] ?? '-',
            ];
        }
        return ['no_soal' => '-', 'catatan' => '-', 'rekomendasi' => '-'];
    };
@endphp

<table class="eval-table">
    <thead>
        <tr>
            <th style="width: 14%;">Bentuk Asesmen</th>
            <th style="width: 10%;">CLO</th>
            <th style="width: 10%;">No. Soal</th>
            <th style="width: 33%;">Catatan Evaluasi</th>
            <th style="width: 33%;">Rekomendasi Soal Terhadap PLO (jika ada)</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($soalList as $soal)
            @php
                $cloFeedback = $soal->latestVerifikasi?->clo_feedback;
            @endphp
            @if(is_array($cloFeedback) && count($cloFeedback) > 0)
                @foreach($cloFeedback as $cKode => $cVal)
                @php $resolved = $resolveCloFeedback($cVal); @endphp
                <tr>
                    <td style="text-align: center;">{{ $soal->kategori->nama ?? '-' }}</td>
                    <td style="text-align: center;">{{ $cKode }}</td>
                    <td style="text-align: center;">{{ $resolved['no_soal'] ?: '-' }}</td>
                    <td>{{ $resolved['catatan'] ?: '-' }}</td>
                    <td>{{ $resolved['rekomendasi'] ?: '-' }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td style="text-align: center;">{{ $soal->kategori->nama ?? '-' }}</td>
                    <td style="text-align: center;">{{ $cloKode }}</td>
                    <td style="text-align: center;">-</td>
                    <td>{{ $soal->latestVerifikasi->catatan ?? '-' }}</td>
                    <td>-</td>
                </tr>
            @endif
        @endforeach
    </tbody>
</table>

{{-- Catatan Evaluasi Per-PLO (jika ada) --}}
@php
    $hasPloFeedback = false;
    foreach($soalList as $s) {
        if (!empty($s->latestVerifikasi?->plo_feedback) && is_array($s->latestVerifikasi->plo_feedback)) {
            foreach($s->latestVerifikasi->plo_feedback as $pNote) {
                if (!empty(trim((string)$pNote))) {
                    $hasPloFeedback = true;
                    break 2;
                }
            }
        }
    }
@endphp
@if($hasPloFeedback)
<table class="eval-table" style="margin-top:4px; margin-bottom:4px;">
    <thead>
        <tr>
            <th style="width: 25%; background:#f0f0f0; text-align:center;">PLO</th>
            <th style="width: 75%; background:#f0f0f0; text-align:left; padding-left:8px;">Catatan Evaluasi PLO</th>
        </tr>
    </thead>
    <tbody>
        @foreach($soalList as $s)
            @if(!empty($s->latestVerifikasi?->plo_feedback))
                @foreach($s->latestVerifikasi->plo_feedback as $ploKode => $ploNote)
                    @if(!empty(trim((string)$ploNote)))
                    <tr>
                        <td style="text-align: center; font-weight: bold;">{{ $ploKode }}</td>
                        <td>{{ $ploNote }}</td>
                    </tr>
                    @endif
                @endforeach
            @endif
        @endforeach
    </tbody>
</table>
@endif

{{-- Catatan Umum Verifikator (jika ada) --}}
@php
    $catatanUmumList = $soalList->map(function($s) {
        return [
            'judul' => $s->judul,
            'catatan' => $s->latestVerifikasi?->catatan,
        ];
    })->filter(fn($item) => !empty(trim((string)($item['catatan'] ?? ''))))->values();
@endphp
@if($catatanUmumList->isNotEmpty())
<table class="eval-table" style="margin-top:4px; margin-bottom:4px;">
    <thead>
        <tr>
            <th style="text-align: left; padding-left: 8px; background:#f0f0f0;" colspan="{{ $catatanUmumList->count() > 1 ? 2 : 1 }}">
                Catatan Umum Verifikator
            </th>
        </tr>
    </thead>
    <tbody>
        @foreach($catatanUmumList as $item)
        <tr>
            @if($catatanUmumList->count() > 1)
            <td style="width: 30%; font-weight: bold;">{{ $item['judul'] }}</td>
            @endif
            <td>{{ $item['catatan'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

<p class="kesimpulan">
    Berdasarkan hasil evaluasi tersebut, maka soal asesmen
    <strong>{{ ($jumlahRevision + $jumlahRejected) > 0 ? 'perlu diperbaiki sesuai' : 'sudah sesuai*' }}</strong>
    dengan catatan di atas.
</p>

<p class="date-text">Jakarta, {{ $tanggalIndonesia }}</p>

<table class="sign-box">
    <tr>
        <td class="sign-col">
            <div class="sign-role">Evaluator Soal,</div>
            <div class="sign-img-container">
                @if(!empty($tanda_tangan_evaluator))
                    <img src="{{ $tanda_tangan_evaluator }}" alt="TTD Evaluator" class="ttd-img" />
                @endif
            </div>
            <div class="sign-name">{{ $evaluatorNama }}</div>
        </td>
        <td class="sign-col">
            <div class="sign-role">Dosen Koordinator,</div>
            <div class="sign-img-container">
                @if(!empty($tanda_tangan_koordinator))
                    <img src="{{ $tanda_tangan_koordinator }}" alt="TTD Koordinator" class="ttd-img" />
                @endif
            </div>
            <div class="sign-name">{{ $koordinatorNama }}</div>
        </td>
        <td class="sign-col">
            <div class="sign-role">Ka. Prodi</div>
            <div class="sign-img-container">
                @if(!empty($tanda_tangan_kaprodi))
                    <img src="{{ $tanda_tangan_kaprodi }}" alt="TTD Ka. Prodi" class="ttd-img" />
                @endif
            </div>
            <div class="sign-name">{{ $kaProdi }}</div>
        </td>
    </tr>
</table>

</body>
</html>

