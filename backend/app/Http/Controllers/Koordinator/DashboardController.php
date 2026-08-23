<?php

namespace App\Http\Controllers\Koordinator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private const PENDING_STATUSES = ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'];
    private const STALE_DAYS = 3;
    private const DEADLINE_WARNING_DAYS = 7;

    private static array $activityLabels = [
        'UPLOAD_SOAL'         => 'mengunggah soal baru',
        'SUBMIT_SOAL'         => 'men-submit soal untuk verifikasi',
        'UPLOAD_REVISI'       => 'mengunggah revisi soal',
        'DELETE_SOAL'         => 'menghapus soal',
        'VERIFIKASI_APPROVED' => 'menyetujui soal',
        'VERIFIKASI_REVISION' => 'meminta revisi atas soal',
        'VERIFIKASI_REJECTED' => 'menolak soal',
    ];

    public function index(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();

        $assignments = ($dosen && $activePeriod)
            ? PenugasanKoordinator::with(['mataKuliah.clo.plo', 'mataKuliah.plo', 'mataKuliah.clo'])
                ->where('dosen_id', $dosen->id)
                ->where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->get()
            : collect();

        $mkIds = $assignments->pluck('mata_kuliah_id');

        $soalList = Soal::with(['mataKuliah', 'uploadedBy', 'latestVerifikasi.verifikator'])
            ->whereIn('mata_kuliah_id', $mkIds)
            ->when($activePeriod, fn ($q) => $q->where('periode_id', $activePeriod->id))
            ->orderByDesc('updated_at')
            ->get();

        $verifikatorAssignments = ($mkIds->isNotEmpty() && $activePeriod)
            ? PenugasanVerifikator::with('dosen', 'mataKuliah')
                ->whereIn('mata_kuliah_id', $mkIds)
                ->where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->get()
            : collect();

        return Inertia::render('Koordinator/Dashboard', [
            'activePeriod'   => $activePeriod,
            'deadline'       => $this->buildDeadlineInfo($activePeriod),
            'stats'          => $this->buildStats($assignments, $soalList),
            'mataKuliahList' => $this->buildMataKuliahList($assignments, $soalList),
            'attention'      => $this->buildAttentionList($soalList),
            'verifikators'   => $this->buildVerifikatorList($verifikatorAssignments, $soalList),
            'cloPloOverview' => $this->buildCloPloOverview($assignments),
            'activity'       => $this->buildActivity($soalList->pluck('id')),
        ]);
    }

    private function buildStats(Collection $assignments, Collection $soalList): array
    {
        $mkWithSoal = $soalList->pluck('mata_kuliah_id')->unique();
        $belumUploadCount = $assignments->filter(fn ($a) => !$mkWithSoal->contains($a->mata_kuliah_id))->count();

        $inReviewCount = $soalList->whereIn('status', [
            Soal::STATUS_DRAFT,
            Soal::STATUS_SUBMITTED,
            Soal::STATUS_IN_REVIEW,
            Soal::STATUS_RESUBMITTED,
        ])->count();

        return [
            'total_mk'     => $assignments->count(),
            'total_soal'   => $soalList->count(),
            'belum_upload' => $belumUploadCount,
            'in_review'    => $inReviewCount,
            'revisi'       => $soalList->where('status', Soal::STATUS_REVISION)->count(),
            'approved'     => $soalList->where('status', Soal::STATUS_APPROVED)->count(),
            'rejected'     => $soalList->where('status', Soal::STATUS_REJECTED)->count(),
        ];
    }

    private function buildMataKuliahList(Collection $assignments, Collection $soalList): array
    {
        return $assignments->map(function ($a) use ($soalList) {
            $mkSoal = $soalList->where('mata_kuliah_id', $a->mata_kuliah_id);
            $total  = $mkSoal->count();

            $latestSoal = $mkSoal->sortByDesc('updated_at')->first();
            $status = 'BELUM_UPLOAD';
            if ($latestSoal) {
                if (in_array($latestSoal->status, [Soal::STATUS_DRAFT, Soal::STATUS_SUBMITTED, Soal::STATUS_IN_REVIEW, Soal::STATUS_RESUBMITTED])) {
                    $status = 'IN_REVIEW';
                } else {
                    $status = $latestSoal->status;
                }
            }

            return [
                'id'         => $a->mata_kuliah_id,
                'kode_mk'    => $a->mataKuliah?->kode_mk,
                'nama_mk'    => $a->mataKuliah?->nama_mk,
                'semester'   => $a->mataKuliah?->semester,
                'sks'        => $a->mataKuliah?->sks,
                'total_soal' => $total,
                'status'     => $status,
                'approved'   => $mkSoal->where('status', Soal::STATUS_APPROVED)->count(),
                'revision'   => $mkSoal->where('status', Soal::STATUS_REVISION)->count(),
                'in_review'  => $mkSoal->whereIn('status', [Soal::STATUS_DRAFT, Soal::STATUS_SUBMITTED, Soal::STATUS_IN_REVIEW, Soal::STATUS_RESUBMITTED])->count(),
                'rejected'   => $mkSoal->where('status', Soal::STATUS_REJECTED)->count(),
                'plo'        => $a->mataKuliah?->plo ? $a->mataKuliah->plo->map(fn ($p) => [
                    'id' => $p->id,
                    'kode_plo' => $p->kode_plo,
                    'deskripsi' => $p->deskripsi,
                ])->values()->all() : [],
                'clo'        => $a->mataKuliah?->clo ? $a->mataKuliah->clo->map(fn ($c) => [
                    'id' => $c->id,
                    'kode_clo' => $c->kode_clo,
                    'deskripsi' => $c->deskripsi,
                ])->values()->all() : [],
            ];
        })->values()->all();
    }

    private function buildAttentionList(Collection $soalList): array
    {
        $staleThreshold = now()->subDays(self::STALE_DAYS);

        return $soalList
            ->filter(function ($soal) use ($staleThreshold) {
                if (in_array($soal->status, [Soal::STATUS_REVISION, Soal::STATUS_REJECTED])) {
                    return true;
                }
                if (in_array($soal->status, self::PENDING_STATUSES) && $soal->updated_at->lt($staleThreshold)) {
                    return true;
                }
                return false;
            })
            ->sortBy(function ($soal) {
                $priority = match ($soal->status) {
                    Soal::STATUS_REJECTED => 0,
                    Soal::STATUS_REVISION => 1,
                    default => 2,
                };
                return [$priority, $soal->updated_at->timestamp];
            })
            ->take(10)
            ->values()
            ->map(fn ($soal) => [
                'id'           => $soal->id,
                'kode_soal'    => 'SOAL-' . strtoupper(substr($soal->id, 0, 8)),
                'judul'        => $soal->judul,
                'mata_kuliah'  => $soal->mataKuliah?->nama_mk,
                'mata_kuliah_id' => $soal->mata_kuliah_id,
                'dosen'        => $soal->uploadedBy?->name,
                'status'       => $soal->status,
                'verifikator'  => $soal->latestVerifikasi?->verifikator?->name,
                'updated_at'   => $soal->updated_at,
            ])
            ->all();
    }

    private function buildVerifikatorList(Collection $verifikatorAssignments, Collection $soalList): array
    {
        return $verifikatorAssignments->map(function ($va) use ($soalList) {
            $mkSoal = $soalList->where('mata_kuliah_id', $va->mata_kuliah_id);

            return [
                'id'          => $va->id,
                'nama'        => $va->dosen?->nama_lengkap,
                'kode_dosen'  => $va->dosen?->kode_dosen,
                'mata_kuliah' => $va->mataKuliah?->nama_mk,
                'total_soal'  => $mkSoal->count(),
                'pending'     => $mkSoal->whereIn('status', self::PENDING_STATUSES)->count(),
                'approved'    => $mkSoal->where('status', Soal::STATUS_APPROVED)->count(),
                'status'      => $va->status,
            ];
        })->values()->all();
    }

    private function buildCloPloOverview(Collection $assignments): array
    {
        return $assignments->map(function ($a) {
            $mk = $a->mataKuliah;

            return [
                'mata_kuliah_id' => $a->mata_kuliah_id,
                'kode_mk'        => $mk?->kode_mk,
                'nama_mk'        => $mk?->nama_mk,
                'clo'            => $mk?->clo->map(fn ($clo) => [
                    'id'        => $clo->id,
                    'kode_clo'  => $clo->kode_clo,
                    'deskripsi' => $clo->deskripsi,
                    'plo'       => $clo->plo->map(fn ($plo) => [
                        'id'       => $plo->id,
                        'kode_plo' => $plo->kode_plo,
                    ])->values(),
                ])->values() ?? [],
            ];
        })->values()->all();
    }

    private function buildActivity(Collection $soalIds): array
    {
        if ($soalIds->isEmpty()) {
            return [];
        }

        return AuditLog::with('user')
            ->where('model_type', 'Soal')
            ->whereIn('model_id', $soalIds)
            ->orderByDesc('created_at')
            ->take(8)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'description' => ($log->user?->name ?? 'Sistem') . ' ' . (self::$activityLabels[$log->action] ?? strtolower(str_replace('_', ' ', $log->action))),
                'created_at'  => $log->created_at,
            ])
            ->all();
    }

    private function buildDeadlineInfo(?PeriodeVerifikasi $activePeriod): ?array
    {
        if (!$activePeriod || !$activePeriod->deadline_upload) {
            return null;
        }

        $deadline  = $activePeriod->deadline_upload;
        $now       = now();
        $sisaHari  = (int) $now->diffInDays($deadline, false);
        $isPast    = $now->gt($deadline);
        $isWarning = !$isPast && $sisaHari <= self::DEADLINE_WARNING_DAYS;

        return [
            'deadline'   => $deadline,
            'sisa_hari'  => $isPast ? 0 : max($sisaHari, 0),
            'is_past'    => $isPast,
            'is_warning' => $isWarning,
        ];
    }
}
