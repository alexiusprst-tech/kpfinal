<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Soal table indexes
        Schema::table('soal', function (Blueprint $table) {
            $table->index(['mata_kuliah_id', 'periode_id', 'status'], 'idx_soal_mk_periode_status');
            $table->index('uploaded_by', 'idx_soal_uploaded_by');
            $table->index('created_at', 'idx_soal_created_at');
        });

        // 2. Verifikasi table indexes
        Schema::table('verifikasi', function (Blueprint $table) {
            $table->index(['soal_id', 'action'], 'idx_verifikasi_soal_action');
            $table->index('verifikator_id', 'idx_verifikasi_verifikator');
            $table->index('created_at', 'idx_verifikasi_created_at');
        });

        // 3. Revisi Soal table indexes
        Schema::table('revisi_soal', function (Blueprint $table) {
            $table->index('soal_id', 'idx_revisi_soal_id');
        });

        // 4. Penugasan Koordinator & Verifikator indexes
        Schema::table('penugasan_koordinator', function (Blueprint $table) {
            $table->index(['dosen_id', 'periode_id', 'status'], 'idx_penugasan_koor_dosen_periode_status');
        });

        Schema::table('penugasan_verifikator', function (Blueprint $table) {
            $table->index(['dosen_id', 'periode_id', 'status'], 'idx_penugasan_verif_dosen_periode_status');
            $table->index(['mata_kuliah_id', 'periode_id', 'status'], 'idx_penugasan_verif_mk_periode_status');
        });

        // 5. Audit Logs indexes
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['model_type', 'model_id'], 'idx_audit_logs_model');
            $table->index('created_at', 'idx_audit_logs_created_at');
        });

        // 6. Notifications indexes
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->index(['user_id', 'is_read'], 'idx_notifications_user_unread');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndex('idx_notifications_user_unread');
            });
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_logs_model');
            $table->dropIndex('idx_audit_logs_created_at');
        });

        Schema::table('penugasan_verifikator', function (Blueprint $table) {
            $table->dropIndex('idx_penugasan_verif_dosen_periode_status');
            $table->dropIndex('idx_penugasan_verif_mk_periode_status');
        });

        Schema::table('penugasan_koordinator', function (Blueprint $table) {
            $table->dropIndex('idx_penugasan_koor_dosen_periode_status');
        });

        Schema::table('revisi_soal', function (Blueprint $table) {
            $table->dropIndex('idx_revisi_soal_id');
        });

        Schema::table('verifikasi', function (Blueprint $table) {
            $table->dropIndex('idx_verifikasi_soal_action');
            $table->dropIndex('idx_verifikasi_verifikator');
            $table->dropIndex('idx_verifikasi_created_at');
        });

        Schema::table('soal', function (Blueprint $table) {
            $table->dropIndex('idx_soal_mk_periode_status');
            $table->dropIndex('idx_soal_uploaded_by');
            $table->dropIndex('idx_soal_created_at');
        });
    }
};
