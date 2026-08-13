<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PeriodeVerifikasi;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TahunAjaranController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('SuperAdmin/TahunAjaran/Index', $this->buildIndexProps($request));
    }

    public function show(Request $request, TahunAjaran $tahun_ajaran)
    {
        return Inertia::render('SuperAdmin/TahunAjaran/Index', array_merge(
            $this->buildIndexProps($request),
            ['selectedTahunAjaran' => $this->buildDetail($tahun_ajaran)]
        ));
    }

    private function buildIndexProps(Request $request): array
    {
        $query = TahunAjaran::withCount('periodeVerifikasi');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where('nama', 'ilike', "%{$search}%");
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        match ($request->input('sort', 'terbaru')) {
            'terlama' => $query->orderBy('tahun_mulai', 'asc'),
            'nama'    => $query->orderBy('nama', 'asc'),
            default   => $query->orderBy('tahun_mulai', 'desc'),
        };

        $list = $query->paginate(10)->withQueryString();

        return [
            'list' => $list,
            'stats' => [
                'total'         => TahunAjaran::count(),
                'aktif'         => TahunAjaran::where('status', 'ACTIVE')->count(),
                'nonaktif'      => TahunAjaran::where('status', 'INACTIVE')->count(),
                'total_periode' => PeriodeVerifikasi::count(),
            ],
            'filters' => $request->only(['search', 'status', 'sort']),
        ];
    }

    private function buildDetail(TahunAjaran $tahunAjaran): array
    {
        $tahunAjaran->load(['periodeVerifikasi' => fn ($q) => $q->orderByDesc('tanggal_mulai')]);

        $createdLog = AuditLog::where('model_type', 'TahunAjaran')
            ->where('model_id', $tahunAjaran->id)
            ->where('action', 'CREATE_TAHUN_AJARAN')
            ->with('user')
            ->first();

        $history = AuditLog::where('model_type', 'TahunAjaran')
            ->where('model_id', $tahunAjaran->id)
            ->with('user')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'description' => $this->describeAction($log->action),
                'user'        => $log->user?->name ?? 'Sistem',
                'created_at'  => $log->created_at,
            ]);

        $periodeAktif = $tahunAjaran->periodeVerifikasi->firstWhere('status', 'ACTIVE');
        $statusCounts = $tahunAjaran->periodeVerifikasi->countBy('status');

        return [
            'tahunAjaran'            => $tahunAjaran,
            'dibuat_oleh'            => $createdLog?->user?->name,
            'periode_aktif_terakhir' => ($periodeAktif ?? $tahunAjaran->periodeVerifikasi->first())?->nama,
            'statistik' => [
                'total'    => $tahunAjaran->periodeVerifikasi->count(),
                'aktif'    => (int) ($statusCounts['ACTIVE'] ?? 0),
                'draft'    => (int) ($statusCounts['DRAFT'] ?? 0),
                'closed'   => (int) ($statusCounts['CLOSED'] ?? 0),
                'inactive' => (int) ($statusCounts['INACTIVE'] ?? 0),
            ],
            'riwayat' => $history,
        ];
    }

    private function describeAction(string $action): string
    {
        return match ($action) {
            'CREATE_TAHUN_AJARAN' => 'Tahun ajaran dibuat',
            'UPDATE_TAHUN_AJARAN' => 'Tahun ajaran diperbarui',
            'DELETE_TAHUN_AJARAN' => 'Tahun ajaran dihapus',
            default                => str_replace('_', ' ', $action),
        };
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'           => ['required', 'string', 'max:50', 'unique:tahun_ajaran,nama'],
            'tahun_mulai'    => ['required', 'integer', 'min:2000', 'max:2100'],
            'tahun_selesai'  => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $item = TahunAjaran::create(['id' => (string) Str::uuid()] + $validated + ['status' => 'ACTIVE']);
        AuditLog::record($request->user()->id, 'CREATE_TAHUN_AJARAN', 'TahunAjaran', $item->id, null, $item->toArray());
        return redirect()->back()->with('success', 'Tahun Ajaran berhasil ditambahkan.');
    }

    public function update(Request $request, TahunAjaran $tahunAjaran)
    {
        $validated = $request->validate([
            'nama'           => ['required', 'string', 'max:50', 'unique:tahun_ajaran,nama,' . $tahunAjaran->id],
            'tahun_mulai'    => ['required', 'integer'],
            'tahun_selesai'  => ['required', 'integer'],
            'status'         => ['required', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $tahunAjaran->toArray();
        $tahunAjaran->update($validated);
        AuditLog::record($request->user()->id, 'UPDATE_TAHUN_AJARAN', 'TahunAjaran', $tahunAjaran->id, $old, $tahunAjaran->toArray());
        return redirect()->back()->with('success', 'Tahun Ajaran berhasil diperbarui.');
    }

    public function destroy(Request $request, TahunAjaran $tahunAjaran)
    {
        $old = $tahunAjaran->toArray();
        $tahunAjaran->delete();
        AuditLog::record($request->user()->id, 'DELETE_TAHUN_AJARAN', 'TahunAjaran', $tahunAjaran->id, $old, null);
        return redirect()->back()->with('success', 'Tahun Ajaran berhasil dihapus.');
    }
}
