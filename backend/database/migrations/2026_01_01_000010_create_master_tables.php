<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ===================== DOSEN =====================
        Schema::create('dosen', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('kode_dosen', 50)->unique();
            $table->string('nama_lengkap', 150);
            $table->string('email', 150)->nullable();
            $table->string('kategori_dosen', 50)->nullable()->default('Dosen Tetap');
            $table->uuid('user_id')->nullable()->unique();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        // ===================== TAHUN AJARAN =====================
        Schema::create('tahun_ajaran', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('nama', 50)->unique();
            $table->smallInteger('tahun_mulai');
            $table->smallInteger('tahun_selesai');
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
        });

        // ===================== PERIODE VERIFIKASI =====================
        Schema::create('periode_verifikasi', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tahun_ajaran_id');
            $table->string('nama', 100);
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->timestamp('deadline_upload');
            $table->string('status', 20)->default('DRAFT');
            $table->timestamps();

            $table->foreign('tahun_ajaran_id')->references('id')->on('tahun_ajaran')->onDelete('restrict');
        });

        // ===================== MATA KULIAH =====================
        Schema::create('mata_kuliah', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('kode_mk', 50)->unique();
            $table->string('nama_mk', 200);
            $table->smallInteger('sks');
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
            $table->softDeletes();
        });

        // ===================== PLO =====================
        Schema::create('plo', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('kode_plo', 50)->unique();
            $table->text('deskripsi');
            $table->timestamps();
            $table->softDeletes();
        });

        // ===================== CLO =====================
        Schema::create('clo', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('kode_clo', 50)->unique();
            $table->text('deskripsi');
            $table->timestamps();
            $table->softDeletes();
        });

        // ===================== PIVOT: MATA KULIAH - PLO =====================
        Schema::create('mata_kuliah_plo', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('mata_kuliah_id');
            $table->uuid('plo_id');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['mata_kuliah_id', 'plo_id']);
            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('cascade');
            $table->foreign('plo_id')->references('id')->on('plo')->onDelete('cascade');
        });

        // ===================== PIVOT: MATA KULIAH - CLO =====================
        Schema::create('mata_kuliah_clo', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('mata_kuliah_id');
            $table->uuid('clo_id');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['mata_kuliah_id', 'clo_id']);
            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('cascade');
            $table->foreign('clo_id')->references('id')->on('clo')->onDelete('cascade');
        });

        // ===================== PIVOT: CLO - PLO =====================
        Schema::create('clo_plo', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('clo_id');
            $table->uuid('plo_id');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['clo_id', 'plo_id']);
            $table->foreign('clo_id')->references('id')->on('clo')->onDelete('cascade');
            $table->foreign('plo_id')->references('id')->on('plo')->onDelete('cascade');
        });

        // ===================== KATEGORI SOAL =====================
        Schema::create('kategori_soal', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('nama', 100)->unique();
            $table->text('deskripsi')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kategori_soal');
        Schema::dropIfExists('clo_plo');
        Schema::dropIfExists('mata_kuliah_clo');
        Schema::dropIfExists('mata_kuliah_plo');
        Schema::dropIfExists('clo');
        Schema::dropIfExists('plo');
        Schema::dropIfExists('mata_kuliah');
        Schema::dropIfExists('periode_verifikasi');
        Schema::dropIfExists('tahun_ajaran');
        Schema::dropIfExists('dosen');
    }
};
