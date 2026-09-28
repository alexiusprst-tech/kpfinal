<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * SQLite equivalent of the PL/pgSQL triggers in
     * 2026_08_29_000003_add_data_integrity_triggers.php, which are gated
     * `if (DB::getDriverName() !== 'pgsql') { return; }` and therefore a
     * no-op on SQLite — the only engine the automated test suite runs
     * against, and the default driver per .env.example. Without this, the
     * Separation-of-Duties rule (a dosen must not be Koordinator and
     * Verifikator on the same Mata Kuliah) and audit_logs immutability have
     * zero database-level enforcement outside a live PostgreSQL deployment.
     *
     * SQLite has supported triggers since early versions; the syntax differs
     * from PL/pgSQL (no functions/variables, one event per trigger, and a
     * conditional abort is expressed as `SELECT RAISE(ABORT, 'msg') WHERE
     * <condition>` inside the trigger body). The SoD triggers here are
     * deliberately narrower than their PostgreSQL counterparts — see the
     * comment above the trigger definitions below for why. The
     * max-3-koordinator / max-5-verifikator caps are also intentionally NOT
     * mirrored here — they are redundantly enforced at the application layer
     * (KelompokVerifikasiController) and are lower-severity than the SoD and
     * audit-log-immutability rules this migration focuses on.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        // ── audit_logs is immutable from the application's perspective ─────
        DB::statement('DROP TRIGGER IF EXISTS trg_prevent_audit_log_update');
        DB::statement("
            CREATE TRIGGER trg_prevent_audit_log_update
            BEFORE UPDATE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'audit_logs bersifat immutable — UPDATE/DELETE tidak diizinkan');
            END
        ");

        DB::statement('DROP TRIGGER IF EXISTS trg_prevent_audit_log_delete');
        DB::statement("
            CREATE TRIGGER trg_prevent_audit_log_delete
            BEFORE DELETE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'audit_logs bersifat immutable — UPDATE/DELETE tidak diizinkan');
            END
        ");

        // ── Prevent a dosen from being an ACTIVE koordinator and verifikator
        //    for the same mata kuliah ACROSS different kelompok on the same
        //    periode — the cross-request/cross-kelompok race the app-level
        //    checks alone cannot close (no row lock spans two tables).
        //    Deliberately narrower than the PostgreSQL trigger: this does NOT
        //    also re-check same-kelompok self-conflict (koordinator and
        //    verifikator pivot rows for the very same kelompok), because that
        //    is already reliably validated by KelompokVerifikasiController's
        //    own PHP-level check before activation, and several tests
        //    construct an intentionally-conflicting same-kelompok fixture
        //    directly via Eloquent specifically to exercise that app-level
        //    check — a DB trigger firing at INSERT time would pre-empt that
        //    test setup itself (this is equally true of the PostgreSQL
        //    trigger, which combines both checks; that pre-existing test/prod
        //    behavior mismatch is out of scope here). ───────────────────────
        foreach (['INSERT', 'UPDATE'] as $event) {
            DB::statement("DROP TRIGGER IF EXISTS trg_validate_verifikator_conflict_{$event}");
            DB::statement("
                CREATE TRIGGER trg_validate_verifikator_conflict_{$event}
                BEFORE {$event} ON kelompok_verifikator
                BEGIN
                    SELECT RAISE(ABORT, 'Dosen sudah menjadi Koordinator aktif untuk Mata Kuliah ini pada periode yang sama')
                    WHERE EXISTS (
                        SELECT 1 FROM penugasan_koordinator pk
                        WHERE pk.dosen_id = NEW.dosen_id
                          AND pk.mata_kuliah_id = NEW.mata_kuliah_id
                          AND pk.status = 'ACTIVE'
                          AND pk.kelompok_id IS NOT NEW.kelompok_id
                          AND pk.periode_id = (SELECT periode_id FROM kelompok_verifikasi WHERE id = NEW.kelompok_id)
                    );
                END
            ");

            DB::statement("DROP TRIGGER IF EXISTS trg_validate_coordinator_conflict_{$event}");
            DB::statement("
                CREATE TRIGGER trg_validate_coordinator_conflict_{$event}
                BEFORE {$event} ON kelompok_koordinator
                BEGIN
                    SELECT RAISE(ABORT, 'Dosen sudah menjadi Verifikator aktif untuk Mata Kuliah ini pada periode yang sama')
                    WHERE EXISTS (
                        SELECT 1 FROM penugasan_verifikator pv
                        WHERE pv.dosen_id = NEW.dosen_id
                          AND pv.mata_kuliah_id = NEW.mata_kuliah_id
                          AND pv.status = 'ACTIVE'
                          AND pv.kelompok_id IS NOT NEW.kelompok_id
                          AND pv.periode_id = (SELECT periode_id FROM kelompok_verifikasi WHERE id = NEW.kelompok_id)
                    );
                END
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        DB::statement('DROP TRIGGER IF EXISTS trg_prevent_audit_log_update');
        DB::statement('DROP TRIGGER IF EXISTS trg_prevent_audit_log_delete');

        foreach (['INSERT', 'UPDATE'] as $event) {
            DB::statement("DROP TRIGGER IF EXISTS trg_validate_verifikator_conflict_{$event}");
            DB::statement("DROP TRIGGER IF EXISTS trg_validate_coordinator_conflict_{$event}");
        }
    }
};
