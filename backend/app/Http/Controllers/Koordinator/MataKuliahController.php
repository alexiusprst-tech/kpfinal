<?php

namespace App\Http\Controllers\Koordinator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\Soal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MataKuliahController extends Controller
{
    private static array $activityLabels = [
        'UPLOAD_SOAL'         => 'mengunggah soal baru',
        'SUBMIT_SOAL'         => 'men-submit soal untuk verifikasi',
        'UPLOAD_REVISI'       => 'mengunggah revisi soal',
        'DELETE_SOAL'         => 'menghapus soal',
        'VERIFIKASI_APPROVED' => 'menyetujui soal',
        'VERIFIKASI_REVISION' => 'meminta revisi atas soal',
        'VERIFIKASI_REJECTED' => 'menolak soal',
    ];

    public function show(Request $request, MataKuliah $mataKuliah)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $assignment = $dosen
            ? PenugasanKoordinator::with(['periode', 'dosen'])
                ->where('dosen_id', $dosen->id)
                ->where('mata_kuliah_id', $mataKuliah->id)
                ->where('status', 'ACTIVE')
                ->latest('tanggal_mulai')
                ->first()
            : null;

        // Koordinator hanya boleh mengakses mata kuliah yang menjadi tanggung jawabnya.
        if (!$assignment) {
            abort(403, 'Anda tidak memiliki akses ke mata kuliah ini.');
        }

        $mataKuliah->load(['clo.plo']);

        $soalList = Soal::with(['uploadedBy', 'kategori', 'latestVerifikasi.verifikator'])
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $assignment->periode_id)
            ->orderByDesc('updated_at')
            ->get();

        $total    = $soalList->count();
        $approved = $soalList->where('status', Soal::STATUS_APPROVED)->count();

        $latestSoal = $soalList->first();
        $status = 'BELUM_UPLOAD';
        if ($latestSoal) {
            if (in_array($latestSoal->status, [Soal::STATUS_DRAFT, Soal::STATUS_SUBMITTED, Soal::STATUS_IN_REVIEW, Soal::STATUS_RESUBMITTED])) {
                $status = 'IN_REVIEW';
            } else {
                $status = $latestSoal->status;
            }
        }

        $stats = [
            'total'      => $total,
            'status'     => $status,
            'in_review'  => $soalList->whereIn('status', [Soal::STATUS_DRAFT, Soal::STATUS_SUBMITTED, Soal::STATUS_IN_REVIEW, Soal::STATUS_RESUBMITTED])->count(),
            'revision'   => $soalList->where('status', Soal::STATUS_REVISION)->count(),
            'approved'   => $approved,
            'rejected'   => $soalList->where('status', Soal::STATUS_REJECTED)->count(),
        ];

        $verifikators = PenugasanVerifikator::with('dosen')
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $assignment->periode_id)
            ->where('status', 'ACTIVE')
            ->get()
            ->map(fn ($va) => [
                'id'         => $va->id,
                'nama'       => $va->dosen?->nama_lengkap,
                'kode_dosen' => $va->dosen?->kode_dosen,
                'status'     => $va->status,
            ])
            ->values();

        $soalIds  = $soalList->pluck('id');
        $activity = $soalIds->isEmpty() ? collect() : AuditLog::with('user')
            ->where('model_type', 'Soal')
            ->whereIn('model_id', $soalIds)
            ->orderByDesc('created_at')
            ->take(15)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'description' => ($log->user?->name ?? 'Sistem') . ' ' . (self::$activityLabels[$log->action] ?? strtolower(str_replace('_', ' ', $log->action))),
                'created_at'  => $log->created_at,
            ]);

        // Cek apakah koordinator sudah memiliki soal aktif (belum final) untuk MK & periode ini.
        // Final statuses: APPROVED, REJECTED — koordinator bisa upload soal baru.
        // Non-final: DRAFT, SUBMITTED, IN_REVIEW, RESUBMITTED, REVISION — harus tunggu keputusan.
        $activeSoal = $soalList->first(fn ($s) => !in_array($s->status, [
            Soal::STATUS_APPROVED,
            Soal::STATUS_REJECTED,
        ]));

        return Inertia::render('Koordinator/MataKuliah/Show', [
            'mataKuliah'    => $mataKuliah,
            'dosenPengampu' => $assignment->dosen?->nama_lengkap,
            'periode'       => $assignment->periode,
            'stats'         => $stats,
            'soalList'      => $soalList,
            'verifikators'  => $verifikators,
            'activity'      => $activity->values(),
            'uploadOpen'    => $assignment->periode?->isUploadOpen() ?? false,
            'hasActiveSoal' => $activeSoal !== null,
            'activeSoalStatus' => $activeSoal?->status,
        ]);
    }
}
