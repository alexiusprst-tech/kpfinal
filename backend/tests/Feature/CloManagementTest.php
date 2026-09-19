<?php

namespace Tests\Feature;

use App\Models\Clo;
use App\Models\Plo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CloManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $koordinatorUser;
    protected Plo $plo1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Super Admin',
            'email'    => 'admin@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);

        $this->koordinatorUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Koordinator',
            'email'    => 'koordinator@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);

        $this->plo1 = Plo::create([
            'id'        => (string) Str::uuid(),
            'kode_plo'  => 'PLO01',
            'deskripsi' => 'Deskripsi PLO 01',
        ]);
    }

    public function test_non_superadmin_cannot_manage_clo(): void
    {
        $this->actingAs($this->koordinatorUser)
            ->post(route('superadmin.clo.store'), ['kode_clo' => 'CLO01', 'deskripsi' => 'x'])
            ->assertForbidden();
    }

    public function test_superadmin_can_create_clo_with_plo_prefix(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('superadmin.clo.store'), [
            'kode_clo'  => '01',
            'deskripsi' => 'Mampu menjelaskan konsep dasar basis data',
            'plo_ids'   => [$this->plo1->id],
        ]);

        $response->assertSessionHas('success');
        // kode_clo without a dash gets prefixed with the first PLO's kode_plo.
        $this->assertDatabaseHas('clo', ['kode_clo' => 'PLO01-01']);
    }

    public function test_creating_clo_with_duplicate_kode_fails_validation(): void
    {
        Clo::create([
            'id' => (string) Str::uuid(), 'kode_clo' => 'PLO01-01', 'deskripsi' => 'Sudah ada',
        ]);

        $response = $this->actingAs($this->superAdmin)->post(route('superadmin.clo.store'), [
            'kode_clo'  => '01',
            'deskripsi' => 'Duplikat',
            'plo_ids'   => [$this->plo1->id],
        ]);

        $response->assertSessionHasErrors('kode_clo');
    }

    public function test_superadmin_can_update_clo(): void
    {
        $clo = Clo::create([
            'id' => (string) Str::uuid(), 'kode_clo' => 'PLO01-01', 'deskripsi' => 'Awal',
        ]);

        $response = $this->actingAs($this->superAdmin)->put(route('superadmin.clo.update', $clo->id), [
            'kode_clo'  => 'PLO01-01',
            'deskripsi' => 'Deskripsi diperbarui',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('clo', [
            'id'        => $clo->id,
            'deskripsi' => 'Deskripsi diperbarui',
        ]);
    }

    public function test_superadmin_can_delete_clo(): void
    {
        $clo = Clo::create([
            'id' => (string) Str::uuid(), 'kode_clo' => 'PLO01-01', 'deskripsi' => 'Akan dihapus',
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->delete(route('superadmin.clo.destroy', $clo->id));

        $response->assertSessionHas('success');
        $this->assertSoftDeleted('clo', ['id' => $clo->id]);
    }
}
