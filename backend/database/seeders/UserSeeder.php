<?php

namespace Database\Seeders;

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

        $this->command->info('✅ Super Admin seeded successfully.');
        $this->command->line('   → admin@telkomuniversity.ac.id (SUPER_ADMIN) | password: password');
    }
}
