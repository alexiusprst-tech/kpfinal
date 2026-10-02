<?php

namespace App\Observers;

use App\Models\KelompokVerifikator;
use App\Models\PenugasanVerifikator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Verifikator counterpart of KelompokKoordinatorObserver — see that class
 * for the full rationale. Detects drift between KelompokVerifikator
 * (UI-level assignment) and PenugasanVerifikator (the table actually
 * queried by isAssignedVerifikator() for per-soal authorization), and logs
 * a warning instead of silently auto-fixing state.
 */
class KelompokVerifikatorObserver
{
    public function created(KelompokVerifikator $verifikator): void
    {
        DB::afterCommit(function () use ($verifikator) {
            $kelompok = $verifikator->kelompok()->first();

            if (!$kelompok || !$kelompok->isActive()) {
                return;
            }

            $exists = PenugasanVerifikator::where('dosen_id', $verifikator->dosen_id)
                ->where('mata_kuliah_id', $verifikator->mata_kuliah_id)
                ->where('periode_id', $kelompok->periode_id)
                ->where('status', 'ACTIVE')
                ->exists();

            if (!$exists) {
                Log::warning('[KelompokVerifikatorObserver] Drift: KelompokVerifikator dibuat pada kelompok ACTIVE tanpa PenugasanVerifikator ACTIVE yang cocok — kemungkinan syncOperationalAssignments() tidak dipanggil.', [
                    'kelompok_verifikator_id' => $verifikator->id,
                    'kelompok_id'             => $verifikator->kelompok_id,
                    'dosen_id'                => $verifikator->dosen_id,
                    'mata_kuliah_id'          => $verifikator->mata_kuliah_id,
                    'periode_id'              => $kelompok->periode_id,
                ]);
            }
        });
    }

    public function deleted(KelompokVerifikator $verifikator): void
    {
        DB::afterCommit(function () use ($verifikator) {
            $stillActive = PenugasanVerifikator::where('dosen_id', $verifikator->dosen_id)
                ->where('mata_kuliah_id', $verifikator->mata_kuliah_id)
                ->where('kelompok_id', $verifikator->kelompok_id)
                ->where('status', 'ACTIVE')
                ->exists();

            if ($stillActive) {
                Log::warning('[KelompokVerifikatorObserver] Drift: KelompokVerifikator dihapus tapi PenugasanVerifikator ACTIVE terkait belum di-ENDED — dosen ini mungkin masih punya akses operasional yang seharusnya sudah dicabut.', [
                    'kelompok_id'    => $verifikator->kelompok_id,
                    'dosen_id'       => $verifikator->dosen_id,
                    'mata_kuliah_id' => $verifikator->mata_kuliah_id,
                ]);
            }
        });
    }
}
