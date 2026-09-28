<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('auth:reset-all-passwords {--force : Jalankan tanpa meminta konfirmasi}', function () {
    $force = $this->option('force');

    if (!$force && !$this->confirm('Apakah Anda yakin ingin mereset kata sandi semua akun dosen/user ke default password?')) {
        $this->warn('Operasi dibatalkan.');
        return 0;
    }

    $users = User::with('dosen')->orderBy('email')->get();
    $total = $users->count();
    $resetCount = 0;
    $rows = [];

    $this->info("Memulai reset kata sandi untuk {$total} akun pengguna...");

    DB::transaction(function () use ($users, &$resetCount, &$rows) {
        foreach ($users as $user) {
            $dosen = $user->dosen;
            $defaultPassword = 'password';
            $mustChange = true;
            $category = 'User Umum';

            if ($user->role === 'SUPER_ADMIN') {
                $defaultPassword = 'password';
                $mustChange = false;
                $category = 'Super Admin';
            } elseif ($dosen) {
                if (!empty($dosen->nip)) {
                    $defaultPassword = trim($dosen->nip);
                    $category = 'Dosen (NIP)';
                } else {
                    $defaultPassword = 'password';
                    $category = 'Dosen (Tanpa NIP)';
                }
                $mustChange = true;
            }

            $user->password = Hash::make($defaultPassword);
            $user->must_change_password = $mustChange;
            $user->remember_token = null;
            $user->save();

            $resetCount++;
            $rows[] = [
                $user->email,
                $user->name,
                $user->role ?? '-',
                $category,
                $defaultPassword,
                $mustChange ? 'Ya' : 'Tidak',
            ];
        }

        // Bersihkan sesi aktif jika tabel sessions ada
        if (Schema::hasTable('sessions')) {
            DB::table('sessions')->truncate();
        }
    });

    $this->newLine();
    $this->table(
        ['Email', 'Nama', 'Role', 'Kategori', 'Default Password', 'Wajib Ganti Password'],
        $rows
    );

    $this->newLine();
    $this->info("✅ Berhasil mereset kata sandi {$resetCount} akun ke default password.");
    $this->line("ℹ️ Sesi aktif telah dibersihkan.");

    return 0;
})->purpose('Reset semua kata sandi akun pengguna/dosen ke default password (NIP untuk dosen, atau "password")');

