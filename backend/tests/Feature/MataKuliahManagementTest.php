<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PeriodeVerifikasi;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MataKuliahManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $koordinatorUser;
    protected Dosen $dosen;
    protected MataKuliah $mk;

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
            'name'     => 'Koordinator MK',
            'email'    => 'koor@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);

        $this->dosen = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'KOR01',
            'nama_lengkap' => 'Dosen Koordinator, M.Kom.',
            'email'        => 'koor@telkomuniversity.ac.id',
            'user_id'      => $this->koordinatorUser->id,
            'status'       => 'ACTIVE',
        ]);

        $this->mk = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'MK001',
            'nama_mk'  => 'Struktur Data',
            'sks'      => 3,
            'semester' => 2,
            'status'   => 'ACTIVE',
        ]);
    }

    // ─── SuperAdmin\MataKuliahController ───────────────────────────────────

    public function test_unauthenticated_user_cannot_access_mata_kuliah_index(): void
    {
        $this->get(route('superadmin.mata-kuliah.index'))->assertRedirect(route('login'));
    }

    public function test_non_superadmin_cannot_access_mata_kuliah_index(): void
    {
        $this->actingAs($this->koordinatorUser)
            ->get(route('superadmin.mata-kuliah.index'))
            ->assertForbidden();
    }

    public function test_superadmin_can_view_mata_kuliah_index(): void
    {
        $this->actingAs($this->superAdmin)
            ->get(route('superadmin.mata-kuliah.index'))
            ->assertOk();
    }

    public function test_superadmin_can_create_mata_kuliah(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('superadmin.mata-kuliah.store'), [
            'kode_mk'  => 'MK002',
            'nama_mk'  => 'Basis Data',
            'sks'      => 3,
            'semester' => 3,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('mata_kuliah', [
            'kode_mk' => 'MK002',
            'nama_mk' => 'Basis Data',
        ]);
    }

    public function test_creating_mata_kuliah_with_duplicate_kode_mk_fails_validation(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('superadmin.mata-kuliah.store'), [
            'kode_mk'  => 'MK001', // already used by $this->mk
            'nama_mk'  => 'Duplikat',
            'sks'      => 3,
            'semester' => 1,
        ]);

        $response->assertSessionHasErrors('kode_mk');
        $this->assertDatabaseMissing('mata_kuliah', ['nama_mk' => 'Duplikat']);
    }

    public function test_superadmin_can_update_mata_kuliah(): void
    {
        $response = $this->actingAs($this->superAdmin)->put(route('superadmin.mata-kuliah.update', $this->mk->id), [
            'kode_mk'  => $this->mk->kode_mk,
            'nama_mk'  => 'Struktur Data Lanjut',
            'sks'      => 4,
            'semester' => 2,
            'status'   => 'INACTIVE',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('mata_kuliah', [
            'id'      => $this->mk->id,
            'nama_mk' => 'Struktur Data Lanjut',
            'status'  => 'INACTIVE',
        ]);
    }

    public function test_superadmin_can_view_mata_kuliah_show_page(): void
    {
        $this->actingAs($this->superAdmin)
            ->get(route('superadmin.mata-kuliah.show', $this->mk->id))
            ->assertOk();
    }

    public function test_superadmin_can_delete_mata_kuliah(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->delete(route('superadmin.mata-kuliah.destroy', $this->mk->id));

        $response->assertSessionHas('success');
        $this->assertSoftDeleted('mata_kuliah', ['id' => $this->mk->id]);
    }

    // ─── Koordinator\MataKuliahController::show ────────────────────────────

    public function test_assigned_koordinator_can_view_mata_kuliah_show_page(): void
    {
        $ta = TahunAjaran::create([
            'id' => (string) Str::uuid(), 'nama' => '2026/2027',
            'tahun_mulai' => 2026, 'tahun_selesai' => 2027, 'status' => 'ACTIVE',
        ]);
        $periode = PeriodeVerifikasi::create([
            'id' => (string) Str::uuid(), 'tahun_ajaran_id' => $ta->id,
            'nama' => 'UTS Ganjil', 'tanggal_mulai' => '2026-10-01',
            'tanggal_selesai' => '2026-10-31', 'deadline_upload' => '2026-10-25 23:59:59',
            'status' => 'ACTIVE',
        ]);
        PenugasanKoordinator::create([
            'id' => (string) Str::uuid(), 'dosen_id' => $this->dosen->id,
            'mata_kuliah_id' => $this->mk->id, 'periode_id' => $periode->id,
            'assigned_by' => $this->superAdmin->id, 'status' => 'ACTIVE',
        ]);

        $this->actingAs($this->koordinatorUser)
            ->get(route('koordinator.mata-kuliah.show', $this->mk->id))
            ->assertOk();
    }

    public function test_unassigned_koordinator_cannot_view_mata_kuliah_show_page(): void
    {
        // $this->koordinatorUser / $this->dosen has NO PenugasanKoordinator
        // record at all for $this->mk — must be rejected (IDOR protection).
        $this->actingAs($this->koordinatorUser)
            ->get(route('koordinator.mata-kuliah.show', $this->mk->id))
            ->assertForbidden();
    }
}
