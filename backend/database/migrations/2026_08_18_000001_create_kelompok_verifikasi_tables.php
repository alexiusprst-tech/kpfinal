<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. ===================== KELOMPOK VERIFIKASI =====================
        Schema::create('kelompok_verifikasi', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama', 255);
            $table->uuid('periode_id');
            $table->string('status', 20)->default('DRAFT'); // DRAFT, ACTIVE, INACTIVE, CLOSED
            $table->text('keterangan')->nullable();
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('periode_id')->references('id')->on('periode_verifikasi')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
        });

        // 2. ===================== KELOMPOK MATA KULIAH =====================
        Schema::create('kelompok_mata_kuliah', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kelompok_id');
            $table->uuid('mata_kuliah_id');
            $table->uuid('koordinator_id'); // dosen_id
            $table->timestamps();

            $table->unique(['kelompok_id', 'mata_kuliah_id']);
            $table->foreign('kelompok_id')->references('id')->on('kelompok_verifikasi')->onDelete('cascade');
            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('restrict');
            $table->foreign('koordinator_id')->references('id')->on('dosen')->onDelete('restrict');
        });

        // 3. ===================== KELOMPOK VERIFIKATOR =====================
        Schema::create('kelompok_verifikator', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kelompok_id');
            $table->uuid('dosen_id');
            $table->timestamps();

            $table->unique(['kelompok_id', 'dosen_id']);
            $table->foreign('kelompok_id')->references('id')->on('kelompok_verifikasi')->onDelete('cascade');
            $table->foreign('dosen_id')->references('id')->on('dosen')->onDelete('restrict');
        });

        // 4. ===================== ADD KELOMPOK_ID TO PENUGASAN TABLES =====================
        Schema::table('penugasan_koordinator', function (Blueprint $table) {
            $table->uuid('kelompok_id')->nullable()->after('assigned_by');
            $table->foreign('kelompok_id')->references('id')->on('kelompok_verifikasi')->onDelete('set null');
        });

        Schema::table('penugasan_verifikator', function (Blueprint $table) {
            $table->uuid('kelompok_id')->nullable()->after('assigned_by');
            $table->foreign('kelompok_id')->references('id')->on('kelompok_verifikasi')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('penugasan_verifikator', function (Blueprint $table) {
            $table->dropForeign(['kelompok_id']);
            $table->dropColumn('kelompok_id');
        });

        Schema::table('penugasan_koordinator', function (Blueprint $table) {
            $table->dropForeign(['kelompok_id']);
            $table->dropColumn('kelompok_id');
        });

        Schema::dropIfExists('kelompok_verifikator');
        Schema::dropIfExists('kelompok_mata_kuliah');
        Schema::dropIfExists('kelompok_verifikasi');
    }
};
