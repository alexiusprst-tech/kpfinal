<?php

namespace Database\Seeders;

use App\Models\Clo;
use App\Models\MataKuliah;
use App\Models\Plo;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CloSeeder::class);
    }
}
