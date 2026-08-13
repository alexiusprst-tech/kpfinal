<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dosen;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DosenController extends Controller
{
    public function index(Request $request)
    {
        $query = Dosen::with('user')
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
                $q->where('nama_lengkap', 'ilike', "%{$request->search}%")
                  ->orWhere('kode_dosen', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->kategori) {
            $query->where('kategori_dosen', $request->kategori);
        }

        $dosenList = $query->orderBy('kode_dosen', 'asc')->paginate(15)->withQueryString();

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
            'role'           => ['nullable', 'in:KOORDINATOR,VERIFIKATOR'],
        ]);

        $userId = null;

        if ($request->create_user && $request->email) {
            $userId = (string) Str::uuid();
            User::create([
                'id'       => $userId,
                'name'     => $validated['nama_lengkap'],
                'email'    => $validated['email'],
                'password' => Hash::make('password'),
                'role'     => $request->role ?? 'KOORDINATOR',
                'status'   => 'ACTIVE',
            ]);
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
}
