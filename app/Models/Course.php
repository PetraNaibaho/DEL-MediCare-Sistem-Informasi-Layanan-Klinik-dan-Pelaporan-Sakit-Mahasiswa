<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Course extends Model
{
    public const HARI = [1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'];

    protected $fillable = ['kode', 'nama', 'dosen_id', 'hari', 'jam_mulai', 'jam_selesai'];

    protected function casts(): array
    {
        return ['hari' => 'integer'];
    }

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'course_student', 'course_id', 'student_id');
    }

    /** Contoh: "Senin 08:00–10:00" */
    public function sesi(): string
    {
        return sprintf(
            '%s %s–%s',
            self::HARI[$this->hari] ?? '-',
            substr((string) $this->jam_mulai, 0, 5),
            substr((string) $this->jam_selesai, 0, 5),
        );
    }
}
