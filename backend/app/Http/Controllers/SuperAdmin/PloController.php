<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Exports\PloExport;
use App\Http\Controllers\Controller;
use App\Imports\PloImport;
use App\Models\AuditLog;
use App\Models\ImportLog;
use App\Models\Plo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class PloController extends Controller
{
    public function index(Request $request)
    {
        $query = Plo::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('kode_plo', 'ilike', "%{$request->search}%")
                  ->orWhere('deskripsi', 'ilike', "%{$request->search}%");
            });
        }

        $ploList = $query->orderBy('kode_plo', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('SuperAdmin/PLO/Index', [
            'ploList' => $ploList,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_plo'  => ['required', 'string', 'max:50', 'unique:plo,kode_plo'],
            'deskripsi' => ['required', 'string'],
        ]);

        $plo = Plo::create([
            'id'        => (string) Str::uuid(),
            'kode_plo'  => $validated['kode_plo'],
            'deskripsi' => $validated['deskripsi'],
        ]);

        AuditLog::record($request->user()->id, 'CREATE_PLO', 'Plo', $plo->id, null, $plo->toArray());

        return redirect()->back()->with('success', 'Data PLO berhasil ditambahkan.');
    }

    public function update(Request $request, Plo $plo)
    {
        $validated = $request->validate([
            'kode_plo'  => ['required', 'string', 'max:50', 'unique:plo,kode_plo,' . $plo->id],
            'deskripsi' => ['required', 'string'],
        ]);

        $oldValues = $plo->toArray();
        $plo->update($validated);

        AuditLog::record($request->user()->id, 'UPDATE_PLO', 'Plo', $plo->id, $oldValues, $plo->toArray());

        return redirect()->back()->with('success', 'Data PLO berhasil diperbarui.');
    }

    public function destroy(Request $request, Plo $plo)
    {
        $oldValues = $plo->toArray();
        $plo->delete();

        AuditLog::record($request->user()->id, 'DELETE_PLO', 'Plo', $plo->id, $oldValues, null);

        return redirect()->back()->with('success', 'Data PLO berhasil dihapus.');
    }

    public function export()
    {
        return Excel::download(new PloExport, 'master-plo-' . date('Y-m-d') . '.xlsx');
    }

    public function template()
    {
        return response()->streamDownload(function () {
            echo "kode_plo,deskripsi\nPLO01,Mampu menerapkan pengetahuan matematika dan sains.\nPLO02,Mampu merancang eksperimen dan menganalisis data.";
        }, 'template-import-plo.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:5120'],
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();

        $importLog = ImportLog::create([
            'id'           => (string) Str::uuid(),
            'user_id'      => $request->user()->id,
            'type'         => 'PLO',
            'file_name'    => $fileName,
            'status'       => 'PROCESSING',
            'total_rows'   => 0,
            'success_rows' => 0,
            'failed_rows'  => 0,
        ]);

        try {
            DB::beginTransaction();
            Excel::import(new PloImport, $file);
            DB::commit();

            $importLog->update([
                'status'       => 'SUCCESS',
                'success_rows' => Plo::count(),
            ]);

            return redirect()->back()->with('success', 'Import PLO berhasil diproses.');
        } catch (\Exception $e) {
            DB::rollBack();
            $importLog->update([
                'status'        => 'FAILED',
                'error_summary' => ['error' => $e->getMessage()],
            ]);

            return redirect()->back()->with('error', 'Gagal mengimpor PLO: ' . $e->getMessage());
        }
    }
}
