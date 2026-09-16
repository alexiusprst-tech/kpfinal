<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Replaces standard UNIQUE indexes on soft-deletable master tables with
     * partial unique indexes (WHERE deleted_at IS NULL) on PostgreSQL and SQLite,
     * so that soft-deleted rows do not block creating new active records with the same code.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if (in_array($driver, ['pgsql', 'sqlite'])) {
            // Dosen
            Schema::table('dosen', function (Blueprint $table) {
                $table->dropUnique('dosen_kode_dosen_unique');
            });
            DB::statement('CREATE UNIQUE INDEX uq_dosen_kode_dosen_active ON dosen (kode_dosen) WHERE deleted_at IS NULL');

            // Mata Kuliah
            Schema::table('mata_kuliah', function (Blueprint $table) {
                $table->dropUnique('mata_kuliah_kode_mk_unique');
            });
            DB::statement('CREATE UNIQUE INDEX uq_mata_kuliah_kode_mk_active ON mata_kuliah (kode_mk) WHERE deleted_at IS NULL');

            // PLO
            Schema::table('plo', function (Blueprint $table) {
                $table->dropUnique('plo_kode_plo_unique');
            });
            DB::statement('CREATE UNIQUE INDEX uq_plo_kode_plo_active ON plo (kode_plo) WHERE deleted_at IS NULL');

            // CLO
            Schema::table('clo', function (Blueprint $table) {
                $table->dropUnique('clo_kode_clo_unique');
            });
            DB::statement('CREATE UNIQUE INDEX uq_clo_kode_clo_active ON clo (kode_clo) WHERE deleted_at IS NULL');

            // Kategori Soal
            Schema::table('kategori_soal', function (Blueprint $table) {
                $table->dropUnique('kategori_soal_nama_unique');
            });
            DB::statement('CREATE UNIQUE INDEX uq_kategori_soal_nama_active ON kategori_soal (nama) WHERE deleted_at IS NULL');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if (in_array($driver, ['pgsql', 'sqlite'])) {
            DB::statement('DROP INDEX IF EXISTS uq_dosen_kode_dosen_active');
            Schema::table('dosen', function (Blueprint $table) {
                $table->unique('kode_dosen');
            });

            DB::statement('DROP INDEX IF EXISTS uq_mata_kuliah_kode_mk_active');
            Schema::table('mata_kuliah', function (Blueprint $table) {
                $table->unique('kode_mk');
            });

            DB::statement('DROP INDEX IF EXISTS uq_plo_kode_plo_active');
            Schema::table('plo', function (Blueprint $table) {
                $table->unique('kode_plo');
            });

            DB::statement('DROP INDEX IF EXISTS uq_clo_kode_clo_active');
            Schema::table('clo', function (Blueprint $table) {
                $table->unique('clo_kode_clo_unique');
            });

            DB::statement('DROP INDEX IF EXISTS uq_kategori_soal_nama_active');
            Schema::table('kategori_soal', function (Blueprint $table) {
                $table->unique('nama');
            });
        }
    }
};
