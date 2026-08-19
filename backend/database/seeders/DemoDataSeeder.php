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
            ['CLO01', 'Mampu memahami dan menjelaskan konsep dasar bidang infokom serta pengetahuan komputasi yang digunakan dalam lingkup sistem informasi.'],
            ['CLO02', 'Mampu mengidentifikasi kebutuhan sistem informasi yang komplek dalam konteks enterprise atau masyarakat.'],
            ['CLO03', 'Mampu menerapkan pengetahuan matematika dan statistika dalam lingkup disiplin ilmu sistem informasi.'],
            ['CLO04', 'Mampu membuat perancangan sistem informasi untuk memenuhi kebutuhan organisasi menuju datadriven organization.'],
            ['CLO05', 'Mampu mengevaluasi solusi berbasis sistem informasi dengan menggunakan metode yang tepat.'],
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
        $allMataKuliah = MataKuliah::all();
        foreach ($allMataKuliah as $mk) {
            // Attach all PLOs and CLOs to each MK for demo
            $mk->plo()->sync(array_values(array_map(fn($p) => $p->id, $plos)));
            $mk->clo()->sync(array_values(array_map(fn($c) => $c->id, $clos)));
        }

        $this->command->info('✅ Demo data (PLO, CLO, MataKuliah) seeded.');
    }
}
