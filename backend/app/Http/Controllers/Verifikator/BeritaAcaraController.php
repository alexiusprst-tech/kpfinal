<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BeritaAcara;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BeritaAcaraController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();
        if (!$activePeriod) {
            return Inertia::render('Verifikator/BeritaAcara/Index', [
                'activePeriod' => null,
                'assignments'  => [],
                'history'      => [],
            ]);
        }

        // Get assignments for active period
        $assignments = $dosen
            ? PenugasanVerifikator::with(['mataKuliah'])
                ->where('dosen_id', $dosen->id)
                ->where('periode_id', $activePeriod->id)
                ->where('status', 'ACTIVE')
                ->get()
            : collect();

        $assignedMkIds = $assignments->pluck('mata_kuliah_id');

        $soalList = Soal::whereIn('mata_kuliah_id', $assignedMkIds)
            ->where('periode_id', $activePeriod->id)
            ->get();

        $assignmentsWithStats = $assignments->map(function ($a) use ($soalList) {
            $mkSoal = $soalList->where('mata_kuliah_id', $a->mata_kuliah_id);
            return [
                'id'             => $a->id,
                'mata_kuliah_id' => $a->mata_kuliah_id,
                'mata_kuliah'    => $a->mataKuliah,
                'total'          => $mkSoal->count(),
                'pending'        => $mkSoal->whereIn('status', ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count(),
                'approved'       => $mkSoal->where('status', 'APPROVED')->count(),
                'revision'       => $mkSoal->where('status', 'REVISION')->count(),
                'rejected'       => $mkSoal->where('status', 'REJECTED')->count(),
            ];
        });

        // History of generated Berita Acara
        $history = BeritaAcara::with(['mataKuliah', 'koordinator'])
            ->where('dibuat_oleh', $user->id)
            ->where('periode_id', $activePeriod->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Verifikator/BeritaAcara/Index', [
            'activePeriod' => $activePeriod,
            'assignments'  => $assignmentsWithStats,
            'history'      => $history,
        ]);
    }

    /**
     * Generate (or regenerate) the Berita Acara Verifikasi PDF for one mata
     * kuliah in the active periode, store it, and stream it to the browser.
     */
    public function cetak(Request $request, MataKuliah $mataKuliah)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        $activePeriod = PeriodeVerifikasi::with('tahunAjaran')->where('status', 'ACTIVE')->first();
        if (!$activePeriod) {
            return redirect()->back()->with('error', 'Tidak ada periode verifikasi yang aktif.');
        }

        $isAssigned = $dosen && PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $activePeriod->id)
            ->where('status', 'ACTIVE')
            ->exists();

        if (!$isAssigned) {
            return redirect()->back()->with('error', 'Anda tidak ditugaskan sebagai verifikator untuk mata kuliah ini.');
        }

        $soalList = Soal::with(['kategori', 'latestVerifikasi'])
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $activePeriod->id)
            ->orderBy('created_at')
            ->get();

        if ($soalList->isEmpty()) {
            return redirect()->back()->with('error', 'Belum ada soal yang diunggah untuk mata kuliah ini pada periode aktif.');
        }

        $belumSelesai = $soalList->whereIn('status', ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'])->count();
        if ($belumSelesai > 0) {
            return redirect()->back()->with('error', 'Masih ada soal yang belum selesai diverifikasi untuk mata kuliah ini.');
        }

        $jumlahApproved = $soalList->where('status', 'APPROVED')->count();
        $jumlahRevision = $soalList->where('status', 'REVISION')->count();
        $jumlahRejected = $soalList->where('status', 'REJECTED')->count();

        $koordinatorDosen = PenugasanKoordinator::with('dosen')
            ->where('mata_kuliah_id', $mataKuliah->id)
            ->where('periode_id', $activePeriod->id)
            ->where('status', 'ACTIVE')
            ->first()?->dosen;

        if (!$koordinatorDosen) {
            return redirect()->back()->with('error', 'Mata kuliah ini belum memiliki Dosen Koordinator aktif pada periode ini.');
        }

        $clos = $mataKuliah->clo()->with('plo')->get();

        return DB::transaction(function () use ($user, $dosen, $activePeriod, $mataKuliah, $soalList, $clos, $koordinatorDosen, $jumlahApproved, $jumlahRevision, $jumlahRejected) {
            // Lock period to prevent race condition during serial number generation
            $lockedPeriod = PeriodeVerifikasi::where('id', $activePeriod->id)->lockForUpdate()->first();

            $existing = BeritaAcara::where('periode_id', $lockedPeriod->id)
                ->where('mata_kuliah_id', $mataKuliah->id)
                ->where('dibuat_oleh', $user->id)
                ->lockForUpdate()
                ->first();

            $nomor = $existing?->nomor ?? $this->generateNomor($lockedPeriod, $mataKuliah);

            $tanggal = now();

            $data = [
                'nomor'            => $nomor,
                'tanggal'          => $tanggal,
                'tanggalIndonesia' => $this->formatTanggalIndonesia($tanggal),
                'periode'          => $lockedPeriod,
                'mataKuliah'       => $mataKuliah,
                'evaluatorNama'    => $user->name,
                'evaluatorKode'    => $dosen->kode_dosen ?? '-',
                'programStudi'     => config('app.program_studi', env('PRODI_NAME', 'S1 Sistem Informasi')),
                'koordinatorNama'  => $koordinatorDosen->nama_lengkap,
                'kaProdi'          => config('app.kaprodi', env('KAPRODI_NAME', 'Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.')),
                'soalList'         => $soalList,
                'clos'             => $clos,
                'jumlahSoal'       => $soalList->count(),
                'jumlahApproved'   => $jumlahApproved,
                'jumlahRevision'   => $jumlahRevision,
                'jumlahRejected'   => $jumlahRejected,
            ];

            $pdf = Pdf::loadView('pdf.berita-acara', $data)->setPaper('a4', 'portrait');

            $relativePath = 'berita-acara/' . Str::uuid() . '.pdf';
            Storage::disk('private')->put($relativePath, $pdf->output());

            $beritaAcara = BeritaAcara::updateOrCreate(
                [
                    'periode_id'     => $lockedPeriod->id,
                    'mata_kuliah_id' => $mataKuliah->id,
                    'dibuat_oleh'    => $user->id,
                ],
                [
                    'nomor'            => $nomor,
                    'koordinator_id'   => $koordinatorDosen->id,
                    'jumlah_soal'      => $soalList->count(),
                    'jumlah_approved'  => $jumlahApproved,
                    'jumlah_revision'  => $jumlahRevision,
                    'jumlah_rejected'  => $jumlahRejected,
                    'file_path'        => $relativePath,
                    'tanggal'          => $tanggal,
                ]
            );

            AuditLog::record($user->id, 'BERITA_ACARA_CREATED', 'BeritaAcara', $beritaAcara->id, null, [
                'nomor'          => $nomor,
                'mata_kuliah_id' => $mataKuliah->id,
                'periode_id'     => $lockedPeriod->id,
            ]);

            $filename = 'Berita-Acara-' . Str::slug($mataKuliah->kode_mk . '-' . $mataKuliah->nama_mk) . '.pdf';

            return $pdf->download($filename);
        });
    }

    private function generateNomor(PeriodeVerifikasi $periode, MataKuliah $mataKuliah): string
    {
        $seq = BeritaAcara::where('periode_id', $periode->id)->count() + 1;

        return sprintf('%03d/BAP-Ver/%s/%s', $seq, $mataKuliah->kode_mk, now()->format('m/Y'));
    }

    private function formatTanggalIndonesia(\Carbon\Carbon $date): string
    {
        $bulan = [
            1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];

        return sprintf('%d %s %d', $date->day, $bulan[(int) $date->month], $date->year);
    }
}
