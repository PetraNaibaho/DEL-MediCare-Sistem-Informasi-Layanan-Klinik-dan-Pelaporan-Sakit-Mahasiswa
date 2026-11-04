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

        $user = User::where('username', $data['username'])->where('role', $data['role'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
            ]);
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
