<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\KelompokVerifikasi;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class KelompokVerifikasiTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $koordinatorUser;
    protected User $verifikatorUser;
    protected PeriodeVerifikasi $periode;
    protected MataKuliah $mk1;
    protected MataKuliah $mk2;
    protected Dosen $dosen1;
    protected Dosen $dosen2;
    protected Dosen $dosen3;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Super Admin
        $this->superAdmin = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Super Admin',
            'email'    => 'admin@test.com',
            'password' => bcrypt('password'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);

        // 2. Create Koordinator User & Dosen
        $this->koordinatorUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dosen Koordinator',
            'email'    => 'koor@test.com',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);
        $this->dosen1 = Dosen::create([
            'id'          => (string) Str::uuid(),
            'kode_dosen'  => 'DSN1',
            'nama_lengkap'=> 'Dr. Dosen Satu',
            'email'       => 'koor@test.com',
            'user_id'     => $this->koordinatorUser->id,
            'status'      => 'ACTIVE',
        ]);

        // 3. Create Verifikator User & Dosen
        $this->verifikatorUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dosen Verifikator',
            'email'    => 'verif@test.com',
            'password' => bcrypt('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);
        $this->dosen2 = Dosen::create([
            'id'          => (string) Str::uuid(),
            'kode_dosen'  => 'DSN2',
            'nama_lengkap'=> 'Dr. Dosen Dua',
            'email'       => 'verif@test.com',
            'user_id'     => $this->verifikatorUser->id,
            'status'      => 'ACTIVE',
        ]);

        $dosen3User = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dr. Dosen Tiga',
            'email'    => 'dosen3@test.com',
            'password' => bcrypt('password'),
            'role'     => 'DOSEN',
            'status'   => 'ACTIVE',
        ]);

        $this->dosen3 = Dosen::create([
            'id'          => (string) Str::uuid(),
            'kode_dosen'  => 'DSN3',
            'nama_lengkap'=> 'Dr. Dosen Tiga',
            'email'       => 'dosen3@test.com',
            'user_id'     => $dosen3User->id,
            'status'      => 'ACTIVE',
        ]);

        // 4. Create Tahun Ajaran & Periode
        $ta = TahunAjaran::create([
            'id'           => (string) Str::uuid(),
            'nama'         => '2026/2027',
            'tahun_mulai'  => 2026,
            'tahun_selesai'=> 2027,
            'status'       => 'ACTIVE',
        ]);

        $this->periode = PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $ta->id,
            'nama'            => 'UTS Ganjil 2026/2027',
            'tanggal_mulai'   => '2026-10-01',
            'tanggal_selesai' => '2026-10-31',
            'deadline_upload' => '2026-10-25 23:59:59',
            'status'          => 'ACTIVE',
        ]);

        // 5. Create Mata Kuliah
        $this->mk1 = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'IS101',
            'nama_mk'  => 'Sistem Informasi',
            'sks'      => 3,
            'semester' => 1,
            'status'   => 'ACTIVE',
        ]);

        $this->mk2 = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'IS102',
            'nama_mk'  => 'Basis Data',
            'sks'      => 4,
            'semester' => 2,
            'status'   => 'ACTIVE',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_kelompok_verifikasi(): void
    {
        $response = $this->get(route('superadmin.kelompok-verifikasi.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_non_superadmin_users_get_forbidden(): void
    {
        $this->actingAs($this->koordinatorUser)
            ->get(route('superadmin.kelompok-verifikasi.index'))
            ->assertStatus(403);

        $this->actingAs($this->verifikatorUser)
            ->get(route('superadmin.kelompok-verifikasi.index'))
            ->assertStatus(403);
    }

    public function test_superadmin_can_view_kelompok_verifikasi_index(): void
    {
        $this->actingAs($this->superAdmin)
            ->get(route('superadmin.kelompok-verifikasi.index'))
            ->assertStatus(200);
    }

    public function test_superadmin_can_create_draft_kelompok_verifikasi(): void
    {
        $payload = [
            'nama'        => 'Kelompok SI - UTS Ganjil 2026',
            'periode_id'  => $this->periode->id,
            'keterangan'  => 'Draft pengujian kelompok verifikasi',
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id],
                ['mata_kuliah_id' => $this->mk2->id, 'koordinator_id' => $this->dosen3->id],
            ],
            'verifikator' => [$this->dosen2->id],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $this->assertDatabaseHas('kelompok_verifikasi', [
            'nama'   => 'Kelompok SI - UTS Ganjil 2026',
            'status' => 'DRAFT',
        ]);

        // In DRAFT mode, no active operational assignments should be published
        $this->assertEquals(0, PenugasanKoordinator::where('status', 'ACTIVE')->count());
        $this->assertEquals(0, PenugasanVerifikator::where('status', 'ACTIVE')->count());
    }

    public function test_superadmin_can_create_and_activate_kelompok_verifikasi(): void
    {
        $payload = [
            'nama'        => 'Kelompok SI Aktif - UTS Ganjil 2026',
            'periode_id'  => $this->periode->id,
            'keterangan'  => 'Kelompok langsung aktif',
            'status'      => 'ACTIVE',
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id],
                ['mata_kuliah_id' => $this->mk2->id, 'koordinator_id' => $this->dosen3->id],
            ],
            'verifikator' => [$this->dosen2->id],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok SI Aktif - UTS Ganjil 2026')->first();
        $this->assertNotNull($kelompok);
        $this->assertEquals('ACTIVE', $kelompok->status);

        // Check operational PenugasanKoordinator created (2 MKs -> 2 Coordinators)
        $this->assertDatabaseHas('penugasan_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
            'status'         => 'ACTIVE',
        ]);
        $this->assertDatabaseHas('penugasan_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk2->id,
            'dosen_id'       => $this->dosen3->id,
            'status'         => 'ACTIVE',
        ]);

        // Check operational PenugasanVerifikator created (2 MKs x 1 Verifikator = 2 assignments)
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
            'status'         => 'ACTIVE',
        ]);
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk2->id,
            'dosen_id'       => $this->dosen2->id,
            'status'         => 'ACTIVE',
        ]);
    }

    public function test_superadmin_can_deactivate_and_reactivate_kelompok(): void
    {
        $kelompok = KelompokVerifikasi::create([
            'id'          => (string) Str::uuid(),
            'nama'        => 'Kelompok Test Siklus',
            'periode_id'  => $this->periode->id,
            'status'      => 'ACTIVE',
            'created_by'  => $this->superAdmin->id,
        ]);

        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosen1->id,
            'mata_kuliah_id' => $this->mk1->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->superAdmin->id,
            'kelompok_id'    => $kelompok->id,
            'status'         => 'ACTIVE',
        ]);

        // Deactivate
        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.deactivate', $kelompok->id));

        $kelompok->refresh();
        $this->assertEquals('INACTIVE', $kelompok->status);
        $this->assertDatabaseHas('penugasan_koordinator', [
            'kelompok_id' => $kelompok->id,
            'status'      => 'ENDED',
        ]);
    }

    public function test_superadmin_can_create_group_with_per_mk_verifikator_assignment(): void
    {
        $d4 = Dosen::create([
            'id' => (string) Str::uuid(),
            'kode_dosen' => 'D04',
            'nama_lengkap' => 'Dosen Empat',
            'status' => 'ACTIVE',
        ]);
        $d5 = Dosen::create([
            'id' => (string) Str::uuid(),
            'kode_dosen' => 'D05',
            'nama_lengkap' => 'Dosen Lima',
            'status' => 'ACTIVE',
        ]);

        $payload = [
            'nama'        => 'Kelompok SI Per MK - UTS Ganjil 2026',
            'periode_id'  => $this->periode->id,
            'keterangan'  => 'Uji coba pembagian verifikator per MK',
            'status'      => 'ACTIVE',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                    'verifikator_ids' => [$this->dosen2->id],
                ],
                [
                    'mata_kuliah_id'  => $this->mk2->id,
                    'koordinator_ids' => [$this->dosen3->id],
                    'verifikator_ids' => [$d4->id, $d5->id],
                ],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok SI Per MK - UTS Ganjil 2026')->first();
        $this->assertNotNull($kelompok);

        // Check MK1 has Verifikator Dosen 2
        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);

        // Check MK2 has Verifikator D4 and D5
        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk2->id,
            'dosen_id'       => $d4->id,
        ]);
        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk2->id,
            'dosen_id'       => $d5->id,
        ]);
    }

    public function test_validation_rejects_more_than_5_verifikators_per_mk(): void
    {
        // Create 6 dosens
        $dosenIds = [];
        for ($i = 4; $i <= 9; $i++) {
            $d = Dosen::create([
                'id'          => (string) Str::uuid(),
                'kode_dosen'  => "DSN{$i}",
                'nama_lengkap'=> "Dosen {$i}",
                'email'       => "dosen{$i}@test.com",
                'status'      => 'ACTIVE',
            ]);
            $dosenIds[] = $d->id;
        }

        $payload = [
            'nama'        => 'Kelompok Overlimit Verifikator',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id' => $this->mk1->id,
                    'koordinator_id' => $this->dosen1->id,
                    'verifikator_ids'=> $dosenIds, // 6 verifiers
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $response->assertSessionHasErrors(['mata_kuliah.0.verifikator_ids']);
    }

    public function test_superadmin_can_revoke_dosen_assignments(): void
    {
        // 1. Create and activate a group
        $payload = [
            'nama'        => 'Kelompok Untuk Uji Revoke',
            'periode_id'  => $this->periode->id,
            'status'      => 'ACTIVE',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id' => $this->mk1->id,
                    'koordinator_id' => $this->dosen1->id,
                    'verifikator_ids'=> [$this->dosen2->id],
                ],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        // Verify active assignments exist
        $this->assertDatabaseHas('penugasan_koordinator', [
            'dosen_id' => $this->dosen1->id,
            'status'   => 'ACTIVE',
        ]);
        $this->assertDatabaseHas('penugasan_verifikator', [
            'dosen_id' => $this->dosen2->id,
            'status'   => 'ACTIVE',
        ]);

        // 2. Revoke Koordinator assignment for dosen1
        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.dosen.cabut-penugasan', $this->dosen1->id), [
                'type' => 'KOORDINATOR',
            ]);

        $this->assertDatabaseHas('penugasan_koordinator', [
            'dosen_id' => $this->dosen1->id,
            'status'   => 'ENDED',
        ]);

        // 3. Revoke Verifikator assignment for dosen2
        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.dosen.cabut-penugasan', $this->dosen2->id), [
                'type' => 'ALL',
            ]);

        $this->assertDatabaseHas('penugasan_verifikator', [
            'dosen_id' => $this->dosen2->id,
            'status'   => 'ENDED',
        ]);
    }

    public function test_validation_rejects_coordinator_as_verifikator_on_same_course(): void
    {
        $payload = [
            'nama'        => 'Kelompok Conflict Koor Verif',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                    'verifikator_ids' => [$this->dosen1->id], // Same lecturer as coordinator
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $response->assertSessionHasErrors(['mata_kuliah']);
    }

    public function test_validation_rejects_more_than_3_coordinators_per_mk(): void
    {
        $d4 = Dosen::create([
            'id' => (string) Str::uuid(),
            'kode_dosen' => 'D04',
            'nama_lengkap' => 'Dosen Empat',
            'status' => 'ACTIVE',
        ]);

        $payload = [
            'nama'        => 'Kelompok Over 3 Coordinators',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id, $this->dosen2->id, $this->dosen3->id, $d4->id], // 4 coordinators
                    'verifikator_ids' => [$d4->id],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $response->assertSessionHasErrors(['mata_kuliah.0.koordinator_ids']);
    }

    public function test_dosen_can_be_coordinator_and_verifikator_across_multiple_courses(): void
    {
        $payload = [
            'nama'        => 'Kelompok Multi MK Assignment',
            'periode_id'  => $this->periode->id,
            'status'      => 'ACTIVE',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                    'verifikator_ids' => [$this->dosen2->id, $this->dosen3->id],
                ],
                [
                    'mata_kuliah_id'  => $this->mk2->id,
                    'koordinator_ids' => [$this->dosen1->id, $this->dosen3->id], // dosen1 & dosen3 coordinating MK2
                    'verifikator_ids' => [$this->dosen2->id],                    // dosen2 verifying MK2 as well
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $response->assertSessionHasNoErrors();

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Multi MK Assignment')->first();
        $this->assertNotNull($kelompok);

        // Check dosen1 is Koordinator for both MK1 and MK2
        $this->assertDatabaseHas('penugasan_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'dosen_id'       => $this->dosen1->id,
            'mata_kuliah_id' => $this->mk1->id,
            'status'         => 'ACTIVE',
        ]);
        $this->assertDatabaseHas('penugasan_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'dosen_id'       => $this->dosen1->id,
            'mata_kuliah_id' => $this->mk2->id,
            'status'         => 'ACTIVE',
        ]);

        // Check dosen2 is Verifikator for both MK1 and MK2
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'dosen_id'       => $this->dosen2->id,
            'mata_kuliah_id' => $this->mk1->id,
            'status'         => 'ACTIVE',
        ]);
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'dosen_id'       => $this->dosen2->id,
            'mata_kuliah_id' => $this->mk2->id,
            'status'         => 'ACTIVE',
        ]);

        // Check dosen3 is Verifikator for MK1 and Koordinator for MK2
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'dosen_id'       => $this->dosen3->id,
            'mata_kuliah_id' => $this->mk1->id,
            'status'         => 'ACTIVE',
        ]);
        $this->assertDatabaseHas('penugasan_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'dosen_id'       => $this->dosen3->id,
            'mata_kuliah_id' => $this->mk2->id,
            'status'         => 'ACTIVE',
        ]);
    }
}
