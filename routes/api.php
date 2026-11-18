<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DosenController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\KeasramaanController;
use App\Http\Controllers\Api\KlinikController;
use App\Http\Controllers\Api\MahasiswaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PublicLetterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| DEL-MediCare API (prefix /api)
|--------------------------------------------------------------------------
*/

// ── Autentikasi ──────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Tautan publik "Bagikan" e-Surat Sakit (signed URL, tanpa login)
Route::get('e-surat/{nomor}/verify', [PublicLetterController::class, 'verify'])
    ->middleware('signed')
    ->name('letters.public');

Route::middleware('auth:sanctum')->group(function () {

    // ── Notifikasi (semua role) ──────────────────────────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('read-all', [NotificationController::class, 'markAllRead']);
        Route::post('{id}/read', [NotificationController::class, 'markRead']);
    });

    // ── Mahasiswa ────────────────────────────────────────────────────────
    Route::prefix('mahasiswa')->middleware('role:mahasiswa')->group(function () {
        Route::get('dashboard', [MahasiswaController::class, 'dashboard']);
        Route::post('requests', [MahasiswaController::class, 'storeRequest']);
        Route::get('requests', [MahasiswaController::class, 'history']);
        Route::get('requests/active', [MahasiswaController::class, 'activeStatus']);
        Route::get('letters', [MahasiswaController::class, 'letters']);
        Route::get('letters/{letter}', [MahasiswaController::class, 'showLetter']);
        Route::get('letters/{letter}/pdf', [MahasiswaController::class, 'pdf']);
        Route::post('letters/{letter}/share', [MahasiswaController::class, 'share']);
    });

    // ── Driver ───────────────────────────────────────────────────────────
    Route::prefix('driver')->middleware('role:driver')->group(function () {
        Route::get('dashboard', [DriverController::class, 'dashboard']);
        Route::get('batches', [DriverController::class, 'batches']);
        Route::post('batches/{batch}/accept', [DriverController::class, 'accept']);
        Route::post('batches/{batch}/start', [DriverController::class, 'start']);
        Route::post('batches/{batch}/arrive-clinic', [DriverController::class, 'arriveClinic']);
        Route::post('requests/{pickupRequest}/pickup', [DriverController::class, 'pickup']);
        Route::get('trip', [DriverController::class, 'trip']);
        Route::get('return-trip', [DriverController::class, 'returnTrip']);
        Route::post('batches/{batch}/return/start', [DriverController::class, 'startReturn']);
        Route::post('batches/{batch}/return/complete', [DriverController::class, 'completeReturn']);
        Route::get('history', [DriverController::class, 'history']);
    });

    // ── Klinik ───────────────────────────────────────────────────────────
    Route::prefix('klinik')->middleware('role:klinik')->group(function () {
        Route::get('dashboard', [KlinikController::class, 'dashboard']);
        Route::get('queue', [KlinikController::class, 'queue']);
        Route::post('requests/{pickupRequest}/start-exam', [KlinikController::class, 'startExam']);
        Route::post('requests/{pickupRequest}/complete-exam', [KlinikController::class, 'completeExam']);
        Route::post('requests/{pickupRequest}/exam', [KlinikController::class, 'completeExam']);
        Route::get('letters', [KlinikController::class, 'letters']);
        Route::get('letters/{letter}', [KlinikController::class, 'showLetter']);
        Route::get('history', [KlinikController::class, 'history']);
    });

    // ── Keasramaan ───────────────────────────────────────────────────────
    Route::prefix('keasramaan')->middleware('role:keasramaan')->group(function () {
        Route::get('dashboard', [KeasramaanController::class, 'dashboard']);
        Route::get('sick-students', [KeasramaanController::class, 'sickStudents']);
        Route::get('letters/{letter}', [KeasramaanController::class, 'showLetter']);
        Route::get('letters/{letter}/proof', [KeasramaanController::class, 'proof']);
        Route::get('verifications', [KeasramaanController::class, 'verifications']);
        Route::post('letters/verify-multiple', [KeasramaanController::class, 'verifyMultiple']);
        Route::post('letters/{letter}/verify', [KeasramaanController::class, 'verify']);
    });

    // ── Dosen ────────────────────────────────────────────────────────────
    Route::prefix('dosen')->middleware('role:dosen')->group(function () {
        Route::get('dashboard', [DosenController::class, 'dashboard']);
        Route::get('absent', [DosenController::class, 'absent']);
        Route::get('letters/{letter}', [DosenController::class, 'showLetter']);
    });
});
