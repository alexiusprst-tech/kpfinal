<?php

namespace App\Imports;

use App\Models\Clo;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class CloImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        return new Clo([
            'id'        => (string) Str::uuid(),
            'kode_clo'  => trim($row['kode_clo']),
            'deskripsi' => trim($row['deskripsi']),
        ]);
    }

    public function rules(): array
    {
        return [
            'kode_clo'  => ['required', 'string', 'unique:clo,kode_clo'],
            'deskripsi' => ['required', 'string'],
        ];
    }
}
