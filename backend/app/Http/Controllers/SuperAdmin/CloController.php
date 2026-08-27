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
                $q->where('plo.id', $ploFilter)
                  ->orWhere('plo.kode_plo', $ploFilter);
            });
        }

        $cloList = $query->orderBy('kode_clo', 'asc')->paginate(10)->withQueryString();
        $allPlo  = Plo::orderBy('kode_plo', 'asc')->get();
        $allMk   = MataKuliah::where('status', 'ACTIVE')->orderBy('nama_mk', 'asc')->get(['id', 'kode_mk', 'nama_mk']);

        // Data flat mapping untuk tampilan detail per Mata Kuliah (seperti Excel)
        $flatQuery = Clo::with(['plo', 'mataKuliah'])->orderBy('kode_clo', 'asc');
        if ($request->filled('plo')) {
            $ploFilter = $request->plo;
            $flatQuery->whereHas('plo', function ($q) use ($ploFilter) {
                $q->where('plo.id', $ploFilter)
                  ->orWhere('plo.kode_plo', $ploFilter);
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
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template CLO');

        // Create second sheet (tab) for the course list
        $mkSheet = $spreadsheet->createSheet();
        $mkSheet->setTitle('Mata Kuliah');

        // Load active courses (Mata Kuliah) list directly from the database
        $validMks = MataKuliah::where('status', 'ACTIVE')->orderBy('nama_mk', 'asc')->pluck('nama_mk')->toArray();
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

        // 37 Official Curriculum Examples covering all 10 PLOs
        $examples = [
            ['PLO01', 'CLO01', 'Mampu memahami prinsip-prinsip infokom yang mencakup komputasi, matematika, statistika, teknologi informasi dan komunikasi, dan desain yang terkait dalam bidang sistem informasi', '2 - Understand', 'Algoritma dan Pemrograman'],
            ['PLO01', 'CLO02', 'Mampu mengidentifikasi kebutuhan sistem informasi yang komplek dalam konteks enterprise atau masyarakat', '4 - Analyze', 'Sistem Enterprise'],
            ['PLO01', 'CLO03', 'Mampu menganalisis permasalahan yang kompleks dalam bidang infokom dalam konteks enterprise atau masyarakat', '4 - Analyze', 'Pengembangan Aplikasi Website'],
            ['PLO01', 'CLO04', 'Mampu mendefinisikan dan memodelkan kebutuhan dalam bidang infokom dalam konteks enterprise atau masyarakat', '4 - Analyze', 'Pengujian dan Implementasi Sistem'],
            ['PLO01', 'CLO05', 'Mampu menerapkan pengetahuan matematika dan statistika dalam lingkup disiplin ilmu sistem informasi', '3 - Apply', 'Sistem Basis Data'],
            ['PLO01', 'CLO06', 'Mampu menerapkan prinsip infokom dalam komputasi, teknologi informasi dan komunikasi, dan desain dalam lingkup disiplin ilmu sistem informasi', '3 - Apply', 'Bahasa Inggris II'],
            ['PLO01', 'CLO07', 'Mampu menerapkan perspektif disiplin lain dalam analisis permasalahan infokom', '3 - Apply', 'Bahasa Inggris'],
            ['PLO02', 'CLO01', 'Mampu membuat perancangan sistem informasi untuk memenuhi kebutuhan organisasi menuju data-driven organization', '6 - Create', 'Sistem Basis Data'],
            ['PLO02', 'CLO02', 'Mampu mengembangkan solusi berbasis sistem informasi menggunakan metodologi pengembangan yang tepat.', '6 - Create', 'Analisis dan Perancangan Sistem Informasi'],
            ['PLO02', 'CLO03', 'Mampu mengevaluasi solusi berbasis sistem informasi dengan menggunakan metode yang tepat.', '5 - Evaluate', 'Bahasa Indonesia'],
            ['PLO03', 'CLO01', 'Mampu berkontribusi secara aktif dan proaktif dan bertanggung jawab dalam tim kerja untuk mencapai tujuan bersama dalam lingkungan profesional', '3 - Apply', 'Data Warehouse dan Business Intelligence'],
            ['PLO03', 'CLO02', 'Mampu beradaptasi dalam berbagai konteks profesional untuk mencapai tujuan bersama', '3 - Apply', 'Jaringan Komputer'],
            ['PLO04', 'CLO01', 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan agama dalam upaya pembangunan berkelanjutan.', '2 - Understand', 'Pancasila'],
            ['PLO04', 'CLO02', 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan.', '2 - Understand', 'Kepemimpinan dan Komunikasi Interpersonal'],
            ['PLO04', 'CLO03', 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan regulasi dalam upaya pembangunan berkelanjutan.', '2 - Understand', 'Internalisasi Budaya dan Pembentukan Karakter'],
            ['PLO04', 'CLO04', 'Mampu menganalisis pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan.', '4 - Analyze', 'Manajemen Proyek Sistem Informasi'],
            ['PLO04', 'CLO05', 'Mampu menerapkan pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan.', '3 - Apply', 'Proyek Perangkat Lunak'],
            ['PLO04', 'CLO06', 'Mampu menerapkan pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan regulasi dalam upaya pembangunan berkelanjutan.', '3 - Apply', 'Penambangan Data'],
            ['PLO04', 'CLO07', 'Mampu menganalisis pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan.', '4 - Analyze', 'Probabilitas dan Statistik'],
            ['PLO05', 'CLO01', 'Mampu memahami prinsip komunikasi secara efektif dalam bentuk lisan dan tulisan dalam berbagai konteks profesional.', '2 - Understand', 'Sistem Informasi Akuntansi'],
            ['PLO05', 'CLO02', 'Mampu berkomunikasi secara efektif dalam bentuk lisan dan tulisan dalam berbagai konteks profesional.', '3 - Apply', 'Statistika Industri'],
            ['PLO06', 'CLO01', 'Mampu menjelaskan peran dan dampak dari sistem dan teknologi informasi dalam upaya pembangunan berkelanjutan di level individu, organisasi, dan masyarakat', '2 - Understand', 'Proyek Perangkat Lunak'],
            ['PLO06', 'CLO02', 'Mampu menganalisis peran dan dampak dari sistem dan teknologi informasi dalam upaya pembangunan berkelanjutan di level individu, organisasi, dan masyarakat', '4 - Analyze', 'Pengembangan Aplikasi Website'],
            ['PLO07', 'CLO01', 'Mampu menunjukkan kinerja mandiri di bidang sistem informasi', '3 - Apply', 'Pelatihan dan Sertifikasi'],
            ['PLO07', 'CLO02', 'Mampu menunjukkan kinerja bermutu dan terukur di bidang sistem informasi', '3 - Apply', 'Tugas Akhir'],
            ['PLO07', 'CLO03', 'Mampu berinisiatif dalam aktivitas pengembangan diri sebagai profesional di bidang sistem informasi', '3 - Apply', 'Pemodelan Proses Bisnis'],
            ['PLO08', 'CLO01', 'Mampu menggunakan teknik, metode, perangkat lunak, atau kakas terkini untuk menghasilkan solusi di bidang sistem informasi dalam konteks praktikum', '3 - Apply', 'Sistem Enterprise'],
            ['PLO08', 'CLO02', 'Mampu menggunakan teknik, metode, perangkat lunak, atau kakas terkini untuk menghasilkan solusi di bidang sistem informasi dalam konteks kasus nyata', '3 - Apply', 'Arsitektur Enterprise'],
            ['PLO09', 'CLO01', 'Mampu memahami prinsip dan fungsi manajemen Sistem Informasi untuk mendukung strategi bisnis', '2 - Understand', 'Rekayasa Proses Bisnis'],
            ['PLO09', 'CLO02', 'Mampu memahami prinsip dan fungsi manajemen Sistem Informasi untuk mendukung strategi bisnis', '2 - Understand', 'Pemodelan Proses Bisnis'],
            ['PLO09', 'CLO03', 'Mampu menerapkan ilmu dan praktek yang relevan dalam pengelolaan sistem informasi untuk mendukung strategi bisnis dan tujuan organisasi', '3 - Apply', 'Tata Kelola dan Manajemen Teknologi Informasi'],
            ['PLO09', 'CLO04', 'Mampu memodelkan penyelenggaraan sistem informasi di konteks organisasi', '4 - Analyze', 'Bahasa Indonesia'],
            ['PLO09', 'CLO05', 'Mampu mengevaluasi kinerja sistem informasi dan mengusulkan perbaikan untuk meningkatkan kontribusi sistem informasi terhadap tujuan bisnis organisasi.', '5 - Evaluate', 'Manajemen Data Enterprise'],
            ['PLO09', 'CLO06', 'Mampu merancang arsitektur sistem informasi untuk mendukung strategi bisnis dan tujuan organisasi', '6 - Create', 'Etika Profesi, Regulasi Teknologi Informasi dan Properti Intelektual'],
            ['PLO10', 'CLO01', 'Mampu memahami prinsip dan tahap dalam inisiatif bisnis berbasis sistem dan teknologi informasi', '2 - Understand', 'Komputasi Awan'],
            ['PLO10', 'CLO02', 'Mampu mengembangkan kapasitas sebagai technopreneurship seperti komunikasi, inovasi, dan networking', '3 - Apply', 'Kewirausahaan'],
            ['PLO10', 'CLO03', 'Mampu mengembangkan rancangan produk atau layanan berbasis teknologi informasi', '6 - Create', 'Pancasila'],
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

        // Create Table
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

        // Apply dropdown validations to rows 2 to 500
        for ($r = 2; $r <= 500; $r++) {
            $sheet->getCell("D{$r}")->setDataValidation(clone $validationBloom);
            $sheet->getCell("E{$r}")->setDataValidation(clone $validationMk);
        }

        // Catatan
        $sheet->setCellValue("A{$row}", '');
        $row++;
        $sheet->setCellValue("A{$row}", 'Catatan: Setiap PLO memiliki daftar CLO masing-masing. Satu CLO dapat dipetakan ke banyak Mata Kuliah (buat 1 baris per Mata Kuliah).');
        $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF666666'));
        $sheet->mergeCells("A{$row}:E{$row}");

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(12);
        $sheet->getColumnDimension('B')->setWidth(18);
        $sheet->getColumnDimension('C')->setWidth(55);
        $sheet->getColumnDimension('D')->setWidth(18);
        $sheet->getColumnDimension('E')->setWidth(35);

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
