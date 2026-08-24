<?php

namespace App\Http\Controllers\Koordinator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\KategoriSoal;
use App\Models\PenugasanKoordinator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SoalController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $assignments = $dosen
            ? PenugasanKoordinator::with('mataKuliah')
                ->where('dosen_id', $dosen->id)
                ->where('status', 'ACTIVE')
                ->get()
            : collect();

        $query = Soal::with(['mataKuliah', 'periode', 'kategori', 'latestVerifikasi'])
            ->whereIn('mata_kuliah_id', $assignments->pluck('mata_kuliah_id'));

        if ($request->filled('status')) {
            if ($request->status === 'IN_REVIEW') {
                $query->whereIn('status', ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED', 'DRAFT']);
            } else {
                $query->where('status', $request->status);
            }
        }
        if ($request->filled('mk_id')) {
            $query->where('mata_kuliah_id', $request->mk_id);
        }

        $soalList   = $query->orderBy('updated_at', 'desc')->paginate(10)->withQueryString();
        $kategoriAll = KategoriSoal::where('status', 'ACTIVE')->get();
        $periodeAll  = PeriodeVerifikasi::where('status', 'ACTIVE')->get();

        return Inertia::render('Koordinator/Soal/Index', [
            'soalList'    => $soalList,
            'assignments' => $assignments,
            'kategoriAll' => $kategoriAll,
            'periodeAll'  => $periodeAll,
            'filters'     => $request->only(['status', 'mk_id']),
        ]);
    }

    public function create(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();

        $assignments = ($dosen && $activePeriod)
            ? PenugasanKoordinator::with('mataKuliah')
                ->where('dosen_id', $dosen->id)
                ->where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->get()
            : collect();

        if ($assignments->isEmpty()) {
            return redirect()->route('koordinator.dashboard')
                ->with('error', 'Anda tidak memiliki mata kuliah yang ditugaskan pada periode aktif.');
        }

        $selectedMkId = $request->query('mata_kuliah_id');
        if ($selectedMkId && !$assignments->contains('mata_kuliah_id', $selectedMkId)) {
            abort(403, 'Anda tidak memiliki akses ke mata kuliah ini.');
        }

        // Blokir upload baru jika sudah ada soal aktif (belum diputuskan final) untuk MK + Periode ini.
        if ($selectedMkId && $activePeriod) {
            $nonFinalStatuses = [Soal::STATUS_DRAFT, Soal::STATUS_SUBMITTED, Soal::STATUS_IN_REVIEW, Soal::STATUS_RESUBMITTED, Soal::STATUS_REVISION];
            $existingActive = Soal::where('mata_kuliah_id', $selectedMkId)
                ->where('periode_id', $activePeriod->id)
                ->whereIn('status', $nonFinalStatuses)
                ->exists();
            if ($existingActive) {
                return redirect()->route('koordinator.mata-kuliah.show', $selectedMkId)
                    ->with('error', 'Anda sudah memiliki soal yang sedang dalam proses verifikasi untuk mata kuliah ini. Tunggu hingga verifikator memberikan keputusan sebelum mengunggah soal baru.');
            }
        }

        $categories = $this->getKategoriForPeriode($activePeriod);
        $defaultKategori = $categories->first();

        return Inertia::render('Koordinator/Soal/Create', [
            'assignments' => $assignments->map(fn ($a) => [
                'id'      => $a->mata_kuliah_id,
                'kode_mk' => $a->mataKuliah?->kode_mk,
                'nama_mk' => $a->mataKuliah?->nama_mk,
            ])->values(),
            'kategoriAll'          => $categories,
            'defaultKategori'      => $defaultKategori,
            'activePeriode'        => $activePeriod,
            'selectedMataKuliahId' => $selectedMkId,
            'uploadOpen'           => $activePeriod?->isUploadOpen() ?? false,
        ]);
    }

    public function store(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $request->validate([
            'mata_kuliah_id' => ['required', 'exists:mata_kuliah,id'],
            'periode_id'     => ['required', 'exists:periode_verifikasi,id'],
            'kategori_id'    => ['required', 'exists:kategori_soal,id'],
            'judul'          => ['required', 'string', 'max:255'],
            'file'           => ['required', 'file', 'mimes:pdf,doc,docx', 'min:1', 'max:20480'],
            'plo_clo_data'   => ['required'],
        ], [
            'file.min'          => 'Ukuran berkas naskah soal minimal 1 KB.',
            'file.mimes'        => 'Format berkas harus berupa PDF, DOC, atau DOCX.',
            'file.max'          => 'Ukuran berkas maksimal 20 MB.',
            'plo_clo_data.required' => 'Konfigurasi PLO & CLO wajib diisi sebelum mengunggah soal.',
        ]);

        // Decode and validate plo_clo_data structure
        $ploCloRaw = $request->input('plo_clo_data');
        $ploCloData = is_string($ploCloRaw) ? json_decode($ploCloRaw, true) : $ploCloRaw;

        if (empty($ploCloData['plo']) || !is_array($ploCloData['plo'])) {
            return redirect()->back()->with('error', 'Konfigurasi PLO & CLO tidak valid. Minimal tambahkan satu PLO dan satu CLO.');
        }

        $totalClo = collect($ploCloData['plo'])->sum(fn($plo) => count($plo['clo'] ?? []));
        if ($totalClo === 0) {
            return redirect()->back()->with('error', 'Setiap PLO harus memiliki minimal satu CLO sebelum mengunggah soal.');
        }

        // Validate assignment: koordinator must actually be assigned to this MK for this periode.
        $assigned = $dosen && PenugasanKoordinator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $request->mata_kuliah_id)
            ->where('periode_id', $request->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();

        if (!$assigned) {
            return redirect()->back()->with('error', 'Anda tidak memiliki penugasan untuk MK dan Periode yang dipilih.');
        }

        // Blokir upload soal baru jika sudah ada soal yang sedang aktif (belum final) untuk MK + Periode ini.
        $nonFinalStatuses = [Soal::STATUS_DRAFT, Soal::STATUS_SUBMITTED, Soal::STATUS_IN_REVIEW, Soal::STATUS_RESUBMITTED, Soal::STATUS_REVISION];
        $existingActive = Soal::where('mata_kuliah_id', $request->mata_kuliah_id)
            ->where('periode_id', $request->periode_id)
            ->whereIn('status', $nonFinalStatuses)
            ->exists();
        if ($existingActive) {
            return redirect()->back()->with('error', 'Anda sudah memiliki soal yang sedang dalam proses verifikasi. Tunggu keputusan verifikator sebelum mengunggah soal baru.');
        }

        $periode = PeriodeVerifikasi::find($request->periode_id);
        if (!$periode || !$periode->isUploadOpen()) {
            return redirect()->back()->with('error', 'Periode verifikasi tidak aktif atau sudah melewati deadline upload.');
        }

        $file      = $request->file('file');
        $path      = $file->store('soal/' . now()->format('Y/m'), 'private');
        $fileName  = $file->getClientOriginalName();
        $submitNow = $request->boolean('submit_now');

        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $request->mata_kuliah_id,
            'periode_id'     => $request->periode_id,
            'kategori_id'    => $request->kategori_id,
            'uploaded_by'    => $user->id,
            'judul'          => $request->judul,
            'nama_file'      => $fileName,
            'file_path'      => $path,
            'mime_type'      => $file->getMimeType(),
            'file_size'      => $file->getSize(),
            'status'         => $submitNow ? Soal::STATUS_SUBMITTED : Soal::STATUS_DRAFT,
            'plo_clo_data'   => $ploCloData,
        ]);

        AuditLog::record($user->id, 'UPLOAD_SOAL', 'Soal', $soal->id, null, $soal->toArray());
        if ($submitNow) {
            AuditLog::record($user->id, 'SUBMIT_SOAL', 'Soal', $soal->id);
            $soal->notifyVerifier(
                'Soal Baru Menunggu Verifikasi',
                "Dosen Koordinator " . $user->name . " telah mengunggah dan mengirimkan soal \"" . $soal->judul . "\" untuk mata kuliah " . ($soal->mataKuliah?->nama_mk ?? '') . "."
            );
        }

        return redirect()->route('koordinator.mata-kuliah.show', $soal->mata_kuliah_id)
            ->with('success', $submitNow ? 'Soal berhasil diunggah dan disubmit untuk verifikasi.' : 'Soal berhasil diunggah sebagai DRAFT.');
    }

    public function show(Request $request, Soal $soal)
    {
        if ($soal->uploaded_by !== $request->user()->id) {
            abort(403, 'Anda tidak memiliki akses ke soal ini.');
        }

        $soal->load([
            'mataKuliah',
            'periode',
            'kategori',
            'uploadedBy',
            'verifikasi' => fn ($q) => $q->with('verifikator')->orderByDesc('created_at'),
            'revisi' => fn ($q) => $q->with('uploadedBy')->orderByDesc('version'),
        ]);

        return Inertia::render('Koordinator/Soal/Show', [
            'soal' => $soal,
        ]);
    }

    public function edit(Request $request, Soal $soal)
    {
        $user = $request->user();
        if ($soal->uploaded_by !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke soal ini.');
        }

        if (!in_array($soal->status, [Soal::STATUS_DRAFT, Soal::STATUS_REVISION], true)) {
            return redirect()->route('koordinator.soal.show', $soal)
                ->with('error', 'Soal ini tidak dapat diedit pada status saat ini.');
        }

        $soal->load(['mataKuliah', 'kategori']);

        if ($soal->status === Soal::STATUS_REVISION) {
            $revisionNote = $soal->verifikasi()
                ->where('action', 'REVISION')
                ->orderByDesc('created_at')
                ->with('verifikator')
                ->first();

            return Inertia::render('Koordinator/Soal/Revisi', [
                'soal'        => $soal,
                'catatan'     => $revisionNote?->catatan,
                'cloFeedback' => $revisionNote?->clo_feedback,
                'verifikator' => $revisionNote?->verifikator?->name,
            ]);
        }

        return Inertia::render('Koordinator/Soal/Edit', [
            'soal'        => $soal,
            'kategoriAll' => $this->getKategoriForPeriode($soal->periode ?? PeriodeVerifikasi::where('status', 'ACTIVE')->first()),
        ]);
    }

    public function update(Request $request, Soal $soal)
    {
        $user = $request->user();
        if ($soal->uploaded_by !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke soal ini.');
        }

        if ($soal->status !== Soal::STATUS_DRAFT) {
            return redirect()->back()->with('error', 'Hanya soal berstatus DRAFT yang dapat diedit langsung. Gunakan alur revisi untuk soal berstatus REVISION.');
        }

        $request->validate([
            'judul'       => ['required', 'string', 'max:255'],
            'kategori_id' => ['required', 'exists:kategori_soal,id'],
            'file'        => ['nullable', 'file', 'mimes:pdf,doc,docx', 'min:1', 'max:20480'],
        ], [
            'file.min'   => 'Ukuran berkas naskah soal minimal 1 KB.',
            'file.mimes' => 'Format berkas harus berupa PDF, DOC, atau DOCX.',
            'file.max'   => 'Ukuran berkas maksimal 20 MB.',
        ]);

        $data = [
            'judul'       => $request->judul,
            'kategori_id' => $request->kategori_id,
        ];

        if ($request->hasFile('file')) {
            Storage::disk('private')->delete($soal->file_path);
            $file = $request->file('file');
            $data['nama_file'] = $file->getClientOriginalName();
            $data['file_path'] = $file->store('soal/' . now()->format('Y/m'), 'private');
            $data['mime_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        if ($request->filled('plo_clo_data')) {
            $ploCloRaw = $request->input('plo_clo_data');
            $data['plo_clo_data'] = is_string($ploCloRaw) ? json_decode($ploCloRaw, true) : $ploCloRaw;
        }

        $soal->update($data);
        AuditLog::record($user->id, 'UPDATE_SOAL', 'Soal', $soal->id, null, $data);

        return redirect()->route('koordinator.soal.show', $soal)->with('success', 'Soal berhasil diperbarui.');
    }

    public function submit(Request $request, Soal $soal)
    {
        if ($soal->uploaded_by !== $request->user()->id) abort(403);
        if (!$soal->canBeSubmitted()) {
            return redirect()->back()->with('error', 'Soal ini tidak dapat disubmit pada status saat ini.');
        }

        $periode = $soal->periode ?? PeriodeVerifikasi::find($soal->periode_id);
        if (!$periode || !$periode->isUploadOpen()) {
            return redirect()->back()->with('error', 'Periode verifikasi tidak aktif atau sudah melewati deadline upload.');
        }

        $soal->update(['status' => Soal::STATUS_SUBMITTED]);
        AuditLog::record($request->user()->id, 'SUBMIT_SOAL', 'Soal', $soal->id);
        $soal->notifyVerifier(
            'Soal Baru Menunggu Verifikasi',
            "Dosen Koordinator " . $request->user()->name . " telah mengirimkan soal \"" . $soal->judul . "\" untuk mata kuliah " . ($soal->mataKuliah?->nama_mk ?? '') . "."
        );
        return redirect()->back()->with('success', 'Soal berhasil disubmit untuk verifikasi.');
    }

    public function download(Request $request, Soal $soal)
    {
        $user = $request->user();
        $dosen = $user->dosen;
        $isOwner = $soal->uploaded_by === $user->id;
        $isAssigned = $dosen && PenugasanKoordinator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $soal->mata_kuliah_id)
            ->where('periode_id', $soal->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();

        if (!$isOwner && !$isAssigned && !$user->isSuperAdmin()) {
            abort(403, 'Anda tidak memiliki akses ke soal ini.');
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
        $user = $request->user();
        $dosen = $user->dosen;
        $isOwner = $soal->uploaded_by === $user->id;
        $isAssigned = $dosen && PenugasanKoordinator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $soal->mata_kuliah_id)
            ->where('periode_id', $soal->periode_id)
            ->where('status', 'ACTIVE')
            ->exists();

        if (!$isOwner && !$isAssigned && !$user->isSuperAdmin()) {
            abort(403, 'Anda tidak memiliki akses ke soal ini.');
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

    public function destroy(Request $request, Soal $soal)
    {
        if ($soal->uploaded_by !== $request->user()->id) abort(403);
        if ($soal->status !== Soal::STATUS_DRAFT) {
            return redirect()->back()->with('error', 'Hanya soal berstatus DRAFT yang bisa dihapus.');
        }

        Storage::disk('private')->delete($soal->file_path);
        $soal->delete();
        AuditLog::record($request->user()->id, 'DELETE_SOAL', 'Soal', $soal->id);
        return redirect()->back()->with('success', 'Soal berhasil dihapus.');
    }

    /**
     * Get active categories strictly filtered by the target Periode (UTS during UTS period, UAS during UAS period).
     */
    private function getKategoriForPeriode(?PeriodeVerifikasi $periode)
    {
        $query = KategoriSoal::where('status', 'ACTIVE');

        if ($periode) {
            $periodText = mb_strtolower(($periode->nama ?? '') . ' ' . ($periode->catatan ?? ''));
            $isUas = str_contains($periodText, 'uas') || str_contains($periodText, 'akhir semester');

            if ($isUas) {
                // In UAS period: ONLY UAS
                $query->where(function ($q) {
                    $q->whereRaw('LOWER(nama) LIKE ?', ['%uas%'])
                      ->orWhereRaw('LOWER(deskripsi) LIKE ?', ['%akhir semester%']);
                });
            } else {
                // In UTS period (default): ONLY UTS
                $query->where(function ($q) {
                    $q->whereRaw('LOWER(nama) LIKE ?', ['%uts%'])
                      ->orWhereRaw('LOWER(deskripsi) LIKE ?', ['%tengah semester%']);
                });
            }
        } else {
            $query->where(function ($q) {
                $q->whereRaw('LOWER(nama) LIKE ?', ['%uts%'])
                  ->orWhereRaw('LOWER(nama) LIKE ?', ['%uas%']);
            });
        }

        $results = $query->orderBy('nama', 'asc')->get(['id', 'nama', 'deskripsi']);

        // Auto-provision if the matching master category doesn't exist yet
        if ($results->isEmpty() && $periode) {
            $periodText = mb_strtolower(($periode->nama ?? '') . ' ' . ($periode->catatan ?? ''));
            $isUas = str_contains($periodText, 'uas') || str_contains($periodText, 'akhir semester');
            $name = $isUas ? 'UAS' : 'UTS';
            $desc = $isUas ? 'Ujian Akhir Semester (UAS)' : 'Ujian Tengah Semester (UTS)';

            $cat = KategoriSoal::firstOrCreate(
                ['nama' => $name],
                ['id' => (string) Str::uuid(), 'deskripsi' => $desc, 'status' => 'ACTIVE']
            );
            return collect([$cat]);
        }

        return $results;
    }
}
