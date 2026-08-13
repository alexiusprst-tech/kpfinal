<?php

namespace Database\Seeders;

use App\Models\Dosen;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Super Admin ─────────────────────────────────────────────────────────
        $adminId = (string) Str::uuid();
        User::create([
            'id'       => $adminId,
            'name'     => 'Super Administrator',
            'email'    => 'admin@telkomuniversity.ac.id',
            'password' => Hash::make('password'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);

        // ─── Koordinator (Dosen MK) ───────────────────────────────────────────────
        $koordinatorId = (string) Str::uuid();
        $userKoord = User::create([
            'id'       => $koordinatorId,
            'name'     => 'Dr. Ahmad Koordinator, M.T.',
            'email'    => 'dosenmk@telkomuniversity.ac.id',
            'password' => Hash::make('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);

        Dosen::create([
            'id'          => (string) Str::uuid(),
            'kode_dosen'  => 'DSN001',
            'nama_lengkap'=> 'Dr. Ahmad Koordinator, M.T.',
            'email'       => 'dosenmk@telkomuniversity.ac.id',
            'user_id'     => $koordinatorId,
            'status'      => 'ACTIVE',
        ]);

        // ─── Verifikator ─────────────────────────────────────────────────────────
        $verifikatorId = (string) Str::uuid();
        $userVerif = User::create([
            'id'       => $verifikatorId,
            'name'     => 'Prof. Siti Verifikator, Ph.D.',
            'email'    => 'dosenverif@telkomuniversity.ac.id',
            'password' => Hash::make('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);

        Dosen::create([
            'id'          => (string) Str::uuid(),
            'kode_dosen'  => 'DSN002',
            'nama_lengkap'=> 'Prof. Siti Verifikator, Ph.D.',
            'email'       => 'dosenverif@telkomuniversity.ac.id',
            'user_id'     => $verifikatorId,
            'status'      => 'ACTIVE',
        ]);

        // ─── Additional demo dosen ───────────────────────────────────────────────
        $demoDosenData = [
            ['DSN003', 'Dr. Budi Santoso, M.Kom.', 'budi.santoso@telkomuniversity.ac.id'],
            ['DSN004', 'Ir. Dewi Rahayu, M.T.',    'dewi.rahayu@telkomuniversity.ac.id'],
            ['DSN005', 'Dr. Eko Prasetyo, M.Si.',  'eko.prasetyo@telkomuniversity.ac.id'],
        ];

        foreach ($demoDosenData as [$kode, $nama, $email]) {
            Dosen::create([
                'id'           => (string) Str::uuid(),
                'kode_dosen'   => $kode,
                'nama_lengkap' => $nama,
                'email'        => $email,
                'user_id'      => null,
                'status'       => 'ACTIVE',
            ]);
        }

        $this->command->info('✅ Users & Dosen seeded successfully.');
        $this->command->line('   → admin@telkomuniversity.ac.id (SUPER_ADMIN) | password: password');
        $this->command->line('   → dosenmk@telkomuniversity.ac.id (KOORDINATOR) | password: password');
        $this->command->line('   → dosenverif@telkomuniversity.ac.id (VERIFIKATOR) | password: password');
    }
}
