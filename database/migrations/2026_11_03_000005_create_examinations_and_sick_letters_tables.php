<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pickup_request_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users');
            $table->string('diagnosis')->nullable();
            // Rahasia: hanya boleh dibaca pihak klinik, tidak pernah dikirim ke role lain.
            $table->text('catatan_medis')->nullable();
            $table->boolean('is_sick')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sick_letters', function (Blueprint $table) {
            $table->id();
            $table->string('nomor')->unique(); // SS-2026-0001
            $table->foreignId('pickup_request_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('examination_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('doctor_id')->constrained('users');
            $table->string('keterangan');          // ringkasan diagnosis yang boleh dilihat dosen/keasramaan
            $table->date('mulai_izin');
            $table->date('selesai_izin');
            $table->string('asrama')->nullable();   // snapshot asrama mahasiswa saat surat terbit
            $table->timestamp('issued_at');
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sick_letters');
        Schema::dropIfExists('examinations');
    }
};
