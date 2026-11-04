<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique();
            $table->string('role')->default('mahasiswa')->index();
            // NIM (mahasiswa) atau kode pegawai: DRV-002, KLN-001, KSR-003, DSN-014
            $table->string('identifier')->nullable()->unique();
            $table->string('asrama')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropUnique(['identifier']);
            $table->dropIndex(['role']);
            $table->dropColumn(['username', 'role', 'identifier', 'asrama']);
        });
    }
};
