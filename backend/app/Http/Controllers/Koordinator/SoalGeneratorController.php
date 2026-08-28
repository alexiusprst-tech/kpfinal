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
            $assignments = $dosen
                ? PenugasanKoordinator::with('mataKuliah')
                    ->where('dosen_id', $dosen->id)
                    ->where('status', 'ACTIVE')
                    ->get()
                : collect();

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
        $assignment = $dosen
            ? PenugasanKoordinator::where('dosen_id', $dosen->id)
                ->where('mata_kuliah_id', $mataKuliahId)
                ->where('status', 'ACTIVE')
                ->first()
            : null;

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

        // Pass base64 encoded logo for Word doc
        $logoPath = public_path('images/logo-telkom.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $type = pathinfo($logoPath, PATHINFO_EXTENSION);
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($logoData);
        }
        $data['logo_base64'] = $logoBase64;
        
        // Flag for Word export to style slightly differently if needed
        $data['is_word'] = true;

        $html = view('pdf.lembar-soal', $data)->render();
        $filename = 'Lembar_Soal_' . Str::slug($data['kode_nama_mk']) . '.doc';

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-word')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Cache-Control', 'max-age=0');
    }

    public function getCourseData(Request $request)
    {
        $user = $request->user();
        $dosen = $user->dosen;
        $mataKuliahId = $request->query('mata_kuliah_id');

        if (!$mataKuliahId) {
            return response()->json(['error' => 'Mata kuliah ID diperlukan.'], 400);
        }

        $assignment = $dosen
            ? PenugasanKoordinator::where('dosen_id', $dosen->id)
                ->where('mata_kuliah_id', $mataKuliahId)
                ->where('status', 'ACTIVE')
                ->first()
            : null;

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
