<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds soft-delete support to `soal`. The column already exists on the
     * production database (added manually outside of migrations), so this
     * is guarded to stay idempotent there while still creating it on any
     * fresh install / CI / staging database.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('soal', 'deleted_at')) {
            Schema::table('soal', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('soal', 'deleted_at')) {
            Schema::table('soal', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
