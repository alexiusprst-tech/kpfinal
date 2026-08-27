<?php

namespace App\Exports;

use App\Models\Clo;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CloExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    public function collection()
    {
        $clos = Clo::with(['plo', 'mataKuliah'])->orderBy('kode_clo', 'asc')->get();
        $rows = collect();

        foreach ($clos as $c) {
            $ploCode = $c->plo->pluck('kode_plo')->first() ?: ($c->plo->pluck('kode_plo')->join(', ') ?: '—');
            if ($c->mataKuliah->isEmpty()) {
                $rows->push([
                    'plo'       => $ploCode,
                    'kode_clo'  => $c->kode_clo,
                    'clo'       => $c->deskripsi,
                    'bloom'     => $c->bloom ?: '—',
                    'mk'        => '—',
                ]);
            } else {
                foreach ($c->mataKuliah as $mk) {
                    $rows->push([
                        'plo'       => $ploCode,
                        'kode_clo'  => $c->kode_clo,
                        'clo'       => $c->deskripsi,
                        'bloom'     => $c->bloom ?: '—',
                        'mk'        => $mk->nama_mk,
                    ]);
                }
            }
        }

        return $rows;
    }

    public function headings(): array
    {
        return ['PLO', 'Kode CLO', 'CLO', 'Bloom', 'MK'];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '801720']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ],
        ];
    }
}
