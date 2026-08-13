<?php

namespace Database\Seeders;

use App\Models\KategoriSoal;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KategoriSoalSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['nama' => 'UTS',      'deskripsi' => 'Ujian Tengah Semester'],
            ['nama' => 'UAS',      'deskripsi' => 'Ujian Akhir Semester'],
            ['nama' => 'Kuis',     'deskripsi' => 'Kuis Harian'],
            ['nama' => 'Praktikum','deskripsi' => 'Soal Praktikum'],
            ['nama' => 'Susulan',  'deskripsi' => 'Ujian Susulan'],
        ];

        foreach ($categories as $cat) {
            KategoriSoal::create([
                'id'       => (string) Str::uuid(),
                'nama'     => $cat['nama'],
                'deskripsi'=> $cat['deskripsi'],
                'status'   => 'ACTIVE',
            ]);
        }

        $this->command->info('✅ KategoriSoal seeded.');
    }
}
