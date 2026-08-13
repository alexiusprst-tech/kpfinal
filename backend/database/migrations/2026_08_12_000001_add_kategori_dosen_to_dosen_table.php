<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('dosen') && !Schema::hasColumn('dosen', 'kategori_dosen')) {
            Schema::table('dosen', function (Blueprint $table) {
                $table->string('kategori_dosen', 50)->nullable()->default('Dosen Tetap')->after('email');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('dosen') && Schema::hasColumn('dosen', 'kategori_dosen')) {
            Schema::table('dosen', function (Blueprint $table) {
                $table->dropColumn('kategori_dosen');
            });
        }
    }
};
