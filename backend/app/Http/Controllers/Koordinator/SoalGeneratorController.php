<?php

namespace App\Http\Controllers\Koordinator;

use App\Http\Controllers\Controller;
use App\Models\MataKuliah;
use App\Models\PeriodeVerifikasi;
use App\Models\PenugasanKoordinator;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class SoalGeneratorController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $dosen = $user->dosen;
        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();
        $mataKuliahId = $request->query('mata_kuliah_id');

        if (!$mataKuliahId) {
            $assignments = ($dosen && $activePeriod)
                ? PenugasanKoordinator::with('mataKuliah')
                    ->where('dosen_id', $dosen->id)
                    ->where('periode_id', $activePeriod->id)
                    ->where('status', 'ACTIVE')
                    ->get()
                : ($dosen
                    ? PenugasanKoordinator::with('mataKuliah')
                        ->where('dosen_id', $dosen->id)
                        ->where('status', 'ACTIVE')
                        ->get()
                    : collect());

            if ($assignments->isEmpty()) {
                return redirect()->route('koordinator.dashboard')
                    ->with('error', 'Anda tidak memiliki penugasan mata kuliah aktif.');
            }

            if ($assignments->count() === 1) {
                return redirect()->route('koordinator.soal.generator', [
                    'mata_kuliah_id' => $assignments->first()->mata_kuliah_id
                ]);
            }

            return Inertia::render('Koordinator/Soal/GeneratorSelect', [
                'assignments' => $assignments->map(fn ($a) => [
                    'id' => $a->mata_kuliah_id,
                    'kode_mk' => $a->mataKuliah?->kode_mk,
                    'nama_mk' => $a->mataKuliah?->nama_mk,
                ])->values(),
                'activePeriode' => $activePeriod,
            ]);
        }

        // Verify assignment: coordinator must be assigned to this MK.
        $assignment = ($dosen && $activePeriod)
            ? PenugasanKoordinator::where('dosen_id', $dosen->id)
                ->where('mata_kuliah_id', $mataKuliahId)
                ->where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->first()
            : ($dosen
                ? PenugasanKoordinator::where('dosen_id', $dosen->id)
                    ->where('mata_kuliah_id', $mataKuliahId)
                    ->where('status', 'ACTIVE')
                    ->first()
                : null);

        if (!$assignment) {
            abort(403, 'Anda tidak memiliki akses ke mata kuliah ini.');
        }

        return redirect()->route('koordinator.soal.create', [
            'mata_kuliah_id' => $mataKuliahId,
            'tab' => 'generator'
        ]);
    }

    public function exportPdf(Request $request)
    {
        $request->validate([
            'form_no' => 'required|string',
            'nama_evaluasi' => 'required|string',
            'kode_dosen' => 'nullable|string',
            'kode_nama_mk' => 'required|string',
            'tipe_ujian' => 'required|string',
            'tanggal_evaluasi' => 'required|string',
            'tipe_soal' => 'required|string',
            'petunjuk_pengerjaan' => 'required|array',
            'plo' => 'required|array',
        ]);

        $plo = $request->input('plo', []);
        foreach ($plo as $ploItem) {
            $ploCode = $ploItem['kode'] ?? 'PLO';
            $cloList = $ploItem['clo'] ?? [];
            if (empty($cloList)) continue;

            $ploWeight = 0;
            foreach ($cloList as $cloItem) {
                $bobot = isset($cloItem['bobot_lo']) ? (int) str_replace('%', '', $cloItem['bobot_lo']) : 0;
                $ploWeight += $bobot;
            }

            if ($ploWeight !== 100) {
                abort(422, "Total bobot LO untuk {$ploCode} harus tepat 100%. Saat ini: {$ploWeight}%.");
            }
        }

        $data = $request->all();
        $user = $request->user();
        $dosen = $user->dosen;
        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();
        $isUas = false;
        if ($activePeriod) {
            $periodText = mb_strtolower(($activePeriod->nama ?? '') . ' ' . ($activePeriod->catatan ?? ''));
            if ((str_contains($periodText, 'uas') || str_contains($periodText, 'akhir semester')) && !str_contains($periodText, 'uts')) {
                $isUas = true;
            }
        }
        $data['nama_evaluasi'] = $request->input('nama_evaluasi') ?: ($isUas ? 'Ujian Akhir Semester' : 'Ujian Tengah Semester');
        $data['tipe_ujian'] = $request->input('tipe_ujian') ?: ($isUas ? 'UAS' : 'UTS');
        if ($dosen && $dosen->kode_dosen) {
            $data['kode_dosen'] = $dosen->kode_dosen;
        }

        // Pass base64 encoded logo to blade template for bulletproof rendering in Dompdf
        $logoPath = public_path('images/logo-telkom.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $type = pathinfo($logoPath, PATHINFO_EXTENSION);
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($logoData);
        }
        $data['logo_base64'] = $logoBase64;

        $pdf = Pdf::loadView('pdf.lembar-soal', $data);
        $pdf->setPaper('a4', 'portrait');
        
        // Return stream or download
        $filename = 'Lembar_Soal_' . Str::slug($data['kode_nama_mk']) . '.pdf';
        return $pdf->download($filename);
    }

    public function exportDocx(Request $request)
    {
        $request->validate([
            'form_no' => 'required|string',
            'nama_evaluasi' => 'required|string',
            'kode_dosen' => 'nullable|string',
            'kode_nama_mk' => 'required|string',
            'tipe_ujian' => 'required|string',
            'tanggal_evaluasi' => 'required|string',
            'tipe_soal' => 'required|string',
            'petunjuk_pengerjaan' => 'required|array',
            'plo' => 'required|array',
        ]);

        $plo = $request->input('plo', []);
        foreach ($plo as $ploItem) {
            $ploCode = $ploItem['kode'] ?? 'PLO';
            $cloList = $ploItem['clo'] ?? [];
            if (empty($cloList)) continue;

            $ploWeight = 0;
            foreach ($cloList as $cloItem) {
                $bobot = isset($cloItem['bobot_lo']) ? (int) str_replace('%', '', $cloItem['bobot_lo']) : 0;
                $ploWeight += $bobot;
            }

            if ($ploWeight !== 100) {
                abort(422, "Total bobot LO untuk {$ploCode} harus tepat 100%. Saat ini: {$ploWeight}%.");
            }
        }

        $data = $request->all();
        $user = $request->user();
        $dosen = $user->dosen;
        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();
        $isUas = false;
        if ($activePeriod) {
            $periodText = mb_strtolower(($activePeriod->nama ?? '') . ' ' . ($activePeriod->catatan ?? ''));
            if ((str_contains($periodText, 'uas') || str_contains($periodText, 'akhir semester')) && !str_contains($periodText, 'uts')) {
                $isUas = true;
            }
        }
        $data['nama_evaluasi'] = $request->input('nama_evaluasi') ?: ($isUas ? 'Ujian Akhir Semester' : 'Ujian Tengah Semester');
        $data['tipe_ujian'] = $request->input('tipe_ujian') ?: ($isUas ? 'UAS' : 'UTS');
        if ($dosen && $dosen->kode_dosen) {
            $data['kode_dosen'] = $dosen->kode_dosen;
        }

        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(9.5);

        $section = $phpWord->addSection([
            'marginTop'    => 850,
            'marginRight'  => 850,
            'marginBottom' => 1100,
            'marginLeft'   => 850,
        ]);

        // Form No
        $section->addText('Form No: ' . ($data['form_no'] ?? 'IT-TELU-POL-D04/01'), ['size' => 8.5, 'color' => '333333']);

        // Table Style Definition
        $borderStyle = ['borderColor' => '000000', 'borderSize' => 6, 'cellMargin' => 60];
        $phpWord->addTableStyle('ExamHeaderTable', $borderStyle);
        $phpWord->addTableStyle('ExamBlockTable', $borderStyle);

        // 1. Header Information Table
        $headerTable = $section->addTable('ExamHeaderTable');

        // Logo + Title Row
        $headerTable->addRow();
        $logoCell = $headerTable->addCell(2200, ['vMerge' => 'restart', 'valign' => 'center']);
        $logoPath = public_path('images/logo-telkom.png');
        if (file_exists($logoPath)) {
            $logoCell->addImage($logoPath, [
                'width'     => 110,
                'height'    => 48,
                'alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER
            ]);
        } else {
            $logoCell->addText('TELKOM UNIVERSITY', ['bold' => true, 'size' => 9], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        }

        $titleCell = $headerTable->addCell(6800, ['gridSpan' => 3, 'valign' => 'center']);
        $titleText = mb_strtoupper($data['nama_evaluasi'] ?? 'LEMBAR SOAL EVALUASI');
        $titleCell->addText($titleText, ['bold' => true, 'size' => 11], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);

        // Detail Rows
        $headerTable->addRow();
        $headerTable->addCell(2200, ['vMerge' => 'continue']);
        $headerTable->addCell(1600)->addText('Mata Kuliah:', ['bold' => true, 'size' => 8.5]);
        $headerTable->addCell(3000)->addText($data['kode_nama_mk'] ?? '-', ['size' => 8.5]);
        $headerTable->addCell(2200)->addText('Kode Dosen: ' . ($data['kode_dosen'] ?? '-'), ['size' => 8.5]);

        $headerTable->addRow();
        $headerTable->addCell(2200, ['vMerge' => 'continue']);
        $headerTable->addCell(1600)->addText('Tipe / Sifat:', ['bold' => true, 'size' => 8.5]);
        $headerTable->addCell(3000)->addText(($data['tipe_ujian'] ?? 'UTS') . ' / ' . ($data['tipe_soal'] ?? 'Tutup Buku'), ['size' => 8.5]);
        $headerTable->addCell(2200)->addText('Hari/Tgl: ' . ($data['tanggal_evaluasi'] ?? '-'), ['size' => 8.5]);

        $section->addTextBreak(1);

        // 2. Petunjuk Pengerjaan Soal Table
        $petunjukTable = $section->addTable('ExamBlockTable');
        $petunjukTable->addRow();
        $petunjukLabel = $petunjukTable->addCell(2200, ['valign' => 'top', 'bgColor' => 'F2F2F2']);
        $petunjukLabel->addText('PETUNJUK PENGERJAAN SOAL', ['bold' => true, 'size' => 8.5]);

        $petunjukContent = $petunjukTable->addCell(6800, ['valign' => 'top']);
        $petunjukList = $data['petunjuk_pengerjaan'] ?? [];
        foreach ($petunjukList as $idx => $p) {
            $num = $idx + 1;
            $petunjukContent->addText("{$num}. {$p}", ['size' => 8.5]);
        }

        $section->addTextBreak(1);

        // 3. PLO & CLO Assessment Mapping Table
        $ploTable = $section->addTable('ExamBlockTable');

        // Header Row
        $ploTable->addRow();
        $thBg = ['bgColor' => 'E6E6E6', 'valign' => 'center'];
        $ploTable->addCell(1800, $thBg)->addText('PLO (Capaian)', ['bold' => true, 'size' => 8.5], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $ploTable->addCell(3400, $thBg)->addText('CLO / Course Learning Outcome', ['bold' => true, 'size' => 8.5], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $ploTable->addCell(1400, $thBg)->addText('Taksonomi', ['bold' => true, 'size' => 8.5], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $ploTable->addCell(1000, $thBg)->addText('Bobot LO', ['bold' => true, 'size' => 8.5], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $ploTable->addCell(1400, $thBg)->addText('Bentuk Soal', ['bold' => true, 'size' => 8.5], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);

        foreach ($plo as $pItem) {
            $ploCode = $pItem['kode'] ?? 'PLO';
            $cloList = $pItem['clo'] ?? [];
            if (empty($cloList)) continue;

            $cloCount = count($cloList);
            foreach ($cloList as $cIdx => $cItem) {
                $ploTable->addRow();

                if ($cIdx === 0) {
                    $ploCell = $ploTable->addCell(1800, ['vMerge' => 'restart', 'valign' => 'center']);
                    $ploCell->addText($ploCode, ['bold' => true, 'size' => 8.5]);
                    if (!empty($pItem['deskripsi'])) {
                        $ploCell->addText($pItem['deskripsi'], ['size' => 8, 'color' => '555555']);
                    }
                } else {
                    $ploTable->addCell(1800, ['vMerge' => 'continue']);
                }

                $cloCell = $ploTable->addCell(3400, ['valign' => 'center']);
                $cloKode = $cItem['kode'] ?? '';
                $cloDesk = $cItem['deskripsi'] ?? '';
                $cloCell->addText(($cloKode ? "{$cloKode}: " : '') . $cloDesk, ['size' => 8.5]);

                $ploTable->addCell(1400, ['valign' => 'center'])->addText($cItem['bloom'] ?? '-', ['size' => 8.5], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
                $ploTable->addCell(1000, ['valign' => 'center'])->addText(($cItem['bobot_lo'] ?? '0') . (str_contains((string)$cItem['bobot_lo'], '%') ? '' : '%'), ['bold' => true, 'size' => 8.5], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
                $ploTable->addCell(1400, ['valign' => 'center'])->addText($cItem['bentuk_soal'] ?? 'Uraian', ['size' => 8.5], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
            }
        }

        $section->addTextBreak(1);

        // 4. Questions Body Area
        $section->addText('NASKAH SOAL UJIAN:', ['bold' => true, 'size' => 10]);
        $section->addTextBreak(1);

        $qNum = 1;
        foreach ($plo as $pItem) {
            foreach ($pItem['clo'] ?? [] as $cItem) {
                $qTable = $section->addTable('ExamBlockTable');
                $qTable->addRow();
                $qHeaderCell = $qTable->addCell(9000, ['bgColor' => 'F2F2F2', 'valign' => 'center']);
                $qHeaderCell->addText("Soal LO{$qNum} (" . ($cItem['kode'] ?? 'CLO') . " - Bobot: " . ($cItem['bobot_lo'] ?? '0%') . ")", ['bold' => true, 'size' => 9]);

                $qTable->addRow();
                $qBodyCell = $qTable->addCell(9000, ['valign' => 'top']);
                if (!empty($cItem['soal'])) {
                    $lines = explode("\n", $cItem['soal']);
                    foreach ($lines as $line) {
                        $qBodyCell->addText(rtrim($line), ['size' => 9]);
                    }
                } else {
                    $qBodyCell->addText('[ AREA SOAL ]', ['color' => '888888', 'size' => 9]);
                    $qBodyCell->addTextBreak(2);
                }

                $section->addTextBreak(1);
                $qNum++;
            }
        }

        // Save to temporary file and stream as native .docx
        $tempFile = tempnam(sys_get_temp_dir(), 'lembar_soal_') . '.docx';
        $writer = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($tempFile);

        $filename = 'Lembar_Soal_' . Str::slug($data['kode_nama_mk'] ?? 'Ujian') . '.docx';

        return response()->download($tempFile, $filename, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ])->deleteFileAfterSend(true);
    }

    public function getCourseData(Request $request)
    {
        $user = $request->user();
        $dosen = $user->dosen;
        $mataKuliahId = $request->query('mata_kuliah_id');

        if (!$mataKuliahId) {
            return response()->json(['error' => 'Mata kuliah ID diperlukan.'], 400);
        }

        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();
        $assignment = ($dosen && $activePeriod)
            ? PenugasanKoordinator::where('dosen_id', $dosen->id)
                ->where('mata_kuliah_id', $mataKuliahId)
                ->where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->first()
            : ($dosen
                ? PenugasanKoordinator::where('dosen_id', $dosen->id)
                    ->where('mata_kuliah_id', $mataKuliahId)
                    ->where('status', 'ACTIVE')
                    ->first()
                : null);

        if (!$assignment) {
            return response()->json(['error' => 'Anda tidak memiliki akses ke mata kuliah ini.'], 403);
        }

        $mataKuliah = MataKuliah::with([
            'plo',
            'clo' => function ($q) {
                $q->with('plo');
            }
        ])->findOrFail($mataKuliahId);

        $ploData = [];
        $allPlo = $mataKuliah->plo;
        $allClo = $mataKuliah->clo;

        foreach ($allPlo as $plo) {
            $matchingClos = $allClo->filter(function ($clo) use ($plo) {
                return $clo->plo->contains('id', $plo->id);
            })->values();

            $cloCount = $matchingClos->count();
            $defaultWeight = $cloCount > 0 ? (int) floor(100 / $cloCount) : 0;
            $remainder = $cloCount > 0 ? (100 % $cloCount) : 0;

            $cloList = [];
            foreach ($matchingClos as $idx => $clo) {
                $weight = $defaultWeight;
                if ($idx === 0) {
                    $weight += $remainder;
                }
                $cloList[] = [
                    'kode' => $clo->kode_clo,
                    'deskripsi' => $clo->deskripsi,
                    'bobot_lo' => $weight . '%'
                ];
            }

            if (!empty($cloList)) {
                $ploData[] = [
                    'kode' => $plo->kode_plo,
                    'deskripsi' => $plo->deskripsi,
                    'clo' => $cloList
                ];
            }
        }

        $unlinkedClo = [];
        foreach ($allClo as $clo) {
            $linked = false;
            foreach ($allPlo as $plo) {
                if ($clo->plo->contains('id', $plo->id)) {
                    $linked = true;
                    break;
                }
            }
            if (!$linked) {
                $unlinkedClo[] = $clo;
            }
        }

        if (!empty($unlinkedClo)) {
            $unlinkedCount = count($unlinkedClo);
            $unlinkedDefaultWeight = $unlinkedCount > 0 ? (int) floor(100 / $unlinkedCount) : 0;
            $unlinkedRemainder = $unlinkedCount > 0 ? (100 % $unlinkedCount) : 0;

            $unlinkedList = [];
            foreach ($unlinkedClo as $idx => $clo) {
                $weight = $unlinkedDefaultWeight;
                if ($idx === 0) {
                    $weight += $unlinkedRemainder;
                }
                $unlinkedList[] = [
                    'kode' => $clo->kode_clo,
                    'deskripsi' => $clo->deskripsi,
                    'bobot_lo' => $weight . '%'
                ];
            }

            $ploData[] = [
                'kode' => 'PLO-Lainnya',
                'deskripsi' => 'Program Learning Outcomes Lainnya',
                'clo' => $unlinkedList
            ];
        }

        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();
        $isUas = false;
        if ($activePeriod) {
            $periodText = mb_strtolower(($activePeriod->nama ?? '') . ' ' . ($activePeriod->catatan ?? ''));
            if ((str_contains($periodText, 'uas') || str_contains($periodText, 'akhir semester')) && !str_contains($periodText, 'uts')) {
                $isUas = true;
            }
        }

        return response()->json([
            'form_no' => '100-S1SI-001-R1',
            'nama_evaluasi' => $isUas ? 'Ujian Akhir Semester' : 'Ujian Tengah Semester',
            'kode_dosen' => $dosen ? $dosen->kode_dosen : '',
            'kode_nama_mk' => $mataKuliah->kode_mk . ' / ' . $mataKuliah->nama_mk,
            'tipe_ujian' => $isUas ? 'UAS' : 'UTS',
            'tanggal_evaluasi' => date('Y-m-d') . ' / 120 menit',
            'tipe_soal' => 'Closed Book (120 minutes)',
            'petunjuk_pengerjaan' => [
                'Bacalah setiap soal dengan teliti.',
                'Jawablah seluruh pertanyaan pada lembar jawaban yang disediakan.',
                'Dilarang menggunakan kalkulator atau handphone selama ujian berlangsung.',
            ],
            'plo' => $ploData
        ]);
    }
}
