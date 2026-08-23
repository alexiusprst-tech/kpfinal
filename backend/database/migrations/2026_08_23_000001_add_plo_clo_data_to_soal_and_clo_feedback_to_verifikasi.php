<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->json('plo_clo_data')->nullable()->after('status');
        });

        Schema::table('verifikasi', function (Blueprint $table) {
            $table->json('clo_feedback')->nullable()->after('catatan');
        });
    }

    public function down(): void
    {
        Schema::table('verifikasi', function (Blueprint $table) {
            $table->dropColumn('clo_feedback');
        });

        Schema::table('soal', function (Blueprint $table) {
            $table->dropColumn('plo_clo_data');
        });
    }
};
