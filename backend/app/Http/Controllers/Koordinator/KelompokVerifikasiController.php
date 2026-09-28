<?php

namespace App\Http\Controllers\Koordinator;

use App\Http\Controllers\Controller;
use App\Http\Controllers\SuperAdmin\KelompokVerifikasiController as SuperAdminKelompokController;
use App\Models\AuditLog;
use App\Models\Dosen;
use App\Models\KelompokKoordinator;
use App\Models\KelompokMataKuliah;
use App\Models\KelompokVerifikasi;
use App\Models\KelompokVerifikator;
use App\Models\Notification;
use App\Models\PenugasanVerifikator;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class KelompokVerifikasiController extends Controller
{
    /**
     * Daftar kelompok verifikasi di mana user yang login terdaftar sebagai koordinator MK.
     */
    public function index(Request $request)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        if (!$dosen) {
            return Inertia::render('Koordinator/KelompokVerifikasi/Index', [
                'kelompokList' => [],
                'stats'        => ['total' => 0, 'menunggu' => 0, 'aktif' => 0, 'selesai' => 0],
                'dosenAll'     => [],
            ]);
        }

        // Ambil semua kelompok_id di mana dosen ini terdaftar sebagai koordinator
        $kelompokIds = KelompokKoordinator::where('dosen_id', $dosen->id)
            ->pluck('kelompok_id')
            ->unique()
            ->values();

        $kelompokList = KelompokVerifikasi::with([
            'periode.tahunAjaran',
            'mataKuliah.mataKuliah',
            'koordinator.dosen',
            'verifikator.dosen',
        ])
            ->whereIn('id', $kelompokIds)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($kelompok) use ($dosen) {
                // Hanya tampilkan MK yang dikoordinatori oleh dosen ini
                $mkSaya = KelompokKoordinator::where('kelompok_id', $kelompok->id)
                    ->where('dosen_id', $dosen->id)
                    ->with(['mataKuliah', 'kelompok'])
                    ->get()
                    ->map(function ($kk) use ($kelompok) {
                        // Ambil verifikator untuk MK ini
                        $verifikators = KelompokVerifikator::where('kelompok_id', $kelompok->id)
                            ->where('mata_kuliah_id', $kk->mata_kuliah_id)
                            ->with('dosen')
                            ->get()
                            ->map(fn($kv) => [
                                'id'           => $kv->dosen?->id,
                                'nama_lengkap' => $kv->dosen?->nama_lengkap,
                                'kode_dosen'   => $kv->dosen?->kode_dosen,
                            ])
                            ->values();

                        return [
                            'mata_kuliah_id' => $kk->mata_kuliah_id,
                            'kode_mk'        => $kk->mataKuliah?->kode_mk,
                            'nama_mk'        => $kk->mataKuliah?->nama_mk,
                            'semester'       => $kk->mataKuliah?->semester,
                            'sks'            => $kk->mataKuliah?->sks,
                            'verifikator'    => $verifikators,
                            'sudah_ada_verifikator' => $verifikators->isNotEmpty(),
                        ];
                    })
                    ->values();

                return [
                    'id'                   => $kelompok->id,
                    'nama'                 => $kelompok->nama,
                    'status'               => $kelompok->status,
                    'keterangan'           => $kelompok->keterangan,
                    'periode'              => $kelompok->periode ? [
                        'id'          => $kelompok->periode->id,
                        'nama'        => $kelompok->periode->nama,
                        'tahun_ajaran'=> $kelompok->periode->tahunAjaran?->nama,
                        'deadline_upload' => $kelompok->periode->deadline_upload,
                    ] : null,
                    'mk_saya'              => $mkSaya,
                    'mk_saya_count'        => $mkSaya->count(),
                    'mk_butuh_verifikator' => $mkSaya->filter(fn($mk) => !$mk['sudah_ada_verifikator'])->count(),
                    'can_assign_verifikator' => $kelompok->canAssignVerifikator(),
                    'updated_at'           => $kelompok->updated_at,
                    'created_at'           => $kelompok->created_at,
                ];
            });

        $stats = [
            'total'    => $kelompokList->count(),
            'menunggu' => $kelompokList->whereIn('status', ['DRAFT', 'MENUNGGU_VERIFIKATOR'])->count(),
            'aktif'    => $kelompokList->where('status', 'ACTIVE')->count(),
            'selesai'  => $kelompokList->where('status', 'CLOSED')->count(),
        ];

        // Dosen aktif untuk modal pilih verifikator (exclude dosen yang sedang login)
        $dosenAll = Dosen::where('status', 'ACTIVE')
            ->where('id', '!=', $dosen->id)
            ->orderBy('kode_dosen')
            ->get(['id', 'kode_dosen', 'nama_lengkap', 'email', 'kategori_dosen']);

        return Inertia::render('Koordinator/KelompokVerifikasi/Index', [
            'kelompokList' => $kelompokList->values(),
            'stats'        => $stats,
            'dosenAll'     => $dosenAll,
        ]);
    }

    /**
     * Koordinator MK menentukan verifikator soal untuk MK yang ditanganinya.
     *
     * Validasi backend:
     * 1. User harus terdaftar sebagai koordinator kelompok ini (per-record authorization)
     * 2. Status kelompok harus MENUNGGU_VERIFIKATOR
     * 3. Verifikator yang dipilih tidak boleh koordinator kelompok yang sama (self-assignment)
     * 4. Verifikator harus Dosen Tetap
     * 5. Verifikator tidak boleh menjadi koordinator MK yang sama dalam kelompok ini
     *
     * Setelah submit:
     * - Simpan KelompokVerifikator
     * - Cek apakah semua MK dalam kelompok sudah punya verifikator
     * - Jika ya → ubah status ke ACTIVE + sync operational assignments
     * - Catat AuditLog + kirim Notification
     */
    public function tentukanVerifikator(Request $request, KelompokVerifikasi $kelompokVerifikasi)
    {
        $user  = $request->user();
        $dosen = $user->dosen;

        // ─── Gate #1: Pastikan user adalah dosen ─────────────────────────────
        if (!$dosen) {
            abort(403, 'Akses ditolak. Anda bukan dosen.');
        }

        // ─── Gate #2: Pastikan dosen adalah koordinator kelompok ini ─────────
        $isKoordinator = KelompokKoordinator::where('kelompok_id', $kelompokVerifikasi->id)
            ->where('dosen_id', $dosen->id)
            ->exists();

        if (!$isKoordinator) {
            abort(403, 'Akses ditolak. Anda bukan koordinator kelompok verifikasi ini.');
        }

        // ─── Gate #3: Status kelompok harus MENUNGGU_VERIFIKATOR atau ACTIVE ─────────────
        if (!$kelompokVerifikasi->canAssignVerifikator()) {
            return back()->with('error', 'Penentuan atau perubahan verifikator hanya dapat dilakukan pada kelompok berstatus Menunggu Verifikator atau Aktif.');
        }

        // ─── Validasi input ───────────────────────────────────────────────────
        $validated = $request->validate([
            'mata_kuliah_assignments'                      => ['required', 'array', 'min:1'],
            'mata_kuliah_assignments.*.mata_kuliah_id'     => ['required', 'exists:mata_kuliah,id'],
            'mata_kuliah_assignments.*.verifikator_ids'    => ['required', 'array', 'min:1', 'max:5'],
            'mata_kuliah_assignments.*.verifikator_ids.*'  => ['required', 'exists:dosen,id'],
        ], [
            'mata_kuliah_assignments.required'                  => 'Data penugasan verifikator wajib diisi.',
            'mata_kuliah_assignments.*.verifikator_ids.required'=> 'Setiap mata kuliah wajib memiliki minimal 1 verifikator.',
            'mata_kuliah_assignments.*.verifikator_ids.min'     => 'Setiap mata kuliah wajib memiliki minimal 1 verifikator.',
            'mata_kuliah_assignments.*.verifikator_ids.max'     => 'Jumlah verifikator maksimal 5 dosen per mata kuliah.',
        ]);

        // ─── Ambil daftar koordinator kelompok ini (untuk validasi self-select) ─
        $allKoordinatorIds = KelompokKoordinator::where('kelompok_id', $kelompokVerifikasi->id)
            ->pluck('dosen_id')
            ->toArray();

        $periode = $kelompokVerifikasi->periode;
        $wasActive = $kelompokVerifikasi->isActive();

        // ─── Validasi per MK ──────────────────────────────────────────────────
        foreach ($validated['mata_kuliah_assignments'] as $mkItem) {
            $mkId = $mkItem['mata_kuliah_id'];

            // Pastikan MK ini memang dikoordinatori oleh dosen yang sedang login
            $isMkMilikKoordinator = KelompokKoordinator::where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $mkId)
                ->where('dosen_id', $dosen->id)
                ->exists();

            if (!$isMkMilikKoordinator) {
                return back()->withErrors([
                    'mata_kuliah_assignments' => 'Anda tidak dapat menentukan verifikator untuk mata kuliah yang bukan tanggung jawab Anda.'
                ]);
            }

            $mkNama = \App\Models\MataKuliah::find($mkId)?->nama_mk ?? 'MK';

            // Ambil daftar koordinator untuk MK ini
            $mkKoordinatorIds = KelompokKoordinator::where('kelompok_id', $kelompokVerifikasi->id)
                ->where('mata_kuliah_id', $mkId)
                ->pluck('dosen_id')
                ->toArray();

            foreach ($mkItem['verifikator_ids'] as $vDosenId) {
                // ─── Gate #4: Verifikator tidak boleh koordinator pada MK yang sama ─
                if (in_array($vDosenId, $mkKoordinatorIds)) {
                    $vDosen = Dosen::find($vDosenId);
                    $vNama = $vDosen?->nama_lengkap ?? 'Dosen';
                    return back()->withErrors([
                        'mata_kuliah_assignments' => "Dosen {$vNama} adalah koordinator pada mata kuliah {$mkNama} dan tidak dapat dipilih sebagai verifikator untuk mata kuliah yang sama."
                    ]);
                }

                // ─── Gate #5: Verifikator harus Dosen Tetap ──────────────────
                $vDosen = Dosen::find($vDosenId);
                if ($vDosen && !$vDosen->isDosenTetap()) {
                    $vNama = $vDosen->nama_lengkap;
                    return back()->withErrors([
                        'mata_kuliah_assignments' => "Dosen {$vNama} berstatus Luar Biasa (LB). Verifikator soal hanya dapat ditentukan dari Dosen Tetap pada mata kuliah {$mkNama}."
                    ]);
                }
            }
        }

        try {
            DB::transaction(function () use ($validated, $kelompokVerifikasi, $dosen, $user, $periode, $wasActive) {
                $newVerifikatorsByMk = collect($validated['mata_kuliah_assignments'])->keyBy('mata_kuliah_id');

                // Simpan verifikator per MK yang ditugaskan koordinator ini
                foreach ($validated['mata_kuliah_assignments'] as $mkItem) {
                    $mkId = $mkItem['mata_kuliah_id'];

                    // Hapus verifikator lama untuk MK ini (jika ada dari sebelumnya)
                    KelompokVerifikator::where('kelompok_id', $kelompokVerifikasi->id)
                        ->where('mata_kuliah_id', $mkId)
                        ->delete();

                    foreach ($mkItem['verifikator_ids'] as $vDosenId) {
                        KelompokVerifikator::create([
                            'id'             => (string) Str::uuid(),
                            'kelompok_id'    => $kelompokVerifikasi->id,
                            'mata_kuliah_id' => $mkId,
                            'dosen_id'       => $vDosenId,
                        ]);
                    }
                }

                // ─── Cek apakah SEMUA MK dalam kelompok sudah punya verifikator ───
                $allMkIds = KelompokMataKuliah::where('kelompok_id', $kelompokVerifikasi->id)
                    ->pluck('mata_kuliah_id')
                    ->toArray();

                $mkWithVerifikator = KelompokVerifikator::where('kelompok_id', $kelompokVerifikasi->id)
                    ->distinct('mata_kuliah_id')
                    ->pluck('mata_kuliah_id')
                    ->toArray();

                $allMkHaveVerifikator = !array_diff($allMkIds, $mkWithVerifikator);

                if ($allMkHaveVerifikator || $kelompokVerifikasi->isActive()) {
                    if ($allMkHaveVerifikator && !$kelompokVerifikasi->isActive()) {
                        // Semua MK sudah punya verifikator → aktifkan kelompok
                        $kelompokVerifikasi->update([
                            'status' => KelompokVerifikasi::STATUS_ACTIVE,
                        ]);
                    }

                    // Sync semua penugasan operasional (koordinator + verifikator)
                    $superAdminController = new \App\Http\Controllers\SuperAdmin\KelompokVerifikasiController();
                    $superAdminController->syncOperationalAssignmentsPublic($kelompokVerifikasi, $user->id);

                    // Notifikasi Super Admin jika baru aktif pertama kali
                    if (!$wasActive) {
                        $superAdmins = User::where('role', 'SUPER_ADMIN')->get();
                        foreach ($superAdmins as $admin) {
                            Notification::create([
                                'id'      => (string) Str::uuid(),
                                'user_id' => $admin->id,
                                'title'   => 'Kelompok Verifikasi Aktif',
                                'message' => "Koordinator {$dosen->nama_lengkap} telah menentukan verifikator untuk kelompok \"{$kelompokVerifikasi->nama}\". Status kelompok berubah menjadi Aktif.",
                            ]);
                        }
                    }
                } else {
                    // Baru sebagian MK yang punya verifikator — update timestamp updated_at
                    $kelompokVerifikasi->touch();
                }

                // Notifikasi ke verifikator yang baru ditunjuk
                $newVerifikatorDosenIds = collect($validated['mata_kuliah_assignments'])
                    ->flatMap(fn($mk) => $mk['verifikator_ids'])
                    ->unique()
                    ->values();

                foreach ($newVerifikatorDosenIds as $vDosenId) {
                    $vDosen = Dosen::with('user')->find($vDosenId);
                    if ($vDosen && $vDosen->user_id) {
                        // Kumpulkan MK yang ditugaskan ke verifikator ini
                        $mkNamaList = collect($validated['mata_kuliah_assignments'])
                            ->filter(fn($mk) => in_array($vDosenId, $mk['verifikator_ids']))
                            ->map(fn($mk) => \App\Models\MataKuliah::find($mk['mata_kuliah_id'])?->nama_mk ?? '-')
                            ->implode(', ');

                        Notification::create([
                            'id'      => (string) Str::uuid(),
                            'user_id' => $vDosen->user_id,
                            'title'   => 'Penugasan Verifikator Soal',
                            'message' => "Anda ditunjuk sebagai Verifikator Soal untuk mata kuliah {$mkNamaList} dalam kelompok verifikasi \"{$kelompokVerifikasi->nama}\".",
                        ]);
                    }
                }

                // Catat ke audit log
                AuditLog::record(
                    $user->id,
                    $wasActive ? 'UPDATE_VERIFIKATOR' : 'TENTUKAN_VERIFIKATOR',
                    'KelompokVerifikasi',
                    $kelompokVerifikasi->id,
                    ['status' => $kelompokVerifikasi->status],
                    [
                        'status'           => $kelompokVerifikasi->fresh()->status,
                        'verifikator_ids'  => $newVerifikatorDosenIds->toArray(),
                        'koordinator_id'   => $dosen->id,
                        'koordinator_nama' => $dosen->nama_lengkap,
                        'description'      => $wasActive
                            ? "Koordinator {$dosen->nama_lengkap} memperbarui verifikator untuk kelompok {$kelompokVerifikasi->nama}"
                            : "Koordinator {$dosen->nama_lengkap} menentukan verifikator untuk kelompok {$kelompokVerifikasi->nama}",
                    ]
                );
            });
        } catch (\Throwable $e) {
            return back()->with('error', 'Terjadi kesalahan sistem: ' . $e->getMessage());
        }

        $freshStatus = $kelompokVerifikasi->fresh()->status;
        $successMsg = $wasActive
            ? 'Dosen verifikator berhasil diperbarui.'
            : ($freshStatus === KelompokVerifikasi::STATUS_ACTIVE
                ? 'Verifikator berhasil ditentukan! Kelompok verifikasi sekarang aktif.'
                : 'Verifikator berhasil ditentukan untuk mata kuliah Anda. Menunggu koordinator MK lain menyelesaikan penugasan.');

        return redirect()->route('koordinator.kelompok-verifikasi.index')
            ->with('success', $successMsg);
    }
}
