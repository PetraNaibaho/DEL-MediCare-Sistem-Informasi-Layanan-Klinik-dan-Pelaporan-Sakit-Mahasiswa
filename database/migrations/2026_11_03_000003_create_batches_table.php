<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('status')->default('OPEN')->index();
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('window_opens_at')->nullable();
            $table->timestamp('window_closes_at')->nullable()->index();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('estimasi_tiba')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('clinic_arrived_at')->nullable();
            $table->timestamp('return_started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
