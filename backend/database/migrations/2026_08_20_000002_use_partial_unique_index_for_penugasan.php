<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop any existing full-table unique constraints on penugasan_koordinator
        DB::statement("ALTER TABLE penugasan_koordinator DROP CONSTRAINT IF EXISTS penugasan_koor_dosen_mk_periode_status_unique;");
        DB::statement("ALTER TABLE penugasan_koordinator DROP CONSTRAINT IF EXISTS penugasan_koordinator_mata_kuliah_id_periode_id_status_unique;");
        DB::statement("ALTER TABLE penugasan_koordinator DROP CONSTRAINT IF EXISTS penugasan_koordinator_dosen_id_mata_kuliah_id_periode_id_status_unique;");
        DB::statement("DROP INDEX IF EXISTS penugasan_koor_dosen_mk_periode_active_unique;");

        // 2. Drop any existing index on penugasan_verifikator for active assignments
        DB::statement("DROP INDEX IF EXISTS penugasan_verif_dosen_mk_periode_active_unique;");

        // 3. Create PARTIAL UNIQUE INDEX (only enforces uniqueness when status = 'ACTIVE')
        // This allows multiple historical 'ENDED' rows while ensuring only ONE 'ACTIVE' assignment per dosen, MK, and periode.
        DB::statement("
            CREATE UNIQUE INDEX penugasan_koor_dosen_mk_periode_active_unique 
            ON penugasan_koordinator (dosen_id, mata_kuliah_id, periode_id) 
            WHERE (status = 'ACTIVE');
        ");

        DB::statement("
            CREATE UNIQUE INDEX penugasan_verif_dosen_mk_periode_active_unique 
            ON penugasan_verifikator (dosen_id, mata_kuliah_id, periode_id) 
            WHERE (status = 'ACTIVE');
        ");
    }

    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS penugasan_verif_dosen_mk_periode_active_unique;");
        DB::statement("DROP INDEX IF EXISTS penugasan_koor_dosen_mk_periode_active_unique;");

        Schema::table('penugasan_koordinator', function (Blueprint $table) {
            $table->unique(['dosen_id', 'mata_kuliah_id', 'periode_id', 'status'], 'penugasan_koor_dosen_mk_periode_status_unique');
        });
    }
};
