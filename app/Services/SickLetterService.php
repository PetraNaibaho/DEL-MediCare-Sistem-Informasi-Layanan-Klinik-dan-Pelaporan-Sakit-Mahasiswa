<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Course;
use App\Models\Examination;
use App\Models\SickLetter;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SickLetterService
{
    public function __construct(private readonly NotificationService $notifications) {}

    /**
     * Terbitkan e-Surat Sakit dan kirim notifikasi ke mahasiswa, dosen terkait, dan keasramaan.
     */
    public function issue(Examination $exam, CarbonInterface $mulai, CarbonInterface $selesai): SickLetter
    {
        return DB::transaction(function () use ($exam, $mulai, $selesai) {
            $request = $exam->pickupRequest()->with('student')->first();
            $student = $request->student;

            $letter = SickLetter::create([
                'nomor' => $this->nextNomor(),
                'pickup_request_id' => $request->id,
                'examination_id' => $exam->id,
                'student_id' => $student->id,
                'doctor_id' => $exam->doctor_id,
                'keterangan' => $exam->diagnosis,
                'mulai_izin' => $mulai->toDateString(),
                'selesai_izin' => $selesai->toDateString(),
                'asrama' => $student->asrama,
                'issued_at' => now(),
            ]);

            $periode = $this->periode($letter);
            $meta = ['sick_letter_id' => $letter->id];

            // Mahasiswa
            $this->notifications->send(
                $student,
                'letter',
                "e-Surat Sakit {$letter->nomor} telah diterbitkan untuk {$student->name}",
                $meta,
            );

            // Keasramaan (rincian medis tidak disertakan)
            $this->notifications->sendToRole(
                Role::Keasramaan,
                'letter',
                "e-Surat Sakit {$letter->nomor} diterbitkan untuk {$student->name}"
                .($student->asrama ? " ({$student->asrama})" : '')
                .". Izin: {$periode}.",
                $meta,
            );

            // Dosen yang mata kuliahnya jatuh pada periode izin
            foreach ($this->affectedCourses($letter)->groupBy('dosen_id') as $dosenId => $courses) {
                $matkul = $courses->pluck('nama')->implode(', ');
                $this->notifications->send(
                    (int) $dosenId,
                    'letter',
                    "{$student->name} ({$student->identifier}) tidak dapat mengikuti {$matkul}. "
                    ."e-Surat Sakit {$letter->nomor} tersedia.",
                    $meta,
                );
            }

            return $letter;
        });
    }

    /**
     * Mata kuliah mahasiswa yang jadwalnya (hari) jatuh dalam periode izin.
     *
     * @return Collection<int, Course>
     */
    public function affectedCourses(SickLetter $letter): Collection
    {
        $days = [];
        $cursor = $letter->mulai_izin->copy();

        // Maksimal 7 hari sudah mencakup semua hari dalam sepekan.
        for ($i = 0; $i < 7 && $cursor->lte($letter->selesai_izin); $i++) {
            $days[] = $cursor->dayOfWeekIso;
            $cursor->addDay();
        }

        return Course::query()
            ->whereIn('hari', array_unique($days))
            ->whereHas('students', fn ($q) => $q->where('users.id', $letter->student_id))
            ->with('dosen')
            ->get();
    }

    /** Surat yang berdampak pada mata kuliah milik dosen tertentu. @return Collection<int, array{letter: SickLetter, courses: Collection<int, Course>}> */
    public function lettersForDosen(User $dosen): Collection
    {
        $studentIds = DB::table('course_student')
            ->whereIn('course_id', Course::where('dosen_id', $dosen->id)->select('id'))
            ->pluck('student_id')
            ->unique();

        return SickLetter::query()
            ->whereIn('student_id', $studentIds)
            ->with(['student', 'doctor'])
            ->latest('issued_at')
            ->get()
            ->map(fn (SickLetter $letter) => [
                'letter' => $letter,
                'courses' => $this->affectedCourses($letter)->where('dosen_id', $dosen->id)->values(),
            ])
            ->filter(fn (array $row) => $row['courses']->isNotEmpty())
            ->values();
    }

    public function periode(SickLetter $letter): string
    {
        return $letter->mulai_izin->translatedFormat('d').'–'.$letter->selesai_izin->translatedFormat('d M Y');
    }

    private function nextNomor(): string
    {
        $year = now()->year;
        $last = SickLetter::where('nomor', 'like', "SS-{$year}-%")->max('nomor');
        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return sprintf('SS-%d-%04d', $year, $next);
    }
}
