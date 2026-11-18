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
            'lokasi' => ['required', 'string', 'min:2', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'keluhan.required' => 'Keluhan wajib diisi.',
            'lokasi.required' => 'Titik lokasi / asrama penjemputan wajib diisi.',
        ];
    }
}
