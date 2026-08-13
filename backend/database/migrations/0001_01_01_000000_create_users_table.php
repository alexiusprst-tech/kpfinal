<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Enable pgcrypto for UUID generation
        DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

        // Create ENUMs safely
        $enums = [
            "CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'KOORDINATOR', 'VERIFIKATOR')",
            "CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE')",
            "CREATE TYPE periode_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'CLOSED')",
            "CREATE TYPE penugasan_status AS ENUM ('ACTIVE', 'INACTIVE', 'ENDED')",
            "CREATE TYPE soal_status AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVISION', 'RESUBMITTED', 'APPROVED', 'REJECTED')",
            "CREATE TYPE import_type AS ENUM ('PLO', 'CLO', 'MATA_KULIAH')",
            "CREATE TYPE import_status AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED', 'PARTIAL')",
            "CREATE TYPE verifikasi_action AS ENUM ('APPROVED', 'REVISION', 'REJECTED')",
        ];

        foreach ($enums as $sql) {
            $typeName = explode(' ', $sql)[2];
            DB::statement("DO $$ BEGIN CREATE TYPE {$typeName} AS ENUM (" . Str::after($sql, 'AS ENUM (') . "; EXCEPTION WHEN duplicate_object THEN null; END $$;");
        }

        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name', 150);
            $table->string('email', 150)->unique();
            $table->string('password', 255);
            $table->string('role')->default('KOORDINATOR'); // handled as string, cast in model
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('remember_token', 100)->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');

        DB::statement('DROP TYPE IF EXISTS verifikasi_action');
        DB::statement('DROP TYPE IF EXISTS import_status');
        DB::statement('DROP TYPE IF EXISTS import_type');
        DB::statement('DROP TYPE IF EXISTS soal_status');
        DB::statement('DROP TYPE IF EXISTS penugasan_status');
        DB::statement('DROP TYPE IF EXISTS periode_status');
        DB::statement('DROP TYPE IF EXISTS user_status');
        DB::statement('DROP TYPE IF EXISTS user_role');
    }
};
