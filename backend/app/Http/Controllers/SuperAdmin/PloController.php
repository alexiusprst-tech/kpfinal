<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Exports\PloExport;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ImportLog;
use App\Models\Plo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

class PloController extends Controller
{
    public function index(Request $request)
    {
        $query = Plo::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $term = "%{$request->search}%";
                $q->whereRaw('LOWER(kode_plo) LIKE ?', [strtolower($term)])
                  ->orWhereRaw('LOWER(deskripsi) LIKE ?', [strtolower($term)]);
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

    /**
     * Download template Excel untuk import PLO
     */
    public function template()
    {
        $filePath = storage_path('app/templates/template-plo.xlsx');

        if (!file_exists($filePath)) {
            return redirect()->back()->with('error', 'File template PLO tidak ditemukan.');
        }

        return response()->download($filePath, 'Template PLO.xlsx', [
            'Content-Type'  => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma'        => 'no-cache',
            'Expires'       => '0',
        ]);
    }

    /**
     * Preview import - baca file, validasi, kembalikan data (TANPA simpan ke DB)
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:5120'],
        ]);

        $file = $request->file('file');
        $rows = [];
        $errors = [];

        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $data = $sheet->toArray(null, true, true, false);

            if (empty($data) || count($data) < 2) {
                return response()->json(['success' => false, 'message' => 'File kosong atau tidak ada data selain header.'], 422);
            }

            // Normalisasi header (baris pertama)
            $header = array_map(fn($h) => strtolower(trim((string)$h)), $data[0]);
            $kodePloIdx = array_search('kode plo', $header);
            if ($kodePloIdx === false) {
                $kodePloIdx = array_search('kode_plo', $header);
            }
            $deskripsiIdx = null;
            foreach ($header as $i => $h) {
                if (str_contains($h, 'program learning') || str_contains($h, 'capaian') || str_contains($h, 'deskripsi')) {
                    $deskripsiIdx = $i;
                    break;
                }
            }

            if ($kodePloIdx === false || $deskripsiIdx === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Header tidak sesuai. Pastikan ada kolom "KODE PLO" dan "Program Learning Outcome / Capaian Pembelajaran".'
                ], 422);
            }

            $existingCodes = Plo::pluck('kode_plo')->map(fn($k) => strtoupper($k))->toArray();
            $seenCodes = [];

            foreach ($data as $rowIndex => $row) {
                if ($rowIndex === 0) continue; // skip header

                $kode = strtoupper(trim((string)($row[$kodePloIdx] ?? '')));
                $deskripsi = trim((string)($row[$deskripsiIdx] ?? ''));
                $rowNum = $rowIndex + 1;
                $rowErrors = [];

                if ($kode === '' && $deskripsi === '') continue; // baris kosong, skip

                if ($kode === '') {
                    $rowErrors[] = 'Kode PLO tidak boleh kosong';
                } elseif (!preg_match('/^PLO\d+$/i', $kode)) {
                    $rowErrors[] = 'Format kode PLO tidak valid (contoh: PLO01)';
                }

                if ($deskripsi === '') {
                    $rowErrors[] = 'Deskripsi tidak boleh kosong';
                }

                $isDuplicate = false;
                if ($kode !== '') {
                    if (in_array($kode, $seenCodes)) {
                        $rowErrors[] = "Kode {$kode} duplikat dalam file";
                        $isDuplicate = true;
                    }
                    $seenCodes[] = $kode;
                }

                $isExisting = in_array($kode, $existingCodes);

                $rows[] = [
                    'row'       => $rowNum,
                    'kode_plo'  => $kode,
                    'deskripsi' => $deskripsi,
                    'is_valid'  => empty($rowErrors),
                    'is_existing' => $isExisting, // akan diupdate jika sudah ada
                    'errors'    => $rowErrors,
                ];

                if (!empty($rowErrors)) {
                    foreach ($rowErrors as $err) {
                        $errors[] = "Baris {$rowNum}: {$err}";
                    }
                }
            }

            return response()->json([
                'success'    => true,
                'rows'       => $rows,
                'totalRows'  => count($rows),
                'validRows'  => count(array_filter($rows, fn($r) => $r['is_valid'])),
                'errorRows'  => count(array_filter($rows, fn($r) => !$r['is_valid'])),
                'errors'     => $errors,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal membaca file: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Confirm import - simpan data batch yang sudah diedit user ke DB
     */
    public function confirmImport(Request $request)
    {
        $request->validate([
            'rows'              => ['required', 'array', 'min:1'],
            'rows.*.kode_plo'   => ['nullable', 'string', 'max:50'],
            'rows.*.deskripsi'  => ['nullable', 'string'],
            // replace_missing: jika true, PLO di DB yang tidak ada di file ini akan di-soft-delete
            'replace_missing'   => ['sometimes', 'boolean'],
        ]);

        $importLog = ImportLog::create([
            'id'           => (string) Str::uuid(),
            'user_id'      => $request->user()->id,
            'type'         => 'PLO',
            'file_name'    => 'manual-confirm-' . date('Y-m-d'),
            'status'       => 'PROCESSING',
            'total_rows'   => count($request->rows),
            'success_rows' => 0,
            'failed_rows'  => 0,
        ]);

        try {
            DB::beginTransaction();

            $successCount = 0;
            $importedKodes = [];
            foreach ($request->rows as $row) {
                $kode = strtoupper(trim($row['kode_plo']));
                $deskripsi = trim($row['deskripsi']);

                if ($kode === '' || $deskripsi === '') continue;

                $plo = Plo::withTrashed()->where('kode_plo', $kode)->first();

                if ($plo) {
                    if ($plo->trashed()) {
                        $plo->restore();
                    }
                    $oldValues = $plo->toArray();
                    $plo->update(['deskripsi' => $deskripsi]);
                    AuditLog::record($request->user()->id, 'UPDATE_PLO', 'Plo', $plo->id, $oldValues, $plo->toArray());
                } else {
                    $plo = Plo::create([
                        'kode_plo'  => $kode,
                        'deskripsi' => $deskripsi,
                    ]);
                    AuditLog::record($request->user()->id, 'CREATE_PLO', 'Plo', $plo->id, null, $plo->toArray());
                }
                $importedKodes[] = $kode;
                $successCount++;
            }

            // Opsional full-replace: soft-delete PLO yang TIDAK ada di file import
            // Hanya dilakukan jika replace_missing=true (opt-in, default: false agar import parsial aman)
            if ($request->boolean('replace_missing', false)) {
                $plosToDelete = Plo::whereNotIn('kode_plo', $importedKodes)->get();
                foreach ($plosToDelete as $plo) {
                    $oldValues = $plo->toArray();
                    $plo->delete();
                    AuditLog::record($request->user()->id, 'DELETE_PLO', 'Plo', $plo->id, $oldValues, null);
                }
            }

            DB::commit();

            $importLog->update([
                'status'       => 'SUCCESS',
                'success_rows' => $successCount,
            ]);

            return redirect()->route('superadmin.plo.index')->with('success', "Import PLO berhasil! {$successCount} data telah tersimpan.");

        } catch (\Exception $e) {
            DB::rollBack();
            $importLog->update(['status' => 'FAILED', 'error_summary' => ['error' => $e->getMessage()]]);
            return redirect()->back()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
        }
    }

    /**
     * Import langsung (legacy - tidak dipakai lagi di UI baru, tetap tersedia)
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:5120'],
        ]);

        // Redirect ke preview flow baru
        return $this->preview($request);
    }
}
