<?php

namespace App\Http\Resources;

use App\Enums\Role;
use App\Services\SickLetterService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Isi surat dibatasi per role. Catatan medis (examinations.catatan_medis) TIDAK PERNAH disertakan.
 *
 * @mixin \App\Models\SickLetter
 */
class SickLetterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $role = $request->user()?->role;

        $data = [
            'id' => $this->id,
            'nomor' => $this->nomor,
            'nama' => $this->student->name,
            'nim' => $this->student->identifier,
            'tanggal_terbit' => $this->issued_at->translatedFormat('d M Y'),
            'keterangan' => $this->keterangan,
            'mulai_izin' => $this->mulai_izin->toDateString(),
            'mulai_izin_label' => $this->mulai_izin->translatedFormat('d M Y'),
            'selesai_izin' => $this->selesai_izin->toDateString(),
            'selesai_izin_label' => $this->selesai_izin->translatedFormat('d M Y'),
            'dokter' => $this->doctor->name,
            'aktif' => $this->isActive(),
        ];

        if (in_array($role, [Role::Mahasiswa, Role::Klinik, Role::Keasramaan], true)) {
            $data['asrama'] = $this->asrama;
        }

        if ($role === Role::Klinik) {
            $service = app(SickLetterService::class);
            $data['distribusi'] = [
                'mahasiswa' => $this->student->name,
                'dosen' => $service->affectedCourses($this->resource)->pluck('dosen.name')->unique()->values(),
                'keasramaan' => $this->asrama,
            ];
        }

        if ($role === Role::Keasramaan) {
            $data['terverifikasi'] = $this->verified_at !== null;
            $data['diverifikasi_pada'] = $this->verified_at?->toIso8601String();
        }

        return $data;
    }
}
