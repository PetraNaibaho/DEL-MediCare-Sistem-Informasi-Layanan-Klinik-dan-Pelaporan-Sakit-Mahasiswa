<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteExaminationRequest;
use App\Http\Resources\PickupRequestResource;
use App\Http\Resources\SickLetterResource;
use App\Models\Examination;
use App\Models\PickupRequest;
use App\Models\SickLetter;
use App\Services\RequestFlowService;
use App\Services\SickLetterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class KlinikController extends Controller
{
    public function __construct(
        private readonly RequestFlowService $flow,
        private readonly SickLetterService $letters,
    ) {}

    /** GET /api/klinik/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $today = PickupRequest::today();
        $inExam = (clone $today)->where('status', RequestStatus::InExamination->value)->orderBy('nomor_antrean')->get();
        $atClinic = (clone $today)->whereIn('status', $this->values([
            ...RequestStatus::atClinicWaiting(), RequestStatus::InExamination,
        ]))->with('student')->orderBy('nomor_antrean')->get();

        return response()->json(['data' => [
            'stats' => [
                'total_antrean' => (clone $today)->count(),
                'di_klinik' => $atClinic->count(),
                'sedang_diperiksa' => $inExam->count(),
                'sedang_diperiksa_kode' => $inExam->first()?->kode(),
                'surat_diterbitkan_hari_ini' => SickLetter::whereDate('issued_at', today())->count(),
            ],
            'antrean_pemeriksaan' => PickupRequestResource::collection($atClinic),
            'surat_terbaru' => SickLetterResource::collection(
                SickLetter::with(['student', 'doctor'])->latest('issued_at')->limit(5)->get(),
            ),
        ]]);
    }

    /** GET /api/klinik/queue — "Antrean Masuk" (hari ini) */
    public function queue(): JsonResponse
    {
        $items = PickupRequest::today()->with(['student', 'batch'])->orderBy('nomor_antrean')->get();

        $count = fn (array $statuses) => $items->filter(fn (PickupRequest $r) => in_array($r->status, $statuses, true))->count();

        return response()->json([
            'summary' => [
                'menuju_klinik' => $count(RequestStatus::enRoute()),
                'sudah_di_klinik' => $count(RequestStatus::atClinicWaiting()),
                'sedang_diperiksa' => $count([RequestStatus::InExamination]),
            ],
            'data' => PickupRequestResource::collection($items),
        ]);
    }

    /** POST /api/klinik/requests/{pickupRequest}/start-exam — tombol "Periksa" */
    public function startExam(Request $request, PickupRequest $pickupRequest): JsonResponse
    {
        $exam = $this->beginExamination($pickupRequest, $request->user()->id);

        return response()->json([
            'message' => 'Pemeriksaan dimulai.',
            'data' => new PickupRequestResource($pickupRequest->fresh(['student', 'batch'])),
            'pemeriksaan' => ['id' => $exam->id, 'dimulai' => $exam->started_at->toIso8601String()],
        ]);
    }

    /**
     * POST /api/klinik/requests/{pickupRequest}/complete-exam
     * Tidak sakit → EXAM_COMPLETED. Sakit → SICK_CONFIRMED → e-Surat Sakit terbit → E_SICK_LETTER_ISSUED.
     */
    public function completeExam(CompleteExaminationRequest $request, PickupRequest $pickupRequest): JsonResponse
    {
        $doctor = $request->user();

        $result = DB::transaction(function () use ($request, $pickupRequest, $doctor) {
            $pickupRequest->refresh();
            $exam = $this->beginExamination($pickupRequest, $doctor->id);

            abort_unless(
                $pickupRequest->status === RequestStatus::InExamination,
                422,
                'Pemeriksaan tidak dapat diselesaikan pada status '.$pickupRequest->status->label().'.',
            );

            $isSick = $request->boolean('is_sick');

            $exam->update([
                'diagnosis' => $request->validated('diagnosis'),
                'catatan_medis' => $request->validated('catatan_medis'),
                'is_sick' => $isSick,
                'completed_at' => now(),
            ]);

            $letter = null;

            if ($isSick) {
                $this->flow->transition($pickupRequest, RequestStatus::SickConfirmed, $doctor);
                $letter = $this->letters->issue($exam, $request->date('mulai_izin'), $request->date('selesai_izin'));
                $this->flow->transition($pickupRequest, RequestStatus::ESickLetterIssued, $doctor);
            } else {
                $this->flow->transition($pickupRequest, RequestStatus::ExamCompleted, $doctor);
            }

            return $letter;
        });

        return response()->json([
            'message' => $result ? 'e-Surat Sakit diterbitkan.' : 'Pemeriksaan selesai.',
            'data' => new PickupRequestResource($pickupRequest->fresh(['student', 'batch', 'letter'])),
            'surat' => $result ? new SickLetterResource($result->load(['student', 'doctor'])) : null,
        ]);
    }

    /** GET /api/klinik/letters — "e-Surat Sakit" */
    public function letters()
    {
        return SickLetterResource::collection(
            SickLetter::with(['student', 'doctor'])->latest('issued_at')->paginate(20),
        );
    }

    /** GET /api/klinik/letters/{letter} */
    public function showLetter(SickLetter $letter): SickLetterResource
    {
        Gate::authorize('view', $letter);

        return new SickLetterResource($letter->load(['student', 'doctor']));
    }

    /** GET /api/klinik/history — "Riwayat Pemeriksaan" (rincian medis hanya diagnosis) */
    public function history(Request $request): JsonResponse
    {
        $exams = Examination::query()
            ->where('doctor_id', $request->user()->id)
            ->with(['pickupRequest.student', 'letter'])
            ->latest('id')
            ->paginate(20);

        return response()->json([
            'data' => $exams->getCollection()->map(fn (Examination $e) => [
                'id' => $e->id,
                'waktu' => ($e->completed_at ?? $e->started_at)?->format('H:i'),
                'tanggal' => ($e->completed_at ?? $e->started_at)?->translatedFormat('d M Y'),
                'mahasiswa' => $e->pickupRequest->student->name,
                'nim' => $e->pickupRequest->student->identifier,
                'diagnosis' => $e->diagnosis,
                'status' => $e->pickupRequest->status->value,
                'status_label' => $e->pickupRequest->status->label(),
                'surat' => $e->letter?->nomor,
            ])->values(),
            'meta' => ['current_page' => $exams->currentPage(), 'last_page' => $exams->lastPage(), 'total' => $exams->total()],
        ]);
    }

    /** Pindahkan ke IN_EXAMINATION (bila perlu) dan pastikan ada catatan pemeriksaan. */
    private function beginExamination(PickupRequest $pickupRequest, int $doctorId): Examination
    {
        if (in_array($pickupRequest->status, RequestStatus::atClinicWaiting(), true)) {
            $this->flow->transition($pickupRequest, RequestStatus::InExamination, request()->user());
        }

        abort_unless(
            $pickupRequest->status === RequestStatus::InExamination,
            422,
            'Mahasiswa belum berada di klinik atau pemeriksaan sudah selesai.',
        );

        return Examination::firstOrCreate(
            ['pickup_request_id' => $pickupRequest->id],
            ['doctor_id' => $doctorId, 'started_at' => now()],
        );
    }

    /** @param  list<RequestStatus>  $statuses  @return list<string> */
    private function values(array $statuses): array
    {
        return array_map(fn (RequestStatus $s) => $s->value, $statuses);
    }
}
