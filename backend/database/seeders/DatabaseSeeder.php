<?php

namespace Database\Seeders;

use App\Models\KategoriSoal;
use App\Models\TahunAjaran;
use App\Models\PeriodeVerifikasi;
use App\Models\Dosen;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            DosenSeeder::class,
            MataKuliahSeeder::class,
            TahunAjaranSeeder::class,
            KategoriSoalSeeder::class,
            CloSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
