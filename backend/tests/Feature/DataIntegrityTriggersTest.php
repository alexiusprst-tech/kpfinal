<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Dosen;
use App\Models\KelompokKoordinator;
use App\Models\KelompokVerifikasi;
use App\Models\KelompokVerifikator;
use App\Models\MataKuliah;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Covers the SQLite-portable triggers added in
 * 2026_09_28_000002_add_sqlite_data_integrity_triggers.php — a real
 * database-level backstop for Separation-of-Duties (across kelompok) and
 * audit_logs immutability, mirroring what previously only existed as
 * PostgreSQL-only triggers with zero automated test coverage.
 */
class DataIntegrityTriggersTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected PeriodeVerifikasi $periode;
    protected MataKuliah $mk1;
    protected Dosen $dosen1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Super Admin',
            'email'    => 'admin@test.com',
            'password' => bcrypt('password'),
            'role'     => 'SUPER_ADMIN',
            'status'   => 'ACTIVE',
        ]);

        $this->dosen1 = Dosen::create([
            'id'           => (string) Str::uuid(),
            'kode_dosen'   => 'DSN1',
            'nama_lengkap' => 'Dr. Dosen Satu',
            'email'        => 'dosen1@test.com',
            'status'       => 'ACTIVE',
        ]);

        $ta = TahunAjaran::create([
            'id'            => (string) Str::uuid(),
            'nama'          => '2026/2027',
            'tahun_mulai'   => 2026,
            'tahun_selesai' => 2027,
            'status'        => 'ACTIVE',
        ]);

        $this->periode = PeriodeVerifikasi::create([
            'id'              => (string) Str::uuid(),
            'tahun_ajaran_id' => $ta->id,
            'nama'            => 'UTS Ganjil 2026/2027',
            'tanggal_mulai'   => '2026-10-01',
            'tanggal_selesai' => '2026-10-31',
            'deadline_upload' => '2026-10-25 23:59:59',
            'status'          => 'ACTIVE',
        ]);

        $this->mk1 = MataKuliah::create([
            'id'       => (string) Str::uuid(),
            'kode_mk'  => 'IS101',
            'nama_mk'  => 'Sistem Informasi',
            'sks'      => 3,
            'semester' => 1,
            'status'   => 'ACTIVE',
        ]);
    }

    public function test_audit_log_cannot_be_updated_at_the_database_level(): void
    {
        AuditLog::record($this->superAdmin->id, 'TEST_ACTION', 'MataKuliah', $this->mk1->id);
        $log = AuditLog::where('action', 'TEST_ACTION')->firstOrFail();

        $this->expectException(QueryException::class);
        $this->expectExceptionMessage('audit_logs bersifat immutable');

        $log->action = 'TAMPERED';
        $log->save();
    }

    public function test_audit_log_cannot_be_deleted_at_the_database_level(): void
    {
        AuditLog::record($this->superAdmin->id, 'TEST_ACTION', 'MataKuliah', $this->mk1->id);
        $log = AuditLog::where('action', 'TEST_ACTION')->firstOrFail();

        $this->expectException(QueryException::class);
        $this->expectExceptionMessage('audit_logs bersifat immutable');

        $log->delete();
    }

    public function test_database_rejects_verifikator_assignment_conflicting_with_active_koordinator_in_another_kelompok(): void
    {
        $kelompokA = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok A',
            'periode_id' => $this->periode->id,
            'status'     => 'ACTIVE',
            'created_by' => $this->superAdmin->id,
        ]);

        // dosen1 is already an ACTIVE koordinator for mk1 in Kelompok A.
        PenugasanKoordinator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosen1->id,
            'mata_kuliah_id' => $this->mk1->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->superAdmin->id,
            'kelompok_id'    => $kelompokA->id,
            'status'         => 'ACTIVE',
        ]);

        $kelompokB = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok B',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        // A separate request/kelompok trying to make the SAME dosen a
        // verifikator for the SAME MK+periode must be rejected at the DB
        // level — this is the cross-request race the app-level check alone
        // (no shared row lock across two tables) cannot fully close.
        $this->expectException(QueryException::class);
        $this->expectExceptionMessage('sudah menjadi Koordinator aktif');

        KelompokVerifikator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompokB->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);
    }

    public function test_database_rejects_koordinator_assignment_conflicting_with_active_verifikator_in_another_kelompok(): void
    {
        $kelompokA = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok A',
            'periode_id' => $this->periode->id,
            'status'     => 'ACTIVE',
            'created_by' => $this->superAdmin->id,
        ]);

        // dosen1 is already an ACTIVE verifikator for mk1 in Kelompok A.
        PenugasanVerifikator::create([
            'id'             => (string) Str::uuid(),
            'dosen_id'       => $this->dosen1->id,
            'mata_kuliah_id' => $this->mk1->id,
            'periode_id'     => $this->periode->id,
            'assigned_by'    => $this->superAdmin->id,
            'kelompok_id'    => $kelompokA->id,
            'status'         => 'ACTIVE',
        ]);

        $kelompokB = KelompokVerifikasi::create([
            'id'         => (string) Str::uuid(),
            'nama'       => 'Kelompok B',
            'periode_id' => $this->periode->id,
            'status'     => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);

        $this->expectException(QueryException::class);
        $this->expectExceptionMessage('sudah menjadi Verifikator aktif');

        KelompokKoordinator::create([
            'id'             => (string) Str::uuid(),
            'kelompok_id'    => $kelompokB->id,
            'mata_kuliah_id' => $this->mk1->id,
            'dosen_id'       => $this->dosen1->id,
        ]);
    }
}
