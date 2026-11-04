<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Models\PickupRequest;
use App\Models\RequestStatusLog;
use App\Models\User;

/**
 * Satu-satunya pintu perubahan status permintaan: memvalidasi transisi dan mencatat log.
 */
class RequestFlowService
{
    public function transition(PickupRequest $request, RequestStatus $to, ?User $by = null): PickupRequest
    {
        $from = $request->status;

        if (! in_array($to, $from->allowedNext(), true)) {
            abort(422, sprintf(
                'Transisi status tidak valid: %s → %s.',
                $from->label(),
                $to->label(),
            ));
        }

        $request->update(['status' => $to]);

        RequestStatusLog::create([
            'pickup_request_id' => $request->id,
            'from_status' => $from->value,
            'to_status' => $to->value,
            'changed_by' => $by?->id,
        ]);

        return $request;
    }

    public function logInitial(PickupRequest $request, ?User $by = null): void
    {
        RequestStatusLog::create([
            'pickup_request_id' => $request->id,
            'from_status' => null,
            'to_status' => $request->status->value,
            'changed_by' => $by?->id,
        ]);
    }
}
