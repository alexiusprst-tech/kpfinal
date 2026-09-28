<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\KategoriSoal;
use App\Models\MataKuliah;
use App\Models\Notification;
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
 * EventNotificationTest — Tier 4
 *
 * Menguji bahwa notifikasi dikirimkan kepada pihak yang tepat pada:
 *  - Event submit soal (verifikator menerima notifikasi)
 *  - Event upload revisi (verifikator menerima notifikasi)
 *  - Event keputusan verifikasi (koordinator/pengunggah menerima notifikasi)
 */
class EventNotificationTest extends TestCase
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

    /**
     * Ketika koordinator submit soal, verifikator yang ditugaskan harus menerima notifikasi.
     */
    public function test_verifikator_receives_notification_when_soal_is_submitted(): void
    {
        $file = UploadedFile::fake()->create('naskah.pdf', 500, 'application/pdf');
        $ploCloData = ['plo' => [['kode' => 'PLO01', 'deskripsi' => 'A', 'clo' => [
            ['kode' => 'CLO01', 'deskripsi' => 'X', 'bobot_lo' => '100%'],
        ]]]];

        $beforeCount = Notification::where('user_id', $this->verifikatorUser->id)->count();

        $this->actingAs($this->koordinatorUser)->post('/koordinator/soal', [
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'judul'          => 'Soal Submit Notif Test',
            'file'           => $file,
            'plo_clo_data'   => json_encode($ploCloData),
            'submit_now'     => true,
        ]);

        $afterCount = Notification::where('user_id', $this->verifikatorUser->id)->count();
        $this->assertGreaterThan($beforeCount, $afterCount, 'Verifikator harus menerima minimal 1 notifikasi saat soal disubmit.');
    }

    /**
     * Ketika koordinator mengupload revisi soal, verifikator yang ditugaskan
     * harus menerima notifikasi tentang revisi baru.
     */
    public function test_verifikator_receives_notification_when_revision_is_uploaded(): void
    {
        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Soal Revisi Notif Test',
            'nama_file'      => 'soal.pdf',
            'file_path'      => 'soal/2026/dummy.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 1024,
            'status'         => Soal::STATUS_REVISION,
        ]);

        $beforeCount = Notification::where('user_id', $this->verifikatorUser->id)->count();

        $revisiFile = UploadedFile::fake()->create('revisi_v2.pdf', 500, 'application/pdf');
        $this->actingAs($this->koordinatorUser)->post("/koordinator/revisi/{$soal->id}", [
            'file'    => $revisiFile,
            'catatan' => 'Revisi sesuai catatan verifikator.',
        ]);

        $afterCount = Notification::where('user_id', $this->verifikatorUser->id)->count();
        $this->assertGreaterThan($beforeCount, $afterCount, 'Verifikator harus menerima notifikasi saat revisi diupload.');
    }

    /**
     * Ketika verifikator APPROVED soal, koordinator/pengunggah harus menerima notifikasi.
     */
    public function test_koordinator_receives_notification_when_soal_is_approved(): void
    {
        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Soal Approved Notif Test',
            'nama_file'      => 'soal.pdf',
            'file_path'      => 'soal/2026/dummy.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 1024,
            'status'         => Soal::STATUS_SUBMITTED,
        ]);

        $beforeCount = Notification::where('user_id', $this->koordinatorUser->id)->count();

        $this->actingAs($this->verifikatorUser)
            ->post("/verifikator/soal/{$soal->id}/verifikasi", [
                'action'  => 'APPROVED',
                'catatan' => 'Soal sudah sesuai.',
            ]);

        $afterCount = Notification::where('user_id', $this->koordinatorUser->id)->count();
        $this->assertGreaterThan($beforeCount, $afterCount, 'Koordinator harus menerima notifikasi saat soal diapprove.');
    }

    /**
     * Ketika verifikator meminta REVISION, koordinator harus menerima notifikasi.
     */
    public function test_koordinator_receives_notification_when_revision_is_requested(): void
    {
        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mataKuliah->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Soal Revision Notif Test',
            'nama_file'      => 'soal.pdf',
            'file_path'      => 'soal/2026/dummy.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 1024,
            'status'         => Soal::STATUS_SUBMITTED,
        ]);

        $beforeCount = Notification::where('user_id', $this->koordinatorUser->id)->count();

        $this->actingAs($this->verifikatorUser)
            ->post("/verifikator/soal/{$soal->id}/verifikasi", [
                'action'  => 'REVISION',
                'catatan' => 'Perlu perbaikan pada CLO-01.',
            ]);

        $afterCount = Notification::where('user_id', $this->koordinatorUser->id)->count();
        $this->assertGreaterThan($beforeCount, $afterCount, 'Koordinator harus menerima notifikasi saat revisi diminta.');
    }
}
