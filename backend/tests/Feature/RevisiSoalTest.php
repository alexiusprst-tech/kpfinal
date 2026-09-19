<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\KategoriSoal;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\RevisiSoal;
use App\Models\Soal;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class RevisiSoalTest extends TestCase
{
    use RefreshDatabase;

    protected User $koordinatorUser;
    protected Dosen $dosenKoor;
    protected User $verifikatorUser;
    protected Dosen $dosenVerif;
    protected User $outsiderUser;
    protected Dosen $dosenOutsider;
    protected MataKuliah $mataKuliah;
    protected PeriodeVerifikasi $periode;
    protected Soal $soal;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('private');

        $this->koordinatorUser = User::create([
            'id' => (string) Str::uuid(), 'name' => 'Koordinator MK',
            'email' => 'koor@telkomuniversity.ac.id', 'password' => bcrypt('password'),
            'role' => 'KOORDINATOR', 'status' => 'ACTIVE',
        ]);
        $this->dosenKoor = Dosen::create([
            'id' => (string) Str::uuid(), 'kode_dosen' => 'KOR01',
            'nama_lengkap' => 'Dosen Koordinator', 'email' => 'koor@telkomuniversity.ac.id',
            'user_id' => $this->koordinatorUser->id, 'status' => 'ACTIVE',
        ]);

        $this->verifikatorUser = User::create([
            'id' => (string) Str::uuid(), 'name' => 'Verifikator MK',
            'email' => 'verif@telkomuniversity.ac.id', 'password' => bcrypt('password'),
            'role' => 'VERIFIKATOR', 'status' => 'ACTIVE',
        ]);
        $this->dosenVerif = Dosen::create([
            'id' => (string) Str::uuid(), 'kode_dosen' => 'VER01',
            'nama_lengkap' => 'Dosen Verifikator', 'email' => 'verif@telkomuniversity.ac.id',
            'user_id' => $this->verifikatorUser->id, 'status' => 'ACTIVE',
        ]);

        $this->outsiderUser = User::create([
            'id' => (string) Str::uuid(), 'name' => 'Dosen Lain',
            'email' => 'lain@telkomuniversity.ac.id', 'password' => bcrypt('password'),
            'role' => null, 'status' => 'ACTIVE',
        ]);
        $this->dosenOutsider = Dosen::create([
            'id' => (string) Str::uuid(), 'kode_dosen' => 'OUT01',
            'nama_lengkap' => 'Dosen Tidak Terkait', 'email' => 'lain@telkomuniversity.ac.id',
            'user_id' => $this->outsiderUser->id, 'status' => 'ACTIVE',
        ]);

        $ta = TahunAjaran::create([
            'id' => (string) Str::uuid(), 'nama' => '2026/2027',
            'tahun_mulai' => 2026, 'tahun_selesai' => 2027, 'status' => 'ACTIVE',
        ]);
        $this->periode = PeriodeVerifikasi::create([
            'id' => (string) Str::uuid(), 'tahun_ajaran_id' => $ta->id,
            'nama' => 'UTS Ganjil', 'tanggal_mulai' => now()->subDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(20)->toDateString(),
            'deadline_upload' => now()->addDays(10), 'status' => 'ACTIVE',
        ]);
        $this->mataKuliah = MataKuliah::create([
            'id' => (string) Str::uuid(), 'kode_mk' => 'MK001',
            'nama_mk' => 'Struktur Data', 'sks' => 3, 'semester' => 2, 'status' => 'ACTIVE',
        ]);
        $kategori = KategoriSoal::create(['id' => (string) Str::uuid(), 'nama' => 'UTS Teori']);

        PenugasanKoordinator::create([
            'id' => (string) Str::uuid(), 'dosen_id' => $this->dosenKoor->id,
            'mata_kuliah_id' => $this->mataKuliah->id, 'periode_id' => $this->periode->id,
            'assigned_by' => $this->koordinatorUser->id, 'status' => 'ACTIVE',
        ]);
        PenugasanVerifikator::create([
            'id' => (string) Str::uuid(), 'dosen_id' => $this->dosenVerif->id,
            'mata_kuliah_id' => $this->mataKuliah->id, 'periode_id' => $this->periode->id,
            'assigned_by' => $this->koordinatorUser->id, 'status' => 'ACTIVE',
        ]);

        $this->soal = Soal::create([
            'id' => (string) Str::uuid(), 'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id' => $this->periode->id, 'kategori_id' => $kategori->id,
            'judul' => 'Soal UTS', 'nama_file' => 'naskah.pdf',
            'file_path' => 'soal/2026/naskah.pdf', 'mime_type' => 'application/pdf',
            'file_size' => 512000, 'uploaded_by' => $this->koordinatorUser->id,
            'status' => Soal::STATUS_REVISION,
        ]);
    }

    public function test_owner_koordinator_can_upload_revisi_when_soal_needs_revision(): void
    {
        $file = UploadedFile::fake()->create('revisi.pdf', 300, 'application/pdf');

        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.revisi.store', $this->soal->id), [
                'file'    => $file,
                'catatan' => 'Perbaikan sesuai catatan verifikator',
            ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('revisi_soal', [
            'soal_id'     => $this->soal->id,
            'uploaded_by' => $this->koordinatorUser->id,
            'version'     => 1,
        ]);
        $this->assertEquals(Soal::STATUS_RESUBMITTED, $this->soal->fresh()->status);
    }

    public function test_uploading_revisi_fails_when_soal_is_not_in_revision_status(): void
    {
        $this->soal->update(['status' => Soal::STATUS_APPROVED]);
        $file = UploadedFile::fake()->create('revisi.pdf', 300, 'application/pdf');

        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.revisi.store', $this->soal->id), ['file' => $file]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('revisi_soal', ['soal_id' => $this->soal->id]);
    }

    public function test_unrelated_dosen_cannot_upload_revisi(): void
    {
        $file = UploadedFile::fake()->create('revisi.pdf', 300, 'application/pdf');

        $this->actingAs($this->outsiderUser)
            ->post(route('koordinator.revisi.store', $this->soal->id), ['file' => $file])
            ->assertForbidden();

        $this->assertDatabaseMissing('revisi_soal', ['soal_id' => $this->soal->id]);
    }

    public function test_assigned_verifikator_can_download_revisi_file(): void
    {
        $revisi = $this->createRevisi();

        $this->actingAs($this->verifikatorUser)
            ->get(route('verifikator.revisi.download', $revisi->id))
            ->assertOk();
    }

    public function test_unrelated_dosen_cannot_download_revisi_file(): void
    {
        $revisi = $this->createRevisi();

        $this->actingAs($this->outsiderUser)
            ->get(route('koordinator.revisi.download', $revisi->id))
            ->assertForbidden();
    }

    private function createRevisi(): RevisiSoal
    {
        $path = Storage::disk('private')->putFileAs(
            'soal/revisi/2026',
            UploadedFile::fake()->create('revisi.pdf', 300, 'application/pdf'),
            'revisi.pdf'
        );

        return RevisiSoal::create([
            'id'          => (string) Str::uuid(),
            'soal_id'     => $this->soal->id,
            'version'     => 1,
            'nama_file'   => 'revisi.pdf',
            'file_path'   => $path,
            'mime_type'   => 'application/pdf',
            'file_size'   => 300000,
            'uploaded_by' => $this->koordinatorUser->id,
            'uploaded_at' => now(),
        ]);
    }
}
