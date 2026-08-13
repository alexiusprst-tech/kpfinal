<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Exports\CloExport;
use App\Http\Controllers\Controller;
use App\Imports\CloImport;
use App\Models\AuditLog;
use App\Models\Clo;
use App\Models\ImportLog;
use App\Models\Plo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class CloController extends Controller
{
    public function index(Request $request)
    {
        $query = Clo::with('plo');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('kode_clo', 'ilike', "%{$request->search}%")
                  ->orWhere('deskripsi', 'ilike', "%{$request->search}%");
            });
        }

        $cloList = $query->orderBy('kode_clo', 'asc')->paginate(10)->withQueryString();
        $allPlo = Plo::orderBy('kode_plo', 'asc')->get();

        return Inertia::render('SuperAdmin/CLO/Index', [
            'cloList' => $cloList,
            'allPlo'  => $allPlo,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_clo'  => ['required', 'string', 'max:50', 'unique:clo,kode_clo'],
            'deskripsi' => ['required', 'string'],
            'plo_ids'   => ['array'],
            'plo_ids.*' => ['exists:plo,id'],
        ]);

        $clo = Clo::create([
            'id'        => (string) Str::uuid(),
            'kode_clo'  => $validated['kode_clo'],
            'deskripsi' => $validated['deskripsi'],
        ]);

        if (!empty($validated['plo_ids'])) {
            $clo->plo()->sync($validated['plo_ids']);
        }

        AuditLog::record($request->user()->id, 'CREATE_CLO', 'Clo', $clo->id, null, $clo->toArray());

        return redirect()->back()->with('success', 'Data CLO berhasil ditambahkan.');
    }

    public function update(Request $request, Clo $clo)
    {
        $validated = $request->validate([
            'kode_clo'  => ['required', 'string', 'max:50', 'unique:clo,kode_clo,' . $clo->id],
            'deskripsi' => ['required', 'string'],
            'plo_ids'   => ['array'],
            'plo_ids.*' => ['exists:plo,id'],
        ]);

        $oldValues = $clo->toArray();
        $clo->update(['kode_clo' => $validated['kode_clo'], 'deskripsi' => $validated['deskripsi']]);
        $clo->plo()->sync($validated['plo_ids'] ?? []);

        AuditLog::record($request->user()->id, 'UPDATE_CLO', 'Clo', $clo->id, $oldValues, $clo->toArray());

        return redirect()->back()->with('success', 'Data CLO berhasil diperbarui.');
    }

    public function destroy(Request $request, Clo $clo)
    {
        $oldValues = $clo->toArray();
        $clo->delete();
        AuditLog::record($request->user()->id, 'DELETE_CLO', 'Clo', $clo->id, $oldValues, null);
        return redirect()->back()->with('success', 'Data CLO berhasil dihapus.');
    }

    public function export()
    {
        return Excel::download(new CloExport, 'master-clo-' . date('Y-m-d') . '.xlsx');
    }

    public function template()
    {
        return response()->streamDownload(function () {
            echo "kode_clo,deskripsi\nCLO01,Mampu memahami konsep dasar pemrograman.\nCLO02,Mampu mengimplementasikan algoritma.";
        }, 'template-import-clo.csv', ['Content-Type' => 'text/csv']);
    }

    public function import(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:5120']]);

        $file     = $request->file('file');
        $fileName = $file->getClientOriginalName();

        $importLog = ImportLog::create([
            'id'       => (string) Str::uuid(),
            'user_id'  => $request->user()->id,
            'type'     => 'CLO',
            'file_name'=> $fileName,
            'status'   => 'PROCESSING',
            'total_rows'   => 0,
            'success_rows' => 0,
            'failed_rows'  => 0,
        ]);

        try {
            DB::beginTransaction();
            Excel::import(new CloImport, $file);
            DB::commit();
            $importLog->update(['status' => 'SUCCESS']);
            return redirect()->back()->with('success', 'Import CLO berhasil diproses.');
        } catch (\Exception $e) {
            DB::rollBack();
            $importLog->update(['status' => 'FAILED', 'error_summary' => ['error' => $e->getMessage()]]);
            return redirect()->back()->with('error', 'Gagal mengimpor CLO: ' . $e->getMessage());
        }
    }
}
