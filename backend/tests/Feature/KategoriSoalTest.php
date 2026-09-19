<?php

namespace Tests\Feature;

use App\Models\KategoriSoal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class KategoriSoalTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $koordinatorUser;
    protected KategoriSoal $kategori;

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

        $this->kategori = KategoriSoal::create([
            'id'     => (string) Str::uuid(),
            'nama'   => 'UTS Teori',
            'status' => 'ACTIVE',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_kategori_soal(): void
    {
        $this->get(route('superadmin.kategori-soal.index'))->assertRedirect(route('login'));
    }

    public function test_non_superadmin_cannot_access_kategori_soal(): void
    {
        $this->actingAs($this->koordinatorUser)
            ->get(route('superadmin.kategori-soal.index'))
            ->assertForbidden();
    }

    public function test_superadmin_can_view_kategori_soal_index(): void
    {
        $this->actingAs($this->superAdmin)
            ->get(route('superadmin.kategori-soal.index'))
            ->assertOk();
    }

    public function test_superadmin_can_create_kategori_soal(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('superadmin.kategori-soal.store'), [
            'nama'      => 'UAS Praktikum',
            'deskripsi' => 'Kategori untuk soal ujian akhir semester praktikum',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('kategori_soal', [
            'nama'   => 'UAS Praktikum',
            'status' => 'ACTIVE',
        ]);
    }

    public function test_creating_kategori_soal_with_duplicate_name_fails_validation(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('superadmin.kategori-soal.store'), [
            'nama' => 'UTS Teori', // already used by $this->kategori
        ]);

        $response->assertSessionHasErrors('nama');
    }

    public function test_superadmin_can_update_kategori_soal(): void
    {
        $response = $this->actingAs($this->superAdmin)->put(route('superadmin.kategori-soal.update', $this->kategori->id), [
            'nama'   => 'UTS Teori Revisi',
            'status' => 'INACTIVE',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('kategori_soal', [
            'id'     => $this->kategori->id,
            'nama'   => 'UTS Teori Revisi',
            'status' => 'INACTIVE',
        ]);
    }

    public function test_superadmin_can_view_kategori_soal_detail(): void
    {
        $this->actingAs($this->superAdmin)
            ->get(route('superadmin.kategori-soal.show', $this->kategori->id))
            ->assertOk();
    }

    public function test_superadmin_can_delete_kategori_soal(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->delete(route('superadmin.kategori-soal.destroy', $this->kategori->id));

        $response->assertSessionHas('success');
        $this->assertSoftDeleted('kategori_soal', ['id' => $this->kategori->id]);
    }
}
