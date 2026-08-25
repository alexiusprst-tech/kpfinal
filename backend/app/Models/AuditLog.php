<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuids;
    protected $table = 'audit_logs';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Format a collection of audit logs into human-readable activity items.
     */
    public static function formatLogs($logs)
    {
        $collection = collect($logs);
        if ($collection->isEmpty()) {
            return collect();
        }

        $soalIds = [];
        $mkIds = [];
        $baIds = [];
        $dosenIds = [];
        $kelompokIds = [];
        $periodeIds = [];
        $tahunAjaranIds = [];
        $kategoriIds = [];
        $ploIds = [];
        $cloIds = [];

        foreach ($collection as $log) {
            $type = $log->model_type;
            $id = $log->model_id;
            $new = $log->new_values ?? [];

            if ($type === 'Soal' && $id) $soalIds[] = $id;
            if (!empty($new['soal_id'])) $soalIds[] = $new['soal_id'];

            if ($type === 'MataKuliah' && $id) $mkIds[] = $id;
            if (!empty($new['mata_kuliah_id'])) $mkIds[] = $new['mata_kuliah_id'];

            if ($type === 'BeritaAcara' && $id) $baIds[] = $id;
            if (!empty($new['berita_acara_id'])) $baIds[] = $new['berita_acara_id'];

            if ($type === 'Dosen' && $id) $dosenIds[] = $id;
            if (!empty($new['dosen_id'])) $dosenIds[] = $new['dosen_id'];

            if ($type === 'KelompokVerifikasi' && $id) $kelompokIds[] = $id;
            if ($type === 'PeriodeVerifikasi' && $id) $periodeIds[] = $id;
            if ($type === 'TahunAjaran' && $id) $tahunAjaranIds[] = $id;
            if ($type === 'KategoriSoal' && $id) $kategoriIds[] = $id;
            if ($type === 'Plo' && $id) $ploIds[] = $id;
            if ($type === 'Clo' && $id) $cloIds[] = $id;
        }

        $soals = !empty($soalIds) ? Soal::with('mataKuliah')->whereIn('id', array_unique($soalIds))->get()->keyBy('id') : collect();
        
        foreach ($soals as $s) {
            if ($s->mata_kuliah_id) $mkIds[] = $s->mata_kuliah_id;
        }

        $mataKuliahs = !empty($mkIds) ? MataKuliah::withTrashed()->whereIn('id', array_unique($mkIds))->get()->keyBy('id') : collect();
        $beritaAcaras = !empty($baIds) ? BeritaAcara::with('mataKuliah')->whereIn('id', array_unique($baIds))->get()->keyBy('id') : collect();
        $dosens = !empty($dosenIds) ? Dosen::whereIn('id', array_unique($dosenIds))->get()->keyBy('id') : collect();
        $kelompoks = !empty($kelompokIds) ? KelompokVerifikasi::whereIn('id', array_unique($kelompokIds))->get()->keyBy('id') : collect();
        $periodes = !empty($periodeIds) ? PeriodeVerifikasi::whereIn('id', array_unique($periodeIds))->get()->keyBy('id') : collect();
        $tahunAjarans = !empty($tahunAjaranIds) ? TahunAjaran::whereIn('id', array_unique($tahunAjaranIds))->get()->keyBy('id') : collect();
        $kategoris = !empty($kategoriIds) ? KategoriSoal::whereIn('id', array_unique($kategoriIds))->get()->keyBy('id') : collect();
        $plos = !empty($ploIds) ? Plo::whereIn('id', array_unique($ploIds))->get()->keyBy('id') : collect();
        $clos = !empty($cloIds) ? Clo::whereIn('id', array_unique($cloIds))->get()->keyBy('id') : collect();

        return $collection->map(function ($log) use (
            $soals, $mataKuliahs, $beritaAcaras, $dosens, $kelompoks,
            $periodes, $tahunAjarans, $kategoris, $plos, $clos
        ) {
            $new = $log->new_values ?? [];
            $old = $log->old_values ?? [];
            $action = $log->action;
            $type = $log->model_type;
            $id = $log->model_id;

            if (!empty($new['description'])) {
                $description = $new['description'];
            } else {
                $soal = ($type === 'Soal' && $id) ? ($soals[$id] ?? null) : ($soals[$new['soal_id'] ?? ''] ?? null);
                
                $mkId = $new['mata_kuliah_id'] ?? ($type === 'MataKuliah' ? $id : ($soal?->mata_kuliah_id ?? null));
                $mk = $mkId ? ($mataKuliahs[$mkId] ?? null) : null;
                $mkName = $mk?->nama_mk ?? $new['nama_mk'] ?? $new['mata_kuliah_nama'] ?? '';

                $ba = ($type === 'BeritaAcara' && $id) ? ($beritaAcaras[$id] ?? null) : null;
                if (!$mkName && $ba?->mataKuliah) {
                    $mkName = $ba->mataKuliah->nama_mk;
                }

                $dosen = ($type === 'Dosen' && $id) ? ($dosens[$id] ?? null) : ($dosens[$new['dosen_id'] ?? ''] ?? null);
                $dosenName = $dosen?->nama_lengkap ?? $new['nama_lengkap'] ?? $new['nama_dosen'] ?? $new['name'] ?? '';

                $kelompok = ($type === 'KelompokVerifikasi' && $id) ? ($kelompoks[$id] ?? null) : null;
                $kelompokName = $kelompok?->nama ?? $new['nama'] ?? $old['nama'] ?? '';

                $periode = ($type === 'PeriodeVerifikasi' && $id) ? ($periodes[$id] ?? null) : null;
                $periodeName = $periode?->nama ?? $new['nama'] ?? $old['nama'] ?? '';

                $ta = ($type === 'TahunAjaran' && $id) ? ($tahunAjarans[$id] ?? null) : null;
                $taName = $ta?->nama ?? $new['nama'] ?? $old['nama'] ?? '';

                $kat = ($type === 'KategoriSoal' && $id) ? ($kategoris[$id] ?? null) : null;
                $katName = $kat?->nama ?? $new['nama'] ?? $old['nama'] ?? '';

                $plo = ($type === 'Plo' && $id) ? ($plos[$id] ?? null) : null;
                $ploKode = $plo?->kode_plo ?? $new['kode_plo'] ?? $old['kode_plo'] ?? '';

                $clo = ($type === 'Clo' && $id) ? ($clos[$id] ?? null) : null;
                $cloKode = $clo?->kode_clo ?? $new['kode_clo'] ?? $old['kode_clo'] ?? '';

                $description = match ($action) {
                    'BERITA_ACARA_SOAL_DOWNLOADED' => $mkName ? "Berita acara soal mata kuliah {$mkName} telah diunduh" : "Berita acara soal telah diunduh",
                    'BERITA_ACARA_CREATED'         => $mkName ? "Berita acara verifikasi mata kuliah {$mkName} telah dibuat" : "Berita acara verifikasi telah dibuat",
                    'BERITA_ACARA_ALL_DOWNLOADED'  => $mkName ? "Semua berita acara mata kuliah {$mkName} telah diunduh" : "Semua berita acara telah diunduh",
                    'VERIFIKASI_APPROVED'          => $mkName ? "Soal mata kuliah {$mkName} sudah disetujui" : "Soal verifikasi telah disetujui",
                    'VERIFIKASI_REVISION'          => $mkName ? "Soal mata kuliah {$mkName} diminta revisi" : "Soal verifikasi diminta revisi",
                    'VERIFIKASI_REJECTED'          => $mkName ? "Soal mata kuliah {$mkName} ditolak" : "Soal verifikasi ditolak",
                    'UPLOAD_SOAL'                  => $mkName ? "Mengunggah soal baru mata kuliah {$mkName}" : "Mengunggah berkas soal baru",
                    'SUBMIT_SOAL'                  => $mkName ? "Soal mata kuliah {$mkName} diajukan untuk verifikasi" : "Mengajukan soal untuk verifikasi",
                    'UPLOAD_REVISI'                => $mkName ? "Mengunggah revisi soal mata kuliah {$mkName}" : "Mengunggah revisi berkas soal",
                    'UPDATE_SOAL'                  => $mkName ? "Memperbarui soal mata kuliah {$mkName}" : "Memperbarui data soal",
                    'DELETE_SOAL'                  => $mkName ? "Menghapus berkas soal mata kuliah {$mkName}" : "Menghapus berkas soal",
                    'CREATE_KELOMPOK', 'CREATE_KELOMPOK_VERIFIKASI' => $kelompokName ? "Membuat kelompok verifikasi {$kelompokName}" : "Membuat kelompok verifikasi",
                    'UPDATE_KELOMPOK', 'UPDATE_KELOMPOK_VERIFIKASI' => $kelompokName ? "Memperbarui kelompok verifikasi {$kelompokName}" : "Memperbarui kelompok verifikasi",
                    'DELETE_KELOMPOK', 'DELETE_KELOMPOK_VERIFIKASI' => $kelompokName ? "Menghapus kelompok verifikasi {$kelompokName}" : "Menghapus kelompok verifikasi",
                    'ASSIGN_KOORDINATOR'           => ($dosenName && $mkName) ? "Menugaskan {$dosenName} sebagai Koordinator {$mkName}" : ($mkName ? "Menugaskan koordinator {$mkName}" : "Menugaskan koordinator mata kuliah"),
                    'ASSIGN_VERIFIKATOR'           => ($dosenName && $mkName) ? "Menugaskan {$dosenName} sebagai Verifikator {$mkName}" : ($mkName ? "Menugaskan verifikator {$mkName}" : "Menugaskan verifikator mata kuliah"),
                    'CREATE_DOSEN'                 => $dosenName ? "Menambahkan data dosen {$dosenName}" : "Menambahkan data dosen",
                    'UPDATE_DOSEN'                 => $dosenName ? "Memperbarui data dosen {$dosenName}" : "Memperbarui data dosen",
                    'DELETE_DOSEN'                 => $dosenName ? "Menghapus data dosen {$dosenName}" : "Menghapus data dosen",
                    'CREATE_MATAKULIAH', 'CREATE_MATA_KULIAH' => $mkName ? "Menambahkan mata kuliah {$mkName}" : "Menambahkan mata kuliah",
                    'UPDATE_MATAKULIAH', 'UPDATE_MATA_KULIAH' => $mkName ? "Memperbarui mata kuliah {$mkName}" : "Memperbarui mata kuliah",
                    'DELETE_MATAKULIAH', 'DELETE_MATA_KULIAH' => $mkName ? "Menghapus mata kuliah {$mkName}" : "Menghapus mata kuliah",
                    'CREATE_PERIODE'               => $periodeName ? "Membuat periode verifikasi {$periodeName}" : "Membuat periode verifikasi",
                    'UPDATE_PERIODE'               => $periodeName ? "Memperbarui periode verifikasi {$periodeName}" : "Memperbarui periode verifikasi",
                    'ACTIVATE_PERIODE'             => $periodeName ? "Mengaktifkan periode verifikasi {$periodeName}" : "Mengaktifkan periode verifikasi",
                    'CLOSE_PERIODE'                => $periodeName ? "Menutup periode verifikasi {$periodeName}" : "Menutup periode verifikasi",
                    'DELETE_PERIODE'               => $periodeName ? "Menghapus periode verifikasi {$periodeName}" : "Menghapus periode verifikasi",
                    'CREATE_TAHUN_AJARAN'          => $taName ? "Menambahkan tahun ajaran {$taName}" : "Menambahkan tahun ajaran",
                    'UPDATE_TAHUN_AJARAN'          => $taName ? "Memperbarui tahun ajaran {$taName}" : "Memperbarui tahun ajaran",
                    'DELETE_TAHUN_AJARAN'          => $taName ? "Menghapus tahun ajaran {$taName}" : "Menghapus tahun ajaran",
                    'CREATE_KATEGORI'              => $katName ? "Menambahkan kategori soal {$katName}" : "Menambahkan kategori soal",
                    'UPDATE_KATEGORI'              => $katName ? "Memperbarui kategori soal {$katName}" : "Memperbarui kategori soal",
                    'DELETE_KATEGORI'              => $katName ? "Menghapus kategori soal {$katName}" : "Menghapus kategori soal",
                    'CREATE_PLO'                   => $ploKode ? "Menambahkan PLO {$ploKode}" : "Menambahkan data PLO",
                    'UPDATE_PLO'                   => $ploKode ? "Memperbarui PLO {$ploKode}" : "Memperbarui data PLO",
                    'DELETE_PLO'                   => $ploKode ? "Menghapus PLO {$ploKode}" : "Menghapus data PLO",
                    'CREATE_CLO'                   => $cloKode ? "Menambahkan CLO {$cloKode}" : "Menambahkan data CLO",
                    'UPDATE_CLO'                   => $cloKode ? "Memperbarui CLO {$cloKode}" : "Memperbarui data CLO",
                    'DELETE_CLO'                   => $cloKode ? "Menghapus CLO {$cloKode}" : "Menghapus data CLO",
                    'CHANGE_PASSWORD'              => "Mengubah kata sandi akun",
                    default                        => ucfirst(strtolower(str_replace('_', ' ', $action))),
                };
            }

            $userName = $log->user?->dosen?->nama_lengkap ?? $log->user?->name ?? 'Sistem';

            return [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $description,
                'user'        => [
                    'id'   => $log->user?->id,
                    'name' => $userName,
                    'dosen' => $log->user?->dosen ? [
                        'id'           => $log->user->dosen->id,
                        'nama_lengkap' => $log->user->dosen->nama_lengkap,
                    ] : null,
                ],
                'created_at'  => $log->created_at,
            ];
        });
    }

    /**
     * Record an audit event.
     */
    public static function record(
        ?string $userId,
        string $action,
        ?string $modelType = null,
        ?string $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): void {
        static::create([
            'id'         => (string) \Illuminate\Support\Str::uuid(),
            'user_id'    => $userId,
            'action'     => $action,
            'model_type' => $modelType,
            'model_id'   => $modelId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }
}
