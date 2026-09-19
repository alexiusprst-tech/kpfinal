<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The verification flow only ever produces APPROVED or REVISION outcomes —
 * there is no "rejected" state. `berita_acara.jumlah_rejected` was always
 * hardcoded to 0 by every writer (see BeritaAcaraController) and never read
 * anywhere (not even in the PDF template), so it's dead data. Dropping it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->dropColumn('jumlah_rejected');
        });
    }

    public function down(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->integer('jumlah_rejected')->default(0)->after('jumlah_revision');
        });
    }
};
