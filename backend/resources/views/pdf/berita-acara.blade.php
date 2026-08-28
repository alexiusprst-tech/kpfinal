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
            OBE SEMESTER {{ strtoupper($periode->jenis_periode ?? 'GANJIL') }} {{ $periode->tahunAjaran->tahun_mulai ?? '20...' }}/{{ $periode->tahunAjaran->tahun_selesai ?? '202...' }}
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
        <td>{{ ucfirst($periode->jenis_periode ?? 'Ganjil') }} {{ $periode->tahunAjaran->tahun_mulai ?? '20...' }}/{{ $periode->tahunAjaran->tahun_selesai ?? '202...' }}</td>
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
@endphp

<table class="eval-table">
    <thead>
        <tr>
            <th style="width: 14%;">Bentuk Asesmen</th>
            <th style="width: 10%;">CLO</th>
            <th style="width: 10%;">No. Soal</th>
            <th style="width: 33%;">Catatan Evaluasi</th>
            <th style="width: 33%;">Rekomendasi Soal Terhadap CLO (jika ada)</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($soalList as $soal)
            @php
                $cloFeedback = $soal->latestVerifikasi?->clo_feedback;
            @endphp
            @if(is_array($cloFeedback) && count($cloFeedback) > 0)
                @foreach($cloFeedback as $cKode => $cNote)
                <tr>
                    <td style="text-align: center;">{{ $soal->kategori->nama ?? '-' }}</td>
                    <td style="text-align: center;">{{ $cKode }}</td>
                    <td style="text-align: center;">{{ $soal->judul }}</td>
                    <td>{{ $cNote ?: '-' }}</td>
                    <td>{{ $rekomendasi($soal) }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td style="text-align: center;">{{ $soal->kategori->nama ?? '-' }}</td>
                    <td style="text-align: center;">{{ $cloKode }}</td>
                    <td style="text-align: center;">{{ $soal->judul }}</td>
                    <td>{{ $soal->latestVerifikasi->catatan ?? '-' }}</td>
                    <td>{{ $rekomendasi($soal) }}</td>
                </tr>
            @endif
        @endforeach
    </tbody>
</table>

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
                @if(!empty($tanda_tangan_evaluator) && file_exists($tanda_tangan_evaluator))
                    <img src="{{ $tanda_tangan_evaluator }}" alt="TTD Evaluator" class="ttd-img" />
                @endif
            </div>
            <div class="sign-name">{{ $evaluatorNama }}</div>
        </td>
        <td class="sign-col">
            <div class="sign-role">Dosen Koordinator,</div>
            <div class="sign-img-container">
                @if(!empty($tanda_tangan_koordinator) && file_exists($tanda_tangan_koordinator))
                    <img src="{{ $tanda_tangan_koordinator }}" alt="TTD Koordinator" class="ttd-img" />
                @endif
            </div>
            <div class="sign-name">{{ $koordinatorNama }}</div>
        </td>
        <td class="sign-col">
            <div class="sign-role">Ka. Prodi</div>
            <div class="sign-img-container">
            </div>
            <div class="sign-name">{{ $kaProdi }}</div>
        </td>
    </tr>
</table>


<!-- ============================================================== -->
<!-- HALAMAN 2+: INFORMASI & NASKAH SOAL UNGGAHAN KOORDINATOR MK   -->
<!-- ============================================================== -->
@foreach ($soalList as $soalIndex => $soalItem)
    @php
        $pcd = is_array($soalItem->plo_clo_data) ? $soalItem->plo_clo_data : (json_decode($soalItem->plo_clo_data, true) ?: []);
        $formNo = $pcd['form_no'] ?? '100-S1SI-001-R1';
        $namaEvaluasi = $soalItem->kategori->nama ?? ($pcd['nama_evaluasi'] ?? ($periode->jenis_periode === 'UAS' ? 'Ujian Akhir Semester' : 'Ujian Tengah Semester'));
        $kodeDosenVal = $soalItem->uploadedBy->dosen->kode_dosen ?? ($koordinatorDosen->kode_dosen ?? $evaluatorKode ?? '-');
        $namaDosenVal = $soalItem->uploadedBy->dosen->nama_lengkap ?? ($koordinatorNama ?? '-');
        $kodeNamaMkVal = $mataKuliah->kode_mk . ' / ' . $mataKuliah->nama_mk;
        $tipeUjianVal = $soalItem->kategori->nama ?? ($periode->jenis_periode ?? 'UTS');
        $tglEvaluasiVal = $soalItem->created_at ? $soalItem->created_at->format('d/m/Y H:i') : $tanggalIndonesia;
        $ploList = $pcd['plo'] ?? [];
        $questionNumber = 1;
    @endphp

    <div class="page-break"></div>

    <div class="lembar-soal-container">
        <!-- Form No -->
        <div class="ls-form-no">Form No : {{ $formNo }}</div>

        <!-- Header Table -->
        <table class="ls-header-table">
            <tr>
                <td class="ls-logo-cell" rowspan="4">
                    @if(!empty($logo_base64))
                        <img class="ls-logo-img" src="{{ $logo_base64 }}" alt="Logo Telkom University">
                    @elseif(file_exists(public_path('images/logo-telkom.png')))
                        <img class="ls-logo-img" src="{{ public_path('images/logo-telkom.png') }}" alt="Logo Telkom University">
                    @else
                        <strong style="font-size: 11px;">Telkom<br>University</strong>
                    @endif
                </td>
                <td class="ls-title-cell" colspan="4">LAMPIRAN: NASKAH SOAL ASESMEN</td>
            </tr>
            <tr>
                <td class="ls-label-cell">Nama Evaluasi</td>
                <td class="ls-value-cell">{{ $namaEvaluasi }}</td>
                <td class="ls-label-cell-right">Dosen Koordinator</td>
                <td class="ls-value-cell-right">{{ $namaDosenVal }} ({{ $kodeDosenVal }})</td>
            </tr>
            <tr>
                <td class="ls-label-cell">Kode/Nama MK</td>
                <td class="ls-value-cell">{{ $kodeNamaMkVal }}</td>
                <td class="ls-label-cell-right">Bentuk Asesmen</td>
                <td class="ls-value-cell-right">{{ $tipeUjianVal }}</td>
            </tr>
            <tr>
                <td class="ls-label-cell">Judul Naskah Soal</td>
                <td class="ls-value-cell"><strong>{{ $soalItem->judul }}</strong></td>
                <td class="ls-label-cell-right">Berkas Asli</td>
                <td class="ls-value-cell-right" style="font-weight: bold;">{{ $soalItem->nama_file }}</td>
            </tr>
        </table>

        <!-- Berkas Unggahan Banner -->
        <table class="ls-block-table" style="background-color: #f8fafc; border: 1.5px solid #000000; margin-bottom: 8px;">
            <tr>
                <td class="ls-block-label" style="width: 22%; background-color: #f1f5f9;">
                    Informasi Berkas<br>Naskah Soal
                </td>
                <td class="ls-block-content" style="line-height: 1.5;">
                    <div><strong>Judul Soal:</strong> {{ $soalItem->judul }}</div>
                    <div><strong>Nama File Unggahan:</strong> {{ $soalItem->nama_file }} ({{ round(($soalItem->file_size ?: 0) / 1024, 1) }} KB)</div>
                    <div><strong>Waktu Unggah:</strong> {{ $soalItem->created_at ? $soalItem->created_at->format('d/m/Y H:i') . ' WIB' : '-' }}</div>
                    <div><strong>Status Keputusan Verifikasi:</strong> <span style="font-weight: bold; color: #047857;">DISETUJUI (APPROVED)</span></div>
                </td>
            </tr>
        </table>

        <!-- Loop PLO & CLO -->
        @if(!empty($ploList) && count($ploList) > 0)
            @foreach($ploList as $ploItem)
                <div class="plo-group">
                    <!-- PLO Box -->
                    <table class="ls-block-table">
                        <tr>
                            <td class="ls-block-label" style="width: 22%;">
                                Program<br>Learning<br>Outcomes
                            </td>
                            <td class="ls-block-content" style="font-weight: bold;">
                                {{ $ploItem['kode'] ?? 'PLO' }} &ndash; {{ $ploItem['deskripsi'] ?? '' }}
                            </td>
                        </tr>
                    </table>
                </div>

                @if(!empty($ploItem['clo']))
                    @foreach($ploItem['clo'] as $cloItem)
                        <div class="clo-group">
                            <!-- CLO Table -->
                            <table class="ls-clo-table">
                                <thead>
                                    <tr>
                                        <th>Course Learning outcomes</th>
                                        <th class="ls-weight-col">Bobot LO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <span class="ls-clo-code">{{ $cloItem['kode'] ?? 'CLO' }}</span>
                                            <span>{{ $cloItem['deskripsi'] ?? '' }}</span>
                                        </td>
                                        <td class="ls-weight-col">{{ $cloItem['bobot_lo'] ?? '-' }}</td>
                                    </tr>
                                </tbody>
                            </table>

                            @if(!empty($cloItem['soal']))
                                <div class="soal-title-container">
                                    <div class="soal-title-badge">Naskah Pertanyaan {{ $cloItem['kode'] ?? ('LO' . $questionNumber) }}</div>
                                </div>

                                <div class="area-soal-box">
                                    <div class="soal-text">{!! nl2br(e($cloItem['soal'])) !!}</div>
                                </div>
                            @endif
                        </div>
                        @php $questionNumber++; @endphp
                    @endforeach
                @endif
            @endforeach
        @else
            <!-- Fallback jika belum ada konfigurasi plo_clo_data terperinci -->
            @forelse ($clos as $cIndex => $fallbackClo)
                @php
                    $plos = $fallbackClo->plo->pluck('kode_plo')->implode(', ') ?: '-';
                    $ploDesc = $fallbackClo->plo->pluck('deskripsi')->implode(', ') ?: '-';
                @endphp
                <div class="plo-group">
                    <table class="ls-block-table">
                        <tr>
                            <td class="ls-block-label" style="width: 22%;">
                                Program<br>Learning<br>Outcomes
                            </td>
                            <td class="ls-block-content" style="font-weight: bold;">
                                {{ $plos }} &ndash; {{ $ploDesc }}
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="clo-group">
                    <table class="ls-clo-table">
                        <thead>
                            <tr>
                                <th>Course Learning outcomes</th>
                                <th class="ls-weight-col">Bobot LO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="ls-clo-code">{{ $fallbackClo->kode_clo }}</span>
                                    <span>{{ $fallbackClo->deskripsi }}</span>
                                </td>
                                <td class="ls-weight-col">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            @empty
                <p style="font-size: 11px; margin-top: 15px;">Belum ada pemetaan CLO terdaftar untuk mata kuliah ini.</p>
            @endforelse
        @endif
    </div>
@endforeach

</body>
</html>
