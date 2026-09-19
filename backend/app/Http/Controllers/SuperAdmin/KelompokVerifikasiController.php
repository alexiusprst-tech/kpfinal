<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dosen;
use App\Models\KelompokKoordinator;
use App\Models\KelompokMataKuliah;
use App\Models\KelompokVerifikasi;
use App\Models\KelompokVerifikator;
use App\Models\MataKuliah;
use App\Models\Notification;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use App\Models\Verifikasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class KelompokVerifikasiController extends Controller
{
    public function index(Request $request)
    {
        $query = KelompokVerifikasi::with([
            'periode.tahunAjaran',
            'mataKuliah.mataKuliah',
            'mataKuliah.koordinator',
            'koordinator.dosen',
            'verifikator.dosen',
            'createdBy',
        ])->withCount(['mataKuliah', 'koordinator', 'verifikator']);

        // Search by group name or course name / code
        if ($request->search) {
            $term = "%{$request->search}%";
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(nama) LIKE ?', [strtolower($term)])
                  ->orWhereHas('mataKuliah.mataKuliah', function ($mkQ) use ($term) {
                      $mkQ->whereRaw('LOWER(nama_mk) LIKE ?', [strtolower($term)])
                          ->orWhereRaw('LOWER(kode_mk) LIKE ?', [strtolower($term)]);
                  })
                  ->orWhereHas('koordinator.dosen', function ($dQ) use ($term) {
                      $dQ->whereRaw('LOWER(nama_lengkap) LIKE ?', [strtolower($term)])
                         ->orWhereRaw('LOWER(kode_dosen) LIKE ?', [strtolower($term)]);
                  });
            });
        }

        // Filter by Periode
        if ($request->periode_id) {
            $query->where('periode_id', $request->periode_id);
        }

        // Filter by Status (DRAFT, ACTIVE, INACTIVE, CLOSED)
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Sort by created_at desc by default
        $sortField = $request->sort ?? 'created_at';
        $sortOrder = $request->order === 'asc' ? 'asc' : 'desc';
        $kelompokList = $query->orderBy($sortField, $sortOrder)->paginate(10)->withQueryString();

        // Periode list for filter dropdown
        $periodeList = PeriodeVerifikasi::with('tahunAjaran')
            ->orderBy('created_at', 'desc')
            ->get();

        $dosenList = Dosen::where('status', 'ACTIVE')->orderBy('kode_dosen')->get();
        $tahunAjaranList = \App\Models\TahunAjaran::all();

        // Statistics Cards Data
        $stats = [
            'total'    => KelompokVerifikasi::count(),
            'active'   => KelompokVerifikasi::where('status', 'ACTIVE')->count(),
            'draft'    => KelompokVerifikasi::where('status', 'DRAFT')->count(),
            'inactive' => KelompokVerifikasi::where('status', 'INACTIVE')->count(),
            'closed'   => KelompokVerifikasi::where('status', 'CLOSED')->count(),
        ];

        return Inertia::render('SuperAdmin/KelompokVerifikasi/Index', [
            'list'           => $kelompokList,
            'kelompokList'   => $kelompokList,
            'periodeList'    => $periodeList,
            'periodeAll'     => $periodeList,
            'dosenAll'       => $dosenList,
            'dosenList'      => $dosenList,
            'tahunAjaranAll' => $tahunAjaranList,
            'stats'          => $stats,
            'filters'        => $request->only(['search', 'periode_id', 'status', 'sort', 'order']),
        ]);
    }

    public function create()
    {
        $periodeList = PeriodeVerifikasi::with('tahunAjaran')
            ->whereIn('status', ['ACTIVE', 'DRAFT'])
            ->orderBy('created_at', 'desc')
            ->get();

        $mataKuliahList = MataKuliah::orderBy('kode_mk')
            ->get();

        $dosenList = Dosen::where('status', 'ACTIVE')
            ->orderBy('kode_dosen')
            ->get();

        $activeKoordinatorList = PenugasanKoordinator::where('status', 'ACTIVE')
            ->select('periode_id', 'mata_kuliah_id', 'dosen_id', 'kelompok_id')
            ->get();

        $activeVerifikatorList = PenugasanVerifikator::where('status', 'ACTIVE')
            ->select('periode_id', 'mata_kuliah_id', 'dosen_id', 'kelompok_id')
            ->get();

        $existingPeriodeIds = KelompokVerifikasi::pluck('periode_id')->toArray();

        return Inertia::render('SuperAdmin/KelompokVerifikasi/Create', [
            'periodeList'           => $periodeList,
            'existingPeriodeIds'    => $existingPeriodeIds,
            'mataKuliahList'        => $mataKuliahList,
            'dosenList'             => $dosenList,
            'activeKoordinatorList' => $activeKoordinatorList,
            'activeVerifikatorList' => $activeVerifikatorList,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate(
            $this->kelompokVerifikasiRules('DRAFT,ACTIVE'),
            $this->kelompokVerifikasiMessages()
        );

        $periode = PeriodeVerifikasi::findOrFail($validated['periode_id']);
        if ($periode->status === 'CLOSED') {
            return back()->withErrors(['periode_id' => 'Periode yang sudah CLOSED tidak dapat digunakan untuk penugasan baru.'])->withInput();
        }

        if (KelompokVerifikasi::where('periode_id', $validated['periode_id'])->exists()) {
            return back()->withErrors(['periode_id' => 'Kelompok Verifikasi untuk periode ini sudah ada. Dalam satu periode aktif hanya dapat dibuat 1 kelompok verifikasi.'])->withInput();
        }

        if ($violation = $this->validateSeparationOfDuties(
            $validated['mata_kuliah'],
            $validated['verifikator'] ?? [],
            $validated['periode_id'],
            null,
            $validated['status']
        )) {
            return $violation;
        }

        try {
            $kelompok = DB::transaction(function () use ($validated, $request) {
                $kelompok = KelompokVerifikasi::create([
                    'id'          => (string) Str::uuid(),
                    'nama'        => $validated['nama'],
                    'periode_id'  => $validated['periode_id'],
                    'status'      => $validated['status'],
                    'keterangan'  => $validated['keterangan'] ?? null,
                    'created_by'  => $request->user()->id,
                ]);

                // Create Kelompok Mata Kuliah, Koordinator mappings, and Verifikator mappings
                foreach ($validated['mata_kuliah'] as $mkItem) {
                    $kList = $mkItem['koordinator_ids'] ?? (isset($mkItem['koordinator_id']) ? [$mkItem['koordinator_id']] : []);
                    $vList = $mkItem['verifikator_ids'] ?? [];

                    KelompokMataKuliah::create([
                        'id'             => (string) Str::uuid(),
                        'kelompok_id'    => $kelompok->id,
                        'mata_kuliah_id' => $mkItem['mata_kuliah_id'],
                        'koordinator_id' => $kList[0] ?? null,
                    ]);

                    // Store per-MK coordinators (up to 3)
                    foreach ($kList as $kDosenId) {
                        KelompokKoordinator::create([
                            'id'             => (string) Str::uuid(),
                            'kelompok_id'    => $kelompok->id,
                            'mata_kuliah_id' => $mkItem['mata_kuliah_id'],
                            'dosen_id'       => $kDosenId,
                        ]);
                    }

                    // Store per-MK verifikators (up to 5)
                    foreach ($vList as $vDosenId) {
                        KelompokVerifikator::create([
                            'id'             => (string) Str::uuid(),
                            'kelompok_id'    => $kelompok->id,
                            'mata_kuliah_id' => $mkItem['mata_kuliah_id'],
                            'dosen_id'       => $vDosenId,
                        ]);
                    }
                }

                // If active, synchronize operational assignments
                if ($kelompok->status === 'ACTIVE') {
                    $this->syncOperationalAssignments($kelompok, $request->user()->id);
                }

                AuditLog::record(
                    $request->user()->id,
                    'CREATE_KELOMPOK_VERIFIKASI',
                    'KelompokVerifikasi',
                    $kelompok->id,
                    null,
                    $kelompok->load(['mataKuliah', 'koordinator', 'verifikator'])->toArray()
                );

                return $kelompok;
            });
        } catch (\Illuminate\Database\QueryException $e) {
            $errorMessage = $e->getMessage();
            if (preg_match('/ERROR:\s*(.*?)(?:\s+CONTEXT:|$)/s', $errorMessage, $matches)) {
                $cleanError = trim($matches[1]);
            } else {
                $cleanError = 'Terjadi kesalahan integritas data saat menyimpan kelompok verifikasi.';
            }

            return back()->withErrors(['mata_kuliah' => $cleanError])->withInput();
        } catch (\Throwable $e) {
            return back()->withErrors(['mata_kuliah' => 'Terjadi kesalahan sistem: ' . $e->getMessage()])->withInput();
        }

        return redirect()->route('superadmin.kelompok-verifikasi.show', $kelompok->id)
            ->with('success', $kelompok->status === 'ACTIVE'
                ? 'Kelompok Verifikasi berhasil dibuat dan diaktifkan.'
                : 'Kelompok Verifikasi berhasil disimpan sebagai Draft.');
    }

    public function show(KelompokVerifikasi $kelompokVerifikasi)
    {
        $kelompokVerifikasi->load([
            'periode.tahunAjaran',
            'mataKuliah.mataKuliah',
            'mataKuliah.koordinator',
            'koordinator.dosen',
            'verifikator.dosen',
            'createdBy',
        ]);

        $periodeId = $kelompokVerifikasi->periode_id;
        $isDraft = $kelompokVerifikasi->isDraft();
        $createdAt = $kelompokVerifikasi->created_at;

        // Progress Calculation per Mata Kuliah
        $mkListStats = $kelompokVerifikasi->mataKuliah->map(function ($kmk) use ($periodeId, $kelompokVerifikasi, $isDraft, $createdAt) {
            $mk = $kmk->mataKuliah;

            // Fetch all coordinators for this course in this group
            $koordinators = KelompokKoordinator::with('dosen')
                ->where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $kmk->mata_kuliah_id)
                ->get()
                ->map(fn($item) => $item->dosen)
                ->filter();

            if ($koordinators->isEmpty() && $kmk->koordinator) {
                $koordinators = collect([$kmk->koordinator]);
            }

            // Fetch all verifikators for this course in this group
            $verifikators = KelompokVerifikator::with('dosen')
                ->where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $kmk->mata_kuliah_id)
                ->get()
                ->map(fn($item) => $item->dosen)
                ->filter();

            if ($isDraft) {
                return [
                    'id'               => $kmk->id,
                    'mata_kuliah_id'   => $kmk->mata_kuliah_id,
                    'kode_mk'          => $mk->kode_mk ?? '-',
                    'nama_mk'          => $mk->nama_mk ?? '-',
                    'sks'              => $mk->sks ?? 0,
                    'semester'         => $mk->semester ?? null,
                    'koordinator'      => $koordinators->first(),
                    'koordinator_list' => $koordinators->values(),
                    'verifikator_list' => $verifikators->values(),
                    'soal_count'       => 0,
                    'draft'            => 0,
                    'submitted'        => 0,
                    'in_review'        => 0,
                    'revision'         => 0,
                    'approved'         => 0,
                    'stats'            => [
                        'total'     => 0,
                        'draft'     => 0,
                        'submitted' => 0,
                        'in_review' => 0,
                        'revision'  => 0,
                        'approved'  => 0,
                    ],
                    'status_progres'   => 'PENDING',
                ];
            }

            // Total Soal for this MK + Periode within this Kelompok's lifecycle
            $soalQuery = Soal::where('mata_kuliah_id', $kmk->mata_kuliah_id)
                ->where('periode_id', $periodeId);

            if ($createdAt) {
                $soalQuery->where('created_at', '>=', $createdAt);
            }

            $counts = (clone $soalQuery)
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft,
                    SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted,
                    SUM(CASE WHEN status IN ('IN_REVIEW', 'RESUBMITTED') THEN 1 ELSE 0 END) as in_review,
                    SUM(CASE WHEN status = 'REVISION' THEN 1 ELSE 0 END) as revision,
                    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved
                ")->first();

            $totalCount = (int) ($counts->total ?? 0);
            $draftCount = (int) ($counts->draft ?? 0);
            $reviewedCount = (int) ($counts->submitted ?? 0)
                + (int) ($counts->in_review ?? 0)
                + (int) ($counts->revision ?? 0)
                + (int) ($counts->approved ?? 0);

            return [
                'id'               => $kmk->id,
                'mata_kuliah_id'   => $kmk->mata_kuliah_id,
                'kode_mk'          => $mk->kode_mk ?? '-',
                'nama_mk'          => $mk->nama_mk ?? '-',
                'sks'              => $mk->sks ?? 0,
                'semester'         => $mk->semester ?? null,
                'koordinator'      => $koordinators->first(),
                'koordinator_list' => $koordinators->values(),
                'verifikator_list' => $verifikators->values(),
                'soal_count'       => $totalCount,
                'draft'            => $draftCount,
                'submitted'        => (int) ($counts->submitted ?? 0),
                'in_review'        => (int) ($counts->in_review ?? 0),
                'revision'         => (int) ($counts->revision ?? 0),
                'approved'         => (int) ($counts->approved ?? 0),
                'stats'            => [
                    'total'     => $totalCount,
                    'draft'     => $draftCount,
                    'submitted' => (int) ($counts->submitted ?? 0),
                    'in_review' => (int) ($counts->in_review ?? 0),
                    'revision'  => (int) ($counts->revision ?? 0),
                    'approved'  => (int) ($counts->approved ?? 0),
                ],
                'status_progres'   => ($counts->approved ?? 0) > 0 ? 'COMPLETE' : ($totalCount > 0 ? 'IN_PROGRESS' : 'PENDING'),
            ];
        });

        // Verifikator Statistics - Grouped by distinct Dosen in this Kelompok
        $verifikatorGrouped = KelompokVerifikator::where('kelompok_id', $kelompokVerifikasi->id)
            ->with(['dosen.user', 'mataKuliah'])
            ->get()
            ->groupBy('dosen_id');

        $verifikatorListStats = $verifikatorGrouped->map(function ($items, $dosenId) use ($periodeId, $isDraft, $createdAt) {
            $first = $items->first();
            $dosen = $first ? $first->dosen : null;
            $mkIds = $items->pluck('mata_kuliah_id')->filter()->unique();
            $mkList = $items->map(fn($it) => $it->mataKuliah ? [
                'id' => $it->mataKuliah->id,
                'kode_mk' => $it->mataKuliah->kode_mk,
                'nama_mk' => $it->mataKuliah->nama_mk,
            ] : null)->filter()->unique('id')->values();

            if ($isDraft) {
                return [
                    'id'              => $dosenId,
                    'dosen_id'        => $dosenId,
                    'kode_dosen'      => $dosen->kode_dosen ?? '-',
                    'nama_lengkap'    => $dosen->nama_lengkap ?? '-',
                    'email'           => $dosen->email ?? '-',
                    'mata_kuliah_list'=> $mkList,
                    'total_soal'      => 0,
                    'menunggu'        => 0,
                    'diverifikasi'    => 0,
                    'revisi'          => 0,
                    'status'          => $dosen->status ?? 'ACTIVE',
                ];
            }

            // Total soal for the courses assigned to this verifikator in this period within kelompok lifecycle
            $soalQuery = Soal::whereIn('mata_kuliah_id', $mkIds)
                ->where('periode_id', $periodeId);

            if ($createdAt) {
                $soalQuery->where('created_at', '>=', $createdAt);
            }

            $totalSoal = (clone $soalQuery)->count();
            $menungguCount = (clone $soalQuery)->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count();

            // Hitung diverifikasi dan revisi berdasarkan tindakan nyata yang dilakukan oleh dosen verifikator ini
            $diverifikasiCount = 0;
            $revisiCount = 0;

            if ($dosen && $dosen->user_id) {
                $diverifikasiQuery = Verifikasi::where('verifikator_id', $dosen->user_id)
                    ->where('action', 'APPROVED')
                    ->whereHas('soal', function ($q) use ($mkIds, $periodeId, $createdAt) {
                        $q->whereIn('mata_kuliah_id', $mkIds)
                          ->where('periode_id', $periodeId);
                        if ($createdAt) {
                            $q->where('created_at', '>=', $createdAt);
                        }
                    });

                if ($createdAt) {
                    $diverifikasiQuery->where('created_at', '>=', $createdAt);
                }

                $diverifikasiCount = $diverifikasiQuery->count();

                $revisiQuery = Verifikasi::where('verifikator_id', $dosen->user_id)
                    ->where('action', 'REVISION')
                    ->whereHas('soal', function ($q) use ($mkIds, $periodeId, $createdAt) {
                        $q->whereIn('mata_kuliah_id', $mkIds)
                          ->where('periode_id', $periodeId);
                        if ($createdAt) {
                            $q->where('created_at', '>=', $createdAt);
                        }
                    });

                if ($createdAt) {
                    $revisiQuery->where('created_at', '>=', $createdAt);
                }

                $revisiCount = $revisiQuery->count();
            }

            return [
                'id'              => $dosenId,
                'dosen_id'        => $dosenId,
                'kode_dosen'      => $dosen->kode_dosen ?? '-',
                'nama_lengkap'    => $dosen->nama_lengkap ?? '-',
                'email'           => $dosen->email ?? '-',
                'mata_kuliah_list'=> $mkList,
                'total_soal'      => $totalSoal,
                'menunggu'        => $menungguCount,
                'diverifikasi'    => $diverifikasiCount,
                'revisi'          => $revisiCount,
                'status'          => $dosen->status ?? 'ACTIVE',
            ];
        })->values();

        // Overall Group Progress
        $totalMk = $mkListStats->count();
        $mkWithSoal = $mkListStats->filter(fn($m) => $m['stats']['total'] > 0)->count();
        $totalSoal = $mkListStats->sum(fn($m) => $m['stats']['total']);
        $inReviewSoal = $mkListStats->sum(fn($m) => $m['stats']['submitted'] + $m['stats']['in_review']);
        $approvedSoal = $mkListStats->sum(fn($m) => $m['stats']['approved']);
        $activeReviewTarget = $approvedSoal + $inReviewSoal;

        $uploadProgress = ($totalMk > 0 && !$isDraft) ? round(($mkWithSoal / $totalMk) * 100) : 0;
        // Progress verifikasi: Approved dibagi total soal yang aktif direview (Approved + In Review / Submitted), mengecualikan Draft
        $verificationProgress = ($activeReviewTarget > 0 && !$isDraft) ? round(($approvedSoal / $activeReviewTarget) * 100) : 0;

        // Recent Audit Logs for this group
        $recentActivities = AuditLog::where('model_type', 'KelompokVerifikasi')
            ->where('model_id', $kelompokVerifikasi->id)
            ->with('user.dosen')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $formattedActivities = AuditLog::formatLogs($recentActivities);

        $dosenAll = Dosen::where('status', 'ACTIVE')->orderBy('kode_dosen')->get();

        return Inertia::render('SuperAdmin/KelompokVerifikasi/Show', [
            'kelompok'              => $kelompokVerifikasi,
            'mkListStats'           => $mkListStats,
            'verifikatorListStats'  => $verifikatorListStats,
            'dosenAll'              => $dosenAll,
            'progress'              => [
                'upload'       => $uploadProgress,
                'verification' => $verificationProgress,
                'totalMk'      => $totalMk,
                'mkWithSoal'   => $mkWithSoal,
                'totalSoal'    => $totalSoal,
                'inReviewSoal' => $inReviewSoal,
                'reviewedSoal' => $activeReviewTarget,
                'approvedSoal' => $approvedSoal,
            ],
            'recentActivities'      => $formattedActivities,
        ]);
    }

    public function edit(KelompokVerifikasi $kelompokVerifikasi)
    {
        if ($kelompokVerifikasi->status === 'CLOSED') {
            return redirect()->route('superadmin.kelompok-verifikasi.show', $kelompokVerifikasi->id)
                ->with('error', 'Kelompok yang sudah CLOSED tidak dapat diubah.');
        }

        $kelompokVerifikasi->load([
            'periode.tahunAjaran',
            'mataKuliah.mataKuliah',
            'mataKuliah.koordinator',
            'koordinator.dosen',
            'verifikator.dosen',
        ]);

        $periodeAll = PeriodeVerifikasi::with('tahunAjaran')
            ->whereIn('status', ['ACTIVE', 'DRAFT'])
            ->orderBy('created_at', 'desc')
            ->get();

        $mkAll = MataKuliah::orderBy('kode_mk')->get();
        $dosenAll = Dosen::where('status', 'ACTIVE')->orderBy('kode_dosen')->get();

        $activeKoordinatorList = PenugasanKoordinator::where('status', 'ACTIVE')
            ->where('kelompok_id', '!=', $kelompokVerifikasi->id)
            ->select('periode_id', 'mata_kuliah_id', 'dosen_id', 'kelompok_id')
            ->get();

        $activeVerifikatorList = PenugasanVerifikator::where('status', 'ACTIVE')
            ->where('kelompok_id', '!=', $kelompokVerifikasi->id)
            ->select('periode_id', 'mata_kuliah_id', 'dosen_id', 'kelompok_id')
            ->get();

        return Inertia::render('SuperAdmin/KelompokVerifikasi/Edit', [
            'kelompok'              => $kelompokVerifikasi,
            'periodeAll'            => $periodeAll,
            'mkAll'                 => $mkAll,
            'dosenAll'              => $dosenAll,
            'activeKoordinatorList' => $activeKoordinatorList,
            'activeVerifikatorList' => $activeVerifikatorList,
        ]);
    }

    public function update(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        if ($kelompokVerifikasi->status === 'CLOSED') {
            return back()->with('error', 'Kelompok yang sudah CLOSED tidak dapat diubah.');
        }

        $validated = $request->validate(
            $this->kelompokVerifikasiRules('DRAFT,ACTIVE,INACTIVE,CLOSED'),
            $this->kelompokVerifikasiMessages()
        );

        if (KelompokVerifikasi::where('periode_id', $validated['periode_id'])
            ->where('id', '!=', $kelompokVerifikasi->id)
            ->exists()) {
            return back()->withErrors([
                'periode_id' => 'Target periode sudah memiliki kelompok verifikasi. Hanya diperbolehkan 1 kelompok verifikasi per periode.'
            ])->withInput();
        }

        if ($violation = $this->validateSeparationOfDuties(
            $validated['mata_kuliah'],
            $validated['verifikator'] ?? [],
            $validated['periode_id'],
            $kelompokVerifikasi->id,
            $validated['status']
        )) {
            return $violation;
        }

        try {
            DB::transaction(function () use ($validated, $request, $kelompokVerifikasi) {
                $oldData = $kelompokVerifikasi->load(['mataKuliah', 'koordinator', 'verifikator'])->toArray();

                $kelompokVerifikasi->update([
                    'nama'       => $validated['nama'],
                    'periode_id' => $validated['periode_id'],
                    'status'     => $validated['status'],
                    'keterangan' => $validated['keterangan'] ?? null,
                ]);

                // Rebuild MK mappings, Koordinator mappings, & Verifikator mappings per MK
                KelompokMataKuliah::where('kelompok_id', $kelompokVerifikasi->id)->delete();
                KelompokKoordinator::where('kelompok_id', $kelompokVerifikasi->id)->delete();
                KelompokVerifikator::where('kelompok_id', $kelompokVerifikasi->id)->delete();

                foreach ($validated['mata_kuliah'] as $mkItem) {
                    $kList = $mkItem['koordinator_ids'] ?? (isset($mkItem['koordinator_id']) ? [$mkItem['koordinator_id']] : []);
                    $vList = $mkItem['verifikator_ids'] ?? [];

                    KelompokMataKuliah::create([
                        'id'             => (string) Str::uuid(),
                        'kelompok_id'    => $kelompokVerifikasi->id,
                        'mata_kuliah_id' => $mkItem['mata_kuliah_id'],
                        'koordinator_id' => $kList[0] ?? null,
                    ]);

                    foreach ($kList as $kDosenId) {
                        KelompokKoordinator::create([
                            'id'             => (string) Str::uuid(),
                            'kelompok_id'    => $kelompokVerifikasi->id,
                            'mata_kuliah_id' => $mkItem['mata_kuliah_id'],
                            'dosen_id'       => $kDosenId,
                        ]);
                    }

                    foreach ($vList as $vDosenId) {
                        KelompokVerifikator::create([
                            'id'             => (string) Str::uuid(),
                            'kelompok_id'    => $kelompokVerifikasi->id,
                            'mata_kuliah_id' => $mkItem['mata_kuliah_id'],
                            'dosen_id'       => $vDosenId,
                        ]);
                    }
                }

                if ($kelompokVerifikasi->status === 'ACTIVE') {
                    $this->syncOperationalAssignments($kelompokVerifikasi, $request->user()->id);
                } else {
                    // Delete active assignments tied to this group (avoids UNIQUE constraint on status)
                    PenugasanKoordinator::where('kelompok_id', $kelompokVerifikasi->id)->delete();
                    PenugasanVerifikator::where('kelompok_id', $kelompokVerifikasi->id)->delete();
                    $this->syncAffectedDosenRoles();
                    $this->syncAffectedMataKuliahStatus();
                }

                AuditLog::record(
                    $request->user()->id,
                    'UPDATE_KELOMPOK_VERIFIKASI',
                    'KelompokVerifikasi',
                    $kelompokVerifikasi->id,
                    $oldData,
                    $kelompokVerifikasi->load(['mataKuliah', 'koordinator', 'verifikator'])->toArray()
                );
            });
        } catch (\Illuminate\Database\QueryException $e) {
            $errorMessage = $e->getMessage();
            if (preg_match('/ERROR:\s*(.*?)(?:\s+CONTEXT:|$)/s', $errorMessage, $matches)) {
                $cleanError = trim($matches[1]);
            } else {
                $cleanError = 'Terjadi kesalahan integritas data saat memperbarui kelompok verifikasi.';
            }

            return back()->withErrors(['mata_kuliah' => $cleanError])->withInput();
        } catch (\Throwable $e) {
            return back()->withErrors(['mata_kuliah' => 'Terjadi kesalahan sistem: ' . $e->getMessage()])->withInput();
        }

        return redirect()->route('superadmin.kelompok-verifikasi.show', $kelompokVerifikasi->id)
            ->with('success', 'Kelompok Verifikasi berhasil diperbarui.');
    }

    public function activate(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        if ($kelompokVerifikasi->status === 'CLOSED') {
            return back()->with('error', 'Kelompok yang sudah CLOSED tidak dapat diaktifkan.');
        }

        // Validate separation of duties and active role conflict before activating
        $periodeId = $kelompokVerifikasi->periode_id;
        $mataKuliahList = KelompokMataKuliah::where('kelompok_id', $kelompokVerifikasi->id)->get();
        foreach ($mataKuliahList as $kmk) {
            $mkId = $kmk->mata_kuliah_id;
            $kList = KelompokKoordinator::where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $mkId)
                ->pluck('dosen_id')
                ->toArray();
            if (empty($kList) && $kmk->koordinator_id) {
                $kList = [$kmk->koordinator_id];
            }
            $vList = KelompokVerifikator::where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $mkId)
                ->pluck('dosen_id')
                ->toArray();

            $mkObj = MataKuliah::find($mkId);
            $mkName = $mkObj ? $mkObj->nama_mk : 'MK';

            // Check self overlap within this kelompok
            $overlap = array_intersect($kList, $vList);
            if (!empty($overlap)) {
                $dosenObj = Dosen::find(reset($overlap));
                $dosenName = $dosenObj ? $dosenObj->nama_lengkap : 'Dosen';
                return back()->with('error', "Dosen {$dosenName} tidak dapat menjadi Koordinator sekaligus Verifikator pada mata kuliah {$mkName}.");
            }

            // Check cross-group conflict with active assignments
            foreach ($vList as $vDosenId) {
                $existingKoor = PenugasanKoordinator::where('dosen_id', $vDosenId)
                    ->where('mata_kuliah_id', $mkId)
                    ->where('periode_id', $periodeId)
                    ->where('status', 'ACTIVE')
                    ->where('kelompok_id', '!=', $kelompokVerifikasi->id)
                    ->first();
                if ($existingKoor) {
                    $dosenObj = Dosen::find($vDosenId);
                    $dosenName = $dosenObj ? $dosenObj->nama_lengkap : 'Dosen';
                    return back()->with('error', "Dosen {$dosenName} sudah menjadi Koordinator aktif untuk mata kuliah {$mkName} pada periode ini. Dosen tidak dapat ditugaskan sebagai Verifikator.");
                }
            }

            foreach ($kList as $kDosenId) {
                $existingVerif = PenugasanVerifikator::where('dosen_id', $kDosenId)
                    ->where('mata_kuliah_id', $mkId)
                    ->where('periode_id', $periodeId)
                    ->where('status', 'ACTIVE')
                    ->where('kelompok_id', '!=', $kelompokVerifikasi->id)
                    ->first();
                if ($existingVerif) {
                    $dosenObj = Dosen::find($kDosenId);
                    $dosenName = $dosenObj ? $dosenObj->nama_lengkap : 'Dosen';
                    return back()->with('error', "Dosen {$dosenName} sudah menjadi Verifikator aktif untuk mata kuliah {$mkName} pada periode ini. Dosen tidak dapat ditugaskan sebagai Koordinator.");
                }
            }
        }

        try {
            DB::transaction(function () use ($kelompokVerifikasi, $request) {
                $kelompokVerifikasi->update(['status' => 'ACTIVE']);
                $this->syncOperationalAssignments($kelompokVerifikasi, $request->user()->id);

                AuditLog::record(
                    $request->user()->id,
                    'ACTIVATE_KELOMPOK_VERIFIKASI',
                    'KelompokVerifikasi',
                    $kelompokVerifikasi->id,
                    ['status' => 'DRAFT'],
                    ['status' => 'ACTIVE']
                );
            });
        } catch (\Illuminate\Database\QueryException $e) {
            $errorMessage = $e->getMessage();
            if (preg_match('/ERROR:\s*(.*?)(?:\s+CONTEXT:|$)/s', $errorMessage, $matches)) {
                $cleanError = trim($matches[1]);
            } else {
                $cleanError = 'Terjadi konflik integritas basis data saat mengaktifkan kelompok verifikasi.';
            }
            return back()->with('error', $cleanError);
        } catch (\Throwable $e) {
            return back()->with('error', 'Terjadi kesalahan sistem: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Kelompok Verifikasi berhasil diaktifkan.');
    }

    public function deactivate(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        if ($kelompokVerifikasi->status === 'CLOSED') {
            return back()->with('error', 'Kelompok yang sudah CLOSED tidak dapat dinonaktifkan.');
        }

        DB::transaction(function () use ($kelompokVerifikasi, $request) {
            $oldStatus = $kelompokVerifikasi->status;
            $kelompokVerifikasi->update(['status' => 'INACTIVE']);

            // Remove active assignments for this group (avoids UNIQUE constraint on status)
            PenugasanKoordinator::where('kelompok_id', $kelompokVerifikasi->id)->delete();
            PenugasanVerifikator::where('kelompok_id', $kelompokVerifikasi->id)->delete();
            $this->syncAffectedDosenRoles();
            $this->syncAffectedMataKuliahStatus();

            AuditLog::record(
                $request->user()->id,
                'DEACTIVATE_KELOMPOK_VERIFIKASI',
                'KelompokVerifikasi',
                $kelompokVerifikasi->id,
                ['status' => $oldStatus],
                ['status' => 'INACTIVE']
            );
        });

        return redirect()->back()->with('success', 'Kelompok Verifikasi dinonaktifkan.');
    }

    public function close(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        DB::transaction(function () use ($kelompokVerifikasi, $request) {
            $oldStatus = $kelompokVerifikasi->status;
            $kelompokVerifikasi->update(['status' => 'CLOSED']);

            // Remove active assignments for this group (avoids UNIQUE constraint on status)
            PenugasanKoordinator::where('kelompok_id', $kelompokVerifikasi->id)->delete();
            PenugasanVerifikator::where('kelompok_id', $kelompokVerifikasi->id)->delete();
            $this->syncAffectedDosenRoles();
            $this->syncAffectedMataKuliahStatus();

            AuditLog::record(
                $request->user()->id,
                'CLOSE_KELOMPOK_VERIFIKASI',
                'KelompokVerifikasi',
                $kelompokVerifikasi->id,
                ['status' => $oldStatus],
                ['status' => 'CLOSED']
            );
        });

        return redirect()->back()->with('success', 'Kelompok Verifikasi resmi ditutup (CLOSED).');
    }

    public function destroy(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        return back()->with('error', 'Kelompok verifikasi tidak dapat dihapus. Anda dapat mengubah data atau susunan penugasan pada kelompok ini.');
    }

    /**
     * Remove a Koordinator assignment from a course in a Kelompok Verifikasi.
     */
    public function removeKoordinator(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        $validated = $request->validate([
            'mata_kuliah_id' => ['required', 'exists:mata_kuliah,id'],
            'dosen_id'       => ['required', 'exists:dosen,id'],
        ]);

        if ($kelompokVerifikasi->status === 'CLOSED') {
            return back()->with('error', 'Kelompok yang sudah CLOSED tidak dapat diubah.');
        }

        DB::transaction(function () use ($kelompokVerifikasi, $validated, $request) {
            $mkId = $validated['mata_kuliah_id'];
            $dosenId = $validated['dosen_id'];

            // Delete pivot entry
            KelompokKoordinator::where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $mkId)
                ->where('dosen_id', $dosenId)
                ->delete();

            // Check remaining coordinators for legacy field update
            self::syncKelompokMataKuliahKoordinator($kelompokVerifikasi->id, $mkId, $dosenId);

            // End operational assignment
            PenugasanKoordinator::where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $mkId)
                ->where('dosen_id', $dosenId)
                ->where('status', 'ACTIVE')
                ->update(['status' => 'ENDED']);

            $this->syncAffectedDosenRoles();

            AuditLog::record(
                $request->user()->id,
                'REMOVE_KOORDINATOR_KELOMPOK',
                'KelompokVerifikasi',
                $kelompokVerifikasi->id,
                ['mata_kuliah_id' => $mkId, 'dosen_id' => $dosenId],
                null
            );
        });

        return redirect()->back()->with('success', 'Penugasan koordinator berhasil dicabut.');
    }

    /**
     * Remove a Verifikator assignment from a course in a Kelompok Verifikasi.
     */
    public function removeVerifikator(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        $validated = $request->validate([
            'mata_kuliah_id' => ['required', 'exists:mata_kuliah,id'],
            'dosen_id'       => ['required', 'exists:dosen,id'],
        ]);

        if ($kelompokVerifikasi->status === 'CLOSED') {
            return back()->with('error', 'Kelompok yang sudah CLOSED tidak dapat diubah.');
        }

        DB::transaction(function () use ($kelompokVerifikasi, $validated, $request) {
            $mkId = $validated['mata_kuliah_id'];
            $dosenId = $validated['dosen_id'];

            // Delete pivot entry
            KelompokVerifikator::where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $mkId)
                ->where('dosen_id', $dosenId)
                ->delete();

            // End operational assignment
            PenugasanVerifikator::where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $mkId)
                ->where('dosen_id', $dosenId)
                ->where('status', 'ACTIVE')
                ->update(['status' => 'ENDED']);

            $this->syncAffectedDosenRoles();

            AuditLog::record(
                $request->user()->id,
                'REMOVE_VERIFIKATOR_KELOMPOK',
                'KelompokVerifikasi',
                $kelompokVerifikasi->id,
                ['mata_kuliah_id' => $mkId, 'dosen_id' => $dosenId],
                null
            );
        });

        return redirect()->back()->with('success', 'Penugasan verifikator berhasil dicabut.');
    }

    /**
     * Synchronize operational assignments (PenugasanKoordinator & PenugasanVerifikator)
     */
    protected function syncOperationalAssignments(KelompokVerifikasi $kelompok, string $assignedByUserId): void
    {
        $periodeId = $kelompok->periode_id;

        // 1. Process Koordinator Assignments per MK
        // Delete existing assignments for this kelompok to avoid UNIQUE constraint conflicts
        PenugasanKoordinator::where('kelompok_id', $kelompok->id)->delete();

        $koordinators = KelompokKoordinator::where('kelompok_id', $kelompok->id)->with('dosen.user', 'mataKuliah')->get();
        if ($koordinators->isEmpty()) {
            // Fallback for legacy kelompok_mata_kuliah.koordinator_id
            $kmks = KelompokMataKuliah::where('kelompok_id', $kelompok->id)->whereNotNull('koordinator_id')->with('koordinator.user', 'mataKuliah')->get();
            foreach ($kmks as $kmk) {
                // Delete any conflicting ACTIVE records from other kelompok for same (dosen, mk, periode)
                PenugasanKoordinator::where('dosen_id', $kmk->koordinator_id)
                    ->where('mata_kuliah_id', $kmk->mata_kuliah_id)
                    ->where('periode_id', $periodeId)
                    ->delete();

                PenugasanKoordinator::create([
                    'id'             => (string) Str::uuid(),
                    'dosen_id'       => $kmk->koordinator_id,
                    'mata_kuliah_id' => $kmk->mata_kuliah_id,
                    'periode_id'     => $periodeId,
                    'assigned_by'    => $assignedByUserId,
                    'kelompok_id'    => $kelompok->id,
                    'status'         => 'ACTIVE',
                ]);
            }
        } else {
            foreach ($koordinators as $k) {
                // Delete any conflicting records from other kelompok for same (dosen, mk, periode)
                PenugasanKoordinator::where('dosen_id', $k->dosen_id)
                    ->where('mata_kuliah_id', $k->mata_kuliah_id)
                    ->where('periode_id', $periodeId)
                    ->delete();

                PenugasanKoordinator::create([
                    'id'             => (string) Str::uuid(),
                    'dosen_id'       => $k->dosen_id,
                    'mata_kuliah_id' => $k->mata_kuliah_id,
                    'periode_id'     => $periodeId,
                    'assigned_by'    => $assignedByUserId,
                    'kelompok_id'    => $kelompok->id,
                    'status'         => 'ACTIVE',
                ]);

                if ($k->dosen && $k->dosen->user_id) {
                    Notification::create([
                        'id'      => (string) Str::uuid(),
                        'user_id' => $k->dosen->user_id,
                        'title'   => 'Penugasan Koordinator Kelompok',
                        'message' => "Anda ditugaskan sebagai Koordinator MK {$k->mataKuliah->nama_mk} dalam {$kelompok->nama}.",
                    ]);
                }
            }
        }

        // 2. Process Verifikator Assignments per MK
        // Delete existing assignments for this kelompok to avoid UNIQUE constraint conflicts
        PenugasanVerifikator::where('kelompok_id', $kelompok->id)->delete();

        $verifikators = KelompokVerifikator::where('kelompok_id', $kelompok->id)->with('dosen.user', 'mataKuliah')->get();
        foreach ($verifikators as $kv) {
            // Delete any conflicting records from other kelompok for same (dosen, mk, periode)
            PenugasanVerifikator::where('dosen_id', $kv->dosen_id)
                ->where('mata_kuliah_id', $kv->mata_kuliah_id)
                ->where('periode_id', $periodeId)
                ->delete();

            PenugasanVerifikator::create([
                'id'             => (string) Str::uuid(),
                'dosen_id'       => $kv->dosen_id,
                'mata_kuliah_id' => $kv->mata_kuliah_id,
                'periode_id'     => $periodeId,
                'assigned_by'    => $assignedByUserId,
                'kelompok_id'    => $kelompok->id,
                'status'         => 'ACTIVE',
            ]);

            if ($kv->dosen && $kv->dosen->user_id) {
                Notification::create([
                    'id'      => (string) Str::uuid(),
                    'user_id' => $kv->dosen->user_id,
                    'title'   => 'Penugasan Verifikator Kelompok',
                    'message' => "Anda ditugaskan sebagai Verifikator MK " . ($kv->mataKuliah->nama_mk ?? 'Kelompok') . " dalam {$kelompok->nama}.",
                ]);
            }
        }

        // Synchronize all dosen user roles
        $this->syncAffectedDosenRoles();

        // Synchronize all mata kuliah status based on active groups
        $this->syncAffectedMataKuliahStatus();
    }

    /**
     * Synchronize koordinator_id on kelompok_mata_kuliah when pivot entries change
     */
    public static function syncKelompokMataKuliahKoordinator(?string $kelompokId = null, ?string $mataKuliahId = null, ?string $revokedDosenId = null): void
    {
        $query = KelompokMataKuliah::query();

        if ($kelompokId) {
            $query->where('kelompok_id', $kelompokId);
        }
        if ($mataKuliahId) {
            $query->where('mata_kuliah_id', $mataKuliahId);
        }
        if ($revokedDosenId) {
            $query->where('koordinator_id', $revokedDosenId);
        }

        $affectedKmks = $query->get();

        foreach ($affectedKmks as $kmk) {
            $remainingKoor = KelompokKoordinator::where('kelompok_id', $kmk->kelompok_id)
                ->where('mata_kuliah_id', $kmk->mata_kuliah_id)
                ->first();

            $kmk->update(['koordinator_id' => $remainingKoor?->dosen_id]);
        }
    }

    /**
     * Recalculate and synchronize roles for all dosen based on active assignments.
     * Delegates to Dosen::syncAllUserRoles() (the single source of truth for
     * role synchronization) so every call site in the app is consistent.
     */
    public static function syncAffectedDosenRoles(): void
    {
        Dosen::syncAllUserRoles();
    }

    /**
     * Recalculate and synchronize status for all Mata Kuliah based on active Kelompok Verifikasi assignments
     */
    public static function syncAffectedMataKuliahStatus(): void
    {
        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();

        if (!$activePeriod) {
            $hasActiveAssignment = PenugasanKoordinator::where('status', 'ACTIVE')->pluck('mata_kuliah_id')->unique()->toArray();
            MataKuliah::whereIn('id', $hasActiveAssignment)->update(['status' => 'ACTIVE']);
            MataKuliah::whereNotIn('id', $hasActiveAssignment)->update(['status' => 'INACTIVE']);
            return;
        }

        // Ambil semua ID mata kuliah dari kelompok verifikasi yang berstatus ACTIVE pada periode aktif
        $activeGroupMkIds = KelompokMataKuliah::whereHas('kelompok', function ($q) use ($activePeriod) {
            $q->where('periode_id', $activePeriod->id)
              ->where('status', 'ACTIVE');
        })->pluck('mata_kuliah_id')->unique()->toArray();

        // Juga sertakan MK yang memiliki penugasan operasional aktif pada periode ini
        $activePenugasanMkIds = PenugasanKoordinator::where('periode_id', $activePeriod->id)
            ->where('status', 'ACTIVE')
            ->pluck('mata_kuliah_id')
            ->unique()
            ->toArray();

        $allActiveMkIds = array_unique(array_merge($activeGroupMkIds, $activePenugasanMkIds));

        // Update status mata kuliah: ACTIVE jika ditugaskan di kelompok verifikasi aktif, INACTIVE jika tidak
        MataKuliah::whereIn('id', $allActiveMkIds)->update(['status' => 'ACTIVE']);
        MataKuliah::whereNotIn('id', $allActiveMkIds)->update(['status' => 'INACTIVE']);
    }

    /**
     * Validation rules shared by store() and update(), parameterized only by
     * the allowed status values (create only allows DRAFT/ACTIVE, while
     * update also allows the later lifecycle states INACTIVE/CLOSED).
     */
    private function kelompokVerifikasiRules(string $statusRule): array
    {
        return [
            'nama'                            => ['required', 'string', 'max:255'],
            'periode_id'                      => ['required', 'exists:periode_verifikasi,id'],
            'keterangan'                      => ['nullable', 'string', 'max:1000'],
            'status'                          => ['required', 'in:' . $statusRule],
            'mata_kuliah'                     => ['required', 'array', 'min:1'],
            'mata_kuliah.*.mata_kuliah_id'    => ['required', 'distinct', 'exists:mata_kuliah,id'],
            'mata_kuliah.*.koordinator_ids'   => ['nullable', 'array', 'min:1', 'max:3'],
            'mata_kuliah.*.koordinator_ids.*' => ['exists:dosen,id'],
            'mata_kuliah.*.koordinator_id'    => ['nullable', 'exists:dosen,id'],
            'mata_kuliah.*.verifikator_ids'   => ['nullable', 'array', 'min:1', 'max:5'],
            'mata_kuliah.*.verifikator_ids.*' => ['exists:dosen,id'],
            'verifikator'                     => ['nullable', 'array', 'max:5'],
            'verifikator.*'                   => ['exists:dosen,id'],
        ];
    }

    private function kelompokVerifikasiMessages(): array
    {
        return [
            'nama.required'                     => 'Nama kelompok wajib diisi.',
            'periode_id.required'               => 'Periode verifikasi wajib dipilih.',
            'mata_kuliah.required'              => 'Pilih minimal satu mata kuliah.',
            'mata_kuliah.min'                   => 'Pilih minimal satu mata kuliah.',
            'mata_kuliah.*.koordinator_ids.max' => 'Jumlah koordinator untuk setiap mata kuliah maksimal 3 dosen.',
            'mata_kuliah.*.koordinator_ids.min' => 'Setiap mata kuliah wajib memiliki minimal 1 dosen koordinator.',
            'mata_kuliah.*.verifikator_ids.max' => 'Jumlah verifikator untuk setiap mata kuliah maksimal 5 dosen.',
            'mata_kuliah.*.verifikator_ids.min' => 'Setiap mata kuliah wajib memiliki minimal 1 dosen verifikator.',
            'verifikator.max'                   => 'Jumlah verifikator maksimal 5 dosen.',
        ];
    }

    /**
     * Validate separation of duties (Dosen cannot be both Koordinator and
     * Verifikator on the SAME mata kuliah), plus the per-MK coordinator /
     * verifikator count limits. Shared by store() and update(). Returns the
     * first validation-failure redirect response, or null if all mata
     * kuliah entries pass.
     */
    private function validateSeparationOfDuties(
        array $mataKuliahItems,
        array $groupVerifikators = [],
        ?string $periodeId = null,
        ?string $currentKelompokId = null,
        ?string $targetStatus = null
    ) {
        // Validasi Verifikator grup (legacy) harus Dosen Tetap
        foreach ($groupVerifikators as $vDosenId) {
            $vDosen = Dosen::find($vDosenId);
            if ($vDosen && !$vDosen->isDosenTetap()) {
                return back()->withErrors([
                    'verifikator' => "Dosen {$vDosen->nama_lengkap} ({$vDosen->kode_dosen}) berstatus Luar Biasa (LB). Verifikator Soal hanya dapat ditentukan dari Dosen Tetap."
                ])->withInput();
            }
        }

        foreach ($mataKuliahItems as $mk) {
            $mkId = $mk['mata_kuliah_id'];
            $mkObj = MataKuliah::find($mkId);
            $mkName = $mkObj ? $mkObj->nama_mk : 'MK';

            $kList = $mk['koordinator_ids'] ?? (isset($mk['koordinator_id']) ? [$mk['koordinator_id']] : []);
            $vList = $mk['verifikator_ids'] ?? [];

            if (empty($kList)) {
                return back()->withErrors(['mata_kuliah' => 'Setiap mata kuliah wajib memiliki minimal 1 koordinator.'])->withInput();
            }

            if (empty($vList)) {
                return back()->withErrors(['mata_kuliah' => "Setiap mata kuliah wajib memiliki minimal 1 verifikator. MK {$mkName} belum memiliki verifikator."])->withInput();
            }

            if (count($kList) > 3) {
                return back()->withErrors(['mata_kuliah' => 'Jumlah koordinator untuk setiap mata kuliah maksimal 3 dosen.'])->withInput();
            }

            if (count($vList) > 5) {
                return back()->withErrors(['mata_kuliah' => 'Jumlah verifikator untuk setiap mata kuliah maksimal 5 dosen.'])->withInput();
            }

            // Check self-verification overlap on the SAME course
            $courseOverlap = array_intersect($kList, $vList);
            if (!empty($courseOverlap)) {
                $dosenObj = Dosen::find(reset($courseOverlap));
                $dosenName = $dosenObj ? $dosenObj->nama_lengkap : 'Dosen';
                return back()->withErrors([
                    'mata_kuliah' => "Dosen {$dosenName} tidak dapat dipilih sebagai Koordinator sekaligus Verifikator pada mata kuliah {$mkName}."
                ])->withInput();
            }

            // Validasi Verifikator Soal hanya boleh Dosen Tetap
            foreach ($vList as $vDosenId) {
                $vDosen = Dosen::find($vDosenId);
                if ($vDosen && !$vDosen->isDosenTetap()) {
                    return back()->withErrors([
                        'mata_kuliah' => "Dosen {$vDosen->nama_lengkap} ({$vDosen->kode_dosen}) berstatus Luar Biasa (LB). Verifikator Soal hanya dapat ditentukan dari Dosen Tetap pada mata kuliah {$mkName}."
                    ])->withInput();
                }
            }

            // Cross-group active assignment checks (mirrors Postgres triggers)
            if ($periodeId) {
                // Check if any verifikator is ALREADY an ACTIVE koordinator for this course in this period
                foreach ($vList as $vDosenId) {
                    $existingKoor = PenugasanKoordinator::where('dosen_id', $vDosenId)
                        ->where('mata_kuliah_id', $mkId)
                        ->where('periode_id', $periodeId)
                        ->where('status', 'ACTIVE')
                        ->when($currentKelompokId, fn($q) => $q->where('kelompok_id', '!=', $currentKelompokId))
                        ->first();

                    if ($existingKoor) {
                        $dosenObj = Dosen::find($vDosenId);
                        $dosenName = $dosenObj ? $dosenObj->nama_lengkap : 'Dosen';
                        return back()->withErrors([
                            'mata_kuliah' => "Dosen {$dosenName} sudah menjadi Koordinator aktif untuk mata kuliah {$mkName} pada periode ini. Dosen tidak dapat ditugaskan sebagai Verifikator untuk mata kuliah yang sama."
                        ])->withInput();
                    }
                }

                // Check if any koordinator is ALREADY an ACTIVE verifikator for this course in this period
                foreach ($kList as $kDosenId) {
                    $existingVerif = PenugasanVerifikator::where('dosen_id', $kDosenId)
                        ->where('mata_kuliah_id', $mkId)
                        ->where('periode_id', $periodeId)
                        ->where('status', 'ACTIVE')
                        ->when($currentKelompokId, fn($q) => $q->where('kelompok_id', '!=', $currentKelompokId))
                        ->first();

                    if ($existingVerif) {
                        $dosenObj = Dosen::find($kDosenId);
                        $dosenName = $dosenObj ? $dosenObj->nama_lengkap : 'Dosen';
                        return back()->withErrors([
                            'mata_kuliah' => "Dosen {$dosenName} sudah menjadi Verifikator aktif untuk mata kuliah {$mkName} pada periode ini. Dosen tidak dapat ditugaskan sebagai Koordinator untuk mata kuliah yang sama."
                        ])->withInput();
                    }
                }
            }
        }

        return null;
    }
}
