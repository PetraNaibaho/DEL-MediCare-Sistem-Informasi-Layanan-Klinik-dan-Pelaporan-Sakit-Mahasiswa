<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pickup_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('batches')->nullOnDelete();
            $table->text('keluhan');
            $table->string('lokasi');
            $table->string('status')->default('WAITING')->index();
            $table->unsignedInteger('nomor_antrean');
            $table->date('queue_date');
            $table->timestamp('requested_at');
            $table->timestamps();

            // Nomor antrean di-reset setiap hari.
            $table->unique(['queue_date', 'nomor_antrean']);
        });

        Schema::create('request_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pickup_request_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_status_logs');
        Schema::dropIfExists('pickup_requests');
    }
};
