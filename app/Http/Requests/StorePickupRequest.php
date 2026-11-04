<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePickupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // akses dibatasi middleware role:mahasiswa
    }

    public function rules(): array
    {
        return [
            'keluhan' => ['required', 'string', 'min:3', 'max:1000'],
            'lokasi' => ['required', 'string', Rule::in(config('medicare.lokasi_penjemputan'))],
        ];
    }

    public function messages(): array
    {
        return [
            'keluhan.required' => 'Keluhan wajib diisi.',
            'lokasi.required' => 'Lokasi penjemputan wajib dipilih.',
            'lokasi.in' => 'Lokasi penjemputan tidak valid.',
        ];
    }
}
