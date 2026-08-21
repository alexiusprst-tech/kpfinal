<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ===================== PENUGASAN KOORDINATOR =====================
        Schema::create('penugasan_koordinator', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('dosen_id');
            $table->uuid('mata_kuliah_id');
            $table->uuid('periode_id');
            $table->uuid('assigned_by');
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();

            // Unique active coordinator assignment per dosen, MK, and Periode
            $table->unique(['dosen_id', 'mata_kuliah_id', 'periode_id', 'status']);

            $table->foreign('dosen_id')->references('id')->on('dosen')->onDelete('restrict');
            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('restrict');
            $table->foreign('periode_id')->references('id')->on('periode_verifikasi')->onDelete('restrict');
            $table->foreign('assigned_by')->references('id')->on('users')->onDelete('restrict');
        });

        // ===================== PENUGASAN VERIFIKATOR =====================
        Schema::create('penugasan_verifikator', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('dosen_id');
            $table->uuid('mata_kuliah_id');
            $table->uuid('periode_id');
            $table->uuid('assigned_by');
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();

            $table->foreign('dosen_id')->references('id')->on('dosen')->onDelete('restrict');
            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('restrict');
            $table->foreign('periode_id')->references('id')->on('periode_verifikasi')->onDelete('restrict');
            $table->foreign('assigned_by')->references('id')->on('users')->onDelete('restrict');
        });

        // ===================== SOAL =====================
        Schema::create('soal', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mata_kuliah_id');
            $table->uuid('periode_id');
            $table->uuid('kategori_id');
            $table->uuid('uploaded_by');
            $table->string('judul', 255);
            $table->string('nama_file', 255);
            $table->string('file_path', 500);
            $table->string('mime_type', 100);
            $table->bigInteger('file_size');
            $table->string('status', 30)->default('DRAFT');
            $table->timestamps();

            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('restrict');
            $table->foreign('periode_id')->references('id')->on('periode_verifikasi')->onDelete('restrict');
            $table->foreign('kategori_id')->references('id')->on('kategori_soal')->onDelete('restrict');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('restrict');
        });

        // ===================== REVISI SOAL =====================
        Schema::create('revisi_soal', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('soal_id');
            $table->unsignedSmallInteger('version');
            $table->string('nama_file', 255);
            $table->string('file_path', 500);
            $table->string('mime_type', 100);
            $table->bigInteger('file_size');
            $table->text('catatan')->nullable();
            $table->uuid('uploaded_by');
            $table->timestamp('uploaded_at')->useCurrent();

            $table->unique(['soal_id', 'version']);

            $table->foreign('soal_id')->references('id')->on('soal')->onDelete('restrict');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('restrict');
        });

        // ===================== VERIFIKASI =====================
        Schema::create('verifikasi', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('soal_id');
            $table->uuid('verifikator_id');
            $table->string('action', 20); // APPROVED, REVISION, REJECTED
            $table->text('catatan')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('soal_id')->references('id')->on('soal')->onDelete('restrict');
            $table->foreign('verifikator_id')->references('id')->on('users')->onDelete('restrict');
        });

        // ===================== BERITA ACARA =====================
        Schema::create('berita_acara', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nomor', 100)->nullable();
            $table->uuid('periode_id');
            $table->uuid('mata_kuliah_id');
            $table->uuid('koordinator_id');
            $table->uuid('dibuat_oleh');
            $table->integer('jumlah_soal')->default(0);
            $table->integer('jumlah_approved')->default(0);
            $table->integer('jumlah_revision')->default(0);
            $table->integer('jumlah_rejected')->default(0);
            $table->string('file_path', 500)->nullable();
            $table->date('tanggal');
            $table->timestamps();

            $table->foreign('periode_id')->references('id')->on('periode_verifikasi')->onDelete('restrict');
            $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliah')->onDelete('restrict');
            $table->foreign('koordinator_id')->references('id')->on('dosen')->onDelete('restrict');
            $table->foreign('dibuat_oleh')->references('id')->on('users')->onDelete('restrict');
        });

        // ===================== IMPORT LOGS =====================
        Schema::create('import_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('type', 20); // PLO, CLO, MATA_KULIAH
            $table->string('file_name', 255);
            $table->string('status', 20)->default('PROCESSING');
            $table->integer('total_rows')->default(0);
            $table->integer('success_rows')->default(0);
            $table->integer('failed_rows')->default(0);
            $table->jsonb('error_summary')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
        });

        // ===================== AUDIT LOGS =====================
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->string('action', 100);
            $table->string('model_type', 100)->nullable();
            $table->uuid('model_id')->nullable();
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('import_logs');
        Schema::dropIfExists('berita_acara');
        Schema::dropIfExists('verifikasi');
        Schema::dropIfExists('revisi_soal');
        Schema::dropIfExists('soal');
        Schema::dropIfExists('penugasan_verifikator');
        Schema::dropIfExists('penugasan_koordinator');
    }
};
