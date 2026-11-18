# DEL-MediCare — Backend (Laravel 13)

Backend REST API untuk prototipe **DEL-MediCare System** (Sistem Informasi Layanan Klinik Institut Teknologi Del).
Kode ini dibuat dari sumber prototipe Figma Make: 5 role, batching penjemputan, pemeriksaan klinik, e-Surat Sakit, dan notifikasi.

## Menjalankan

Syarat: PHP ≥ 8.3, Composer, SQLite/MySQL/PostgreSQL.

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Pasang Laravel Sanctum (token API). Perintah ini juga mendaftarkan route API.
php artisan install:api

# Opsional: unduh e-Surat Sakit sebagai PDF (tanpa ini endpoint /pdf mengembalikan HTML siap cetak)
composer require barryvdh/laravel-dompdf

php artisan migrate --seed
php artisan serve                # http://localhost:8000/api

# Penutupan batch otomatis (window 15 menit) — jalankan scheduler:
php artisan schedule:work        # development
# production (cron): * * * * * cd /path/backend && php artisan schedule:run >> /dev/null 2>&1
```

Menjalankan test: `php artisan test`

> `php artisan install:api` bisa menanyakan apakah migrasi dijalankan; jawab sesuka Anda, `migrate --seed` di atas tetap aman.
> Jika `install:api` mengganti `bootstrap/app.php` atau `routes/api.php`, pastikan alias middleware `role` (lihat `bootstrap/app.php`) dan route di `routes/api.php` dari proyek ini tetap ada.

## Akun demo (sama dengan halaman login prototipe)

| Role | Username | Password |
|------|----------|----------|
| Mahasiswa | `danu.siregar` | `mahasiswa123` |
| Driver | `hendra.putra` | `driver123` |
| Klinik | `maria.sihotang` | `klinik123` |
| Keasramaan | `kristian.sihombing` | `ksr123` |
| Dosen | `sudirman` | `dosen123` |

Mahasiswa demo lain: `reza.pratama`, `sarah.hutabarat`, `budi.santoso`, `lita.manullang`, `yuni.aritonang`, `ferry.simanjuntak` (password `mahasiswa123`).
**Ganti semua password sebelum deploy.**

## Autentikasi

`POST /api/auth/login` dengan `{ "role": "mahasiswa", "username": "...", "password": "..." }` → `data.token`.
Kirim `Authorization: Bearer <token>` pada request berikutnya. Role harus sesuai dengan akun (sama seperti pemilih role di halaman login).

## Alur status permintaan

```
WAITING → BATCHED → DRIVER_ACCEPTED → DRIVER_ON_THE_WAY → PICKED_UP → AT_CLINIC
  → (WAITING_EXAM) → IN_EXAMINATION
      ├─ tidak sakit → EXAM_COMPLETED ─┐
      └─ sakit → SICK_CONFIRMED → E_SICK_LETTER_ISSUED ─┤
                                                         └→ RETURN_PENDING → RETURNED → COMPLETED
