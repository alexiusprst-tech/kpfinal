<?php

namespace Database\Seeders;

use App\Models\Clo;
use App\Models\MataKuliah;
use App\Models\Plo;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CloSeeder extends Seeder
{
    public function run(): void
    {
        // ─── 1. PLO Master Data (10 Program Learning Outcomes) ────────────────
        $plosData = [
            'PLO01' => 'Mampu menganalisis permasalahan infokom yang komplek, mendefinisikan, dan memodelkan kebutuhan dalam konteks enterprise atau masyarakat dengan menerapkan ilmu dan pengetahuan dalam bidang komputasi, teknologi informasi dan komunikasi, dan disiplin lain yang relevan.',
            'PLO02' => 'Mampu merancang, mengembangkan, mengimplementasikan, dan mengevaluasi solusi berbasis sistem informasi untuk memenuhi kebutuhan organisasi menuju data-driven organization.',
            'PLO03' => 'Mampu untuk bekerja secara kolaboratif, proaktif, dan bertanggung jawab dalam tim untuk mencapai tujuan bersama dalam berbagai konteks profesional.',
            'PLO04' => 'Mampu menerapkan pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan agama, moral, etika, dan regulasi, dalam upaya pembangunan berkelanjutan.',
            'PLO05' => 'Mampu berkomunikasi secara efektif baik lisan maupun tulisan dalam berbagai konteks profesional.',
            'PLO06' => 'Mampu menganalisis peran dan dampak dari sistem dan teknologi informasi terhadap upaya pembangunan berkelanjutan baik di level individu, organisasi, dan masyarakat.',
            'PLO07' => 'Mampu menunjukkan kinerja mandiri, bermutu, dan terukur, serta inisiatif dalam pengembangan diri sebagai profesional di bidang sistem informasi.',
            'PLO08' => 'Mampu menggunakan teknik, keahlian, atau kakas terkini yang diperlukan untuk menghasilkan solusi di bidang sistem informasi, baik dalam konteks praktikum ataupun kasus nyata.',
            'PLO09' => 'Mampu mendukung penyelenggaraan, penggunaan, pengelolaan, evaluasi, dan peningkatan Sistem Informasi untuk mencapai tujuan dan sasaran strategi bisnis dari organisasi.',
            'PLO10' => 'Mampu berinovasi dan mengaplikasikan pengetahuan bisnis dalam pengembangan kapasitas menjadi seorang technopreneurship.',
        ];

        $ploModels = [];
        foreach ($plosData as $kode => $deskripsi) {
            $plo = Plo::withTrashed()->where('kode_plo', $kode)->first();
            if ($plo) {
                if ($plo->trashed()) $plo->restore();
                $plo->update(['deskripsi' => $deskripsi]);
            } else {
                $plo = Plo::create([
                    'id'        => (string) Str::uuid(),
                    'kode_plo'  => $kode,
                    'deskripsi' => $deskripsi,
                ]);
            }
            $ploModels[$kode] = $plo;
        }

        // ─── 2. CLO Master Data (37 Course Learning Outcomes per PLO) ─────────
        $closData = [
            // PLO01 (7 CLOs)
            [
                'plo'       => 'PLO01',
                'kode_clo'  => 'PLO01-CLO01',
                'deskripsi' => 'Mampu memahami prinsip-prinsip infokom yang mencakup komputasi, matematika, statistika, teknologi informasi dan komunikasi, dan desain yang terkait dalam bidang sistem informasi',
                'bloom'     => '2 - Understand',
                'mks'       => ['Algoritma dan Pemrograman'],
            ],
            [
                'plo'       => 'PLO01',
                'kode_clo'  => 'PLO01-CLO02',
                'deskripsi' => 'Mampu mengidentifikasi kebutuhan sistem informasi yang komplek dalam konteks enterprise atau masyarakat',
                'bloom'     => '4 - Analyze',
                'mks'       => ['Sistem Enterprise'],
            ],
            [
                'plo'       => 'PLO01',
                'kode_clo'  => 'PLO01-CLO03',
                'deskripsi' => 'Mampu menganalisis permasalahan yang kompleks dalam bidang infokom dalam konteks enterprise atau masyarakat',
                'bloom'     => '4 - Analyze',
                'mks'       => ['Pengembangan Aplikasi Website'],
            ],
            [
                'plo'       => 'PLO01',
                'kode_clo'  => 'PLO01-CLO04',
                'deskripsi' => 'Mampu mendefinisikan dan memodelkan kebutuhan dalam bidang infokom dalam konteks enterprise atau masyarakat',
                'bloom'     => '4 - Analyze',
                'mks'       => ['Pengujian dan Implementasi Sistem'],
            ],
            [
                'plo'       => 'PLO01',
                'kode_clo'  => 'PLO01-CLO05',
                'deskripsi' => 'Mampu menerapkan pengetahuan matematika dan statistika dalam lingkup disiplin ilmu sistem informasi',
                'bloom'     => '3 - Apply',
                'mks'       => ['Sistem Basis Data'],
            ],
            [
                'plo'       => 'PLO01',
                'kode_clo'  => 'PLO01-CLO06',
                'deskripsi' => 'Mampu menerapkan prinsip infokom dalam komputasi, teknologi informasi dan komunikasi, dan desain dalam lingkup disiplin ilmu sistem informasi',
                'bloom'     => '3 - Apply',
                'mks'       => ['Bahasa Inggris II'],
            ],
            [
                'plo'       => 'PLO01',
                'kode_clo'  => 'PLO01-CLO07',
                'deskripsi' => 'Mampu menerapkan perspektif disiplin lain dalam analisis permasalahan infokom',
                'bloom'     => '3 - Apply',
                'mks'       => ['Bahasa Inggris'],
            ],

            // PLO02 (3 CLOs)
            [
                'plo'       => 'PLO02',
                'kode_clo'  => 'PLO02-CLO01',
                'deskripsi' => 'Mampu membuat perancangan sistem informasi untuk memenuhi kebutuhan organisasi menuju data-driven organization',
                'bloom'     => '6 - Create',
                'mks'       => ['Sistem Basis Data'],
            ],
            [
                'plo'       => 'PLO02',
                'kode_clo'  => 'PLO02-CLO02',
                'deskripsi' => 'Mampu mengembangkan solusi berbasis sistem informasi menggunakan metodologi pengembangan yang tepat.',
                'bloom'     => '6 - Create',
                'mks'       => ['Analisis dan Perancangan Sistem Informasi'],
            ],
            [
                'plo'       => 'PLO02',
                'kode_clo'  => 'PLO02-CLO03',
                'deskripsi' => 'Mampu mengevaluasi solusi berbasis sistem informasi dengan menggunakan metode yang tepat.',
                'bloom'     => '5 - Evaluate',
                'mks'       => ['Bahasa Indonesia'],
            ],

            // PLO03 (2 CLOs)
            [
                'plo'       => 'PLO03',
                'kode_clo'  => 'PLO03-CLO01',
                'deskripsi' => 'Mampu berkontribusi secara aktif dan proaktif dan bertanggung jawab dalam tim kerja untuk mencapai tujuan bersama dalam lingkungan profesional',
                'bloom'     => '3 - Apply',
                'mks'       => ['Data Warehouse dan Business Intelligence'],
            ],
            [
                'plo'       => 'PLO03',
                'kode_clo'  => 'PLO03-CLO02',
                'deskripsi' => 'Mampu beradaptasi dalam berbagai konteks profesional untuk mencapai tujuan bersama',
                'bloom'     => '3 - Apply',
                'mks'       => ['Jaringan Komputer'],
            ],

            // PLO04 (7 CLOs)
            [
                'plo'       => 'PLO04',
                'kode_clo'  => 'PLO04-CLO01',
                'deskripsi' => 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan agama dalam upaya pembangunan berkelanjutan.',
                'bloom'     => '2 - Understand',
                'mks'       => ['Pancasila'],
            ],
            [
                'plo'       => 'PLO04',
                'kode_clo'  => 'PLO04-CLO02',
                'deskripsi' => 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan.',
                'bloom'     => '2 - Understand',
                'mks'       => ['Kepemimpinan dan Komunikasi Interpersonal'],
            ],
            [
                'plo'       => 'PLO04',
                'kode_clo'  => 'PLO04-CLO03',
                'deskripsi' => 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan regulasi dalam upaya pembangunan berkelanjutan.',
                'bloom'     => '2 - Understand',
                'mks'       => ['Internalisasi Budaya dan Pembentukan Karakter'],
            ],
            [
                'plo'       => 'PLO04',
                'kode_clo'  => 'PLO04-CLO04',
                'deskripsi' => 'Mampu menganalisis pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan.',
                'bloom'     => '4 - Analyze',
                'mks'       => ['Manajemen Proyek Sistem Informasi'],
            ],
            [
                'plo'       => 'PLO04',
                'kode_clo'  => 'PLO04-CLO05',
                'deskripsi' => 'Mampu menerapkan pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan.',
                'bloom'     => '3 - Apply',
                'mks'       => ['Proyek Perangkat Lunak'],
            ],
            [
                'plo'       => 'PLO04',
                'kode_clo'  => 'PLO04-CLO06',
                'deskripsi' => 'Mampu menerapkan pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan regulasi dalam upaya pembangunan berkelanjutan.',
                'bloom'     => '3 - Apply',
                'mks'       => ['Penambangan Data'],
            ],
            [
                'plo'       => 'PLO04',
                'kode_clo'  => 'PLO04-CLO07',
                'deskripsi' => 'Mampu menganalisis pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan.',
                'bloom'     => '4 - Analyze',
                'mks'       => ['Probabilitas dan Statistik'],
            ],

            // PLO05 (2 CLOs)
            [
                'plo'       => 'PLO05',
                'kode_clo'  => 'PLO05-CLO01',
                'deskripsi' => 'Mampu memahami prinsip komunikasi secara efektif dalam bentuk lisan dan tulisan dalam berbagai konteks profesional.',
                'bloom'     => '2 - Understand',
                'mks'       => ['Sistem Informasi Akuntansi'],
            ],
            [
                'plo'       => 'PLO05',
                'kode_clo'  => 'PLO05-CLO02',
                'deskripsi' => 'Mampu berkomunikasi secara efektif dalam bentuk lisan dan tulisan dalam berbagai konteks profesional.',
                'bloom'     => '3 - Apply',
                'mks'       => ['Statistika Industri'],
            ],

            // PLO06 (2 CLOs)
            [
                'plo'       => 'PLO06',
                'kode_clo'  => 'PLO06-CLO01',
                'deskripsi' => 'Mampu menjelaskan peran dan dampak dari sistem dan teknologi informasi dalam upaya pembangunan berkelanjutan di level individu, organisasi, dan masyarakat',
                'bloom'     => '2 - Understand',
                'mks'       => ['Proyek Perangkat Lunak'],
            ],
            [
                'plo'       => 'PLO06',
                'kode_clo'  => 'PLO06-CLO02',
                'deskripsi' => 'Mampu menganalisis peran dan dampak dari sistem dan teknologi informasi dalam upaya pembangunan berkelanjutan di level individu, organisasi, dan masyarakat',
                'bloom'     => '4 - Analyze',
                'mks'       => ['Pengembangan Aplikasi Website'],
            ],

            // PLO07 (3 CLOs)
            [
                'plo'       => 'PLO07',
                'kode_clo'  => 'PLO07-CLO01',
                'deskripsi' => 'Mampu menunjukkan kinerja mandiri di bidang sistem informasi',
                'bloom'     => '3 - Apply',
                'mks'       => ['Pelatihan dan Sertifikasi'],
            ],
            [
                'plo'       => 'PLO07',
                'kode_clo'  => 'PLO07-CLO02',
                'deskripsi' => 'Mampu menunjukkan kinerja bermutu dan terukur di bidang sistem informasi',
                'bloom'     => '3 - Apply',
                'mks'       => ['Tugas Akhir'],
            ],
            [
                'plo'       => 'PLO07',
                'kode_clo'  => 'PLO07-CLO03',
                'deskripsi' => 'Mampu berinisiatif dalam aktivitas pengembangan diri sebagai profesional di bidang sistem informasi',
                'bloom'     => '3 - Apply',
                'mks'       => ['Pemodelan Proses Bisnis'],
            ],

            // PLO08 (2 CLOs)
            [
                'plo'       => 'PLO08',
                'kode_clo'  => 'PLO08-CLO01',
                'deskripsi' => 'Mampu menggunakan teknik, metode, perangkat lunak, atau kakas terkini untuk menghasilkan solusi di bidang sistem informasi dalam konteks praktikum',
                'bloom'     => '3 - Apply',
                'mks'       => ['Sistem Enterprise'],
            ],
            [
                'plo'       => 'PLO08',
                'kode_clo'  => 'PLO08-CLO02',
                'deskripsi' => 'Mampu menggunakan teknik, metode, perangkat lunak, atau kakas terkini untuk menghasilkan solusi di bidang sistem informasi dalam konteks kasus nyata',
                'bloom'     => '3 - Apply',
                'mks'       => ['Arsitektur Enterprise'],
            ],

            // PLO09 (6 CLOs)
            [
                'plo'       => 'PLO09',
                'kode_clo'  => 'PLO09-CLO01',
                'deskripsi' => 'Mampu memahami prinsip dan fungsi manajemen Sistem Informasi untuk mendukung strategi bisnis',
                'bloom'     => '2 - Understand',
                'mks'       => ['Rekayasa Proses Bisnis'],
            ],
            [
                'plo'       => 'PLO09',
                'kode_clo'  => 'PLO09-CLO02',
                'deskripsi' => 'Mampu memahami prinsip dan fungsi manajemen Sistem Informasi untuk mendukung strategi bisnis',
                'bloom'     => '2 - Understand',
                'mks'       => ['Pemodelan Proses Bisnis'],
            ],
            [
                'plo'       => 'PLO09',
                'kode_clo'  => 'PLO09-CLO03',
                'deskripsi' => 'Mampu menerapkan ilmu dan praktek yang relevan dalam pengelolaan sistem informasi untuk mendukung strategi bisnis dan tujuan organisasi',
                'bloom'     => '3 - Apply',
                'mks'       => ['Tata Kelola dan Manajemen Teknologi Informasi'],
            ],
            [
                'plo'       => 'PLO09',
                'kode_clo'  => 'PLO09-CLO04',
                'deskripsi' => 'Mampu memodelkan penyelenggaraan sistem informasi di konteks organisasi',
                'bloom'     => '4 - Analyze',
                'mks'       => ['Bahasa Indonesia'],
            ],
            [
                'plo'       => 'PLO09',
                'kode_clo'  => 'PLO09-CLO05',
                'deskripsi' => 'Mampu mengevaluasi kinerja sistem informasi dan mengusulkan perbaikan untuk meningkatkan kontribusi sistem informasi terhadap tujuan bisnis organisasi.',
                'bloom'     => '5 - Evaluate',
                'mks'       => ['Manajemen Data Enterprise'],
            ],
            [
                'plo'       => 'PLO09',
                'kode_clo'  => 'PLO09-CLO06',
                'deskripsi' => 'Mampu merancang arsitektur sistem informasi untuk mendukung strategi bisnis dan tujuan organisasi',
                'bloom'     => '6 - Create',
                'mks'       => ['Etika Profesi, Regulasi Teknologi Informasi dan Properti Intelektual'],
            ],

            // PLO10 (3 CLOs)
            [
                'plo'       => 'PLO10',
                'kode_clo'  => 'PLO10-CLO01',
                'deskripsi' => 'Mampu memahami prinsip dan tahap dalam inisiatif bisnis berbasis sistem dan teknologi informasi',
                'bloom'     => '2 - Understand',
                'mks'       => ['Komputasi Awan'],
            ],
            [
                'plo'       => 'PLO10',
                'kode_clo'  => 'PLO10-CLO02',
                'deskripsi' => 'Mampu mengembangkan kapasitas sebagai technopreneurship seperti komunikasi, inovasi, dan networking',
                'bloom'     => '3 - Apply',
                'mks'       => ['Kewirausahaan'],
            ],
            [
                'plo'       => 'PLO10',
                'kode_clo'  => 'PLO10-CLO03',
                'deskripsi' => 'Mampu mengembangkan rancangan produk atau layanan berbasis teknologi informasi',
                'bloom'     => '6 - Create',
                'mks'       => ['Pancasila'],
            ],
        ];

        // Clean up old generic CLO records (CLO01-CLO07) that were merged across all PLOs
        $oldGenericCodes = ['CLO01', 'CLO02', 'CLO03', 'CLO04', 'CLO05', 'CLO06', 'CLO07'];
        $oldClos = Clo::withTrashed()->whereIn('kode_clo', $oldGenericCodes)->get();
        foreach ($oldClos as $oc) {
            $oc->plo()->detach();
            $oc->mataKuliah()->detach();
            $oc->forceDelete();
        }

        $allMks = MataKuliah::all()->keyBy(fn($m) => strtolower(trim($m->nama_mk)));

        $seededCloCount = 0;
        $totalMappings = 0;

        foreach ($closData as $item) {
            $clo = Clo::withTrashed()->where('kode_clo', $item['kode_clo'])->first();
            if ($clo) {
                if ($clo->trashed()) $clo->restore();
                $clo->update([
                    'deskripsi' => $item['deskripsi'],
                    'bloom'     => $item['bloom'],
                ]);
            } else {
                $clo = Clo::create([
                    'id'        => (string) Str::uuid(),
                    'kode_clo'  => $item['kode_clo'],
                    'deskripsi' => $item['deskripsi'],
                    'bloom'     => $item['bloom'],
                ]);
            }

            // Sync PLO (exact 1-to-1 parent mapping)
            $ploModel = $ploModels[$item['plo']] ?? null;
            if ($ploModel) {
                $clo->plo()->sync([$ploModel->id]);
            }

            // Sync Mata Kuliah
            $mkIds = [];
            foreach ($item['mks'] as $mkName) {
                $mkModel = $allMks[strtolower(trim($mkName))] ?? null;
                if ($mkModel) {
                    $mkIds[] = $mkModel->id;
                    // Also attach PLO to Mata Kuliah in mata_kuliah_plo
                    if ($ploModel) {
                        $mkModel->plo()->syncWithoutDetaching([$ploModel->id]);
                    }
                    $totalMappings++;
                }
            }
            $clo->mataKuliah()->sync($mkIds);
            $seededCloCount++;
        }

        $this->command->info("✅ Berhasil menyemai 10 Master PLO dan {$seededCloCount} Master CLO dengan {$totalMappings} pemetaan Mata Kuliah.");
    }
}
