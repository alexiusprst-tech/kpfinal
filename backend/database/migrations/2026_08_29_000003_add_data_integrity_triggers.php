<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Captures, in version control, the PL/pgSQL trigger functions that were
     * applied directly to the production database out-of-band. These are
     * PostgreSQL-specific (PL/pgSQL is not available on SQLite), so — like
     * the earlier partial-unique-index migration for penugasan — this is
     * gated to the pgsql driver and is a no-op under the SQLite-backed test
     * suite. That is a known, pre-existing limitation of this approach (see
     * RE_AUDIT_2026-08-29.md): these protections are not exercised by
     * automated tests, only enforced live in Postgres.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // ── audit_logs is immutable from the application's perspective ─────
        DB::statement("
            CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'audit_logs bersifat immutable — UPDATE/DELETE tidak diizinkan';
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::statement('DROP TRIGGER IF EXISTS trg_prevent_audit_log_update ON audit_logs');
        DB::statement("
            CREATE TRIGGER trg_prevent_audit_log_update
            BEFORE UPDATE OR DELETE ON audit_logs
            FOR EACH ROW
            EXECUTE FUNCTION prevent_audit_log_mutation();
        ");

        // ── Prevent a dosen from being an ACTIVE koordinator and verifikator
        //    for the same mata kuliah, whether within the same kelompok or
        //    across different kelompok on the same periode. ─────────────────
        DB::statement("
            CREATE OR REPLACE FUNCTION validate_verifikator_role_conflict()
            RETURNS TRIGGER AS $$
            DECLARE
                v_periode_id UUID;
            BEGIN
                SELECT periode_id INTO v_periode_id
                FROM kelompok_verifikasi
                WHERE id = NEW.kelompok_id;

                IF EXISTS (
                    SELECT 1
                    FROM kelompok_koordinator kk
                    WHERE kk.kelompok_id = NEW.kelompok_id
                      AND kk.mata_kuliah_id = NEW.mata_kuliah_id
                      AND kk.dosen_id = NEW.dosen_id
                ) THEN
                    RAISE EXCEPTION
                        'Dosen tidak boleh menjadi Koordinator dan Verifikator pada Mata Kuliah yang sama';
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM penugasan_koordinator pk
                    WHERE pk.dosen_id = NEW.dosen_id
                      AND pk.mata_kuliah_id = NEW.mata_kuliah_id
                      AND pk.periode_id = v_periode_id
                      AND pk.status = 'ACTIVE'
                      AND pk.kelompok_id IS DISTINCT FROM NEW.kelompok_id
                ) THEN
                    RAISE EXCEPTION
                        'Dosen sudah menjadi Koordinator aktif untuk Mata Kuliah ini pada periode yang sama';
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::statement('DROP TRIGGER IF EXISTS trg_validate_verifikator_conflict ON kelompok_verifikator');
        DB::statement("
            CREATE TRIGGER trg_validate_verifikator_conflict
            BEFORE INSERT OR UPDATE ON kelompok_verifikator
            FOR EACH ROW
            EXECUTE FUNCTION validate_verifikator_role_conflict();
        ");

        DB::statement("
            CREATE OR REPLACE FUNCTION validate_kelompok_coordinator_conflict()
            RETURNS TRIGGER AS $$
            DECLARE
                v_periode_id UUID;
            BEGIN
                SELECT periode_id INTO v_periode_id
                FROM kelompok_verifikasi
                WHERE id = NEW.kelompok_id;

                IF EXISTS (
                    SELECT 1
                    FROM kelompok_verifikator kv
                    WHERE kv.kelompok_id = NEW.kelompok_id
                      AND kv.mata_kuliah_id = NEW.mata_kuliah_id
                      AND kv.dosen_id = NEW.dosen_id
                ) THEN
                    RAISE EXCEPTION
                        'Dosen tidak boleh menjadi Koordinator dan Verifikator pada Mata Kuliah yang sama';
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM penugasan_verifikator pv
                    WHERE pv.dosen_id = NEW.dosen_id
                      AND pv.mata_kuliah_id = NEW.mata_kuliah_id
                      AND pv.periode_id = v_periode_id
                      AND pv.status = 'ACTIVE'
                      AND pv.kelompok_id IS DISTINCT FROM NEW.kelompok_id
                ) THEN
                    RAISE EXCEPTION
                        'Dosen sudah menjadi Verifikator aktif untuk Mata Kuliah ini pada periode yang sama';
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::statement('DROP TRIGGER IF EXISTS trg_validate_coordinator_conflict ON kelompok_koordinator');
        DB::statement("
            CREATE TRIGGER trg_validate_coordinator_conflict
            BEFORE INSERT OR UPDATE ON kelompok_koordinator
            FOR EACH ROW
            EXECUTE FUNCTION validate_kelompok_coordinator_conflict();
        ");

        // ── Hard cap: max 3 active koordinator / 5 active verifikator per
        //    (mata_kuliah_id, periode_id), mirroring the app-level validation
        //    in KelompokVerifikasiController as a defense-in-depth layer. ───
        DB::statement("
            CREATE OR REPLACE FUNCTION validate_max_active_koordinator()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.status = 'ACTIVE' AND (
                    SELECT COUNT(*)
                    FROM penugasan_koordinator
                    WHERE mata_kuliah_id = NEW.mata_kuliah_id
                      AND periode_id = NEW.periode_id
                      AND status = 'ACTIVE'
                      AND id <> NEW.id
                ) >= 3 THEN
                    RAISE EXCEPTION 'Maksimal 3 koordinator aktif per Mata Kuliah per Periode';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::statement('DROP TRIGGER IF EXISTS trg_max_active_koordinator ON penugasan_koordinator');
        DB::statement("
            CREATE TRIGGER trg_max_active_koordinator
            BEFORE INSERT OR UPDATE ON penugasan_koordinator
            FOR EACH ROW
            EXECUTE FUNCTION validate_max_active_koordinator();
        ");

        DB::statement("
            CREATE OR REPLACE FUNCTION validate_max_active_verifikator()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.status = 'ACTIVE' AND (
                    SELECT COUNT(*)
                    FROM penugasan_verifikator
                    WHERE mata_kuliah_id = NEW.mata_kuliah_id
                      AND periode_id = NEW.periode_id
                      AND status = 'ACTIVE'
                      AND id <> NEW.id
                ) >= 5 THEN
                    RAISE EXCEPTION 'Maksimal 5 verifikator aktif per Mata Kuliah per Periode';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::statement('DROP TRIGGER IF EXISTS trg_max_active_verifikator ON penugasan_verifikator');
        DB::statement("
            CREATE TRIGGER trg_max_active_verifikator
            BEFORE INSERT OR UPDATE ON penugasan_verifikator
            FOR EACH ROW
            EXECUTE FUNCTION validate_max_active_verifikator();
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP TRIGGER IF EXISTS trg_max_active_verifikator ON penugasan_verifikator');
        DB::statement('DROP FUNCTION IF EXISTS validate_max_active_verifikator()');

        DB::statement('DROP TRIGGER IF EXISTS trg_max_active_koordinator ON penugasan_koordinator');
        DB::statement('DROP FUNCTION IF EXISTS validate_max_active_koordinator()');

        DB::statement('DROP TRIGGER IF EXISTS trg_validate_coordinator_conflict ON kelompok_koordinator');
        DB::statement('DROP FUNCTION IF EXISTS validate_kelompok_coordinator_conflict()');

        DB::statement('DROP TRIGGER IF EXISTS trg_validate_verifikator_conflict ON kelompok_verifikator');
        DB::statement('DROP FUNCTION IF EXISTS validate_verifikator_role_conflict()');

        DB::statement('DROP TRIGGER IF EXISTS trg_prevent_audit_log_update ON audit_logs');
        DB::statement('DROP FUNCTION IF EXISTS prevent_audit_log_mutation()');
    }
};
