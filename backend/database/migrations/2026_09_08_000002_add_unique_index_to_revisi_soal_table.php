<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS revisi_soal_soal_id_version_unique ON revisi_soal (soal_id, version)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS revisi_soal_soal_id_version_unique');
    }
};
