<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dosen;
use App\Models\MataKuliah;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PenugasanVerifikatorController extends Controller
{
    public function index(Request $request)
    {
        $list = PenugasanVerifikator::with(['dosen', 'mataKuliah', 'periode', 'assignedBy'])
            ->when($request->periode_id, fn($q) => $q->where('periode_id', $request->periode_id))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $dosenAll   = Dosen::where('status', 'ACTIVE')->orderBy('kode_dosen')->get();
        $mkAll      = MataKuliah::where('status', 'ACTIVE')->orderBy('kode_mk')->get();
        $periodeAll = PeriodeVerifikasi::orderBy('created_at', 'desc')->get();

        return Inertia::render('SuperAdmin/PenugasanVerifikator/Index', [
            'list'       => $list,
            'dosenAll'   => $dosenAll,
            'mkAll'      => $mkAll,
            'periodeAll' => $periodeAll,
            'filters'    => $request->only(['periode_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'dosen_id'       => ['required', 'exists:dosen,id'],
            'mata_kuliah_id' => ['required', 'exists:mata_kuliah,id'],
            'periode_id'     => ['required', 'exists:periode_verifikasi,id'],
        ]);

        $item = PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $validated['dosen_id'],
            'mata_kuliah_id' => $validated['mata_kuliah_id'],
            'periode_id'     => $validated['periode_id'],
            'assigned_by'    => $request->user()->id,
            'status'         => 'ACTIVE',
        ]);

        $dosen = Dosen::find($validated['dosen_id']);
        if ($dosen && $dosen->user && $dosen->user->role !== 'SUPER_ADMIN') {
            $dosen->user->update(['role' => 'VERIFIKATOR']);
        }

        AuditLog::record($request->user()->id, 'CREATE_PENUGASAN_VERIFIKATOR', 'PenugasanVerifikator', $item->id, null, $item->toArray());
        return redirect()->back()->with('success', 'Penugasan Verifikator berhasil ditambahkan.');
    }

    public function destroy(Request $request, PenugasanVerifikator $penugasanVerifikator)
    {
        $old = $penugasanVerifikator->toArray();
        $penugasanVerifikator->update(['status' => 'ENDED']);
        AuditLog::record($request->user()->id, 'END_PENUGASAN_VERIFIKATOR', 'PenugasanVerifikator', $penugasanVerifikator->id, $old, null);
        return redirect()->back()->with('success', 'Penugasan Verifikator berhasil diakhiri.');
    }
}
