<?php

namespace Tests\Feature;

use App\Models\Clo;
use App\Models\MataKuliah;
use App\Models\Plo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CloImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected Plo $plo1;
    protected MataKuliah $mk1;
    protected MataKuliah $mk2;

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

        $this->plo1 = Plo::create([
            'id'        => (string) Str::uuid(),
            'kode_plo'  => 'PLO01',
            'deskripsi' => 'Deskripsi PLO 01',
        ]);

        $this->mk1 = MataKuliah::create([
            'id'        => (string) Str::uuid(),
            'kode_mk'   => 'MK001',
            'nama_mk'   => 'Sistem Basis Data',
            'sks'       => 3,
            'semester'  => 2,
            'status'    => 'ACTIVE',
        ]);

        $this->mk2 = MataKuliah::create([
            'id'        => (string) Str::uuid(),
            'kode_mk'   => 'MK002',
            'nama_mk'   => 'Pemrograman Berorientasi Objek',
            'sks'       => 4,
            'semester'  => 3,
            'status'    => 'ACTIVE',
        ]);
    }

    public function test_confirm_import_maps_multiple_semicolon_separated_courses_to_clo(): void
    {
        $payload = [
            'rows' => [
                [
                    'plo'       => 'PLO01',
                    'kode_clo'  => 'PLO01-CLO01',
                    'deskripsi' => 'Mampu merancang dan me-refactor sistem informasi.',
                    'bloom'     => '4 - Analyze',
                    'mk'        => 'Sistem Basis Data; Pemrograman Berorientasi Objek',
                ]
            ]
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.clo.confirm'), $payload);

        $response->assertRedirect(route('superadmin.clo.index'));

        $clo = Clo::where('kode_clo', 'PLO01-CLO01')->first();
        $this->assertNotNull($clo);
        $this->assertEquals('Mampu merancang dan me-refactor sistem informasi.', $clo->deskripsi);

        // Assert CLO is linked to both MK1 and MK2
        $mappedMkNames = $clo->mataKuliah()->pluck('nama_mk')->toArray();
        $this->assertContains('Sistem Basis Data', $mappedMkNames);
        $this->assertContains('Pemrograman Berorientasi Objek', $mappedMkNames);
        $this->assertCount(2, $mappedMkNames);

        // Assert MataKuliah has PLO01 via syncPlosFromClos
        $this->assertTrue($this->mk1->fresh()->plo->contains('kode_plo', 'PLO01'));
        $this->assertTrue($this->mk2->fresh()->plo->contains('kode_plo', 'PLO01'));
    }

    public function test_download_clo_template_returns_file(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.clo.template'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
