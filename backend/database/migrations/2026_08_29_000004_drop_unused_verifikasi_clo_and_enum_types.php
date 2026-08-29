<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * `verifikasi_clo` and 9 PostgreSQL ENUM types were created directly on
     * production out-of-band (see database_schema_fixed.sql) but are never
     * read or written by any Model/Controller — `VerifikasiController`
     * actually stores per-CLO feedback as JSON in `verifikasi.clo_feedback`.
     * Confirmed empty/orphaned via a live query against production before
     * writing this migration. Removing them so the schema doesn't keep
     * confusing future readers with a second, unused CLO-feedback model.
     *
     * If a normalized `verifikasi_clo` table turns out to be wanted after
     * all, don't resurrect this migration — write a fresh one that also
     * migrates `VerifikasiController` to populate it.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP TABLE IF EXISTS verifikasi_clo');

        foreach ($this->enumTypes() as $type) {
            DB::statement("DROP TYPE IF EXISTS {$type}");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("DO $$ BEGIN
            CREATE TYPE verifikasi_action AS ENUM ('APPROVED', 'REVISION', 'REJECTED');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;");

        DB::statement('
            CREATE TABLE IF NOT EXISTS verifikasi_clo (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                verifikasi_id UUID NOT NULL REFERENCES verifikasi(id) ON DELETE CASCADE,
                clo_id UUID NOT NULL REFERENCES clo(id) ON DELETE RESTRICT,
                action verifikasi_action NOT NULL,
                catatan TEXT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_verifikasi_clo UNIQUE (verifikasi_id, clo_id)
            )
        ');

        // The other 8 types were confirmed unused by any table even before
        // this migration ran, so down() intentionally does not recreate
        // them — nothing in the schema references them.
    }

    private function enumTypes(): array
    {
        return [
            'verifikasi_action',
            'user_role',
            'user_status',
            'periode_status',
            'penugasan_status',
            'soal_status',
            'import_type',
            'import_status',
            'kelompok_status',
        ];
    }
};
