/**
 * DEL-MediCare - Global Configuration & Constants
 */

const Config = {
  // Ambil custom API URL dari localStorage atau auto-detect dari server
  getApiBaseUrl() {
    // 1. Jika diinjeksi langsung oleh Laravel Blade (Satu Kesatuan / Monolith)
    if (window.LARAVEL_API_URL) {
      return window.LARAVEL_API_URL.replace(/\/+$/, '');
    }

    const saved = localStorage.getItem('medicare_api_url');
    if (saved) return saved.replace(/\/+$/, '');
    
    // 2. Auto-detect jika diakses via Apache Laragon (/public/)
    const loc = window.location;
    if (loc.pathname.includes('/public')) {
      const publicBase = loc.pathname.substring(0, loc.pathname.indexOf('/public') + 7);
      return `${loc.origin}${publicBase}/api`;
    }

    // 3. Auto-detect jika dibuka dari folder frontend di Laragon
    if (loc.pathname.includes('/frontend')) {
      return `${loc.origin}/backend-laravel/backend/public/api`;
    }

    // 4. Jika dibuka via php artisan serve di port 8000
    if (loc.port === '8000') {
      return `${loc.origin}/api`;
    }
    
    // 5. Default fallback
    return 'http://localhost:8000/api';
  },

  setApiBaseUrl(url) {
    if (!url) return;
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem('medicare_api_url', cleanUrl);
  },

  // 5 Role Sesuai DEL-MediCare Backend
  ROLES: {
    MAHASISWA: 'mahasiswa',
    DRIVER: 'driver',
    KLINIK: 'klinik',
    KEASRAMAAN: 'keasramaan',
    DOSEN: 'dosen'
  },

  // Pilihan Lokasi Penjemputan Resmi (dari config/medicare.php)
  LOKASI_PENJEMPUTAN: [
    'Asrama Putra Blok A',
    'Asrama Putra Blok B',
    'Asrama Putri Blok A',
    'Asrama Putri Blok B',
    'Asrama Putri Blok C',
    'Gedung A Lantai 1',
    'Gedung A Lantai 2',
    'Gedung B',
    'Gedung C',
    'Lapangan Utama'
  ],

  // Status mapping & warna badge
  STATUS_BADGES: {
    WAITING: { label: 'Menunggu Batch', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    BATCHED: { label: 'Batch Terbentuk', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    DRIVER_ACCEPTED: { label: 'Driver Ditugaskan', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    DRIVER_ON_THE_WAY: { label: 'Driver Menuju Lokasi', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    PICKED_UP: { label: 'Mahasiswa Dijemput', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    AT_CLINIC: { label: 'Tiba di Klinik', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    WAITING_EXAM: { label: 'Menunggu Pemeriksaan', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
    IN_EXAMINATION: { label: 'Sedang Diperiksa', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    EXAM_COMPLETED: { label: 'Pemeriksaan Selesai', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    SICK_CONFIRMED: { label: 'Dikonfirmasi Sakit', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    E_SICK_LETTER_ISSUED: { label: 'e-Surat Diterbitkan', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    RETURN_PENDING: { label: 'Menunggu Antar Pulang', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    RETURNED: { label: 'Selesai Diantar Pulang', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    COMPLETED: { label: 'Selesai Layanan', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    // Status Batch
    OPEN: { label: 'Mengumpulkan Mahasiswa', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    PENDING: { label: 'Menunggu Driver', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    ACCEPTED: { label: 'Driver Ditugaskan', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    ON_TRIP: { label: 'Trip Berjalan', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    RETURNING: { label: 'Return Trip Berjalan', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  },

  getStatusBadge(statusKey) {
    const key = (statusKey || '').toUpperCase();
    const badge = this.STATUS_BADGES[key] || { label: statusKey, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}">${badge.label}</span>`;
  }
};

window.Config = Config;
