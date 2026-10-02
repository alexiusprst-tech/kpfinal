<?php

namespace App\Observers;

use App\Models\KelompokKoordinator;
use App\Models\PenugasanKoordinator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Safety net for the audit finding that KelompokKoordinator (UI-level
 * assignment) and PenugasanKoordinator (the table actually queried by
 * isAssignedKoordinator() for per-soal authorization) are two separate
 * tables kept in sync only by manual calls to syncOperationalAssignments()
 * at each mutation point. If a future code path forgets that call,
 * authorization silently breaks without anyone noticing.
 *
 * This observer does not auto-fix state — the conflict-resolution rules in
 * syncOperationalAssignments() (ending conflicting records from other
 * kelompok, notifications, etc.) are non-trivial, and re-implementing them
 * here would risk diverging from that logic. It only logs a warning so
 * drift becomes visible in logs/monitoring instead of a silent 403 that a
 * user reports weeks later.
 *
 * Checks run via DB::afterCommit() so they see the final state of the
 * enclosing transaction, not a partial mid-transaction snapshot.
 */
class KelompokKoordinatorObserver
{
    public function created(KelompokKoordinator $koordinator): void
    {
        DB::afterCommit(function () use ($koordinator) {
            $kelompok = $koordinator->kelompok()->first();

            // Sync is only guaranteed once the kelompok is ACTIVE — during
            // DRAFT/MENUNGGU_VERIFIKATOR, PenugasanKoordinator is
            // intentionally not created yet. Skip to avoid false positives.
            if (!$kelompok || !$kelompok->isActive()) {
                return;
            }

            $exists = PenugasanKoordinator::where('dosen_id', $koordinator->dosen_id)
                ->where('mata_kuliah_id', $koordinator->mata_kuliah_id)
                ->where('periode_id', $kelompok->periode_id)
                ->where('status', 'ACTIVE')
                ->exists();

            if (!$exists) {
                Log::warning('[KelompokKoordinatorObserver] Drift: KelompokKoordinator dibuat pada kelompok ACTIVE tanpa PenugasanKoordinator ACTIVE yang cocok — kemungkinan syncOperationalAssignments() tidak dipanggil.', [
                    'kelompok_koordinator_id' => $koordinator->id,
                    'kelompok_id'             => $koordinator->kelompok_id,
                    'dosen_id'                => $koordinator->dosen_id,
                    'mata_kuliah_id'          => $koordinator->mata_kuliah_id,
                    'periode_id'              => $kelompok->periode_id,
                ]);
            }
        });
    }

    public function deleted(KelompokKoordinator $koordinator): void
    {
        DB::afterCommit(function () use ($koordinator) {
            $stillActive = PenugasanKoordinator::where('dosen_id', $koordinator->dosen_id)
                ->where('mata_kuliah_id', $koordinator->mata_kuliah_id)
                ->where('kelompok_id', $koordinator->kelompok_id)
                ->where('status', 'ACTIVE')
                ->exists();

            if ($stillActive) {
                Log::warning('[KelompokKoordinatorObserver] Drift: KelompokKoordinator dihapus tapi PenugasanKoordinator ACTIVE terkait belum di-ENDED — dosen ini mungkin masih punya akses operasional yang seharusnya sudah dicabut.', [
                    'kelompok_id'    => $koordinator->kelompok_id,
                    'dosen_id'       => $koordinator->dosen_id,
                    'mata_kuliah_id' => $koordinator->mata_kuliah_id,
                ]);
            }
        });
    }
}