```

Perubahan status hanya lewat `RequestFlowService::transition()` (validasi transisi + log di `request_status_logs`).

Aturan bisnis (dapat diubah di `config/medicare.php` / `.env`):
- **Batching**: request masuk batch terbuka; batch ditutup saat **5 mahasiswa** atau window **15 menit** habis (`medicare:close-batches`, tiap menit).
- Driver hanya boleh memegang **satu batch aktif**; batch diambil driver pertama yang menerima.
- **Return trip** aktif bila **3 mahasiswa** (atau semua anggota bila kurang dari 3) sudah selesai diperiksa.
- Nomor antrean berurutan dan di-reset tiap hari. Nomor surat: `SS-<tahun>-<0001>`.
- Izin sakit maksimal 14 hari.

## Endpoint

Semua di bawah `/api`, kecuali login dan tautan publik wajib `Bearer token`. Role salah → `403`, transisi tidak valid → `422`.

**Umum**
| Method | Path | Keterangan |
|---|---|---|
| POST | `/auth/login` | Login |
| GET | `/auth/me` · POST `/auth/logout` | Profil · keluar |
| GET | `/notifications` | Daftar notifikasi (+ `meta_unread`) |
| GET | `/notifications/unread-count` | Jumlah belum dibaca (badge lonceng) |
| POST | `/notifications/{id}/read` · `/notifications/read-all` | Tandai dibaca |
| GET | `/e-surat/{nomor}/verify` | Tautan publik "Bagikan" (signed URL, 7 hari, tanpa diagnosis) |

**Mahasiswa** (`/mahasiswa`)
| Method | Path | Menu prototipe |
|---|---|---|
| GET | `/dashboard` | Dashboard |
| POST | `/requests` `{keluhan, lokasi}` | Daftar Pemeriksaan |
| GET | `/requests/active` | Status & Antrean (termasuk `alur`) |
| GET | `/requests` | Riwayat Layanan |
| GET | `/letters` · `/letters/{id}` | e-Surat Sakit |
| GET | `/letters/{id}/pdf` | Unduh PDF |
| POST | `/letters/{id}/share` | Bagikan |

**Driver** (`/driver`)
| Method | Path | Menu prototipe |
|---|---|---|
| GET | `/dashboard` | Dashboard |
| GET | `/batches` | Daftar Batch |
| POST | `/batches/{id}/accept` | Accept Batch |
| POST | `/batches/{id}/start` | Mulai menjemput |
| POST | `/requests/{id}/pickup` | Tandai mahasiswa dijemput |
| POST | `/batches/{id}/arrive-clinic` | Konfirmasi Tiba di Klinik |
| GET | `/trip` | Trip Aktif |
| GET | `/return-trip` | Return Trip (status trigger) |
| POST | `/batches/{id}/return/start` · `/return/complete` | Mulai Antar · Selesai |
| GET | `/history` | Riwayat Perjalanan |

**Klinik** (`/klinik`)
| Method | Path | Menu prototipe |
|---|---|---|
| GET | `/dashboard` | Dashboard |
| GET | `/queue` | Antrean Masuk |
| POST | `/requests/{id}/start-exam` | Tombol Periksa |
| POST | `/requests/{id}/complete-exam` `{diagnosis, catatan_medis, is_sick, mulai_izin, selesai_izin}` | Pemeriksaan |
| GET | `/letters` · `/letters/{id}` | e-Surat Sakit |
| GET | `/history` | Riwayat Pemeriksaan |

**Keasramaan** (`/keasramaan`)
| Method | Path | Menu prototipe |
|---|---|---|
| GET | `/dashboard` | Dashboard |
| GET | `/sick-students?aktif=1` | Daftar Mahasiswa Sakit |
| GET | `/letters/{id}` | e-Surat Sakit |
| GET | `/verifications` · POST `/letters/{id}/verify` | Verifikasi Izin |
| GET | `/letters/{id}/proof` | Unduh Bukti Izin |

**Dosen** (`/dosen`)
| Method | Path | Menu prototipe |
|---|---|---|
| GET | `/dashboard` | Dashboard |
| GET | `/absent` | Mahasiswa Izin (satu baris per surat × mata kuliah) |
| GET | `/letters/{id}` | e-Surat Sakit |

## Privasi data medis

- `examinations.catatan_medis` **tidak pernah** dikirim ke role mana pun lewat API (disembunyikan di model dan tidak ada di resource). Hanya tersimpan untuk kebutuhan klinik.
- Dosen hanya melihat: nama, NIM, keterangan (diagnosis ringkas), periode izin, dokter, mata kuliah terkait. Dosen hanya bisa membuka surat mahasiswanya sendiri (`SickLetterPolicy`).
- Tautan "Bagikan" publik tidak memuat diagnosis.
- Pertimbangkan apakah kolom `keterangan` (nama penyakit) memang boleh tampil di dosen/keasramaan sesuai kebijakan IT Del; prototipe menampilkannya, jadi API mengikuti, tetapi mudah dihapus di `SickLetterResource`.

## Struktur

```
app/Enums            Role, RequestStatus, BatchStatus
app/Models           User, Course, Batch, PickupRequest, Examination, SickLetter, UserNotification, RequestStatusLog
app/Services         BatchingService, RequestFlowService, SickLetterService, NotificationService, LetterPdfService
app/Http/Controllers/Api   Auth, Notification, Mahasiswa, Driver, Klinik, Keasramaan, Dosen, PublicLetter
app/Http/Resources   keluaran JSON (SickLetterResource menyesuaikan isi dengan role)
app/Http/Middleware  EnsureRole (alias `role`)
app/Policies         SickLetterPolicy
app/Console/Commands medicare:close-batches
config/medicare.php  aturan batching, lokasi penjemputan, data klinik
database             migrasi + DatabaseSeeder (data demo)
routes/api.php       seluruh endpoint
tests/Feature        MediCareFlowTest
```
