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

/**
 * BusinessRulesTest — Tier 4
 *
 * Menguji aturan bisnis kritis:
 *  - Penolakan bobot CLO per PLO yang tidak tepat 100%
 *  - Penolakan self-review (verifikator tidak boleh verify soalnya sendiri)
 *  - Penolakan upload soal saat periode CLOSED atau sudah lewat deadline_upload
 */
class BusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    protected User $koordinatorUser;
    protected Dosen $dosenKoor;
    protected User $verifikatorUser;
    protected Dosen $dosenVerif;
    protected MataKuliah $mataKuliah;
    protected KategoriSoal $kategori;
    protected TahunAjaran $ta;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');

        $this->ta = TahunAjaran::create([
            'id'            => (string) Str::uuid(),
            'nama'          => '2025/2026 Ganjil',
            'tahun_mulai'   => 2025,
            'tahun_selesai' => 2026,
            'status'        => 'ACTIVE',
        ]);

        $this->mataKuliah = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'TST2DAB3',
            'nama_mk'  => 'Mata Kuliah Test',
            'sks'      => 3,
            'semester' => 3,
            'status'   => 'ACTIVE',
        ]);

        $this->kategori = KategoriSoal::create([
            'id'   => (string) Str::uuid(),
            'nama' => 'UTS Teori',
        ]);

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

        $this->verifikatorUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Verifikator',
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
    }

    private function makePeriode(string $status = 'ACTIVE', ?string $deadline = null): PeriodeVerifikasi
    {
        return PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $this->ta->id,
            'nama'            => 'UTS Ganjil 2025/2026',
            'tanggal_mulai'   => now()->subDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(30)->toDateString(),
            'deadline_upload' => $deadline ?? now()->addDays(10)->toDateTimeString(),
            'status'          => $status,
        ]);
    }

    private function assignKoordinator(PeriodeVerifikasi $periode): void
    {
        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosenKoor->id,
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'assigned_by'    => $this->koordinatorUser->id,
            'status'         => 'ACTIVE',
        ]);
    }

    private function assignVerifikator(PeriodeVerifikasi $periode): void
    {
        PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosenVerif->id,
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'assigned_by'    => $this->koordinatorUser->id,
            'status'         => 'ACTIVE',
        ]);
    }

    // ─── Bobot LO ─────────────────────────────────────────────────────────────

    public function test_upload_rejected_when_clo_weight_does_not_sum_to_100(): void
    {
        $periode = $this->makePeriode();
        $this->assignKoordinator($periode);

        $file = UploadedFile::fake()->create('naskah.pdf', 500, 'application/pdf');
        $ploCloData = ['plo' => [['kode' => 'PLO01', 'deskripsi' => 'A', 'clo' => [
            ['kode' => 'CLO01', 'deskripsi' => 'X', 'bobot_lo' => '60%'],
            ['kode' => 'CLO02', 'deskripsi' => 'Y', 'bobot_lo' => '30%'],
        ]]]];

        $response = $this->actingAs($this->koordinatorUser)->post('/koordinator/soal', [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal Bobot Kurang',
            'file'           => $file,
            'plo_clo_data'   => json_encode($ploCloData),
        ]);

        $response->assertSessionHas('error');
        $this->assertStringContainsString('100%', session('error') ?? '');
        $this->assertDatabaseMissing('soal', ['judul' => 'Soal Bobot Kurang']);
    }

    public function test_upload_rejected_when_clo_weight_exceeds_100(): void
    {
        $periode = $this->makePeriode();
        $this->assignKoordinator($periode);

        $file = UploadedFile::fake()->create('naskah.pdf', 500, 'application/pdf');
        $ploCloData = ['plo' => [['kode' => 'PLO01', 'deskripsi' => 'A', 'clo' => [
            ['kode' => 'CLO01', 'deskripsi' => 'X', 'bobot_lo' => '70%'],
            ['kode' => 'CLO02', 'deskripsi' => 'Y', 'bobot_lo' => '60%'],
        ]]]];

        $response = $this->actingAs($this->koordinatorUser)->post('/koordinator/soal', [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal Bobot Lebih',
            'file'           => $file,
            'plo_clo_data'   => json_encode($ploCloData),
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('soal', ['judul' => 'Soal Bobot Lebih']);
    }

    public function test_upload_accepted_when_clo_weight_is_exactly_100(): void
    {
        $periode = $this->makePeriode();
        $this->assignKoordinator($periode);

        $file = UploadedFile::fake()->create('naskah.pdf', 500, 'application/pdf');
        $ploCloData = ['plo' => [['kode' => 'PLO01', 'deskripsi' => 'A', 'clo' => [
            ['kode' => 'CLO01', 'deskripsi' => 'X', 'bobot_lo' => '60%'],
            ['kode' => 'CLO02', 'deskripsi' => 'Y', 'bobot_lo' => '40%'],
        ]]]];

        $response = $this->actingAs($this->koordinatorUser)->post('/koordinator/soal', [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal Bobot Valid',
            'file'           => $file,
            'plo_clo_data'   => json_encode($ploCloData),
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('soal', ['judul' => 'Soal Bobot Valid']);
    }

    // ─── Self-Review ──────────────────────────────────────────────────────────

    public function test_self_review_is_rejected_with_403(): void
    {
        $periode = $this->makePeriode();
        $this->assignVerifikator($periode);

        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'kategori_id'    => $this->kategori->id,
            'uploaded_by'    => $this->verifikatorUser->id,
            'judul'          => 'Soal Self-Review',
            'nama_file'      => 'soal.pdf',
            'file_path'      => 'soal/2026/dummy.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 1024,
            'status'         => Soal::STATUS_SUBMITTED,
        ]);

        $response = $this->actingAs($this->verifikatorUser)
            ->post("/verifikator/soal/{$soal->id}/verifikasi", [
                'action'  => 'APPROVED',
                'catatan' => 'Coba self-review.',
            ]);

        $response->assertStatus(403);
        $this->assertEquals(Soal::STATUS_SUBMITTED, $soal->fresh()->status);
        $this->assertDatabaseMissing('verifikasi', ['soal_id' => $soal->id]);
    }

    // ─── Upload saat Periode CLOSED / Lewat Deadline ──────────────────────────

    public function test_upload_rejected_when_periode_is_closed(): void
    {
        $periode = $this->makePeriode(status: 'CLOSED');
        // Assignment status ACTIVE tapi periode CLOSED -> isUploadOpen() = false
        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosenKoor->id,
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'assigned_by'    => $this->koordinatorUser->id,
            'status'         => 'ACTIVE',
        ]);

        $file = UploadedFile::fake()->create('naskah.pdf', 500, 'application/pdf');
        $ploCloData = ['plo' => [['kode' => 'PLO01', 'deskripsi' => 'A', 'clo' => [['kode' => 'CLO01', 'deskripsi' => 'X', 'bobot_lo' => '100%']]]]];

        $response = $this->actingAs($this->koordinatorUser)->post('/koordinator/soal', [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal Periode Ditutup',
            'file'           => $file,
            'plo_clo_data'   => json_encode($ploCloData),
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('soal', ['judul' => 'Soal Periode Ditutup']);
    }

    public function test_upload_rejected_when_deadline_has_passed(): void
    {
        $periode = $this->makePeriode(status: 'ACTIVE', deadline: now()->subDay()->toDateTimeString());
        $this->assignKoordinator($periode);

        $file = UploadedFile::fake()->create('naskah.pdf', 500, 'application/pdf');
        $ploCloData = ['plo' => [['kode' => 'PLO01', 'deskripsi' => 'A', 'clo' => [['kode' => 'CLO01', 'deskripsi' => 'X', 'bobot_lo' => '100%']]]]];

        $response = $this->actingAs($this->koordinatorUser)->post('/koordinator/soal', [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal Lewat Deadline',
            'file'           => $file,
            'plo_clo_data'   => json_encode($ploCloData),
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('soal', ['judul' => 'Soal Lewat Deadline']);
    }

    public function test_create_page_redirects_when_no_active_periode(): void
    {
        // Tidak ada periode ACTIVE
        PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $this->ta->id,
            'nama'            => 'Periode Lama Ditutup',
            'tanggal_mulai'   => now()->subDays(60)->toDateString(),
            'tanggal_selesai' => now()->subDays(30)->toDateString(),
            'deadline_upload' => now()->subDays(35)->toDateTimeString(),
            'status'          => 'CLOSED',
        ]);

        $response = $this->actingAs($this->koordinatorUser)->get('/koordinator/soal/create');

        $response->assertRedirect('/koordinator/dashboard');
        $response->assertSessionHas('error');
    }
}
