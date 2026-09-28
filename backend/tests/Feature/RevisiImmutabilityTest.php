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

/**
 * RevisiImmutabilityTest — Tier 4
 *
 * Menguji imutabilitas revisi soal lintas versi:
 *  - Revisi v1 tidak dapat di-overwrite oleh v2 (versi increment, bukan replace)
 *  - Revisi tidak dapat diunggah ketika soal berstatus APPROVED (tidak bisa direvisi)
 *  - Revisi tidak dapat diunggah ketika soal berstatus DRAFT (belum pernah disubmit)
 *  - Versi revisi selalu increment secara monoton (v1 → v2 → v3)
 */
class RevisiImmutabilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $koordinatorUser;
    protected Dosen $dosenKoor;
    protected User $verifikatorUser;
    protected Dosen $dosenVerif;
    protected MataKuliah $mataKuliah;
    protected KategoriSoal $kategori;
    protected PeriodeVerifikasi $periode;

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
            'tanggal_selesai' => now()->addDays(30)->toDateString(),
            'deadline_upload' => now()->addDays(10)->toDateTimeString(),
            'status'          => 'ACTIVE',
        ]);

        $this->mataKuliah = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'REV2DAB3',
            'nama_mk'  => 'MK Revisi Test',
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
            'name'     => 'Koordinator',
            'email'    => 'koor@test.com',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);
        $this->dosenKoor = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'KOR01',
            'nama_lengkap' => 'Koordinator M.Kom.',
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
            'nama_lengkap' => 'Verifikator M.T.',
            'email'        => 'verif@test.com',
            'user_id'      => $this->verifikatorUser->id,
            'status'       => 'ACTIVE',
        ]);
        PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosenVerif->id,
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->koordinatorUser->id,
            'status'         => 'ACTIVE',
        ]);
    }

    private function makeSoal(string $status = Soal::STATUS_REVISION): Soal
    {
        return Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Soal Revisi Test',
            'nama_file'      => 'soal.pdf',
            'file_path'      => 'soal/2026/dummy.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 1024,
            'status'         => $status,
        ]);
    }

    /**
     * Upload revisi pertama (v1) harus menghasilkan RevisiSoal dengan version=1
     * dan soal berstatus RESUBMITTED.
     */
    public function test_first_revision_is_version_1(): void
    {
        $soal = $this->makeSoal(Soal::STATUS_REVISION);

        $file = UploadedFile::fake()->create('revisi_v1.pdf', 500, 'application/pdf');
        $this->actingAs($this->koordinatorUser)->post("/koordinator/revisi/{$soal->id}", [
            'file'    => $file,
            'catatan' => 'Revisi pertama.',
        ]);

        $revisiList = RevisiSoal::where('soal_id', $soal->id)->orderBy('version')->get();
        $this->assertCount(1, $revisiList);
        $this->assertEquals(1, $revisiList->first()->version);
        $this->assertEquals(Soal::STATUS_RESUBMITTED, $soal->fresh()->status);
    }

    /**
     * Upload revisi kedua (v2) setelah verifikator meminta revisi lagi harus
     * menghasilkan RevisiSoal dengan version=2. Revisi v1 harus tetap ada
     * dan tidak di-overwrite.
     */
    public function test_second_revision_is_version_2_and_v1_still_exists(): void
    {
        $soal = $this->makeSoal(Soal::STATUS_REVISION);

        // Upload v1
        $fileV1 = UploadedFile::fake()->create('revisi_v1.pdf', 500, 'application/pdf');
        $this->actingAs($this->koordinatorUser)->post("/koordinator/revisi/{$soal->id}", [
            'file'    => $fileV1,
            'catatan' => 'Revisi pertama.',
        ]);

        // Verifikator minta revisi lagi (set status kembali ke REVISION)
        $soal->refresh();
        $soal->update(['status' => Soal::STATUS_REVISION]);

        // Upload v2
        $fileV2 = UploadedFile::fake()->create('revisi_v2.pdf', 600, 'application/pdf');
        $response2 = $this->actingAs($this->koordinatorUser)->post("/koordinator/revisi/{$soal->id}", [
            'file'    => $fileV2,
            'catatan' => 'Revisi kedua.',
        ]);
        $response2->assertSessionHas('success');

        $revisiList = RevisiSoal::where('soal_id', $soal->id)->orderBy('version')->get();

        // Harus ada 2 revisi, bukan 1
        $this->assertCount(2, $revisiList);
        $this->assertEquals(1, $revisiList[0]->version, 'Revisi v1 harus masih ada');
        $this->assertEquals(2, $revisiList[1]->version, 'Revisi v2 harus memiliki version=2');
        // Nama file v1 tidak boleh berubah (imutabel)
        $this->assertEquals('revisi_v1.pdf', $revisiList[0]->nama_file);
        $this->assertEquals('revisi_v2.pdf', $revisiList[1]->nama_file);
    }

    /**
     * Upload revisi pada soal berstatus APPROVED harus ditolak —
     * soal yang sudah disetujui tidak bisa direvisi.
     */
    public function test_revision_upload_blocked_on_approved_soal(): void
    {
        $soal = $this->makeSoal(Soal::STATUS_APPROVED);

        $file = UploadedFile::fake()->create('revisi_bypass.pdf', 500, 'application/pdf');
        $response = $this->actingAs($this->koordinatorUser)
            ->post("/koordinator/revisi/{$soal->id}", [
                'file'    => $file,
                'catatan' => 'Coba revisi soal approved.',
            ]);

        $response->assertSessionHas('error');
        $this->assertCount(0, RevisiSoal::where('soal_id', $soal->id)->get());
        $this->assertEquals(Soal::STATUS_APPROVED, $soal->fresh()->status);
    }

    /**
     * Upload revisi pada soal berstatus DRAFT harus ditolak —
     * soal draft belum pernah disubmit dan tidak dalam proses verifikasi.
     */
    public function test_revision_upload_blocked_on_draft_soal(): void
    {
        $soal = $this->makeSoal(Soal::STATUS_DRAFT);

        $file = UploadedFile::fake()->create('revisi_draft.pdf', 500, 'application/pdf');
        $response = $this->actingAs($this->koordinatorUser)
            ->post("/koordinator/revisi/{$soal->id}", [
                'file'    => $file,
                'catatan' => 'Coba revisi soal draft.',
            ]);

        $response->assertSessionHas('error');
        $this->assertCount(0, RevisiSoal::where('soal_id', $soal->id)->get());
    }
}
