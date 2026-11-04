<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'username', 'email', 'password', 'role', 'identifier', 'asrama',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }

    public function hasRole(Role $role): bool
    {
        return $this->role === $role;
    }

    /** Mata kuliah yang diampu (role dosen). */
    public function taughtCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'dosen_id');
    }

    /** Mata kuliah yang diikuti (role mahasiswa). */
    public function enrolledCourses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_student', 'student_id', 'course_id');
    }

    public function pickupRequests(): HasMany
    {
        return $this->hasMany(PickupRequest::class, 'student_id');
    }

    public function medicareNotifications(): HasMany
    {
        return $this->hasMany(UserNotification::class);
    }
}
