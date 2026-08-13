<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Clo;
use App\Models\Dosen;
use App\Models\MataKuliah;
use App\Models\PeriodeVerifikasi;
use App\Models\Plo;
use App\Models\Soal;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();

        // 6 Top Stats
        $totalDosen     = Dosen::where('status', 'ACTIVE')->count();
        $totalMataKuliah= MataKuliah::where('status', 'ACTIVE')->count();
        $totalPlo       = Plo::count();
        $totalClo       = Clo::count();
        $totalBankSoal  = Soal::count();

        $totalSoalPeriod = $activePeriod ? Soal::where('periode_id', $activePeriod->id)->count() : 0;
        $approvedPeriod  = $activePeriod ? Soal::where('periode_id', $activePeriod->id)->where('status', 'APPROVED')->count() : 0;
        $progressPct     = $totalSoalPeriod > 0 ? round(($approvedPeriod / $totalSoalPeriod) * 100) : 0;

        // 4 Status Cards
        $statusCounts = [
            'SUBMITTED' => Soal::where('status', 'SUBMITTED')->orWhere('status', 'IN_REVIEW')->count(),
            'REVISION'  => Soal::where('status', 'REVISION')->count(),
            'APPROVED'  => Soal::where('status', 'APPROVED')->count(),
            'REJECTED'  => Soal::where('status', 'REJECTED')->count(),
        ];

        // Recent Audit Logs / Activities
        $recentActivities = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get();

        // High priority items (e.g. pending questions waiting for review > 3 days)
        $urgentSoal = Soal::with(['mataKuliah', 'periode', 'kategori'])
            ->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])
            ->orderBy('created_at', 'asc')
            ->take(5)
            ->get();

        return \Inertia\Inertia::render('SuperAdmin/Dashboard', [
            'activePeriod'     => $activePeriod,
            'totalDosen'       => $totalDosen,
            'totalMataKuliah'  => $totalMataKuliah,
            'totalPlo'         => $totalPlo,
            'totalClo'         => $totalClo,
            'totalBankSoal'    => $totalBankSoal,
            'progressPct'      => $progressPct,
            'statusCounts'     => $statusCounts,
            'recentActivities' => $recentActivities,
            'urgentSoal'       => $urgentSoal,
        ]);
    }
}
