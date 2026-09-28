<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dosen', function (Blueprint $table) {
            $table->string('kode_dosen', 50)->nullable()->change();
        });

        $driver = DB::getDriverName();
        if (in_array($driver, ['pgsql', 'sqlite'])) {
            DB::statement('DROP INDEX IF EXISTS uq_dosen_kode_dosen_active');
            DB::statement('CREATE UNIQUE INDEX uq_dosen_kode_dosen_active ON dosen (kode_dosen) WHERE deleted_at IS NULL AND kode_dosen IS NOT NULL');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if (in_array($driver, ['pgsql', 'sqlite'])) {
            DB::statement('DROP INDEX IF EXISTS uq_dosen_kode_dosen_active');
            DB::statement('CREATE UNIQUE INDEX uq_dosen_kode_dosen_active ON dosen (kode_dosen) WHERE deleted_at IS NULL');
        }

        Schema::table('dosen', function (Blueprint $table) {
            $table->string('kode_dosen', 50)->nullable(false)->change();
        });
    }
};
