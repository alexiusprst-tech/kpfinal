<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\KategoriSoal;
use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class KategoriSoalController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('SuperAdmin/KategoriSoal/Index', $this->buildIndexProps($request));
    }

    public function show(Request $request, KategoriSoal $kategori_soal)
    {
        return Inertia::render('SuperAdmin/KategoriSoal/Index', array_merge(
            $this->buildIndexProps($request),
            ['selectedKategori' => $this->buildDetail($kategori_soal)]
        ));
    }

    private function buildIndexProps(Request $request): array
    {
        $query = KategoriSoal::withCount('soal');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where('nama', 'ilike', "%{$search}%");
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        match ($request->input('sort', 'terbaru')) {
            'terlama' => $query->orderBy('created_at', 'asc'),
            'nama'    => $query->orderBy('nama', 'asc'),
            'jumlah'  => $query->orderByDesc('soal_count'),
            default   => $query->orderBy('created_at', 'desc'),
        };

        $list = $query->paginate(10)->withQueryString();

        return [
            'list' => $list,
            'stats' => [
                'total'     => KategoriSoal::count(),
                'aktif'     => KategoriSoal::where('status', 'ACTIVE')->count(),
                'nonaktif'  => KategoriSoal::where('status', 'INACTIVE')->count(),
                'digunakan' => KategoriSoal::has('soal')->count(),
            ],
            'filters' => $request->only(['search', 'status', 'sort']),
        ];
    }

    private function buildDetail(KategoriSoal $kategori): array
    {
        $createdLog = AuditLog::where('model_type', 'KategoriSoal')
            ->where('model_id', $kategori->id)
            ->where('action', 'CREATE_KATEGORI')
            ->with('user')
            ->first();

        $history = AuditLog::where('model_type', 'KategoriSoal')
            ->where('model_id', $kategori->id)
            ->with('user')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'description' => $this->describeAction($log->action),
                'user'        => $log->user?->name ?? 'Sistem',
                'created_at'  => $log->created_at,
            ]);

        $soalByStatus = Soal::where('kategori_id', $kategori->id)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $total = (int) $soalByStatus->sum();

        return [
            'kategori'    => $kategori,
            'dibuat_oleh' => $createdLog?->user?->name,
            'usage' => [
                'total'         => $total,
                'approved'      => (int) ($soalByStatus['APPROVED'] ?? 0),
                'dalam_review'  => (int) ($soalByStatus['SUBMITTED'] ?? 0) + (int) ($soalByStatus['IN_REVIEW'] ?? 0) + (int) ($soalByStatus['RESUBMITTED'] ?? 0),
                'revisi'        => (int) ($soalByStatus['REVISION'] ?? 0),
                'ditolak'       => (int) ($soalByStatus['REJECTED'] ?? 0),
                'draft'         => (int) ($soalByStatus['DRAFT'] ?? 0),
            ],
            'riwayat' => $history,
        ];
    }

    private function describeAction(string $action): string
    {
        return match ($action) {
            'CREATE_KATEGORI' => 'Kategori soal dibuat',
            'UPDATE_KATEGORI' => 'Kategori soal diperbarui',
            'DELETE_KATEGORI' => 'Kategori soal dihapus',
            default            => str_replace('_', ' ', $action),
        };
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'      => ['required', 'string', 'max:100', 'unique:kategori_soal,nama'],
            'deskripsi' => ['nullable', 'string'],
        ]);

        $item = KategoriSoal::create(['id' => (string) Str::uuid()] + $validated + ['status' => 'ACTIVE']);
        AuditLog::record($request->user()->id, 'CREATE_KATEGORI', 'KategoriSoal', $item->id, null, $item->toArray());
        return redirect()->back()->with('success', 'Kategori Soal berhasil ditambahkan.');
    }

    public function update(Request $request, KategoriSoal $kategoriSoal)
    {
        $validated = $request->validate([
            'nama'      => ['required', 'string', 'max:100', 'unique:kategori_soal,nama,' . $kategoriSoal->id],
            'deskripsi' => ['nullable', 'string'],
            'status'    => ['required', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $kategoriSoal->toArray();
        $kategoriSoal->update($validated);
        AuditLog::record($request->user()->id, 'UPDATE_KATEGORI', 'KategoriSoal', $kategoriSoal->id, $old, $kategoriSoal->toArray());
        return redirect()->back()->with('success', 'Kategori Soal berhasil diperbarui.');
    }

    public function destroy(Request $request, KategoriSoal $kategoriSoal)
    {
        $old = $kategoriSoal->toArray();
        $kategoriSoal->delete();
        AuditLog::record($request->user()->id, 'DELETE_KATEGORI', 'KategoriSoal', $kategoriSoal->id, $old, null);
        return redirect()->back()->with('success', 'Kategori Soal berhasil dihapus.');
    }
}
