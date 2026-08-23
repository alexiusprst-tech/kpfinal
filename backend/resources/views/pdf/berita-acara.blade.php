<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 130px 40px 60px 40px; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; }
    
    header { position: fixed; top: -110px; left: 0px; right: 0px; height: 100px; overflow: hidden; }
    footer { position: fixed; bottom: -40px; left: 0px; right: 0px; height: 30px; font-size: 8px; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 4px; }

    table { border-collapse: collapse; width: 100%; }
    .head-table td { border: 1px solid #000; padding: 2px 6px; vertical-align: middle; line-height: 1.3; }
    .head-table .logo-cell { width: 80px; text-align: center; }
    .head-table .logo-cell img { width: 50px; }
    .head-table .title-main { font-family: 'Times New Roman', Times, serif; font-weight: bold; font-size: 14px; width: 55%; }
    .head-table .title-sub { font-family: 'Times New Roman', Times, serif; font-size: 10px; font-weight: bold; width: 55%; }
    .head-table .title-doc { font-family: 'Times New Roman', Times, serif; font-size: 10px; font-weight: bold; width: 55%; }
    .head-table .meta-label { font-family: 'Times New Roman', Times, serif; width: 90px; font-size: 10px; }
    .head-table .meta-value { font-family: 'Times New Roman', Times, serif; font-size: 10px; }

    h1.doctitle { font-family: 'Times New Roman', Times, serif; text-align: center; font-size: 14px; font-weight: bold; margin: 14px 0 12px 0; text-transform: uppercase; }

    .field-table td { padding: 2px 0; vertical-align: top; font-size: 12px; font-family: 'Times New Roman', Times, serif;}
    .field-table .label { width: 180px; }
    .field-table .sep { width: 12px; }

    .eval-table { margin-top: 10px; }
    .eval-table th, .eval-table td { border: 1px solid #000; padding: 4px 5px; font-size: 11px; vertical-align: top; font-family: 'Cambria', serif; }
    .eval-table th { background: #eee; text-align: center; font-weight: bold; }

    .kesimpulan { margin-top: 10px; font-size: 12px; font-family: 'Times New Roman', Times, serif;}

    .sign-table { margin-top: 40px; width: 100%; }
    .sign-table td { text-align: left; font-size: 12px; padding: 0 10px; vertical-align: top; font-family: 'Times New Roman', Times, serif;}
    .sign-space { height: 60px; }

    .page-break { page-break-before: always; }

    .lembar-soal-title { text-align: left; font-size: 14px; font-family: 'Cambria', serif; font-weight: bold; margin-top: 4px; margin-bottom: 10px; }
    .ls-field-table td { padding: 2px 0; vertical-align: top; font-size: 10px; font-family: 'Cambria', serif; }
    .ls-field-table .label { width: 120px; }
    .ls-field-table .sep { width: 8px; }
    
    .ls-box { border: 1px solid #000; margin-top: 10px; }
    .ls-box-content { padding: 8px; font-size: 10px; font-family: 'Cambria', serif; }
    .ls-box-content strong { font-weight: bold; }

    .lo-header { background: #eee; font-weight: bold; padding: 4px 6px; border-bottom: 1px solid #000; font-size: 10px; font-family: 'Cambria', serif; }
    .lo-body { padding: 6px; font-size: 10px; font-family: 'Cambria', serif; }
</style>
</head>
<body>

<header>
    <table class="head-table">
        <tr>
            <td class="logo-cell" rowspan="4">
                <img src="{{ public_path('images/logo-telkom.png') }}">
            </td>
            <td class="title-main">UNIVERSITAS TELKOM</td>
            <td class="meta-label">No. Dokumen</td>
            <td class="meta-value">100-S1SI-001-R1</td>
        </tr>
        <tr>
            <td class="title-sub">Jl. Minangkabau Barat No.50, RT.1/RW.1, Ps. Manggis, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta</td>
            <td class="meta-label">No. Revisi</td>
            <td class="meta-value">-</td>
        </tr>
        <tr>
            <td class="title-doc" rowspan="2">BERITA ACARA VERIFIKASI SOAL ASESMEN OBE SEMESTER {{ strtoupper($periode->jenis_periode) }} {{ $periode->tahunAjaran->tahun_mulai ?? '' }}/{{ $periode->tahunAjaran->tahun_selesai ?? '' }}</td>
            <td class="meta-label">Berlaku Efektif</td>
            <td class="meta-value">{{ $tanggalIndonesia }}</td>
        </tr>
        <tr>
            <td class="meta-label">Halaman</td>
            <td class="meta-value"></td>
        </tr>
    </table>
</header>

<footer>
    Fakultas Rekayasa Industri &ndash; S1 Sistem Informasi
</footer>

<h1 class="doctitle">BERITA ACARA EVALUASI KESESUAIAN SOAL ASESMEN<br>DENGAN CLO MATA KULIAH</h1>

<table class="field-table">
    <tr><td class="label">Semester/Tahun Akademik</td><td class="sep">:</td><td>{{ ucfirst($periode->jenis_periode) }} {{ $periode->tahunAjaran->tahun_mulai ?? '' }}/{{ $periode->tahunAjaran->tahun_selesai ?? '' }}</td></tr>
    <tr><td class="label">Fakultas</td><td class="sep">:</td><td>Rekayasa Industri</td></tr>
</table>

<p style="margin: 10px 0 4px 0; font-size: 12px; font-family: 'Times New Roman', Times, serif;">Saya sebagai evaluator</p>
<table class="field-table">
    <tr><td class="label">Nama Evaluator</td><td class="sep">:</td><td>{{ $evaluatorNama }}</td></tr>
    <tr><td class="label">Kode Dosen</td><td class="sep">:</td><td>{{ $evaluatorKode }}</td></tr>
    <tr><td class="label">Program Studi</td><td class="sep">:</td><td>{{ $programStudi }}</td></tr>
</table>

<p style="margin: 10px 0 4px 0; font-size: 12px; font-family: 'Times New Roman', Times, serif;">Menyatakan bahwa telah dilakukan evaluasi kesesuaian antara soal ujian dengan CLO yang diujikan untuk mata kuliah sebagai berikut.</p>
<table class="field-table">
    <tr><td class="label">Kode Mata Kuliah</td><td class="sep">:</td><td>{{ $mataKuliah->kode_mk }}</td></tr>
    <tr><td class="label">Nama Mata Kuliah</td><td class="sep">:</td><td>{{ $mataKuliah->nama_mk }}</td></tr>
    <tr><td class="label">Program Studi</td><td class="sep">:</td><td>{{ $programStudi }}</td></tr>
    <tr><td class="label">Dosen Koordinator</td><td class="sep">:</td><td>{{ $koordinatorNama }}</td></tr>
</table>

<p style="margin: 10px 0 4px 0; font-size: 12px; font-family: 'Times New Roman', Times, serif;">Dengan hasil evaluasi sebagai berikut:</p>

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
            <th style="width: 15%;">Bentuk Asesmen</th>
            <th style="width: 15%;">CLO</th>
            <th style="width: 15%;">No. Soal</th>
            <th style="width: 25%;">Catatan Evaluasi</th>
            <th style="width: 30%;">Rekomendasi Soal Terhadap CLO (jika ada)</th>
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
                    <td>{{ $soal->kategori->nama ?? '-' }}</td>
                    <td>{{ $cKode }}</td>
                    <td>{{ $soal->judul }}</td>
                    <td>{{ $cNote ?: '-' }}</td>
                    <td>{{ $rekomendasi($soal) }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td>{{ $soal->kategori->nama ?? '-' }}</td>
                    <td>{{ $cloKode }}</td>
                    <td>{{ $soal->judul }}</td>
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

<p style="margin-top: 20px; font-size: 12px; font-family: 'Times New Roman', Times, serif;">Jakarta, {{ $tanggalIndonesia }}</p>

<table class="sign-table">
    <tr>
        <td style="width: 33%; font-weight: bold;">Evaluator Soal,</td>
        <td style="width: 33%; font-weight: bold;">Dosen Koordinator,</td>
        <td style="width: 33%; font-weight: bold;">Ka. Prodi</td>
    </tr>
    <tr>
        <td class="sign-space">
            @if(!empty($tanda_tangan_evaluator) && file_exists($tanda_tangan_evaluator))
                <img src="{{ $tanda_tangan_evaluator }}" alt="TTD Evaluator"
                     style="max-height: 60px; max-width: 120px; object-fit: contain; display: block; margin: 0 auto;" />
            @endif
        </td>
        <td class="sign-space">
            @if(!empty($tanda_tangan_koordinator) && file_exists($tanda_tangan_koordinator))
                <img src="{{ $tanda_tangan_koordinator }}" alt="TTD Koordinator"
                     style="max-height: 60px; max-width: 120px; object-fit: contain; display: block; margin: 0 auto;" />
            @endif
        </td>
        <td class="sign-space"></td>
    </tr>
    <tr>
        <td style="font-weight: normal;">{{ $evaluatorNama }}</td>
        <td style="font-weight: normal;">{{ $koordinatorNama }}</td>
        <td style="font-weight: normal;">Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.</td>
    </tr>
</table>


<div class="page-break"></div>

<h1 class="lembar-soal-title">LEMBAR SOAL</h1>

<table class="ls-field-table">
    <tr>
        <td class="label">Nama Evaluasi</td><td class="sep">:</td>
        <td style="width: 260px;">{{ $nomor }}</td>
        <td class="label" style="width: 80px;">Kode dosen</td><td class="sep">:</td>
        <td>{{ $evaluatorKode }}</td>
    </tr>
    <tr>
        <td class="label">Kode/Nama MK</td><td class="sep">:</td>
        <td>{{ $mataKuliah->kode_mk }} / {{ $mataKuliah->nama_mk }}</td>
        <td class="label">Tipe Ujian</td><td class="sep">:</td>
        <td>...................................</td>
    </tr>
    <tr>
        <td class="label">Tanggal Evaluasi</td><td class="sep">:</td>
        <td>{{ $tanggalIndonesia }} &nbsp;&nbsp;&nbsp;&nbsp; <strong>/ menit</strong></td>
        <td class="label">Tipe Soal</td><td class="sep">:</td>
        <td><strong>Closed Book (120 minutes)</strong></td>
    </tr>
</table>

<div class="ls-box" style="margin-bottom: 15px;">
    <div class="ls-box-content">
        <strong>Petunjuk Pengerjaan</strong><br>
        (1) .........................................................................................................................................................................<br>
        (2) .........................................................................................................................................................................
    </div>
</div>

@forelse ($clos as $index => $clo)
    @php
        $plos = $clo->plo->pluck('kode_plo')->implode(', ') ?: '-';
        $ploDesc = $clo->plo->pluck('deskripsi')->implode(', ') ?: '-';
    @endphp
    
    <div style="font-family: 'Cambria', serif; font-size: 10px; margin-bottom: 20px;">
        <p style="margin: 0 0 4px 0;"><strong>Program Learning Outcomes</strong></p>
        <p style="margin: 0 0 10px 20px;">{{ $plos }} &ndash; {{ $ploDesc }}</p>
        
        <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
                <th style="text-align: left; padding: 4px; background: #eee;">Course Learning outcomes</th>
                <th style="text-align: center; padding: 4px; background: #eee; width: 80px;">Bobot LO</th>
            </tr>
            <tr>
                <td style="padding: 4px;"><strong>{{ $clo->kode_clo }}</strong> &nbsp;&nbsp; {{ $clo->deskripsi }}</td>
                <td style="text-align: center; padding: 4px;">?? %</td>
            </tr>
        </table>
        
        <p style="margin: 0 0 4px 0;"><strong>Soal LO{{ $index + 1 }}</strong></p>
        <div style="min-height: 50px; border: 1px dotted #ccc; padding: 8px;">
            @foreach ($soalList as $soal)
                <div style="margin-bottom: 4px; color: #555;">[Berkas Lampiran: {{ $soal->nama_file }} - {{ $soal->judul }}]</div>
            @endforeach
        </div>
    </div>

@empty
    <p style="font-family: 'Cambria', serif; font-size: 10px;">Belum ada CLO yang terdaftar untuk mata kuliah ini.</p>
@endforelse

</body>
</html>
