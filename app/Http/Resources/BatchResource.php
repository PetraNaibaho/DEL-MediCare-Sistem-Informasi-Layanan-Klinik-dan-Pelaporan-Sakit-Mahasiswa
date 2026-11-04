<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Batch */
class BatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode' => $this->kode(),
            'label' => $this->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'trip_step' => $this->status->tripStep(),
            'driver' => $this->whenLoaded('driver', fn () => $this->driver?->name),
            'estimasi_tiba' => $this->estimasi_tiba?->format('H:i'),
            'jumlah_anggota' => $this->relationLoaded('requests')
                ? $this->requests->count()
                : $this->requests()->count(),
            'kapasitas' => (int) config('medicare.batch_max_members'),
            'anggota' => PickupRequestResource::collection($this->whenLoaded(
                'requests',
                fn () => $this->requests->sortBy('nomor_antrean')->values(),
            )),
        ];
    }
}
