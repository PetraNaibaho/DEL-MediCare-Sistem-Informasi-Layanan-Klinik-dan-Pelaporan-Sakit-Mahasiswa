<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SickLetter extends Model
{
    protected $fillable = [
        'nomor', 'pickup_request_id', 'examination_id', 'student_id', 'doctor_id',
        'keterangan', 'mulai_izin', 'selesai_izin', 'asrama', 'issued_at',
        'verified_at', 'verified_by',
    ];

    protected function casts(): array
    {
        return [
            'mulai_izin' => 'date',
            'selesai_izin' => 'date',
            'issued_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function pickupRequest(): BelongsTo
    {
        return $this->belongsTo(PickupRequest::class);
    }

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /** Surat masih berlaku hari ini atau di masa depan. */
    public function isActive(): bool
    {
        return $this->selesai_izin->gte(today());
    }
}
