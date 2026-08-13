<?php

namespace App\Http\Controllers\Koordinator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
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
            'file'    => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $file    = $request->file('file');
        $path    = $file->store('soal/revisi/' . now()->format('Y/m'), 'private');
        $version = $soal->revisi()->count() + 1;

        RevisiSoal::create([
            'id'          => (string) Str::uuid(),
            'soal_id'     => $soal->id,
            'version'     => $version,
            'nama_file'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'mime_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
            'catatan'     => $request->catatan,
            'uploaded_by' => $user->id,
            'uploaded_at' => now(),
        ]);

        $soal->update(['status' => Soal::STATUS_RESUBMITTED]);

        AuditLog::record($user->id, 'UPLOAD_REVISI', 'Soal', $soal->id);

        return redirect()->back()->with('success', 'Revisi soal berhasil diunggah.');
    }

    public function download(Request $request, RevisiSoal $revisi)
    {
        if (!Storage::disk('private')->exists($revisi->file_path)) {
            abort(404, 'File revisi tidak ditemukan.');
        }

        return Storage::disk('private')->download($revisi->file_path, $revisi->nama_file);
    }
}
