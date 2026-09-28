<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class DosenManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Super Administrator',
            'email'    => 'admin@telkomuniversity.ac.id',
            'password' => Hash::make('password123'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);
    }

    public function test_superadmin_can_view_dosen_index(): void
    {
        Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => null,
            'nip'          => null,
            'nama_lengkap' => 'Dosen Tanpa Kode',
            'email'        => 'tanpakode@telkomuniversity.ac.id',
            'status'       => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->superAdmin)->get('/superadmin/dosen');
        $response->assertOk();
    }

    public function test_superadmin_can_create_dosen_without_nip_and_without_kode_dosen(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/superadmin/dosen', [
            'nama_lengkap'   => 'Dosen Baru 1',
            'kode_dosen'     => '',
            'nip'            => '',
            'email'          => 'dosenbaru1@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'create_user'    => false,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('dosen', [
            'nama_lengkap' => 'Dosen Baru 1',
            'kode_dosen'   => null,
            'nip'          => null,
            'email'        => 'dosenbaru1@telkomuniversity.ac.id',
        ]);
    }

    public function test_multiple_dosen_can_have_null_kode_dosen_without_unique_constraint_violation(): void
    {
        $response1 = $this->actingAs($this->superAdmin)->post('/superadmin/dosen', [
            'nama_lengkap'   => 'Dosen Baru Pertama',
            'kode_dosen'     => null,
            'nip'            => null,
            'email'          => 'pertama@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'create_user'    => false,
        ]);
        $response1->assertSessionHasNoErrors();

        $response2 = $this->actingAs($this->superAdmin)->post('/superadmin/dosen', [
            'nama_lengkap'   => 'Dosen Baru Kedua',
            'kode_dosen'     => null,
            'nip'            => null,
            'email'          => 'kedua@telkomuniversity.ac.id',
            'kategori_dosen' => 'LB',
            'create_user'    => false,
        ]);
        $response2->assertSessionHasNoErrors();

        $this->assertDatabaseHas('dosen', ['nama_lengkap' => 'Dosen Baru Pertama', 'kode_dosen' => null]);
        $this->assertDatabaseHas('dosen', ['nama_lengkap' => 'Dosen Baru Kedua', 'kode_dosen' => null]);
    }

    public function test_superadmin_can_create_dosen_with_user_when_nip_is_absent(): void
    {
        $response = $this->actingAs($this->superAdmin)->post('/superadmin/dosen', [
            'nama_lengkap'   => 'Dosen Baru Akun',
            'kode_dosen'     => '',
            'nip'            => '',
            'email'          => 'akundosen@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'create_user'    => true,
        ]);

        $response->assertSessionHasNoErrors();

        $createdUser = User::where('email', 'akundosen@telkomuniversity.ac.id')->first();
        $this->assertNotNull($createdUser);
        $this->assertTrue(Hash::check('password', $createdUser->password));
        $this->assertTrue($createdUser->must_change_password);

        $this->assertDatabaseHas('dosen', [
            'nama_lengkap' => 'Dosen Baru Akun',
            'kode_dosen'   => null,
            'nip'          => null,
            'user_id'      => $createdUser->id,
        ]);
    }

    public function test_superadmin_can_update_dosen_to_add_or_remove_kode_dosen_and_nip(): void
    {
        $dosen = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => null,
            'nip'          => null,
            'nama_lengkap' => 'Dosen Mula Mula',
            'email'        => 'mula@telkomuniversity.ac.id',
            'status'       => 'ACTIVE',
        ]);

        // Update to add kode_dosen and nip
        $response = $this->actingAs($this->superAdmin)->put("/superadmin/dosen/{$dosen->id}", [
            'nama_lengkap'   => 'Dosen Mula Mula',
            'kode_dosen'     => 'DSN99',
            'nip'            => '1990001',
            'email'          => 'mula@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'status'         => 'ACTIVE',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('dosen', [
            'id'         => $dosen->id,
            'kode_dosen' => 'DSN99',
            'nip'        => '1990001',
        ]);

        // Update to clear kode_dosen and nip back to null
        $response2 = $this->actingAs($this->superAdmin)->put("/superadmin/dosen/{$dosen->id}", [
            'nama_lengkap'   => 'Dosen Mula Mula',
            'kode_dosen'     => '',
            'nip'            => '',
            'email'          => 'mula@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'status'         => 'ACTIVE',
        ]);

        $response2->assertSessionHasNoErrors();
        $this->assertDatabaseHas('dosen', [
            'id'         => $dosen->id,
            'kode_dosen' => null,
            'nip'        => null,
        ]);
    }

    public function test_duplicate_kode_dosen_is_rejected_when_provided(): void
    {
        Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'DSN01',
            'nama_lengkap' => 'Dosen Pertama',
            'email'        => 'pertama@telkomuniversity.ac.id',
            'status'       => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->superAdmin)->post('/superadmin/dosen', [
            'nama_lengkap'   => 'Dosen Kedua',
            'kode_dosen'     => 'DSN01',
            'email'          => 'kedua@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
        ]);

        $response->assertSessionHasErrors(['kode_dosen']);
    }
}
