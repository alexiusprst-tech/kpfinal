<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Lembar Soal</title>
    <style>
        @page {
            margin: 1.5cm 1.5cm 2.2cm 1.5cm;
        }
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: #000;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        /* Header Info Form No */
        .form-no {
            font-size: 11px;
            font-weight: normal;
            margin-bottom: 6px;
            font-family: 'Arial', sans-serif;
        }
        /* Header Table styling */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            margin-bottom: 12px;
        }
        .header-table td {
            border: 1.5px solid #000000;
            padding: 6px 8px;
            font-size: 11px;
            vertical-align: middle;
        }
        .logo-cell {
            width: 22%;
            text-align: center;
            padding: 8px !important;
        }
        .logo-img {
            max-height: 48px;
            max-width: 100%;
            display: block;
            margin: 0 auto;
        }
        .title-cell {
            text-align: center;
            font-weight: bold;
            font-size: 15px;
            letter-spacing: 0.5px;
            padding: 8px !important;
        }
        .label-cell {
            font-weight: normal;
            width: 16%;
        }
        .value-cell {
            width: 32%;
        }
        .label-cell-right {
            font-weight: normal;
            width: 14%;
        }
        .value-cell-right {
            width: 16%;
        }

        /* Generic Table styling for Petunjuk & PLO */
        .block-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            margin-top: 10px;
        }
        .block-table td {
            border: 1.5px solid #000000;
            padding: 8px 10px;
            font-size: 11px;
            vertical-align: middle;
        }
        .block-label {
            width: 22%;
            font-weight: normal;
            text-align: left;
            line-height: 1.4;
        }
        .block-content {
            font-weight: normal;
            line-height: 1.5;
        }

        /* CLO Table */
        .clo-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            margin-top: 10px;
        }
        .clo-table th {
            border: 1.5px solid #000000;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: bold;
            text-align: left;
        }
        .clo-table td {
            border: 1.5px solid #000000;
            padding: 8px 10px;
            font-size: 11px;
            vertical-align: middle;
        }
        .clo-code {
            font-weight: bold;
            display: inline-block;
            margin-right: 15px;
        }
        .weight-col {
            width: 15%;
            text-align: right;
            font-weight: bold;
        }

        /* Soal Title */
        .soal-title-container {
            text-align: center;
            margin-top: 12px;
            margin-bottom: 12px;
        }
        .soal-title-badge {
            background-color: #FFFF00;
            padding: 3px 12px;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #000000;
            display: inline-block;
        }

        /* Area Soal Box */
        .area-soal-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            margin-bottom: 15px;
        }
        .area-soal-td {
            height: 250px;
            border: 1.5px solid #000000;
            background-color: #ffffff;
            vertical-align: middle;
            text-align: center;
        }

        /* Keep blocks together, avoid splitting CLO details and its area */
        .clo-group {
            page-break-inside: avoid;
        }
        
        .plo-group {
            page-break-inside: avoid;
        }

        /* Footer positioning */
        .footer {
            position: fixed;
            bottom: -1.2cm;
            left: 0;
            right: 0;
            height: 1cm;
            font-size: 9.5px;
            color: #000000;
            font-family: 'Arial', sans-serif;
        }
    </style>
</head>
<body>

    <!-- Header info Form No -->
    <div class="form-no">Form No : {{ $form_no }}</div>

    <!-- Header Table -->
    <table class="header-table">
        <tr>
            <td class="logo-cell" rowspan="4">
                @if(!empty($logo_base64))
                    <img class="logo-img" src="{{ $logo_base64 }}" alt="Logo Telkom University">
                @else
                    <strong style="font-size: 12px;">Telkom<br>University</strong>
                @endif
            </td>
            <td class="title-cell" colspan="4">LEMBAR SOAL</td>
        </tr>
        <tr>
            <td class="label-cell">Nama Evaluasi</td>
            <td class="value-cell">{{ $nama_evaluasi }}</td>
            <td class="label-cell-right">Kode dosen</td>
            <td class="value-cell-right">{{ $kode_dosen ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label-cell">Kode/Nama MK</td>
            <td class="value-cell">{{ $kode_nama_mk }}</td>
            <td class="label-cell-right">Tipe Ujian</td>
            <td class="value-cell-right">{{ $tipe_ujian }}</td>
        </tr>
        <tr>
            <td class="label-cell">Tanggal Evaluasi</td>
            <td class="value-cell">{{ $tanggal_evaluasi }}</td>
            <td class="label-cell-right">Tipe Soal</td>
            <td class="value-cell-right" style="font-weight: bold;">{{ $tipe_soal }}</td>
        </tr>
    </table>

    <!-- Petunjuk Pengerjaan Box -->
    <table class="block-table">
        <tr>
            <td class="block-label" style="text-align: center; font-weight: bold;">
                Petunjuk<br>Pengerjaan
            </td>
            <td class="block-content">
                @foreach($petunjuk_pengerjaan as $idx => $item)
                    <div style="margin-bottom: 4px;">({{ $idx + 1 }}) {{ $item }}</div>
                @endforeach
            </td>
        </tr>
    </table>

    @php $question_number = 1; @endphp

    <!-- Loop PLOs -->
    @foreach($plo as $ploItem)
        <div class="plo-group">
            <!-- PLO Box -->
            <table class="block-table">
                <tr>
                    <td class="block-label" style="text-align: center; font-weight: bold; width: 22%;">
                        Program<br>Learning<br>Outcomes
                    </td>
                    <td class="block-content" style="font-weight: bold;">
                        {{ $ploItem['kode'] }} – {{ $ploItem['deskripsi'] }}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Loop CLOs in PLO -->
        @foreach($ploItem['clo'] as $cloItem)
            <div class="clo-group">
                <!-- CLO Header Table -->
                <table class="clo-table">
                    <thead>
                        <tr>
                            <th>Course Learning outcomes</th>
                            <th class="weight-col">Bobot LO</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <span class="clo-code">{{ $cloItem['kode'] }}</span>
                                <span>{{ $cloItem['deskripsi'] }}</span>
                            </td>
                            <td class="weight-col">{{ $cloItem['bobot_lo'] }}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Soal LOx Badge -->
                <div class="soal-title-container">
                    <div class="soal-title-badge">Soal LO{{ $question_number }}</div>
                </div>

                <!-- Area Soal Box -->
                <table class="area-soal-table">
                    <tr>
                        <td class="area-soal-td">
                            &nbsp;
                        </td>
                    </tr>
                </table>
            </div>
            @php $question_number++; @endphp
        @endforeach
    @endforeach

    <!-- Footer -->
    <div class="footer">
        Fakultas Rekayasa Industri – S1 Sistem Informasi
    </div>

</body>
</html>
