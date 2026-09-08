<?php

namespace Tests\Feature;

use App\Models\Clo;
use App\Models\Dosen;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PeriodeVerifikasi;
use App\Models\Plo;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SoalGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $koordinatorUser;
    protected Dosen $koordinatorDosen;
    protected MataKuliah $mk;
    protected PeriodeVerifikasi $periode;

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

        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->koordinatorDosen->id,
            'mata_kuliah_id' => $this->mk->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->superAdmin->id,
            'status'         => 'ACTIVE',
        ]);
    }

    public function test_koordinator_can_access_soal_generator_page(): void
    {
        $response = $this->actingAs($this->koordinatorUser)
            ->get(route('koordinator.soal.generator', [
                'mata_kuliah_id' => $this->mk->id,
            ]));

        $response->assertRedirect(route('koordinator.soal.create', [
            'mata_kuliah_id' => $this->mk->id,
            'tab'            => 'generator',
        ]));
    }

    public function test_koordinator_can_fetch_course_data_for_generator(): void
    {
        $plo = Plo::create([
            'id'        => (string) Str::uuid(),
            'kode_plo'  => 'PLO01',
            'deskripsi' => 'Deskripsi PLO 01',
        ]);

        $clo = Clo::create([
            'id'        => (string) Str::uuid(),
            'kode_clo'  => 'CLO01',
            'deskripsi' => 'Deskripsi CLO 01',
        ]);

        $this->mk->plo()->attach($plo->id);
        $this->mk->clo()->attach($clo->id);
        $clo->plo()->attach($plo->id);

        $response = $this->actingAs($this->koordinatorUser)
            ->get(route('koordinator.soal.generator.course-data', [
                'mata_kuliah_id' => $this->mk->id,
            ]));

        $response->assertOk();
        $response->assertJsonStructure([
            'form_no',
            'nama_evaluasi',
            'kode_dosen',
            'kode_nama_mk',
            'tipe_ujian',
            'plo',
        ]);
    }

    public function test_koordinator_can_export_pdf_lembar_soal(): void
    {
        $payload = [
            'form_no'             => '100-S1SI-001-R1',
            'nama_evaluasi'       => 'Ujian Tengah Semester',
            'kode_dosen'          => 'KRD',
            'kode_nama_mk'        => 'BBK2DAB3 / Pemrograman Web',
            'tipe_ujian'          => 'UTS',
            'tanggal_evaluasi'    => '2026-09-10 / 120 menit',
            'tipe_soal'           => 'Closed Book',
            'petunjuk_pengerjaan' => ['Jawablah dengan jelas.'],
            'plo'                 => [
                [
                    'kode'      => 'PLO01',
                    'deskripsi' => 'PLO Deskripsi',
                    'clo'       => [
                        [
                            'kode'      => 'CLO01',
                            'deskripsi' => 'CLO Deskripsi',
                            'bobot_lo'  => '100%',
                        ]
                    ]
                ]
            ],
        ];

        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.soal.generator.export-pdf'), $payload);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_koordinator_can_export_docx_lembar_soal(): void
    {
        $payload = [
            'form_no'             => '100-S1SI-001-R1',
            'nama_evaluasi'       => 'Ujian Tengah Semester',
            'kode_dosen'          => 'KRD',
            'kode_nama_mk'        => 'BBK2DAB3 / Pemrograman Web',
            'tipe_ujian'          => 'UTS',
            'tanggal_evaluasi'    => '2026-09-10 / 120 menit',
            'tipe_soal'           => 'Closed Book',
            'petunjuk_pengerjaan' => ['Jawablah dengan jelas.'],
            'plo'                 => [
                [
                    'kode'      => 'PLO01',
                    'deskripsi' => 'PLO Deskripsi',
                    'clo'       => [
                        [
                            'kode'      => 'CLO01',
                            'deskripsi' => 'CLO Deskripsi',
                            'bobot_lo'  => '100%',
                        ]
                    ]
                ]
            ],
        ];

        $response = $this->actingAs($this->koordinatorUser)
            ->post(route('koordinator.soal.generator.export-docx'), $payload);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.ms-word');
    }
}
