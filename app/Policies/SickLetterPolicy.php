<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\SickLetter;
use App\Models\User;
use App\Services\SickLetterService;

class SickLetterPolicy
{
    public function view(User $user, SickLetter $letter): bool
    {
        return match ($user->role) {
            Role::Mahasiswa => $letter->student_id === $user->id,
            Role::Klinik, Role::Keasramaan => true,
            Role::Dosen => app(SickLetterService::class)
                ->affectedCourses($letter)
                ->contains('dosen_id', $user->id),
            default => false,
        };
    }
}
