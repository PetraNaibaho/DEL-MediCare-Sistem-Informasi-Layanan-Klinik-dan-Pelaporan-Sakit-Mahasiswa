<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CompleteExaminationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // akses dibatasi middleware role:klinik
    }

    public function rules(): array
    {
        return [
            'diagnosis' => ['required', 'string', 'max:255'],
            'catatan_medis' => ['nullable', 'string', 'max:5000'],
            'is_sick' => ['required', 'boolean'],
            'mulai_izin' => ['required_if:is_sick,true', 'nullable', 'date'],
            'selesai_izin' => ['required_if:is_sick,true', 'nullable', 'date', 'after_or_equal:mulai_izin'],
        ];
    }

    public function messages(): array
    {
        return [
            'diagnosis.required' => 'Diagnosis wajib diisi.',
            'is_sick.required' => 'Konfirmasi status sakit wajib dipilih.',
            'mulai_izin.required_if' => 'Tanggal mulai izin wajib diisi bila mahasiswa sakit.',
            'selesai_izin.required_if' => 'Tanggal selesai izin wajib diisi bila mahasiswa sakit.',
            'selesai_izin.after_or_equal' => 'Tanggal selesai izin tidak boleh sebelum tanggal mulai.',
        ];
    }

    /** @return array<int, \Closure(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if (! $this->boolean('is_sick') || $validator->errors()->isNotEmpty()) {
                    return;
                }

                $days = $this->date('mulai_izin')->diffInDays($this->date('selesai_izin')) + 1;
                $max = (int) config('medicare.max_sick_leave_days');

                if ($days > $max) {
                    $validator->errors()->add('selesai_izin', "Lama izin maksimal {$max} hari.");
                }
            },
        ];
    }
}
