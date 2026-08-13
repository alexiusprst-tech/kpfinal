<?php

namespace App\Services\ActivityLog;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    public function log(?string $userId, string $action, string $modelType, string $description, array $data = []): void
    {
        $userId = $userId ?? Auth::id();

        AuditLog::record(
            $userId,
            $action,
            $modelType,
            $data['curriculum_id'] ?? null,
            null,
            array_merge(['description' => $description], $data)
        );
    }
}
