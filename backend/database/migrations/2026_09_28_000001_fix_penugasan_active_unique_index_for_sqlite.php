<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * 2026_08_20_000002_use_partial_unique_index_for_penugasan.php replaced the
     * old full-column UNIQUE(dosen_id, mata_kuliah_id, periode_id, status)
     * constraint on penugasan_koordinator with a portable-style partial unique
     * index scoped to status = 'ACTIVE' — but gated the whole thing behind
     * `if (DB::getDriverName() === 'pgsql')`. On SQLite (the default driver
     * per .env.example and the only engine the automated test suite runs
     * against), the old 4-column constraint from
     * 2026_01_01_000020_create_operational_tables.php and
     * 2026_08_20_000001_fix_penugasan_koordinator_unique_constraint.php was
     * never dropped. That constraint includes `status` as a column, so it
     * only ever allows ONE row total per (dosen, mk, periode) with the same
     * status value — which blocks preserving more than one ENDED historical
     * row per (dosen, mk, periode), defeating append-only assignment history
     * (RULES.md #8/#30) on every non-Postgres deployment and in every test.
     *
     * SQLite has supported partial indexes (CREATE INDEX ... WHERE ...) since
     * 3.8.0, so the exact same ACTIVE-only partial unique index PostgreSQL
     * uses can be applied here too — only the constraint-drop syntax differs
     * (SQLite has no ALTER TABLE ... DROP CONSTRAINT; named UNIQUE
     * constraints are plain indexes there and are removed with DROP INDEX).
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        foreach ([
            'penugasan_koordinator_dosen_id_mata_kuliah_id_periode_id_status_unique',
            'penugasan_koor_dosen_mk_periode_status_unique',
            'penugasan_koordinator_mata_kuliah_id_periode_id_status_unique',
        ] as $legacyIndex) {
            DB::statement("DROP INDEX IF EXISTS {$legacyIndex}");
        }

        DB::statement('DROP INDEX IF EXISTS penugasan_koor_dosen_mk_periode_active_unique');
        DB::statement("
            CREATE UNIQUE INDEX penugasan_koor_dosen_mk_periode_active_unique
            ON penugasan_koordinator (dosen_id, mata_kuliah_id, periode_id)
            WHERE (status = 'ACTIVE')
        ");

        DB::statement('DROP INDEX IF EXISTS penugasan_verif_dosen_mk_periode_active_unique');
        DB::statement("
            CREATE UNIQUE INDEX penugasan_verif_dosen_mk_periode_active_unique
            ON penugasan_verifikator (dosen_id, mata_kuliah_id, periode_id)
            WHERE (status = 'ACTIVE')
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS penugasan_koor_dosen_mk_periode_active_unique');
        DB::statement('DROP INDEX IF EXISTS penugasan_verif_dosen_mk_periode_active_unique');

        DB::statement("
            CREATE UNIQUE INDEX penugasan_koor_dosen_mk_periode_status_unique
            ON penugasan_koordinator (dosen_id, mata_kuliah_id, periode_id, status)
        ");
    }
};
