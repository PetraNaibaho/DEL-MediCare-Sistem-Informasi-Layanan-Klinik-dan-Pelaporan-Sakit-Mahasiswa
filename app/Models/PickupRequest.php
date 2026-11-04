<?php

namespace App\Models;

use App\Enums\RequestStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PickupRequest extends Model
{
    protected $fillable = [
        'student_id', 'batch_id', 'keluhan', 'lokasi', 'status',
        'nomor_antrean', 'queue_date', 'requested_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => RequestStatus::class,
            'queue_date' => 'date',
            'requested_at' => 'datetime',
            'nomor_antrean' => 'integer',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function examination(): HasOne
    {
        return $this->hasOne(Examination::class);
    }

    public function letter(): HasOne
    {
        return $this->hasOne(SickLetter::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(RequestStatusLog::class);
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->where('queue_date', today()->toDateString());
    }

    /** Contoh: "R001" */
    public function kode(): string
    {
        return 'R'.str_pad((string) $this->id, 3, '0', STR_PAD_LEFT);
    }

    /** Contoh: "#05" */
    public function antreanLabel(): string
    {
        return '#'.str_pad((string) $this->nomor_antrean, 2, '0', STR_PAD_LEFT);
    }
}
