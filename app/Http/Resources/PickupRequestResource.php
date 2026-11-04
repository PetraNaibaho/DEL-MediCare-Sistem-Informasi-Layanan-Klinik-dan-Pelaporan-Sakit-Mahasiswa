<?php

namespace App\Http\Resources;

use App\Enums\RequestStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PickupRequest */
class PickupRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $batch = $this->relationLoaded('batch') ? $this->batch : null;

        return [
            'id' => $this->id,
            'kode' => $this->kode(),
            'nim' => $this->whenLoaded('student', fn () => $this->student->identifier),
            'nama' => $this->whenLoaded('student', fn () => $this->student->name),
            'keluhan' => $this->keluhan,
            'lokasi' => $this->lokasi,
            'waktu' => $this->requested_at->format('H:i'),
            'tanggal' => $this->requested_at->translatedFormat('d M Y'),
            'nomor_antrean' => $this->nomor_antrean,
            'nomor_antrean_label' => $this->antreanLabel(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'batch' => $batch ? [
                'id' => $batch->id,
                'label' => $batch->label(),
                'status' => $batch->status->value,
                'jumlah_anggota' => $batch->requests()->count(),
                'kapasitas' => (int) config('medicare.batch_max_members'),
                'driver' => $batch->relationLoaded('driver') ? $batch->driver?->name : null,
                'estimasi_tiba' => $batch->estimasi_tiba?->format('H:i'),
            ] : null,
            'surat' => $this->whenLoaded('letter', fn () => $this->letter?->nomor),
            'alur' => $this->alur(),
        ];
    }

    /** Alur status untuk halaman "Status & Antrean": done | current | pending. */
    private function alur(): array
    {
        $current = $this->status;

        return array_map(fn (RequestStatus $step) => [
            'status' => $step->value,
            'label' => $step->label(),
            'state' => match (true) {
                $step === $current => 'current',
                $step->order() < $current->order() => 'done',
                default => 'pending',
            },
        ], RequestStatus::flowSteps());
    }
}
