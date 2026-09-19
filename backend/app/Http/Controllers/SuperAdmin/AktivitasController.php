<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AktivitasController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with(['user.dosen'])
            ->orderBy('created_at', 'desc');

        // Search Filter: search user name, action, description, or model
        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(action) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(model_type) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(ip_address) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                         ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"])
                         ->orWhereHas('dosen', function ($dq) use ($search) {
                             $dq->whereRaw('LOWER(nama_lengkap) LIKE ?', ["%{$search}%"])
                                ->orWhereRaw('LOWER(kode_dosen) LIKE ?', ["%{$search}%"]);
                         });
                  });
            });
        }

        // Action Filter
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Model Type Filter
        if ($request->filled('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        // Date Filter
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // Stats calculation
        $totalLogs = AuditLog::count();
        $todayLogs = AuditLog::whereDate('created_at', today())->count();
        $totalUsersActive = AuditLog::distinct('user_id')->count('user_id');
        $totalDataChanges = AuditLog::where(function ($q) {
            $q->whereNotNull('old_values')->orWhereNotNull('new_values');
        })->count();

        // Distinct action lists for filter dropdown
        $actionOptions = AuditLog::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        // Distinct model_type lists for filter dropdown
        $modelOptions = AuditLog::select('model_type')
            ->whereNotNull('model_type')
            ->distinct()
            ->orderBy('model_type')
            ->pluck('model_type');

        // Paginate 20 per page
        $paginator = $query->paginate(20)->withQueryString();

        // Format logs using human-readable engine
        $formattedLogs = AuditLog::formatLogs($paginator->items());
        $paginator->setCollection($formattedLogs);

        return Inertia::render('SuperAdmin/Aktivitas/Index', [
            'logs' => $paginator,
            'stats' => [
                'total'        => $totalLogs,
                'today'        => $todayLogs,
                'active_users' => $totalUsersActive,
                'data_changes' => $totalDataChanges,
            ],
            'filters' => $request->only(['search', 'action', 'model_type', 'date']),
            'actionOptions' => $actionOptions,
            'modelOptions'  => $modelOptions,
        ]);
    }
}
