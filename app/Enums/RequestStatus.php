<?php

namespace App\Enums;

/**
 * Status permintaan pemeriksaan. Urutan case = urutan siklus hidup (dipakai untuk "alur status").
 */
enum RequestStatus: string
{
    case Waiting = 'WAITING';
    case Batched = 'BATCHED';
    case DriverAccepted = 'DRIVER_ACCEPTED';
    case DriverOnTheWay = 'DRIVER_ON_THE_WAY';
    case PickedUp = 'PICKED_UP';
    case AtClinic = 'AT_CLINIC';
    case WaitingExam = 'WAITING_EXAM';
    case InExamination = 'IN_EXAMINATION';
    case ExamCompleted = 'EXAM_COMPLETED';
    case SickConfirmed = 'SICK_CONFIRMED';
    case ESickLetterIssued = 'E_SICK_LETTER_ISSUED';
    case ReturnPending = 'RETURN_PENDING';
    case Returned = 'RETURNED';
    case Completed = 'COMPLETED';

    public function label(): string
    {
        return match ($this) {
            self::Waiting => 'Menunggu',
            self::Batched => 'Dibatch',
            self::DriverAccepted => 'Driver Diterima',
            self::DriverOnTheWay => 'Driver OTW',
            self::PickedUp => 'Dijemput',
            self::AtClinic => 'Di Klinik',
            self::WaitingExam => 'Antre Periksa',
            self::InExamination => 'Sedang Diperiksa',
            self::ExamCompleted => 'Selesai Periksa',
            self::SickConfirmed => 'Dikonfirmasi Sakit',
            self::ESickLetterIssued => 'Surat Diterbitkan',
            self::ReturnPending => 'Siap Pulang',
            self::Returned => 'Sudah Pulang',
            self::Completed => 'Selesai',
        };
    }

    /** Urutan dalam siklus hidup (0..13). */
    public function order(): int
    {
        return (int) array_search($this, self::cases(), true);
    }

    /** @return list<self> */
    public function allowedNext(): array
    {
        return match ($this) {
            self::Waiting => [self::Batched],
            self::Batched => [self::DriverAccepted],
            self::DriverAccepted => [self::DriverOnTheWay],
            self::DriverOnTheWay => [self::PickedUp],
            self::PickedUp => [self::AtClinic],
            self::AtClinic => [self::WaitingExam, self::InExamination],
            self::WaitingExam => [self::InExamination],
            self::InExamination => [self::ExamCompleted, self::SickConfirmed],
            self::SickConfirmed => [self::ESickLetterIssued],
            self::ExamCompleted, self::ESickLetterIssued => [self::ReturnPending],
            self::ReturnPending => [self::Returned],
            self::Returned => [self::Completed],
            self::Completed => [],
        };
    }

    /** Permintaan yang sudah tidak aktif (mahasiswa boleh mengajukan lagi). */
    public function isFinished(): bool
    {
        return in_array($this, [self::Returned, self::Completed], true);
    }

    /** Status yang menandakan pemeriksaan sudah selesai. @return list<self> */
    public static function examDone(): array
    {
        return [
            self::ExamCompleted, self::SickConfirmed, self::ESickLetterIssued,
            self::ReturnPending, self::Returned, self::Completed,
        ];
    }

    /** Siap diantar pulang (sudah diperiksa, belum diantar). @return list<self> */
    public static function readyToReturn(): array
    {
        return [self::ExamCompleted, self::ESickLetterIssued];
    }

    /** Masih dalam perjalanan menuju klinik. @return list<self> */
    public static function enRoute(): array
    {
        return [self::Batched, self::DriverAccepted, self::DriverOnTheWay, self::PickedUp];
    }

    /** Sedang berada di klinik (belum/sedang diperiksa). @return list<self> */
    public static function atClinicWaiting(): array
    {
        return [self::AtClinic, self::WaitingExam];
    }

    /** Tahapan yang ditampilkan pada "Alur Status" di halaman mahasiswa. @return list<self> */
    public static function flowSteps(): array
    {
        return [
            self::Waiting, self::Batched, self::DriverOnTheWay, self::PickedUp,
            self::AtClinic, self::InExamination, self::ESickLetterIssued,
        ];
    }
}
