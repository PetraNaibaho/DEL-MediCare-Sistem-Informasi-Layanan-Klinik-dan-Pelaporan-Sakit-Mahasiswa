<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>DEL-MediCare — Sistem Informasi Layanan Klinik IT Del</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏥</text></svg>">
  
  <!-- Google Fonts: Plus Jakarta Sans & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          },
          colors: {
            primary: {
              50: '#eff6ff',
              100: '#dbeafe',
              200: '#bfdbfe',
              500: '#2563eb',
              600: '#1d4ed8',
              700: '#1e40af',
              800: '#1e3a8a',
              900: '#172554'
            },
            del: {
              blue: '#0F4C81',
              dark: '#0A2540',
              gold: '#F2A900',
              teal: '#008B8B',
              indigo: '#1E1B4B'
            },
            medical: {
              blue: '#0284c7',
              teal: '#0d9488',
              mint: '#10b981',
              soft: '#f0fdfa'
            }
          }
        }
      }
    }
  </script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="{{ asset('frontend/css/style.css') }}">

  <!-- Injeksi Otomatis Endpoint API dari Laravel (Bebas Masalah Port & CORS) -->
  <script>
    window.LARAVEL_API_URL = "{{ url('/api') }}";
    window.YAYASAN_DEL_LOGO = "{{ asset('frontend/images/yayasan-del.png') }}";
  </script>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans antialiased overflow-x-hidden relative selection:bg-blue-100 selection:text-blue-900">

  <!-- Real-Time Falling Snow Canvas (Gentle Winter Atmosphere) -->
  <canvas id="snow-canvas" class="fixed inset-0 pointer-events-none z-30"></canvas>

  <!-- Toast Notification Container -->
  <div id="toast-container" class="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"></div>

  <!-- Global Navigation Header (Hidden on Login Screen, Shown when Authenticated) -->
  <header id="global-header" class="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs hidden">
    <div class="w-full px-4 sm:px-8 lg:px-12 h-18 py-2 flex items-center justify-between">
      
      <!-- Yayasan Del & Institut Teknologi Del Institutional Brand Badge (Pertamina-Style Pill Card) -->
      <a href="#" onclick="window.App.navigateHome(event)" class="group flex items-center gap-3 bg-white hover:bg-slate-50/90 px-3.5 py-1.5 rounded-2xl border border-slate-200/90 shadow-xs transition hover:shadow-sm">
        <!-- Logo Yayasan Del -->
        <div class="h-10 w-10 sm:h-11 sm:w-11 shrink-0 flex items-center justify-center p-0.5">
          <img src="{{ asset('frontend/images/yayasan-del.png') }}" alt="Logo Yayasan Del" class="h-full w-full object-contain">
        </div>
        
        <div class="border-l border-slate-200 pl-3">
          <div class="flex items-center gap-2">
            <span class="text-sm sm:text-base font-extrabold text-[#0F4C81] tracking-tight group-hover:text-blue-700 transition">
              Institut Teknologi Del
            </span>
            <span class="hidden md:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Klinik Del
            </span>
          </div>
          <p class="text-[11px] text-slate-500 font-medium hidden sm:block">DEL-MediCare &bull; Layanan Kesehatan Kampus</p>
        </div>
      </a>

      <!-- Navigation Tabs (Only when logged in) -->
      <nav id="role-nav" class="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm font-medium text-slate-600">
        <!-- Dynamically injected per role -->
      </nav>

      <!-- User Profile & Action Menu -->
      <div class="flex items-center gap-2.5">
        
        <!-- Snow Effect Quick Toggle -->
        <button onclick="window.App.toggleSnow()" id="snow-toggle-btn" class="px-2.5 py-1.5 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/80 hover:bg-sky-100 transition flex items-center gap-1.5 shadow-xs" title="Efek Salju Dashboard">
          <span class="text-sm">❄️</span>
          <span class="hidden sm:inline">Salju: <span id="snow-status-text">Aktif</span></span>
        </button>

        <!-- Notification Bell (when logged in) -->
        <div id="notif-wrapper" class="relative hidden">
          <button id="notif-bell-btn" onclick="window.Notifications.toggleDropdown()" class="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
            <i data-lucide="bell" class="w-5 h-5"></i>
            <span id="notif-badge" class="hidden absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
          </button>
          
          <!-- Dropdown Notifikasi -->
          <div id="notif-dropdown" class="hidden absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            <div class="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span class="font-semibold text-sm text-slate-800">Notifikasi</span>
              <button onclick="window.Notifications.markAllRead()" class="text-xs text-blue-600 hover:underline">Tandai semua dibaca</button>
            </div>
            <div id="notif-list" class="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
              <div class="p-4 text-center text-slate-400">Memuat notifikasi...</div>
            </div>
          </div>
        </div>

        <!-- User Info / Auth Buttons -->
        <div id="auth-section">
          <!-- Injected via Auth.renderHeader() -->
        </div>

      </div>
    </div>
  </header>

  <!-- Main Application Content Area (Full Screen Responsive) -->
  <main id="main-content" class="flex-1 w-full p-0">
    <div id="app-view" class="w-full">
      <!-- Active View is mounted here dynamically -->
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-slate-500">Memuat DEL-MediCare...</p>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer (Hidden on Login Screen, Shown when Authenticated) -->
  <footer id="global-footer" class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto hidden">
    <div class="w-full px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p>&copy; 2026 Institut Teknologi Del — DEL-MediCare System. All rights reserved.</p>
      <div class="flex items-center gap-4 text-slate-600">
        <button onclick="window.App.showPublicVerifyPrompt()" class="hover:text-blue-600 underline">Cek Keaslian e-Surat</button>
        <span>&bull;</span>
        <span>Laravel 13 Monolith SPA</span>
      </div>
    </div>
  </footer>

  <!-- MODAL CONTAINER (For Forms, Popups, Details, etc.) -->
  <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden flex items-center justify-center p-4">
    <div id="modal-box" class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
      <!-- Modal Content Dynamic -->
    </div>
  </div>

  <!-- API CONFIG MODAL -->
  <div id="api-config-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <i data-lucide="server" class="w-5 h-5 text-blue-600"></i>
          Konfigurasi Endpoint API
        </h3>
        <button onclick="window.App.closeApiConfigModal()" class="text-slate-400 hover:text-slate-600">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <p class="text-xs text-slate-600 mb-4">
        Saat ini aplikasi berjalan dalam satu server terpadu. Endpoint API terhubung secara otomatis:
      </p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">API Base URL Aktif:</label>
          <input type="text" id="input-api-url" class="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value="{{ url('/api') }}">
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button type="button" onclick="window.App.closeApiConfigModal()" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Tutup</button>
        <button type="button" onclick="window.App.saveApiUrl()" class="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">Simpan</button>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="{{ asset('frontend/js/config.js') }}"></script>
  <script src="{{ asset('frontend/js/api.js') }}"></script>
  <script src="{{ asset('frontend/js/auth.js') }}"></script>
  <script src="{{ asset('frontend/js/notifications.js') }}"></script>
  <script src="{{ asset('frontend/js/views/mahasiswa.js') }}"></script>
  <script src="{{ asset('frontend/js/views/driver.js') }}"></script>
  <script src="{{ asset('frontend/js/views/klinik.js') }}"></script>
  <script src="{{ asset('frontend/js/views/keasramaan.js') }}"></script>
  <script src="{{ asset('frontend/js/views/dosen.js') }}"></script>
  <script src="{{ asset('frontend/js/views/public-verify.js') }}"></script>
  <script src="{{ asset('frontend/js/snow.js') }}"></script>
  <script src="{{ asset('frontend/js/app.js') }}"></script>

</body>
</html>
