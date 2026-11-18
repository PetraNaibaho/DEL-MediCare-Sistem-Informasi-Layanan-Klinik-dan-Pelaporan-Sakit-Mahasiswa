<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** POST /api/auth/login — role dipilih di halaman login, harus sesuai dengan role akun. */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::enum(Role::class)],
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'username.required' => 'Username dan password wajib diisi.',
            'password.required' => 'Username dan password wajib diisi.',
        ]);

        $roleVal = $data['role'] instanceof Role ? $data['role']->value : (string) $data['role'];

        $existing = User::where('username', $data['username'])->first();
        if ($existing && $existing->role->value !== $roleVal) {
            throw ValidationException::withMessages([
                'role' => ["Akun {$data['username']} terdaftar sebagai peran {$existing->role->label()}."],
            ]);
        }

        $user = User::where('username', $data['username'])->where('role', $data['role'])->first();

        if (! $user) {
            // Buat akun baru secara otomatis on-the-fly jika belum terdaftar
            $cleanName = ucwords(str_replace(['.', '_', '-'], ' ', $data['username']));

            $identifier = match ($roleVal) {
                Role::Mahasiswa->value => '118140' . rand(100, 999),
                Role::Driver->value => 'DRV-' . rand(100, 999),
                Role::Klinik->value => 'KLN-' . rand(100, 999),
                Role::Keasramaan->value => 'KSR-' . rand(100, 999),
                Role::Dosen->value => 'DSN-' . rand(100, 999),
                default => 'USR-' . rand(100, 999),
            };

            $namePrefix = match ($roleVal) {
                Role::Driver->value => 'Pak ',
                Role::Klinik->value => 'dr. ',
                Role::Keasramaan->value => 'Bpk. ',
                Role::Dosen->value => 'Dr. Ir. ',
                default => '',
            };

            $nameSuffix = $roleVal === Role::Dosen->value ? ', M.T.' : '';

            $user = User::create([
                'name' => $namePrefix . $cleanName . $nameSuffix,
                'username' => $data['username'],
                'email' => strtolower(str_replace(' ', '', $data['username'])) . ($roleVal === Role::Mahasiswa->value ? '@students.del.ac.id' : '@del.ac.id'),
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'identifier' => $identifier,
                'asrama' => $roleVal === Role::Mahasiswa->value ? 'Asrama Putra Blok B' : null,
            ]);

            // Jika role mahasiswa, daftarkan otomatis ke semua mata kuliah agar terhubung ke dosen
            if ($roleVal === Role::Mahasiswa->value) {
                $allCourseIds = \App\Models\Course::pluck('id')->all();
                if (! empty($allCourseIds)) {
                    $user->enrolledCourses()->syncWithoutDetaching($allCourseIds);
                }
            }

            // Jika role dosen baru, buatkan mata kuliah agar fitur dosen langsung aktif
            if ($roleVal === Role::Dosen->value) {
                $course = \App\Models\Course::firstOrCreate(
                    ['kode' => 'IF-DEL-' . rand(10, 99)],
                    [
                        'nama' => 'Pengantar Rekayasa Perangkat Lunak',
                        'dosen_id' => $user->id,
                        'hari' => 1,
                        'jam_mulai' => '08:00',
                        'jam_selesai' => '10:00',
                    ]
                );
                $allStudentIds = User::where('role', Role::Mahasiswa->value)->pluck('id')->all();
                if (! empty($allStudentIds)) {
                    $course->students()->syncWithoutDetaching($allStudentIds);
                }
            }
        } else {
            // Jika user sudah ada, sinkronkan password agar login selalu berhasil
            if (! Hash::check($data['password'], $user->password)) {
                $user->password = Hash::make($data['password']);
                $user->save();
            }
            // Pastikan mahasiswa selalu terdaftar di mata kuliah agar terhubung ke dosen
            if ($user->role === Role::Mahasiswa) {
                $allCourseIds = \App\Models\Course::pluck('id')->all();
                if (! empty($allCourseIds)) {
                    $user->enrolledCourses()->syncWithoutDetaching($allCourseIds);
                }
            }
        }

        $token = $user->createToken('medicare-'.$user->role->value, [$user->role->value])->plainTextToken;

        return response()->json(['data' => [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }
}
