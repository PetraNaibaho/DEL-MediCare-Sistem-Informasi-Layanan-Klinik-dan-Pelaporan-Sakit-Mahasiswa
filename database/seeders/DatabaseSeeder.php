<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Data demo sesuai prototipe DEL-MediCare (kredensial demo ada di halaman login prototipe).
 * JANGAN dipakai di production: ganti password sebelum deploy.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Staf (1 akun per role, sama dengan kredensial demo di prototipe) ──
        $staff = [
            ['Pak Hendra Putra', 'hendra.putra', 'driver123', Role::Driver, 'DRV-002', null],
            ['dr. Maria Sihotang', 'maria.sihotang', 'klinik123', Role::Klinik, 'KLN-001', null],
            ['Bpk. Kristian Sihombing', 'kristian.sihombing', 'ksr123', Role::Keasramaan, 'KSR-003', null],
            ['Dr. Ir. Sudirman, M.T.', 'sudirman', 'dosen123', Role::Dosen, 'DSN-014', null],
        ];

        $users = [];
        foreach ($staff as [$name, $username, $password, $role, $identifier, $asrama]) {
            $users[$role->value] = User::updateOrCreate(
                ['username' => $username],
                [
                    'name' => $name,
                    'email' => $username.'@del.ac.id',
                    'password' => $password,
                    'role' => $role,
                    'identifier' => $identifier,
                    'asrama' => $asrama,
                ],
            );
        }

        // ── Mahasiswa (nama/NIM/asrama dari data antrean di prototipe) ──
        $students = [
            ['Danu Siregar', 'danu.siregar', '118140089', 'Asrama Putra Blok B'],
            ['Reza Pratama', 'reza.pratama', '118140012', 'Asrama Putra Blok A'],
            ['Sarah Hutabarat', 'sarah.hutabarat', '118140023', 'Asrama Putri Blok C'],
            ['Budi Santoso', 'budi.santoso', '118140045', 'Asrama Putra Blok B'],
            ['Lita Manullang', 'lita.manullang', '118140067', 'Asrama Putri Blok B'],
            ['Yuni Aritonang', 'yuni.aritonang', '118140091', 'Asrama Putri Blok A'],
            ['Ferry Simanjuntak', 'ferry.simanjuntak', '118140102', 'Asrama Putra Blok A'],
        ];

        $studentModels = [];
        foreach ($students as [$name, $username, $nim, $asrama]) {
            $studentModels[] = User::updateOrCreate(
                ['username' => $username],
                [
                    'name' => $name,
                    'email' => $username.'@students.del.ac.id',
                    'password' => 'mahasiswa123',
                    'role' => Role::Mahasiswa,
                    'identifier' => $nim,
                    'asrama' => $asrama,
                ],
            );
        }

        // ── Mata kuliah milik Dr. Sudirman (sesuai halaman "Mahasiswa Izin" dosen) ──
        $courses = [
            ['IF-ALP', 'Algoritma & Pemrograman', 1, '08:00', '10:00'],
            ['IF-BD', 'Basis Data', 1, '10:00', '12:00'],
        ];

        foreach ($courses as [$kode, $nama, $hari, $mulai, $selesai]) {
            $course = Course::updateOrCreate(
                ['kode' => $kode],
                [
                    'nama' => $nama,
                    'dosen_id' => $users['dosen']->id,
                    'hari' => $hari,
                    'jam_mulai' => $mulai,
                    'jam_selesai' => $selesai,
                ],
            );
            $course->students()->syncWithoutDetaching(collect($studentModels)->pluck('id')->all());
        }
    }
}
