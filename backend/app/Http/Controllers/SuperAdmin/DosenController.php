<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dosen;
use App\Models\Notification;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DosenController extends Controller
{
    public function index(Request $request)
    {
        $query = Dosen::with([
            'user',
            'penugasanKoordinator' => function ($q) {
                $q->where('status', 'ACTIVE')->with(['mataKuliah', 'periode', 'kelompok']);
            },
            'penugasanVerifikator' => function ($q) {
                $q->where('status', 'ACTIVE')->with(['mataKuliah', 'periode', 'kelompok']);
            },
        ])
        ->withCount([
            'penugasanKoordinator as active_koordinator_count' => function ($q) {
                $q->where('status', 'ACTIVE');
            },
            'penugasanVerifikator as active_verifikator_count' => function ($q) {
                $q->where('status', 'ACTIVE');
            },
        ]);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $term = "%{$request->search}%";
                $q->whereRaw('LOWER(nama_lengkap) LIKE ?', [strtolower($term)])
                  ->orWhereRaw('LOWER(kode_dosen) LIKE ?', [strtolower($term)])
                  ->orWhereRaw('LOWER(email) LIKE ?', [strtolower($term)]);
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->kategori) {
            $query->where('kategori_dosen', $request->kategori);
        }

        $dosenList = $query->orderBy('kode_dosen', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('SuperAdmin/Dosen/Index', [
            'dosenList' => $dosenList,
            'filters'   => $request->only(['search', 'status', 'kategori']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_dosen'     => ['required', 'string', 'max:50', 'unique:dosen,kode_dosen'],
            'nama_lengkap'   => ['required', 'string', 'max:150'],
            'email'          => ['nullable', 'email', 'max:150'],
            'kategori_dosen' => ['nullable', 'string', 'max:50'],
            'create_user'    => ['boolean'],
        ]);

        $userId = null;

        if ($request->create_user && !empty($validated['email'])) {
            $emailClean = strtolower(trim($validated['email']));
            $existingUser = User::whereRaw('LOWER(email) = ?', [$emailClean])->first();

            if ($existingUser) {
                $linkedDosen = Dosen::withTrashed()->where('user_id', $existingUser->id)->first();
                if ($linkedDosen) {
                    if ($linkedDosen->trashed()) {
                        // Unlink soft-deleted dosen so unique constraint on user_id is satisfied
                        $linkedDosen->update(['user_id' => null]);
                        $userId = $existingUser->id;
                    } else {
                        return redirect()->back()->withErrors([
                            'email' => "Email {$validated['email']} sudah terdaftar untuk pengguna/dosen lain ({$linkedDosen->nama_lengkap}).",
                        ])->withInput();
                    }
                } else {
                    $userId = $existingUser->id;
                }
            } else {
                $isLB = in_array(strtoupper(trim($validated['kategori_dosen'] ?? '')), ['LB', 'LUAR_BIASA', 'DOSEN LUAR BIASA']);
                $createdUser = User::create([
                    'name'                 => $validated['nama_lengkap'],
                    'email'                => $validated['email'],
                    'password'             => Hash::make('password'),
                    'role'                 => null, // Belum ada penugasan, role null
                    'status'               => 'ACTIVE',
                    'must_change_password' => $isLB,
                ]);
                $userId = $createdUser->id;
            }
        }

        $dosen = Dosen::create([
            'id'             => (string) Str::uuid(),
            'kode_dosen'     => $validated['kode_dosen'],
            'nama_lengkap'   => $validated['nama_lengkap'],
            'email'          => $validated['email'] ?? null,
            'kategori_dosen' => $validated['kategori_dosen'] ?? 'Dosen Tetap',
            'user_id'        => $userId,
            'status'         => 'ACTIVE',
        ]);

        AuditLog::record(
            $request->user()->id,
            'CREATE_DOSEN',
            'Dosen',
            $dosen->id,
            null,
            $dosen->toArray()
        );

        return redirect()->back()->with('success', 'Data Dosen berhasil ditambahkan.');
    }

    public function update(Request $request, Dosen $dosen)
    {
        $validated = $request->validate([
            'kode_dosen'     => ['required', 'string', 'max:50', 'unique:dosen,kode_dosen,' . $dosen->id],
            'nama_lengkap'   => ['required', 'string', 'max:150'],
            'email'          => ['nullable', 'email', 'max:150'],
            'kategori_dosen' => ['nullable', 'string', 'max:50'],
            'status'         => ['required', 'in:ACTIVE,INACTIVE'],
        ]);

        if ($dosen->user && !empty($validated['email'])) {
            $existingOtherUser = User::whereRaw('LOWER(email) = ?', [strtolower(trim($validated['email']))])
                ->where('id', '!=', $dosen->user->id)
                ->first();
            if ($existingOtherUser) {
                return redirect()->back()->withErrors([
                    'email' => "Email {$validated['email']} sudah digunakan oleh akun lain.",
                ])->withInput();
            }
        }

        $oldValues = $dosen->toArray();
        $dosen->update($validated);

        if ($dosen->user) {
            $dosen->user->update([
                'name'   => $validated['nama_lengkap'],
                'email'  => $validated['email'] ?? $dosen->user->email,
                'status' => $validated['status'],
            ]);
        }

        AuditLog::record(
            $request->user()->id,
            'UPDATE_DOSEN',
            'Dosen',
            $dosen->id,
            $oldValues,
            $dosen->toArray()
        );

        return redirect()->back()->with('success', 'Data Dosen berhasil diperbarui.');
    }

    public function destroy(Request $request, Dosen $dosen)
    {
        $oldValues = $dosen->toArray();
        $dosen->delete();

        AuditLog::record(
            $request->user()->id,
            'DELETE_DOSEN',
            'Dosen',
            $dosen->id,
            $oldValues,
            null
        );

        return redirect()->back()->with('success', 'Data Dosen berhasil dihapus.');
    }

    /**
     * Revoke active assignment(s) for a lecturer (Koordinator / Verifikator / All / Specific)
     */
    public function cabutPenugasan(Request $request, Dosen $dosen)
    {
        $validated = $request->validate([
            'type'           => ['required', 'in:ALL,KOORDINATOR,VERIFIKATOR,SPECIFIC'],
            'penugasan_id'   => ['nullable', 'string'],
            'penugasan_type' => ['nullable', 'in:KOORDINATOR,VERIFIKATOR'],
        ]);

        DB::transaction(function () use ($dosen, $validated, $request) {
            $type = $validated['type'];
            $endedKoor = 0;
            $endedVerif = 0;

            if ($type === 'ALL') {
                $endedKoor = PenugasanKoordinator::where('dosen_id', $dosen->id)
                    ->where('status', 'ACTIVE')
                    ->update(['status' => 'ENDED']);

                $endedVerif = PenugasanVerifikator::where('dosen_id', $dosen->id)
                    ->where('status', 'ACTIVE')
                    ->update(['status' => 'ENDED']);

                \App\Models\KelompokKoordinator::where('dosen_id', $dosen->id)->delete();
                \App\Models\KelompokVerifikator::where('dosen_id', $dosen->id)->delete();
            } elseif ($type === 'KOORDINATOR') {
                $endedKoor = PenugasanKoordinator::where('dosen_id', $dosen->id)
                    ->where('status', 'ACTIVE')
                    ->update(['status' => 'ENDED']);

                \App\Models\KelompokKoordinator::where('dosen_id', $dosen->id)->delete();
            } elseif ($type === 'VERIFIKATOR') {
                $endedVerif = PenugasanVerifikator::where('dosen_id', $dosen->id)
                    ->where('status', 'ACTIVE')
                    ->update(['status' => 'ENDED']);

                \App\Models\KelompokVerifikator::where('dosen_id', $dosen->id)->delete();
            } elseif ($type === 'SPECIFIC' && !empty($validated['penugasan_id'])) {
                if ($validated['penugasan_type'] === 'KOORDINATOR') {
                    $pk = PenugasanKoordinator::find($validated['penugasan_id']);
                    if ($pk && $pk->kelompok_id) {
                        \App\Models\KelompokKoordinator::where('kelompok_id', $pk->kelompok_id)
                            ->where('mata_kuliah_id', $pk->mata_kuliah_id)
                            ->where('dosen_id', $dosen->id)
                            ->delete();
                    }

                    $endedKoor = PenugasanKoordinator::where('id', $validated['penugasan_id'])
                        ->where('dosen_id', $dosen->id)
                        ->where('status', 'ACTIVE')
                        ->update(['status' => 'ENDED']);
                } elseif ($validated['penugasan_type'] === 'VERIFIKATOR') {
                    $pv = PenugasanVerifikator::find($validated['penugasan_id']);
                    if ($pv && $pv->kelompok_id) {
                        \App\Models\KelompokVerifikator::where('kelompok_id', $pv->kelompok_id)
                            ->where('mata_kuliah_id', $pv->mata_kuliah_id)
                            ->where('dosen_id', $dosen->id)
                            ->delete();
                    }

                    $endedVerif = PenugasanVerifikator::where('id', $validated['penugasan_id'])
                        ->where('dosen_id', $dosen->id)
                        ->where('status', 'ACTIVE')
                        ->update(['status' => 'ENDED']);
                }
            }

            // Sync user role
            $remainingKoor = PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->count();
            $remainingVerif = PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->count();

            if ($dosen->user && $dosen->user->role !== 'SUPER_ADMIN') {
                if ($remainingKoor > 0) {
                    $dosen->user->update(['role' => 'KOORDINATOR']);
                } elseif ($remainingVerif > 0) {
                    $dosen->user->update(['role' => 'VERIFIKATOR']);
                } else {
                    $dosen->user->update(['role' => 'DOSEN']);
                }
            }

            // Send notification to dosen user if exists
            if ($dosen->user_id) {
                Notification::create([
                    'id'      => (string) Str::uuid(),
                    'user_id' => $dosen->user_id,
                    'title'   => 'Pencabutan Penugasan',
                    'message' => "Penugasan Anda ({$type}) telah dicabut oleh Super Admin.",
                ]);
            }

            AuditLog::record(
                $request->user()->id,
                'REVOKE_PENUGASAN_DOSEN',
                'Dosen',
                $dosen->id,
                ['type' => $type],
                [
                    'ended_koordinator' => $endedKoor,
                    'ended_verifikator' => $endedVerif,
                    'remaining_koor'    => $remainingKoor,
                    'remaining_verif'   => $remainingVerif,
                ]
            );
        });

        return redirect()->back()->with('success', "Penugasan untuk dosen {$dosen->nama_lengkap} berhasil dicabut.");
    }
}
