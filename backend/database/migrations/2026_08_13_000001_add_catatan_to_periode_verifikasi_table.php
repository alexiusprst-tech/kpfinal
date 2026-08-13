<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('periode_verifikasi') && !Schema::hasColumn('periode_verifikasi', 'catatan')) {
            Schema::table('periode_verifikasi', function (Blueprint $table) {
                $table->text('catatan')->nullable()->after('deadline_upload');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('periode_verifikasi') && Schema::hasColumn('periode_verifikasi', 'catatan')) {
            Schema::table('periode_verifikasi', function (Blueprint $table) {
                $table->dropColumn('catatan');
            });
        }
    }
};
