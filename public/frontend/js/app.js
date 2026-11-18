/**
 * DEL-MediCare - Main Application Controller & Router
 */

const App = {
  activeRole: null,
  activeTab: 'dashboard',

  async init() {
    // Set API URL display in top bar
    const currentUrlEl = document.getElementById('current-api-url');
    if (currentUrlEl) currentUrlEl.textContent = Config.getApiBaseUrl();

    // Inisialisasi autentikasi
    await Auth.init();

    // Cek koneksi backend secara asinkron
    Api.testConnection();

    // Pasang listener klik luar untuk dropdown notifikasi & modal
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notif-dropdown');
      const notifBtn = document.getElementById('notif-bell-btn');
      if (dropdown && !dropdown.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
        dropdown.classList.add('hidden');
        Notifications.isOpen = false;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeApiConfigModal();
      }
    });

    // Cek apakah ada query param untuk public verification
    const params = new URLSearchParams(window.location.search);
    if (params.has('signature') || params.has('verify')) {
      this.showPublicVerifyPrompt();
      return;
    }

    // Inisialisasi efek salju lembut untuk dashboard & portal
    if (window.SnowEffect) {
      window.SnowEffect.init();
    }

    // Render halaman
    this.render();
  },

  render() {
    Auth.renderHeader();
    const appView = document.getElementById('app-view');
    const roleNav = document.getElementById('role-nav');
    const globalHeader = document.getElementById('global-header');
    const globalFooter = document.getElementById('global-footer');
    const mainContent = document.getElementById('main-content');

    if (!Auth.isLoggedIn()) {
      if (globalHeader) globalHeader.classList.add('hidden');
      if (globalFooter) globalFooter.classList.add('hidden');
      if (mainContent) mainContent.className = 'flex-1 w-full p-0 min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-blue-50/40 flex flex-col';
      document.body.className = 'bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans antialiased overflow-x-hidden relative selection:bg-blue-100 selection:text-blue-900';
      if (roleNav) {
        roleNav.classList.add('hidden');
        roleNav.innerHTML = '';
      }
      if (appView) {
        appView.className = 'w-full min-h-screen';
        appView.innerHTML = Auth.renderLoginForm();
        if (window.lucide) lucide.createIcons({ root: appView });
      }
      return;
    }

    if (globalHeader) globalHeader.classList.remove('hidden');
    if (globalFooter) globalFooter.classList.remove('hidden');
    if (mainContent) mainContent.className = 'flex-1 w-full px-4 sm:px-8 lg:px-12 py-6';
    document.body.className = 'bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans antialiased overflow-x-hidden';
    if (appView) appView.className = 'w-full';

    const user = Auth.getUser();
    this.activeRole = user.role;

    // Render navigation tabs
    this.renderNavTabs(user.role);

    // Inisialisasi notifikasi & live updates antar peran
    Notifications.init();
    this.startLiveUpdates();

    // Render view role aktif
    this.renderRoleView(this.activeTab);
  },

  startLiveUpdates() {
    if (this.liveUpdateTimer) clearInterval(this.liveUpdateTimer);
    this.liveUpdateTimer = setInterval(() => {
      const modalBackdrop = document.getElementById('modal-backdrop');
      const isModalOpen = modalBackdrop && !modalBackdrop.classList.contains('hidden');
      if (Auth.isLoggedIn() && !isModalOpen && this.activeTab) {
        this.renderRoleView(this.activeTab, true);
      }
    }, 6000);
  },

  renderNavTabs(role) {
    const roleNav = document.getElementById('role-nav');
    if (!roleNav) return;

    let items = [];
    if (role === Config.ROLES.MAHASISWA) items = MahasiswaView.getNavItems();
    else if (role === Config.ROLES.DRIVER) items = DriverView.getNavItems();
    else if (role === Config.ROLES.KLINIK) items = KlinikView.getNavItems();
    else if (role === Config.ROLES.KEASRAMAAN) items = KeasramaanView.getNavItems();
    else if (role === Config.ROLES.DOSEN) items = DosenView.getNavItems();

    roleNav.classList.remove('hidden');
    roleNav.innerHTML = items.map(item => {
      const isActive = this.activeTab === item.id;
      const activeClass = isActive ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900';
      return `
        <button onclick="window.App.switchTab('${item.id}')" class="px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs ${activeClass}">
          <i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i>
          <span>${item.label}</span>
        </button>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons({ root: roleNav });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    this.renderNavTabs(this.activeRole);
    this.renderRoleView(tabId);
  },

  renderRoleView(tab, isSilent = false) {
    const appView = document.getElementById('app-view');
    const role = this.activeRole;

    if (role === Config.ROLES.MAHASISWA) {
      MahasiswaView.render(appView, tab, isSilent);
    } else if (role === Config.ROLES.DRIVER) {
      DriverView.render(appView, tab, isSilent);
    } else if (role === Config.ROLES.KLINIK) {
      KlinikView.render(appView, tab, isSilent);
    } else if (role === Config.ROLES.KEASRAMAAN) {
      KeasramaanView.render(appView, tab, isSilent);
    } else if (role === Config.ROLES.DOSEN) {
      DosenView.render(appView, tab, isSilent);
    }
  },

  navigateHome(e) {
    if (e) e.preventDefault();
    if (Auth.isLoggedIn()) {
      this.switchTab('dashboard');
    } else {
      this.render();
    }
  },

  setView(viewName) {
    if (viewName === 'login') {
      this.render();
    }
  },

  showPublicVerifyPrompt() {
    const globalHeader = document.getElementById('global-header');
    const globalFooter = document.getElementById('global-footer');
    const mainContent = document.getElementById('main-content');
    if (globalHeader) globalHeader.classList.remove('hidden');
    if (globalFooter) globalFooter.classList.remove('hidden');
    if (mainContent) mainContent.className = 'flex-1 w-full px-4 sm:px-8 lg:px-12 py-6';
    document.body.className = 'bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans antialiased overflow-x-hidden';
    const appView = document.getElementById('app-view');
    PublicVerifyView.render(appView);
  },

  // Modal Helpers
  closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
  },

  // API Config Modal Helpers
  openApiConfigModal() {
    const modal = document.getElementById('api-config-modal');
    const input = document.getElementById('input-api-url');
    if (input) input.value = Config.getApiBaseUrl();
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons({ root: modal });
  },

  closeApiConfigModal() {
    const modal = document.getElementById('api-config-modal');
    if (modal) modal.classList.add('hidden');
  },

  setApiUrl(url) {
    const input = document.getElementById('input-api-url');
    if (input) input.value = url;
  },

  async saveApiUrl() {
    const input = document.getElementById('input-api-url');
    if (input && input.value) {
      Config.setApiBaseUrl(input.value);
      const currentUrlEl = document.getElementById('current-api-url');
      if (currentUrlEl) currentUrlEl.textContent = Config.getApiBaseUrl();

      Api.toast('URL API berhasil disimpan! Mengecek koneksi...', 'info');
      this.closeApiConfigModal();

      const isOk = await Api.testConnection();
      if (isOk) {
        Api.toast('Koneksi ke backend Laravel berhasil terhubung!', 'success');
      } else {
        Api.toast('Peringatan: Gagal terhubung ke endpoint tersebut. Pastikan server Laravel / Laragon aktif.', 'warning');
      }

      this.render();
    }
  },

  toggleSnow() {
    if (window.SnowEffect) {
      const isNowActive = window.SnowEffect.toggle();
      const statusText = document.getElementById('snow-status-text');
      const toggleBtn = document.getElementById('snow-toggle-btn');
      if (statusText) statusText.textContent = isNowActive ? 'Aktif' : 'Nonaktif';
      if (toggleBtn) {
        if (isNowActive) {
          toggleBtn.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/80 hover:bg-sky-100 transition flex items-center gap-1.5 shadow-xs';
        } else {
          toggleBtn.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition flex items-center gap-1.5 shadow-xs';
        }
      }
      Api.toast(isNowActive ? '❄️ Efek Salju diaktifkan.' : '❄️ Efek Salju dinonaktifkan.', 'info');
    }
  }
};

window.App = App;

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
