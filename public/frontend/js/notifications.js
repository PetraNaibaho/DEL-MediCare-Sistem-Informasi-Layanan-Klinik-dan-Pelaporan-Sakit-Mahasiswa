/**
 * DEL-MediCare - Notifications Controller & Dropdown
 */

const Notifications = {
  isOpen: false,
  pollTimer: null,

  async init() {
    if (!Auth.isLoggedIn()) return;
    await this.updateUnreadCount();
    
    // Polling setiap 30 detik jika user login
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (Auth.isLoggedIn()) {
        this.updateUnreadCount();
      }
    }, 30000);
  },

  async updateUnreadCount() {
    try {
      const res = await Api.get('/notifications/unread-count');
      const count = res?.count ?? res?.data?.count ?? 0;
      const badge = document.getElementById('notif-badge');
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : count;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    } catch (e) {
      // Abaikan jika offline
    }
  },

  async toggleDropdown() {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;

    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      dropdown.classList.remove('hidden');
      await this.loadList();
    } else {
      dropdown.classList.add('hidden');
    }
  },

  async loadList() {
    const listEl = document.getElementById('notif-list');
    if (!listEl) return;

    listEl.innerHTML = `<div class="p-4 text-center text-slate-400">Memuat notifikasi...</div>`;

    try {
      const res = await Api.get('/notifications');
      const items = res?.data || [];

      if (items.length === 0) {
        listEl.innerHTML = `
          <div class="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
            <i data-lucide="bell-off" class="w-8 h-8 text-slate-300"></i>
            <span>Belum ada notifikasi</span>
          </div>
        `;
      } else {
        listEl.innerHTML = items.map(n => {
          const isUnread = !n.read_at;
          const bg = isUnread ? 'bg-blue-50/60' : 'bg-white';
          const dot = isUnread ? `<span class="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>` : '';
          
          return `
            <div class="${bg} p-3 hover:bg-slate-50 transition cursor-pointer flex items-start gap-2.5" onclick="window.Notifications.markRead(${n.id})">
              ${dot}
              <div class="flex-1">
                <p class="text-xs text-slate-800 leading-snug ${isUnread ? 'font-semibold' : ''}">${n.message}</p>
                <span class="text-[10px] text-slate-400 mt-1 block">${n.created_at || 'Baru saja'}</span>
              </div>
            </div>
          `;
        }).join('');
      }

      if (window.lucide) lucide.createIcons({ root: listEl });
    } catch (err) {
      listEl.innerHTML = `<div class="p-4 text-center text-rose-500 text-xs">Gagal memuat notifikasi</div>`;
    }
  },

  async markRead(id) {
    try {
      await Api.post(`/notifications/${id}/read`);
      await this.updateUnreadCount();
      await this.loadList();
    } catch (e) {
      console.error(e);
    }
  },

  async markAllRead() {
    try {
      await Api.post('/notifications/read-all');
      Api.toast('Semua notifikasi ditandai sudah dibaca', 'success');
      await this.updateUnreadCount();
      await this.loadList();
    } catch (e) {
      Api.toast('Gagal menandai notifikasi', 'error');
    }
  }
};

window.Notifications = Notifications;
