<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PeriodeVerifikasi;
use App\Models\MataKuliah;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

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
    }

    public function test_superadmin_dashboard_renders_with_course_comparison_data(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Dashboard')
            ->has('courseComparisonData')
            ->has('courseComparisonData.labels')
            ->has('courseComparisonData.approved')
            ->has('courseComparisonData.submitted')
            ->has('courseComparisonData.revision')
            ->has('courseComparisonData.belumUpload')
            ->has('courseComparisonData.courses')
        );
    }
}
