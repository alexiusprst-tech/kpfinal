<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
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

        $assignments = $dosen
            ? PenugasanVerifikator::with('mataKuliah')
                ->where('dosen_id', $dosen->id)
                ->where('status', 'ACTIVE')
                ->get()
            : collect();

        $assignedMkIds = $assignments->pluck('mata_kuliah_id');

        $soalList = Soal::with(['mataKuliah', 'uploadedBy', 'kategori', 'latestVerifikasi'])
            ->whereIn('mata_kuliah_id', $assignedMkIds)
            ->orderBy('updated_at', 'desc')
            ->get();

        $totalCount    = $soalList->count();
        $pendingCount  = $soalList->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count();
        $approvedCount = $soalList->where('status', 'APPROVED')->count();
        $revisionCount = $soalList->where('status', 'REVISION')->count();
        $rejectedCount = $soalList->where('status', 'REJECTED')->count();
        $verifiedCount = $approvedCount + $revisionCount + $rejectedCount;

        $completionRate = $totalCount > 0 ? round(($verifiedCount / $totalCount) * 100) : 0;

        $stats = [
            'total'          => $totalCount,
            'pending'        => $pendingCount,
            'approved'       => $approvedCount,
            'revision'       => $revisionCount,
            'rejected'       => $rejectedCount,
            'verified'       => $verifiedCount,
            'completionRate' => $completionRate,
        ];

        // Rincian statistik per MK yang diawasi
        $assignmentsWithStats = $assignments->map(function ($a) use ($soalList) {
            $mkSoal = $soalList->where('mata_kuliah_id', $a->mata_kuliah_id);
            return [
                'id'          => $a->id,
                'mata_kuliah' => $a->mataKuliah,
                'total'       => $mkSoal->count(),
                'pending'     => $mkSoal->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count(),
                'approved'    => $mkSoal->where('status', 'APPROVED')->count(),
                'revision'    => $mkSoal->where('status', 'REVISION')->count(),
                'rejected'    => $mkSoal->where('status', 'REJECTED')->count(),
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

        return Inertia::render('Verifikator/Dashboard', [
            'activePeriod'         => $activePeriod,
            'stats'                => $stats,
            'pendingSoal'          => $pendingSoal,
            'assignments'          => $assignmentsWithStats,
            'recentVerifikasis'    => $recentVerifikasis,
        ]);
    }
}

