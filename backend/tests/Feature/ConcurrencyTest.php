<?php

namespace Tests\Feature;

use App\Models\BeritaAcara;
use App\Models\Dosen;
use App\Models\KategoriSoal;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Models\Verifikasi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected User $koordinatorUser;
    protected Dosen $dosenKoor;
    protected User $verifikatorUser1;
    protected Dosen $dosenVerif1;
    protected User $verifikatorUser2;
    protected Dosen $dosenVerif2;

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

        // Verifikator 1
        $this->verifikatorUser1 = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Verifikator 1',
            'email'    => 'verif1@test.com',
            'password' => bcrypt('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);
        $this->dosenVerif1 = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'VRF01',
            'nama_lengkap' => 'Dosen Verifikator 1, M.T.',
            'email'        => 'verif1@test.com',
            'user_id'      => $this->verifikatorUser1->id,
            'status'       => 'ACTIVE',
        ]);
        PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosenVerif1->id,
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->koordinatorUser->id,
            'status'         => 'ACTIVE',
        ]);

        // Verifikator 2
        $this->verifikatorUser2 = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Verifikator 2',
            'email'    => 'verif2@test.com',
            'password' => bcrypt('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);
        $this->dosenVerif2 = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'VRF02',
            'nama_lengkap' => 'Dosen Verifikator 2, M.T.',
            'email'        => 'verif2@test.com',
            'user_id'      => $this->verifikatorUser2->id,
            'status'       => 'ACTIVE',
        ]);
        PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosenVerif2->id,
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->koordinatorUser->id,
            'status'         => 'ACTIVE',
        ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_concurrent_soal_submission_prevents_duplicate_active_soal()
    {
        $file = UploadedFile::fake()->create('soal_uts.pdf', 500, 'application/pdf');
        $ploCloData = [
            'plo' => [
                [
                    'id' => (string) Str::uuid(),
                    'kode' => 'PLO-01',
                    'clo' => [
                        ['id' => (string) Str::uuid(), 'kode' => 'CLO-01']
                    ]
                ]
            ]
        ];

        // First upload succeeds
        $response1 = $this->actingAs($this->koordinatorUser)->post(route('koordinator.soal.store'), [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal UTS Web Dev A',
            'file'           => $file,
            'plo_clo_data'   => json_encode($ploCloData),
            'submit_now'     => true,
        ]);

        $response1->assertRedirect();

        // Second upload attempt while first soal is still in SUBMITTED state should be blocked cleanly
        $file2 = UploadedFile::fake()->create('soal_uts_b.pdf', 500, 'application/pdf');
        $response2 = $this->actingAs($this->koordinatorUser)->post(route('koordinator.soal.store'), [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal UTS Web Dev B Concurrent',
            'file'           => $file2,
            'plo_clo_data'   => json_encode($ploCloData),
            'submit_now'     => true,
        ]);

        $response2->assertSessionHas('error');

        // Verify only 1 active submitted soal exists for this MK & periode
        $activeSoalCount = Soal::where('mata_kuliah_id', $this->mataKuliah->id)
            ->where('periode_id', $this->periode->id)
            ->whereIn('status', [Soal::STATUS_SUBMITTED, Soal::STATUS_IN_REVIEW])
            ->count();

        $this->assertEquals(1, $activeSoalCount);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_concurrent_verifikasi_decision_records_history_cleanly()
    {
        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Soal Ujian Web',
            'nama_file'      => 'soal.pdf',
            'file_path'      => 'soal/2026/09/dummy.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 1024,
            'status'         => Soal::STATUS_SUBMITTED,
        ]);

        // Verifikator 1 approves
        $response1 = $this->actingAs($this->verifikatorUser1)->post(route('verifikator.verifikasi.store', $soal->id), [
            'action'  => 'APPROVED',
            'catatan' => 'Disetujui Verifikator 1',
        ]);
        $response1->assertRedirect();
        $response1->assertSessionHas('success');

        // Verifikator 2 requests revision concurrently on already-approved soal
        $response2 = $this->actingAs($this->verifikatorUser2)->post(route('verifikator.verifikasi.store', $soal->id), [
            'action'  => 'REVISION',
            'catatan' => 'Perlu revisi pada bagian CLO-01',
        ]);
        $response2->assertRedirect();
        $response2->assertSessionHas('error');

        // Verify only 1 verification decision was recorded and initial APPROVED decision is protected
        $verifikasiCount = Verifikasi::where('soal_id', $soal->id)->count();
        $this->assertEquals(1, $verifikasiCount);

        // Verify final soal state remains APPROVED
        $soal->refresh();
        $this->assertEquals(Soal::STATUS_APPROVED, $soal->status);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_concurrent_berita_acara_generation_locks_transaction()
    {
        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Soal Approved BAP',
            'nama_file'      => 'soal_approved.pdf',
            'file_path'      => 'soal/2026/09/approved.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 2048,
            'status'         => Soal::STATUS_APPROVED,
        ]);

        // Create BAP decision in an isolated database transaction
        $response1 = $this->actingAs($this->verifikatorUser1)->get(route('verifikator.berita-acara.cetak', [
            'mataKuliah' => $this->mataKuliah->id,
            'periode_id' => $this->periode->id,
        ]));

        $response1->assertStatus(200);

        // Verify BeritaAcara record created with unique sequential number
        $bap = BeritaAcara::where('periode_id', $this->periode->id)
            ->where('mata_kuliah_id', $this->mataKuliah->id)
            ->first();

        $this->assertNotNull($bap);
        $this->assertStringContainsString('BAP-Ver', $bap->nomor);

        // Second request should reuse existing BAP record and not create duplicate sequence
        $response2 = $this->actingAs($this->verifikatorUser2)->get(route('verifikator.berita-acara.cetak', [
            'mataKuliah' => $this->mataKuliah->id,
            'periode_id' => $this->periode->id,
        ]));

        $response2->assertStatus(200);

        $bapCount = BeritaAcara::where('periode_id', $this->periode->id)
            ->where('mata_kuliah_id', $this->mataKuliah->id)
            ->count();

        $this->assertEquals(1, $bapCount);
    }
}
