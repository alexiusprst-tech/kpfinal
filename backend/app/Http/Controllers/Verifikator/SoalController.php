<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Models\PenugasanVerifikator;
use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SoalController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $assignments = $dosen
            ? PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->pluck('mata_kuliah_id')
            : collect();

        $query = Soal::with(['mataKuliah', 'periode', 'kategori', 'uploadedBy', 'latestVerifikasi'])
            ->whereIn('mata_kuliah_id', $assignments);

        if ($request->filled('status')) {
            if ($request->status === 'IN_REVIEW') {
                $query->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED']);
            } else {
                $query->where('status', $request->status);
            }
        }

        $soalList = $query->orderBy('updated_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Verifikator/Soal/Index', [
            'soalList' => $soalList,
            'filters'  => $request->only(['status']),
        ]);
    }

    public function show(Request $request, Soal $soal)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $isAssigned = $this->isAssignedVerifikator($dosen, $soal);

        if (!$isAssigned) {
            abort(403, 'Anda tidak memiliki akses verifikasi untuk mata kuliah ini.');
        }

        $soal->load(['mataKuliah', 'periode', 'kategori', 'uploadedBy', 'verifikasi.verifikator', 'revisi.uploadedBy']);

        return Inertia::render('Verifikator/Soal/Show', [
            'soal' => $soal,
        ]);
    }

    public function download(Request $request, Soal $soal)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $isAssigned = $this->isAssignedVerifikator($dosen, $soal);

        if (!$isAssigned && !$user->isSuperAdmin()) {
            abort(403, 'Anda tidak memiliki akses untuk mengunduh naskah soal mata kuliah ini.');
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('private');

        if (!$disk->exists($soal->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }
        return $disk->download($soal->file_path, $soal->nama_file);
    }

    public function preview(Request $request, Soal $soal)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $isAssigned = $this->isAssignedVerifikator($dosen, $soal);

        if (!$isAssigned && !$user->isSuperAdmin()) {
            abort(403, 'Anda tidak memiliki akses untuk melihat naskah soal mata kuliah ini.');
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('private');

        if (!$disk->exists($soal->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return $disk->response($soal->file_path, $soal->nama_file, [
            'Content-Disposition' => 'inline; filename="' . $soal->nama_file . '"',
        ]);
    }

    private function isAssignedVerifikator(?object $dosen, Soal $soal): bool
    {
        return $dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $soal->mata_kuliah_id)
            ->where('periode_id', $soal->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();
    }
}
