<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Re-creates uq_periode_only_one_active as a partial unique index.
     * When SQLite recreated the periode_verifikasi table in a previous migration,
     * the WHERE status = 'ACTIVE' clause was stripped, causing all statuses (like DRAFT)
     * to become globally unique.
     */
    public function up(): void
    {
        DB::statement('DROP INDEX IF EXISTS uq_periode_only_one_active');

        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS uq_periode_only_one_active
            ON periode_verifikasi (status)
            WHERE status = 'ACTIVE'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS uq_periode_only_one_active');
    }
};
