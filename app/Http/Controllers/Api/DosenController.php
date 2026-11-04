<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\SickLetterResource;
use App\Models\SickLetter;
use App\Services\SickLetterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DosenController extends Controller
{
    public function __construct(private readonly SickLetterService $letters) {}

    /** GET /api/dosen/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $rows = $this->letters->lettersForDosen($user);
        $aktif = $rows->filter(fn (array $r) => $r['letter']->isActive());

        return response()->json(['data' => [
            'stats' => [
                'mahasiswa_izin' => $aktif->count(),
                'notifikasi_baru' => $user->medicareNotifications()->whereNull('read_at')->count(),
                'surat_diterima_hari_ini' => $rows->filter(fn (array $r) => $r['letter']->issued_at->isToday())->count(),
            ],
            'notifikasi_terbaru' => NotificationResource::collection(
                $user->medicareNotifications()->latest('id')->limit(3)->get(),
            ),
            'mahasiswa_izin_hari_ini' => $this->flatten($aktif->take(5), $request),
        ]]);
    }

    /** GET /api/dosen/absent — "Mahasiswa Izin Sakit": satu baris per surat × mata kuliah. */
    public function absent(Request $request): JsonResponse
    {
        $rows = $this->letters->lettersForDosen($request->user());

        return response()->json(['data' => $this->flatten($rows, $request)]);
    }

    /** GET /api/dosen/letters/{letter} — catatan medis tidak pernah tersedia untuk dosen. */
    public function showLetter(Request $request, SickLetter $letter): JsonResponse
    {
        Gate::authorize('view', $letter);

        $courses = $this->letters->affectedCourses($letter)->where('dosen_id', $request->user()->id)->values();

        return response()->json(['data' => array_merge(
            (new SickLetterResource($letter->load(['student', 'doctor'])))->resolve($request),
            ['mata_kuliah' => $courses->map(fn ($c) => ['nama' => $c->nama, 'sesi' => $c->sesi()])->all()],
        )]);
    }

    /** @param  \Illuminate\Support\Collection<int, array{letter: SickLetter, courses: \Illuminate\Support\Collection}>  $rows */
    private function flatten($rows, Request $request): array
    {
        $out = [];

        foreach ($rows as $row) {
            $base = (new SickLetterResource($row['letter']))->resolve($request);

            foreach ($row['courses'] as $course) {
                $out[] = array_merge($base, [
                    'matkul' => $course->nama,
                    'sesi' => $course->sesi(),
                    'izin_sah' => true,
                ]);
            }
        }

        return $out;
    }
}
