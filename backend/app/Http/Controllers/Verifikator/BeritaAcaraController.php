<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BeritaAcara;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BeritaAcaraController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $allPeriods = PeriodeVerifikasi::with('tahunAjaran')
            ->orderBy('created_at', 'desc')
            ->get();

        $activePeriod = $allPeriods->firstWhere('status', 'ACTIVE');
        $periodeId    = $request->get('periode_id');
        $kategoriType = strtoupper($request->get('kategori', 'ALL'));

        $selectedPeriod = null;
        if ($periodeId && $periodeId !== 'ALL') {
            $selectedPeriod = $allPeriods->firstWhere('id', $periodeId);
        } else {
            $selectedPeriod = $activePeriod ?? $allPeriods->first();
        }

        // Get assignments for selected period (or all)
        $assignmentsQuery = PenugasanVerifikator::with(['mataKuliah']);
        if ($dosen) {
            $assignmentsQuery->where('dosen_id', $dosen->id);
        } else {
            $assignmentsQuery->whereRaw('1 = 0');
        }

        if ($selectedPeriod && $periodeId !== 'ALL') {
            $assignmentsQuery->where('periode_id', $selectedPeriod->id);
        }
        $assignments = $assignmentsQuery->get();

        $assignedMkIds = $assignments->pluck('mata_kuliah_id');

        // Query Soal
        $soalQuery = Soal::with('kategori')
            ->whereIn('mata_kuliah_id', $assignedMkIds);

        if ($selectedPeriod && $periodeId !== 'ALL') {
            $soalQuery->where('periode_id', $selectedPeriod->id);
        }

        if (in_array($kategoriType, ['UTS', 'UAS'])) {
            $soalQuery->whereHas('kategori', function ($q) use ($kategoriType) {
                $q->whereRaw('UPPER(nama) LIKE ?', ["%{$kategoriType}%"]);
            });
        }

        $soalList = $soalQuery->get();

        $assignmentsWithStats = $assignments->map(function ($a) use ($soalList) {
            $mkSoal = $soalList->where('mata_kuliah_id', $a->mata_kuliah_id);
            $approvedCount = $mkSoal->where('status', 'APPROVED')->count();
            return [
                'id'             => $a->id,
                'mata_kuliah_id' => $a->mata_kuliah_id,
                'mata_kuliah'    => $a->mataKuliah,
                'total'          => $mkSoal->count(),
                'pending'        => $mkSoal->whereIn('status', ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count(),
                'approved'       => $approvedCount,
                'revision'       => $mkSoal->where('status', 'REVISION')->count(),
                'rejected'       => $mkSoal->where('status', 'REJECTED')->count(),
                'has_approved'   => $approvedCount > 0,
            ];
        });

        // History of generated Berita Acara
        $historyQuery = BeritaAcara::with(['mataKuliah', 'koordinator'])
            ->where('dibuat_oleh', $user->id);

        if ($selectedPeriod && $periodeId !== 'ALL') {
            $historyQuery->where('periode_id', $selectedPeriod->id);
        }

        $history = $historyQuery->orderBy('created_at', 'desc')->get();

        return Inertia::render('Verifikator/BeritaAcara/Index', [
            'activePeriod'      => $activePeriod,
            'allPeriods'        => $allPeriods,
            'selectedPeriodeId' => $selectedPeriod ? $selectedPeriod->id : 'ALL',
            'selectedKategori'  => $kategoriType,
            'assignments'       => $assignmentsWithStats,
            'history'           => $history,
        ]);
    }

    /**
     * Show the Berita Acara preview page for a given mata kuliah.
     * Displays only APPROVED soals and the existing BA record if any.
     */
    public function show(Request $request, MataKuliah $mataKuliah)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $allPeriods   = PeriodeVerifikasi::with('tahunAjaran')->orderBy('created_at', 'desc')->get();
        $activePeriod = $allPeriods->firstWhere('status', 'ACTIVE');
        $periodeId    = $request->get('periode_id');
        $kategoriType = strtoupper($request->get('kategori', 'ALL'));

        $selectedPeriod = null;
        if ($periodeId && $periodeId !== 'ALL') {
            $selectedPeriod = $allPeriods->firstWhere('id', $periodeId);
        } else {
            $selectedPeriod = $activePeriod ?? $allPeriods->first();
        }

        if (!$selectedPeriod) {
            return redirect()->route('verifikator.berita-acara.index')
                ->with('error', 'Tidak ada periode verifikasi yang ditemukan.');
        }

        $isAssigned = ($dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $selectedPeriod->id)
            ->where('status', 'ACTIVE')
            ->exists()) || $user->isSuperAdmin();

        if (!$isAssigned) {
            return redirect()->route('verifikator.berita-acara.index')
                ->with('error', 'Anda tidak ditugaskan sebagai verifikator untuk mata kuliah ini pada periode terpilih.');
        }

        // Query Soal
        $soalBaseQuery = Soal::where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $selectedPeriod->id);

        if (in_array($kategoriType, ['UTS', 'UAS'])) {
            $soalBaseQuery->whereHas('kategori', function ($q) use ($kategoriType) {
                $q->whereRaw('UPPER(nama) LIKE ?', ["%{$kategoriType}%"]);
            });
        }

        $allSoal = (clone $soalBaseQuery)->get();

        $soalApproved = (clone $soalBaseQuery)
            ->with(['kategori', 'latestVerifikasi.verifikator', 'uploadedBy'])
            ->where('status', Soal::STATUS_APPROVED)
            ->orderBy('created_at')
            ->get();

        $koordinatorDosen = PenugasanKoordinator::with('dosen')
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $selectedPeriod->id)
            ->first()?->dosen;

        // Check if a BA document has been generated previously
        $existingBA = BeritaAcara::where('periode_id', $selectedPeriod->id)
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('dibuat_oleh', $user->id)
            ->first();

        return Inertia::render('Verifikator/BeritaAcara/Show', [
            'mataKuliah'       => $mataKuliah,
            'activePeriod'     => $activePeriod,
            'allPeriods'       => $allPeriods,
            'selectedPeriodeId' => $selectedPeriod->id,
            'selectedKategori'  => $kategoriType,
            'soalApproved'     => $soalApproved,
            'stats'            => [
                'total'    => $allSoal->count(),
                'approved' => $soalApproved->count(),
                'pending'  => $allSoal->whereIn('status', ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count(),
                'revision' => $allSoal->where('status', 'REVISION')->count(),
                'rejected' => $allSoal->where('status', 'REJECTED')->count(),
            ],
            'koordinator'      => $koordinatorDosen ? [
                'nama'       => $koordinatorDosen->nama_lengkap,
                'kode_dosen' => $koordinatorDosen->kode_dosen,
            ] : null,
            'existingBA'       => $existingBA ? [
                'nomor'    => $existingBA->nomor,
                'tanggal'  => $existingBA->tanggal,
            ] : null,
        ]);
    }

    /**
     * Generate (or regenerate) the Berita Acara Verifikasi PDF for one mata
     * kuliah in the selected periode & category, store it, and stream it to the browser.
     */
    public function cetak(Request $request, MataKuliah $mataKuliah)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $periodeId    = $request->get('periode_id');
        $kategoriType = strtoupper($request->get('kategori', 'ALL'));

        $allPeriods   = PeriodeVerifikasi::with('tahunAjaran')->get();
        $activePeriod = $allPeriods->firstWhere('status', 'ACTIVE');

        if ($periodeId && $periodeId !== 'ALL') {
            $selectedPeriod = $allPeriods->firstWhere('id', $periodeId);
        } else {
            $selectedPeriod = $activePeriod ?? $allPeriods->first();
        }

        if (!$selectedPeriod) {
            return redirect()->back()->with('error', 'Tidak ada periode verifikasi yang dipilih.');
        }

        $isAssigned = ($dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $selectedPeriod->id)
            ->where('status', 'ACTIVE')
            ->exists()) || $user->isSuperAdmin();

        if (!$isAssigned) {
            return redirect()->back()->with('error', 'Anda tidak ditugaskan sebagai verifikator untuk mata kuliah ini.');
        }

        $soalQuery = Soal::with(['kategori', 'latestVerifikasi'])
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $selectedPeriod->id);

        if (in_array($kategoriType, ['UTS', 'UAS'])) {
            $soalQuery->whereHas('kategori', function ($q) use ($kategoriType) {
                $q->whereRaw('UPPER(nama) LIKE ?', ["%{$kategoriType}%"]);
            });
        }

        $soalList = $soalQuery->orderBy('created_at')->get();

        // Hanya ambil soal yang sudah disetujui (APPROVED) untuk Berita Acara
        $soalApproved = $soalList->where('status', 'APPROVED');

        if ($soalApproved->isEmpty()) {
            $labelKategori = in_array($kategoriType, ['UTS', 'UAS']) ? " {$kategoriType}" : "";
            return redirect()->back()->with('error', "Belum ada soal{$labelKategori} yang disetujui (APPROVED) untuk mata kuliah ini pada periode terpilih.");
        }

        $jumlahApproved = $soalApproved->count();
        $jumlahRevision = $soalList->where('status', 'REVISION')->count();
        $jumlahRejected = $soalList->where('status', 'REJECTED')->count();

        $koordinatorDosen = PenugasanKoordinator::with('dosen')
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $selectedPeriod->id)
            ->first()?->dosen;

        if (!$koordinatorDosen) {
            return redirect()->back()->with('error', 'Mata kuliah ini belum memiliki Dosen Koordinator pada periode terpilih.');
        }

        $clos = $mataKuliah->clo()->with('plo')->get();

        return DB::transaction(function () use ($user, $dosen, $selectedPeriod, $mataKuliah, $soalList, $soalApproved, $clos, $koordinatorDosen, $jumlahApproved, $jumlahRevision, $jumlahRejected) {
            // Lock period to prevent race condition during serial number generation
            $lockedPeriod = PeriodeVerifikasi::where('id', $selectedPeriod->id)->lockForUpdate()->first();

            $existing = BeritaAcara::where('periode_id', $lockedPeriod->id)
                ->where('mata_kuliah_id', $mataKuliah->id)
                ->where('dibuat_oleh', $user->id)
                ->lockForUpdate()
                ->first();

            $nomor = $existing?->nomor ?? $this->generateNomor($lockedPeriod, $mataKuliah);
            $tanggal = now();

            $logoPath = public_path('images/logo-telkom.png');
            $logoBase64 = '';
            if (file_exists($logoPath)) {
                $type = pathinfo($logoPath, PATHINFO_EXTENSION);
                $logoData = file_get_contents($logoPath);
                $logoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($logoData);
            }

            $baseData = [
                'nomor'                     => $nomor,
                'tanggal'                   => $tanggal,
                'tanggalIndonesia'          => $this->formatTanggalIndonesia($tanggal),
                'periode'                   => $lockedPeriod,
                'mataKuliah'               => $mataKuliah,
                'evaluatorNama'            => $user->name,
                'evaluatorKode'            => $dosen->kode_dosen ?? '-',
                'programStudi'             => config('app.program_studi', env('PRODI_NAME', 'S1 Sistem Informasi')),
                'koordinatorNama'          => $koordinatorDosen->nama_lengkap,
                'kaProdi'                  => config('app.kaprodi', env('KAPRODI_NAME', 'Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.')),
                'clos'                     => $clos,
                'jumlahSoal'               => 1,
                'jumlahApproved'           => 1,
                'jumlahRevision'           => $jumlahRevision,
                'jumlahRejected'           => $jumlahRejected,
                'logo_base64'              => $logoBase64,
                'tanda_tangan_evaluator'   => $dosen?->tanda_tangan
                    ? storage_path('app/public/' . $dosen->tanda_tangan)
                    : null,
                'tanda_tangan_koordinator' => $koordinatorDosen?->tanda_tangan
                    ? storage_path('app/public/' . $koordinatorDosen->tanda_tangan)
                    : null,
            ];

            // If only 1 approved soal exists, download its single BAP PDF
            if ($soalApproved->count() === 1) {
                $singleSoal = $soalApproved->first();
                $singleData = $baseData;
                $singleData['soalList'] = collect([$singleSoal]);

                $pdfContent = $this->generateBapPdf($singleData, $singleSoal);

                $relativePath = 'berita-acara/' . Str::uuid() . '.pdf';
                Storage::disk('private')->put($relativePath, $pdfContent);

                $beritaAcara = BeritaAcara::updateOrCreate(
                    [
                        'periode_id'     => $lockedPeriod->id,
                        'mata_kuliah_id' => $mataKuliah->id,
                        'dibuat_oleh'    => $user->id,
                    ],
                    [
                        'nomor'            => $nomor,
                        'koordinator_id'   => $koordinatorDosen->id,
                        'jumlah_soal'      => 1,
                        'jumlah_approved'  => 1,
                        'jumlah_revision'  => $jumlahRevision,
                        'jumlah_rejected'  => $jumlahRejected,
                        'file_path'        => $relativePath,
                        'tanggal'          => $tanggal,
                    ]
                );

                AuditLog::record($user->id, 'BERITA_ACARA_CREATED', 'BeritaAcara', $beritaAcara->id, null, [
                    'nomor'          => $nomor,
                    'mata_kuliah_id' => $mataKuliah->id,
                    'periode_id'     => $lockedPeriod->id,
                ]);

                $cleanTitle = Str::slug($mataKuliah->kode_mk . '-' . $singleSoal->judul);
                $filename = 'BAP-' . ($cleanTitle ?: 'soal') . '.pdf';

                return response($pdfContent)
                    ->header('Content-Type', 'application/pdf')
                    ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
            }

            // If multiple approved soals exist, generate separate BAP PDF for each and package into a ZIP archive
            $zipFilename = 'BAP-' . Str::slug($mataKuliah->kode_mk . '-' . $mataKuliah->nama_mk) . '.zip';
            $tempZipDir = storage_path('app/temp');
            if (!file_exists($tempZipDir)) {
                mkdir($tempZipDir, 0755, true);
            }
            $tempZipPath = $tempZipDir . '/bap_' . Str::uuid() . '.zip';

            $zip = new \ZipArchive();
            if ($zip->open($tempZipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
                foreach ($soalApproved as $index => $soalItem) {
                    $itemData = $baseData;
                    $itemData['soalList'] = collect([$soalItem]);

                    $pdfContent = $this->generateBapPdf($itemData, $soalItem);

                    $cleanTitle = Str::slug($mataKuliah->kode_mk . '-' . $soalItem->judul);
                    $pdfName = 'BAP-' . ($cleanTitle ?: ('soal-' . ($index + 1))) . '.pdf';

                    $zip->addFromString($pdfName, $pdfContent);
                }
                $zip->close();
            }

            $beritaAcara = BeritaAcara::updateOrCreate(
                [
                    'periode_id'     => $lockedPeriod->id,
                    'mata_kuliah_id' => $mataKuliah->id,
                    'dibuat_oleh'    => $user->id,
                ],
                [
                    'nomor'            => $nomor,
                    'koordinator_id'   => $koordinatorDosen->id,
                    'jumlah_soal'      => $soalApproved->count(),
                    'jumlah_approved'  => $jumlahApproved,
                    'jumlah_revision'  => $jumlahRevision,
                    'jumlah_rejected'  => $jumlahRejected,
                    'file_path'        => null,
                    'tanggal'          => $tanggal,
                ]
            );

            AuditLog::record($user->id, 'BERITA_ACARA_ALL_DOWNLOADED', 'BeritaAcara', $beritaAcara->id, null, [
                'nomor'          => $nomor,
                'mata_kuliah_id' => $mataKuliah->id,
                'periode_id'     => $lockedPeriod->id,
                'total_soal'     => $soalApproved->count(),
            ]);

            return response()->download($tempZipPath, $zipFilename)->deleteFileAfterSend(true);
        });
    }

    /**
     * Generate Berita Acara Verifikasi PDF for a specific approved Soal.
     */
    public function cetakSoal(Request $request, Soal $soal)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        if ($soal->status !== Soal::STATUS_APPROVED) {
            return redirect()->back()->with('error', 'Soal ini belum disetujui (APPROVED). Berita Acara hanya dapat dibuat untuk soal yang telah disetujui.');
        }

        $soal->load(['mataKuliah.clo.plo', 'periode.tahunAjaran', 'kategori', 'latestVerifikasi.verifikator', 'uploadedBy']);

        $mataKuliah = $soal->mataKuliah;
        $periode = $soal->periode;

        if (!$mataKuliah || !$periode) {
            return redirect()->back()->with('error', 'Data mata kuliah atau periode soal tidak ditemukan.');
        }

        $isAssigned = ($dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $periode->id)
            ->where('status', 'ACTIVE')
            ->exists()) || $user->isSuperAdmin();

        if (!$isAssigned) {
            return redirect()->back()->with('error', 'Anda tidak ditugaskan sebagai verifikator untuk mata kuliah ini.');
        }

        $koordinatorDosen = PenugasanKoordinator::with('dosen')
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $periode->id)
            ->where('status', 'ACTIVE')
            ->first()?->dosen;

        if (!$koordinatorDosen) {
            return redirect()->back()->with('error', 'Mata kuliah ini belum memiliki Dosen Koordinator aktif pada periode ini.');
        }

        $clos = $mataKuliah->clo()->with('plo')->get();
        $soalList = collect([$soal]);

        return DB::transaction(function () use ($user, $dosen, $periode, $mataKuliah, $soal, $soalList, $clos, $koordinatorDosen) {
            // Lock period to prevent race condition during serial number generation
            $lockedPeriod = PeriodeVerifikasi::where('id', $periode->id)->lockForUpdate()->first();

            $existing = BeritaAcara::where('periode_id', $lockedPeriod->id)
                ->where('mata_kuliah_id', $mataKuliah->id)
                ->where('dibuat_oleh', $user->id)
                ->lockForUpdate()
                ->first();

            $nomor = $existing?->nomor ?? $this->generateNomor($lockedPeriod, $mataKuliah);

            $tanggal = now();

            $logoPath = public_path('images/logo-telkom.png');
            $logoBase64 = '';
            if (file_exists($logoPath)) {
                $type = pathinfo($logoPath, PATHINFO_EXTENSION);
                $logoData = file_get_contents($logoPath);
                $logoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($logoData);
            }

            $data = [
                'nomor'                     => $nomor,
                'tanggal'                   => $tanggal,
                'tanggalIndonesia'          => $this->formatTanggalIndonesia($tanggal),
                'periode'                   => $lockedPeriod,
                'mataKuliah'               => $mataKuliah,
                'evaluatorNama'            => $user->name,
                'evaluatorKode'            => $dosen->kode_dosen ?? '-',
                'programStudi'             => config('app.program_studi', env('PRODI_NAME', 'S1 Sistem Informasi')),
                'koordinatorNama'          => $koordinatorDosen->nama_lengkap,
                'kaProdi'                  => config('app.kaprodi', env('KAPRODI_NAME', 'Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.')),
                'soalList'                 => $soalList,
                'clos'                     => $clos,
                'jumlahSoal'               => 1,
                'jumlahApproved'           => 1,
                'jumlahRevision'           => 0,
                'jumlahRejected'           => 0,
                'logo_base64'              => $logoBase64,
                'tanda_tangan_evaluator'   => $dosen?->tanda_tangan
                    ? storage_path('app/public/' . $dosen->tanda_tangan)
                    : null,
                'tanda_tangan_koordinator' => $koordinatorDosen?->tanda_tangan
                    ? storage_path('app/public/' . $koordinatorDosen->tanda_tangan)
                    : null,
            ];

            $pdfContent = $this->generateBapPdf($data, $soal);

            $relativePath = 'berita-acara/' . Str::uuid() . '.pdf';
            Storage::disk('private')->put($relativePath, $pdfContent);

            $beritaAcara = BeritaAcara::updateOrCreate(
                [
                    'periode_id'     => $lockedPeriod->id,
                    'mata_kuliah_id' => $mataKuliah->id,
                    'dibuat_oleh'    => $user->id,
                ],
                [
                    'nomor'            => $nomor,
                    'koordinator_id'   => $koordinatorDosen->id,
                    'jumlah_soal'      => 1,
                    'jumlah_approved'  => 1,
                    'jumlah_revision'  => 0,
                    'jumlah_rejected'  => 0,
                    'file_path'        => $relativePath,
                    'tanggal'          => $tanggal,
                ]
            );

            AuditLog::record($user->id, 'BERITA_ACARA_SOAL_DOWNLOADED', 'Soal', $soal->id, null, [
                'nomor'          => $nomor,
                'soal_id'        => $soal->id,
                'soal_judul'     => $soal->judul,
                'mata_kuliah_id' => $mataKuliah->id,
                'periode_id'     => $lockedPeriod->id,
            ]);

            $cleanTitle = Str::slug($mataKuliah->kode_mk . '-' . $soal->judul);
            $filename = 'BAP-' . ($cleanTitle ?: 'soal') . '.pdf';

            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        });
    }

    /**
     * Generate merged BAP PDF containing the 1-page BAP Form (Page 1)
     * and the actual uploaded exam question PDF by Koordinator MK (Page 2+).
     */
    private function generateBapPdf(array $viewData, ?Soal $soalItem = null): string
    {
        $domPdf = Pdf::loadView('pdf.berita-acara', $viewData)->setPaper('a4', 'portrait');
        $bapPdfContent = $domPdf->output();

        if (!$soalItem || empty($soalItem->file_path)) {
            return $bapPdfContent;
        }

        $filePath = null;
        if (Storage::disk('private')->exists($soalItem->file_path)) {
            $filePath = Storage::disk('private')->path($soalItem->file_path);
        } elseif (file_exists(storage_path('app/' . $soalItem->file_path))) {
            $filePath = storage_path('app/' . $soalItem->file_path);
        } elseif (file_exists(storage_path('app/private/' . $soalItem->file_path))) {
            $filePath = storage_path('app/private/' . $soalItem->file_path);
        }

        if (!$filePath || !file_exists($filePath)) {
            return $bapPdfContent;
        }

        $isPdf = strtolower(pathinfo($filePath, PATHINFO_EXTENSION)) === 'pdf'
            || (file_get_contents($filePath, false, null, 0, 5) === '%PDF-');

        if (!$isPdf) {
            return $bapPdfContent;
        }

        try {
            require_once base_path('vendor/setasign/fpdf/fpdf.php');
            require_once base_path('vendor/setasign/fpdi/src/autoload.php');

            $fpdi = new \setasign\Fpdi\Fpdi();

            // Import Page 1 from generated BAP PDF (The official Berita Acara Evaluation Form)
            $bapStream = \setasign\Fpdi\PdfParser\StreamReader::createByString($bapPdfContent);
            $pageCountBap = $fpdi->setSourceFile($bapStream);
            if ($pageCountBap >= 1) {
                $tplId = $fpdi->importPage(1);
                $size = $fpdi->getTemplateSize($tplId);
                $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $fpdi->useTemplate($tplId);
            }

            // Import ALL pages from the actual uploaded exam question PDF by Koordinator MK
            $pageCountSoal = $fpdi->setSourceFile($filePath);
            for ($pageNo = 1; $pageNo <= $pageCountSoal; $pageNo++) {
                $tplId = $fpdi->importPage($pageNo);
                $size = $fpdi->getTemplateSize($tplId);
                $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $fpdi->useTemplate($tplId);
            }

            return $fpdi->Output('S');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('FPDI merge failed, using standard BAP view: ' . $e->getMessage());
            return $bapPdfContent;
        }
    }

    private function generateNomor(PeriodeVerifikasi $periode, MataKuliah $mataKuliah): string
    {
        $seq = BeritaAcara::where('periode_id', $periode->id)->count() + 1;

        return sprintf('%03d/BAP-Ver/%s/%s', $seq, $mataKuliah->kode_mk, now()->format('m/Y'));
    }

    private function formatTanggalIndonesia(\Carbon\Carbon $date): string
    {
        $bulan = [
            1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];

        return sprintf('%d %s %d', $date->day, $bulan[(int) $date->month], $date->year);
    }
}
