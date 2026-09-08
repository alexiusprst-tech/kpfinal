<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProfileSignatureTest extends TestCase
{
    use RefreshDatabase;

    protected User $dosenUser;
    protected Dosen $dosen;
    protected User $superAdmin;
    protected FilesystemAdapter $disk;

    protected function setUp(): void
    {
        parent::setUp();
        /** @var FilesystemAdapter $fakeDisk */
        $fakeDisk = Storage::fake('public');
        $this->disk = $fakeDisk;

        $this->dosenUser = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Dosen Penguji',
            'email'    => 'dosen@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'VERIFIKATOR',
            'status'   => 'ACTIVE',
        ]);

        $this->dosen = Dosen::create([
            'id'             => (string) Str::uuid(),
            'kode_dosen'     => 'DSN',
            'nama_lengkap'   => 'Dosen Penguji',
            'email'          => 'dosen@telkomuniversity.ac.id',
            'kategori_dosen' => 'Dosen Tetap',
            'user_id'        => $this->dosenUser->id,
            'status'         => 'ACTIVE',
        ]);

        $this->superAdmin = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Super Admin',
            'email'    => 'admin@telkomuniversity.ac.id',
            'password' => bcrypt('password'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);
    }

    public function test_user_can_view_profile_page(): void
    {
        $response = $this->actingAs($this->dosenUser)
            ->get(route('profile.show'));

        $response->assertOk();
    }

    public function test_dosen_user_can_upload_profile_signature(): void
    {
        $image = UploadedFile::fake()->image('signature.png', 300, 150);

        $response = $this->actingAs($this->dosenUser)
            ->post(route('profile.signature'), [
                'tanda_tangan' => $image,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->dosen->refresh();
        $this->assertNotNull($this->dosen->tanda_tangan);
        $this->disk->assertExists($this->dosen->tanda_tangan);
    }

    public function test_dosen_user_can_delete_profile_signature(): void
    {
        $filePath = 'tanda-tangan/dosen_sig.png';
        $this->disk->put($filePath, 'fake image content');
        $this->dosen->update(['tanda_tangan' => $filePath]);

        $response = $this->actingAs($this->dosenUser)
            ->delete(route('profile.signature.delete'));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->dosen->refresh();
        $this->assertNull($this->dosen->tanda_tangan);
        $this->disk->assertMissing($filePath);
    }

    public function test_superadmin_can_upload_kaprodi_signature(): void
    {
        $image = UploadedFile::fake()->image('kaprodi_sig.png', 400, 200);

        $response = $this->actingAs($this->superAdmin)
            ->post(route('profile.signature'), [
                'tanda_tangan' => $image,
                'kaprodi_nama' => 'Dr. Kaprodi, S.T., M.T.',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $path = Setting::get('kaprodi_tanda_tangan');
        $this->assertNotNull($path);
        $this->disk->assertExists($path);
        $this->assertEquals('Dr. Kaprodi, S.T., M.T.', Setting::get('kaprodi_nama'));
    }

    public function test_superadmin_can_delete_kaprodi_signature(): void
    {
        $filePath = 'tanda-tangan/kaprodi_signature_12345.png';
        $this->disk->put($filePath, 'fake image content');
        Setting::set('kaprodi_tanda_tangan', $filePath);

        $response = $this->actingAs($this->superAdmin)
            ->delete(route('profile.signature.delete'));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertNull(Setting::get('kaprodi_tanda_tangan'));
        $this->disk->assertMissing($filePath);
    }
}
