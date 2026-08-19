<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clo', function (Blueprint $table) {
            $table->string('bloom', 50)->nullable()->after('deskripsi');
        });
    }

    public function down(): void
    {
        Schema::table('clo', function (Blueprint $table) {
            $table->dropColumn('bloom');
        });
    }
};
