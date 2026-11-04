<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Dipakai semua role yang memiliki menu/ikon notifikasi (lonceng di header). */
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()->medicareNotifications()->latest('id')->paginate(30);

        return NotificationResource::collection($notifications)->additional([
            'meta_unread' => $request->user()->medicareNotifications()->whereNull('read_at')->count(),
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['data' => [
            'unread' => $request->user()->medicareNotifications()->whereNull('read_at')->count(),
        ]]);
    }

    public function markRead(Request $request, int $id): NotificationResource
    {
        $notification = $request->user()->medicareNotifications()->findOrFail($id);
        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return new NotificationResource($notification);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->medicareNotifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'Semua notifikasi ditandai sudah dibaca.']);
    }
}
