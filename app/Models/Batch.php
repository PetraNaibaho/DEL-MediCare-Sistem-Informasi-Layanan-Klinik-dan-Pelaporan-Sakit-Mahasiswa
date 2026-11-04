<?php

namespace App\Models;

use App\Enums\BatchStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Batch extends Model
{
    protected $fillable = [
        'status', 'driver_id', 'window_opens_at', 'window_closes_at', 'closed_at',
        'accepted_at', 'estimasi_tiba', 'started_at', 'clinic_arrived_at',
        'return_started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => BatchStatus::class,
            'window_opens_at' => 'datetime',
            'window_closes_at' => 'datetime',
            'closed_at' => 'datetime',
            'accepted_at' => 'datetime',
            'estimasi_tiba' => 'datetime',
            'started_at' => 'datetime',
            'clinic_arrived_at' => 'datetime',
            'return_started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function requests(): HasMany
    {
        // Tanpa orderBy agar count()/withCount() aman di MySQL; urutkan di sisi pemanggil.
        return $this->hasMany(PickupRequest::class);
    }

    /** Contoh: "B001" */
    public function kode(): string
    {
        return 'B'.str_pad((string) $this->id, 3, '0', STR_PAD_LEFT);
    }

    /** Contoh: "BATCH #01" */
    public function label(): string
    {
        return 'BATCH #'.str_pad((string) $this->id, 2, '0', STR_PAD_LEFT);
    }
}
