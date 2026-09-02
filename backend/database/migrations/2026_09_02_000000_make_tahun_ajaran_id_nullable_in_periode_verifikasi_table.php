<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('periode_verifikasi')) {
            Schema::table('periode_verifikasi', function (Blueprint $table) {
                try {
                    $table->dropForeign(['tahun_ajaran_id']);
                } catch (\Exception $e) {
                    // Ignore if foreign key doesn't exist or already dropped
                }
                $table->uuid('tahun_ajaran_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('periode_verifikasi')) {
            Schema::table('periode_verifikasi', function (Blueprint $table) {
                $table->uuid('tahun_ajaran_id')->nullable(false)->change();
            });
        }
    }
};
