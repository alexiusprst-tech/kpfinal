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
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'ilike', "%{$search}%")
                  ->orWhereHas('mataKuliah.mataKuliah', function ($mkQ) use ($search) {
                      $mkQ->where('nama_mk', 'ilike', "%{$search}%")
                          ->orWhere('kode_mk', 'ilike', "%{$search}%");
                  })
                  ->orWhereHas('koordinator.dosen', function ($dQ) use ($search) {
                      $dQ->where('nama_lengkap', 'ilike', "%{$search}%")
                         ->orWhere('kode_dosen', 'ilike', "%{$search}%");
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

        $mataKuliahList = MataKuliah::where('status', 'ACTIVE')
            ->orderBy('kode_mk')
            ->get();

        $dosenList = Dosen::where('status', 'ACTIVE')
            ->orderBy('kode_dosen')
            ->get();

        return Inertia::render('SuperAdmin/KelompokVerifikasi/Create', [
            'periodeList'    => $periodeList,
            'mataKuliahList' => $mataKuliahList,
            'dosenList'      => $dosenList,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'                           => ['required', 'string', 'max:255'],
            'periode_id'                     => ['required', 'exists:periode_verifikasi,id'],
            'keterangan'                     => ['nullable', 'string', 'max:1000'],
            'status'                         => ['required', 'in:DRAFT,ACTIVE'],
            'mata_kuliah'                    => ['required', 'array', 'min:1'],
            'mata_kuliah.*.mata_kuliah_id'   => ['required', 'distinct', 'exists:mata_kuliah,id'],
            'mata_kuliah.*.koordinator_ids'  => ['nullable', 'array', 'min:1', 'max:3'],
            'mata_kuliah.*.koordinator_ids.*'=> ['exists:dosen,id'],
            'mata_kuliah.*.koordinator_id'   => ['nullable', 'exists:dosen,id'],
            'mata_kuliah.*.verifikator_ids'  => ['nullable', 'array', 'min:1', 'max:5'],
            'mata_kuliah.*.verifikator_ids.*'=> ['exists:dosen,id'],
            'verifikator'                    => ['nullable', 'array', 'max:5'],
            'verifikator.*'                  => ['exists:dosen,id'],
        ], [
            'nama.required'                         => 'Nama kelompok wajib diisi.',
            'periode_id.required'                   => 'Periode verifikasi wajib dipilih.',
            'mata_kuliah.required'                  => 'Pilih minimal satu mata kuliah.',
            'mata_kuliah.min'                       => 'Pilih minimal satu mata kuliah.',
            'mata_kuliah.*.koordinator_ids.max'     => 'Jumlah koordinator untuk setiap mata kuliah maksimal 3 dosen.',
            'mata_kuliah.*.koordinator_ids.min'     => 'Setiap mata kuliah wajib memiliki minimal 1 dosen koordinator.',
            'mata_kuliah.*.verifikator_ids.max'     => 'Jumlah verifikator untuk setiap mata kuliah maksimal 5 dosen.',
            'mata_kuliah.*.verifikator_ids.min'     => 'Setiap mata kuliah wajib memiliki minimal 1 dosen verifikator.',
            'verifikator.max'                       => 'Jumlah verifikator maksimal 5 dosen.',
        ]);

        $periode = PeriodeVerifikasi::findOrFail($validated['periode_id']);
        if ($periode->status === 'CLOSED') {
            return back()->withErrors(['periode_id' => 'Periode yang sudah CLOSED tidak dapat digunakan untuk penugasan baru.'])->withInput();
        }

        // Validate separation of duties (Dosen cannot be both Koordinator and Verifikator on the SAME mata kuliah)
        foreach ($validated['mata_kuliah'] as $mk) {
            $kList = $mk['koordinator_ids'] ?? (isset($mk['koordinator_id']) ? [$mk['koordinator_id']] : []);
            $vList = $mk['verifikator_ids'] ?? $validated['verifikator'] ?? [];

            if (empty($kList)) {
                return back()->withErrors(['mata_kuliah' => 'Setiap mata kuliah wajib memiliki minimal 1 koordinator.'])->withInput();
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
                $mkObj = MataKuliah::find($mk['mata_kuliah_id']);
                $dosenName = $dosenObj ? $dosenObj->nama_lengkap : 'Dosen';
                $mkName = $mkObj ? $mkObj->nama_mk : 'MK';
                return back()->withErrors([
                    'mata_kuliah' => "Dosen {$dosenName} tidak dapat dipilih sebagai Koordinator sekaligus Verifikator pada mata kuliah {$mkName}."
                ])->withInput();
            }
        }

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
                $vList = $mkItem['verifikator_ids'] ?? $validated['verifikator'] ?? [];

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

        // Progress Calculation per Mata Kuliah
        $mkListStats = $kelompokVerifikasi->mataKuliah->map(function ($kmk) use ($periodeId, $kelompokVerifikasi) {
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

            // Total Soal for this MK + Periode
            $soalQuery = Soal::where('mata_kuliah_id', $kmk->mata_kuliah_id)
                ->where('periode_id', $periodeId);

            $counts = (clone $soalQuery)
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft,
                    SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted,
                    SUM(CASE WHEN status IN ('IN_REVIEW', 'RESUBMITTED') THEN 1 ELSE 0 END) as in_review,
                    SUM(CASE WHEN status = 'REVISION' THEN 1 ELSE 0 END) as revision,
                    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
                ")->first();

            $totalCount = (int) ($counts->total ?? 0);
            $draftCount = (int) ($counts->draft ?? 0);
            $reviewedCount = (int) ($counts->submitted ?? 0)
                + (int) ($counts->in_review ?? 0)
                + (int) ($counts->revision ?? 0)
                + (int) ($counts->approved ?? 0)
                + (int) ($counts->rejected ?? 0);

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
                'rejected'         => (int) ($counts->rejected ?? 0),
                'stats'            => [
                    'total'     => $totalCount,
                    'draft'     => $draftCount,
                    'submitted' => (int) ($counts->submitted ?? 0),
                    'in_review' => (int) ($counts->in_review ?? 0),
                    'revision'  => (int) ($counts->revision ?? 0),
                    'approved'  => (int) ($counts->approved ?? 0),
                    'rejected'  => (int) ($counts->rejected ?? 0),
                ],
                'status_progres'   => ($counts->approved ?? 0) > 0 ? 'COMPLETE' : ($totalCount > 0 ? 'IN_PROGRESS' : 'PENDING'),
            ];
        });

        // Verifikator Statistics - Grouped by distinct Dosen in this Kelompok
        $verifikatorGrouped = KelompokVerifikator::where('kelompok_id', $kelompokVerifikasi->id)
            ->with(['dosen', 'mataKuliah'])
            ->get()
            ->groupBy('dosen_id');

        $verifikatorListStats = $verifikatorGrouped->map(function ($items, $dosenId) use ($periodeId) {
            $first = $items->first();
            $dosen = $first ? $first->dosen : null;
            $mkIds = $items->pluck('mata_kuliah_id')->filter()->unique();
            $mkList = $items->map(fn($it) => $it->mataKuliah ? [
                'id' => $it->mataKuliah->id,
                'kode_mk' => $it->mataKuliah->kode_mk,
                'nama_mk' => $it->mataKuliah->nama_mk,
            ] : null)->filter()->unique('id')->values();

            // Total soal for the courses assigned to this verifikator in this period
            $soalQuery = Soal::whereIn('mata_kuliah_id', $mkIds)
                ->where('periode_id', $periodeId);

            $counts = (clone $soalQuery)
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ('SUBMITTED', 'IN_REVIEW', 'RESUBMITTED') THEN 1 ELSE 0 END) as menunggu,
                    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as diverifikasi,
                    SUM(CASE WHEN status = 'REVISION' THEN 1 ELSE 0 END) as revisi,
                    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as ditolak
                ")->first();

            return [
                'id'              => $dosenId,
                'dosen_id'        => $dosenId,
                'kode_dosen'      => $dosen->kode_dosen ?? '-',
                'nama_lengkap'    => $dosen->nama_lengkap ?? '-',
                'email'           => $dosen->email ?? '-',
                'mata_kuliah_list'=> $mkList,
                'total_soal'      => (int) ($counts->total ?? 0),
                'menunggu'        => (int) ($counts->menunggu ?? 0),
                'diverifikasi'    => (int) ($counts->diverifikasi ?? 0),
                'revisi'          => (int) ($counts->revisi ?? 0),
                'ditolak'         => (int) ($counts->ditolak ?? 0),
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

        $uploadProgress = $totalMk > 0 ? round(($mkWithSoal / $totalMk) * 100) : 0;
        // Progress verifikasi: Approved dibagi total soal yang aktif direview (Approved + In Review / Submitted), mengecualikan Ditolak dan Draft
        $verificationProgress = $activeReviewTarget > 0 ? round(($approvedSoal / $activeReviewTarget) * 100) : 0;

        // Recent Audit Logs for this group
        $recentActivities = AuditLog::where('model_type', 'KelompokVerifikasi')
            ->where('model_id', $kelompokVerifikasi->id)
            ->with('user.dosen')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $formattedActivities = AuditLog::formatLogs($recentActivities);

        return Inertia::render('SuperAdmin/KelompokVerifikasi/Show', [
            'kelompok'              => $kelompokVerifikasi,
            'mkListStats'           => $mkListStats,
            'verifikatorListStats'  => $verifikatorListStats,
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

        $mkAll = MataKuliah::where('status', 'ACTIVE')->orderBy('kode_mk')->get();
        $dosenAll = Dosen::where('status', 'ACTIVE')->orderBy('kode_dosen')->get();

        return Inertia::render('SuperAdmin/KelompokVerifikasi/Edit', [
            'kelompok'   => $kelompokVerifikasi,
            'periodeAll' => $periodeAll,
            'mkAll'      => $mkAll,
            'dosenAll'   => $dosenAll,
        ]);
    }

    public function update(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        if ($kelompokVerifikasi->status === 'CLOSED') {
            return back()->with('error', 'Kelompok yang sudah CLOSED tidak dapat diubah.');
        }

        $validated = $request->validate([
            'nama'                           => ['required', 'string', 'max:255'],
            'periode_id'                     => ['required', 'exists:periode_verifikasi,id'],
            'keterangan'                     => ['nullable', 'string', 'max:1000'],
            'status'                         => ['required', 'in:DRAFT,ACTIVE,INACTIVE,CLOSED'],
            'mata_kuliah'                    => ['required', 'array', 'min:1'],
            'mata_kuliah.*.mata_kuliah_id'   => ['required', 'distinct', 'exists:mata_kuliah,id'],
            'mata_kuliah.*.koordinator_ids'  => ['nullable', 'array', 'min:1', 'max:3'],
            'mata_kuliah.*.koordinator_ids.*'=> ['exists:dosen,id'],
            'mata_kuliah.*.koordinator_id'   => ['nullable', 'exists:dosen,id'],
            'mata_kuliah.*.verifikator_ids'  => ['nullable', 'array', 'min:1', 'max:5'],
            'mata_kuliah.*.verifikator_ids.*'=> ['exists:dosen,id'],
            'verifikator'                    => ['nullable', 'array', 'max:5'],
            'verifikator.*'                  => ['exists:dosen,id'],
        ], [
            'nama.required'                         => 'Nama kelompok wajib diisi.',
            'periode_id.required'                   => 'Periode verifikasi wajib dipilih.',
            'mata_kuliah.required'                  => 'Pilih minimal satu mata kuliah.',
            'mata_kuliah.min'                       => 'Pilih minimal satu mata kuliah.',
            'mata_kuliah.*.koordinator_ids.max'     => 'Jumlah koordinator untuk setiap mata kuliah maksimal 3 dosen.',
            'mata_kuliah.*.koordinator_ids.min'     => 'Setiap mata kuliah wajib memiliki minimal 1 dosen koordinator.',
            'mata_kuliah.*.verifikator_ids.max'     => 'Jumlah verifikator untuk setiap mata kuliah maksimal 5 dosen.',
            'mata_kuliah.*.verifikator_ids.min'     => 'Setiap mata kuliah wajib memiliki minimal 1 dosen verifikator.',
            'verifikator.max'                       => 'Jumlah verifikator maksimal 5 dosen.',
        ]);

        // Validate separation of duties (Dosen cannot be both Koordinator and Verifikator on the SAME mata kuliah)
        foreach ($validated['mata_kuliah'] as $mk) {
            $kList = $mk['koordinator_ids'] ?? (isset($mk['koordinator_id']) ? [$mk['koordinator_id']] : []);
            $vList = $mk['verifikator_ids'] ?? $validated['verifikator'] ?? [];

            if (empty($kList)) {
                return back()->withErrors(['mata_kuliah' => 'Setiap mata kuliah wajib memiliki minimal 1 koordinator.'])->withInput();
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
                $mkObj = MataKuliah::find($mk['mata_kuliah_id']);
                $dosenName = $dosenObj ? $dosenObj->nama_lengkap : 'Dosen';
                $mkName = $mkObj ? $mkObj->nama_mk : 'MK';
                return back()->withErrors([
                    'mata_kuliah' => "Dosen {$dosenName} tidak dapat dipilih sebagai Koordinator sekaligus Verifikator pada mata kuliah {$mkName}."
                ])->withInput();
            }
        }

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
                $vList = $mkItem['verifikator_ids'] ?? $validated['verifikator'] ?? [];

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
                // End active assignments tied to this group
                PenugasanKoordinator::where('kelompok_id', $kelompokVerifikasi->id)->update(['status' => 'ENDED']);
                PenugasanVerifikator::where('kelompok_id', $kelompokVerifikasi->id)->update(['status' => 'ENDED']);
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

        return redirect()->route('superadmin.kelompok-verifikasi.show', $kelompokVerifikasi->id)
            ->with('success', 'Kelompok Verifikasi berhasil diperbarui.');
    }

    public function activate(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        if ($kelompokVerifikasi->status === 'CLOSED') {
            return back()->with('error', 'Kelompok yang sudah CLOSED tidak dapat diaktifkan.');
        }

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

            // End active assignments for this group
            PenugasanKoordinator::where('kelompok_id', $kelompokVerifikasi->id)->update(['status' => 'ENDED']);
            PenugasanVerifikator::where('kelompok_id', $kelompokVerifikasi->id)->update(['status' => 'ENDED']);
            $this->syncAffectedDosenRoles();
            $this->syncMataKuliahStatus();

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

            // End active assignments for this group
            PenugasanKoordinator::where('kelompok_id', $kelompokVerifikasi->id)->update(['status' => 'ENDED']);
            PenugasanVerifikator::where('kelompok_id', $kelompokVerifikasi->id)->update(['status' => 'ENDED']);
            $this->syncAffectedDosenRoles();
            $this->syncMataKuliahStatus();

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
        if ($kelompokVerifikasi->status === 'ACTIVE') {
            return back()->with('error', 'Kelompok yang sedang AKTIF tidak dapat dihapus langsung. Nonaktifkan terlebih dahulu.');
        }

        DB::transaction(function () use ($kelompokVerifikasi, $request) {
            $oldData = $kelompokVerifikasi->toArray();

            // End any assignments
            PenugasanKoordinator::where('kelompok_id', $kelompokVerifikasi->id)->update(['status' => 'ENDED']);
            PenugasanVerifikator::where('kelompok_id', $kelompokVerifikasi->id)->update(['status' => 'ENDED']);
            $this->syncAffectedDosenRoles();
            $this->syncMataKuliahStatus();

            $kelompokVerifikasi->delete();

            AuditLog::record(
                $request->user()->id,
                'DELETE_KELOMPOK_VERIFIKASI',
                'KelompokVerifikasi',
                $oldData['id'],
                $oldData,
                null
            );
        });

        return redirect()->route('superadmin.kelompok-verifikasi.index')
            ->with('success', 'Kelompok Verifikasi berhasil dihapus.');
    }

    /**
     * Synchronize operational assignments (PenugasanKoordinator & PenugasanVerifikator)
     */
    protected function syncOperationalAssignments(KelompokVerifikasi $kelompok, string $assignedByUserId): void
    {
        $periodeId = $kelompok->periode_id;

        // 1. Process Koordinator Assignments per MK
        PenugasanKoordinator::where('kelompok_id', $kelompok->id)->update(['status' => 'ENDED']);

        $koordinators = KelompokKoordinator::where('kelompok_id', $kelompok->id)->with('dosen.user', 'mataKuliah')->get();
        if ($koordinators->isEmpty()) {
            // Fallback for legacy kelompok_mata_kuliah.koordinator_id
            $kmks = KelompokMataKuliah::where('kelompok_id', $kelompok->id)->whereNotNull('koordinator_id')->with('koordinator.user', 'mataKuliah')->get();
            foreach ($kmks as $kmk) {
                PenugasanKoordinator::where('dosen_id', $kmk->koordinator_id)
                    ->where('mata_kuliah_id', $kmk->mata_kuliah_id)
                    ->where('periode_id', $periodeId)
                    ->where('status', 'ACTIVE')
                    ->update(['status' => 'ENDED']);

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
                PenugasanKoordinator::where('dosen_id', $k->dosen_id)
                    ->where('mata_kuliah_id', $k->mata_kuliah_id)
                    ->where('periode_id', $periodeId)
                    ->where('status', 'ACTIVE')
                    ->update(['status' => 'ENDED']);

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
        PenugasanVerifikator::where('kelompok_id', $kelompok->id)->update(['status' => 'ENDED']);

        $verifikators = KelompokVerifikator::where('kelompok_id', $kelompok->id)->with('dosen.user', 'mataKuliah')->get();
        foreach ($verifikators as $kv) {
            PenugasanVerifikator::where('dosen_id', $kv->dosen_id)
                ->where('mata_kuliah_id', $kv->mata_kuliah_id)
                ->where('periode_id', $periodeId)
                ->where('status', 'ACTIVE')
                ->update(['status' => 'ENDED']);

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

        // Synchronize all mata kuliah statuses based on active assignments
        $this->syncMataKuliahStatus();
    }

    /**
     * Recalculate and synchronize status for all MataKuliah based on active assignments in active period
     */
    protected function syncMataKuliahStatus(): void
    {
        $activePeriode = PeriodeVerifikasi::where('status', 'ACTIVE')->first();
        if ($activePeriode) {
            $assignedMkIds = PenugasanKoordinator::where('periode_id', $activePeriode->id)
                ->where('status', 'ACTIVE')
                ->pluck('mata_kuliah_id')
                ->unique()
                ->toArray();

            MataKuliah::whereIn('id', $assignedMkIds)->update(['status' => 'ACTIVE']);
            MataKuliah::whereNotIn('id', $assignedMkIds)->update(['status' => 'INACTIVE']);
        }
    }

    /**
     * Recalculate and synchronize roles for all dosen based on active assignments
     */
    protected function syncAffectedDosenRoles(): void
    {
        $dosens = Dosen::with('user')->get();
        foreach ($dosens as $dosen) {
            if (!$dosen->user || $dosen->user->role === 'SUPER_ADMIN') {
                continue;
            }

            $hasActiveKoor = PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
            $hasActiveVerif = PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();

            if ($hasActiveKoor) {
                if ($dosen->user->role !== 'KOORDINATOR') {
                    $dosen->user->update(['role' => 'KOORDINATOR']);
                }
            } elseif ($hasActiveVerif) {
                if ($dosen->user->role !== 'VERIFIKATOR') {
                    $dosen->user->update(['role' => 'VERIFIKATOR']);
                }
            } else {
                if ($dosen->user->role !== null) {
                    $dosen->user->update(['role' => null]);
                }
            }
        }
    }
}
