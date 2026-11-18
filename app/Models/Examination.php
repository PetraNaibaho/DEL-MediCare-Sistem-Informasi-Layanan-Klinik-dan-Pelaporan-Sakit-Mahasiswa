<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Examination extends Model
{
    protected $fillable = [
        'pickup_request_id', 'doctor_id', 'diagnosis', 'catatan_medis',
        'is_sick', 'started_at', 'completed_at',
    ];

    // catatan_medis bersifat rahasia: tidak ikut ter-serialisasi secara tidak sengaja.
    protected $hidden = ['catatan_medis'];

    protected function casts(): array
    {
        return [
            'is_sick' => 'boolean',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function pickupRequest(): BelongsTo
    {
        return $this->belongsTo(PickupRequest::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function letter(): HasOne
    {
        return $this->hasOne(SickLetter::class);
    }
}
