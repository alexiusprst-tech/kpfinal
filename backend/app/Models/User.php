<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    public function isSuperAdmin(): bool
    {
        return $this->role === 'SUPER_ADMIN';
    }

    public function isKoordinator(): bool
    {
        return $this->role === 'KOORDINATOR';
    }

    public function isVerifikator(): bool
    {
        return $this->role === 'VERIFIKATOR';
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function dosen()
    {
        return $this->hasOne(Dosen::class);
    }

    public function soalUploaded()
    {
        return $this->hasMany(Soal::class, 'uploaded_by');
    }

    public function verifikasi()
    {
        return $this->hasMany(Verifikasi::class, 'verifikator_id');
    }

    public function importLogs()
    {
        return $this->hasMany(ImportLog::class, 'user_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    public function penugasanKoordinatorAssigned()
    {
        return $this->hasMany(PenugasanKoordinator::class, 'assigned_by');
    }

    public function penugasanVerifikatorAssigned()
    {
        return $this->hasMany(PenugasanVerifikator::class, 'assigned_by');
    }
}
