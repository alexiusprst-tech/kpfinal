<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kelompok_verifikator', function (Blueprint $table) {
            $table->uuid('mata_kuliah_id')->nullable()->after('kelompok_id');
            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('cascade');
        });

        // Drop the old unique constraint if present
        try {
            Schema::table('kelompok_verifikator', function (Blueprint $table) {
                $table->dropUnique('kelompok_verifikator_kelompok_id_dosen_id_unique');
            });
        } catch (\Throwable $e) {
            // Ignore if constraint name differs or already dropped
        }

        // Add new unique constraint per (kelompok, mata_kuliah, dosen)
        try {
            Schema::table('kelompok_verifikator', function (Blueprint $table) {
                $table->unique(['kelompok_id', 'mata_kuliah_id', 'dosen_id'], 'kelompok_verifikator_mk_dosen_unique');
            });
        } catch (\Throwable $e) {
            // Ignore if already applied
        }
    }

    public function down(): void
    {
        Schema::table('kelompok_verifikator', function (Blueprint $table) {
            $table->dropForeign(['mata_kuliah_id']);
            $table->dropColumn('mata_kuliah_id');
        });
    }
};
