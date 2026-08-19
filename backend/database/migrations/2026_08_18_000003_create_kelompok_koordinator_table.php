<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Make koordinator_id nullable on kelompok_mata_kuliah for multi-coordinator compatibility
        Schema::table('kelompok_mata_kuliah', function (Blueprint $table) {
            $table->uuid('koordinator_id')->nullable()->change();
        });

        // 2. Create kelompok_koordinator table supporting up to 3 coordinators per MK
        Schema::create('kelompok_koordinator', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kelompok_id');
            $table->uuid('mata_kuliah_id');
            $table->uuid('dosen_id');
            $table->timestamps();

            $table->unique(['kelompok_id', 'mata_kuliah_id', 'dosen_id']);
            $table->foreign('kelompok_id')->references('id')->on('kelompok_verifikasi')->onDelete('cascade');
            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('restrict');
            $table->foreign('dosen_id')->references('id')->on('dosen')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelompok_koordinator');
    }
};
