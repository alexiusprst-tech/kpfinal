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
            ['nama' => 'UTS', 'deskripsi' => 'Ujian Tengah Semester (UTS)'],
            ['nama' => 'UAS', 'deskripsi' => 'Ujian Akhir Semester (UAS)'],
            ['nama' => 'Quiz', 'deskripsi' => 'Quiz / Kuis'],
            ['nama' => 'Tugas', 'deskripsi' => 'Tugas Mandiri / Terstruktur'],
            ['nama' => 'Tugas Besar', 'deskripsi' => 'Tugas Besar / Proyek (Tubus)'],
            ['nama' => 'Praktikum', 'deskripsi' => 'Praktikum / Responsi'],
        ];

        foreach ($categories as $cat) {
            $existing = KategoriSoal::where('nama', $cat['nama'])->first();
            if ($existing) {
                $existing->update([
                    'deskripsi' => $cat['deskripsi'],
                    'status'    => 'ACTIVE',
                ]);
            } else {
                KategoriSoal::create([
                    'id'        => (string) Str::uuid(),
                    'nama'      => $cat['nama'],
                    'deskripsi' => $cat['deskripsi'],
                    'status'    => 'ACTIVE',
                ]);
            }
        }

        $this->command->info('✅ KategoriSoal seeded.');
    }
}

