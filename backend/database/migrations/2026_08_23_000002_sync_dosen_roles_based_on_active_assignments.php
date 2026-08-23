<?php

use App\Models\Dosen;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\User;
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
        // Make users.role nullable if not already
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->nullable()->default(null)->change();
        });

        // Synchronize all existing users based on their real active assignments
        $users = User::all();
        foreach ($users as $user) {
            if ($user->role === 'SUPER_ADMIN') {
                continue;
            }

            $dosen = $user->dosen;
            if (!$dosen) {
                // If not super admin and not linked to dosen, check if assigned
                continue;
            }

            $hasActiveKoor = PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
            $hasActiveVerif = PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();

            if ($hasActiveKoor) {
                $user->update(['role' => 'KOORDINATOR']);
            } elseif ($hasActiveVerif) {
                $user->update(['role' => 'VERIFIKATOR']);
            } else {
                // Belum ada penugasan aktif -> role null
                $user->update(['role' => null]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op or restore
    }
};
