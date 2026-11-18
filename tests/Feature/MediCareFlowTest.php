<?php

namespace Tests\Feature;

use App\Enums\BatchStatus;
use App\Enums\RequestStatus;
use App\Enums\Role;
use App\Models\Batch;
use App\Models\Course;
use App\Models\PickupRequest;
use App\Models\SickLetter;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Menguji alur utama DEL-MediCare. Membutuhkan Laravel Sanctum
 * (`php artisan install:api`) agar Sanctum::actingAs tersedia.
 */
class MediCareFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function user(string $username): User
    {
        return User::where('username', $username)->firstOrFail();
    }

    public function test_login_requires_matching_role(): void
    {
        $this->postJson('/api/auth/login', [
            'role' => 'driver', 'username' => 'danu.siregar', 'password' => 'mahasiswa123',
        ])->assertStatus(422);

        $this->postJson('/api/auth/login', [
            'role' => 'mahasiswa', 'username' => 'danu.siregar', 'password' => 'mahasiswa123',
        ])->assertOk()->assertJsonPath('data.user.role', 'mahasiswa')->assertJsonStructure(['data' => ['token']]);
    }

    public function test_role_middleware_blocks_other_roles(): void
    {
        Sanctum::actingAs($this->user('danu.siregar'));

        $this->getJson('/api/driver/batches')->assertForbidden();
        $this->getJson('/api/klinik/queue')->assertForbidden();
    }

    public function test_full_flow_from_request_to_sick_letter(): void
    {
        $danu = $this->user('danu.siregar');
        $dosen = $this->user('sudirman');

        // Hasil seeder bergantung hari (Senin); pakai satu mata kuliah uji pada hari ini agar deterministik.
        Course::query()->delete();
        $course = Course::create([
            'kode' => 'IF-TEST', 'nama' => 'Mata Kuliah Uji', 'dosen_id' => $dosen->id,
            'hari' => today()->dayOfWeekIso, 'jam_mulai' => '08:00', 'jam_selesai' => '10:00',
        ]);
        $course->students()->syncWithoutDetaching([$danu->id]);

        // 1. Mahasiswa mendaftar pemeriksaan
        Sanctum::actingAs($danu);
        $response = $this->postJson('/api/mahasiswa/requests', [
            'keluhan' => 'Demam dan sakit kepala', 'lokasi' => 'Asrama Putra Blok B',
        ])->assertCreated()->assertJsonPath('data.status', 'WAITING');

        $id = $response->json('data.id');

        // Tidak boleh punya dua permintaan aktif
        $this->postJson('/api/mahasiswa/requests', [
            'keluhan' => 'Lagi', 'lokasi' => 'Gedung B',
        ])->assertStatus(422);

        // 2. Window 15 menit habis → batch ditutup
        $this->travel(16)->minutes();
        $this->artisan('medicare:close-batches')->assertSuccessful();

        $pickup = PickupRequest::findOrFail($id);
        $this->assertSame(RequestStatus::Batched, $pickup->status);
        $batchId = $pickup->batch_id;

        // 3. Driver: accept → start → pickup → arrive-clinic
        Sanctum::actingAs($this->user('hendra.putra'));
        $this->postJson("/api/driver/batches/{$batchId}/accept")->assertOk()->assertJsonPath('data.status', 'ACCEPTED');
        $this->postJson("/api/driver/batches/{$batchId}/start")->assertOk();
        $this->postJson("/api/driver/requests/{$id}/pickup")->assertOk()->assertJsonPath('data.status', 'PICKED_UP');
        $this->postJson("/api/driver/batches/{$batchId}/arrive-clinic")->assertOk()->assertJsonPath('data.status', 'AT_CLINIC');

        // 4. Klinik: periksa & terbitkan e-Surat Sakit
        Sanctum::actingAs($this->user('maria.sihotang'));
        $this->postJson("/api/klinik/requests/{$id}/complete-exam", [
            'diagnosis' => 'Demam Tifoid',
            'catatan_medis' => 'Rahasia: hasil lab Widal positif.',
            'is_sick' => true,
            'mulai_izin' => today()->toDateString(),
            'selesai_izin' => today()->addDays(2)->toDateString(),
        ])->assertOk()->assertJsonPath('data.status', 'E_SICK_LETTER_ISSUED');

        $letter = SickLetter::firstOrFail();
        $this->assertSame('Demam Tifoid', $letter->keterangan);
        $this->assertMatchesRegularExpression('/^SS-\d{4}-0001$/', $letter->nomor);

        // 5. Return trip (anggota batch hanya 1 → trigger aktif)
        Sanctum::actingAs($this->user('hendra.putra'));
        $this->getJson('/api/driver/return-trip')->assertOk()->assertJsonPath('data.trigger_aktif', true);
        $this->postJson("/api/driver/batches/{$batchId}/return/start")->assertOk()->assertJsonPath('data.status', 'RETURNING');
        $this->postJson("/api/driver/batches/{$batchId}/return/complete")->assertOk()->assertJsonPath('data.status', 'COMPLETED');

        $this->assertSame(RequestStatus::Completed, $pickup->fresh()->status);
        $this->assertSame(BatchStatus::Completed, Batch::find($batchId)->status);

        // 6. Notifikasi sampai ke mahasiswa, keasramaan, dan dosen
        $this->assertDatabaseHas('user_notifications', ['user_id' => $danu->id, 'type' => 'letter']);
        $this->assertDatabaseHas('user_notifications', ['user_id' => $this->user('kristian.sihombing')->id, 'type' => 'letter']);
        $this->assertDatabaseHas('user_notifications', ['user_id' => $dosen->id, 'type' => 'letter']);

        // 7. Dosen melihat surat, tanpa catatan medis & asrama
        Sanctum::actingAs($dosen);
        $this->getJson('/api/dosen/absent')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nomor', $letter->nomor)
            ->assertJsonPath('data.0.matkul', 'Mata Kuliah Uji')
            ->assertJsonMissingPath('data.0.catatan_medis')
            ->assertJsonMissingPath('data.0.asrama');

        $this->getJson("/api/dosen/letters/{$letter->id}")->assertOk()->assertJsonMissingPath('data.catatan_medis');

        // Mahasiswa lain tidak boleh membuka surat orang lain
        Sanctum::actingAs($this->user('reza.pratama'));
        $this->getJson("/api/mahasiswa/letters/{$letter->id}")->assertForbidden();

        // Keasramaan dapat memverifikasi
        Sanctum::actingAs($this->user('kristian.sihombing'));
        $this->postJson("/api/keasramaan/letters/{$letter->id}/verify")->assertOk()->assertJsonPath('data.terverifikasi', true);
    }

    public function test_batch_is_closed_when_full_and_next_request_opens_new_batch(): void
    {
        $students = User::where('role', Role::Mahasiswa->value)->orderBy('id')->take(6)->get();
        $this->assertCount(6, $students);

        foreach ($students as $student) {
            Sanctum::actingAs($student);
            $this->postJson('/api/mahasiswa/requests', [
                'keluhan' => 'Pusing', 'lokasi' => 'Gedung C',
            ])->assertCreated();
        }

        $this->assertSame(2, Batch::count());

        $first = Batch::orderBy('id')->first();
        $this->assertSame(BatchStatus::Pending, $first->status);
        $this->assertSame(5, $first->requests()->count());
        $this->assertSame(
            5,
            $first->requests()->where('status', RequestStatus::Batched->value)->count(),
        );

        $second = Batch::orderByDesc('id')->first();
        $this->assertSame(BatchStatus::Open, $second->status);
        $this->assertSame(1, $second->requests()->count());

        // Nomor antrean berurutan 1..6
        $this->assertSame([1, 2, 3, 4, 5, 6], PickupRequest::orderBy('nomor_antrean')->pluck('nomor_antrean')->all());
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        Sanctum::actingAs($this->user('danu.siregar'));
        $id = $this->postJson('/api/mahasiswa/requests', [
            'keluhan' => 'Batuk', 'lokasi' => 'Gedung B',
        ])->json('data.id');

        // Klinik tidak bisa menyelesaikan pemeriksaan sebelum mahasiswa tiba di klinik
        Sanctum::actingAs($this->user('maria.sihotang'));
        $this->postJson("/api/klinik/requests/{$id}/complete-exam", [
            'diagnosis' => 'ISPA', 'is_sick' => false,
        ])->assertStatus(422);
    }
}
