<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Captures, in version control, the unique-index fixes that were applied
     * directly to the production database out-of-band. Uses
     * `CREATE UNIQUE INDEX IF NOT EXISTS` so this is a no-op where the index
     * already exists (current production) and a real create everywhere else
     * (fresh install / CI / staging).
     *
     * The two partial indexes use plain SQL WHERE-clause syntax supported by
     * both PostgreSQL and SQLite, so — unlike the PL/pgSQL triggers in the
     * next migration — they are actually exercised by the SQLite-backed test
     * suite too.
     */
    public function up(): void
    {
        // At most one soal in a non-final status per (mata_kuliah_id, periode_id).
        // Prevents a double-submit race from creating two "active" soal for the
        // same course + period.
        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS uq_soal_active_per_mk_periode
            ON soal (mata_kuliah_id, periode_id)
            WHERE status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVISION', 'RESUBMITTED')
              AND deleted_at IS NULL
        ");

        // At most one periode_verifikasi may be ACTIVE at a time.
        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS uq_periode_only_one_active
            ON periode_verifikasi (status)
            WHERE status = 'ACTIVE'
        ");

        // Berita Acara document number is the official record identifier —
        // must be present and unique. This fails loudly if pre-existing data
        // already violates it, which is correct: that needs a human fix, not
        // a silent migration workaround.
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->string('nomor', 100)->nullable(false)->change();
        });

        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uq_berita_acara_nomor ON berita_acara (nomor)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS uq_soal_active_per_mk_periode');
        DB::statement('DROP INDEX IF EXISTS uq_periode_only_one_active');
        DB::statement('DROP INDEX IF EXISTS uq_berita_acara_nomor');

        Schema::table('berita_acara', function (Blueprint $table) {
            $table->string('nomor', 100)->nullable()->change();
        });
    }
};
