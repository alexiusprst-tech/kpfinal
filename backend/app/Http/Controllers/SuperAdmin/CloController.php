<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Exports\CloExport;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Clo;
use App\Models\ImportLog;
use App\Models\MataKuliah;
use App\Models\Plo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

class CloController extends Controller
{
    public function index(Request $request)
    {
        $query = Clo::with(['plo', 'mataKuliah']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $term = "%{$request->search}%";
                $q->whereRaw('LOWER(kode_clo) LIKE ?', [strtolower($term)])
                  ->orWhereRaw('LOWER(deskripsi) LIKE ?', [strtolower($term)])
                  ->orWhereHas('plo', function ($pq) use ($term) {
                      $pq->whereRaw('LOWER(kode_plo) LIKE ?', [strtolower($term)]);
                  });
            });
        }

        if ($request->filled('plo')) {
            $ploFilter = $request->plo;
            $query->whereHas('plo', function ($q) use ($ploFilter) {
                if (Str::isUuid($ploFilter)) {
                    $q->where('plo.id', $ploFilter)
                      ->orWhere('plo.kode_plo', $ploFilter);
                } else {
                    $q->where('plo.kode_plo', $ploFilter);
                }
            });
        }

        $cloList = $query->orderBy('kode_clo', 'asc')->paginate(10)->withQueryString();
        $allPlo  = Plo::orderBy('kode_plo', 'asc')->get();
        $allMk   = MataKuliah::orderBy('nama_mk', 'asc')->get(['id', 'kode_mk', 'nama_mk']);

        // Data flat mapping untuk tampilan detail per Mata Kuliah (seperti Excel)
        $flatQuery = Clo::with(['plo', 'mataKuliah'])->orderBy('kode_clo', 'asc');
        if ($request->filled('plo')) {
            $ploFilter = $request->plo;
            $flatQuery->whereHas('plo', function ($q) use ($ploFilter) {
                if (Str::isUuid($ploFilter)) {
                    $q->where('plo.id', $ploFilter)
                      ->orWhere('plo.kode_plo', $ploFilter);
                } else {
                    $q->where('plo.kode_plo', $ploFilter);
                }
            });
        }
        $allClosWithRelations = $flatQuery->get();
        $flatMappings = [];
        $no = 1;
        foreach ($allClosWithRelations as $c) {
            $ploString = $c->plo->pluck('kode_plo')->join(', ');
            if ($c->mataKuliah->isEmpty()) {
                $flatMappings[] = [
                    'no'        => $no++,
                    'plo'       => $ploString ?: '—',
                    'kode_clo'  => $c->kode_clo,
                    'deskripsi' => $c->deskripsi,
                    'bloom'     => $c->bloom,
                    'mk'        => '—',
                    'kode_mk'   => '—',
                ];
            } else {
                foreach ($c->mataKuliah as $mk) {
                    $flatMappings[] = [
                        'no'        => $no++,
                        'plo'       => $ploString ?: '—',
                        'kode_clo'  => $c->kode_clo,
                        'deskripsi' => $c->deskripsi,
                        'bloom'     => $c->bloom,
                        'mk'        => $mk->nama_mk,
                        'kode_mk'   => $mk->kode_mk,
                    ];
                }
            }
        }

        return Inertia::render('SuperAdmin/CLO/Index', [
            'cloList'       => $cloList,
            'allPlo'        => $allPlo,
            'allMk'         => $allMk,
            'flatMappings'  => $flatMappings,
            'totalMappings' => count($flatMappings),
            'filters'       => $request->only(['search', 'plo']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_clo'      => ['required', 'string', 'max:50'],
            'deskripsi'     => ['required', 'string'],
            'bloom'         => ['nullable', 'string', 'max:50'],
            'plo_ids'       => ['array'],
            'plo_ids.*'     => ['exists:plo,id'],
            'mk_ids'        => ['array'],
            'mk_ids.*'      => ['exists:mata_kuliah,id'],
        ]);

        $kodeClo = strtoupper(trim($validated['kode_clo']));
        if (!empty($validated['plo_ids']) && !str_contains($kodeClo, '-')) {
            $firstPlo = Plo::find($validated['plo_ids'][0]);
            if ($firstPlo) {
                $kodeClo = $firstPlo->kode_plo . '-' . $kodeClo;
            }
        }

        $request->merge(['kode_clo' => $kodeClo]);
        $request->validate([
            'kode_clo' => ['unique:clo,kode_clo'],
        ], [
            'kode_clo.unique' => "Kode CLO '{$kodeClo}' sudah terdaftar.",
        ]);

        $clo = Clo::create([
            'id'        => (string) Str::uuid(),
            'kode_clo'  => $kodeClo,
            'deskripsi' => $validated['deskripsi'],
            'bloom'     => $validated['bloom'] ?? null,
        ]);

        if (!empty($validated['plo_ids'])) {
            $clo->plo()->sync($validated['plo_ids']);
        }
        if (!empty($validated['mk_ids'])) {
            $clo->mataKuliah()->sync($validated['mk_ids']);
            foreach ($validated['mk_ids'] as $mkId) {
                $mk = MataKuliah::find($mkId);
                if ($mk) {
                    $mk->syncPlosFromClos();
                }
            }
        }

        AuditLog::record($request->user()->id, 'CREATE_CLO', 'Clo', $clo->id, null, $clo->toArray());

        return redirect()->back()->with('success', 'Data CLO berhasil ditambahkan.');
    }

    public function update(Request $request, Clo $clo)
    {
        $validated = $request->validate([
            'kode_clo'      => ['required', 'string', 'max:50'],
            'deskripsi'     => ['required', 'string'],
            'bloom'         => ['nullable', 'string', 'max:50'],
            'plo_ids'       => ['array'],
            'plo_ids.*'     => ['exists:plo,id'],
            'mk_ids'        => ['array'],
            'mk_ids.*'      => ['exists:mata_kuliah,id'],
        ]);

        $kodeClo = strtoupper(trim($validated['kode_clo']));
        if (!empty($validated['plo_ids']) && !str_contains($kodeClo, '-')) {
            $firstPlo = Plo::find($validated['plo_ids'][0]);
            if ($firstPlo) {
                $kodeClo = $firstPlo->kode_plo . '-' . $kodeClo;
            }
        }

        $request->merge(['kode_clo' => $kodeClo]);
        $request->validate([
            'kode_clo' => ['unique:clo,kode_clo,' . $clo->id],
        ], [
            'kode_clo.unique' => "Kode CLO '{$kodeClo}' sudah digunakan oleh CLO lain.",
        ]);

        $affectedMkIds = array_unique(array_merge(
            $clo->mataKuliah()->pluck('mata_kuliah.id')->toArray(),
            $validated['mk_ids'] ?? []
        ));

        $oldValues = $clo->toArray();
        $clo->update([
            'kode_clo'  => $kodeClo,
            'deskripsi' => $validated['deskripsi'],
            'bloom'     => $validated['bloom'] ?? null,
        ]);
        $clo->plo()->sync($validated['plo_ids'] ?? []);
        $clo->mataKuliah()->sync($validated['mk_ids'] ?? []);

        foreach ($affectedMkIds as $mkId) {
            $mk = MataKuliah::find($mkId);
            if ($mk) {
                $mk->syncPlosFromClos();
            }
        }

        AuditLog::record($request->user()->id, 'UPDATE_CLO', 'Clo', $clo->id, $oldValues, $clo->toArray());

        return redirect()->back()->with('success', 'Data CLO berhasil diperbarui.');
    }

    public function destroy(Request $request, Clo $clo)
    {
        $affectedMkIds = $clo->mataKuliah()->pluck('mata_kuliah.id')->toArray();
        $oldValues = $clo->toArray();
        $clo->plo()->detach();
        $clo->mataKuliah()->detach();
        $clo->delete();

        foreach ($affectedMkIds as $mkId) {
            $mk = MataKuliah::find($mkId);
            if ($mk) {
                $mk->syncPlosFromClos();
            }
        }

        AuditLog::record($request->user()->id, 'DELETE_CLO', 'Clo', $clo->id, $oldValues, null);
        return redirect()->back()->with('success', 'Data CLO berhasil dihapus.');
    }

    public function export()
    {
        return Excel::download(new CloExport, 'master-clo-' . date('Y-m-d') . '.xlsx');
    }

    /**
     * Download template Excel untuk import CLO & Mapping
     */
    public function template()
    {
        $filePath = storage_path('app/templates/template-clo.xlsx');

        if (!file_exists($filePath)) {
            return redirect()->back()->with('error', 'File template CLO tidak ditemukan.');
        }

        return response()->download($filePath, 'Template CLO.xlsx', [
            'Content-Type'  => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma'        => 'no-cache',
            'Expires'       => '0',
        ]);
    }

    /**
     * Preview import CLO - baca file, validasi, kembalikan data (TANPA simpan ke DB)
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:5120'],
        ]);

        $file = $request->file('file');

        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $data = $sheet->toArray(null, true, true, false);

            if (empty($data) || count($data) < 2) {
                return response()->json(['success' => false, 'message' => 'File kosong atau tidak ada data selain header.'], 422);
            }

            // Normalisasi header
            $header = array_map(fn($h) => strtolower(trim((string)$h)), $data[0]);
            $ploIdx    = array_search('plo', $header);
            $kodeIdx   = array_search('kode clo', $header);
            if ($kodeIdx === false) $kodeIdx = array_search('kode_clo', $header);
            $cloIdx    = array_search('clo', $header);
            $bloomIdx  = array_search('bloom', $header);
            $mkIdx     = array_search('mk', $header);
            if ($mkIdx === false) $mkIdx = array_search('mata kuliah', $header);
            if ($mkIdx === false) $mkIdx = array_search('mata_kuliah', $header);

            // Validasi header wajib
            $missingHeaders = [];
            if ($ploIdx === false)   $missingHeaders[] = 'PLO';
            if ($kodeIdx === false)  $missingHeaders[] = 'Kode CLO';
            if ($cloIdx === false)   $missingHeaders[] = 'CLO';
            if ($bloomIdx === false) $missingHeaders[] = 'Bloom';
            if ($mkIdx === false)    $missingHeaders[] = 'MK';

            if (!empty($missingHeaders)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Header tidak sesuai. Kolom yang kurang: ' . implode(', ', $missingHeaders)
                ], 422);
            }

            // Load data referensi
            $validPlo = Plo::pluck('kode_plo')->map(fn($k) => strtoupper($k))->toArray();
            $validMk  = MataKuliah::pluck('nama_mk')->map(fn($m) => strtolower(trim($m)))->toArray();

            $bloomOptions = ['1', '2', '3', '4', '5', '6',
                             '1 - remember', '2 - understand', '3 - apply',
                             '4 - analyze', '4 - analyse', '5 - evaluate', '6 - create'];

            $rows = [];
            $errors = [];
            $seenCloKeys = [];

            foreach ($data as $rowIndex => $row) {
                if ($rowIndex === 0) continue;

                $ploVal    = strtoupper(trim((string)($row[$ploIdx] ?? '')));
                $rawKode   = strtoupper(trim((string)($row[$kodeIdx] ?? '')));
                $deskripsi = trim((string)($row[$cloIdx] ?? ''));
                $bloom     = trim((string)($row[$bloomIdx] ?? ''));
                $mk        = trim((string)($row[$mkIdx] ?? ''));
                $rowNum    = $rowIndex + 1;
                $rowErrors = [];

                // Skip row if completely empty
                if ($ploVal === '' && $rawKode === '' && $deskripsi === '') continue;

                // Normalize kode_clo to [PLO]-[CLO]
                $kode = $rawKode;
                if ($ploVal !== '' && $rawKode !== '') {
                    if (!str_starts_with($rawKode, $ploVal . '-')) {
                        if (!str_contains($rawKode, '-')) {
                            $kode = $ploVal . '-' . $rawKode;
                        }
                    }
                }

                // Fallback to default descriptions if not provided in Excel
                if ($deskripsi === '' && $kode !== '') {
                    $existingClo = Clo::where('kode_clo', $kode)->first();
                    if ($existingClo) {
                        $deskripsi = $existingClo->deskripsi;
                    }
                }

                // Validasi PLO
                if ($ploVal === '') {
                    $rowErrors[] = 'PLO tidak boleh kosong';
                } elseif (!in_array($ploVal, $validPlo)) {
                    $rowErrors[] = "PLO '{$ploVal}' tidak ditemukan di master data";
                }

                // Validasi Kode CLO
                if ($rawKode === '') {
                    $rowErrors[] = 'Kode CLO tidak boleh kosong';
                }

                // Validasi deskripsi CLO
                if ($deskripsi === '') {
                    $rowErrors[] = 'Deskripsi CLO tidak boleh kosong';
                }

                // Validasi Bloom
                if ($bloom === '') {
                    $rowErrors[] = 'Bloom tidak boleh kosong';
                } elseif (!in_array(strtolower($bloom), $bloomOptions)) {
                    $rowErrors[] = "Bloom '{$bloom}' tidak valid. Gunakan format: '4 - Analyze'";
                }

                // Validasi Mata Kuliah (dapat berisi multiple MK dipisahkan dengan ';')
                if ($mk === '') {
                    $rowErrors[] = 'Mata Kuliah tidak boleh kosong';
                } else {
                    $individualMks = array_filter(array_map('trim', explode(';', $mk)));
                    if (empty($individualMks)) {
                        $rowErrors[] = 'Mata Kuliah tidak boleh kosong';
                    } else {
                        foreach ($individualMks as $indMk) {
                            if (!in_array(strtolower($indMk), $validMk)) {
                                $rowErrors[] = "Mata Kuliah '{$indMk}' tidak ditemukan di master data";
                            }
                        }
                    }
                }

                // Cek duplikasi CLO-MK pair
                $pairKey = "{$kode}|{$mk}";
                if (in_array($pairKey, $seenCloKeys)) {
                    $rowErrors[] = "Pasangan CLO '{$kode}' dan MK '{$mk}' duplikat dalam file";
                } else {
                    $seenCloKeys[] = $pairKey;
                }

                $rows[] = [
                    'row'       => $rowNum,
                    'plo'       => $ploVal,
                    'kode_clo'  => $kode,
                    'deskripsi' => $deskripsi,
                    'bloom'     => $bloom,
                    'mk'        => $mk,
                    'is_valid'  => empty($rowErrors),
                    'errors'    => $rowErrors,
                ];

                if (!empty($rowErrors)) {
                    foreach ($rowErrors as $err) {
                        $errors[] = "Baris {$rowNum}: {$err}";
                    }
                }
            }

            return response()->json([
                'success'   => true,
                'rows'      => $rows,
                'totalRows' => count($rows),
                'validRows' => count(array_filter($rows, fn($r) => $r['is_valid'])),
                'errorRows' => count(array_filter($rows, fn($r) => !$r['is_valid'])),
                'errors'    => $errors,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal membaca file: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Confirm import CLO - simpan data batch (CLO + PLO mapping + MK mapping)
     */
    public function confirmImport(Request $request)
    {
        $request->validate([
            'rows'             => ['required', 'array', 'min:1'],
            'rows.*.kode_clo'  => ['required', 'string', 'max:50'],
            'rows.*.deskripsi' => ['required', 'string'],
            'rows.*.bloom'     => ['nullable', 'string', 'max:50'],
            'rows.*.plo'       => ['nullable', 'string'],
            'rows.*.mk'        => ['nullable', 'string'],
        ]);

        $importLog = ImportLog::create([
            'id'           => (string) Str::uuid(),
            'user_id'      => $request->user()->id,
            'type'         => 'CLO',
            'file_name'    => 'manual-confirm-' . date('Y-m-d'),
            'status'       => 'PROCESSING',
            'total_rows'   => count($request->rows),
            'success_rows' => 0,
            'failed_rows'  => 0,
        ]);

        try {
            DB::beginTransaction();

            // Group by normalized kode_clo untuk upsert CLO sekali, kemudian sync relasi PLO & MK
            $grouped = [];
            foreach ($request->rows as $row) {
                $ploVal = strtoupper(trim($row['plo'] ?? ''));
                $kode   = strtoupper(trim($row['kode_clo'] ?? ''));
                if ($kode === '') continue;

                // Ensure PLO prefix
                if ($ploVal !== '' && !str_starts_with($kode, $ploVal . '-')) {
                    if (!str_contains($kode, '-')) {
                        $kode = $ploVal . '-' . $kode;
                    }
                }

                if (!isset($grouped[$kode])) {
                    $grouped[$kode] = [
                        'kode_clo'  => $kode,
                        'deskripsi' => trim($row['deskripsi'] ?? ''),
                        'bloom'     => trim($row['bloom'] ?? '') ?: null,
                        'plo_codes' => [],
                        'mk_names'  => [],
                    ];
                }

                $mkVal  = trim($row['mk'] ?? '');
                if ($ploVal && !in_array($ploVal, $grouped[$kode]['plo_codes'])) {
                    $grouped[$kode]['plo_codes'][] = $ploVal;
                }
                if ($mkVal !== '') {
                    $individualMks = array_filter(array_map('trim', explode(';', $mkVal)));
                    foreach ($individualMks as $indMk) {
                        if (!in_array($indMk, $grouped[$kode]['mk_names'])) {
                            $grouped[$kode]['mk_names'][] = $indMk;
                        }
                    }
                }
            }

            $successCount = 0;
            foreach ($grouped as $kode => $data) {
                // Upsert CLO
                $clo = Clo::withTrashed()->where('kode_clo', $kode)->first();
                if ($clo) {
                    if ($clo->trashed()) $clo->restore();
                    $clo->update(['deskripsi' => $data['deskripsi'], 'bloom' => $data['bloom']]);
                } else {
                    $clo = Clo::create([
                        'id'        => (string) Str::uuid(),
                        'kode_clo'  => $kode,
                        'deskripsi' => $data['deskripsi'],
                        'bloom'     => $data['bloom'],
                    ]);
                }

                // Sync PLO
                $ploIds = Plo::whereIn('kode_plo', $data['plo_codes'])->pluck('id')->toArray();
                $clo->plo()->sync($ploIds);

                // Sync Mata Kuliah
                $mkIds = MataKuliah::whereIn('nama_mk', $data['mk_names'])->pluck('id')->toArray();
                $clo->mataKuliah()->sync($mkIds);

                // Sync MataKuliah - PLO
                if (!empty($mkIds)) {
                    foreach ($mkIds as $mkId) {
                        $mk = MataKuliah::find($mkId);
                        if ($mk) {
                            $mk->syncPlosFromClos();
                        }
                    }
                }

                $successCount++;
            }

            DB::commit();

            $importLog->update(['status' => 'SUCCESS', 'success_rows' => $successCount]);

            return redirect()->route('superadmin.clo.index')->with('success', "Import CLO berhasil! {$successCount} CLO telah tersimpan dengan mapping PLO dan Mata Kuliah.");

        } catch (\Exception $e) {
            DB::rollBack();
            $importLog->update(['status' => 'FAILED', 'error_summary' => ['error' => $e->getMessage()]]);
            return redirect()->back()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
        }
    }

    /**
     * Import langsung (legacy)
     */
    public function import(Request $request)
    {
        return $this->preview($request);
    }
}
