<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\KategoriSoal;
use App\Models\KelompokKoordinator;
use App\Models\KelompokMataKuliah;
use App\Models\KelompokVerifikasi;
use App\Models\KelompokVerifikator;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Models\Verifikasi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class KelompokVerifikasiTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $koordinatorUser;
    protected User $verifikatorUser;
    protected User $dosen3User;
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

        $this->dosen3User = User::create([
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
            'user_id'     => $this->dosen3User->id,
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
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id, 'verifikator_ids' => [$this->dosen2->id]],
                ['mata_kuliah_id' => $this->mk2->id, 'koordinator_id' => $this->dosen3->id, 'verifikator_ids' => [$this->dosen2->id]],
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
            'keterangan'  => 'Kelompok langsung aktif setelah verifikator lengkap',
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id],
                ['mata_kuliah_id' => $this->mk2->id, 'koordinator_id' => $this->dosen3->id],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok SI Aktif - UTS Ganjil 2026')->first();
        $this->assertNotNull($kelompok);
        $this->assertEquals('DRAFT', $kelompok->status);

        // Koordinator 1 menentukan verifikator untuk MK1
        $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        // Status masih DRAFT karena MK2 belum memiliki verifikator
        $kelompok->refresh();
        $this->assertEquals('DRAFT', $kelompok->status);

        // Koordinator 2 menentukan verifikator untuk MK2
        $this->actingAs($this->dosen3User)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk2->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        // Sekarang semua MK sudah memiliki verifikator -> status berubah menjadi ACTIVE otomatis
        $kelompok->refresh();
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
        // History is preserved (RULES.md #8/#30) — the assignment row still exists, just no longer ACTIVE.
        $this->assertEquals(0, PenugasanKoordinator::where('kelompok_id', $kelompok->id)->where('status', 'ACTIVE')->count());
        $this->assertEquals(1, PenugasanKoordinator::where('kelompok_id', $kelompok->id)->where('status', 'ENDED')->count());
    }

    public function test_replacing_koordinator_preserves_old_assignment_as_history_instead_of_deleting_it(): void
    {
        $payload = [
            'nama'        => 'Kelompok Ganti Koordinator',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Ganti Koordinator')->first();

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.activate', $kelompok->id));

        $originalAssignment = PenugasanKoordinator::where('kelompok_id', $kelompok->id)
            ->where('dosen_id', $this->dosen1->id)
            ->where('mata_kuliah_id', $this->mk1->id)
            ->first();
        $this->assertNotNull($originalAssignment);
        $this->assertEquals('ACTIVE', $originalAssignment->status);

        // Replace dosen1 with dosen3 as koordinator for the same MK
        $updatePayload = [
            'nama'        => 'Kelompok Ganti Koordinator',
            'periode_id'  => $this->periode->id,
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_ids' => [$this->dosen3->id]],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->put(route('superadmin.kelompok-verifikasi.update', $kelompok->id), $updatePayload);
        $response->assertSessionHasNoErrors();

        // The old assignment row must still exist (RULES.md #8/#30 — never hard-delete
        // penugasan history), just no longer ACTIVE, instead of being deleted outright.
        $originalAssignment->refresh();
        $this->assertEquals('ENDED', $originalAssignment->status);

        $this->assertDatabaseHas('penugasan_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'dosen_id'       => $this->dosen3->id,
            'mata_kuliah_id' => $this->mk1->id,
            'status'         => 'ACTIVE',
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
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                ],
                [
                    'mata_kuliah_id'  => $this->mk2->id,
                    'koordinator_ids' => [$this->dosen3->id],
                ],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok SI Per MK - UTS Ganjil 2026')->first();
        $this->assertNotNull($kelompok);

        // Koordinator 1 determines Verifikator Dosen 2 for MK1
        $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        // Koordinator 2 determines Verifikators D4 and D5 for MK2
        $this->actingAs($this->dosen3User)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk2->id,
                        'verifikator_ids' => [$d4->id, $d5->id],
                    ],
                ],
            ]);

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
        $kelompok = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Overlimit Verifikator',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        KelompokMataKuliah::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'koordinator_id' => $this->dosen1->id,
        ]);

        KelompokKoordinator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);

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

        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => $dosenIds, // 6 verifiers
                    ],
                ],
            ]);

        $response->assertSessionHasErrors(['mata_kuliah_assignments.0.verifikator_ids']);
    }

    public function test_superadmin_can_revoke_dosen_assignments(): void
    {
        // 1. Create group and assign verifikator so it activates
        $payload = [
            'nama'        => 'Kelompok Untuk Uji Revoke',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id' => $this->mk1->id,
                    'koordinator_id' => $this->dosen1->id,
                ],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Untuk Uji Revoke')->first();

        $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

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
        $kelompok = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Conflict Koor Verif',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        KelompokMataKuliah::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'koordinator_id' => $this->dosen1->id,
        ]);

        KelompokKoordinator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);

        // Koordinator tries to assign himself as verifikator on same course
        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen1->id],
                    ],
                ],
            ]);

        $response->assertSessionHasErrors(['mata_kuliah_assignments']);
    }

    public function test_validation_rejects_non_dosen_tetap_as_verifikator(): void
    {
        // Create an LB (Luar Biasa) lecturer
        $dosenLB = Dosen::create([
            'id'             => (string) Str::uuid(),
            'kode_dosen'     => 'DLB',
            'nama_lengkap'   => 'Dosen Luar Biasa M.Kom',
            'email'          => 'lb@test.com',
            'kategori_dosen' => 'LB',
            'status'         => 'ACTIVE',
        ]);

        $kelompok = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Verifikator Non Tetap',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        KelompokMataKuliah::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'koordinator_id' => $this->dosen1->id,
        ]);

        KelompokKoordinator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);

        // Attempt to assign LB lecturer as verifikator
        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$dosenLB->id],
                    ],
                ],
            ]);

        $response->assertSessionHasErrors(['mata_kuliah_assignments']);
        $this->assertDatabaseMissing('kelompok_verifikator', [
            'kelompok_id' => $kelompok->id,
            'dosen_id'    => $dosenLB->id,
        ]);
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
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                ],
                [
                    'mata_kuliah_id'  => $this->mk2->id,
                    'koordinator_ids' => [$this->dosen1->id, $this->dosen3->id], // dosen1 & dosen3 coordinating MK2
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $response->assertSessionHasNoErrors();

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Multi MK Assignment')->first();
        $this->assertNotNull($kelompok);

        // Koordinator 1 determines verifikators for MK1: dosen2 and dosen3
        $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen2->id, $this->dosen3->id],
                    ],
                ],
            ]);

        // Koordinator 2 determines verifikator for MK2: dosen2
        $this->actingAs($this->dosen3User)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk2->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

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

    public function test_superadmin_can_remove_individual_koordinator_and_verifikator_assignment(): void
    {
        $kelompok = KelompokVerifikasi::create([
            'id'          => (string) Str::uuid(),
            'nama'        => 'Kelompok Test Removal',
            'periode_id'  => $this->periode->id,
            'status'      => 'ACTIVE',
            'created_by'  => $this->superAdmin->id,
        ]);

        \App\Models\KelompokKoordinator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);

        \App\Models\KelompokVerifikator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);

        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosen1->id,
            'mata_kuliah_id' => $this->mk1->id,
            'periode_id'     => $this->periode->id,
            'kelompok_id'    => $kelompok->id,
            'assigned_by'    => $this->superAdmin->id,
            'status'         => 'ACTIVE',
        ]);

        PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosen2->id,
            'mata_kuliah_id' => $this->mk1->id,
            'periode_id'     => $this->periode->id,
            'kelompok_id'    => $kelompok->id,
            'assigned_by'    => $this->superAdmin->id,
            'status'         => 'ACTIVE',
        ]);

        // Remove verifikator
        $responseVerif = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.remove-verifikator', $kelompok->id), [
                'mata_kuliah_id' => $this->mk1->id,
                'dosen_id'       => $this->dosen2->id,
            ]);

        $responseVerif->assertRedirect();
        $this->assertDatabaseMissing('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
            'status'         => 'ENDED',
        ]);

        // Remove koordinator
        $responseKoor = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.remove-koordinator', $kelompok->id), [
                'mata_kuliah_id' => $this->mk1->id,
                'dosen_id'       => $this->dosen1->id,
            ]);

        $responseKoor->assertRedirect();
        $this->assertDatabaseMissing('kelompok_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);
        $this->assertDatabaseHas('penugasan_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
            'status'         => 'ENDED',
        ]);
    }

    public function test_revoking_dosen_in_manajemen_dosen_removes_from_kelompok_verifikasi(): void
    {
        // Create group with dosen1 as koordinator, then assign verifikator dosen2 so it activates
        $payload = [
            'nama'        => 'Kelompok Uji Synced Revoke',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id' => $this->mk1->id,
                    'koordinator_id' => $this->dosen1->id,
                ],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Uji Synced Revoke')->first();
        $this->assertNotNull($kelompok);

        $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        // Verify initial state: dosen1 is koordinator in group, dosen2 is verifikator in group
        $this->assertDatabaseHas('kelompok_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);
        $this->assertDatabaseHas('kelompok_mata_kuliah', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'koordinator_id' => $this->dosen1->id,
        ]);
        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);

        // Revoke penugasan koordinator for dosen1 in Manajemen Dosen
        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.dosen.cabut-penugasan', $this->dosen1->id), [
                'type' => 'KOORDINATOR',
            ]);

        // Assert dosen1 removed from kelompok_koordinator and kelompok_mata_kuliah.koordinator_id is updated to null
        $this->assertDatabaseMissing('kelompok_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);
        $this->assertDatabaseHas('kelompok_mata_kuliah', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'koordinator_id' => null,
        ]);

        // Revoke penugasan verifikator for dosen2 in Manajemen Dosen
        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.dosen.cabut-penugasan', $this->dosen2->id), [
                'type' => 'VERIFIKATOR',
            ]);

        // Assert dosen2 removed from kelompok_verifikator
        $this->assertDatabaseMissing('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);

        // Verify show page response has no active koordinator or verifikator for this group
        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.kelompok-verifikasi.show', $kelompok->id));

        $response->assertStatus(200);
        $props = $response->inertiaPage()['props'];
        $mkStats = $props['mkListStats'][0];
        $this->assertEmpty($mkStats['koordinator_list']);
        $this->assertNull($mkStats['koordinator']);
        $this->assertEmpty($props['verifikatorListStats']);
    }

    public function test_newly_created_draft_group_in_existing_period_does_not_show_historical_verified_soal(): void
    {
        $kategori = KategoriSoal::create([
            'id'   => (string) Str::uuid(),
            'nama' => 'UTS Teori',
        ]);

        // Historical approved soal in the same period
        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mk1->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Naskah UTS Pemrograman',
            'nama_file'      => 'soal.pdf',
            'file_path'      => 'soal/soal.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 10240,
            'status'         => 'APPROVED',
        ]);

        Verifikasi::create([
            'id'             => (string) Str::uuid(),
            'soal_id'        => $soal->id,
            'verifikator_id' => $this->verifikatorUser->id,
            'action'         => 'APPROVED',
            'created_at'     => now()->subDays(1),
        ]);

        // Create new DRAFT group
        $kelompok = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Draf Baru',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        KelompokMataKuliah::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'koordinator_id' => $this->dosen1->id,
        ]);

        KelompokVerifikator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.kelompok-verifikasi.show', $kelompok->id));

        $response->assertStatus(200);
        $props = $response->inertiaPage()['props'];

        // Group Progress must be 0
        $this->assertEquals(0, $props['progress']['approvedSoal']);
        $this->assertEquals(0, $props['progress']['verification']);
        $this->assertEquals(0, $props['progress']['totalSoal']);

        // MK stats must be 0
        $this->assertEquals(0, $props['mkListStats'][0]['approved']);
        $this->assertEquals(0, $props['mkListStats'][0]['soal_count']);
        $this->assertEquals('PENDING', $props['mkListStats'][0]['status_progres']);

        // Verifikator stats must be 0
        $this->assertEquals(0, $props['verifikatorListStats'][0]['diverifikasi']);
        $this->assertEquals(0, $props['verifikatorListStats'][0]['total_soal']);
    }

    public function test_newly_created_active_group_does_not_count_soal_created_prior_to_group(): void
    {
        $kategori = KategoriSoal::create([
            'id'   => (string) Str::uuid(),
            'nama' => 'UAS Praktik',
        ]);

        // Historical approved soal created 2 hours ago
        $historicalSoal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mk1->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Soal Lama Sebelum Kelompok Dibuat',
            'nama_file'      => 'soal_lama.pdf',
            'file_path'      => 'soal/soal_lama.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 10240,
            'status'         => 'APPROVED',
        ]);
        $historicalSoal->timestamps = false;
        $historicalSoal->created_at = now()->subHours(2);
        $historicalSoal->save();

        Verifikasi::create([
            'id'             => (string) Str::uuid(),
            'soal_id'        => $historicalSoal->id,
            'verifikator_id' => $this->verifikatorUser->id,
            'action'         => 'APPROVED',
            'created_at'     => now()->subHours(1),
        ]);

        // Create new ACTIVE group now
        $kelompok = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Aktif Baru',
            'periode_id' => $this->periode->id,
            'status'     => 'ACTIVE',
            'created_by' => $this->superAdmin->id,
            'created_at' => now(),
        ]);

        KelompokMataKuliah::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'koordinator_id' => $this->dosen1->id,
        ]);

        KelompokVerifikator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.kelompok-verifikasi.show', $kelompok->id));

        $response->assertStatus(200);
        $props = $response->inertiaPage()['props'];

        // Should NOT inherit historical soal
        $this->assertEquals(0, $props['progress']['approvedSoal']);
        $this->assertEquals(0, $props['progress']['verification']);
        $this->assertEquals(0, $props['progress']['totalSoal']);
        $this->assertEquals(0, $props['mkListStats'][0]['approved']);
        $this->assertEquals(0, $props['verifikatorListStats'][0]['diverifikasi']);
    }

    public function test_cannot_create_duplicate_group_in_same_period(): void
    {
        // 1. Create first group
        $payload1 = [
            'nama'        => 'Kelompok Pertama',
            'periode_id'  => $this->periode->id,
            'status'      => 'ACTIVE',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                    'verifikator_ids' => [$this->dosen2->id],
                ],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload1);

        $this->assertDatabaseHas('kelompok_verifikasi', ['nama' => 'Kelompok Pertama']);

        // 2. Attempt to create second group in the same period
        $payload2 = [
            'nama'        => 'Kelompok Kedua',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk2->id,
                    'koordinator_ids' => [$this->dosen3->id],
                    'verifikator_ids' => [$this->dosen2->id],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload2);

        $response->assertSessionHasErrors(['periode_id']);
        $errors = session('errors')->get('periode_id');
        $this->assertStringContainsString('hanya dapat dibuat 1 kelompok verifikasi', $errors[0]);
    }

    public function test_courses_can_be_assigned_to_multiple_groups_in_different_periods(): void
    {
        // 1. Create first ACTIVE group with mk1 in period 1
        $payload1 = [
            'nama'        => 'Kelompok Pertama Aktif',
            'periode_id'  => $this->periode->id,
            'status'      => 'ACTIVE',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                    'verifikator_ids' => [$this->dosen2->id],
                ],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload1);

        // 2. Create second period
        $periode2 = PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $this->periode->tahun_ajaran_id,
            'nama'            => 'UAS Ganjil 2026/2027',
            'tanggal_mulai'   => '2026-12-01',
            'tanggal_selesai' => '2026-12-31',
            'deadline_upload' => '2026-12-25 23:59:59',
            'status'          => 'DRAFT',
        ]);

        // 3. Create second ACTIVE group in period 2 with the same mk1
        $payload2 = [
            'nama'        => 'Kelompok Kedua Aktif',
            'periode_id'  => $periode2->id,
            'status'      => 'ACTIVE',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen3->id],
                    'verifikator_ids' => [$this->dosen2->id],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload2);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('kelompok_verifikasi', ['nama' => 'Kelompok Kedua Aktif']);
    }

    public function test_activation_rejects_group_with_coordinator_as_verifikator_on_same_course(): void
    {
        $kelompok = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Draft Conflict',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        KelompokMataKuliah::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'koordinator_id' => $this->dosen1->id,
        ]);

        KelompokKoordinator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);

        // Same lecturer assigned to both roles on mk1
        KelompokVerifikator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.activate', $kelompok->id));

        $response->assertSessionHas('error');
        $error = session('error');
        $this->assertStringContainsString('tidak dapat menjadi Koordinator sekaligus Verifikator', $error);
    }

    public function test_cannot_delete_kelompok_verifikasi(): void
    {
        $kelompok = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Tidak Bisa Dihapus',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->delete(route('superadmin.kelompok-verifikasi.destroy', $kelompok->id));

        $response->assertSessionHas('error');
        $this->assertStringContainsString('tidak dapat dihapus', session('error'));
        $this->assertDatabaseHas('kelompok_verifikasi', ['id' => $kelompok->id]);
    }

    public function test_update_rejects_changing_period_to_another_period_with_existing_group(): void
    {
        $kelompok1 = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Periode 1',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        $periode2 = PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $this->periode->tahun_ajaran_id,
            'nama'            => 'Periode 2',
            'tanggal_mulai'   => '2026-12-01',
            'tanggal_selesai' => '2026-12-31',
            'deadline_upload' => '2026-12-25 23:59:59',
            'status'          => 'DRAFT',
        ]);

        $kelompok2 = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok Periode 2',
            'periode_id' => $periode2->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->put(route('superadmin.kelompok-verifikasi.update', $kelompok2->id), [
                'nama'        => 'Kelompok Periode 2 Diubah',
                'periode_id'  => $this->periode->id, // Conflict with kelompok1
                'status'      => 'DRAFT',
                'mata_kuliah' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'koordinator_ids' => [$this->dosen1->id],
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        $response->assertSessionHasErrors(['periode_id']);
        $errors = session('errors')->get('periode_id');
        $this->assertStringContainsString('Target periode sudah memiliki kelompok verifikasi', $errors[0]);
    }

    public function test_koordinator_can_view_assigned_kelompok_verifikasi(): void
    {
        $payload = [
            'nama'        => 'Kelompok Index Koordinator Test',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id],
                ['mata_kuliah_id' => $this->mk2->id, 'koordinator_id' => $this->dosen3->id],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $response = $this->actingAs($this->koordinatorUser)
            ->get(route('koordinator.kelompok-verifikasi.index'));

        $response->assertStatus(200);
        $props = $response->inertiaPage()['props'];
        $this->assertNotEmpty($props['kelompokList']);
        $kelompokItem = $props['kelompokList'][0];
        $this->assertEquals('Kelompok Index Koordinator Test', $kelompokItem['nama']);
        // Koordinator 1 only sees MK1 in mk_saya
        $this->assertEquals(1, count($kelompokItem['mk_saya']));
        $this->assertEquals($this->mk1->id, $kelompokItem['mk_saya'][0]['mata_kuliah_id']);
    }

    public function test_koordinator_cannot_assign_verifikators_for_unassigned_course(): void
    {
        $payload = [
            'nama'        => 'Kelompok Unauthorized Assignment Test',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id],
                ['mata_kuliah_id' => $this->mk2->id, 'koordinator_id' => $this->dosen3->id],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Unauthorized Assignment Test')->first();

        // Koordinator 1 tries to assign verifikator for MK2 (which belongs to dosen3)
        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk2->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        $response->assertSessionHasErrors(['mata_kuliah_assignments']);
    }

    public function test_superadmin_can_reset_active_group_to_draft(): void
    {
        $payload = [
            'nama'        => 'Kelompok Reset Test',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Reset Test')->first();

        // Koordinator assigns verifikator -> group becomes ACTIVE
        $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        $kelompok->refresh();
        $this->assertEquals('ACTIVE', $kelompok->status);
        $this->assertDatabaseHas('penugasan_verifikator', ['kelompok_id' => $kelompok->id, 'status' => 'ACTIVE']);

        // Super Admin resets group
        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.reset-verifikator', $kelompok->id));

        $response->assertRedirect();
        $kelompok->refresh();
        $this->assertEquals('DRAFT', $kelompok->status);
        $this->assertEquals(0, KelompokVerifikator::where('kelompok_id', $kelompok->id)->count());
        // History is preserved (RULES.md #8/#30) — the assignment row still exists, just no longer ACTIVE.
        $this->assertEquals(0, PenugasanVerifikator::where('kelompok_id', $kelompok->id)->where('status', 'ACTIVE')->count());
        $this->assertEquals(1, PenugasanVerifikator::where('kelompok_id', $kelompok->id)->where('status', 'ENDED')->count());
    }

    public function test_adding_course_preserves_existing_course_verifikators(): void
    {
        // 1. Create a group with MK1
        $payload = [
            'nama'        => 'Kelompok Preservasi Verifikator',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                ['mata_kuliah_id' => $this->mk1->id, 'koordinator_id' => $this->dosen1->id],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Preservasi Verifikator')->first();

        // 2. Koordinator 1 determines Verifikator Dosen 2 for MK1 -> group becomes ACTIVE
        $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
            'status'         => 'ACTIVE',
        ]);

        // 3. SuperAdmin updates group by adding MK2 (without providing verifikator_ids for existing MK)
        $updatePayload = [
            'nama'        => 'Kelompok Preservasi Verifikator',
            'periode_id'  => $this->periode->id,
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                ],
                [
                    'mata_kuliah_id'  => $this->mk2->id,
                    'koordinator_ids' => [$this->dosen3->id],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)
            ->put(route('superadmin.kelompok-verifikasi.update', $kelompok->id), $updatePayload);

        $response->assertSessionHasNoErrors();

        // 4. Assert: MK1's verifikator (Dosen 2) MUST NOT be deleted!
        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
            'status'         => 'ACTIVE',
        ]);

        // 5. Assert: MK2 is added and has koordinator dosen3
        $this->assertDatabaseHas('kelompok_mata_kuliah', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk2->id,
        ]);
        $this->assertDatabaseHas('kelompok_koordinator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk2->id,
            'dosen_id'       => $this->dosen3->id,
        ]);

        // 6. Assert: Koordinator Dosen 3 can now assign verifikators to the newly added MK2
        $kelompok->refresh();
        $this->assertTrue($kelompok->canAssignVerifikator());

        $assignResponse = $this->actingAs($this->dosen3User)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk2->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        $assignResponse->assertSessionHasNoErrors();

        // Assert both MK1 and MK2 have their verifiers
        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);
        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk2->id,
            'dosen_id'       => $this->dosen2->id,
        ]);
    }

    public function test_koordinator_can_edit_verifikators_on_active_kelompok(): void
    {
        $d4 = Dosen::create([
            'id' => (string) Str::uuid(),
            'kode_dosen' => 'D04',
            'nama_lengkap' => 'Dosen Empat',
            'email' => 'dosen4@test.com',
            'status' => 'ACTIVE',
        ]);

        $payload = [
            'nama'        => 'Kelompok Edit Verifikator Active',
            'periode_id'  => $this->periode->id,
            'status'      => 'DRAFT',
            'mata_kuliah' => [
                [
                    'mata_kuliah_id'  => $this->mk1->id,
                    'koordinator_ids' => [$this->dosen1->id],
                ],
            ],
        ];

        $this->actingAs($this->superAdmin)
            ->post(route('superadmin.kelompok-verifikasi.store'), $payload);

        $kelompok = KelompokVerifikasi::where('nama', 'Kelompok Edit Verifikator Active')->first();

        // Initial assignment with dosen2
        $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$this->dosen2->id],
                    ],
                ],
            ]);

        $kelompok->refresh();
        $this->assertEquals('ACTIVE', $kelompok->status);
        $this->assertTrue($kelompok->canAssignVerifikator());

        // Now edit verifikator to d4
        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.kelompok-verifikasi.tentukan-verifikator', $kelompok->id), [
                'mata_kuliah_assignments' => [
                    [
                        'mata_kuliah_id'  => $this->mk1->id,
                        'verifikator_ids' => [$d4->id],
                    ],
                ],
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('koordinator.kelompok-verifikasi.index'));

        // Check that verifikator in DB is updated to d4 and dosen2 is removed
        $this->assertDatabaseHas('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $d4->id,
        ]);
        $this->assertDatabaseMissing('kelompok_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
        ]);

        // Check operational assignments are synced
        $this->assertDatabaseHas('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $d4->id,
            'status'         => 'ACTIVE',
        ]);
        $this->assertDatabaseMissing('penugasan_verifikator', [
            'kelompok_id'    => $kelompok->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen2->id,
            'status'         => 'ACTIVE',
        ]);
    }
}

