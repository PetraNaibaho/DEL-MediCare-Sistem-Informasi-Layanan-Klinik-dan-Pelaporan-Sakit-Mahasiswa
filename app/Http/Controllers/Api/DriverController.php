<?php

namespace App\Http\Controllers\Api;

use App\Enums\BatchStatus;
use App\Enums\RequestStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\BatchResource;
use App\Http\Resources\PickupRequestResource;
use App\Models\Batch;
use App\Models\PickupRequest;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\RequestFlowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    public function __construct(
        private readonly RequestFlowService $flow,
        private readonly NotificationService $notifications,
    ) {}

    /** GET /api/driver/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $driver = $request->user();
        $active = $this->activeBatch($driver);

        return response()->json(['data' => [
            'stats' => [
                'batch_aktif' => $active ? 1 : 0,
                'batch_aktif_label' => $active?->label(),
                'mahasiswa_trip' => $active?->requests()->count() ?? 0,
                'kapasitas' => (int) config('medicare.batch_max_members'),
                'batch_pending' => Batch::where('status', BatchStatus::Pending->value)->whereNull('driver_id')->count(),
                'trip_hari_ini' => Batch::where('driver_id', $driver->id)
                    ->whereDate('accepted_at', today())->count(),
            ],
            'batch_aktif' => $active ? new BatchResource($active->load(['driver', 'requests.student'])) : null,
        ]]);
    }

    /** GET /api/driver/batches — "Daftar Batch Penjemputan" (batch milik saya + batch menunggu driver) */
    public function batches(Request $request)
    {
        $driver = $request->user();

        $batches = Batch::query()
            ->with(['driver', 'requests.student'])
            ->where(function ($q) use ($driver) {
                $q->where(fn ($p) => $p->where('status', BatchStatus::Pending->value)->whereNull('driver_id'))
                    ->orWhere(fn ($m) => $m->where('driver_id', $driver->id)
                        ->whereIn('status', array_map(fn ($s) => $s->value, BatchStatus::active())));
            })
            ->orderBy('id')
            ->get();

        return BatchResource::collection($batches);
    }

    /** POST /api/driver/batches/{batch}/accept — "Accept Batch" */
    public function accept(Request $request, Batch $batch): BatchResource
    {
        $driver = $request->user();

        DB::transaction(function () use ($batch, $driver) {
            $locked = Batch::whereKey($batch->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== BatchStatus::Pending || $locked->driver_id !== null) {
                abort(422, 'Batch ini sudah tidak tersedia.');
            }

            if ($this->activeBatch($driver)) {
                abort(422, 'Selesaikan batch yang sedang berjalan sebelum menerima batch baru.');
            }

            $locked->update([
                'status' => BatchStatus::Accepted,
                'driver_id' => $driver->id,
                'accepted_at' => now(),
                'estimasi_tiba' => now()->addMinutes((int) config('medicare.pickup_eta_minutes')),
            ]);

            foreach ($locked->requests as $member) {
                $this->flow->transition($member, RequestStatus::DriverAccepted, $driver);
                $this->notifications->send(
                    $member->student_id,
                    'driver',
                    "Driver {$driver->name} menerima {$locked->label()} Anda.",
                    ['batch_id' => $locked->id],
                );
            }
        });

        return new BatchResource($batch->fresh(['driver', 'requests.student']));
    }

    /** POST /api/driver/batches/{batch}/start — berangkat menjemput */
    public function start(Request $request, Batch $batch): BatchResource
    {
        $driver = $request->user();
        $this->ensureOwnBatch($batch, $driver, BatchStatus::Accepted);

        DB::transaction(function () use ($batch, $driver) {
            $batch->update(['status' => BatchStatus::OnTrip, 'started_at' => now()]);

            foreach ($batch->requests as $member) {
                $this->flow->transition($member, RequestStatus::DriverOnTheWay, $driver);
                $this->notifications->send(
                    $member->student_id,
                    'driver',
                    "Driver {$driver->name} sedang dalam perjalanan menuju lokasi Anda",
                    ['batch_id' => $batch->id],
                );
            }
        });

        return new BatchResource($batch->fresh(['driver', 'requests.student']));
    }

    /** POST /api/driver/requests/{pickupRequest}/pickup — mahasiswa sudah dijemput */
    public function pickup(Request $request, PickupRequest $pickupRequest): PickupRequestResource
    {
        $driver = $request->user();
        $batch = $pickupRequest->batch;

        abort_unless($batch && $batch->driver_id === $driver->id, 403, 'Permintaan ini bukan bagian dari batch Anda.');
        abort_unless($batch->status === BatchStatus::OnTrip, 422, 'Trip belum dimulai.');

        $this->flow->transition($pickupRequest, RequestStatus::PickedUp, $driver);
        $this->notifications->send(
            $pickupRequest->student_id,
            'driver',
            'Anda telah dijemput dan sedang menuju klinik.',
            ['pickup_request_id' => $pickupRequest->id],
        );

        return new PickupRequestResource($pickupRequest->load(['student', 'batch.driver']));
    }

    /** POST /api/driver/batches/{batch}/arrive-clinic — "Konfirmasi Tiba di Klinik" */
    public function arriveClinic(Request $request, Batch $batch): BatchResource
    {
        $driver = $request->user();
        $this->ensureOwnBatch($batch, $driver, BatchStatus::OnTrip);

        $members = $batch->requests;

        if ($members->contains(fn (PickupRequest $r) => $r->status !== RequestStatus::PickedUp)) {
            abort(422, 'Masih ada mahasiswa yang belum dijemput.');
        }

        DB::transaction(function () use ($batch, $members, $driver) {
            $batch->update(['status' => BatchStatus::AtClinic, 'clinic_arrived_at' => now()]);

            foreach ($members as $member) {
                $this->flow->transition($member, RequestStatus::AtClinic, $driver);
            }

            $this->notifications->sendToRole(
                Role::Klinik,
                'request',
                "{$members->count()} mahasiswa dari {$batch->label()} telah tiba di klinik.",
                ['batch_id' => $batch->id],
            );
        });

        return new BatchResource($batch->fresh(['driver', 'requests.student']));
    }

    /** GET /api/driver/trip — "Trip Aktif" */
    public function trip(Request $request): JsonResponse
    {
        $batch = $this->activeBatch($request->user());

        return response()->json([
            'data' => $batch ? new BatchResource($batch->load(['driver', 'requests.student'])) : null,
            'message' => $batch ? null : 'Tidak ada trip aktif.',
        ]);
    }

    /** GET /api/driver/return-trip — status trigger & mahasiswa yang siap dipulangkan */
    public function returnTrip(Request $request): JsonResponse
    {
        $batch = $this->activeBatch($request->user());

        if (! $batch || ! in_array($batch->status, [BatchStatus::AtClinic, BatchStatus::Returning], true)) {
            return response()->json(['data' => null, 'message' => 'Belum ada batch di klinik.']);
        }

        $members = $batch->requests()->with('student')->get();
        $finished = $members->filter(fn (PickupRequest $r) => in_array($r->status, RequestStatus::examDone(), true))->count();
        $needed = min((int) config('medicare.return_trigger_threshold'), $members->count());
        $ready = $members->filter(fn (PickupRequest $r) => in_array(
            $r->status,
            [...RequestStatus::readyToReturn(), RequestStatus::ReturnPending],
            true,
        ));

        return response()->json(['data' => [
            'batch' => ['id' => $batch->id, 'label' => $batch->label(), 'status' => $batch->status->value],
            'trigger_aktif' => $finished >= $needed,
            'selesai_diperiksa' => $finished,
            'ambang_trigger' => $needed,
            'siap_dipulangkan' => PickupRequestResource::collection($ready->values()),
        ]]);
    }

    /** POST /api/driver/batches/{batch}/return/start — "Mulai Antar ke Kampus/Asrama" */
    public function startReturn(Request $request, Batch $batch): BatchResource
    {
        $driver = $request->user();
        $this->ensureOwnBatch($batch, $driver, BatchStatus::AtClinic);

        $members = $batch->requests;
        $finished = $members->filter(fn (PickupRequest $r) => in_array($r->status, RequestStatus::examDone(), true))->count();
        $needed = min((int) config('medicare.return_trigger_threshold'), $members->count());

        if ($finished < $needed) {
            abort(422, "Return trip belum aktif: baru {$finished} dari {$needed} mahasiswa selesai diperiksa.");
        }

        $ready = $members->filter(fn (PickupRequest $r) => in_array($r->status, RequestStatus::readyToReturn(), true));

        DB::transaction(function () use ($batch, $ready, $driver) {
            $batch->update(['status' => BatchStatus::Returning, 'return_started_at' => now()]);

            foreach ($ready as $member) {
                $this->flow->transition($member, RequestStatus::ReturnPending, $driver);
                $this->notifications->send(
                    $member->student_id,
                    'driver',
                    'Pemeriksaan selesai. Anda akan diantar kembali ke kampus/asrama.',
                    ['pickup_request_id' => $member->id],
                );
            }
        });

        return new BatchResource($batch->fresh(['driver', 'requests.student']));
    }

    /**
     * POST /api/driver/batches/{batch}/return/complete — "Selesai — Proses Batch Berikutnya"
     * Mahasiswa yang diantar → RETURNED. Bila semua anggota sudah pulang, batch selesai (anggota → COMPLETED);
     * jika belum, batch kembali ke AT_CLINIC menunggu anggota lain selesai diperiksa.
     */
    public function completeReturn(Request $request, Batch $batch): BatchResource
    {
        $driver = $request->user();
        $this->ensureOwnBatch($batch, $driver, BatchStatus::Returning);

        DB::transaction(function () use ($batch, $driver) {
            foreach ($batch->requests()->where('status', RequestStatus::ReturnPending->value)->get() as $member) {
                $this->flow->transition($member, RequestStatus::Returned, $driver);
            }

            $members = $batch->requests()->get();

            if ($members->every(fn (PickupRequest $r) => $r->status === RequestStatus::Returned)) {
                foreach ($members as $member) {
                    $this->flow->transition($member, RequestStatus::Completed, $driver);
                }
                $batch->update(['status' => BatchStatus::Completed, 'completed_at' => now()]);
            } else {
                $batch->update(['status' => BatchStatus::AtClinic]);
            }
        });

        return new BatchResource($batch->fresh(['driver', 'requests.student']));
    }

    /** GET /api/driver/history — "Riwayat Perjalanan" */
    public function history(Request $request): JsonResponse
    {
        $batches = Batch::where('driver_id', $request->user()->id)
            ->where('status', BatchStatus::Completed->value)
            ->withCount('requests')
            ->latest('completed_at')
            ->paginate(15);

        return response()->json([
            'data' => $batches->getCollection()->map(fn (Batch $b) => [
                'id' => $b->id,
                'batch' => $b->kode(),
                'tanggal' => $b->completed_at?->translatedFormat('d M Y'),
                'mahasiswa' => $b->requests_count,
                'kapasitas' => (int) config('medicare.batch_max_members'),
                'status' => 'Selesai',
                'durasi_menit' => $b->started_at && $b->completed_at ? (int) $b->started_at->diffInMinutes($b->completed_at) : null,
            ])->values(),
            'meta' => ['current_page' => $batches->currentPage(), 'last_page' => $batches->lastPage(), 'total' => $batches->total()],
        ]);
    }

    private function activeBatch(User $driver): ?Batch
    {
        return Batch::where('driver_id', $driver->id)
            ->whereIn('status', array_map(fn (BatchStatus $s) => $s->value, BatchStatus::active()))
            ->latest('id')
            ->first();
    }

    private function ensureOwnBatch(Batch $batch, User $driver, BatchStatus $expected): void
    {
        abort_unless($batch->driver_id === $driver->id, 403, 'Batch ini bukan milik Anda.');
        abort_unless($batch->status === $expected, 422, "Aksi tidak dapat dilakukan pada batch berstatus {$batch->status->label()}.");
    }
}
