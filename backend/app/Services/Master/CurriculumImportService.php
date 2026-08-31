<?php

namespace App\Services\Master;

use App\Models\Clo;
use App\Models\Course;
use App\Models\Curriculum;
use App\Models\MataKuliah;
use App\Models\Plo;
use App\Services\ActivityLog\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class CurriculumImportService
{
    public function __construct(
        protected ActivityLogService $activityLogService
    ) {
    }

    /**
     * Generate template Excel berdasarkan step.
     */
    public function generateTemplate(string $step): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '801720'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'BFBFBF'],
                ],
            ],
        ];

        switch ($step) {

            /**
             * ==========================================================
             * COURSES
             * ==========================================================
             */
            case 'courses':

                $sheet->mergeCells('A1:E1');
                $sheet->setCellValue('A1', 'MATA KULIAH');

                $sheet->getStyle('A1:E1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 14,
                        'color' => ['rgb' => '801720'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'FEE2E2'],
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(35);

                $headers = [
                    'Semester',
                    'Kode',
                    'Nama MK (INA)',
                    'Nama MK (ENG)',
                    'SKS',
                ];

                foreach ($headers as $index => $header) {
                    $column = Coordinate::stringFromColumnIndex($index + 1);
                    $sheet->setCellValue("{$column}2", $header);
                }

                $sheet->getStyle('A2:E2')->applyFromArray($headerStyle);

                $sampleData = [
                    [1, 'CS101', 'Pemrograman Web', 'Web Programming', 3],
                    [1, 'CS102', 'Algoritma & Struktur Data', 'Algorithms & Data Structures', 4],
                    [2, 'CS201', 'Basis Data', 'Databases', 3],
                ];

                foreach ($sampleData as $index => $row) {
                    $excelRow = $index + 3;

                    foreach ($row as $colIndex => $value) {
                        $column = Coordinate::stringFromColumnIndex($colIndex + 1);
                        $sheet->setCellValue("{$column}{$excelRow}", $value);
                    }
                }

                foreach (range('A', 'E') as $column) {
                    $sheet->getColumnDimension($column)->setAutoSize(true);
                }

                break;

            /**
             * ==========================================================
             * CATEGORIES
             * ==========================================================
             */
            case 'categories':

                $sheet->setCellValue('A1', 'Kategori');
                $sheet->setCellValue('B1', 'Nama Mata Kuliah');

                $sheet->getStyle('A1:B1')->applyFromArray($headerStyle);

                $sampleData = [
                    ['MKWU', 'Agama Islam'],
                    ['MKWP', 'Algoritma dan Pemrograman'],
                    ['MKPP', 'Sistem Basis Data'],
                ];

                foreach ($sampleData as $index => $row) {
                    $excelRow = $index + 2;

                    $sheet->setCellValue("A{$excelRow}", $row[0]);
                    $sheet->setCellValue("B{$excelRow}", $row[1]);
                }

                $sheet->getColumnDimension('A')->setWidth(18);
                $sheet->getColumnDimension('B')->setWidth(50);

                break;

            /**
             * ==========================================================
             * PLO
             * ==========================================================
             */
            case 'plos':

                $sheet->setCellValue('A1', 'KODE PLO');
                $sheet->setCellValue(
                    'B1',
                    'Program Learning Outcome / Capaian Pembelajaran'
                );

                $sheet->getStyle('A1:B1')->applyFromArray($headerStyle);

                $sampleData = [
                    [
                        'PLO01',
                        'Mampu memahami prinsip-prinsip infokom yang mencakup komputasi, matematika, statistika, teknologi informasi dan komunikasi, dan desain yang terkait dalam bidang sistem informasi.'
                    ],
                    [
                        'PLO02',
                        'Mampu membuat perancangan sistem informasi untuk memenuhi kebutuhan organisasi menuju data-driven organization.'
                    ],
                ];

                foreach ($sampleData as $index => $row) {
                    $excelRow = $index + 2;

                    $sheet->setCellValue("A{$excelRow}", $row[0]);
                    $sheet->setCellValue("B{$excelRow}", $row[1]);
                }

                $sheet->getColumnDimension('A')->setWidth(18);
                $sheet->getColumnDimension('B')->setWidth(100);

                break;

            /**
             * ==========================================================
             * CLO MAPPING
             * ==========================================================
             */
            case 'clos_mapping':

                $headers = [
                    'PLO',
                    'Kode CLO',
                    'CLO',
                    'Bloom',
                    'MK',
                ];

                foreach ($headers as $index => $header) {
                    $column = Coordinate::stringFromColumnIndex($index + 1);
                    $sheet->setCellValue("{$column}1", $header);
                }

                $sheet->getStyle('A1:E1')->applyFromArray($headerStyle);

                $sampleData = [
                    [
                        'plo' => 'PLO02',
                        'kode_clo' => 'PLO02-CLO02',
                        'clo' => 'Mampu mengembangkan solusi berbasis sistem informasi menggunakan metodologi pengembangan yang tepat.',
                        'bloom' => '6 - Create',
                        'mk' => [
                            'Algoritma dan Pemrograman',
                            'Pemrograman Berorientasi Objek',
                            'Sistem Basis Data',
                            'Pengembangan Aplikasi Website',
                            'Data Warehouse dan Business Intelligence',
                            'Tugas Akhir',
                            'Capstone Project',
                        ],
                    ],
                ];

                $row = 2;

                foreach ($sampleData as $data) {

                    $groupStart = $row;

                    foreach ($data['mk'] as $mk) {

                        $sheet->setCellValue("A{$row}", $data['plo']);
                        $sheet->setCellValue("B{$row}", $data['kode_clo']);
                        $sheet->setCellValue("C{$row}", $data['clo']);
                        $sheet->setCellValue("D{$row}", $data['bloom']);
                        $sheet->setCellValue("E{$row}", $mk);

                        $row++;
                    }

                    $groupEnd = $row - 1;

                    if ($groupEnd > $groupStart) {

                        foreach (['A', 'B', 'C', 'D'] as $column) {
                            $sheet->mergeCells(
                                "{$column}{$groupStart}:{$column}{$groupEnd}"
                            );
                        }
                    }

                    $sheet->getStyle(
                        "A{$groupStart}:D{$groupEnd}"
                    )->getAlignment()
                        ->setVertical(Alignment::VERTICAL_CENTER)
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    $sheet->getStyle(
                        "C{$groupStart}:C{$groupEnd}"
                    )->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                        ->setWrapText(true);
                }

                $sheet->getColumnDimension('A')->setWidth(15);
                $sheet->getColumnDimension('B')->setWidth(22);
                $sheet->getColumnDimension('C')->setWidth(80);
                $sheet->getColumnDimension('D')->setWidth(18);
                $sheet->getColumnDimension('E')->setWidth(50);

                break;

            default:
                throw new \InvalidArgumentException(
                    "Tipe template tidak valid."
                );
        }

        return $spreadsheet;
    }

    /**
     * Parse uploaded Excel berdasarkan step.
     */
    public function parseStepFile(string $step, $file): array
    {
        $filePath = is_string($file) ? $file : $file->getRealPath();
        $spreadsheet = IOFactory::load($filePath);

        $sheet = $spreadsheet->getActiveSheet();

        $highestRow = $sheet->getHighestRow();

        $rows = [];

        switch ($step) {

            /**
             * ==========================================================
             * COURSES
             * ==========================================================
             */
            case 'courses':

                $headerInfo = $this->locateHeaderAndColumns(
                    $sheet,
                    [
                        'semester' => '/^(semester|smt)$/',
                        'code' => '/^(kode|code|kodemk|coursecode|kodematakuliah)$/',
                        'name_ina' => '/(namamk|namamatakuliah|namamkina|namaindonesia|coursename|matakuliah)/',
                        'sks' => '/^(sks|credits|credit|bobotsks|sksmk)$/',
                    ],
                    [
                        'name_eng' => '/(namamkeng|namamken|namainggris|englishname|coursenameen)/',
                    ]
                );

                if (!$headerInfo['header_row']) {
                    throw new \InvalidArgumentException(
                        'Format header kolom file Mata Kuliah tidak sesuai template resmi. ' .
                        'Kolom wajib: Semester, Kode, Nama MK (INA), SKS.'
                    );
                }

                $headerRow = $headerInfo['header_row'];
                $colMap = $headerInfo['col_map'];

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {

                    $semester = $this->getCellValue(
                        $sheet,
                        $colMap['semester'],
                        $r
                    );

                    $code = $this->getCellValue(
                        $sheet,
                        $colMap['code'],
                        $r
                    );

                    $nameIna = $this->getCellValue(
                        $sheet,
                        $colMap['name_ina'],
                        $r
                    );

                    $nameEng = isset($colMap['name_eng'])
                        ? $this->getCellValue($sheet, $colMap['name_eng'], $r)
                        : '';

                    $sks = $this->getCellValue(
                        $sheet,
                        $colMap['sks'],
                        $r
                    );

                    if (
                        $semester === '' &&
                        $code === '' &&
                        $nameIna === '' &&
                        $nameEng === '' &&
                        $sks === ''
                    ) {
                        continue;
                    }

                    if ($nameIna === '') {
                        throw new \InvalidArgumentException(
                            "Baris {$r}: Nama Mata Kuliah (INA) tidak boleh kosong."
                        );
                    }

                    if (
                        $semester !== '' &&
                        (
                            !is_numeric($semester) ||
                            (int) $semester < 1 ||
                            (int) $semester > 14
                        )
                    ) {
                        throw new \InvalidArgumentException(
                            "Baris {$r}: Semester harus berupa angka 1-14."
                        );
                    }

                    if (
                        $sks !== '' &&
                        (
                            !is_numeric($sks) ||
                            (int) $sks < 1 ||
                            (int) $sks > 20
                        )
                    ) {
                        throw new \InvalidArgumentException(
                            "Baris {$r}: SKS harus berupa angka positif."
                        );
                    }

                    $rows[] = [
                        'semester' => is_numeric($semester)
                            ? (int) $semester
                            : 1,

                        'code' => trim($code),

                        'name_ina' => trim($nameIna),

                        'name_eng' => trim($nameEng),

                        'sks' => is_numeric($sks)
                            ? (int) $sks
                            : 3,

                        'category' => null,
                    ];
                }

                if (empty($rows)) {
                    throw new \InvalidArgumentException(
                        'File Excel Mata Kuliah tidak memuat data yang valid.'
                    );
                }

                break;

            /**
             * ==========================================================
             * CATEGORIES
             * ==========================================================
             */
            case 'categories':

                $this->unmergeAndFillMergedCells($sheet);

                $headerInfo = $this->locateHeaderAndColumns(
                    $sheet,
                    [
                        'category' => '/(kategori|category|kelompok|jenismk)/',
                        'course_name' => '/(namamatakuliah|namamk|matakuliah|coursename)/',
                    ]
                );

                if (!$headerInfo['header_row']) {
                    throw new \InvalidArgumentException(
                        'Format header kolom file Kategori MK tidak sesuai template.'
                    );
                }

                $headerRow = $headerInfo['header_row'];
                $colMap = $headerInfo['col_map'];

                $lastCategory = '';

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {

                    $cellCategory = $this->getCellValue(
                        $sheet,
                        $colMap['category'],
                        $r
                    );

                    $courseName = $this->getCellValue(
                        $sheet,
                        $colMap['course_name'],
                        $r
                    );

                    if ($cellCategory === '' && $courseName === '') {
                        continue;
                    }

                    if ($cellCategory !== '') {
                        $lastCategory = $cellCategory;
                    }

                    $category = $cellCategory !== ''
                        ? $cellCategory
                        : $lastCategory;

                    if ($courseName !== '') {

                        if ($category === '') {
                            throw new \InvalidArgumentException(
                                "Baris {$r}: Kategori mata kuliah tidak ditemukan."
                            );
                        }

                        $rows[] = [
                            'category' => strtoupper(trim($category)),
                            'course_name' => trim($courseName),
                        ];
                    }
                }

                if (empty($rows)) {
                    throw new \InvalidArgumentException(
                        'File Excel Kategori Mata Kuliah tidak memuat data valid.'
                    );
                }

                break;

            /**
             * ==========================================================
             * PLO
             * ==========================================================
             */
            case 'plos':

                $headerInfo = $this->locateHeaderAndColumns(
                    $sheet,
                    [
                        'code' => '/(kodeplo|plocode|kodecpl|plo|cpl)/',
                        'description' => '/(programlearningoutcome|capaianpembelajaran|deskripsi|description|learningoutcome)/',
                    ]
                );

                if (!$headerInfo['header_row']) {
                    throw new \InvalidArgumentException(
                        'Format header kolom file PLO tidak sesuai template.'
                    );
                }

                $headerRow = $headerInfo['header_row'];
                $colMap = $headerInfo['col_map'];

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {

                    $code = $this->getCellValue(
                        $sheet,
                        $colMap['code'],
                        $r
                    );

                    $description = $this->getCellValue(
                        $sheet,
                        $colMap['description'],
                        $r
                    );

                    if ($code === '' && $description === '') {
                        continue;
                    }

                    if ($code === '') {
                        throw new \InvalidArgumentException(
                            "Baris {$r}: Kode PLO tidak boleh kosong."
                        );
                    }

                    if ($description === '') {
                        throw new \InvalidArgumentException(
                            "Baris {$r}: Deskripsi PLO tidak boleh kosong."
                        );
                    }

                    $rows[] = [
                        'code' => strtoupper(trim($code)),
                        'description' => trim($description),
                    ];
                }

                if (empty($rows)) {
                    throw new \InvalidArgumentException(
                        'File Excel PLO tidak memuat data valid.'
                    );
                }

                break;

            /**
             * ==========================================================
             * CLO MAPPING
             * ==========================================================
             */
            case 'clos_mapping':

                $this->unmergeAndFillMergedCells($sheet);

                $headerInfo = $this->locateHeaderAndColumns(
                    $sheet,
                    [
                        'plo' => '/^(plo|kodeplo|plocode|cpl|kodecpl)$/',

                        'clo_code' => '/(kodeclo|clocode|kodecpmk|clonumber|kode_clo)/',

                        'description' => '/(^clo$|deskripsiclo|deskripsicpmk|capaianpembelajaran|deskripsi|description|courselearningoutcomes)/',

                        'bloom' => '/(bloom|levelbloom|taksonomi|bloomlevel)/',

                        'course_name' => '/^(mk|namamk|namamatakuliah|matakuliah|course|coursename)$/',
                    ]
                );

                if (!$headerInfo['header_row']) {
                    throw new \InvalidArgumentException(
                        'Format header kolom CLO & Pemetaan tidak sesuai template. ' .
                        'Kolom wajib: PLO, Kode CLO, CLO, Bloom, dan MK.'
                    );
                }

                $headerRow = $headerInfo['header_row'];
                $colMap = $headerInfo['col_map'];

                $lastPloCode = '';
                $lastCloCode = '';
                $lastDescription = '';
                $lastBloom = '';
                $lastCourseName = '';

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {

                    $cellPlo = $this->getCellValue(
                        $sheet,
                        $colMap['plo'],
                        $r
                    );

                    $cellClo = $this->getCellValue(
                        $sheet,
                        $colMap['clo_code'],
                        $r
                    );

                    $cellDesc = $this->getCellValue(
                        $sheet,
                        $colMap['description'],
                        $r
                    );

                    $cellBloom = $this->getCellValue(
                        $sheet,
                        $colMap['bloom'],
                        $r
                    );

                    $cellCourse = $this->getCellValue(
                        $sheet,
                        $colMap['course_name'],
                        $r
                    );

                    if (
                        $cellPlo === '' &&
                        $cellClo === '' &&
                        $cellDesc === '' &&
                        $cellBloom === '' &&
                        $cellCourse === ''
                    ) {
                        continue;
                    }

                    if ($cellPlo !== '') {
                        $lastPloCode = strtoupper($cellPlo);
                    }

                    if ($cellClo !== '') {
                        $lastCloCode = strtoupper($cellClo);
                    }

                    if ($cellDesc !== '') {
                        $lastDescription = $cellDesc;
                    }

                    if ($cellBloom !== '') {
                        $lastBloom = $cellBloom;
                    }

                    if ($cellCourse !== '') {
                        $lastCourseName = $cellCourse;
                    }

                    $rawPloCode = $cellPlo !== ''
                        ? $cellPlo
                        : $lastPloCode;

                    $rawCloCode = $cellClo !== ''
                        ? $cellClo
                        : $lastCloCode;

                    $description = $cellDesc !== ''
                        ? $cellDesc
                        : $lastDescription;

                    $bloom = $cellBloom !== ''
                        ? $cellBloom
                        : $lastBloom;

                    $courseName = $cellCourse !== ''
                        ? $cellCourse
                        : $lastCourseName;

                    if ($courseName === '') {
                        throw new \InvalidArgumentException(
                            "Baris {$r}: Nama Mata Kuliah tidak boleh kosong."
                        );
                    }

                    if ($rawCloCode === '') {
                        throw new \InvalidArgumentException(
                            "Baris {$r}: Kode CLO tidak boleh kosong."
                        );
                    }

                    $extracted = $this->extractCloCodeParts(
                        $rawCloCode,
                        $rawPloCode
                    );

                    $rows[] = [
                        'plo_code' => $extracted['plo_code'],

                        'clo_code' => $extracted['clo_code'],

                        'description' => trim($description),

                        'bloom' => strtoupper(trim($bloom)),

                        'course_name' => trim($courseName),
                    ];
                }

                if (empty($rows)) {
                    throw new \InvalidArgumentException(
                        'File Excel CLO & Pemetaan tidak memuat data valid.'
                    );
                }

                break;

            default:
                throw new \InvalidArgumentException(
                    'Step tidak valid.'
                );
        }

        return $rows;
    }

    /**
     * ==============================================================
     * IMPORT DATA
     * ==============================================================
     */
    public function import(
        $curriculum,
        array $payload
    ) {
        $curriculumId = is_object($curriculum) && isset($curriculum->id) ? $curriculum->id : (string) Str::uuid();
        $curriculumCode = is_object($curriculum) && isset($curriculum->code) ? $curriculum->code : 'KUR_2026';
        $curriculumName = is_object($curriculum) && isset($curriculum->name) ? $curriculum->name : 'Kurikulum Verifikasi Soal 2026';

        return DB::transaction(function () use (
            $curriculumId,
            $curriculumCode,
            $curriculumName,
            $payload
        ) {

            $courseMapByName = [];
            $courseMapByCode = [];

            /**
             * ==========================================================
             * 1. CATEGORY LOOKUP
             * ==========================================================
             */
            $categoriesData = $payload['categories'] ?? [];

            $categoryLookup = [];

            foreach ($categoriesData as $categoryRow) {

                $courseName = strtolower(
                    trim($categoryRow['course_name'] ?? '')
                );

                if ($courseName === '') {
                    continue;
                }

                $categoryLookup[$courseName] =
                    strtoupper(
                        trim($categoryRow['category'] ?? 'MKWP')
                    );
            }

            /**
             * ==========================================================
             * 2. CREATE COURSES / MATA KULIAH
             * ==========================================================
             */
            $coursesData = $payload['courses'] ?? [];

            foreach ($coursesData as $courseData) {

                $courseName = trim(
                    $courseData['name_ina']
                    ?? $courseData['course_name']
                    ?? ''
                );

                if ($courseName === '') {
                    continue;
                }

                $courseNameKey = strtolower($courseName);

                $category =
                    $categoryLookup[$courseNameKey]
                    ?? strtoupper(
                        trim($courseData['category'] ?? 'MKWP')
                    );

                $rawCode = trim(
                    (string) (
                        $courseData['code']
                        ?? $courseData['course_code']
                        ?? ''
                    )
                );

                if ($rawCode === '' || $rawCode === '-') {

                    $slug = strtoupper(
                        Str::slug($courseName, '_')
                    );

                    $rawCode = $slug !== ''
                        ? 'MK_' . $slug
                        : 'MK_' . uniqid();
                }

                /**
                 * Import ke model MataKuliah di aplikasi sidangkp
                 */
                $mk = MataKuliah::where('kode_mk', $rawCode)->first();

                if (!$mk) {
                    $mk = MataKuliah::create([
                        'id'      => (string) Str::uuid(),
                        'kode_mk' => $rawCode,
                        'nama_mk' => $courseName,
                        'sks'     => (int) ($courseData['sks'] ?? $courseData['credits'] ?? 3),
                        'status'  => 'ACTIVE',
                    ]);
                } else {
                    $mk->update([
                        'nama_mk' => $courseName,
                        'sks'     => (int) ($courseData['sks'] ?? $courseData['credits'] ?? $mk->sks),
                    ]);
                }

                $courseMapByName[$courseNameKey] = $mk;
                $courseMapByCode[strtolower($rawCode)] = $mk;
            }

            /**
             * ==========================================================
             * 3. CREATE PLO
             * ==========================================================
             */
            $ploMapByCode = [];

            $plosData = $payload['plos'] ?? [];

            foreach ($plosData as $ploData) {

                $ploCode = strtoupper(
                    trim(
                        $ploData['code']
                        ?? $ploData['plo_code']
                        ?? ''
                    )
                );

                if ($ploCode === '') {
                    continue;
                }

                $ploDesc = trim($ploData['description'] ?? '');

                $plo = Plo::where('kode_plo', $ploCode)->first();

                if (!$plo) {
                    $plo = Plo::create([
                        'id'        => (string) Str::uuid(),
                        'kode_plo'  => $ploCode,
                        'deskripsi' => $ploDesc,
                    ]);
                } else {
                    $plo->update([
                        'deskripsi' => $ploDesc,
                    ]);
                }

                $ploMapByCode[$ploCode] = $plo;
            }

            /**
             * ==========================================================
             * 4. CREATE CLO + MAP CLO TO PLO & MATA KULIAH
             * ==========================================================
             */
            $closMappingData =
                $payload['clos_mapping'] ?? [];

            $totalCloMapping = 0;

            foreach ($closMappingData as $cloRow) {

                $courseNameRaw = trim($cloRow['course_name'] ?? '');
                $courseCodeRaw = trim($cloRow['course_code'] ?? '');

                $matchedCourses = [];

                if ($courseNameRaw !== '') {
                    $individualCourseNames = array_filter(array_map('trim', explode(';', $courseNameRaw)));
                    foreach ($individualCourseNames as $cName) {
                        $cObj = $courseMapByName[strtolower($cName)] ?? null;
                        if ($cObj && !in_array($cObj, $matchedCourses, true)) {
                            $matchedCourses[] = $cObj;
                        }
                    }
                }

                if (empty($matchedCourses) && $courseCodeRaw !== '') {
                    $individualCourseCodes = array_filter(array_map('trim', explode(';', $courseCodeRaw)));
                    foreach ($individualCourseCodes as $cCode) {
                        $cObj = $courseMapByCode[strtolower($cCode)] ?? null;
                        if ($cObj && !in_array($cObj, $matchedCourses, true)) {
                            $matchedCourses[] = $cObj;
                        }
                    }
                }

                if (empty($matchedCourses)) {
                    continue;
                }

                $rawCloCode = trim(
                    $cloRow['clo_code']
                    ?? $cloRow['clo_number']
                    ?? ''
                );

                if ($rawCloCode === '') {
                    continue;
                }

                $rawPloCode = trim(
                    $cloRow['plo_code']
                    ?? ''
                );

                $extracted =
                    $this->extractCloCodeParts(
                        $rawCloCode,
                        $rawPloCode
                    );

                $cloCode =
                    strtoupper(
                        $extracted['clo_code']
                    );

                $ploCode =
                    strtoupper(
                        $extracted['plo_code']
                    );

                $cloDesc = trim($cloRow['description'] ?? '');

                $clo = Clo::where('kode_clo', $cloCode)->first();

                if (!$clo) {
                    $clo = Clo::create([
                        'id'        => (string) Str::uuid(),
                        'kode_clo'  => $cloCode,
                        'deskripsi' => $cloDesc,
                    ]);
                } else {
                    $clo->update([
                        'deskripsi' => $cloDesc,
                    ]);
                }

                // Map CLO to PLO
                if ($ploCode !== '') {
                    $plo = $ploMapByCode[$ploCode] ?? Plo::where('kode_plo', $ploCode)->first();

                    if ($plo) {
                        $clo->plo()->syncWithoutDetaching([$plo->id]);
                        foreach ($matchedCourses as $course) {
                            $course->plo()->syncWithoutDetaching([$plo->id]);
                        }
                    }
                }

                // Map MataKuliah to CLO
                foreach ($matchedCourses as $course) {
                    $course->clo()->syncWithoutDetaching([$clo->id]);
                }

                $totalCloMapping++;
            }

            /**
             * ==========================================================
             * ACTIVITY LOG
             * ==========================================================
             */
            $userId = Auth::id();

            $this->activityLogService->log(
                $userId,
                'IMPORT',
                'CURRICULUM',
                "Mengimpor Kurikulum {$curriculumCode} ({$curriculumName}) beserta Mata Kuliah, PLO, dan Pemetaan CLO melalui Wizard",
                [
                    'curriculum_id' => $curriculumId,
                    'code'          => $curriculumCode,
                    'name'          => $curriculumName,
                    'total_courses' => count($coursesData),
                    'total_plos'    => count($plosData),
                    'total_clos_mapping' => $totalCloMapping,
                ]
            );

            return [
                'status'             => 'SUCCESS',
                'curriculum_id'      => $curriculumId,
                'total_courses'      => count($coursesData),
                'total_plos'         => count($plosData),
                'total_clos_mapping' => $totalCloMapping,
            ];
        });
    }

    /**
     * ==============================================================
     * GET CELL VALUE
     * ==============================================================
     */
    protected function getCellValue(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        int|string $column,
        int $row
    ): string {

        $columnLetter = is_numeric($column)
            ? Coordinate::stringFromColumnIndex(
                (int) $column
            )
            : (string) $column;

        return trim(
            (string) $sheet
                ->getCell("{$columnLetter}{$row}")
                ->getValue()
        );
    }

    /**
     * ==============================================================
     * LOCATE HEADER
     * ==============================================================
     */
    protected function locateHeaderAndColumns(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        array $requiredPatterns,
        array $optionalPatterns = [],
        int $maxHeaderRows = 5,
        int $maxCols = 20
    ): array {

        for ($row = 1; $row <= $maxHeaderRows; $row++) {

            $colMap = [];

            for ($col = 1; $col <= $maxCols; $col++) {

                $value = $this->getCellValue(
                    $sheet,
                    $col,
                    $row
                );

                if ($value === '') {
                    continue;
                }

                $normalized = strtolower(
                    preg_replace(
                        '/[^a-zA-Z0-9_]/',
                        '',
                        $value
                    )
                );

                foreach ($requiredPatterns as $key => $pattern) {

                    if (
                        !isset($colMap[$key]) &&
                        preg_match($pattern, $normalized)
                    ) {
                        $colMap[$key] = $col;
                    }
                }

                foreach ($optionalPatterns as $key => $pattern) {

                    if (
                        !isset($colMap[$key]) &&
                        preg_match($pattern, $normalized)
                    ) {
                        $colMap[$key] = $col;
                    }
                }
            }

            $allFound = true;

            foreach (array_keys($requiredPatterns) as $key) {

                if (!isset($colMap[$key])) {
                    $allFound = false;
                    break;
                }
            }

            if ($allFound) {

                return [
                    'header_row' => $row,
                    'col_map' => $colMap,
                ];
            }
        }

        return [
            'header_row' => null,
            'col_map' => [],
        ];
    }

    /**
     * ==============================================================
     * UNMERGE EXCEL
     * ==============================================================
     */
    protected function unmergeAndFillMergedCells($sheet): void
    {
        $mergedRanges = $sheet->getMergeCells();

        foreach ($mergedRanges as $range) {

            $cells =
                Coordinate::extractAllCellReferencesInRange(
                    $range
                );

            if (empty($cells)) {
                continue;
            }

            $topLeftValue =
                $sheet
                    ->getCell($cells[0])
                    ->getValue();

            foreach ($cells as $cell) {
                $sheet->setCellValue(
                    $cell,
                    $topLeftValue
                );
            }

            $sheet->unmergeCells($range);
        }
    }

    /**
     * ==============================================================
     * EXTRACT CLO CODE
     * ==============================================================
     */
    protected function extractCloCodeParts(
        string $rawCloCode,
        string $rawPloCode = ''
    ): array {

        $rawCloCode =
            strtoupper(trim($rawCloCode));

        $rawPloCode =
            strtoupper(trim($rawPloCode));

        if (str_contains($rawCloCode, '-')) {

            [$ploPart, $cloPart] =
                explode(
                    '-',
                    $rawCloCode,
                    2
                );

            $ploPart =
                strtoupper(trim($ploPart));

            $cloPart =
                strtoupper(trim($cloPart));

            return [
                'plo_code' =>
                    $rawPloCode !== ''
                        ? $rawPloCode
                        : $ploPart,

                'clo_code' =>
                    $cloPart,
            ];
        }

        return [
            'plo_code' => $rawPloCode,
            'clo_code' => $rawCloCode,
        ];
    }
}
