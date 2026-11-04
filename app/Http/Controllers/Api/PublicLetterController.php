<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SickLetter;
use Illuminate\Http\JsonResponse;

/**
 * Tautan "Bagikan" e-Surat Sakit (signed URL, berlaku 7 hari, tanpa login).
 * Sengaja TIDAK memuat diagnosis/keterangan medis — hanya keabsahan dan periode izin.
 */
class PublicLetterController extends Controller
{
    public function verify(string $nomor): JsonResponse
    {
        $letter = SickLetter::with(['student', 'doctor'])->where('nomor', $nomor)->firstOrFail();

        return response()->json(['data' => [
            'nomor' => $letter->nomor,
            'status' => 'Sah',
            'nama' => $letter->student->name,
            'nim' => $letter->student->identifier,
            'mulai_izin' => $letter->mulai_izin->translatedFormat('d M Y'),
            'selesai_izin' => $letter->selesai_izin->translatedFormat('d M Y'),
            'diterbitkan_oleh' => $letter->doctor->name,
            'tanggal_terbit' => $letter->issued_at->translatedFormat('d M Y'),
        ]]);
    }
}
