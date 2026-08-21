<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PenugasanVerifikator;
use App\Models\Soal;
use App\Models\Verifikasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VerifikasiController extends Controller
{
    public function store(Request $request, Soal $soal)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $isAssigned = $dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $soal->mata_kuliah_id)
            ->where('periode_id', $soal->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();

        if (!$isAssigned) {
            abort(403, 'Anda tidak memiliki wewenang penugasan untuk memverifikasi soal mata kuliah ini.');
        }

        $validated = $request->validate([
            'action'  => ['required', 'in:APPROVED,REVISION,REJECTED'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);

        $actionText = match ($validated['action']) {
            'APPROVED' => 'Disetujui',
            'REVISION' => 'Perlu Revisi',
            'REJECTED' => 'Ditolak',
        };

        $result = DB::transaction(function () use ($user, $soal, $validated, $actionText) {
            // Pessimistic row locking on soal to prevent concurrent conflicting verifications
            $lockedSoal = Soal::where('id', $soal->id)->lockForUpdate()->first();

            if (!$lockedSoal || !$lockedSoal->canBeVerified()) {
                return ['success' => false, 'message' => 'Soal ini sedang atau telah diproses oleh verifikasi lain.'];
            }

            Verifikasi::create([
                'id'              => (string) Str::uuid(),
                'soal_id'         => $lockedSoal->id,
                'verifikator_id'  => $user->id,
                'action'          => $validated['action'],
                'catatan'         => $validated['catatan'] ?? null,
                'created_at'      => now(),
            ]);

            // Update soal status based on action
            $newStatus = match ($validated['action']) {
                'APPROVED' => Soal::STATUS_APPROVED,
                'REVISION' => Soal::STATUS_REVISION,
                'REJECTED' => Soal::STATUS_REJECTED,
            };

            $lockedSoal->update(['status' => $newStatus]);

            AuditLog::record($user->id, "VERIFIKASI_{$validated['action']}", 'Soal', $lockedSoal->id, null, ['action' => $validated['action']]);

            $lockedSoal->notifyCoordinator(
                'Verifikasi Soal Selesai',
                "Soal \"" . $lockedSoal->judul . "\" untuk mata kuliah " . ($lockedSoal->mataKuliah?->nama_mk ?? '') . " telah " . $actionText . " oleh Verifikator " . $user->name . "."
            );

            return ['success' => true];
        });

        if (!$result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', "Soal berhasil di-{$validated['action']}.");
    }
}
