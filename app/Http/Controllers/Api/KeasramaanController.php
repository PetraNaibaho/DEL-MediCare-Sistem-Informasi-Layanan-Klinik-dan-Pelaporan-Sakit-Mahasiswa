<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\SickLetterResource;
use App\Models\SickLetter;
use App\Services\LetterPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class KeasramaanController extends Controller
{
    /** GET /api/keasramaan/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $active = SickLetter::with(['student', 'doctor'])
            ->whereDate('selesai_izin', '>=', today())
            ->latest('issued_at')
            ->get();

        return response()->json(['data' => [
            'stats' => [
                'mahasiswa_sakit' => $active->count(),
                'notifikasi_baru' => $user->medicareNotifications()->whereNull('read_at')->count(),
                'surat_masuk_hari_ini' => SickLetter::whereDate('issued_at', today())->count(),
            ],
            'notifikasi_terbaru' => NotificationResource::collection(
                $user->medicareNotifications()->latest('id')->limit(3)->get(),
            ),
            'mahasiswa_dalam_izin' => SickLetterResource::collection($active->take(5)),
        ]]);
    }

    /** GET /api/keasramaan/sick-students?aktif=1 — "Daftar Mahasiswa Sakit" */
    public function sickStudents(Request $request)
    {
        $query = SickLetter::with(['student', 'doctor'])->latest('issued_at');

        if ($request->boolean('aktif')) {
            $query->whereDate('selesai_izin', '>=', today());
        }

        return SickLetterResource::collection($query->paginate(20));
    }

    /** GET /api/keasramaan/letters/{letter} */
    public function showLetter(SickLetter $letter): SickLetterResource
    {
        Gate::authorize('view', $letter);

        return new SickLetterResource($letter->load(['student', 'doctor']));
    }

    /** GET /api/keasramaan/verifications — "Verifikasi Informasi Izin" */
    public function verifications()
    {
        return SickLetterResource::collection(
            SickLetter::with(['student', 'doctor'])->latest('issued_at')->paginate(20),
        );
    }

    /** POST /api/keasramaan/letters/{letter}/verify */
    public function verify(Request $request, SickLetter $letter): SickLetterResource
    {
        Gate::authorize('view', $letter);

        if ($letter->verified_at === null) {
            $letter->update(['verified_at' => now(), 'verified_by' => $request->user()->id]);
        }

        return new SickLetterResource($letter->load(['student', 'doctor']));
    }

    /** GET /api/keasramaan/letters/{letter}/proof — "Unduh Bukti Izin" */
    public function proof(SickLetter $letter, LetterPdfService $pdf)
    {
        Gate::authorize('view', $letter);

        return $pdf->download($letter);
    }
}
