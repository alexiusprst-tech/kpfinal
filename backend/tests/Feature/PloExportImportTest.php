<?php

namespace Tests\Feature;

use App\Models\Plo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PloExportImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

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
    }

    public function test_superadmin_can_download_plo_template(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.plo.template'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_superadmin_can_export_plo_excel(): void
    {
        Plo::create([
            'id'        => (string) Str::uuid(),
            'kode_plo'  => 'PLO01',
            'deskripsi' => 'Deskripsi PLO 01',
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.plo.export'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_superadmin_can_confirm_plo_import(): void
    {
        $payload = [
            'rows' => [
                [
                    'kode_plo'  => 'PLO02',
                    'deskripsi' => 'Mampu mengimplementasikan perangkat lunak skala besar.',
                ]
            ]
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('superadmin.plo.confirm'), $payload);

        $response->assertRedirect(route('superadmin.plo.index'));

        $plo = Plo::where('kode_plo', 'PLO02')->first();
        $this->assertNotNull($plo);
        $this->assertEquals('Mampu mengimplementasikan perangkat lunak skala besar.', $plo->deskripsi);
    }
}
