<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Clo;
use App\Models\Dosen;
use App\Models\KelompokMataKuliah;
use App\Models\KelompokVerifikasi;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
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

        // Recent Audit Logs / Activities with human-readable description
        $rawActivities = AuditLog::with(['user.dosen'])
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get();

        $recentActivities = AuditLog::formatLogs($rawActivities);

        // Mata kuliah yang dipilih/ditugaskan oleh Super Admin pada periode aktif yang soalnya belum disetujui
        $urgentMataKuliah = [];
        $assignedMkIds = collect();

        if ($activePeriod) {
            // Ambil ID mata kuliah yang dipilih/ditugaskan pada periode ini
            $kelompokMkIds = KelompokMataKuliah::whereHas('kelompok', fn ($q) => $q->where('periode_id', $activePeriod->id))
                ->pluck('mata_kuliah_id');
            $penugasanKoordMkIds = PenugasanKoordinator::where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->pluck('mata_kuliah_id');
            $penugasanVerifMkIds = PenugasanVerifikator::where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->pluck('mata_kuliah_id');

            $assignedMkIds = $kelompokMkIds
                ->merge($penugasanKoordMkIds)
                ->merge($penugasanVerifMkIds)
                ->unique()
                ->filter();

            if ($assignedMkIds->isNotEmpty()) {
                $mataKuliahList = MataKuliah::whereIn('id', $assignedMkIds)
                    ->with([
                        'soal' => fn ($q) => $q->where('periode_id', $activePeriod->id),
                        'penugasanKoordinator' => fn ($q) => $q->where('periode_id', $activePeriod->id)->where('status', 'ACTIVE')->with('dosen'),
                        'penugasanVerifikator' => fn ($q) => $q->where('periode_id', $activePeriod->id)->where('status', 'ACTIVE')->with('dosen'),
                    ])
                    ->get();

                $urgentMataKuliah = $mataKuliahList
                    ->filter(function ($mk) {
                        $approvedSoal = $mk->soal->where('status', 'APPROVED');
                        // Jika belum ada soal yang disetujui (APPROVED == 0), maka belum bisa mencetak berita acara (Perhatian)
                        return $approvedSoal->isEmpty();
                    })
                    ->map(function ($mk) {
                        $soals = $mk->soal;
                        $koordinator = $mk->penugasanKoordinator->first()?->dosen?->nama_lengkap;
                        $verifikator = $mk->penugasanVerifikator->first()?->dosen?->nama_lengkap;

                        if ($soals->isEmpty()) {
                            $status = 'BELUM_UPLOAD';
                            $statusLabel = 'Belum Upload';
                            $keterangan = 'Belum ada berkas soal diunggah';
                            $priority = 3;
                        } elseif ($soals->contains('status', 'REVISION')) {
                            $status = 'REVISION';
                            $statusLabel = 'Perlu Revisi';
                            $keterangan = 'Soal memerlukan revisi dari koordinator';
                            $priority = 1;
                        } elseif ($soals->contains('status', 'REJECTED')) {
                            $status = 'REJECTED';
                            $statusLabel = 'Ditolak';
                            $keterangan = 'Soal ditolak verifikator';
                            $priority = 2;
                        } elseif ($soals->contains(fn ($s) => in_array($s->status, ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED']))) {
                            $status = 'IN_REVIEW';
                            $statusLabel = 'Menunggu Verifikasi';
                            $keterangan = 'Soal sedang menunggu verifikasi';
                            $priority = 4;
                        } elseif ($soals->contains('status', 'DRAFT')) {
                            $status = 'DRAFT';
                            $statusLabel = 'Draft';
                            $keterangan = 'Soal masih berstatus draf';
                            $priority = 5;
                        } else {
                            $status = 'BELUM_DISETUJUI';
                            $statusLabel = 'Belum Disetujui';
                            $keterangan = 'Belum ada soal yang disetujui';
                            $priority = 6;
                        }

                        $latestDate = $soals->sortByDesc('updated_at')->first()?->updated_at ?? $mk->updated_at;

                        return [
                            'id'           => $mk->id,
                            'kode_mk'      => $mk->kode_mk,
                            'nama_mk'      => $mk->nama_mk,
                            'semester'     => $mk->semester,
                            'sks'          => $mk->sks,
                            'total_soal'   => $soals->count(),
                            'koordinator'  => $koordinator,
                            'verifikator'  => $verifikator,
                            'status'       => $status,
                            'status_label' => $statusLabel,
                            'keterangan'   => $keterangan,
                            'priority'     => $priority,
                            'created_at'   => $latestDate,
                        ];
                    })
                    ->sortBy(fn ($item) => [$item['priority'], $item['nama_mk']])
                    ->values()
                    ->all();
            }
        }

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

        // Active Period Summary metrics
        $activePeriodSummary = null;
        if ($activePeriod) {
            $activePeriod->loadMissing('tahunAjaran');

            // Hanya menghitung mata kuliah yang sudah dipilih oleh superadmin saat membuat kelompok verifikasi pada periode aktif
            $totalMkCount = $assignedMkIds->count();

            $completedMkCount = $assignedMkIds->isNotEmpty()
                ? MataKuliah::whereIn('id', $assignedMkIds)
                    ->whereHas('soal', function ($q) use ($activePeriod) {
                        $q->where('periode_id', $activePeriod->id)->where('status', 'APPROVED');
                    })->count()
                : 0;

            $periodProgressPct = $totalMkCount > 0 ? round(($completedMkCount / $totalMkCount) * 100) : 0;

            $deadline = $activePeriod->deadline_upload ? \Carbon\Carbon::parse($activePeriod->deadline_upload) : \Carbon\Carbon::parse($activePeriod->tanggal_selesai);
            $now = now();
            $sisaHari = (int) $now->diffInDays($deadline, false);
            if ($sisaHari > 0) {
                $sisaWaktuStr = $sisaHari . ' hari lagi';
            } elseif ($sisaHari === 0) {
                $sisaWaktuStr = 'Tenggat hari ini';
            } else {
                $sisaWaktuStr = 'Tenggat waktu lewat';
            }

            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

            $formatDate = function ($d) use ($months) {
                if (!$d) return '-';
                $c = \Carbon\Carbon::parse($d);
                return $c->format('j') . ' ' . $months[$c->month - 1] . ' ' . $c->format('Y');
            };

            $formatDateTime = function ($d) use ($months) {
                if (!$d) return '-';
                $c = \Carbon\Carbon::parse($d);
                return $c->format('j') . ' ' . $months[$c->month - 1] . ' ' . $c->format('Y') . ', ' . $c->format('H:i');
            };

            $activePeriodSummary = [
                'id'               => $activePeriod->id,
                'nama'             => $activePeriod->nama,
                'tahun_ajaran'     => $activePeriod->tahunAjaran->nama ?? '',
                'tanggal_mulai'    => $formatDate($activePeriod->tanggal_mulai),
                'tanggal_selesai'  => $formatDate($activePeriod->tanggal_selesai),
                'deadline_upload'  => $formatDateTime($activePeriod->deadline_upload),
                'status'           => $activePeriod->status,
                'status_label'     => $activePeriod->status === 'ACTIVE' ? 'Aktif' : $activePeriod->status,
                'total_mk'         => $totalMkCount,
                'completed_mk'     => $completedMkCount,
                'progress_pct'     => $periodProgressPct,
                'sisa_waktu'       => $sisaWaktuStr,
            ];
        }

        $allPeriods = PeriodeVerifikasi::with('tahunAjaran')
            ->orderBy('created_at', 'desc')
            ->get();

        // Comparison Chart Data: Status Upload Soal per Mata Kuliah (Legacy support)
        $courseComparisonData = [
            'labels'      => [],
            'approved'    => [],
            'submitted'   => [],
            'revision'    => [],
            'belumUpload' => [],
            'courses'     => [],
        ];

        // Fetch all active Mata Kuliah in master data for complete comparison
        $allActiveMkList = MataKuliah::where('status', 'ACTIVE')
            ->orderBy('nama_mk', 'asc')
            ->get();

        if ($allActiveMkList->isNotEmpty()) {
            if ($activePeriod) {
                $allActiveMkList->load(['soal' => fn ($q) => $q->where('periode_id', $activePeriod->id)]);
            }

            foreach ($allActiveMkList as $mk) {
                $soals = $mk->relationLoaded('soal') ? $mk->soal : collect();
                $isAssigned = $assignedMkIds->contains($mk->id);

                $approvedCount  = $soals->where('status', 'APPROVED')->count();
                $submittedCount = $soals->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count();
                $revisionCount  = $soals->where('status', 'REVISION')->count();
                $belumCount     = ($isAssigned && $soals->isEmpty()) ? 1 : 0;

                $shortLabel = \Illuminate\Support\Str::limit($mk->nama_mk, 22);

                $courseComparisonData['labels'][]      = $shortLabel;
                $courseComparisonData['approved'][]    = $approvedCount;
                $courseComparisonData['submitted'][]   = $submittedCount;
                $courseComparisonData['revision'][]    = $revisionCount;
                $courseComparisonData['belumUpload'][] = $belumCount;

                $courseComparisonData['courses'][] = [
                    'id'           => $mk->id,
                    'kode_mk'      => $mk->kode_mk,
                    'nama_mk'      => $mk->nama_mk,
                    'short_label'  => $shortLabel,
                    'is_assigned'  => $isAssigned,
                    'approved'     => $approvedCount,
                    'submitted'    => $submittedCount,
                    'revision'     => $revisionCount,
                    'belumUpload'  => $belumCount,
                ];
            }
        }

        // Macro Agregasi 1: Per Kelompok Verifikasi
        $groupComparisonData = [
            'labels'      => [],
            'tuntas'      => [],
            'proses'      => [],
            'belumUpload' => [],
            'groups'      => [],
        ];

        if ($activePeriod) {
            $kelompokList = KelompokVerifikasi::where('periode_id', $activePeriod->id)
                ->with(['mataKuliah.mataKuliah.soal' => fn ($q) => $q->where('periode_id', $activePeriod->id)])
                ->orderBy('nama', 'asc')
                ->get();

            foreach ($kelompokList as $kelompok) {
                $mkItems = $kelompok->mataKuliah;
                $totalMk = $mkItems->count();

                $tuntasCount = 0;
                $prosesCount = 0;
                $belumCount  = 0;

                $mkDetails = [];
                foreach ($mkItems as $item) {
                    $mk = $item->mataKuliah;
                    if (!$mk) continue;
                    $soals = $mk->relationLoaded('soal') ? $mk->soal : collect();

                    if ($soals->isEmpty()) {
                        $belumCount++;
                        $statusMk = 'BELUM_UPLOAD';
                        $statusLabel = 'Belum Upload';
                    } elseif ($soals->contains('status', 'APPROVED')) {
                        $tuntasCount++;
                        $statusMk = 'APPROVED';
                        $statusLabel = 'Disetujui';
                    } elseif ($soals->contains('status', 'REVISION')) {
                        $prosesCount++;
                        $statusMk = 'REVISION';
                        $statusLabel = 'Perlu Revisi';
                    } else {
                        $prosesCount++;
                        $statusMk = 'IN_REVIEW';
                        $statusLabel = 'Menunggu Verifikasi';
                    }

                    $mkDetails[] = [
                        'id'           => $mk->id,
                        'kode_mk'      => $mk->kode_mk,
                        'nama_mk'      => $mk->nama_mk,
                        'semester'     => $mk->semester,
                        'status'       => $statusMk,
                        'status_label' => $statusLabel,
                    ];
                }

                $pct = $totalMk > 0 ? round(($tuntasCount / $totalMk) * 100) : 0;

                $groupComparisonData['labels'][]      = $kelompok->nama;
                $groupComparisonData['tuntas'][]      = $tuntasCount;
                $groupComparisonData['proses'][]      = $prosesCount;
                $groupComparisonData['belumUpload'][] = $belumCount;

                $groupComparisonData['groups'][] = [
                    'id'           => $kelompok->id,
                    'nama'         => $kelompok->nama,
                    'total_mk'     => $totalMk,
                    'tuntas'       => $tuntasCount,
                    'proses'       => $prosesCount,
                    'belum_upload' => $belumCount,
                    'progress_pct' => $pct,
                    'mk_details'   => $mkDetails,
                ];
            }
        }

        // Macro Agregasi 2: Per Semester
        $semesterComparisonData = [
            'labels'      => [],
            'tuntas'      => [],
            'proses'      => [],
            'belumUpload' => [],
            'semesters'   => [],
        ];

        $semesters = MataKuliah::where('status', 'ACTIVE')
            ->select('semester')
            ->distinct()
            ->orderBy('semester', 'asc')
            ->pluck('semester');

        foreach ($semesters as $sem) {
            if (!$sem) continue;
            $mkListInSem = MataKuliah::where('status', 'ACTIVE')
                ->where('semester', $sem)
                ->get();

            if ($activePeriod) {
                $mkListInSem->load(['soal' => fn ($q) => $q->where('periode_id', $activePeriod->id)]);
            }

            $totalMkInSem = $mkListInSem->count();
            $tuntasCount = 0;
            $prosesCount = 0;
            $belumCount  = 0;

            foreach ($mkListInSem as $mk) {
                $soals = $mk->relationLoaded('soal') ? $mk->soal : collect();
                $isAssigned = $assignedMkIds->contains($mk->id);

                if ($soals->isEmpty()) {
                    if ($isAssigned) {
                        $belumCount++;
                    }
                } elseif ($soals->contains('status', 'APPROVED')) {
                    $tuntasCount++;
                } else {
                    $prosesCount++;
                }
            }

            $semLabel = 'Semester ' . $sem;
            $pct = $totalMkInSem > 0 ? round(($tuntasCount / $totalMkInSem) * 100) : 0;

            $semesterComparisonData['labels'][]      = $semLabel;
            $semesterComparisonData['tuntas'][]      = $tuntasCount;
            $semesterComparisonData['proses'][]      = $prosesCount;
            $semesterComparisonData['belumUpload'][] = $belumCount;

            $semesterComparisonData['semesters'][] = [
                'semester'     => $sem,
                'label'        => $semLabel,
                'total_mk'     => $totalMkInSem,
                'tuntas'       => $tuntasCount,
                'proses'       => $prosesCount,
                'belum_upload' => $belumCount,
                'progress_pct' => $pct,
            ];
        }

        return \Inertia\Inertia::render('SuperAdmin/Dashboard', [
            'activePeriod'           => $activePeriod,
            'activePeriodSummary'    => $activePeriodSummary,
            'allPeriods'             => $allPeriods,
            'totalDosen'             => $totalDosen,
            'totalMataKuliah'        => $totalMataKuliah,
            'totalPlo'               => $totalPlo,
            'totalClo'               => $totalClo,
            'totalBankSoal'          => $totalBankSoal,
            'progressPct'            => $progressPct,
            'statusCounts'           => $statusCounts,
            'recentActivities'       => $recentActivities,
            'urgentMataKuliah'       => $urgentMataKuliah,
            'urgentSoal'             => $urgentMataKuliah,
            'courseComparisonData'   => $courseComparisonData,
            'groupComparisonData'    => $groupComparisonData,
            'semesterComparisonData' => $semesterComparisonData,
            'trendData'              => [
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
        if ($periodeId === 'ACTIVE' || $periodeId === 'active') {
            $periode = PeriodeVerifikasi::with('tahunAjaran')->where('status', 'ACTIVE')->first();
        } elseif ($periodeId && $periodeId !== 'ALL') {
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
