<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop legacy single-coordinator unique constraint if exists in PostgreSQL
        DB::statement("ALTER TABLE penugasan_koordinator DROP CONSTRAINT IF EXISTS penugasan_koordinator_mata_kuliah_id_periode_id_status_unique;");

        // 2. Drop the 4-column constraint if it already exists to be idempotent
        DB::statement("ALTER TABLE penugasan_koordinator DROP CONSTRAINT IF EXISTS penugasan_koor_dosen_mk_periode_status_unique;");
        DB::statement("ALTER TABLE penugasan_koordinator DROP CONSTRAINT IF EXISTS penugasan_koordinator_dosen_id_mata_kuliah_id_periode_id_status_unique;");

        // 3. Add unique constraint per dosen, MK, periode, and status
        Schema::table('penugasan_koordinator', function (Blueprint $table) {
            $table->unique(['dosen_id', 'mata_kuliah_id', 'periode_id', 'status'], 'penugasan_koor_dosen_mk_periode_status_unique');
        });
    }

    public function down(): void
    {
        Schema::table('penugasan_koordinator', function (Blueprint $table) {
            $table->dropUnique('penugasan_koor_dosen_mk_periode_status_unique');
            $table->unique(['mata_kuliah_id', 'periode_id', 'status'], 'penugasan_koordinator_mata_kuliah_id_periode_id_status_unique');
        });
    }
};
