<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Dosen $dosen;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dosen Test',
            'email'    => 'dosen@telkomuniversity.ac.id',
            'password' => Hash::make('secret123'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);

        $this->dosen = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'DSN01',
            'nama_lengkap' => 'Dosen Test, M.Kom.',
            'email'        => 'dosen@telkomuniversity.ac.id',
            'user_id'      => $this->user->id,
            'status'       => 'ACTIVE',
        ]);

        $ta = \App\Models\TahunAjaran::create([
            'id'           => (string) Str::uuid(),
            'nama'         => '2026/2027',
            'tahun_mulai'  => 2026,
            'tahun_selesai'=> 2027,
            'status'       => 'ACTIVE',
        ]);

        $periode = \App\Models\PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $ta->id,
            'nama'            => 'UTS Ganjil 2026/2027',
            'tanggal_mulai'   => '2026-10-01',
            'tanggal_selesai' => '2026-10-31',
            'deadline_upload' => '2026-10-25 23:59:59',
            'status'          => 'ACTIVE',
        ]);

        $mk = \App\Models\MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'MK001',
            'nama_mk'  => 'Mata Kuliah Test',
            'sks'      => 3,
            'semester' => 1,
            'status'   => 'ACTIVE',
        ]);

        \App\Models\PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosen->id,
            'mata_kuliah_id' => $mk->id,
            'periode_id'     => $periode->id,
            'assigned_by'    => $this->user->id,
            'status'         => 'ACTIVE',
        ]);
    }

    public function test_user_can_login_with_valid_email_and_password(): void
    {
        $response = $this->post('/login', [
            'email'    => 'dosen@telkomuniversity.ac.id',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/koordinator/dashboard');
        $this->assertAuthenticatedAs($this->user);
    }

    public function test_user_can_login_with_kode_dosen(): void
    {
        $response = $this->post('/login', [
            'email'    => 'DSN01',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/koordinator/dashboard');
        $this->assertAuthenticatedAs($this->user);
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        $response = $this->post('/login', [
            'email'    => 'dosen@telkomuniversity.ac.id',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->user->update(['status' => 'INACTIVE']);

        $response = $this->post('/login', [
            'email'    => 'dosen@telkomuniversity.ac.id',
            'password' => 'secret123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_authenticated_user_can_change_password(): void
    {
        $this->actingAs($this->user);

        $response = $this->put('/password', [
            'current_password'      => 'secret123',
            'password'              => 'new-strong-pass123',
            'password_confirmation' => 'new-strong-pass123',
        ]);

        $response->assertSessionHas('success');
        $this->assertTrue(Hash::check('new-strong-pass123', $this->user->fresh()->password));
    }

    public function test_change_password_fails_with_incorrect_current_password(): void
    {
        $this->actingAs($this->user);

        $response = $this->put('/password', [
            'current_password'      => 'wrong-current-pass',
            'password'              => 'new-strong-pass123',
            'password_confirmation' => 'new-strong-pass123',
        ]);

        $response->assertSessionHasErrors('current_password');
        $this->assertFalse(Hash::check('new-strong-pass123', $this->user->fresh()->password));
    }

    public function test_dosen_assigned_as_verifikator_logs_in_to_verifikator_dashboard(): void
    {
        $admin = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Super Admin',
            'email'    => 'admin@telkomuniversity.ac.id',
            'password' => Hash::make('secret123'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);

        $ta = \App\Models\TahunAjaran::create([
            'id'            => (string) Str::uuid(),
            'nama'          => '2026/2027 Ganjil',
            'tahun_mulai'   => 2026,
            'tahun_selesai' => 2027,
            'status'        => 'ACTIVE',
        ]);

        $periode = \App\Models\PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $ta->id,
            'nama'            => 'Periode 2026/2027 Ganjil',
            'tanggal_mulai'   => now()->subDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(20)->toDateString(),
            'deadline_upload' => now()->addDays(10),
            'status'          => 'ACTIVE',
        ]);

        $mk = \App\Models\MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'MK101',
            'nama_mk'  => 'Algoritma Pemrograman',
            'sks'      => 3,
            'semester' => 1,
            'status'   => 'ACTIVE',
        ]);

        $verifUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dosen Verif Test',
            'email'    => 'ark@telkomuniversity.ac.id',
            'password' => Hash::make('secret123'),
            'role'     => 'KOORDINATOR', // starts as KOORDINATOR in DB
            'status'   => 'ACTIVE',
        ]);

        $verifDosen = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'ARK',
            'nama_lengkap' => 'Arif Rahman Hakim, S.Kom., M.Kom.',
            'email'        => 'ark@telkomuniversity.ac.id',
            'user_id'      => $verifUser->id,
            'status'       => 'ACTIVE',
        ]);

        \App\Models\PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $verifDosen->id,
            'mata_kuliah_id' => $mk->id,
            'periode_id'     => $periode->id,
            'assigned_by'    => $admin->id,
            'status'         => 'ACTIVE',
        ]);

        $response = $this->post('/login', [
            'email'    => 'ARK',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/verifikator/dashboard');
        $this->assertEquals('VERIFIKATOR', $verifUser->fresh()->role);
    }
}
