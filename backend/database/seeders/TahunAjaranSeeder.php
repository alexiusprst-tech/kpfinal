<?php

namespace Database\Seeders;

use App\Models\TahunAjaran;
use App\Models\PeriodeVerifikasi;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TahunAjaranSeeder extends Seeder
{
    public function run(): void
    {
        $tahunId = (string) Str::uuid();
        TahunAjaran::create([
            'id'            => $tahunId,
            'nama'          => '2026/2027',
            'tahun_mulai'   => 2026,
            'tahun_selesai' => 2027,
            'status'        => 'ACTIVE',
        ]);

        // Periode Ganjil - ACTIVE
        PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $tahunId,
            'nama'            => 'Semester Ganjil 2026/2027',
            'tanggal_mulai'   => '2026-09-01',
            'tanggal_selesai' => '2027-01-31',
            'deadline_upload' => '2026-10-01 23:59:59',
            'status'          => 'ACTIVE',
        ]);

        // Periode Genap - DRAFT
        PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $tahunId,
            'nama'            => 'Semester Genap 2026/2027',
            'tanggal_mulai'   => '2027-02-01',
            'tanggal_selesai' => '2027-06-30',
            'deadline_upload' => '2027-03-01 23:59:59',
            'status'          => 'DRAFT',
        ]);

        $this->command->info('✅ TahunAjaran & PeriodeVerifikasi seeded.');
    }
}
