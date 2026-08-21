<?php

namespace Database\Seeders;

use App\Models\MataKuliah;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MataKuliahSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            // Semester 1
            [1, 'UAKXCCB2', 'Agama', 'Religion', 2],
            [1, 'UCK1EDB1', 'Internalisasi Budaya dan Pembentukan Karakter', 'Cultural Internalization and Character Formation', 1],
            [1, 'BBK1AAB4', 'Algoritma dan Pemrograman', 'Algorithms and Programming', 4],
            [1, 'BBK1BAB3', 'Matematika Diskrit', 'Discrete Mathematics', 3],
            [1, 'BBK1CAB3', 'Matematika untuk Sistem Informasi', 'Mathematics for Information Systems', 3],
            [1, 'BBK1DAB3', 'Pengantar Sistem Informasi', 'Introduction to Information System', 3],
            [1, 'BBK1EAB3', 'Sistem Enterprise', 'Enterprise System', 3],

            // Semester 2
            [2, 'BBK1FAB3', 'Design Thinking', 'Design Thinking', 3],
            [2, 'BBK1GAB3', 'Jaringan Komputer', 'Computer Network', 3],
            [2, 'BBK1HAB2', 'Kepemimpinan dan Komunikasi Interpersonal', 'Leadership and Interpersonal Communication', 2],
            [2, 'BBK1IAB3', 'Manajemen Rantai Pasok', 'Supply Chain Management', 3],
            [2, 'BBK1JAB3', 'Pemrograman Berorientasi Objek', 'Object Oriented Programming', 3],
            [2, 'BBK1KAB2', 'Probabilitas dan Statistik', 'Probability and Statistics', 2],
            [2, 'BBK1LAB3', 'Sistem Basis Data', 'Database System', 3],

            // Semester 3
            [3, 'BBK2AAB3', 'Analisis dan Perancangan Sistem Informasi', 'Analysis and Design of Information System', 3],
            [3, 'BBK2BAB2', 'Etika Profesi, Regulasi Teknologi Informasi dan Properti Intelektual', 'Professional Ethics, IT Regulations, and Intellectual Property', 2],
            [3, 'BBK2CAB3', 'Pemodelan Proses Bisnis', 'Business Process Modelling', 3],
            [3, 'BBK2DAB3', 'Pengembangan Aplikasi Website', 'Web Application Development', 3],
            [3, 'BBK2EAB3', 'Perancangan Interaksi', 'Interaction Design', 3],
            [3, 'BBK2FAB3', 'Sistem Operasi', 'Operating Systems', 3],
            [3, 'BBK2GAB3', 'Statistika Industri', 'Industrial Statistics', 3],

            // Semester 4
            [4, 'BBK2HAB3', 'Integrasi Aplikasi Enterprise', 'Enterprise Application Integration', 3],
            [4, 'BBK2IAB3', 'Keamanan Sistem Informasi', 'Information System Security', 3],
            [4, 'BBK2JAB3', 'Manajemen Proyek Sistem Informasi', 'Project Management for Information Systems', 3],
            [4, 'BBK2KAB3', 'Manajemen Sumber Daya Manusia', 'Human Resource Management', 3],
            [4, 'BBK2LAB3', 'Penambangan Data', 'Data Mining', 3],
            [4, 'BBK2MAB2', 'Pengujian dan Implementasi Sistem', 'Testing and System Implementation', 2],
            [4, 'BBK2NAB3', 'Rekayasa Proses Bisnis', 'Business Process Engineering', 3],

            // Semester 5
            [5, 'UCKXADB2', 'Bahasa Inggris', 'English', 2],
            [5, 'BBK3AAB3', 'Arsitektur Enterprise', 'Enterprise Architecture', 3],
            [5, 'BBK3BAB3', 'Data Warehouse dan Business Intelligence', 'Data Warehouse and Business Intelligence', 3],
            [5, 'BBK3CAB3', 'Komputasi Awan', 'Cloud Computing', 3],
            [5, 'BBK3DAB3', 'Manajemen Data Enterprise', 'Enterprise Data Management', 3],
            [5, 'BBK3EAB3', 'Proyek Perangkat Lunak', 'Software Project', 3],
            [5, 'BBK3FAB3', 'Sistem Informasi Akuntansi', 'Information System for Accounting', 3],

            // Semester 6
            [6, 'UBKXCCB2', 'Bahasa Indonesia', 'Indonesian Language', 2],
            [6, 'BBK3GAB3', 'Bahasa Inggris II', 'English II', 3],
            [6, 'BBK3HAB3', 'Kecerdasan Artifisial dan Penerapannya', 'Artificial Intelligence and Its Application', 3],
            [6, 'BBK3IAB2', 'Kerja Praktek dan Pengabdian Masyarakat', 'Internship and Community Service', 2],
            [6, 'BBK3JAB3', 'Tata Kelola dan Manajemen Teknologi Informasi', 'Information Technology Governance and Management', 3],
            [6, 'BBK3P013', 'MK Pilihan Prodi I / MK MBKM / MK WRAP', 'Elective I', 3],
            [6, 'BBK3P023', 'MK Pilihan Prodi II / MK MBKM / MK WRAP', 'Elective II', 3],

            // Semester 7
            [7, 'UCKXBDB2', 'Kewirausahaan', 'Entrepreneurship', 2],
            [7, 'BBK4AAC4', 'Capstone Project', 'Capstone Project', 4],
            [7, 'BBK4BAB2', 'Metode Penelitian dan Penyusunan Karya Ilmiah', 'Research Method and Scientific Writing', 2],
            [7, 'BBK4P033', 'MK Pilihan Prodi III / MK MBKM / MK WRAP', 'Elective III', 3],
            [7, 'BBK4P043', 'MK Pilihan Prodi IV / MK MBKM / MK WRAP', 'Elective IV', 3],
            [7, 'BBK4P053', 'MK Pilihan Prodi V / MK MBKM / MK WRAP', 'Elective V', 3],

            // Semester 8
            [8, 'UBKXACB2', 'Kewarganegaraan', 'Civics Education', 2],
            [8, 'UBKXBCB2', 'Pancasila', 'Pancasila', 2],
            [8, 'BBK4CAB3', 'Pelatihan dan Sertifikasi', 'Training and Certification', 3],
            [8, 'BBK4DAA4', 'Tugas Akhir', 'Final Project', 4],
        ];

        $seededCodes = [];
        foreach ($courses as [$semester, $kode, $namaIna, $namaEng, $sks]) {
            MataKuliah::updateOrCreate(
                ['kode_mk' => $kode],
                [
                    'nama_mk'    => $namaIna,
                    'nama_mk_en' => $namaEng,
                    'sks'        => $sks,
                    'semester'   => $semester,
                    'status'     => 'ACTIVE',
                ]
            );
            $seededCodes[] = $kode;
        }

        // Safely deactivate any old MataKuliah records not in the current curriculum list
        MataKuliah::whereNotIn('kode_mk', $seededCodes)->update(['status' => 'INACTIVE']);

        $this->command->info('✅ Berhasil menyemai 52 Data Mata Kuliah Kurikulum.');
    }
}
