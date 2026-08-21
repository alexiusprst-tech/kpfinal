<?php

namespace App\Http\Controllers\Koordinator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\RevisiSoal;
use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RevisiController extends Controller
{
    public function store(Request $request, Soal $soal)
    {
        $user = $request->user();

        if ($soal->uploaded_by !== $user->id) {
            abort(403, 'Anda tidak memiliki akses.');
        }

        if (!$soal->canBeRevised()) {
            return redirect()->back()->with('error', 'Soal ini tidak dapat direvisi pada status saat ini.');
        }

        $request->validate([
            'file'    => ['required', 'file', 'mimes:pdf,doc,docx', 'min:1', 'max:20480'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ], [
            'file.min'   => 'Ukuran berkas naskah revisi minimal 1 KB.',
            'file.mimes' => 'Format berkas harus berupa PDF, DOC, atau DOCX.',
            'file.max'   => 'Ukuran berkas maksimal 20 MB.',
        ]);

        $file    = $request->file('file');
        $path    = $file->store('soal/revisi/' . now()->format('Y/m'), 'private');

        \Illuminate\Support\Facades\DB::transaction(function () use ($user, $soal, $file, $path, $request) {
            $lockedSoal = Soal::where('id', $soal->id)->lockForUpdate()->first();
            $version = $lockedSoal->revisi()->count() + 1;

            RevisiSoal::create([
                'id'          => (string) Str::uuid(),
                'soal_id'     => $lockedSoal->id,
                'version'     => $version,
                'nama_file'   => $file->getClientOriginalName(),
                'file_path'   => $path,
                'mime_type'   => $file->getMimeType(),
                'file_size'   => $file->getSize(),
                'catatan'     => $request->catatan,
                'uploaded_by' => $user->id,
                'uploaded_at' => now(),
            ]);

            $lockedSoal->update(['status' => Soal::STATUS_RESUBMITTED]);

            AuditLog::record($user->id, 'UPLOAD_REVISI', 'Soal', $lockedSoal->id);

            $lockedSoal->notifyVerifier(
                'Revisi Soal Diunggah',
                "Dosen Koordinator " . $user->name . " telah mengunggah revisi baru untuk soal \"" . $lockedSoal->judul . "\" mata kuliah " . ($lockedSoal->mataKuliah?->nama_mk ?? '') . "."
            );
        });

        return redirect()->back()->with('success', 'Revisi soal berhasil diunggah.');
    }

    public function download(Request $request, RevisiSoal $revisi)
    {
        $user = $request->user();
        $soal = $revisi->soal;

        if (!$soal) {
            abort(404, 'Soal terkait tidak ditemukan.');
        }

        $dosen = $user->dosen;
        $isOwner = $soal->uploaded_by === $user->id;
        $isAssignedKoor = $dosen && PenugasanKoordinator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $soal->mata_kuliah_id)
            ->where('periode_id', $soal->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();
        $isAssignedVerif = $dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $soal->mata_kuliah_id)
            ->where('periode_id', $soal->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();

        if (!$isOwner && !$isAssignedKoor && !$isAssignedVerif && !$user->isSuperAdmin()) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengunduh berkas revisi soal ini.');
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('private');

        if (!$disk->exists($revisi->file_path)) {
            abort(404, 'File revisi tidak ditemukan.');
        }

        return $disk->download($revisi->file_path, $revisi->nama_file);
    }

    public function preview(Request $request, RevisiSoal $revisi)
    {
        $user = $request->user();
        $soal = $revisi->soal;

        if (!$soal) {
            abort(404, 'Soal terkait tidak ditemukan.');
        }

        $dosen = $user->dosen;
        $isOwner = $soal->uploaded_by === $user->id;
        $isAssignedKoor = $dosen && PenugasanKoordinator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $soal->mata_kuliah_id)
            ->where('periode_id', $soal->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();
        $isAssignedVerif = $dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $soal->mata_kuliah_id)
            ->where('periode_id', $soal->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();

        if (!$isOwner && !$isAssignedKoor && !$isAssignedVerif && !$user->isSuperAdmin()) {
            abort(403, 'Anda tidak memiliki wewenang untuk melihat berkas revisi soal ini.');
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('private');

        if (!$disk->exists($revisi->file_path)) {
            abort(404, 'File revisi tidak ditemukan.');
        }

        return $disk->response($revisi->file_path, $revisi->nama_file, [
            'Content-Disposition' => 'inline; filename="' . $revisi->nama_file . '"',
        ]);
    }
}
