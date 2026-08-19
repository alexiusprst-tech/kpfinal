<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Soal;
use App\Models\Verifikasi;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VerifikasiController extends Controller
{
    public function store(Request $request, Soal $soal)
    {
        $user = $request->user();

        if (!$soal->canBeVerified()) {
            return redirect()->back()->with('error', 'Soal ini tidak dapat diverifikasi pada status saat ini.');
        }

        $validated = $request->validate([
            'action'  => ['required', 'in:APPROVED,REVISION,REJECTED'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);

        Verifikasi::create([
            'id'              => (string) Str::uuid(),
            'soal_id'         => $soal->id,
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

        $soal->update(['status' => $newStatus]);

        AuditLog::record($user->id, "VERIFIKASI_{$validated['action']}", 'Soal', $soal->id, null, ['action' => $validated['action']]);

        $actionText = match ($validated['action']) {
            'APPROVED' => 'Disetujui',
            'REVISION' => 'Perlu Revisi',
            'REJECTED' => 'Ditolak',
        };
        $soal->notifyCoordinator(
            'Verifikasi Soal Selesai',
            "Soal \"" . $soal->judul . "\" untuk mata kuliah " . ($soal->mataKuliah?->nama_mk ?? '') . " telah " . $actionText . " oleh Verifikator " . $user->name . "."
        );

        return redirect()->back()->with('success', "Soal berhasil di-{$validated['action']}.");
    }
}
