<?php

namespace App\Services;

use App\Models\SickLetter;
use Illuminate\Http\Response;

/**
 * Membuat berkas e-Surat Sakit. Memakai barryvdh/laravel-dompdf bila terpasang
 * (`composer require barryvdh/laravel-dompdf`); jika belum, mengembalikan halaman HTML siap cetak.
 */
class LetterPdfService
{
    public function download(SickLetter $letter): Response|\Symfony\Component\HttpFoundation\Response
    {
        $letter->loadMissing(['student', 'doctor']);

        $data = ['letter' => $letter, 'clinic' => config('medicare.clinic')];

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            return \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.surat-sakit', $data)
                ->download($letter->nomor.'.pdf');
        }

        return response()->view('pdf.surat-sakit', $data);
    }
}
