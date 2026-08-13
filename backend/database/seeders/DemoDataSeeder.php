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
        // ─── PLO ───────────────────────────────────────────────────────────────
        $plos = [];
        $ploData = [
            ['PLO01', 'Mampu menerapkan pengetahuan matematika, sains, dan rekayasa.'],
            ['PLO02', 'Mampu merancang dan melaksanakan eksperimen.'],
            ['PLO03', 'Mampu merancang sistem, komponen, atau proses untuk memenuhi kebutuhan.'],
            ['PLO04', 'Mampu bekerja dalam tim multidisiplin.'],
            ['PLO05', 'Mampu mengidentifikasi dan memecahkan masalah rekayasa.'],
        ];

        foreach ($ploData as [$kode, $deskripsi]) {
            $plo = Plo::create([
                'id'        => (string) Str::uuid(),
                'kode_plo'  => $kode,
                'deskripsi' => $deskripsi,
            ]);
            $plos[$kode] = $plo;
        }

        // ─── CLO ───────────────────────────────────────────────────────────────
        $clos = [];
        $cloData = [
            ['CLO01', 'Mampu memahami konsep dasar pemrograman berorientasi objek.'],
            ['CLO02', 'Mampu mengimplementasikan algoritma dan struktur data.'],
            ['CLO03', 'Mampu merancang basis data relasional.'],
            ['CLO04', 'Mampu membangun aplikasi web menggunakan framework modern.'],
            ['CLO05', 'Mampu menganalisis kebutuhan sistem informasi.'],
        ];

        foreach ($cloData as [$kode, $deskripsi]) {
            $clo = Clo::create([
                'id'        => (string) Str::uuid(),
                'kode_clo'  => $kode,
                'deskripsi' => $deskripsi,
            ]);
            $clos[$kode] = $clo;
        }

        // ─── CLO - PLO mapping ─────────────────────────────────────────────────
        $clos['CLO01']->plo()->attach([$plos['PLO01']->id, $plos['PLO05']->id]);
        $clos['CLO02']->plo()->attach([$plos['PLO01']->id, $plos['PLO03']->id]);
        $clos['CLO03']->plo()->attach([$plos['PLO03']->id]);
        $clos['CLO04']->plo()->attach([$plos['PLO03']->id, $plos['PLO05']->id]);
        $clos['CLO05']->plo()->attach([$plos['PLO02']->id, $plos['PLO05']->id]);

        // ─── Mata Kuliah ───────────────────────────────────────────────────────
        $mkData = [
            ['IF101', 'Algoritma dan Pemrograman',   3],
            ['IF201', 'Struktur Data',                3],
            ['IF301', 'Basis Data',                   3],
            ['IF401', 'Pemrograman Web',              3],
            ['IF501', 'Sistem Informasi',             2],
            ['IF601', 'Rekayasa Perangkat Lunak',     3],
        ];

        foreach ($mkData as [$kode, $nama, $sks]) {
            $mk = MataKuliah::create([
                'id'      => (string) Str::uuid(),
                'kode_mk' => $kode,
                'nama_mk' => $nama,
                'sks'     => $sks,
                'status'  => 'ACTIVE',
            ]);

            // Attach all PLOs and CLOs to each MK for demo
            $mk->plo()->attach(array_column($ploData, 0, 0) ? array_values(array_map(fn($p) => $p->id, $plos)) : []);
            $mk->clo()->attach(array_values(array_map(fn($c) => $c->id, $clos)));
        }

        $this->command->info('✅ Demo data (PLO, CLO, MataKuliah) seeded.');
    }
}
