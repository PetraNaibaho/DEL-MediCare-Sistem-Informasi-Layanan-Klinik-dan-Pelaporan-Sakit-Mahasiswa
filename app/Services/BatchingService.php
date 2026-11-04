<?php

namespace App\Services;

use App\Enums\BatchStatus;
use App\Enums\RequestStatus;
use App\Enums\Role;
use App\Models\Batch;
use App\Models\PickupRequest;
use Illuminate\Support\Facades\DB;

/**
 * Pengelompokan penjemputan: window 15 menit, maksimal 5 mahasiswa per batch.
 *
 * - Request baru masuk ke batch OPEN yang window-nya belum habis dan belum penuh,
 *   atau membuka batch baru.
 * - Batch ditutup (OPEN → PENDING) saat penuh atau saat window habis
 *   (command `medicare:close-batches`, dijadwalkan tiap menit).
 * - Saat ditutup, semua anggota berstatus WAITING → BATCHED dan driver diberi notifikasi.
 */
class BatchingService
{
    public function __construct(
        private readonly RequestFlowService $flow,
        private readonly NotificationService $notifications,
    ) {}

    public function assign(PickupRequest $request): Batch
    {
        $max = (int) config('medicare.batch_max_members');
        $window = (int) config('medicare.batch_window_minutes');

        return DB::transaction(function () use ($request, $max, $window) {
            $batch = Batch::query()
                ->where('status', BatchStatus::Open->value)
                ->where('window_closes_at', '>', now())
                ->withCount('requests')
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->first(fn (Batch $b) => $b->requests_count < $max);

            $batch ??= Batch::create([
                'status' => BatchStatus::Open,
                'window_opens_at' => now(),
                'window_closes_at' => now()->addMinutes($window),
            ]);

            $request->update(['batch_id' => $batch->id]);

            if ($batch->requests()->count() >= $max) {
                $this->close($batch);
            }

            return $batch->fresh();
        });
    }

    public function close(Batch $batch): void
    {
        DB::transaction(function () use ($batch) {
            $batch->refresh();

            if ($batch->status !== BatchStatus::Open) {
                return;
            }

            $batch->update(['status' => BatchStatus::Pending, 'closed_at' => now()]);

            $members = $batch->requests()->where('status', RequestStatus::Waiting->value)->get();

            foreach ($members as $member) {
                $this->flow->transition($member, RequestStatus::Batched);
                $this->notifications->send(
                    $member->student_id,
                    'request',
                    "Permintaan pemeriksaan {$member->kode()} masuk {$batch->label()} dan menunggu driver.",
                    ['pickup_request_id' => $member->id, 'batch_id' => $batch->id],
                );
            }

            $this->notifications->sendToRole(
                Role::Driver,
                'driver',
                "{$batch->label()} siap diambil ({$members->count()} mahasiswa).",
                ['batch_id' => $batch->id],
            );
        });
    }

    /** Tutup semua batch yang window-nya sudah habis. Mengembalikan jumlah batch yang ditutup. */
    public function closeExpired(): int
    {
        $batches = Batch::query()
            ->where('status', BatchStatus::Open->value)
            ->where('window_closes_at', '<=', now())
            ->get();

        foreach ($batches as $batch) {
            $this->close($batch);
        }

        return $batches->count();
    }
}
