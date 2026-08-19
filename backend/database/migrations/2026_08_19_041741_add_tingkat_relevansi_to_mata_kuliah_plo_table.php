<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mata_kuliah_plo', function (Blueprint $table) {
            $table->string('tingkat_relevansi')->nullable()->default('Relevan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mata_kuliah_plo', function (Blueprint $table) {
            $table->dropColumn('tingkat_relevansi');
        });
    }
};
