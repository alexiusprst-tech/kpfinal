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
        $totalBankSoal  = Soal::where('status', 'APPROVED')->count();

        $totalSoalPeriod = $activePeriod ? Soal::where('periode_id', $activePeriod->id)->count() : 0;
        $approvedPeriod  = $activePeriod ? Soal::where('periode_id', $activePeriod->id)->where('status', 'APPROVED')->count() : 0;
        $progressPct     = $totalSoalPeriod > 0 ? round(($approvedPeriod / $totalSoalPeriod) * 100) : 0;

        // 4 Status Cards
        $statusCounts = [
            'SUBMITTED' => Soal::whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count(),
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

        // Get last 7 days metrics via bulk aggregation (2 queries instead of 21)
        $startDate = now()->subDays(6)->startOfDay();

        $menungguAgg = Soal::whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])
            ->where('updated_at', '>=', $startDate)
            ->selectRaw("DATE(updated_at) as log_date, count(*) as total")
            ->groupBy('log_date')
            ->pluck('total', 'log_date');

        $verifAgg = \App\Models\Verifikasi::where('created_at', '>=', $startDate)
            ->whereIn('action', ['APPROVED', 'REJECTED'])
            ->selectRaw("DATE(created_at) as log_date, action, count(*) as total")
            ->groupBy('log_date', 'action')
            ->get()
            ->groupBy('log_date');

        $dates = [];
        $menungguData = [];
        $disetujuiData = [];
        $ditolakData = [];

        for ($i = 6; $i >= 0; $i--) {
            $dt = now()->subDays($i);
            $dateStr = $dt->format('Y-m-d');
            $label = $dt->format('d M');
            $label = str_replace(
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                $label
            );

            $dates[] = $label;

            $menungguCount = (int) ($menungguAgg[$dateStr] ?? 0);
            
            $dayVerif = $verifAgg->get($dateStr, collect());
            $disetujuiCount = (int) ($dayVerif->where('action', 'APPROVED')->first()->total ?? 0);
            $ditolakCount   = (int) ($dayVerif->where('action', 'REJECTED')->first()->total ?? 0);

            $menungguData[] = $menungguCount;
            $disetujuiData[] = $disetujuiCount;
            $ditolakData[] = $ditolakCount;
        }

        // No fallback, show actual real database values

        $allPeriods = PeriodeVerifikasi::with('tahunAjaran')
            ->orderBy('created_at', 'desc')
            ->get();

        return \Inertia\Inertia::render('SuperAdmin/Dashboard', [
            'activePeriod'     => $activePeriod,
            'allPeriods'       => $allPeriods,
            'totalDosen'       => $totalDosen,
            'totalMataKuliah'  => $totalMataKuliah,
            'totalPlo'         => $totalPlo,
            'totalClo'         => $totalClo,
            'totalBankSoal'    => $totalBankSoal,
            'progressPct'      => $progressPct,
            'statusCounts'     => $statusCounts,
            'recentActivities' => $recentActivities,
            'urgentSoal'       => $urgentSoal,
            'trendData'        => [
                'labels'    => $dates,
                'menunggu'  => $menungguData,
                'disetujui' => $disetujuiData,
                'ditolak'   => $ditolakData,
            ],
        ]);
    }

    /**
     * Export Laporan Verifikasi Soal (PDF / Excel / CSV)
     */
    public function exportLaporan(Request $request)
    {
        $periodeId    = $request->get('periode_id');
        $jenisLaporan = $request->get('jenis_laporan', 'rekap');
        $format       = strtolower($request->get('format', 'pdf'));

        $periode = null;
        if ($periodeId && $periodeId !== 'ALL') {
            $periode = PeriodeVerifikasi::with('tahunAjaran')->find($periodeId);
        }

        // Query Soal
        $soalQuery = Soal::with(['mataKuliah', 'periode', 'kategori', 'uploadedBy.dosen']);
        if ($periode) {
            $soalQuery->where('periode_id', $periode->id);
        }
        $soalList = $soalQuery->orderBy('created_at', 'desc')->get();

        $totalSoal     = $soalList->count();
        $totalApproved = $soalList->where('status', 'APPROVED')->count();
        $totalRevision = $soalList->where('status', 'REVISION')->count();
        $totalRejected = $soalList->where('status', 'REJECTED')->count();
        $totalPending  = $soalList->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED', 'DRAFT'])->count();
        $progressPct   = $totalSoal > 0 ? round(($totalApproved / $totalSoal) * 100) : 0;

        $totalDosen      = Dosen::where('status', 'ACTIVE')->count();
        $totalMataKuliah = MataKuliah::where('status', 'ACTIVE')->count();
        $totalPlo        = Plo::count();
        $totalClo        = Clo::count();

        $namaPeriode = $periode ? $periode->nama . ' (' . ($periode->tahunAjaran->nama ?? '-') . ')' : 'Semua Periode';
        $tanggalCetak = now()->locale('id')->isoFormat('D MMMM Y');

        if ($format === 'excel' || $format === 'csv') {
            $filename = 'Laporan-Verifikasi-' . \Illuminate\Support\Str::slug($namaPeriode . '-' . $jenisLaporan) . '-' . date('Ymd_His') . '.csv';

            $headers = [
                'Content-Type'        => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"$filename\"",
                'Pragma'              => 'no-cache',
                'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
                'Expires'             => '0',
            ];

            $callback = function () use ($soalList, $namaPeriode, $jenisLaporan, $totalSoal, $totalApproved, $totalPending, $totalRevision, $totalRejected) {
                $handle = fopen('php://output', 'w');
                // UTF-8 BOM for Excel
                fputs($handle, "\xEF\xBB\xBF");

                if ($jenisLaporan === 'rekap') {
                    fputcsv($handle, ['LAPORAN REKAPITULASI VERIFIKASI SOAL']);
                    fputcsv($handle, ['Periode', $namaPeriode]);
                    fputcsv($handle, ['Tanggal Unduh', date('d/m/Y H:i')]);
                    fputcsv($handle, []);
                    fputcsv($handle, ['Metrik', 'Jumlah']);
                    fputcsv($handle, ['Total Soal', $totalSoal]);
                    fputcsv($handle, ['Disetujui (Approved)', $totalApproved]);
                    fputcsv($handle, ['Menunggu Verifikasi (Pending)', $totalPending]);
                    fputcsv($handle, ['Perlu Revisi (Revision)', $totalRevision]);
                    fputcsv($handle, ['Ditolak (Rejected)', $totalRejected]);
                    fputcsv($handle, []);
                }

                fputcsv($handle, [
                    'No',
                    'Kode MK',
                    'Mata Kuliah',
                    'Kategori Soal',
                    'Dosen Pembuat',
                    'Status',
                    'Tanggal Submit',
                    'Tanggal Diperbarui'
                ]);

                $no = 1;
                foreach ($soalList as $s) {
                    fputcsv($handle, [
                        $no++,
                        $s->mataKuliah->kode_mk ?? '-',
                        $s->mataKuliah->nama_mk ?? '-',
                        $s->kategori->nama ?? '-',
                        $s->uploadedBy->dosen->nama_lengkap ?? $s->uploadedBy->name ?? '-',
                        $s->status,
                        $s->created_at ? $s->created_at->format('d/m/Y H:i') : '-',
                        $s->updated_at ? $s->updated_at->format('d/m/Y H:i') : '-',
                    ]);
                }

                fclose($handle);
            };

            return response()->stream($callback, 200, $headers);
        }

        // PDF Generation
        $data = [
            'namaPeriode'     => $namaPeriode,
            'periode'         => $periode,
            'jenisLaporan'    => $jenisLaporan,
            'tanggalCetak'    => $tanggalCetak,
            'totalDosen'      => $totalDosen,
            'totalMataKuliah' => $totalMataKuliah,
            'totalPlo'        => $totalPlo,
            'totalClo'        => $totalClo,
            'totalSoal'       => $totalSoal,
            'totalApproved'   => $totalApproved,
            'totalRevision'   => $totalRevision,
            'totalRejected'   => $totalRejected,
            'totalPending'    => $totalPending,
            'progressPct'     => $progressPct,
            'soalList'        => $soalList,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.laporan-dashboard', $data)
            ->setPaper('a4', 'portrait');

        $filename = 'Laporan-Verifikasi-' . \Illuminate\Support\Str::slug($namaPeriode . '-' . $jenisLaporan) . '.pdf';

        return $pdf->download($filename);
    }
}
