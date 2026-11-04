<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\UserNotification */
class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'pesan' => $this->pesan,
            'waktu' => $this->created_at->isToday()
                ? $this->created_at->format('H:i')
                : $this->created_at->translatedFormat('d M'),
            'created_at' => $this->created_at->toIso8601String(),
            'baca' => $this->read_at !== null,
        ];
    }
}
