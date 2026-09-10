<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BeritaAcara;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Setting;
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

        $isAssigned = $this->isAssignedVerifikator($user, $dosen, $mataKuliah->id, $selectedPeriod->id);

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
            ->orderBy('created_at', 'desc')
            ->get();

        $koordinatorDosen = PenugasanKoordinator::with('dosen')
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $selectedPeriod->id)
            ->first()?->dosen;

        // Check if a BA document has been generated previously
        $existingBA = BeritaAcara::where('periode_id', $selectedPeriod->id)
            ->where('mata_kuliah_id', $mataKuliah->id)
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

        $isAssigned = $this->isAssignedVerifikator($user, $dosen, $mataKuliah->id, $selectedPeriod->id);

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
            $lockedPeriod = PeriodeVerifikasi::with('tahunAjaran')->where('id', $selectedPeriod->id)->lockForUpdate()->first();

            $existing = BeritaAcara::where('periode_id', $lockedPeriod->id)
                ->where('mata_kuliah_id', $mataKuliah->id)
                ->lockForUpdate()
                ->first();

            $nomor = $existing?->nomor ?? $this->generateNomor($lockedPeriod, $mataKuliah);
            $tanggal = now();

            $logoBase64 = $this->getLogoBase64();

            $baseData = [
                'nomor'                     => $nomor,
                'tanggal'                   => $tanggal,
                'tanggalIndonesia'          => $this->formatTanggalIndonesia($tanggal),
                'periode'                   => $lockedPeriod,
                'mataKuliah'               => $mataKuliah,
                'evaluatorNama'            => $user->name,
                'evaluatorKode'            => $dosen->kode_dosen ?? '-',
                'programStudi'             => Setting::get('prodi_nama', config('app.program_studi', env('PRODI_NAME', 'S1 Sistem Informasi'))),
                'koordinatorNama'          => $koordinatorDosen->nama_lengkap,
                'kaProdi'                  => Setting::get('kaprodi_nama', config('app.kaprodi', env('KAPRODI_NAME', 'Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.'))),
                'clos'                     => $clos,
                'jumlahSoal'               => 1,
                'jumlahApproved'           => 1,
                'jumlahRevision'           => $jumlahRevision,
                'jumlahRejected'           => $jumlahRejected,
                'logo_base64'              => $logoBase64,
                'tanda_tangan_evaluator'   => $this->imageToBase64($dosen?->tanda_tangan ? storage_path('app/public/' . $dosen->tanda_tangan) : null),
                'tanda_tangan_koordinator' => $this->imageToBase64($koordinatorDosen?->tanda_tangan ? storage_path('app/public/' . $koordinatorDosen->tanda_tangan) : null),
                'tanda_tangan_kaprodi'     => $this->imageToBase64(Setting::getKaprodiSignaturePath()),
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
                    ],
                    [
                        'nomor'            => $nomor,
                        'koordinator_id'   => $koordinatorDosen->id,
                        'dibuat_oleh'      => $user->id,
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
                    $suffix = $soalApproved->count() > 1 ? ('-' . ($index + 1)) : '';
                    $pdfName = 'BAP-' . ($cleanTitle ?: 'soal') . $suffix . '.pdf';

                    $zip->addFromString($pdfName, $pdfContent);
                }
                $zip->close();
            }

            $beritaAcara = BeritaAcara::updateOrCreate(
                [
                    'periode_id'     => $lockedPeriod->id,
                    'mata_kuliah_id' => $mataKuliah->id,
                ],
                [
                    'nomor'            => $nomor,
                    'koordinator_id'   => $koordinatorDosen->id,
                    'dibuat_oleh'      => $user->id,
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

        $isAssigned = $this->isAssignedVerifikator($user, $dosen, $mataKuliah->id, $periode->id);

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
            $lockedPeriod = PeriodeVerifikasi::with('tahunAjaran')->where('id', $periode->id)->lockForUpdate()->first();

            $existing = BeritaAcara::where('periode_id', $lockedPeriod->id)
                ->where('mata_kuliah_id', $mataKuliah->id)
                ->lockForUpdate()
                ->first();

            $nomor = $existing?->nomor ?? $this->generateNomor($lockedPeriod, $mataKuliah);

            $tanggal = now();

            $logoBase64 = $this->getLogoBase64();

            $data = [
                'nomor'                     => $nomor,
                'tanggal'                   => $tanggal,
                'tanggalIndonesia'          => $this->formatTanggalIndonesia($tanggal),
                'periode'                   => $lockedPeriod,
                'mataKuliah'               => $mataKuliah,
                'evaluatorNama'            => $user->name,
                'evaluatorKode'            => $dosen->kode_dosen ?? '-',
                'programStudi'             => Setting::get('prodi_nama', config('app.program_studi', env('PRODI_NAME', 'S1 Sistem Informasi'))),
                'koordinatorNama'          => $koordinatorDosen->nama_lengkap,
                'kaProdi'                  => Setting::get('kaprodi_nama', config('app.kaprodi', env('KAPRODI_NAME', 'Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.'))),
                'soalList'                 => $soalList,
                'clos'                     => $clos,
                'jumlahSoal'               => 1,
                'jumlahApproved'           => 1,
                'jumlahRevision'           => 0,
                'jumlahRejected'           => 0,
                'logo_base64'              => $logoBase64,
                'tanda_tangan_evaluator'   => $this->imageToBase64($dosen?->tanda_tangan ? storage_path('app/public/' . $dosen->tanda_tangan) : null),
                'tanda_tangan_koordinator' => $this->imageToBase64($koordinatorDosen?->tanda_tangan ? storage_path('app/public/' . $koordinatorDosen->tanda_tangan) : null),
                'tanda_tangan_kaprodi'     => $this->imageToBase64(Setting::getKaprodiSignaturePath()),
            ];

            $pdfContent = $this->generateBapPdf($data, $soal);

            $relativePath = 'berita-acara/' . Str::uuid() . '.pdf';
            Storage::disk('private')->put($relativePath, $pdfContent);

            $beritaAcara = BeritaAcara::updateOrCreate(
                [
                    'periode_id'     => $lockedPeriod->id,
                    'mata_kuliah_id' => $mataKuliah->id,
                ],
                [
                    'nomor'            => $nomor,
                    'koordinator_id'   => $koordinatorDosen->id,
                    'dibuat_oleh'      => $user->id,
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
     * Generate merged BAP PDF containing the official 1-page BAP Evaluation Form (Page 1)
     * and the actual uploaded exam question file by Koordinator MK (Page 2+).
     *
     * Supports both PDF and DOCX uploads:
     * - PDF  → merged directly with FPDI
     * - DOCX → converted to high-fidelity PDF (via Word COM on Windows / LibreOffice on Linux / PhpWord), then merged
     */
    private function generateBapPdf(array $viewData, ?Soal $soalItem = null): string
    {
        // 1. Ambil berkas revisi terbaru jika ada, jika tidak ada gunakan berkas asli soal
        $targetRelativePath = null;
        if ($soalItem) {
            $latestRevisi = $soalItem->revisi()->whereNotNull('file_path')->first();
            $targetRelativePath = ($latestRevisi && !empty($latestRevisi->file_path))
                ? $latestRevisi->file_path
                : $soalItem->file_path;
        }

        $filePath = null;
        if (!empty($targetRelativePath)) {
            if (Storage::disk('private')->exists($targetRelativePath)) {
                $filePath = Storage::disk('private')->path($targetRelativePath);
            } elseif (file_exists(storage_path('app/' . $targetRelativePath))) {
                $filePath = storage_path('app/' . $targetRelativePath);
            } elseif (file_exists(storage_path('app/private/' . $targetRelativePath))) {
                $filePath = storage_path('app/private/' . $targetRelativePath);
            }
        }

        // 2. Tentukan apakah file soal ada dan ekstensinya
        $hasAttachmentFile = $filePath && file_exists($filePath);
        $fileExtension = $hasAttachmentFile
            ? strtolower(pathinfo($filePath, PATHINFO_EXTENSION))
            : null;

        $isPdf = $hasAttachmentFile && (
            $fileExtension === 'pdf' ||
            file_get_contents($filePath, false, null, 0, 5) === '%PDF-'
        );
        $isDocx = $hasAttachmentFile && in_array($fileExtension, ['docx', 'doc']);

        // 3. Jika DOCX/DOC, konversi ke PDF sementara terlebih dahulu
        $tempPdfPath = null;
        if ($isDocx) {
            $tempPdfPath = $this->convertDocxToPdf($filePath);
            if ($tempPdfPath && file_exists($tempPdfPath)) {
                $isPdf = true;
                $filePath = $tempPdfPath;
            }
        }

        // 4. Render formulir 1 halaman Berita Acara (Blade → DomPDF)
        $domPdf = Pdf::loadView('pdf.berita-acara', $viewData)->setPaper('a4', 'portrait');
        $bapPdfContent = $domPdf->output();

        // Jika tidak ada berkas soal yang bisa di-merge, kembalikan hanya form BAP (1 halaman)
        if (!$isPdf || empty($filePath) || !file_exists($filePath)) {
            return $bapPdfContent;
        }

        try {
            $fpdi = new \setasign\Fpdi\Fpdi();

            // Import halaman formulir Berita Acara (Halaman 1)
            $bapStream = \setasign\Fpdi\PdfParser\StreamReader::createByString($bapPdfContent);
            $pageCountBap = $fpdi->setSourceFile($bapStream);
            for ($pageNo = 1; $pageNo <= $pageCountBap; $pageNo++) {
                $tplId = $fpdi->importPage($pageNo);
                $size  = $fpdi->getTemplateSize($tplId);
                $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $fpdi->useTemplate($tplId);
            }

            // Import SELURUH halaman naskah soal yang diunggah Koordinator MK (Halaman 2 dst)
            $pageCountSoal = $fpdi->setSourceFile($filePath);
            for ($pageNo = 1; $pageNo <= $pageCountSoal; $pageNo++) {
                $tplId = $fpdi->importPage($pageNo);
                $size  = $fpdi->getTemplateSize($tplId);
                $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $fpdi->useTemplate($tplId);
            }

            $output = $fpdi->Output('S');
            return $output;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('FPDI merge failed: ' . $e->getMessage());
            return $bapPdfContent;
        } finally {
            // Hapus file PDF sementara hasil konversi DOCX (jika ada)
            if ($tempPdfPath && file_exists($tempPdfPath)) {
                @unlink($tempPdfPath);
            }
        }
    }

    /**
     * Konversi file DOCX/DOC ke PDF.
     * Menggunakan Microsoft Word COM (di Windows), LibreOffice (jika ada),
     * atau PhpWord sebagai fallback.
     * Mengembalikan path absolut ke file PDF sementara, atau null jika gagal.
     */
    private function convertDocxToPdf(string $docxPath): ?string
    {
        if (!file_exists($docxPath)) {
            return null;
        }

        $realDocxPath = realpath($docxPath) ?: $docxPath;
        $tempPdfPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'bap_docx_' . uniqid() . '.pdf';

        // 1. Metode Utama (Windows): Microsoft Word COM via PowerShell
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            try {
                $tempPs1 = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'wconv_' . uniqid() . '.ps1';
                $escapedDocx = addslashes($realDocxPath);
                $escapedPdf = addslashes($tempPdfPath);

                $psScript = <<<PS
\$docx = "$escapedDocx"
\$pdf = "$escapedPdf"
\$word = \$null
try {
    \$word = New-Object -ComObject Word.Application
    \$word.Visible = \$false
    \$doc = \$word.Documents.Open(\$docx, \$false, \$true)
    \$doc.SaveAs([ref]\$pdf, [ref]17) # 17 = wdFormatPDF
    \$doc.Close([ref]0)
    \$word.Quit()
    Write-Output "SUCCESS"
} catch {
    Write-Output "ERROR: \$_"
    if (\$null -ne \$word) {
        try { \$word.Quit() } catch {}
    }
}
PS;

                file_put_contents($tempPs1, $psScript);
                $cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -File "' . $tempPs1 . '" 2>&1';
                $output = shell_exec($cmd);
                @unlink($tempPs1);

                if (file_exists($tempPdfPath) && filesize($tempPdfPath) > 0) {
                    return $tempPdfPath;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Word COM conversion failed: ' . $e->getMessage());
            }
        }

        // 2. Metode Cadangan: LibreOffice / soffice CLI (Linux / Server)
        try {
            $sofficeBin = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'soffice.exe' : 'soffice';
            $outDir = sys_get_temp_dir();
            $cmd = sprintf('%s --headless --convert-to pdf --outdir %s %s 2>&1', escapeshellcmd($sofficeBin), escapeshellarg($outDir), escapeshellarg($realDocxPath));
            @exec($cmd, $output, $returnCode);

            $expectedPdf = $outDir . DIRECTORY_SEPARATOR . pathinfo($realDocxPath, PATHINFO_FILENAME) . '.pdf';
            if (file_exists($expectedPdf) && filesize($expectedPdf) > 0) {
                if ($expectedPdf !== $tempPdfPath) {
                    @rename($expectedPdf, $tempPdfPath);
                }
                return $tempPdfPath;
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('LibreOffice conversion failed: ' . $e->getMessage());
        }

        // 3. Metode Fallback: PhpWord + DomPDF
        try {
            libxml_use_internal_errors(true);
            $phpWord = \PhpOffice\PhpWord\IOFactory::load($docxPath);

            $htmlWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'HTML');
            $tempHtmlPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'bap_soal_' . uniqid() . '.html';
            $htmlWriter->save($tempHtmlPath);

            $htmlContent = file_get_contents($tempHtmlPath);
            @unlink($tempHtmlPath);

            if (!empty($htmlContent)) {
                $styledHtml = '<style>
                    body { font-family: Arial, sans-serif; font-size: 11pt; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    td, th { border: 1px solid #ccc; padding: 4px 6px; }
                    p { margin: 4px 0; line-height: 1.4; }
                    img { max-width: 100%; }
                </style>' . $htmlContent;

                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($styledHtml)->setPaper('a4', 'portrait');
                $pdfContent = $pdf->output();

                file_put_contents($tempPdfPath, $pdfContent);
                if (file_exists($tempPdfPath) && filesize($tempPdfPath) > 0) {
                    return $tempPdfPath;
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('PhpWord conversion failed: ' . $e->getMessage());
        }

        return null;
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

    private function getLogoBase64(): string
    {
        $logoPath = public_path('images/logo-telkom.png');
        if (!file_exists($logoPath)) {
            return '';
        }

        $type = pathinfo($logoPath, PATHINFO_EXTENSION);
        $logoData = file_get_contents($logoPath);

        return 'data:image/' . $type . ';base64,' . base64_encode($logoData);
    }

    private function imageToBase64(?string $path): ?string
    {
        if (empty($path) || !file_exists($path)) {
            return null;
        }

        try {
            $type = pathinfo($path, PATHINFO_EXTENSION) ?: 'png';
            $data = file_get_contents($path);
            if ($data === false) {
                return null;
            }
            return 'data:image/' . $type . ';base64,' . base64_encode($data);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function isAssignedVerifikator($user, ?object $dosen, string $mataKuliahId, string $periodeId): bool
    {
        return ($dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $mataKuliahId)
            ->where('periode_id', $periodeId)
            ->where('status', 'ACTIVE')
            ->exists()) || $user->isSuperAdmin();
    }
}
