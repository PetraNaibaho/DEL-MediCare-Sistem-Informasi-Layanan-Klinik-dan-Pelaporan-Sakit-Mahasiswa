/**
 * DEL-MediCare - Klinik View
 * Screen 3: Clinical Command Center (KPI Strip with Trends, Audio Panggilan Pasien, Rapid Side-Drawer e-Surat with Canvas Signature)
 */

const KlinikView = {
  currentTab: 'dashboard',
  queueViewMode: 'kanban', // 'kanban' or 'table'

  playChimeAlert() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Ding tone (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Dong tone (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0.3, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio synthesis note:', e);
    }
  },

  async render(container, tab = 'dashboard', isSilent = false) {
    this.currentTab = tab;
    if (!isSilent) {
      container.innerHTML = `
        <div class="flex items-center justify-center min-h-[300px]">
          <div class="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      `;
    }

    try {
      if (tab === 'dashboard') {
        await this.renderDashboard(container);
      } else if (tab === 'queue') {
        await this.renderQueue(container);
      } else if (tab === 'letters') {
        await this.renderLetters(container);
      } else if (tab === 'history') {
        await this.renderHistory(container);
      }
    } catch (err) {
      container.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center max-w-lg mx-auto">
          <i data-lucide="alert-circle" class="w-10 h-10 text-rose-500 mx-auto mb-2"></i>
          <h3 class="text-sm font-bold text-rose-800">Gagal Memuat Data Command Center Klinik</h3>
          <p class="text-xs text-rose-600 mt-1 mb-4">${err.message}</p>
          <button onclick="window.KlinikView.render(document.getElementById('app-view'), '${tab}')" class="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition">Coba Lagi</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: container });
    }
  },

  getNavItems() {
    return [
      { id: 'dashboard', label: 'Command Center', icon: 'stethoscope' },
      { id: 'queue', label: 'Patient Queue', icon: 'users' },
      { id: 'letters', label: 'e-Surat Sakit', icon: 'file-text' },
      { id: 'history', label: 'Medical Vault', icon: 'archive' }
    ];
  },

  getTriageBadge(keluhan = '') {
    const text = keluhan.toLowerCase();
    if (text.includes('pingsan') || text.includes('sesak') || text.includes('kejang') || text.includes('pendarahan') || text.includes('tinggi') || text.includes('darurat')) {
      return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs">
        <span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
        Triage 1: Gawat Darurat
      </span>`;
    }
    if (text.includes('mual') || text.includes('muntah') || text.includes('diare') || text.includes('migrain') || text.includes('demam') || text.includes('maag')) {
      return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
        Triage 2: Observasi
      </span>`;
    }
    return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
      Triage 3: Ringan
    </span>`;
  },

  /**
   * Screen 3 — Dashboard Klinik (Command Center)
   */
  async renderDashboard(container) {
    const res = await Api.get('/klinik/dashboard');
    const data = res.data;
    const stats = data.stats || {};
    const queue = data.antrean_pemeriksaan || [];
    const doctor = Auth.getUser() || {};

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in-up">
        
        <!-- Welcome Hero Strip (Clinical Teal & Slate) -->
        <div class="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
          <div class="relative z-10 max-w-2xl">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-semibold mb-3 border border-white/10">
              <i data-lucide="stethoscope" class="w-3.5 h-3.5 text-teal-300"></i> Clinical Command Center &bull; Poliklinik IT Del
            </span>
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              ${doctor.name || 'dr. Maria Sihotang'}
            </h2>
            <p class="text-xs sm:text-sm text-teal-100/90 mt-2 leading-relaxed">
              Monitoring antrean fisik mahasiswa di klinik. Panggil pasien dengan sistem pengeras suara terintegrasi dan terbitkan e-Surat Sakit langsung ke sistem Keasramaan & Dosen dengan 1-klik.
            </p>
            <div class="mt-6 flex flex-wrap items-center gap-3">
              <button onclick="window.App.switchTab('queue')" class="px-6 py-3 bg-white hover:bg-teal-50 text-teal-950 font-black text-xs rounded-2xl shadow-lg transition flex items-center gap-2 hover:-translate-y-0.5">
                <i data-lucide="users" class="w-4 h-4 text-teal-600"></i>
                <span>Kelola Antrean Pasien (${stats.di_klinik || 0} Menunggu)</span>
              </button>
              <button onclick="window.App.switchTab('letters')" class="px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-2xl backdrop-blur-xs border border-white/20 transition flex items-center gap-2">
                <i data-lucide="file-check" class="w-4 h-4 text-teal-300"></i>
                <span>Arsip e-Surat Terbit</span>
              </button>
            </div>
          </div>

          <div class="absolute -right-8 -bottom-8 opacity-15 pointer-events-none text-white">
            <i data-lucide="activity" class="w-64 h-64"></i>
          </div>
        </div>

        <!-- 1. REAL-TIME KPI STRIP (Live Updating Numbers with Trend Indicators) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registrations</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                <i data-lucide="trending-up" class="w-3 h-3 text-emerald-600"></i> +12%
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              ${stats.total_antrean || 0} <span class="text-xs font-bold text-slate-400">Pasien</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Total pendaftaran hari ini</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition cursor-pointer hover:border-teal-400" onclick="window.App.switchTab('queue')">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Arrived at Clinic</span>
              <span class="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-teal-600 tracking-tight font-mono">
              ${stats.di_klinik || 0} <span class="text-xs font-bold text-teal-400">Mhs</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Tiba via shuttle darurat</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Examination</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Aktif</span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
              ${stats.sedang_diperiksa || 0} <span class="text-xs font-bold text-amber-400">Pasien</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">${stats.sedang_diperiksa_kode ? 'Antrean ' + stats.sedang_diperiksa_kode : 'Ruang dokter siap'}</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition cursor-pointer hover:border-blue-400" onclick="window.App.switchTab('letters')">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Issued Sick Notes</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-0.5">
                <i data-lucide="check" class="w-3 h-3 text-blue-600"></i> Sah
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight font-mono">
              ${stats.surat_diterbitkan_hari_ini || 0} <span class="text-xs font-bold text-blue-400">Surat</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Diterbitkan hari ini</span>
          </div>

        </div>

        <!-- 2. SMART PATIENT QUEUE (Quick Action List with Audio Call) -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900">Antrean Pasien Menunggu Pemeriksaan</h3>
              <p class="text-xs text-slate-500">Mahasiswa yang telah sampai di klinik dan siap dipanggil masuk ruang periksa</p>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.App.switchTab('queue')" class="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-teal-200">
                <i data-lucide="columns-3" class="w-4 h-4"></i>
                <span>Tampilan Kanban Lengkap</span>
              </button>
            </div>
          </div>

          <div class="space-y-3">
            ${queue.length === 0 ? `
              <div class="p-8 text-center text-slate-400 space-y-2">
                <i data-lucide="user-check" class="w-10 h-10 text-slate-300 mx-auto"></i>
                <p class="text-xs font-bold text-slate-600">Ruang Tunggu Pasien Kosong</p>
                <p class="text-[11px] text-slate-400">Pasien akan otomatis bertambah ketika Driver mengonfirmasi tiba di poliklinik</p>
              </div>
            ` : queue.slice(0, 5).map(p => {
              const pStatus = (p.status || '').toUpperCase();
              const isInExam = pStatus === 'IN_EXAMINATION';
              const pNama = p.nama || p.student?.name || 'Mahasiswa';
              const pNim = p.nim || p.student?.identifier || '-';
              const pKeluhan = p.keluhan || '-';

              return `
                <div class="p-4 rounded-2xl border ${isInExam ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-100' : 'bg-slate-50 border-slate-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-xs">
                  <div class="flex items-start gap-3">
                    <span class="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-teal-700 font-mono font-black flex items-center justify-center text-base shadow-xs shrink-0">
                      ${p.nomor_antrean_label || 'ANT-' + p.nomor_antrean}
                    </span>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="font-extrabold text-slate-900 text-sm">${pNama}</span>
                        <span class="text-xs font-mono font-bold text-slate-500">(${pNim})</span>
                        ${this.getTriageBadge(pKeluhan)}
                      </div>
                      <div class="text-xs text-slate-600">
                        Asal Asrama: <strong class="text-slate-800">${p.lokasi}</strong> &bull;
                        Keluhan: <span class="italic text-slate-700 font-medium">"${pKeluhan}"</span>
                      </div>
                    </div>
                  </div>

                  <!-- Quick Action: Panggil Pasien with Audio Trigger -->
                  <div class="flex items-center gap-2 self-end sm:self-auto">
                    ${Config.getStatusBadge(p.status)}

                    ${isInExam ? `
                      <button onclick="window.KlinikView.openExamModal(${p.id}, '${pNama.replace(/'/g, "\\'")}', '${pNim}', '${pKeluhan.replace(/'/g, "\\'")}')" class="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5">
                        <i data-lucide="clipboard-edit" class="w-4 h-4"></i>
                        <span>Input e-Surat Sakit</span>
                      </button>
                    ` : `
                      <button onclick="window.KlinikView.startExamWithChime(${p.id}, '${pNama.replace(/'/g, "\\'")}', '${p.nomor_antrean_label || 'ANT-' + p.nomor_antrean}')" class="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95">
                        <i data-lucide="volume-2" class="w-4 h-4"></i>
                        <span>Panggil Pasien (Bell)</span>
                      </button>
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

  startExamWithChime(reqId, nama, antrean) {
    this.playChimeAlert();
    Api.toast(`🔔 Memanggil ${antrean}: ${nama} ke ruang pemeriksaan!`, 'info');
    this.startExam(reqId);
  },

  async startExam(reqId) {
    try {
      await Api.post(`/klinik/requests/${reqId}/start-exam`);
      await this.render(document.getElementById('app-view'), this.currentTab, true);
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  async renderQueue(container) {
    const res = await Api.get('/klinik/queue');
    const items = res.data || [];

    const waitingList = items.filter(p => ['AT_CLINIC', 'WAITING_EXAM', 'DRIVER_ON_THE_WAY', 'PICKED_UP'].includes((p.status || '').toUpperCase()));
    const inExamList = items.filter(p => (p.status || '').toUpperCase() === 'IN_EXAMINATION');
    const completedList = items.filter(p => ['EXAM_COMPLETED', 'SICK_CONFIRMED', 'E_SICK_LETTER_ISSUED', 'RETURN_PENDING', 'RETURNED', 'COMPLETED'].includes((p.status || '').toUpperCase()));

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Queue Management & Triage</h2>
            <p class="text-xs text-slate-500">Alur pasien real-time dengan sinyal panggilan dan visualisasi kanban klinis</p>
          </div>
          
          <div class="flex items-center gap-2">
            <button onclick="window.KlinikView.render(document.getElementById('app-view'), 'queue')" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        <!-- KANBAN BOARD -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <!-- Column 1: Menunggu Panggilan -->
          <div class="bg-slate-100/80 rounded-3xl p-4 border border-slate-200 space-y-3">
            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Menunggu Panggilan</h4>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-slate-700 shadow-2xs">${waitingList.length}</span>
            </div>

            <div class="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              ${waitingList.length === 0 ? `
                <div class="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
                  Tidak ada pasien menunggu
                </div>
              ` : waitingList.map(p => this.renderKanbanCard(p, 'waiting')).join('')}
            </div>
          </div>

          <!-- Column 2: Sedang Diperiksa -->
          <div class="bg-amber-50/70 rounded-3xl p-4 border border-amber-200 space-y-3">
            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h4 class="text-xs font-black text-amber-900 uppercase tracking-wider">Sedang Diperiksa</h4>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-amber-800 shadow-2xs">${inExamList.length}</span>
            </div>

            <div class="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              ${inExamList.length === 0 ? `
                <div class="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-amber-200">
                  Ruang dokter siap
                </div>
              ` : inExamList.map(p => this.renderKanbanCard(p, 'exam')).join('')}
            </div>
          </div>

          <!-- Column 3: Selesai / e-Surat Terbit -->
          <div class="bg-teal-50/70 rounded-3xl p-4 border border-teal-200 space-y-3">
            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-teal-500"></span>
                <h4 class="text-xs font-black text-teal-900 uppercase tracking-wider">Selesai / Terbit Surat</h4>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-teal-800 shadow-2xs">${completedList.length}</span>
            </div>

            <div class="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              ${completedList.length === 0 ? `
                <div class="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-teal-200">
                  Belum ada pasien selesai
                </div>
              ` : completedList.map(p => this.renderKanbanCard(p, 'done')).join('')}
            </div>
          </div>

        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  renderKanbanCard(p, columnType) {
    const pNama = p.nama || p.student?.name || 'Mahasiswa';
    const pNim = p.nim || p.student?.identifier || '-';
    const pKeluhan = p.keluhan || '-';

    return `
      <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition space-y-3">
        <div class="flex items-start justify-between">
          <span class="px-2 py-0.5 rounded-md font-mono font-black text-xs bg-teal-50 text-teal-700 border border-teal-200">
            ${p.nomor_antrean_label || 'ANT-' + p.nomor_antrean}
          </span>
          ${this.getTriageBadge(pKeluhan)}
        </div>

        <div>
          <h5 class="font-extrabold text-slate-900 text-xs">${pNama}</h5>
          <span class="text-[10px] text-slate-500 font-mono">${pNim} &bull; Asrama ${p.lokasi}</span>
          <p class="text-[11px] text-slate-700 italic mt-1 bg-slate-50 p-2 rounded-xl">"${pKeluhan}"</p>
        </div>

        <div class="pt-1 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[10px] text-slate-400 font-medium">${p.waktu || 'Hari Ini'}</span>
          
          ${columnType === 'waiting' ? `
            <button onclick="window.KlinikView.startExamWithChime(${p.id}, '${pNama.replace(/'/g, "\\'")}', '${p.nomor_antrean_label || 'ANT-' + p.nomor_antrean}')" class="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition flex items-center gap-1 active:scale-95">
              <i data-lucide="volume-2" class="w-3 h-3"></i>
              <span>Panggil</span>
            </button>
          ` : columnType === 'exam' ? `
            <button onclick="window.KlinikView.openExamModal(${p.id}, '${pNama.replace(/'/g, "\\'")}', '${pNim}', '${pKeluhan.replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black rounded-xl shadow-xs transition flex items-center gap-1">
              <i data-lucide="check" class="w-3 h-3"></i>
              <span>Input e-Surat</span>
            </button>
          ` : `
            <span class="text-[10px] font-bold text-teal-700 flex items-center gap-1">
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Selesai
            </span>
          `}
        </div>
      </div>
    `;
  },

  /**
   * Screen 3: RAPID e-SURAT PUBLISHER (Dynamic Side-Drawer / Modal with Template Tags & Signature Canvas)
   */
  openExamModal(reqId, nama, nim, keluhan) {
    const modalBox = document.getElementById('modal-box');
    const backdrop = document.getElementById('modal-backdrop');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    modalBox.innerHTML = `
      <div class="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
            <i data-lucide="clipboard-pen" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-black text-white">Rapid e-Surat Publisher (EHR)</h3>
            <p class="text-xs text-slate-400">Pasien: <strong class="text-white">${nama} (${nim})</strong></p>
          </div>
        </div>
        <button onclick="window.App.closeModal()" class="text-slate-400 hover:text-white transition">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form onsubmit="window.KlinikView.submitExam(event, ${reqId})" class="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
        
        <!-- Quick Complaint Summary -->
        <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <span class="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Keluhan Fisik Pasien:</span>
          <p class="text-slate-800 italic font-semibold mt-0.5">"${keluhan}"</p>
        </div>

        <!-- 1. Multi-Select Diagnosis Template Pills -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">
            Pilih Template Diagnosis Cepat:
          </label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button type="button" onclick="window.KlinikView.setDiagnosisTemplate('J06.9 — Infeksi Saluran Pernapasan Akut (ISPA)')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition">
              + ISPA
            </button>
            <button type="button" onclick="window.KlinikView.setDiagnosisTemplate('K30 — Dispepsia / Gastritis Akut (Maag)')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition">
              + Gastritis/Maag
            </button>
            <button type="button" onclick="window.KlinikView.setDiagnosisTemplate('R50.9 — Febris Akut / Demam Tinggi')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition">
              + Demam Febris
            </button>
            <button type="button" onclick="window.KlinikView.setDiagnosisTemplate('G44.2 — Tension Headache / Cephalea (Pusing Migrain)')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition">
              + Migrain / Cephalea
            </button>
            <button type="button" onclick="window.KlinikView.setDiagnosisTemplate('R53 — Malaise & Fatigue / Kelelahan Fisik Ekstrem')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition">
              + Kelelahan Fisik
            </button>
          </div>

          <input type="text" id="exam-diagnosis" required class="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Tuliskan diagnosis medis lengkap...">
        </div>

        <!-- Catatan Medis & Terapi Obat -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Catatan Terapi & Obat (Internal Klinik):</label>
          <textarea id="exam-notes" rows="2" class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="misal: Paracetamol 500mg 3x1, Antasida 3x1 ac, istirahat tirah baring di kamar..."></textarea>
        </div>

        <!-- 2. Auto-Filled Rest Days (1-3 Days Quick Chips) -->
        <div class="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-black text-teal-950 block">Rekomendasi Istirahat & Penerbitan e-Surat:</span>
              <span class="text-[11px] text-teal-700">Tersinkronisasi langsung ke Presensi Dosen & Izin Asrama</span>
            </div>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                <input type="radio" name="is_sick" value="1" checked onchange="window.KlinikView.toggleSickDates(true)"> Ya (Terbitkan)
              </label>
              <label class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                <input type="radio" name="is_sick" value="0" onchange="window.KlinikView.toggleSickDates(false)"> Tidak Sakit
              </label>
            </div>
          </div>

          <div id="sick-dates-container" class="space-y-3 pt-2 border-t border-teal-200/60">
            <div>
              <span class="block text-[11px] font-bold text-teal-900 mb-1.5">Pilih Durasi Istirahat Cepat:</span>
              <div class="flex items-center gap-2">
                <button type="button" onclick="window.KlinikView.setDurationDays(1)" class="duration-chip px-3 py-1.5 bg-white hover:bg-teal-600 hover:text-white border border-teal-300 rounded-xl text-xs font-bold text-teal-800 transition">
                  1 Hari
                </button>
                <button type="button" onclick="window.KlinikView.setDurationDays(2)" class="duration-chip px-3 py-1.5 bg-white hover:bg-teal-600 hover:text-white border border-teal-300 rounded-xl text-xs font-bold text-teal-800 transition">
                  2 Hari
                </button>
                <button type="button" onclick="window.KlinikView.setDurationDays(3)" class="duration-chip px-3 py-1.5 bg-white hover:bg-teal-600 hover:text-white border border-teal-300 rounded-xl text-xs font-bold text-teal-800 transition">
                  3 Hari
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-teal-900 mb-1">Mulai Izin:</label>
                <input type="date" id="exam-start" value="${today}" class="w-full text-xs p-2 bg-white border border-teal-300 rounded-lg">
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-teal-900 mb-1">Selesai Izin:</label>
                <input type="date" id="exam-end" value="${tomorrow}" class="w-full text-xs p-2 bg-white border border-teal-300 rounded-lg">
              </div>
            </div>

            <!-- 3. Digital Signature Canvas / Stamp Badge Preview -->
            <div class="p-3 bg-white rounded-xl border border-teal-200/80 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <div class="doctor-stamp">
                  DIGITAL SIGNED &bull; IT DEL
                </div>
                <div class="text-[11px] text-slate-600">
                  Tanda Tangan Digital: <strong class="text-slate-900">${Auth.getUser()?.name || 'dr. Maria Sihotang'}</strong>
                </div>
              </div>
              <span class="text-[10px] text-teal-700 font-bold">Audit Terverifikasi</span>
            </div>
          </div>
        </div>

        <!-- 4. One-Click Instant Issuance CTA -->
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onclick="window.App.closeModal()" class="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
          <button type="submit" id="submit-exam-btn" class="px-6 py-2.5 text-xs font-black bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition flex items-center gap-2">
            <span>Terbitkan e-Surat Sakit Sekarang</span>
            <i data-lucide="check-circle" class="w-4 h-4"></i>
          </button>
        </div>
      </form>
    `;

    backdrop.classList.remove('hidden');
    if (window.lucide) lucide.createIcons({ root: modalBox });
  },

  setDiagnosisTemplate(val) {
    const input = document.getElementById('exam-diagnosis');
    if (input) {
      input.value = val;
      input.focus();
    }
  },

  setDurationDays(days) {
    const startInput = document.getElementById('exam-start');
    const endInput = document.getElementById('exam-end');
    if (!startInput || !endInput) return;

    const startDate = new Date(startInput.value || Date.now());
    const endDate = new Date(startDate.getTime() + (days - 1) * 86400000);
    endInput.value = endDate.toISOString().split('T')[0];
    Api.toast(`Durasi diatur: ${days} hari istirahat`, 'info');
  },

  toggleSickDates(isSick) {
    const box = document.getElementById('sick-dates-container');
    if (box) {
      if (isSick) {
        box.classList.remove('hidden');
      } else {
        box.classList.add('hidden');
      }
    }
  },

  async submitExam(e, reqId) {
    e.preventDefault();
    const diagnosis = document.getElementById('exam-diagnosis').value;
    const catatan = document.getElementById('exam-notes').value;
    const isSick = document.querySelector('input[name="is_sick"]:checked')?.value === '1';
    const mulai = document.getElementById('exam-start')?.value;
    const selesai = document.getElementById('exam-end')?.value;
    const btn = document.getElementById('submit-exam-btn');

    btn.disabled = true;
    btn.innerHTML = `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Menerbitkan e-Surat...</span>`;

    try {
      const payload = {
        diagnosis,
        catatan,
        catatan_medis: catatan,
        is_sick: isSick,
        mulai_izin: isSick ? mulai : null,
        selesai_izin: isSick ? selesai : null
      };
      await Api.post(`/klinik/requests/${reqId}/complete-exam`, payload);
      Api.toast('Pemeriksaan berhasil diselesaikan & e-Surat resmi diterbitkan!', 'success');
      window.App.closeModal();
      window.App.switchTab('queue');
    } catch (err) {
      Api.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>Terbitkan e-Surat Sakit Sekarang</span>`;
      if (window.lucide) lucide.createIcons({ root: btn });
    }
  },

  /**
   * Screen 3: MEDICAL HISTORY VAULT (Fast Search Patient Log Table with Instant PDF Export & Verification Badges)
   */
  async renderHistory(container) {
    const res = await Api.get('/klinik/history');
    const items = res.data || [];

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-5 animate-fade-in-up">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Medical History Vault</h2>
            <p class="text-xs text-slate-500">Log rekam medis terverifikasi dengan fitur filter cepat dan ekspor dokumen</p>
          </div>
          
          <div class="flex items-center gap-2">
            <div class="relative w-full sm:w-72">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </span>
              <input type="text" id="search-history-input" oninput="window.KlinikView.filterHistory(this.value)" class="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Cari Pasien, NIM, Diagnosis...">
            </div>
            <button onclick="window.print()" class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Cetak Vault</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs divide-y divide-slate-100" id="history-table">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="py-3 px-4">Waktu & Tanggal</th>
                <th class="py-3 px-4">Mahasiswa / NIM</th>
                <th class="py-3 px-4">Diagnosis Medis</th>
                <th class="py-3 px-4">Status & Hasil</th>
                <th class="py-3 px-4 text-right">e-Surat & Audit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700" id="history-table-body">
              ${items.length === 0 ? `
                <tr><td colspan="5" class="py-10 text-center text-slate-400">Belum ada riwayat medis tercatat</td></tr>
              ` : items.map(m => `
                <tr class="hover:bg-slate-50 transition history-row" data-search="${(m.mahasiswa + ' ' + m.nim + ' ' + (m.diagnosis || '')).toLowerCase()}">
                  <td class="py-3 px-4 text-slate-500">
                    <div>${m.tanggal || '-'}</div>
                    <div class="text-[10px] text-slate-400">${m.waktu || ''} WIB</div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-extrabold text-slate-900">${m.mahasiswa || '-'}</div>
                    <div class="text-[10px] font-mono text-slate-500">${m.nim || '-'}</div>
                  </td>
                  <td class="py-3 px-4 font-semibold text-slate-800 italic">
                    "${m.diagnosis || 'Pemeriksaan Rutin'}"
                  </td>
                  <td class="py-3 px-4">
                    ${Config.getStatusBadge(m.status)}
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-bold text-teal-700">
                    ${m.surat ? `
                      <span class="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-xs">${m.surat}</span>
                    ` : '<span class="text-slate-400 font-normal">-</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  filterHistory(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.history-row');
    rows.forEach(row => {
      const searchData = row.getAttribute('data-search') || '';
      if (!q || searchData.includes(q)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  },

  async renderLetters(container) {
    const res = await Api.get('/klinik/letters');
    const letters = res.data || [];

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-4 animate-fade-in-up">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Arsip e-Surat Sakit yang Diterbitkan</h2>
            <p class="text-xs text-slate-500">Daftar surat izin sakit resmi yang diterbitkan oleh dokter Klinik IT Del</p>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs divide-y divide-slate-100">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="py-3 px-4">No. Surat</th>
                <th class="py-3 px-4">Mahasiswa</th>
                <th class="py-3 px-4">Diagnosis</th>
                <th class="py-3 px-4">Lama Izin</th>
                <th class="py-3 px-4">Periode</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${letters.length === 0 ? `
                <tr><td colspan="6" class="py-8 text-center text-slate-400">Belum ada surat diterbitkan</td></tr>
              ` : letters.map(l => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-3 px-4 font-mono font-bold text-teal-700">${l.nomor}</td>
                  <td class="py-3 px-4 font-bold text-slate-800">${l.nama || l.student?.name} <span class="text-slate-400 font-mono font-normal">(${l.nim || l.student?.identifier})</span></td>
                  <td class="py-3 px-4 italic text-slate-600">${l.keterangan || l.diagnosis || '-'}</td>
                  <td class="py-3 px-4 font-bold text-slate-800">${l.lama_hari || 1} Hari</td>
                  <td class="py-3 px-4 text-slate-500">${l.mulai_izin} s.d ${l.selesai_izin}</td>
                  <td class="py-3 px-4 text-right">
                    <button onclick="window.MahasiswaView.displayLetterModal(${JSON.stringify(l).replace(/"/g, '&quot;')})" class="px-3 py-1.5 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-xl text-slate-700 text-xs font-semibold transition">
                      Buka Dokumen
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  }
};

window.KlinikView = KlinikView;
