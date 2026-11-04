<?php

namespace App\Enums;

enum BatchStatus: string
{
    case Open = 'OPEN';           // window 15 menit masih mengumpulkan anggota
    case Pending = 'PENDING';     // sudah ditutup, menunggu driver
    case Accepted = 'ACCEPTED';   // driver menerima
    case OnTrip = 'ON_TRIP';      // driver menjemput
    case AtClinic = 'AT_CLINIC';  // tiba di klinik
    case Returning = 'RETURNING'; // return trip berjalan
    case Completed = 'COMPLETED';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Mengumpulkan',
            self::Pending => 'Menunggu',
            self::Accepted => 'Diterima Driver',
            self::OnTrip => 'Trip Berjalan',
            self::AtClinic => 'Di Klinik',
            self::Returning => 'Return Trip',
            self::Completed => 'Selesai',
        };
    }

    /** Langkah pada stepper trip driver: waiting | picking | clinic | return. */
    public function tripStep(): ?string
    {
        return match ($this) {
            self::Accepted => 'waiting',
            self::OnTrip => 'picking',
            self::AtClinic => 'clinic',
            self::Returning => 'return',
            default => null,
        };
    }

    /** Batch yang sedang dikerjakan driver. @return list<self> */
    public static function active(): array
    {
        return [self::Accepted, self::OnTrip, self::AtClinic, self::Returning];
    }
}
