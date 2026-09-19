<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AktivitasTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $koordinator;

    protected function setUp(): void
    {
        parent::setUp();

        config(['inertia.testing.ensure_pages_exist' => false]);

        $this->superAdmin = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Super Admin',
            'email'    => 'admin@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);

        $this->koordinator = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Koordinator',
            'email'    => 'koordinator@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_aktivitas(): void
    {
        $response = $this->get(route('superadmin.aktivitas.index'));
        $response->assertRedirect('/login');
    }

    public function test_non_superadmin_cannot_access_aktivitas(): void
    {
        $response = $this->actingAs($this->koordinator)
            ->get(route('superadmin.aktivitas.index'));
        $response->assertForbidden();
    }

    public function test_superadmin_can_view_aktivitas_index(): void
    {
        AuditLog::record(
            userId: $this->superAdmin->id,
            action: 'CREATE_DOSEN',
            modelType: 'Dosen',
            modelId: null,
            oldValues: null,
            newValues: ['name' => 'Dosen Test']
        );

        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.aktivitas.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Aktivitas/Index')
            ->has('logs.data', 1)
            ->has('stats')
            ->has('filters')
            ->has('actionOptions')
            ->has('modelOptions')
        );
    }

    public function test_superadmin_can_filter_aktivitas(): void
    {
        AuditLog::record(
            userId: $this->superAdmin->id,
            action: 'CREATE_DOSEN',
            modelType: 'Dosen',
            modelId: null,
            oldValues: null,
            newValues: ['name' => 'Budi']
        );

        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.aktivitas.index', ['search' => 'CREATE_DOSEN']));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Aktivitas/Index')
            ->has('logs.data', 1)
        );

        $responseEmpty = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.aktivitas.index', ['search' => 'NON_EXISTENT']));

        $responseEmpty->assertOk();
        $responseEmpty->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Aktivitas/Index')
            ->has('logs.data', 0)
        );
    }
}
