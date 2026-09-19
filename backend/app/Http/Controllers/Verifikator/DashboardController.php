<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use App\Models\Verifikasi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();

        $assignments = ($dosen && $activePeriod)
            ? PenugasanVerifikator::with('mataKuliah')
                ->where('dosen_id', $dosen->id)
                ->where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->get()
            : ($dosen
                ? PenugasanVerifikator::with('mataKuliah')
                    ->where('dosen_id', $dosen->id)
                    ->where('status', 'ACTIVE')
                    ->get()
                : collect());

        $assignedMkIds = $assignments->pluck('mata_kuliah_id');

        $soalList = Soal::with(['mataKuliah', 'uploadedBy', 'kategori', 'latestVerifikasi', 'revisi' => fn ($q) => $q->with('uploadedBy')])
            ->whereIn('mata_kuliah_id', $assignedMkIds)
            ->when($activePeriod, fn ($q) => $q->where('periode_id', $activePeriod->id))
            ->orderBy('updated_at', 'desc')
            ->get();

        $totalCount    = $soalList->count();
        $pendingCount  = $soalList->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count();
        $approvedCount = $soalList->where('status', 'APPROVED')->count();
        $revisionCount = $soalList->where('status', 'REVISION')->count();
        $verifiedCount = $approvedCount + $revisionCount;

        $completionRate = $totalCount > 0 ? round(($verifiedCount / $totalCount) * 100) : 0;

        $stats = [
            'total'          => $totalCount,
            'pending'        => $pendingCount,
            'approved'       => $approvedCount,
            'revision'       => $revisionCount,
            'verified'       => $verifiedCount,
            'completionRate' => $completionRate,
        ];

        // Rincian statistik per MK yang diawasi
        $assignmentsWithStats = $assignments->map(function ($a) use ($soalList) {
            $mkSoal = $soalList->where('mata_kuliah_id', $a->mata_kuliah_id);
            return [
                'id'             => $a->id,
                'mata_kuliah_id' => $a->mata_kuliah_id,
                'mata_kuliah'    => $a->mataKuliah,
                'total'       => $mkSoal->count(),
                'pending'     => $mkSoal->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count(),
                'approved'    => $mkSoal->where('status', 'APPROVED')->count(),
                'revision'    => $mkSoal->where('status', 'REVISION')->count(),
            ];
        });

        // Soal menunggu verifikasi dengan prioritas RESUBMITTED & SUBMITTED
        $pendingSoal = $soalList
            ->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])
            ->sortByDesc(function ($soal) {
                return $soal->status === 'RESUBMITTED' ? 2 : 1;
            })
            ->take(6)
            ->values();

        // Riwayat verifikasi terbaru yang diputus oleh verifikator ini
        $recentVerifikasis = Verifikasi::with(['soal.mataKuliah', 'soal.uploadedBy'])
            ->where('verifikator_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $hasActiveKoor = $dosen && PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
        $hasActiveVerif = $dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
        $noAssignmentMessage = ($dosen && !$hasActiveKoor && !$hasActiveVerif)
            ? 'Akun Anda belum diberikan penugasan aktif (Koordinator/Verifikator). Silakan hubungi Super Admin.'
            : null;

        return Inertia::render('Verifikator/Dashboard', [
            'activePeriod'        => $activePeriod,
            'stats'               => $stats,
            'pendingSoal'         => $pendingSoal,
            'assignments'         => $assignmentsWithStats,
            'recentVerifikasis'   => $recentVerifikasis,
            'activity'            => $this->buildActivity($user->id),
            'noAssignmentMessage' => $noAssignmentMessage,
        ]);
    }

    private function buildActivity(string|int $userId): array
    {
        $raw = AuditLog::with(['user.dosen'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->take(8)
            ->get();

        return AuditLog::formatLogs($raw)->all();
    }
}

