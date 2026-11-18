<?php

namespace App\Enums;

enum Role: string
{
    case Mahasiswa = 'mahasiswa';
    case Driver = 'driver';
    case Klinik = 'klinik';
    case Keasramaan = 'keasramaan';
    case Dosen = 'dosen';

    public function label(): string
    {
        return match ($this) {
            self::Mahasiswa => 'Mahasiswa',
            self::Driver => 'Driver',
            self::Klinik => 'Pihak Klinik',
            self::Keasramaan => 'Keasramaan',
            self::Dosen => 'Dosen',
        };
    }
}
