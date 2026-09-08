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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class BeritaAcaraTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $verifikatorUser;
    protected Dosen $verifikatorDosen;
    protected User $koordinatorUser;
    protected Dosen $koordinatorDosen;
    protected MataKuliah $mk;
    protected PeriodeVerifikasi $periode;
    protected KategoriSoal $kategori;
    protected Soal $approvedSoal;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');

        $this->superAdmin = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Super Admin',
            'email'    => 'admin@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);

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

        $this->mk = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'BBK2DAB3',
            'nama_mk'  => 'Pemrograman Web',
            'sks'      => 3,
            'semester' => 3,
            'status'   => 'ACTIVE',
        ]);

        $this->kategori = KategoriSoal::create([
            'id'        => (string) Str::uuid(),
            'nama'      => 'UTS',
            'deskripsi' => 'Ujian Tengah Semester',
            'status'    => 'ACTIVE',
        ]);

        // Verifikator
        $this->verifikatorUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Verifikator Dosen',
            'email'    => 'verifikator@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);

        $this->verifikatorDosen = Dosen::create([
            'id'             => (string) Str::uuid(),
            'kode_dosen'     => 'VRF',
            'nama_lengkap'   => 'Verifikator Dosen',
            'email'          => 'verifikator@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'user_id'        => $this->verifikatorUser->id,
            'status'         => 'ACTIVE',
        ]);

        // Koordinator
        $this->koordinatorUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Koordinator Dosen',
            'email'    => 'koordinator@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);

        $this->koordinatorDosen = Dosen::create([
            'id'             => (string) Str::uuid(),
            'kode_dosen'     => 'KRD',
            'nama_lengkap'   => 'Koordinator Dosen',
            'email'          => 'koordinator@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'user_id'        => $this->koordinatorUser->id,
            'status'         => 'ACTIVE',
        ]);

        // Assign Verifikator & Koordinator
        PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->verifikatorDosen->id,
            'mata_kuliah_id' => $this->mk->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->superAdmin->id,
            'status'         => 'ACTIVE',
        ]);

        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->koordinatorDosen->id,
            'mata_kuliah_id' => $this->mk->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->superAdmin->id,
            'status'         => 'ACTIVE',
        ]);

        // Approved Soal
        $filePath = 'soal/2026/09/dummy.pdf';
        Storage::disk('private')->put($filePath, '%PDF-1.4 Dummy PDF Content');

        $this->approvedSoal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $this->mk->id,
            'periode_id'     => $this->periode->id,
            'kategori_id'    => $this->kategori->id,
            'uploaded_by'    => $this->koordinatorUser->id,
            'judul'          => 'Naskah UTS Pemrograman Web',
            'nama_file'      => 'uts_web.pdf',
            'file_path'      => $filePath,
            'mime_type'      => 'application/pdf',
            'file_size'      => 1024,
            'status'         => Soal::STATUS_APPROVED,
            'plo_clo_data'   => [
                'plo' => [
                    [
                        'kode' => 'PLO01',
                        'clo'  => [['kode' => 'CLO01', 'bobot_lo' => '100%']]
                    ]
                ]
            ],
        ]);
    }

    public function test_verifikator_can_view_berita_acara_index(): void
    {
        $response = $this->actingAs($this->verifikatorUser)
            ->get(route('verifikator.berita-acara.index'));

        $response->assertOk();
    }

    public function test_verifikator_can_view_berita_acara_show_for_assigned_course(): void
    {
        $response = $this->actingAs($this->verifikatorUser)
            ->get(route('verifikator.berita-acara.show', [
                'mataKuliah' => $this->mk->id,
                'periode_id' => $this->periode->id,
            ]));

        $response->assertOk();
    }

    public function test_verifikator_can_download_bap_pdf_single_soal(): void
    {
        $response = $this->actingAs($this->verifikatorUser)
            ->get(route('verifikator.berita-acara.cetak', [
                'mataKuliah' => $this->mk->id,
                'periode_id' => $this->periode->id,
            ]));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_verifikator_can_download_bap_soal_pdf(): void
    {
        $response = $this->actingAs($this->verifikatorUser)
            ->get(route('verifikator.berita-acara.cetak-soal', [
                'soal' => $this->approvedSoal->id,
            ]));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_unassigned_verifikator_cannot_generate_bap_pdf(): void
    {
        $otherUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Other Verifikator',
            'email'    => 'otherverif@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);

        $otherDosen = Dosen::create([
            'id'             => (string) Str::uuid(),
            'kode_dosen'     => 'OTH',
            'nama_lengkap'   => 'Other Verifikator',
            'email'          => 'otherverif@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'user_id'        => $otherUser->id,
            'status'         => 'ACTIVE',
        ]);

        $response = $this->actingAs($otherUser)
            ->get(route('verifikator.berita-acara.cetak', [
                'mataKuliah' => $this->mk->id,
                'periode_id' => $this->periode->id,
            ]));

        $response->assertStatus(403);
    }
}
