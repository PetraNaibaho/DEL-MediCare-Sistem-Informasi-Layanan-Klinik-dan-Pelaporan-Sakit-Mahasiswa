<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePickupRequest;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\PickupRequestResource;
use App\Http\Resources\SickLetterResource;
use App\Http\Resources\UserResource;
use App\Models\PickupRequest;
use App\Models\SickLetter;
use App\Models\User;
use App\Services\BatchingService;
use App\Services\LetterPdfService;
use App\Services\NotificationService;
use App\Services\RequestFlowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;

class MahasiswaController extends Controller
{
    public function __construct(
        private readonly BatchingService $batching,
        private readonly RequestFlowService $flow,
        private readonly NotificationService $notifications,
    ) {}

    /** GET /api/mahasiswa/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $active = $this->activeRequest($user);

        return response()->json(['data' => [
            'user' => new UserResource($user),
            'stats' => [
                'nomor_antrean' => $active?->antreanLabel(),
                'status' => $active?->status->value,
                'status_label' => $active?->status->label(),
                'estimasi_jemput' => $active?->batch?->estimasi_tiba?->format('H:i'),
                'riwayat_layanan' => $user->pickupRequests()->count(),
            ],
            'request_aktif' => $active ? new PickupRequestResource($active) : null,
            'notifikasi_terbaru' => NotificationResource::collection(
                $user->medicareNotifications()->latest('id')->limit(3)->get(),
            ),
            'notifikasi_belum_dibaca' => $user->medicareNotifications()->whereNull('read_at')->count(),
        ]]);
    }

    /** POST /api/mahasiswa/requests — "Daftar Pemeriksaan" */
    public function storeRequest(StorePickupRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($this->activeRequest($user)) {
            abort(422, 'Anda masih memiliki permintaan pemeriksaan yang aktif.');
        }

        $pickup = DB::transaction(function () use ($request, $user) {
            // Nomor antrean berurutan dan di-reset tiap hari.
            $next = (int) PickupRequest::where('queue_date', today()->toDateString())
                ->lockForUpdate()
                ->max('nomor_antrean') + 1;

            $pickup = PickupRequest::create([
                'student_id' => $user->id,
                'keluhan' => $request->validated('keluhan'),
                'lokasi' => $request->validated('lokasi'),
                'status' => RequestStatus::Waiting,
                'nomor_antrean' => $next,
                'queue_date' => today(),
                'requested_at' => now(),
            ]);

            $this->flow->logInitial($pickup, $user);
            $this->batching->assign($pickup);

            return $pickup;
        });

        $this->notifications->send(
            $user,
            'request',
            "Permintaan pemeriksaan {$pickup->kode()} telah diterima oleh sistem",
            ['pickup_request_id' => $pickup->id],
        );

        // Status bisa sudah berubah (mis. batch langsung penuh dan ditutup) — muat ulang.
        $pickup->refresh()->load(['student', 'batch.driver', 'letter']);

        return response()->json([
            'message' => 'Request berhasil dikirim.',
            'data' => new PickupRequestResource($pickup),
        ], 201);
    }

    /** GET /api/mahasiswa/requests/active — "Status & Antrean" */
    public function activeStatus(Request $request): JsonResponse
    {
        $active = $this->activeRequest($request->user());

        return response()->json([
            'data' => $active ? new PickupRequestResource($active) : null,
            'message' => $active ? null : 'Tidak ada layanan aktif saat ini.',
        ]);
    }

    /** GET /api/mahasiswa/requests — "Riwayat Layanan" */
    public function history(Request $request)
    {
        $items = $request->user()->pickupRequests()
            ->with(['letter', 'batch'])
            ->latest('id')
            ->paginate(15);

        return PickupRequestResource::collection($items);
    }

    /** GET /api/mahasiswa/letters */
    public function letters(Request $request)
    {
        $letters = SickLetter::where('student_id', $request->user()->id)
            ->with(['student', 'doctor'])
            ->latest('issued_at')
            ->get();

        return SickLetterResource::collection($letters);
    }

    /** GET /api/mahasiswa/letters/{letter} */
    public function showLetter(SickLetter $letter): SickLetterResource
    {
        Gate::authorize('view', $letter);

        return new SickLetterResource($letter->load(['student', 'doctor']));
    }

    /** GET /api/mahasiswa/letters/{letter}/pdf — "Unduh PDF" */
    public function pdf(SickLetter $letter, LetterPdfService $pdf)
    {
        Gate::authorize('view', $letter);

        return $pdf->download($letter);
    }

    /** POST /api/mahasiswa/letters/{letter}/share — "Bagikan": tautan publik berlaku 7 hari. */
    public function share(SickLetter $letter): JsonResponse
    {
        Gate::authorize('view', $letter);

        $expires = now()->addDays(7);

        return response()->json(['data' => [
            'url' => URL::temporarySignedRoute('letters.public', $expires, ['nomor' => $letter->nomor]),
            'expires_at' => $expires->toIso8601String(),
        ]]);
    }

    private function activeRequest(User $user): ?PickupRequest
    {
        return $user->pickupRequests()
            ->whereNotIn('status', [RequestStatus::Returned->value, RequestStatus::Completed->value])
            ->with(['student', 'batch.driver', 'letter'])
            ->latest('id')
            ->first();
    }
}
