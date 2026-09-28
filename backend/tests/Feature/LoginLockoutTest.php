<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * LoginLockoutTest — Tier 4
 *
 * Menguji:
 *  1. Login lockout setelah N kali gagal (throttle:5,1 pada POST /login)
 *  2. Middleware EnsurePasswordChanged memblokir request mutasi (non-GET)
 *     ketika user belum mengganti password default.
 */
class LoginLockoutTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Dosen $dosen;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');

        $this->user = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dosen Test',
            'email'    => 'locktest@telkomuniversity.ac.id',
            'password' => bcrypt('benar123'),
            'role'     => 'KOORDINATOR',
            'status'   => 'ACTIVE',
        ]);

        $this->dosen = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'LCK01',
            'nip'          => '99991111',
            'nama_lengkap' => 'Dosen Lockout Test, M.Kom.',
            'email'        => 'locktest@telkomuniversity.ac.id',
            'user_id'      => $this->user->id,
            'status'       => 'ACTIVE',
        ]);
    }

    // ─── Login Throttle ───────────────────────────────────────────────────────

    /**
     * Setelah 5 kali login gagal, endpoint POST /login harus mengembalikan
     * HTTP 429 Too Many Requests (throttle:5,1 di routes/web.php).
     */
    public function test_login_is_throttled_after_multiple_failed_attempts(): void
    {
        // Bersihkan rate limiter sebelum test agar tidak terkontaminasi
        RateLimiter::clear('login');

        // 5 percobaan gagal
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email'    => 'locktest@telkomuniversity.ac.id',
                'password' => 'salah-banget',
            ]);
        }

        // Percobaan ke-6 harus kena throttle (429)
        $response = $this->post('/login', [
            'email'    => 'locktest@telkomuniversity.ac.id',
            'password' => 'salah-banget',
        ]);

        $response->assertStatus(429);
    }

    // ─── Middleware EnsurePasswordChanged ─────────────────────────────────────

    /**
     * User dengan must_change_password=true masih bisa mengakses halaman GET
     * (browse), tapi tidak bisa melakukan mutasi (POST/PUT/DELETE) kecuali
     * ganti password atau logout.
     */
    public function test_must_change_password_user_can_browse_but_not_mutate(): void
    {
        $this->user->update(['must_change_password' => true]);

        $ta = TahunAjaran::create([
            'id'            => (string) Str::uuid(),
            'nama'          => '2025/2026',
            'tahun_mulai'   => 2025,
            'tahun_selesai' => 2026,
            'status'        => 'ACTIVE',
        ]);

        $periode = PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $ta->id,
            'nama'            => 'UTS 2025/2026',
            'tanggal_mulai'   => now()->subDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(30)->toDateString(),
            'deadline_upload' => now()->addDays(10)->toDateTimeString(),
            'status'          => 'ACTIVE',
        ]);

        $mk = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'LCK2DAB3',
            'nama_mk'  => 'MK Lockout',
            'sks'      => 3,
            'semester' => 3,
            'status'   => 'ACTIVE',
        ]);

        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosen->id,
            'mata_kuliah_id' => $mk->id,
            'periode_id'     => $periode->id,
            'assigned_by'    => $this->user->id,
            'status'         => 'ACTIVE',
        ]);

        // GET request harus diijinkan
        $getResponse = $this->actingAs($this->user)->get('/koordinator/dashboard');
        $getResponse->assertStatus(200);

        $kategori = \App\Models\KategoriSoal::create([
            'id'   => (string) Str::uuid(),
            'nama' => 'UTS Teori',
        ]);

        // POST mutation request harus diblokir (kecuali /profile/password)
        $soal = Soal::create([
            'id'             => (string) Str::uuid(),
            'mata_kuliah_id' => $mk->id,
            'periode_id'     => $periode->id,
            'kategori_id'    => $kategori->id,
            'uploaded_by'    => $this->user->id,
            'judul'          => 'Soal Pra-Submit',
            'nama_file'      => 'soal.pdf',
            'file_path'      => 'soal/2026/dummy.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => 1024,
            'status'         => 'DRAFT',
        ]);

        // Mencoba submit soal tanpa mengganti password harus diblokir
        $postResponse = $this->actingAs($this->user)->post("/koordinator/soal/{$soal->id}/submit");
        // EnsurePasswordChanged middleware mengembalikan redirect with('error')
        $postResponse->assertRedirect();
        $postResponse->assertSessionHas('error');

        // Status soal tidak boleh berubah
        $this->assertEquals('DRAFT', $soal->fresh()->status);
    }

    /**
     * User dengan must_change_password=true BISA mengganti password
     * (route profile.password dikecualikan dari middleware).
     */
    public function test_must_change_password_user_can_change_password(): void
    {
        $this->user->update(['must_change_password' => true]);

        $response = $this->actingAs($this->user)->post('/profile/password', [
            'current_password'      => 'benar123',
            'password'              => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ]);

        // Harus berhasil (tidak diblokir oleh middleware)
        $response->assertSessionDoesntHaveErrors();
    }
}
