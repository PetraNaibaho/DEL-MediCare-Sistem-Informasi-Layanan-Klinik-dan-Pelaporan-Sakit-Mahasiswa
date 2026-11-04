<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\User;
use App\Models\UserNotification;

class NotificationService
{
    /**
     * @param  string  $type  letter | driver | request
     */
    public function send(User|int $user, string $type, string $pesan, array $data = []): UserNotification
    {
        return UserNotification::create([
            'user_id' => $user instanceof User ? $user->id : $user,
            'type' => $type,
            'pesan' => $pesan,
            'data' => $data ?: null,
        ]);
    }

    public function sendToRole(Role $role, string $type, string $pesan, array $data = []): void
    {
        User::where('role', $role->value)->pluck('id')->each(
            fn (int $id) => $this->send($id, $type, $pesan, $data),
        );
    }
}
