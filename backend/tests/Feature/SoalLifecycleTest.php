<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\KategoriSoal;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class SoalLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected User $koordinatorUser;
    protected Dosen $dosenKoor;
    protected User $verifikatorUser;
    protected Dosen $dosenVerif;
    protected User $unauthorizedVerifUser;
    protected Dosen $dosenUnauthVerif;

    protected MataKuliah $mataKuliah;
    protected PeriodeVerifikasi $periode;
    protected KategoriSoal $kategori;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');

        $ta = TahunAjaran::create([
            'id'            => (string) Str::uuid(),
            'nama'          => '2025/2026 Ganjil',
            'tahun_mulai'   => 2025,
            'tahun_selesai' => 2026,
            'status'        => 'ACTIVE',
        ]);

        $this->periode = PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $ta->id,
            'nama'            => 'UTS Ganjil 2025/2026',
            'tanggal_mulai'   => now()->subDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(20)->toDateString(),
            'deadline_upload' => now()->addDays(10)->toDateTimeString(),
            'status'          => 'ACTIVE',
        ]);

        $this->mataKuliah = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'BBK2DAB3',
            'nama_mk'  => 'Pengembangan Aplikasi Website',
            'sks'      => 3,
            'semester' => 3,
            'status'   => 'ACTIVE',
        ]);

        $this->kategori = KategoriSoal::create([
            'id'   => (string) Str::uuid(),
            'nama' => 'UTS Teori',
        ]);

        // Koordinator
        $this->koordinatorUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Koordinator MK',
            'email'    => 'koor@test.com',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);
        $this->dosenKoor = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'KOR01',
            'nama_lengkap' => 'Dosen Koordinator, M.Kom.',
            'email'        => 'koor@test.com',
            'user_id'      => $this->koordinatorUser->id,
            'status'       => 'ACTIVE',
        ]);
        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosenKoor->id,
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->koordinatorUser->id,
            'status'         => 'ACTIVE',
        ]);

        // Authorized Verifikator
        $this->verifikatorUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Verifikator Sah',
            'email'    => 'verif@test.com',
            'password' => bcrypt('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);
        $this->dosenVerif = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'VRF01',
            'nama_lengkap' => 'Dosen Verifikator, M.T.',
            'email'        => 'verif@test.com',
            'user_id'      => $this->verifikatorUser->id,
            'status'       => 'ACTIVE',
        ]);
        PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosenVerif->id,
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->verifikatorUser->id,
            'status'         => 'ACTIVE',
        ]);

        // Unauthorized Verifikator (different course/no assignment)
        $this->unauthorizedVerifUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Verifikator Lain',
            'email'    => 'unauth_verif@test.com',
            'password' => bcrypt('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);
        $this->dosenUnauthVerif = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'VRF99',
            'nama_lengkap' => 'Dosen Luar, M.Kom.',
            'email'        => 'unauth_verif@test.com',
            'user_id'      => $this->unauthorizedVerifUser->id,
            'status'       => 'ACTIVE',
        ]);
    }

    public function test_koordinator_can_upload_soal(): void
    {
        $this->actingAs($this->koordinatorUser);

        $file = UploadedFile::fake()->create('naskah_uts.pdf', 500, 'application/pdf');

        $response = $this->post('/koordinator/soal', [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal UTS Web App 2025/2026',
            'file'           => $file,
            'plo_clo_data'   => [
                'plo' => [
                    [
                        'kode' => 'PLO01',
                        'deskripsi' => 'PLO Deskripsi',
                        'clo' => [
                            ['kode' => 'CLO01', 'deskripsi' => 'CLO Deskripsi', 'bobot_lo' => '100%']
                        ]
                    ]
                ]
            ],
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('soal', [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'judul'          => 'Soal UTS Web App 2025/2026',
            'status'         => 'DRAFT',
        ]);
    }

    public function test_koordinator_can_submit_soal_for_verification(): void
    {
        $this->actingAs($this->koordinatorUser);

        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal UTS Web App 2025/2026',
            'nama_file'      => 'naskah_uts.pdf',
            'file_path'      => 'soal/2025/test.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 512000,
            'uploaded_by'    => $this->koordinatorUser->id,
            'status'         => 'DRAFT',
        ]);

        $response = $this->post("/koordinator/soal/{$soal->id}/submit");

        $response->assertSessionHas('success');
        $this->assertEquals('SUBMITTED', $soal->fresh()->status);
    }

    public function test_authorized_verifikator_can_approve_soal(): void
    {
        $this->actingAs($this->verifikatorUser);

        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal UTS Web App 2025/2026',
            'nama_file'      => 'naskah_uts.pdf',
            'file_path'      => 'soal/2025/test.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 512000,
            'uploaded_by'    => $this->koordinatorUser->id,
            'status'         => 'SUBMITTED',
        ]);

        $response = $this->post("/verifikator/soal/{$soal->id}/verifikasi", [
            'action'  => 'APPROVED',
            'catatan' => 'Naskah soal sudah sesuai dengan LO.',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('APPROVED', $soal->fresh()->status);
        $this->assertDatabaseHas('verifikasi', [
            'soal_id'        => $soal->id,
            'verifikator_id' => $this->verifikatorUser->id,
            'action'         => 'APPROVED',
        ]);
    }

    public function test_unauthorized_verifikator_cannot_verify_unassigned_course_soal(): void
    {
        $this->actingAs($this->unauthorizedVerifUser);

        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal UTS Web App 2025/2026',
            'nama_file'      => 'naskah_uts.pdf',
            'file_path'      => 'soal/2025/test.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 512000,
            'uploaded_by'    => $this->koordinatorUser->id,
            'status'         => 'SUBMITTED',
        ]);

        $response = $this->post("/verifikator/soal/{$soal->id}/verifikasi", [
            'action'  => 'APPROVED',
            'catatan' => 'Mencoba bypass otorisasi verifikasi.',
        ]);

        // Must be rejected with 403 Forbidden (BOLA prevention)
        $response->assertStatus(403);
        $this->assertEquals('SUBMITTED', $soal->fresh()->status);
    }

    public function test_create_soal_page_filters_categories_according_to_active_period(): void
    {
        $this->actingAs($this->koordinatorUser);

        $catUas = KategoriSoal::create(['id' => (string) Str::uuid(), 'nama' => 'UAS Teori', 'status' => 'ACTIVE']);
        $catKuis = KategoriSoal::create(['id' => (string) Str::uuid(), 'nama' => 'Kuis Harian', 'status' => 'ACTIVE']);

        // 1. When period is UTS: only UTS category should be included; UAS and Kuis must be excluded
        $this->periode->update(['nama' => 'Periode Ujian Tengah Semester (UTS) 2025/2026']);
        $response = $this->get('/koordinator/soal/create');
        $response->assertStatus(200);
        $response->assertInertia(function (\Inertia\Testing\AssertableInertia $page) {
            $categories = collect($page->toArray()['props']['kategoriAll']);
            $defaultCat = $page->toArray()['props']['defaultKategori'];
            $this->assertTrue($categories->contains('nama', 'UTS Teori'));
            $this->assertFalse($categories->contains('nama', 'Kuis Harian'));
            $this->assertFalse($categories->contains('nama', 'UAS Teori'));
            $this->assertEquals('UTS Teori', $defaultCat['nama']);
        });

        // 2. When period is UAS: only UAS category should be included; UTS and Kuis must be excluded
        $this->periode->update(['nama' => 'Periode Ujian Akhir Semester (UAS) 2025/2026']);
        $response2 = $this->get('/koordinator/soal/create');
        $response2->assertStatus(200);
        $response2->assertInertia(function (\Inertia\Testing\AssertableInertia $page) {
            $categories = collect($page->toArray()['props']['kategoriAll']);
            $defaultCat = $page->toArray()['props']['defaultKategori'];
            $this->assertTrue($categories->contains('nama', 'UAS Teori'));
            $this->assertFalse($categories->contains('nama', 'Kuis Harian'));
            $this->assertFalse($categories->contains('nama', 'UTS Teori'));
            $this->assertEquals('UAS Teori', $defaultCat['nama']);
        });
    }
}
