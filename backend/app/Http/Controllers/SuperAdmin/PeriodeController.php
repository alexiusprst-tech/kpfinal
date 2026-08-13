<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\PeriodeVerifikasi;
use App\Models\Soal;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PeriodeController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('SuperAdmin/Periode/Index', $this->buildIndexProps($request));
    }

    public function show(Request $request, PeriodeVerifikasi $periode)
    {
        return Inertia::render('SuperAdmin/Periode/Index', array_merge(
            $this->buildIndexProps($request),
            ['selectedPeriode' => $this->buildDetail($periode)]
        ));
    }

    private function buildIndexProps(Request $request): array
    {
        $query = PeriodeVerifikasi::with('tahunAjaran');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where('nama', 'ilike', "%{$search}%");
        }
        if ($tahunAjaranId = $request->input('tahun_ajaran_id')) {
            $query->where('tahun_ajaran_id', $tahunAjaranId);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        match ($request->input('sort', 'terbaru')) {
            'terlama' => $query->orderBy('created_at', 'asc'),
            'nama'    => $query->orderBy('nama', 'asc'),
            default   => $query->orderBy('created_at', 'desc'),
        };

        $list = $query->paginate(8)->withQueryString();

        $statCounts = PeriodeVerifikasi::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return [
            'list' => $list,
            'stats' => [
                'total'       => (int) $statCounts->sum(),
                'aktif'       => (int) ($statCounts['ACTIVE'] ?? 0),
                'akan_datang' => (int) ($statCounts['DRAFT'] ?? 0),
                'selesai'     => (int) ($statCounts['CLOSED'] ?? 0) + (int) ($statCounts['INACTIVE'] ?? 0),
            ],
            'tahunAjaranAll'    => TahunAjaran::orderBy('tahun_mulai', 'desc')->get(['id', 'nama']),
            'tahunAjaranActive' => TahunAjaran::where('status', 'ACTIVE')->orderBy('tahun_mulai', 'desc')->get(['id', 'nama']),
            'filters' => $request->only(['search', 'tahun_ajaran_id', 'status', 'sort']),
        ];
    }

    private function buildDetail(PeriodeVerifikasi $periode): array
    {
        $periode->load('tahunAjaran');

        $createdLog = AuditLog::where('model_type', 'PeriodeVerifikasi')
            ->where('model_id', $periode->id)
            ->where('action', 'CREATE_PERIODE')
            ->with('user')
            ->first();

        $history = AuditLog::where('model_type', 'PeriodeVerifikasi')
            ->where('model_id', $periode->id)
            ->with('user')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $this->describeAction($log->action),
                'user'        => $log->user?->name ?? 'Sistem',
                'created_at'  => $log->created_at,
            ]);

        $koordinatorCount = PenugasanKoordinator::where('periode_id', $periode->id)->where('status', 'ACTIVE')->count();
        $verifikatorCount = PenugasanVerifikator::where('periode_id', $periode->id)->where('status', 'ACTIVE')->count();
        $mkCount = PenugasanKoordinator::where('periode_id', $periode->id)->where('status', 'ACTIVE')->distinct('mata_kuliah_id')->count('mata_kuliah_id');

        $soalByStatus = Soal::where('periode_id', $periode->id)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $soalTotal = (int) $soalByStatus->sum();
        $soalApproved = (int) ($soalByStatus['APPROVED'] ?? 0);

        return [
            'periode' => $periode,
            'dibuat_oleh' => $createdLog?->user?->name,
            'timeline' => [
                'mulai_lewat'    => now()->gte($periode->tanggal_mulai),
                'deadline_lewat' => $periode->deadline_upload ? now()->gte($periode->deadline_upload) : false,
                'selesai_lewat'  => now()->gte($periode->tanggal_selesai),
            ],
            'penugasan' => [
                'koordinator'  => $koordinatorCount,
                'verifikator'  => $verifikatorCount,
                'mata_kuliah'  => $mkCount,
            ],
            'statistik' => [
                'total'    => $soalTotal,
                'draft'    => (int) ($soalByStatus['DRAFT'] ?? 0),
                'pending'  => (int) ($soalByStatus['SUBMITTED'] ?? 0) + (int) ($soalByStatus['IN_REVIEW'] ?? 0) + (int) ($soalByStatus['RESUBMITTED'] ?? 0),
                'revisi'   => (int) ($soalByStatus['REVISION'] ?? 0),
                'approved' => $soalApproved,
                'rejected' => (int) ($soalByStatus['REJECTED'] ?? 0),
                'progress' => $soalTotal > 0 ? (int) round(($soalApproved / $soalTotal) * 100) : 0,
            ],
            'riwayat' => $history,
        ];
    }

    private function describeAction(string $action): string
    {
        return match ($action) {
            'CREATE_PERIODE'   => 'Periode dibuat',
            'UPDATE_PERIODE'   => 'Periode diperbarui',
            'ACTIVATE_PERIODE' => 'Periode diaktifkan',
            'CLOSE_PERIODE'    => 'Periode ditutup',
            'DELETE_PERIODE'   => 'Periode dihapus',
            default            => str_replace('_', ' ', $action),
        };
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tahun_ajaran_id'  => ['required', 'exists:tahun_ajaran,id'],
            'nama'             => ['required', 'string', 'max:100'],
            'tanggal_mulai'    => ['required', 'date'],
            'tanggal_selesai'  => ['required', 'date', 'after:tanggal_mulai'],
            'deadline_upload'  => ['required', 'date'],
            'catatan'          => ['nullable', 'string', 'max:2000'],
        ]);

        $item = PeriodeVerifikasi::create(['id' => (string) Str::uuid()] + $validated + ['status' => 'DRAFT']);
        AuditLog::record($request->user()->id, 'CREATE_PERIODE', 'PeriodeVerifikasi', $item->id, null, $item->toArray());
        return redirect()->back()->with('success', 'Periode Verifikasi berhasil ditambahkan.');
    }

    public function update(Request $request, PeriodeVerifikasi $periode)
    {
        $validated = $request->validate([
            'nama'            => ['required', 'string', 'max:100'],
            'tanggal_mulai'   => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date'],
            'deadline_upload' => ['required', 'date'],
            'catatan'         => ['nullable', 'string', 'max:2000'],
        ]);

        $old = $periode->toArray();
        $periode->update($validated);
        AuditLog::record($request->user()->id, 'UPDATE_PERIODE', 'PeriodeVerifikasi', $periode->id, $old, $periode->toArray());
        return redirect()->back()->with('success', 'Periode Verifikasi berhasil diperbarui.');
    }

    public function activate(Request $request, PeriodeVerifikasi $periode)
    {
        // Deactivate any other active periode
        PeriodeVerifikasi::where('status', 'ACTIVE')->update(['status' => 'INACTIVE']);
        $periode->update(['status' => 'ACTIVE']);
        AuditLog::record($request->user()->id, 'ACTIVATE_PERIODE', 'PeriodeVerifikasi', $periode->id);
        return redirect()->back()->with('success', "Periode '{$periode->nama}' diaktifkan.");
    }

    public function close(Request $request, PeriodeVerifikasi $periode)
    {
        $periode->update(['status' => 'CLOSED']);
        AuditLog::record($request->user()->id, 'CLOSE_PERIODE', 'PeriodeVerifikasi', $periode->id);
        return redirect()->back()->with('success', "Periode '{$periode->nama}' ditutup.");
    }

    public function destroy(Request $request, PeriodeVerifikasi $periode)
    {
        if ($periode->status === 'ACTIVE') {
            return redirect()->back()->with('error', 'Periode aktif tidak bisa dihapus.');
        }
        $old = $periode->toArray();
        $periode->delete();
        AuditLog::record($request->user()->id, 'DELETE_PERIODE', 'PeriodeVerifikasi', $periode->id, $old, null);
        return redirect()->back()->with('success', 'Periode Verifikasi berhasil dihapus.');
    }
}
