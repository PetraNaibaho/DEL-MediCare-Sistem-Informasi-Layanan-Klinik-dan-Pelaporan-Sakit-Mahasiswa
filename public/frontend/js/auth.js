/**
 * DEL-MediCare - Authentication & Session Management
 * Screen 0: Futuristic Interactive Gateway (Split-Screen, Dynamic Neon Accents, Password Gauge & Floating QR Widget)
 */

const Auth = {
  user: null,

  // Demo accounts for fast prototype testing per role
  DEMO_ACCOUNTS: {
    mahasiswa: { username: 'danu.siregar', password: 'mahasiswa123', label: 'Danu Siregar (Mahasiswa)', accent: 'cyan' },
    driver: { username: 'hendra.putra', password: 'driver123', label: 'Hendra Putra (Driver Ambulans)', accent: 'orange' },
    klinik: { username: 'maria.sihotang', password: 'klinik123', label: 'dr. Maria Sihotang (Dokter)', accent: 'emerald' },
    keasramaan: { username: 'kristian.sihombing', password: 'ksr123', label: 'Kristian S. (Warden Asrama)', accent: 'purple' },
    dosen: { username: 'sudirman', password: 'dosen123', label: 'Bpk. Sudirman (Dosen Pengampu)', accent: 'indigo' }
  },

  ROLE_CONFIG: {
    mahasiswa: {
      colorName: 'cyan',
      themeGradient: 'from-cyan-600 to-blue-600',
      activeRing: 'ring-2 ring-cyan-500 border-cyan-500 text-cyan-900 bg-cyan-50 font-bold shadow-xs',
      btnGradient: 'from-cyan-600 via-blue-600 to-teal-600',
      neonGlow: 'shadow-lg shadow-cyan-500/25',
      badge: 'Mahasiswa Kampus Del'
    },
    driver: {
      colorName: 'orange',
      themeGradient: 'from-amber-500 to-orange-600',
      activeRing: 'ring-2 ring-orange-500 border-orange-500 text-orange-900 bg-orange-50 font-bold shadow-xs',
      btnGradient: 'from-amber-500 via-orange-600 to-rose-600',
      neonGlow: 'shadow-lg shadow-orange-500/25',
      badge: 'Driver Transportasi Darurat'
    },
    klinik: {
      colorName: 'emerald',
      themeGradient: 'from-emerald-600 to-teal-600',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-500 text-emerald-900 bg-emerald-50 font-bold shadow-xs',
      btnGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      neonGlow: 'shadow-lg shadow-emerald-500/25',
      badge: 'Dokter & Tenaga Medis'
    },
    keasramaan: {
      colorName: 'purple',
      themeGradient: 'from-purple-600 to-violet-600',
      activeRing: 'ring-2 ring-purple-500 border-purple-500 text-purple-900 bg-purple-50 font-bold shadow-xs',
      btnGradient: 'from-purple-600 via-violet-600 to-indigo-600',
      neonGlow: 'shadow-lg shadow-purple-500/25',
      badge: 'Warden & Pengurus Asrama'
    },
    dosen: {
      colorName: 'indigo',
      themeGradient: 'from-indigo-600 to-blue-700',
      activeRing: 'ring-2 ring-indigo-500 border-indigo-500 text-indigo-900 bg-indigo-50 font-bold shadow-xs',
      btnGradient: 'from-indigo-600 via-blue-600 to-sky-700',
      neonGlow: 'shadow-lg shadow-indigo-500/25',
      badge: 'Fakultas & Tenaga Pengajar'
    }
  },

  getUser() {
    if (!this.user) {
      const stored = localStorage.getItem('medicare_user');
      if (stored) {
        try { this.user = JSON.parse(stored); } catch (e) {}
      }
    }
    return this.user;
  },

  setUser(userData) {
    this.user = userData;
    if (userData) {
      localStorage.setItem('medicare_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('medicare_user');
    }
  },

  isLoggedIn() {
    return !!Api.getToken() && !!this.getUser();
  },

  async init() {
    const token = Api.getToken();
    if (token) {
      try {
        const res = await Api.get('/auth/me');
        if (res && res.data) {
          this.setUser(res.data);
          Api.updateStatusDot(true);
        }
      } catch (err) {
        console.warn('Token tidak valid atau kedaluwarsa:', err);
        Api.setToken(null);
        this.setUser(null);
      }
    }
  },

  async login(role, username, password) {
    try {
      const res = await Api.post('/auth/login', { role, username, password });
      if (res && res.data) {
        Api.setToken(res.data.token);
        this.setUser(res.data.user);
        Api.toast(`Selamat datang kembali, ${res.data.user.name}!`, 'success');
        window.App.render();
        return true;
      }
    } catch (err) {
      Api.toast(err.message, 'error');
      return false;
    }
  },

  async logout() {
    try {
      await Api.post('/auth/logout');
    } catch (e) {
      // Abaikan error saat logout
    } finally {
      Api.setToken(null);
      this.setUser(null);
      Api.toast('Anda telah keluar dari sistem DEL-MediCare.', 'info');
      window.App.render();
    }
  },

  renderHeader() {
    const authSection = document.getElementById('auth-section');
    const notifWrapper = document.getElementById('notif-wrapper');
    const user = this.getUser();

    if (user) {
      if (notifWrapper) notifWrapper.classList.remove('hidden');

      const roleColors = {
        mahasiswa: 'bg-cyan-500/10 text-cyan-600 border-cyan-300',
        driver: 'bg-orange-500/10 text-orange-600 border-orange-300',
        klinik: 'bg-emerald-500/10 text-emerald-600 border-emerald-300',
        keasramaan: 'bg-purple-500/10 text-purple-600 border-purple-300',
        dosen: 'bg-indigo-500/10 text-indigo-600 border-indigo-300'
      };

      const colorClass = roleColors[user.role] || 'bg-slate-100 text-slate-700 border-slate-200';

      authSection.innerHTML = `
        <div class="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div class="text-right hidden sm:block">
            <div class="text-xs font-bold text-slate-800 leading-tight">${user.name}</div>
            <div class="text-[10px] text-slate-500 font-mono">${user.identifier || user.username}</div>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider border ${colorClass}">
            ${user.role}
          </span>
          <button onclick="window.Auth.logout()" title="Keluar dari sesi" class="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    } else {
      if (notifWrapper) notifWrapper.classList.add('hidden');
      authSection.innerHTML = `
        <button onclick="window.App.setView('login')" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-1.5">
          <i data-lucide="log-in" class="w-4 h-4"></i>
          <span>Masuk Sistem</span>
        </button>
      `;
    }

    if (window.lucide) lucide.createIcons({ root: authSection });
  },

  /**
   * Screen 0 — Futuristic Interactive Gateway (Light Theme & Institutional Branding)
   */
  renderLoginForm() {
    return `
      <div class="relative w-full min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-blue-50/40 flex flex-col justify-center overflow-hidden animate-fade-in-up text-slate-800">
        
        <!-- Light Theme Container (Full Width & Height Split View) -->
        <div class="relative w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-transparent">
          
          <!-- Soft Ambient Radial Glow Backgrounds -->
          <div class="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-sky-400/10 rounded-full blur-3xl pointer-events-none transition-all duration-700" id="neon-glow-primary"></div>
          <div class="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-blue-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700" id="neon-glow-secondary"></div>

          <!-- LEFT PANEL: Institutional Yayasan Del Identity & 3D Medical Shuttle Display -->
          <div class="lg:col-span-5 bg-gradient-to-br from-white via-sky-50/60 to-blue-50/50 p-8 sm:p-14 lg:p-16 xl:p-20 text-slate-800 flex flex-col justify-center relative border-b lg:border-b-0 lg:border-r border-slate-200/90">
            
            <div class="relative z-10 max-w-xl xl:max-w-2xl mx-auto w-full">
              
              <!-- Yayasan Del & Institut Teknologi Del Institutional Brand Badge (Pertamina-Style Pill Card) -->
              <div class="inline-flex items-center gap-3.5 bg-white p-2.5 sm:px-4 sm:py-3 rounded-2xl border border-slate-200/90 shadow-sm mb-6 sm:mb-8">
                <!-- Logo Yayasan Del -->
                <div class="h-12 w-12 sm:h-14 sm:w-14 shrink-0 p-0.5 flex items-center justify-center bg-white rounded-xl">
                  <img src="${window.YAYASAN_DEL_LOGO || '/frontend/images/yayasan-del.png'}" alt="Logo Yayasan Del" class="h-full w-full object-contain">
                </div>
                
                <div class="border-l border-slate-200 pl-3.5 text-left">
                  <h2 class="text-base sm:text-xl font-extrabold text-[#0F4C81] tracking-tight">
                    Institut Teknologi Del
                  </h2>
                  <p class="text-xs text-slate-500 font-semibold">DEL-MediCare &bull; Layanan Kesehatan Kampus</p>
                </div>
              </div>

              <!-- 3D Medical Shuttle Simulation Graphic (Light Medical Theme) -->
              <div class="my-6 p-8 sm:p-12 lg:p-14 rounded-[36px] bg-white/90 border border-slate-200/90 shadow-xl backdrop-blur-xl relative overflow-hidden group">
                <div class="relative flex items-center justify-center py-10 sm:py-14">
                  <!-- Radar Conic Circle -->
                  <div class="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-sky-400/30 animate-spin" style="animation-duration: 12s;"></div>
                  <div class="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-blue-400/30"></div>
                  
                  <!-- Shuttle Vehicle Icon with Hover Float -->
                  <div class="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 border-2 border-white flex items-center justify-center text-white shadow-xl shadow-blue-500/30 animate-float">
                    <i data-lucide="ambulance" class="w-14 h-14 sm:w-18 sm:h-18"></i>
                  </div>
                </div>

                <div class="mt-4 sm:mt-6 text-center">
                  <h4 class="text-base sm:text-xl font-black text-slate-900">Autonomous Shuttle Dispatch</h4>
                  <p class="text-xs sm:text-sm text-slate-500 mt-1">Penjemputan medis darurat terkoordinasi antar asrama & poliklinik kampus</p>
                </div>
              </div>

            </div>

          </div>

          <!-- RIGHT PANEL: Clean White Card for Authentication -->
          <div class="lg:col-span-7 p-8 sm:p-14 lg:p-16 xl:p-20 flex flex-col justify-center bg-white/70 backdrop-blur-2xl relative text-slate-800">
            
            <div class="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto w-full space-y-8">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Portal Masuk Terpadu</h3>
                  <p class="text-sm sm:text-base text-slate-500 mt-2" id="login-subheading">Pilih peran akun Anda untuk mengaktifkan antarmuka peran spesifik</p>
                </div>
                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0" id="role-badge-icon">
                  <i data-lucide="lock" class="w-6 h-6 sm:w-7 sm:h-7"></i>
                </div>
              </div>

              <!-- 1. ROLE SELECTOR: Modern Segmented Card Tabs for 5 Roles (Light Mode) -->
              <div>
                <label class="block text-xs sm:text-sm font-mono font-bold text-slate-600 uppercase tracking-wider mb-3">
                  PILIH PERAN PENGGUNA (ROLE):
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 p-2 bg-slate-100/90 rounded-2xl border border-slate-200" id="role-selector-group">
                  
                  <button type="button" onclick="window.Auth.selectRole('mahasiswa')" class="role-btn px-3 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-bold rounded-xl transition-all flex flex-col items-center gap-2 text-center ring-2 ring-cyan-500 border-cyan-500 text-cyan-900 bg-cyan-50 shadow-xs" data-role="mahasiswa">
                    <i data-lucide="graduation-cap" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    <span>Mahasiswa</span>
                  </button>

                  <button type="button" onclick="window.Auth.selectRole('driver')" class="role-btn px-3 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-medium rounded-xl transition-all flex flex-col items-center gap-2 text-center text-slate-600 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-50" data-role="driver">
                    <i data-lucide="car" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    <span>Driver</span>
                  </button>

                  <button type="button" onclick="window.Auth.selectRole('klinik')" class="role-btn px-3 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-medium rounded-xl transition-all flex flex-col items-center gap-2 text-center text-slate-600 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-50" data-role="klinik">
                    <i data-lucide="stethoscope" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    <span>Klinik</span>
                  </button>

                  <button type="button" onclick="window.Auth.selectRole('keasramaan')" class="role-btn px-3 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-medium rounded-xl transition-all flex flex-col items-center gap-2 text-center text-slate-600 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-50" data-role="keasramaan">
                    <i data-lucide="home" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    <span>Asrama</span>
                  </button>

                  <button type="button" onclick="window.Auth.selectRole('dosen')" class="role-btn px-3 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-medium rounded-xl transition-all flex flex-col items-center gap-2 text-center text-slate-600 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-50" data-role="dosen">
                    <i data-lucide="book-open" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    <span>Dosen</span>
                  </button>

                </div>
                <input type="hidden" id="login-role" value="mahasiswa">
              </div>

              <!-- Form Login (Light Mode) -->
              <form id="login-form" onsubmit="window.Auth.handleLoginSubmit(event)" class="space-y-6 pt-2">
                
                <!-- 2. Input: Username with hover/focus micro-animations -->
                <div class="space-y-2">
                  <label class="block text-sm sm:text-base font-bold text-slate-700">Username Mahasiswa / Akun:</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition">
                      <i data-lucide="user" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    </div>
                    <input type="text" id="login-username" required oninput="window.Auth.validateInputs()" class="w-full text-sm sm:text-base pl-14 pr-5 py-4 sm:py-4.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition group-hover:border-slate-300 font-medium shadow-xs" placeholder="Masukkan username..." value="">
                  </div>
                </div>

                <!-- 3. Input: Password with Visibility Toggle -->
                <div class="space-y-2">
                  <label class="block text-sm sm:text-base font-bold text-slate-700">Kata Sandi:</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition">
                      <i data-lucide="lock" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    </div>
                    <input type="password" id="login-password" required class="w-full text-sm sm:text-base pl-14 pr-14 py-4 sm:py-4.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition group-hover:border-slate-300 font-medium font-mono shadow-xs" placeholder="Masukkan kata sandi..." value="">
                    <button type="button" onclick="window.Auth.togglePasswordVisibility()" class="absolute inset-y-0 right-0 pr-4.5 flex items-center text-slate-400 hover:text-slate-700 transition" title="Tampilkan sandi">
                      <i data-lucide="eye" id="password-toggle-icon" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    </button>
                  </div>
                </div>

                <!-- 4. Primary CTA Button (Enlarged) -->
                <div class="pt-4">
                  <button type="submit" id="login-submit-btn" class="w-full py-4.5 sm:py-5.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition flex items-center justify-center gap-2.5">
                    <span>Masuk Sekarang</span>
                  </button>
                </div>

              </form>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  /**
   * Smoothly shift input context & neon accent color on role selection
   */
  selectRole(role) {
    const inputRole = document.getElementById('login-role');
    if (inputRole) inputRole.value = role;

    const config = this.ROLE_CONFIG[role] || this.ROLE_CONFIG.mahasiswa;
    const buttons = document.querySelectorAll('#role-selector-group .role-btn');
    
    buttons.forEach(btn => {
      const isSelected = btn.getAttribute('data-role') === role;
      if (isSelected) {
        btn.className = `role-btn px-3 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-bold rounded-xl transition-all flex flex-col items-center gap-2 text-center ${config.activeRing} ${config.neonGlow}`;
      } else {
        btn.className = 'role-btn px-3 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-medium rounded-xl transition-all flex flex-col items-center gap-2 text-center text-slate-600 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-50';
      }
    });

    // Update Ambient Soft Glows
    const glow1 = document.getElementById('neon-glow-primary');
    const glow2 = document.getElementById('neon-glow-secondary');
    if (glow1 && glow2) {
      if (role === 'mahasiswa') {
        glow1.className = 'absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-sky-400/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
        glow2.className = 'absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-blue-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
      } else if (role === 'driver') {
        glow1.className = 'absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-orange-400/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
        glow2.className = 'absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-amber-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
      } else if (role === 'klinik') {
        glow1.className = 'absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
        glow2.className = 'absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
      } else if (role === 'keasramaan') {
        glow1.className = 'absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-purple-400/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
        glow2.className = 'absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
      } else if (role === 'dosen') {
        glow1.className = 'absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
        glow2.className = 'absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-blue-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700';
      }
    }

    // Update CTA Button Gradient
    const submitBtn = document.getElementById('login-submit-btn');
    if (submitBtn) {
      submitBtn.className = `w-full py-4.5 sm:py-5.5 bg-gradient-to-r ${config.btnGradient} text-white font-black text-base sm:text-lg rounded-2xl ${config.neonGlow} hover:-translate-y-0.5 active:translate-y-0 transition flex items-center justify-center gap-2.5`;
    }

    // Clear inputs on role switch (no prefilled values, per user request)
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
  },

  updatePasswordStrength(val) {
    // Meter bar removed per user request
  },

  validateInputs() {
    // Micro-interaction validation feedback
  },

  async quickSwitchRole(role) {
    const demo = this.DEMO_ACCOUNTS[role];
    if (!demo) return;
    Api.toast(`Beralih langsung ke layar ${role.toUpperCase()} (${demo.label})...`, 'info');
    await this.login(role, demo.username, demo.password);
  },

  autofillDemoAccount() {
    const role = document.getElementById('login-role')?.value || 'mahasiswa';
    const demo = this.DEMO_ACCOUNTS[role];
    if (demo) {
      const userInput = document.getElementById('login-username');
      const passInput = document.getElementById('login-password');
      if (userInput) userInput.value = demo.username;
      if (passInput) {
        passInput.value = demo.password;
        this.updatePasswordStrength(demo.password);
      }
      Api.toast(`Akun demo ${role} berhasil diisi otomatis: ${demo.username}`, 'info');
    }
  },

  togglePasswordVisibility() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('password-toggle-icon');
    if (!input || !icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons({ root: input.parentElement });
  },

  async handleLoginSubmit(e) {
    e.preventDefault();
    const role = document.getElementById('login-role').value;
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const btn = document.getElementById('login-submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div><span>Memverifikasi Akses...</span>`;

    try {
      await this.login(role, username, password);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
      if (window.lucide) lucide.createIcons({ root: btn });
    }
  }
};

window.Auth = Auth;
