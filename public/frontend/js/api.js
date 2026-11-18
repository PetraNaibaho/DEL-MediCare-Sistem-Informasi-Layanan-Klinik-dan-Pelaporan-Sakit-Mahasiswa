/**
 * DEL-MediCare - API Client & HTTP Request Utilities
 */

const Api = {
  getToken() {
    return localStorage.getItem('medicare_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('medicare_token', token);
    } else {
      localStorage.removeItem('medicare_token');
    }
  },

  async request(endpoint, options = {}) {
    const baseUrl = Config.getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Status 401 Unauthorized -> Sesi kedaluwarsa
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        this.setToken(null);
        window.Auth.setUser(null);
        window.App.render();
        this.toast('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        throw new Error('Unauthorized');
      }

      // Handle PDF atau blob response jika diminta
      if (options.responseType === 'blob') {
        if (!response.ok) throw new Error('Gagal mengunduh berkas');
        return await response.blob();
      }

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMsg = json?.message || 'Terjadi kesalahan pada sistem.';
        if (json?.errors) {
          const firstErrKey = Object.keys(json.errors)[0];
          errorMsg = json.errors[firstErrKey][0] || errorMsg;
        }
        throw new Error(errorMsg);
      }

      return json;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${cleanEndpoint}]:`, err);
      
      // Jika error network (misal backend mati atau port salah)
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        this.updateStatusDot(false);
        throw new Error(`Tidak dapat terhubung ke Backend (${baseUrl}). Pastikan Laragon/Laravel sudah berjalan!`);
      }
      
      throw err;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
  },

  async testConnection() {
    try {
      const baseUrl = Config.getApiBaseUrl();
      
      // Coba cek endpoint health check /up dari Laravel
      const upUrl = baseUrl.endsWith('/api') ? baseUrl.replace(/\/api$/, '/up') : `${baseUrl}/up`;
      try {
        const upRes = await fetch(upUrl, { method: 'GET', mode: 'cors' });
        if (upRes && upRes.ok) {
          this.updateStatusDot(true);
          return true;
        }
      } catch (e) {
        // Coba metode kedua jika /up tidak aktif
      }

      // Coba ping route login: respon 422 (validasi) membuktikan backend hidup
      const ping = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({})
      });

      if (ping && (ping.ok || ping.status === 422 || ping.status === 400 || ping.status === 200)) {
        this.updateStatusDot(true);
        return true;
      }

      this.updateStatusDot(false);
      return false;
    } catch (e) {
      this.updateStatusDot(false);
      return false;
    }
  },

  updateStatusDot(isOnline) {
    const dot = document.getElementById('backend-status-dot');
    const text = document.getElementById('backend-status-text');
    const currentUrl = document.getElementById('current-api-url');
    
    if (currentUrl) currentUrl.textContent = Config.getApiBaseUrl();

    if (dot) {
      if (isOnline) {
        dot.className = 'inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
      } else {
        dot.className = 'inline-block w-2 h-2 rounded-full bg-rose-500';
      }
    }
  },

  // Toast Notifications
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    const bg = type === 'success' ? 'bg-emerald-600 text-white' :
               type === 'error' ? 'bg-rose-600 text-white' :
               type === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white';

    const icon = type === 'success' ? 'check-circle' :
                 type === 'error' ? 'alert-circle' :
                 type === 'warning' ? 'alert-triangle' : 'info';

    el.className = `${bg} pointer-events-auto p-3.5 rounded-xl shadow-xl flex items-center justify-between gap-3 text-xs font-medium animate-scale-up`;
    el.innerHTML = `
      <div class="flex items-center gap-2">
        <i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i>
        <span>${message}</span>
      </div>
      <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white">&times;</button>
    `;

    container.appendChild(el);
    if (window.lucide) lucide.createIcons({ root: el });

    setTimeout(() => {
      el.classList.add('opacity-0', 'transition', 'duration-300');
      setTimeout(() => el.remove(), 300);
    }, 4000);
  }
};

window.Api = Api;
