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

        if ($request->status) {
            $query->where('status', $request->status);
        } else {
            // Default: show pending review
            $query->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED']);
        }

        $soalList = $query->orderBy('updated_at', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('Verifikator/Soal/Index', [
            'soalList' => $soalList,
            'filters'  => $request->only(['status']),
        ]);
    }

    public function show(Request $request, Soal $soal)
    {
        $soal->load(['mataKuliah', 'periode', 'kategori', 'uploadedBy', 'verifikasi.verifikator', 'revisi.uploadedBy']);

        // Mark as IN_REVIEW when verifikator opens it
        if ($soal->status === Soal::STATUS_SUBMITTED || $soal->status === Soal::STATUS_RESUBMITTED) {
            $soal->update(['status' => Soal::STATUS_IN_REVIEW]);
        }

        return Inertia::render('Verifikator/Soal/Show', [
            'soal' => $soal,
        ]);
    }

    public function download(Request $request, Soal $soal)
    {
        if (!Storage::disk('private')->exists($soal->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }
        return Storage::disk('private')->download($soal->file_path, $soal->nama_file);
    }
}
