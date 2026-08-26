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

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $term = "%{$request->search}%";
                $q->whereRaw('LOWER(kode_clo) LIKE ?', [strtolower($term)])
                  ->orWhereRaw('LOWER(deskripsi) LIKE ?', [strtolower($term)]);
            });
        }

        $cloList = $query->orderBy('kode_clo', 'asc')->paginate(10)->withQueryString();
        $allPlo  = Plo::orderBy('kode_plo', 'asc')->get();
        $allMk   = MataKuliah::where('status', 'ACTIVE')->orderBy('nama_mk', 'asc')->get(['id', 'kode_mk', 'nama_mk']);

        // Data flat mapping untuk tampilan detail per Mata Kuliah (seperti Excel)
        $allClosWithRelations = Clo::with(['plo', 'mataKuliah'])->orderBy('kode_clo', 'asc')->get();
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
            'filters'       => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_clo'      => ['required', 'string', 'max:50', 'unique:clo,kode_clo'],
            'deskripsi'     => ['required', 'string'],
            'bloom'         => ['nullable', 'string', 'max:50'],
            'plo_ids'       => ['array'],
            'plo_ids.*'     => ['exists:plo,id'],
            'mk_ids'        => ['array'],
            'mk_ids.*'      => ['exists:mata_kuliah,id'],
        ]);

        $clo = Clo::create([
            'id'        => (string) Str::uuid(),
            'kode_clo'  => $validated['kode_clo'],
            'deskripsi' => $validated['deskripsi'],
            'bloom'     => $validated['bloom'] ?? null,
        ]);

        if (!empty($validated['plo_ids'])) {
            $clo->plo()->sync($validated['plo_ids']);
        }
        if (!empty($validated['mk_ids'])) {
            $clo->mataKuliah()->sync($validated['mk_ids']);
        }

        AuditLog::record($request->user()->id, 'CREATE_CLO', 'Clo', $clo->id, null, $clo->toArray());

        return redirect()->back()->with('success', 'Data CLO berhasil ditambahkan.');
    }

    public function update(Request $request, Clo $clo)
    {
        $validated = $request->validate([
            'kode_clo'      => ['required', 'string', 'max:50', 'unique:clo,kode_clo,' . $clo->id],
            'deskripsi'     => ['required', 'string'],
            'bloom'         => ['nullable', 'string', 'max:50'],
            'plo_ids'       => ['array'],
            'plo_ids.*'     => ['exists:plo,id'],
            'mk_ids'        => ['array'],
            'mk_ids.*'      => ['exists:mata_kuliah,id'],
        ]);

        $oldValues = $clo->toArray();
        $clo->update([
            'kode_clo'  => $validated['kode_clo'],
            'deskripsi' => $validated['deskripsi'],
            'bloom'     => $validated['bloom'] ?? null,
        ]);
        $clo->plo()->sync($validated['plo_ids'] ?? []);
        $clo->mataKuliah()->sync($validated['mk_ids'] ?? []);

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

    /**
     * Download template Excel untuk import CLO & Mapping
     */
    public function template()
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template CLO');

        // Create second sheet (tab) for the course list
        $mkSheet = $spreadsheet->createSheet();
        $mkSheet->setTitle('Mata Kuliah');

        // Load active courses (Mata Kuliah) list directly from the database (seeded by MataKuliahSeeder)
        $validMks = \App\Models\MataKuliah::where('status', 'ACTIVE')->orderBy('nama_mk', 'asc')->pluck('nama_mk')->toArray();
        $mkCount = count($validMks);

        // Populate the second sheet with the courses list in Column A
        for ($i = 0; $i < $mkCount; $i++) {
            $rowNum = $i + 1;
            $mkSheet->setCellValue("A{$rowNum}", $validMks[$i]);
        }

        // Header
        $headers = ['PLO', 'Kode CLO', 'CLO', 'Bloom', 'MK'];
        foreach ($headers as $col => $header) {
            $colLetter = chr(65 + $col);
            $sheet->setCellValue("{$colLetter}1", $header);
        }

        // Style header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '801720']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']]],
        ];
        $sheet->getStyle('A1:E1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(22);

        $examples = [
            ['PLO01', 'CLO01', 'Mampu memahami dan menjelaskan konsep dasar bidang infokom serta pengetahuan komputasi yang digunakan dalam lingkup sistem informasi.', '2 - Understand', 'Algoritma dan Pemrograman'],
            ['PLO02', 'CLO02', 'Mampu mengidentifikasi kebutuhan sistem informasi yang komplek dalam konteks enterprise atau masyarakat.', '4 - Analyze', 'Sistem Enterprise'],
            ['PLO02', 'CLO04', 'Mampu membuat perancangan sistem informasi untuk memenuhi kebutuhan organisasi menuju datadriven organization.', '6 - Create', 'Pengembangan Aplikasi Website'],
            ['PLO02', 'CLO05', 'Mampu mengevaluasi solusi berbasis sistem informasi dengan menggunakan metode yang tepat.', '5 - Evaluate', 'Pengujian dan Implementasi Sistem'],
            ['PLO03', 'CLO03', 'Mampu menerapkan pengetahuan matematika dan statistika dalam lingkup disiplin ilmu sistem informasi.', '3 - Apply', 'Sistem Basis Data'],
        ];

        $dataStyle = [
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'DDDDDD']]],
            'alignment' => ['vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_TOP, 'wrapText' => true],
        ];

        $row = 2;
        foreach ($examples as $example) {
            $sheet->setCellValue("A{$row}", $example[0]);
            $sheet->setCellValue("B{$row}", $example[1]);
            $sheet->setCellValue("C{$row}", $example[2]);
            $sheet->setCellValue("D{$row}", $example[3]);
            $sheet->setCellValue("E{$row}", $example[4]);
            $sheet->getStyle("A{$row}:E{$row}")->applyFromArray($dataStyle);
            $row++;
        }

        // Create Table to selectively disable AutoFilter dropdown arrow on Column C (CLO)
        $table = new \PhpOffice\PhpSpreadsheet\Worksheet\Table('A1:E' . ($row - 1), 'TableCLO');
        $tableStyle = new \PhpOffice\PhpSpreadsheet\Worksheet\Table\TableStyle();
        $tableStyle->setTheme(\PhpOffice\PhpSpreadsheet\Worksheet\Table\TableStyle::TABLE_STYLE_NONE);
        $table->setStyle($tableStyle);
        $table->getColumn('C')->setShowFilterButton(false);
        $sheet->addTable($table);

        // Set up cell dropdown validations for Bloom (Column D) and MK (Column E)
        $validationBloom = $sheet->getCell('D2')->getDataValidation();
        $validationBloom->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
        $validationBloom->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
        $validationBloom->setAllowBlank(true);
        $validationBloom->setShowInputMessage(true);
        $validationBloom->setShowErrorMessage(true);
        $validationBloom->setShowDropDown(true);
        $validationBloom->setErrorTitle('Input tidak valid');
        $validationBloom->setError('Silakan pilih tingkat Bloom yang valid dari daftar.');
        $validationBloom->setFormula1('"1 - Remember,2 - Understand,3 - Apply,4 - Analyze,5 - Evaluate,6 - Create"');

        $validationMk = $sheet->getCell('E2')->getDataValidation();
        $validationMk->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
        $validationMk->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
        $validationMk->setAllowBlank(true);
        $validationMk->setShowInputMessage(true);
        $validationMk->setShowErrorMessage(true);
        $validationMk->setShowDropDown(true);
        $validationMk->setErrorTitle('Input tidak valid');
        $validationMk->setError('Silakan pilih Mata Kuliah yang valid dari daftar.');
        if ($mkCount > 0) {
            $validationMk->setFormula1('\'Mata Kuliah\'!$A$1:$A$' . $mkCount);
        } else {
            $validationMk->setFormula1('""');
        }

        // Apply dropdown validations to rows 2 to 500 (for Column D and E, not C)
        for ($r = 2; $r <= 500; $r++) {
            $sheet->getCell("D{$r}")->setDataValidation(clone $validationBloom);
            $sheet->getCell("E{$r}")->setDataValidation(clone $validationMk);
        }

        // Catatan
        $sheet->setCellValue("A{$row}", '');
        $row++;
        $sheet->setCellValue("A{$row}", 'Catatan: Satu CLO bisa dipetakan ke banyak Mata Kuliah. Tulis satu baris per Mata Kuliah dengan Kode CLO.');
        $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF666666'));
        $sheet->mergeCells("A{$row}:E{$row}");

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(12);
        $sheet->getColumnDimension('B')->setWidth(18);
        $sheet->getColumnDimension('C')->setWidth(55);
        $sheet->getColumnDimension('D')->setWidth(18);
        $sheet->getColumnDimension('E')->setWidth(30);

        $sheet->freezePane('A2');

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $filename = 'template-import-clo.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
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
                             '4 - analyze', '5 - evaluate', '6 - create'];

            $rows = [];
            $errors = [];
            $seenCloKeys = [];

            foreach ($data as $rowIndex => $row) {
                if ($rowIndex === 0) continue;

                $ploVal    = strtoupper(trim((string)($row[$ploIdx] ?? '')));
                $kode      = strtoupper(trim((string)($row[$kodeIdx] ?? '')));
                $deskripsi = trim((string)($row[$cloIdx] ?? ''));
                $bloom     = trim((string)($row[$bloomIdx] ?? ''));
                $mk        = trim((string)($row[$mkIdx] ?? ''));
                $rowNum    = $rowIndex + 1;
                $rowErrors = [];

                // Skip row if it has not been mapped (PLO, Kode CLO, and CLO description are empty)
                if ($ploVal === '' && $kode === '' && $deskripsi === '') continue;

                // Fallback to default descriptions if not provided in Excel
                if ($deskripsi === '') {
                    $defaultCloDescriptions = [
                        'CLO01' => 'Mampu memahami dan menjelaskan konsep dasar bidang infokom serta pengetahuan komputasi yang digunakan dalam lingkup sistem informasi.',
                        'CLO02' => 'Mampu mengidentifikasi kebutuhan sistem informasi yang komplek dalam konteks enterprise atau masyarakat.',
                        'CLO5'  => 'Mampu mengevaluasi solusi berbasis sistem informasi dengan menggunakan metode yang tepat.',
                        'CLO05' => 'Mampu mengevaluasi solusi berbasis sistem informasi dengan menggunakan metode yang tepat.',
                        'CLO4'  => 'Mampu membuat perancangan sistem informasi untuk memenuhi kebutuhan organisasi menuju datadriven organization.',
                        'CLO04' => 'Mampu membuat perancangan sistem informasi untuk memenuhi kebutuhan organisasi menuju datadriven organization.',
                        'CLO3'  => 'Mampu menerapkan pengetahuan matematika dan statistika dalam lingkup disiplin ilmu sistem informasi.',
                        'CLO03' => 'Mampu menerapkan pengetahuan matematika dan statistika dalam lingkup disiplin ilmu sistem informasi.',
                    ];

                    $existingClo = Clo::where('kode_clo', $kode)->first();
                    if ($existingClo) {
                        $deskripsi = $existingClo->deskripsi;
                    } else {
                        $deskripsi = $defaultCloDescriptions[$kode] ?? 'Capaian Pembelajaran Mata Kuliah ' . $kode;
                    }
                }

                // Validasi PLO
                if ($ploVal === '') {
                    $rowErrors[] = 'PLO tidak boleh kosong';
                } elseif (!in_array($ploVal, $validPlo)) {
                    $rowErrors[] = "PLO '{$ploVal}' tidak ditemukan di master data";
                }

                // Validasi Kode CLO
                if ($kode === '') {
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

                // Validasi Mata Kuliah
                if ($mk === '') {
                    $rowErrors[] = 'Mata Kuliah tidak boleh kosong';
                } elseif (!in_array(strtolower($mk), $validMk)) {
                    $rowErrors[] = "Mata Kuliah '{$mk}' tidak ditemukan di master data";
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

            // Group by kode_clo untuk upsert CLO sekali, kemudian sync relasi
            $grouped = [];
            foreach ($request->rows as $row) {
                $kode = strtoupper(trim($row['kode_clo'] ?? ''));
                if ($kode === '') continue;
                if (!isset($grouped[$kode])) {
                    $grouped[$kode] = [
                        'kode_clo'  => $kode,
                        'deskripsi' => trim($row['deskripsi'] ?? ''),
                        'bloom'     => trim($row['bloom'] ?? '') ?: null,
                        'plo_codes' => [],
                        'mk_names'  => [],
                    ];
                }
                $ploVal = strtoupper(trim($row['plo'] ?? ''));
                $mkVal  = trim($row['mk'] ?? '');
                if ($ploVal && !in_array($ploVal, $grouped[$kode]['plo_codes'])) {
                    $grouped[$kode]['plo_codes'][] = $ploVal;
                }
                if ($mkVal && !in_array($mkVal, $grouped[$kode]['mk_names'])) {
                    $grouped[$kode]['mk_names'][] = $mkVal;
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
