<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Clo;
use App\Models\MataKuliah;
use App\Models\Plo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MataKuliahController extends Controller
{
    public function index(Request $request)
    {
        $query = MataKuliah::with(['plo', 'clo']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $term = "%{$request->search}%";
                $q->whereRaw('LOWER(nama_mk) LIKE ?', [strtolower($term)])
                  ->orWhereRaw('LOWER(nama_mk_en) LIKE ?', [strtolower($term)])
                  ->orWhereRaw('LOWER(kode_mk) LIKE ?', [strtolower($term)]);
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->semester) {
            $query->where('semester', $request->semester);
        }

        $mataKuliahList = $query->orderBy('semester', 'asc')
            ->orderBy('kode_mk', 'asc')
            ->paginate(10)
            ->withQueryString();

        $allPlo = Plo::orderBy('kode_plo', 'asc')->get();
        $allClo = Clo::with('plo')->orderBy('kode_clo', 'asc')->get();

        return Inertia::render('SuperAdmin/MataKuliah/Index', [
            'mataKuliahList' => $mataKuliahList,
            'allPlo'          => $allPlo,
            'allClo'          => $allClo,
            'filters'         => $request->only(['search', 'status', 'semester']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_mk'    => ['required', 'string', 'max:50', 'unique:mata_kuliah,kode_mk'],
            'nama_mk'    => ['required', 'string', 'max:200'],
            'nama_mk_en' => ['nullable', 'string', 'max:200'],
            'sks'        => ['required', 'integer', 'min:1', 'max:10'],
            'semester'   => ['required', 'integer', 'min:1', 'max:14'],
            'plo_ids'    => ['array'],
            'plo_ids.*'  => ['exists:plo,id'],
            'clo_ids'    => ['array'],
            'clo_ids.*'  => ['exists:clo,id'],
        ]);

        $mk = MataKuliah::create([
            'id'         => (string) Str::uuid(),
            'kode_mk'    => $validated['kode_mk'],
            'nama_mk'    => $validated['nama_mk'],
            'nama_mk_en' => $validated['nama_mk_en'] ?? null,
            'sks'        => $validated['sks'],
            'semester'   => $validated['semester'],
            'status'     => 'ACTIVE',
        ]);

        if (isset($validated['clo_ids'])) {
            $mk->clo()->sync($validated['clo_ids']);
            $mk->syncPlosFromClos();
        } elseif (!empty($validated['plo_ids'])) {
            $mk->plo()->sync($validated['plo_ids']);
        }

        AuditLog::record(
            $request->user()->id,
            'CREATE_MATA_KULIAH',
            'MataKuliah',
            $mk->id,
            null,
            $mk->toArray()
        );

        return redirect()->back()->with('success', 'Mata Kuliah berhasil ditambahkan.');
    }

    public function update(Request $request, MataKuliah $mataKuliah)
    {
        $validated = $request->validate([
            'kode_mk'    => ['required', 'string', 'max:50', 'unique:mata_kuliah,kode_mk,' . $mataKuliah->id],
            'nama_mk'    => ['required', 'string', 'max:200'],
            'nama_mk_en' => ['nullable', 'string', 'max:200'],
            'sks'        => ['required', 'integer', 'min:1', 'max:10'],
            'semester'   => ['required', 'integer', 'min:1', 'max:14'],
            'status'     => ['required', 'in:ACTIVE,INACTIVE'],
            'plo_ids'    => ['nullable', 'array'],
            'plo_ids.*'  => ['exists:plo,id'],
            'clo_ids'    => ['nullable', 'array'],
            'clo_ids.*'  => ['exists:clo,id'],
        ]);

        $oldValues = $mataKuliah->toArray();
        $mataKuliah->update([
            'kode_mk'    => $validated['kode_mk'],
            'nama_mk'    => $validated['nama_mk'],
            'nama_mk_en' => $validated['nama_mk_en'] ?? null,
            'sks'        => $validated['sks'],
            'semester'   => $validated['semester'],
            'status'     => $validated['status'],
        ]);

        if (isset($validated['clo_ids'])) {
            $mataKuliah->clo()->sync($validated['clo_ids']);
            $mataKuliah->syncPlosFromClos();
        } elseif (isset($validated['plo_ids'])) {
            $mataKuliah->plo()->sync($validated['plo_ids']);
        }

        AuditLog::record(
            $request->user()->id,
            'UPDATE_MATA_KULIAH',
            'MataKuliah',
            $mataKuliah->id,
            $oldValues,
            $mataKuliah->toArray()
        );

        return redirect()->route('superadmin.mata-kuliah.index')->with('success', 'Pemetaan PLO & CLO Mata Kuliah berhasil diperbarui.');
    }

    public function show(MataKuliah $mataKuliah)
    {
        $mataKuliah->load([
            'plo.clo',
            'clo.plo',
            'penugasanKoordinator.dosen'
        ]);

        $allPlo = Plo::orderBy('kode_plo', 'asc')->get();
        $allClo = Clo::with('plo')->orderBy('kode_clo', 'asc')->get();
        $allMataKuliah = MataKuliah::orderBy('kode_mk', 'asc')->get(['id', 'kode_mk', 'nama_mk', 'sks', 'semester', 'status']);

        return Inertia::render('SuperAdmin/MataKuliah/Show', [
            'mataKuliah'    => $mataKuliah,
            'allPlo'        => $allPlo,
            'allClo'        => $allClo,
            'allMataKuliah' => $allMataKuliah,
        ]);
    }

    public function destroy(Request $request, MataKuliah $mataKuliah)
    {
        $oldValues = $mataKuliah->toArray();
        $mataKuliah->delete();

        AuditLog::record(
            $request->user()->id,
            'DELETE_MATA_KULIAH',
            'MataKuliah',
            $mataKuliah->id,
            $oldValues,
            null
        );

        return redirect()->back()->with('success', 'Mata Kuliah berhasil dihapus.');
    }
}
