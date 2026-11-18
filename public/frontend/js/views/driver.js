/**
 * DEL-MediCare - Driver View
 * Screen 2: Tactical Transport Command (One-Thumb Navigation, High Contrast Dark Slate, 3-Step Passenger Check-in)
 */

const DriverView = {
  currentTab: 'dashboard',
  isNightMode: true, // Default to Dark Tactical Theme for Driver

  toggleNightMode() {
    this.isNightMode = !this.isNightMode;
    localStorage.setItem('medicare_driver_night_mode', this.isNightMode);
    
    if (this.isNightMode) {
      document.body.classList.add('driver-night-mode');
      Api.toast('Mode Taktis Malam Driver aktif (High Contrast)', 'info');
    } else {
      document.body.classList.remove('driver-night-mode');
      Api.toast('Mode Terang Siang Driver aktif', 'info');
    }
    this.render(document.getElementById('app-view'), this.currentTab, true);
  },

  applyNightModeClass() {
    // Selalu pastikan dark mode aktif untuk dashboard taktis pengemudi
    document.body.classList.add('driver-night-mode');
  },

  async render(container, tab = 'dashboard', isSilent = false, extraParam = null) {
    this.currentTab = tab;
    this.applyNightModeClass();

    if (!isSilent) {
      container.innerHTML = `
        <div class="flex items-center justify-center min-h-[300px]">
          <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      `;
    }

    try {
      if (tab === 'dashboard') {
        await this.renderDashboard(container);
      } else if (tab === 'batches') {
        await this.renderBatches(container);
      } else if (tab === 'trip') {
        await this.renderTrip(container, extraParam);
      } else if (tab === 'return') {
        await this.renderReturnTrip(container);
      } else if (tab === 'history') {
        await this.renderHistory(container);
      }
    } catch (err) {
      container.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center max-w-lg mx-auto">
          <i data-lucide="alert-circle" class="w-10 h-10 text-rose-500 mx-auto mb-2"></i>
          <h3 class="text-sm font-bold text-rose-800">Gagal Memuat Data Operasional Driver</h3>
          <p class="text-xs text-rose-600 mt-1 mb-4">${err.message}</p>
          <button onclick="window.DriverView.render(document.getElementById('app-view'), '${tab}')" class="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition">Coba Lagi</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: container });
    }
  },

  getNavItems() {
    return [
      { id: 'dashboard', label: 'Tactical Command', icon: 'navigation' },
      { id: 'batches', label: 'Batch Queue', icon: 'layers' },
      { id: 'trip', label: 'Active Pickup', icon: 'truck' },
      { id: 'return', label: 'Return Manager', icon: 'rotate-ccw' },
      { id: 'history', label: 'Trip Log', icon: 'history' }
    ];
  },

  /**
   * Screen 2 — Tactical Transport Command
   */
  async renderDashboard(container) {
    const res = await Api.get('/driver/dashboard');
    const data = res.data;
    const stats = data.stats || {};
    const activeBatch = data.batch_aktif;
    const activeMembers = activeBatch ? (activeBatch.anggota || activeBatch.requests || []) : [];
    const pickedCount = activeMembers.filter(r => ['PICKED_UP', 'AT_CLINIC', 'WAITING_EXAM', 'IN_EXAMINATION', 'EXAM_COMPLETED', 'SICK_CONFIRMED', 'E_SICK_LETTER_ISSUED', 'RETURN_PENDING', 'RETURNED', 'COMPLETED'].includes((r.status || '').toUpperCase())).length;

    let returnPendingCount = 0;
    try {
      const retRes = await Api.get('/driver/return-trip');
      if (retRes.data && retRes.data.siap_dipulangkan) {
        returnPendingCount = retRes.data.siap_dipulangkan.length;
      }
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in-up">
        
        <!-- 1. ACTIVE TRIP BANNER (High-Contrast Tactical Hero Card) -->
        <div class="bg-gradient-to-br from-slate-950 via-slate-900 to-stone-900 rounded-[28px] p-6 sm:p-8 text-white shadow-2xl border-2 ${activeBatch ? 'border-orange-500/80 shadow-[0_0_30px_rgba(249,115,22,0.25)]' : 'border-slate-800'} relative overflow-hidden">
          
          <div class="relative z-10 space-y-4">
            
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-mono font-black ${activeBatch ? 'bg-orange-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'} flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full ${activeBatch ? 'bg-slate-950' : 'bg-emerald-400'}"></span>
                  ${activeBatch ? 'TRIP OPERASIONAL AKTIF' : 'STATUS: STANDBY DI POOL'}
                </span>
                <span class="text-xs font-mono text-slate-400">Armada Shuttle DEL #01</span>
              </div>

              <!-- Night/Tactical Mode Indicator -->
              <div class="text-[11px] font-mono text-orange-400 font-bold flex items-center gap-1 bg-orange-950/60 px-3 py-1 rounded-full border border-orange-800/80">
                <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                <span>TACTICAL DISPATCH MODE</span>
              </div>
            </div>

            <!-- Big Bold Trip Status Title -->
            <div>
              <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                ${activeBatch ? `TRIP AKTIF: ${activeBatch.label} — ${pickedCount}/${activeMembers.length || 5} MAHASISWA` : 'TIDAK ADA TRIP AKTIF &bull; SIAP MENERIMA BATCH'}
              </h2>
              <p class="text-xs sm:text-sm text-slate-300 mt-1">
                ${activeBatch ? 'Prioritas rute penjemputan asrama. Gunakan kontrol navigasi satu sentuhan untuk konfirmasi status.' : 'Buka antrean batch penjemputan untuk memulai rute evakuasi medis mahasiswa.'}
              </p>
            </div>

            <!-- Prominent Quick-Call & Route-Optimizing Buttons (Oversized Touch Targets) -->
            <div class="pt-2 flex flex-wrap items-center gap-3">
              ${activeBatch ? `
                <button onclick="window.App.switchTab('trip')" class="px-6 py-4 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 min-h-[52px]">
                  <i data-lucide="navigation" class="w-5 h-5"></i>
                  <span>Lanjutkan Rute (${activeBatch.label})</span>
                </button>
              ` : `
                <button onclick="window.App.switchTab('batches')" class="px-6 py-4 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 min-h-[52px]">
                  <i data-lucide="layers" class="w-5 h-5"></i>
                  <span>Lihat Batch Siap Ambil (${stats.batch_pending || 0})</span>
                </button>
              `}

              <!-- Route Optimizing Navigation Button -->
              <a href="https://www.google.com/maps/search/?api=1&query=Institut+Teknologi+Del+Sitoluama+Laguboti" target="_blank" rel="noopener noreferrer" class="px-5 py-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl border border-slate-700 transition flex items-center gap-2 min-h-[52px]">
                <i data-lucide="compass" class="w-5 h-5 text-cyan-400"></i>
                <span>Optimasi Rute Maps</span>
              </a>

              <!-- Quick-Call Posko Medik -->
              <a href="tel:081234567890" class="px-5 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2 min-h-[52px]">
                <i data-lucide="phone-call" class="w-5 h-5"></i>
                <span>Panggil Posko Medik</span>
              </a>
            </div>

          </div>

          <!-- Tactical Watermark Graphic -->
          <div class="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
            <i data-lucide="truck" class="w-64 h-64"></i>
          </div>
        </div>

        <!-- 2. BATCH OVERVIEW METRICS: Signal Orange & Emerald Green Accents -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono font-bold text-slate-400 uppercase">ACTIVE BATCH</span>
              <span class="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                <i data-lucide="truck" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-orange-400 font-mono tracking-tight">
              ${stats.batch_aktif ? stats.batch_aktif_label : 'STANDBY'}
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">${stats.batch_aktif ? 'Dalam Rute' : 'Armada Siap'}</span>
          </div>

          <div class="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono font-bold text-slate-400 uppercase">STUDENTS PICKED</span>
              <span class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <i data-lucide="users" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              ${pickedCount} / ${stats.mahasiswa_trip || 5}
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Kapasitas Maksimal Mobil</span>
          </div>

          <div class="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm cursor-pointer hover:border-orange-500 transition" onclick="window.App.switchTab('return')">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono font-bold text-slate-400 uppercase">RETURN PENDING</span>
              <span class="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-indigo-400 font-mono tracking-tight">
              ${returnPendingCount} Mhs
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Siap diantar pulang ke asrama</span>
          </div>

          <div class="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono font-bold text-slate-400 uppercase">COMPLETED TODAY</span>
              <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              ${stats.trip_hari_ini || 0} Trip
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Penjemputan Sukses Hari Ini</span>
          </div>

        </div>

        <!-- 3. PASSENGER CHECK-IN WORKFLOW (Oversized Color-Coded Touch Targets) -->
        ${activeBatch ? `
          <div class="bg-slate-900 rounded-[28px] border border-slate-800 p-6 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span class="text-xs font-mono font-bold text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded border border-orange-800">${activeBatch.label}</span>
                <h3 class="text-lg font-black text-white mt-1">Daftar Mahasiswa yang Harus Dijemput (${activeMembers.length} Orang)</h3>
                <p class="text-xs text-slate-400">Sentuh tombol aksi berwarna untuk memperbarui status setiap mahasiswa</p>
              </div>
              <button onclick="window.App.switchTab('trip')" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto">
                <span>Layar Penuh Trip</span>
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
            </div>

            <div class="space-y-4">
              ${activeMembers.map((r, idx) => {
                const rStatus = (r.status || '').toUpperCase();
                const isPicked = ['PICKED_UP', 'AT_CLINIC', 'WAITING_EXAM', 'IN_EXAMINATION', 'EXAM_COMPLETED', 'SICK_CONFIRMED', 'E_SICK_LETTER_ISSUED', 'RETURN_PENDING', 'RETURNED', 'COMPLETED'].includes(rStatus);

                return `
                  <div class="p-5 rounded-2xl bg-slate-950 border ${isPicked ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-slate-800'} flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-700">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg ${isPicked ? 'bg-emerald-500 text-slate-950' : 'bg-orange-500 text-slate-950'} font-black text-xs flex items-center justify-center font-mono">
                          #${idx + 1}
                        </span>
                        <span class="text-base font-black text-white">${r.nama || r.student?.name}</span>
                        <span class="text-xs font-mono text-slate-400">(${r.nim || r.student?.identifier})</span>
                      </div>
                      <div class="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                        <i data-lucide="map-pin" class="w-4 h-4 text-rose-400"></i>
                        <span>Lokasi: <strong class="text-white">${r.lokasi}</strong></span>
                      </div>
                      <div class="text-xs text-slate-400 italic">
                        Gejala: "${r.keluhan}"
                      </div>
                    </div>

                    <!-- 3-Step Oversized Touch Targets -->
                    <div class="flex items-center gap-2 self-stretch md:self-auto">
                      ${!isPicked ? `
                        <button onclick="window.DriverView.pickupStudent(${r.id})" class="flex-1 md:flex-initial px-6 py-4 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 min-h-[52px]">
                          <i data-lucide="check" class="w-5 h-5"></i>
                          <span>Mahasiswa Naik</span>
                        </button>
                      ` : `
                        <div class="flex-1 md:flex-initial px-6 py-4 bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 min-h-[52px]">
                          <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i>
                          <span>Sudah di Kendaraan</span>
                        </div>
                      `}

                      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Institut Teknologi Del ' + r.lokasi)}" target="_blank" rel="noopener noreferrer" class="p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition" title="Buka Rute Maps">
                        <i data-lucide="map" class="w-5 h-5"></i>
                      </a>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 4. BATCH QUEUE CARDS (Interactive Card Stack for Available Batches) -->
        <div class="bg-slate-900 rounded-[28px] border border-slate-800 p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-base font-black text-white uppercase tracking-wider">Antrean Batch Siap Diambil</h3>
              <p class="text-xs text-slate-400">Batch yang telah dikumpulkan sistem dari berbagai blok asrama</p>
            </div>
            <button onclick="window.App.switchTab('batches')" class="text-xs font-bold text-orange-400 hover:underline">
              Buka Semua Batch
            </button>
          </div>

          <div id="quick-batch-list">
            <!-- Dynamically populated from batches -->
            <div class="text-center py-6 text-xs text-slate-400">
              <button onclick="window.App.switchTab('batches')" class="px-5 py-3 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl">
                Cek ${stats.batch_pending || 0} Batch Tersedia
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  async renderBatches(container) {
    const res = await Api.get('/driver/batches');
    const batches = res.data || [];
    const currentUser = Auth.getUser();

    container.innerHTML = `
      <div class="space-y-5 max-w-5xl mx-auto animate-fade-in-up">
        
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-white font-mono">BATCH QUEUE CARDS</h2>
            <p class="text-xs text-slate-400">Pilih batch evakuasi asrama untuk memulai penjemputan armada</p>
          </div>
          <button onclick="window.DriverView.render(document.getElementById('app-view'), 'batches')" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Refresh Queue</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${batches.length === 0 ? `
            <div class="col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-10 text-center text-slate-400 space-y-2">
              <i data-lucide="check-circle-2" class="w-12 h-12 text-emerald-400 mx-auto"></i>
              <h3 class="text-base font-bold text-white">Semua Batch Selesai Ditangani</h3>
              <p class="text-xs text-slate-400">Tidak ada batch penjemputan baru yang menunggu saat ini.</p>
            </div>
          ` : batches.map(b => {
            const bStatus = (b.status || '').toUpperCase();
            const isMine = (b.driver_id && b.driver_id === currentUser?.id) || (b.driver && b.driver === currentUser?.name);
            const isPending = (bStatus === 'PENDING' || bStatus === 'OPEN') && !b.driver_id;
            const members = b.anggota || b.requests || [];

            return `
              <div class="bg-slate-900 rounded-3xl border-2 ${isMine ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.25)]' : 'border-slate-800'} p-6 space-y-4">
                
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-xs font-mono font-black text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded border border-orange-800">${b.label}</span>
                    <h3 class="text-base font-black text-white mt-1">Status: ${b.status_label || b.status}</h3>
                    <div class="text-xs text-slate-400 mt-0.5">Kapasitas: <strong class="text-white">${members.length} / ${b.kapasitas || 5} Mahasiswa</strong></div>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-bold ${isMine ? 'bg-orange-500 text-slate-950' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'}">
                    ${isMine ? 'Tugas Anda' : 'Siap Diambil'}
                  </span>
                </div>

                <!-- List of Students & Dorm Blocks -->
                <div class="bg-slate-950 p-3.5 rounded-2xl space-y-2 text-xs border border-slate-800/80">
                  <span class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">TARGET ASRAMA & DAFTAR MAHASISWA:</span>
                  ${members.map(m => `
                    <div class="flex justify-between items-center text-xs border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                      <div>
                        <strong class="text-white">${m.nama || m.student?.name}</strong>
                        <span class="text-slate-400 font-mono text-[10px]">(${m.nim || m.student?.identifier})</span>
                        <div class="text-[10px] text-slate-400 italic">"${m.keluhan || '-'}"</div>
                      </div>
                      <span class="text-rose-400 font-bold flex items-center gap-1 shrink-0 ml-2">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${m.lokasi}
                      </span>
                    </div>
                  `).join('')}
                </div>

                <!-- Big Touch Target Action -->
                <div class="pt-2">
                  ${isPending ? `
                    <button onclick="window.DriverView.acceptBatch(${b.id})" class="w-full py-4 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 min-h-[52px]">
                      <i data-lucide="check" class="w-5 h-5"></i>
                      <span>Take Batch (Ambil Tugas Penjemputan)</span>
                    </button>
                  ` : isMine ? `
                    <button onclick="window.App.switchTab('trip')" class="w-full py-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-orange-400 font-black text-xs sm:text-sm rounded-2xl border border-orange-500/40 transition flex items-center justify-center gap-2 min-h-[52px]">
                      <i data-lucide="navigation" class="w-5 h-5"></i>
                      <span>Buka Panel Kontrol Trip</span>
                    </button>
                  ` : ''}
                </div>

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  async renderTrip(container, batchId = null) {
    const url = batchId ? `/driver/trip?batch_id=${batchId}` : '/driver/trip';
    const res = await Api.get(url);
    const batch = res.data;
    const allActive = res.semua_batch_aktif || (batch ? [batch] : []);

    if (!batch && allActive.length === 0) {
      container.innerHTML = `
        <div class="bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <i data-lucide="navigation-off" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base font-bold text-white">Tidak Ada Trip Aktif</h3>
          <p class="text-xs text-slate-400">Silakan ambil batch penjemputan terlebih dahulu dari antrean.</p>
          <button onclick="window.App.switchTab('batches')" class="px-6 py-3.5 bg-orange-500 text-slate-950 font-black text-xs rounded-xl hover:bg-orange-400 shadow-md">Buka Antrean Batch</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: container });
      return;
    }

    const requests = batch.anggota || batch.requests || [];
    const bStatus = (batch.status || '').toUpperCase();
    const isAccepted = bStatus === 'ACCEPTED';
    const isInTrip = bStatus === 'ON_TRIP' || bStatus === 'IN_TRANSIT';
    const isAtClinic = bStatus === 'AT_CLINIC';

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        
        <!-- MULTI-BATCH SELECTOR (Ketika driver mengelola lebih dari 1 batch aktif) -->
        ${allActive.length > 1 ? `
          <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-mono font-bold text-orange-400 uppercase">Trip Aktif Anda (${allActive.length}):</span>
              ${allActive.map(b => {
                const isSelected = batch && b.id === batch.id;
                return `
                  <button onclick="window.DriverView.renderTrip(document.getElementById('app-view'), ${b.id})" 
                    class="px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${isSelected ? 'bg-orange-500 text-slate-950 shadow-md ring-2 ring-orange-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                    <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-slate-950 animate-ping' : 'bg-orange-400'}"></span>
                    <span>${b.label}</span>
                    <span class="text-[10px] opacity-80">(${b.status_label || b.status})</span>
                  </button>
                `;
              }).join('')}
            </div>
            <button onclick="window.App.switchTab('batches')" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-orange-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Ambil Batch Lain</span>
            </button>
          </div>
        ` : ''}

        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-black text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded border border-orange-800">${batch.label}</span>
            <h2 class="text-2xl font-black text-white mt-1">Tactical Trip Command</h2>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.App.switchTab('batches')" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-orange-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
              <span>Ambil Batch Lagi</span>
            </button>
            <button onclick="window.DriverView.renderTrip(document.getElementById('app-view'), ${batch ? batch.id : ''})" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Tactical Operational Banner -->
        <div class="bg-gradient-to-br from-slate-950 to-stone-900 border-2 border-orange-500/80 rounded-3xl p-6 shadow-2xl space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest">LANGKAH OPERASIONAL DRIVER:</span>
              <h3 class="text-lg font-black text-white mt-0.5">
                ${isAccepted ? 'Batch Diterima — Mulai Menjemput ke Asrama' : isInTrip ? 'Sedang Dalam Perjalanan Menjemput Mahasiswa' : isAtClinic ? 'Tiba di Poliklinik IT Del' : (batch.status_label || batch.status)}
              </h3>
              <p class="text-xs text-slate-300 mt-1">
                ${isAccepted ? 'Tekan "Mulai Menjemput" untuk memberi sinyal OTW ke mahasiswa.' : isInTrip ? 'Tandai "Mahasiswa Naik" untuk setiap mahasiswa, lalu klik "Konfirmasi Tiba di Klinik".' : 'Seluruh mahasiswa telah diserahkan ke perawat/dokter klinik.'}
              </p>
            </div>

            <div class="shrink-0 flex items-center gap-2">
              ${isAccepted ? `
                <button onclick="window.DriverView.startBatch(${batch.id})" class="px-6 py-4 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 min-h-[52px]">
                  <i data-lucide="play" class="w-5 h-5"></i>
                  <span>Mulai Menjemput</span>
                </button>
              ` : isInTrip ? `
                <button onclick="window.DriverView.arriveClinic(${batch.id})" class="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 min-h-[52px]">
                  <i data-lucide="check-check" class="w-5 h-5"></i>
                  <span>Tiba di Klinik</span>
                </button>
              ` : isAtClinic ? `
                <button onclick="window.App.switchTab('return')" class="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 min-h-[52px]">
                  <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                  <span>Buka Return Manager</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Passenger Check-in List (Oversized Touch Targets) -->
        <div class="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 class="text-base font-black text-white">Passenger Check-in Workflow (${requests.length} Mahasiswa):</h3>

          <div class="space-y-3">
            ${requests.map((r, idx) => {
              const rStatus = (r.status || '').toUpperCase();
              const isPickedUp = ['PICKED_UP', 'AT_CLINIC', 'WAITING_EXAM', 'IN_EXAMINATION', 'EXAM_COMPLETED', 'SICK_CONFIRMED', 'E_SICK_LETTER_ISSUED', 'RETURN_PENDING', 'RETURNED', 'COMPLETED'].includes(rStatus);

              return `
                <div class="p-4 rounded-2xl bg-slate-950 border ${isPickedUp ? 'border-emerald-500/60' : 'border-slate-800'} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="w-7 h-7 rounded-lg ${isPickedUp ? 'bg-emerald-500 text-slate-950' : 'bg-orange-500 text-slate-950'} font-black text-xs flex items-center justify-center font-mono">
                        ${idx + 1}
                      </span>
                      <strong class="text-white text-sm">${r.nama || r.student?.name}</strong>
                      <span class="text-xs font-mono text-slate-400">(${r.nim || r.student?.identifier})</span>
                    </div>
                    <div class="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <i data-lucide="map-pin" class="w-3.5 h-3.5 text-rose-400"></i>
                      <span>${r.lokasi}</span>
                    </div>
                    <div class="text-xs text-slate-400 italic">
                      "${r.keluhan}"
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    ${!isPickedUp && isInTrip ? `
                      <button onclick="window.DriverView.pickupStudent(${r.id})" class="px-6 py-4 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 min-h-[52px]">
                        <i data-lucide="check" class="w-5 h-5"></i>
                        <span>Naik Kendaraan</span>
                      </button>
                    ` : isPickedUp ? `
                      <div class="px-5 py-3 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
                        <span>Sudah di Mobil</span>
                      </div>
                    ` : `
                      <span class="text-xs text-slate-500 font-mono">Siap Jemput</span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  /**
   * Return Trip Manager (Tab dedicated for returning recovered/checked students)
   */
  async renderReturnTrip(container) {
    const res = await Api.get('/driver/return-trip');
    const returnData = res.data;

    if (!returnData || !returnData.batch) {
      container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
          <div>
            <h2 class="text-2xl font-black text-white font-mono">RETURN TRIP MANAGER</h2>
            <p class="text-xs text-slate-400">Pengantaran kembali mahasiswa yang telah selesai diperiksa dokter ke asrama</p>
          </div>
          <div class="bg-slate-900 rounded-3xl border border-slate-800 p-10 text-center text-slate-400 space-y-2">
            <i data-lucide="rotate-ccw" class="w-12 h-12 text-slate-500 mx-auto"></i>
            <h3 class="text-base font-bold text-white">Belum Ada Return Trip Aktif</h3>
            <p class="text-xs text-slate-400 max-w-md mx-auto">
              Mahasiswa saat ini masih dalam proses pemeriksaan oleh dokter klinik. Begitu selesai diperiksa, mereka akan muncul di antrean kepulangan ini.
            </p>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: container });
      return;
    }

    const batchInfo = returnData.batch;
    const students = returnData.siap_dipulangkan || [];
    const triggerAktif = returnData.trigger_aktif;
    const finishedCount = returnData.selesai_diperiksa || 0;
    const neededCount = returnData.ambang_trigger || 1;
    const batchStatus = (batchInfo.status || '').toUpperCase();
    const isAtClinic = batchStatus === 'AT_CLINIC';
    const isReturning = batchStatus === 'RETURNING';

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-white font-mono">RETURN TRIP MANAGER</h2>
            <p class="text-xs text-slate-400">Antar pulang mahasiswa yang telah selesai pemeriksaan ke kamar asrama</p>
          </div>
          <button onclick="window.DriverView.render(document.getElementById('app-view'), 'return')" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Refresh</span>
          </button>
        </div>

        <div class="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <span class="text-xs font-mono font-black text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded border border-orange-800">${batchInfo.label}</span>
              <h3 class="text-lg font-black text-white mt-1">
                ${isAtClinic ? 'Mahasiswa Selesai Periksa — Siap Dipulangkan' : 'Perjalanan Mengantar Kembali ke Asrama'}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Progres Pemeriksaan: <strong class="text-emerald-400">${finishedCount} dari ${neededCount} mahasiswa telah siap pulang</strong>
              </p>
            </div>

            <!-- One-Tap Return Action Button -->
            <div class="flex items-center gap-2">
              ${isAtClinic ? `
                <button onclick="window.DriverView.startReturnTrip(${batchInfo.id})" ${!triggerAktif ? 'disabled' : ''} class="px-6 py-4 ${triggerAktif ? 'bg-orange-500 hover:bg-orange-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'} font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 min-h-[52px]">
                  <i data-lucide="play" class="w-5 h-5"></i>
                  <span>${triggerAktif ? 'Mulai Antar Pulang' : 'Menunggu Pemeriksaan Dokter Selesai'}</span>
                </button>
              ` : isReturning ? `
                <button onclick="window.DriverView.completeReturnTrip(${batchInfo.id})" class="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 min-h-[52px]">
                  <i data-lucide="check-check" class="w-5 h-5"></i>
                  <span>Selesaikan Antar Pulang (Complete)</span>
                </button>
              ` : ''}
            </div>
          </div>

          <div class="space-y-3">
            <span class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">DAFTAR MAHASISWA & ASRAMA TUJUAN:</span>
            ${students.map(s => `
              <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <strong class="text-white text-sm">${s.nama || s.student?.name}</strong>
                  <span class="text-xs font-mono text-slate-400 ml-1">(${s.nim || s.student?.identifier})</span>
                  <div class="text-xs text-orange-400 font-semibold mt-0.5">Tujuan: Asrama ${s.lokasi}</div>
                </div>
                ${Config.getStatusBadge(s.status)}
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  async renderHistory(container) {
    const res = await Api.get('/driver/history');
    const items = res.data || [];

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-4 animate-fade-in-up">
        <div>
          <h2 class="text-2xl font-black text-white font-mono">TRIP LOG & HISTORY</h2>
          <p class="text-xs text-slate-400">Seluruh riwayat perjalanan dan evakuasi mahasiswa yang telah selesai Anda tangani</p>
        </div>

        <div class="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs divide-y divide-slate-800">
            <thead class="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th class="py-3 px-4">Batch ID</th>
                <th class="py-3 px-4">Jumlah Pasien</th>
                <th class="py-3 px-4">Status Akhir</th>
                <th class="py-3 px-4">Tanggal Operasi</th>
                <th class="py-3 px-4">Durasi Rute</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              ${items.length === 0 ? `
                <tr><td colspan="5" class="py-10 text-center text-slate-500">Belum ada riwayat operasi yang tercatat</td></tr>
              ` : items.map(b => `
                <tr class="hover:bg-slate-800/60 transition">
                  <td class="py-3.5 px-4 font-mono font-bold text-orange-400">${b.batch || 'B00' + b.id}</td>
                  <td class="py-3.5 px-4 font-semibold text-white">${b.mahasiswa || b.jumlah_anggota || 0} Mahasiswa</td>
                  <td class="py-3.5 px-4">${Config.getStatusBadge(b.status || 'COMPLETED')}</td>
                  <td class="py-3.5 px-4 text-slate-400">${b.tanggal || '-'}</td>
                  <td class="py-3.5 px-4 font-mono text-slate-400">${b.durasi_menit ? b.durasi_menit + ' Menit' : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  // Actions
  async acceptBatch(id) {
    try {
      await Api.post(`/driver/batches/${id}/accept`);
      Api.toast('Batch berhasil Anda terima! Siap menjemput.', 'success');
      window.App.switchTab('trip');
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  async startBatch(id) {
    try {
      await Api.post(`/driver/batches/${id}/start`);
      Api.toast('Status diubah ke Driver OTW. Notifikasi dispatch terkirim!', 'success');
      await this.render(document.getElementById('app-view'), 'trip');
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  async pickupStudent(reqId) {
    try {
      await Api.post(`/driver/requests/${reqId}/pickup`);
      Api.toast('Mahasiswa berhasil naik ke armada shuttle!', 'success');
      await this.render(document.getElementById('app-view'), 'trip');
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  async arriveClinic(id) {
    try {
      await Api.post(`/driver/batches/${id}/arrive-clinic`);
      Api.toast('Konfirmasi tiba di klinik berhasil! Pasien masuk antrean pemeriksaan.', 'success');
      window.App.switchTab('dashboard');
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  async startReturnTrip(id) {
    try {
      await Api.post(`/driver/batches/${id}/return/start`);
      Api.toast('Perjalanan antar pulang dimulai!', 'success');
      await this.render(document.getElementById('app-view'), 'return');
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  async completeReturnTrip(id) {
    try {
      await Api.post(`/driver/batches/${id}/return/complete`);
      Api.toast('Return trip selesai! Seluruh mahasiswa telah sampai di asrama.', 'success');
      window.App.switchTab('history');
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  }
};

window.DriverView = DriverView;
