/**
 * DEL-MediCare - Mahasiswa View
 * Screen 1: Patient Life-Line Dashboard (Stress-Free, Live Tracking Morph Widget, 7-Stage Tracker & Holographic e-Surat)
 */

const MahasiswaView = {
  currentTab: 'dashboard',
  _countdownTimer: null,

  async render(container, tab = 'dashboard', isSilent = false, extraParam = null) {
    this.currentTab = tab;
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }
    if (!isSilent) {
      container.innerHTML = `
        <div class="flex items-center justify-center min-h-[300px]">
          <div class="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      `;
    }

    try {
      if (tab === 'dashboard') {
        await this.renderDashboard(container);
      } else if (tab === 'active') {
        await this.renderActiveStatus(container, extraParam);
      } else if (tab === 'history') {
        await this.renderHistory(container);
      } else if (tab === 'letters') {
        await this.renderLetters(container);
      }
    } catch (err) {
      container.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center max-w-lg mx-auto">
          <i data-lucide="alert-circle" class="w-10 h-10 text-rose-500 mx-auto mb-2"></i>
          <h3 class="text-sm font-bold text-rose-800">Gagal Memuat Data Mahasiswa</h3>
          <p class="text-xs text-rose-600 mt-1 mb-4">${err.message}</p>
          <button onclick="window.MahasiswaView.render(document.getElementById('app-view'), '${tab}')" class="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition">Coba Lagi</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: container });
    }
  },

  getNavItems() {
    return [
      { id: 'dashboard', label: 'Life-Line Dashboard', icon: 'heart-pulse' },
      { id: 'active', label: 'Tracking & Antrean', icon: 'activity' },
      { id: 'history', label: 'Riwayat Medis', icon: 'history' },
      { id: 'letters', label: 'e-Surat Sakit', icon: 'file-text' }
    ];
  },

  /**
   * Screen 1 — Patient Life-Line Dashboard
   */
  async renderDashboard(container) {
    const res = await Api.get('/mahasiswa/dashboard');
    const data = res.data;
    const stats = data.stats || {};
    const active = data.request_aktif;
    const user = data.user || Auth.getUser();

    // Dapatkan juga surat sakit terakhir (jika ada) untuk Holographic Card
    let latestLetter = null;
    try {
      const letRes = await Api.get('/mahasiswa/letters');
      if (letRes && letRes.data && letRes.data.length > 0) {
        latestLetter = letRes.data[0];
      }
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in-up">
        
        <!-- 1. HERO STATUS CARD: Dynamic Patient Greeting & Immediate SOS / Live Tracking Morph Widget -->
        ${active ? `
          <!-- MORPHED ACTIVE LIVE TRACKING WIDGET -->
          <div class="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-cyan-500/30">
            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div class="space-y-2 max-w-xl">
                <div class="flex items-center gap-2">
                  <span class="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                    <span class="w-2 h-2 rounded-full bg-rose-400"></span>
                    Penjemputan Aktif Berlangsung
                  </span>
                  <span class="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-800">${active.kode}</span>
                </div>

                <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Armada Darurat Menuju Lokasi Anda
                </h2>

                <p class="text-xs sm:text-sm text-cyan-100/90 leading-relaxed">
                  Harap tetap tenang dan berada di titik penjemputan <strong class="text-white underline">${active.lokasi}</strong>. Driver armada klinik telah ditugaskan dan sedang dalam rute.
                </p>

                <!-- Vehicle Telemetry & Driver Contact Badge -->
                <div class="pt-2 flex flex-wrap items-center gap-3">
                  <div class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2.5 text-xs">
                    <div class="w-7 h-7 rounded-lg bg-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold">
                      <i data-lucide="car" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <span class="text-[10px] text-cyan-300 uppercase font-mono font-bold block">DRIVER PENJEMPUT:</span>
                      <strong class="text-white text-xs">${active.batch?.driver || 'Hendra Putra'}</strong>
                    </div>
                  </div>

                  <a href="tel:081234567890" class="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-2 text-xs font-bold transition">
                    <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
                    <span>Hubungi Driver</span>
                  </a>

                  <button onclick="window.App.switchTab('active')" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5">
                    <i data-lucide="navigation" class="w-3.5 h-3.5"></i>
                    <span>Buka Live Tracker</span>
                  </button>

                  <button onclick="window.MahasiswaView.openRequestModal()" class="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 hover:scale-105 active:scale-95">
                    <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                    <span>+ Request Sakit Lagi</span>
                  </button>
                </div>
              </div>

              <!-- ETA Countdown Telemetry Circle -->
              <div class="flex flex-col items-center justify-center bg-slate-950/70 border border-cyan-500/40 p-5 rounded-3xl backdrop-blur-xl shrink-0 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <span class="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">ESTIMASI TIBA (ETA)</span>
                <div class="text-3xl font-black text-white font-mono tracking-tight text-center">
                  ${stats.estimasi_jemput ? stats.estimasi_jemput + ' WIB' : '~8 Menit'}
                </div>
                <span class="text-[10px] text-emerald-300 font-bold mt-1 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Armada OTW Asrama
                </span>
              </div>

            </div>

            <!-- Ambient Pulse Graphic -->
            <div class="absolute -right-10 -bottom-10 opacity-15 pointer-events-none text-cyan-300">
              <i data-lucide="radar" class="w-64 h-64"></i>
            </div>
          </div>
        ` : `
          <!-- CALMING HERO BANNER WITH IMMEDIATE SOS ACTION -->
          <div class="bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
            <div class="relative z-10 max-w-2xl">
              
              <div class="flex flex-wrap items-center gap-2 mb-3">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-cyan-200 text-xs font-semibold border border-white/10">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 text-cyan-300"></i> Mahasiswa Aktif IT Del
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Layanan Siaga Kampus Siap
                </span>
              </div>

              <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Halo, ${user.name}!
              </h2>
              <p class="text-xs sm:text-sm text-blue-100/90 mt-2 leading-relaxed">
                Kesehatan dan kenyamanan Anda adalah prioritas utama. Jika Anda merasa pusing, demam tinggi, atau sakit mendadak di asrama, tekan tombol darurat di bawah ini kapan saja.
              </p>

              <!-- Immediate SOS Action Button -->
              <div class="mt-6 flex flex-wrap items-center gap-3">
                <button onclick="window.MahasiswaView.openRequestModal()" class="px-6 py-3.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-[0_0_25px_rgba(244,63,94,0.4)] transition flex items-center gap-2.5 hover:scale-105 active:scale-95">
                  <span class="w-3 h-3 rounded-full bg-white animate-ping"></span>
                  <i data-lucide="ambulance" class="w-4 h-4 text-white"></i>
                  <span>Minta Penjemputan Darurat (SOS)</span>
                </button>
                
                <div class="text-[11px] text-blue-200/90 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <span>Asrama: <strong class="text-white">${user.asrama || 'Kampus Del'}</strong></span>
                  <span>&bull;</span>
                  <span>NIM: <strong class="text-white font-mono">${user.identifier}</strong></span>
                </div>
              </div>
            </div>

            <!-- Calming Graphic -->
            <div class="absolute -right-8 -bottom-8 opacity-15 pointer-events-none text-white">
              <i data-lucide="heart-pulse" class="w-64 h-64"></i>
            </div>
          </div>
        `}

        <!-- MULTI-REQUEST ACTIVE SUMMARY BANNER (Jika ada antrean aktif - Light Theme) -->
        ${data.semua_request_aktif && data.semua_request_aktif.length > 1 ? `
          <div class="bg-white border border-blue-200/90 rounded-3xl p-5 text-slate-800 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></span>
                <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Antrean Layanan Aktif Anda</span>
                  <span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">${data.semua_request_aktif.length} Antrean</span>
                </h4>
              </div>
              <button onclick="window.MahasiswaView.openRequestModal()" class="text-xs text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>Ajukan Lagi Kapan Saja</span>
              </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${data.semua_request_aktif.map((req, idx) => `
                <div class="bg-slate-50/80 border ${req.id === (active?.id) ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-slate-200'} rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-mono font-black text-cyan-800">#${req.nomor_antrean_label || 'ANT-' + req.nomor_antrean}</span>
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${Config.getStatusBadgeClass(req.status)}">${req.status_label || req.status}</span>
                  </div>
                  <div>
                    <div class="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                      <i data-lucide="map-pin" class="w-3.5 h-3.5 text-cyan-600 shrink-0"></i>
                      <span>${req.lokasi}</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1 italic line-clamp-2">"${req.keluhan}"</p>
                  </div>
                  <button onclick="window.MahasiswaView.viewSpecificRequest(${req.id})" class="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-blue-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs">
                    <i data-lucide="navigation" class="w-3 h-3"></i>
                    <span>Lacak Antrean #${req.nomor_antrean_label || req.nomor_antrean}</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 2. QUICK METRIC STATS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-slate-500">Nomor Antrean Anda</span>
              <span class="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <i data-lucide="hash" class="w-3.5 h-3.5"></i>
              </span>
            </div>
            <div class="text-2xl font-black text-blue-700 tracking-tight font-mono">${stats.nomor_antrean || '-'}</div>
            <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <i data-lucide="calendar" class="w-3 h-3"></i>
              <span>${active ? 'Antrean Hari Ini' : 'Tidak ada antrean aktif'}</span>
            </div>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-slate-500">Estimasi Driver Tiba</span>
              <span class="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              </span>
            </div>
            <div class="text-2xl font-black text-indigo-700 tracking-tight">
              ${stats.estimasi_jemput ? stats.estimasi_jemput + ' WIB' : (active?.batch?.driver ? '~8 Menit' : '-')}
            </div>
            <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <i data-lucide="car" class="w-3 h-3 text-indigo-500"></i>
              <span>${active ? 'Driver Menuju Asrama' : 'Belum ditugaskan'}</span>
            </div>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-slate-500">Status Layanan</span>
              <span class="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <i data-lucide="activity" class="w-3.5 h-3.5"></i>
              </span>
            </div>
            <div class="text-sm font-black text-slate-800 truncate leading-snug">
              ${stats.status_label || 'Siaga / Sehat'}
            </div>
            <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}"></span>
              <span>${active ? 'Sedang Diproses Sistem' : 'Siap dipanggil'}</span>
            </div>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition cursor-pointer hover:border-blue-300" onclick="window.App.switchTab('history')">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-slate-500">Riwayat Layanan</span>
              <span class="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <i data-lucide="history" class="w-3.5 h-3.5"></i>
              </span>
            </div>
            <div class="text-2xl font-black text-slate-800 tracking-tight">${stats.riwayat_layanan || 0} Kali</div>
            <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <i data-lucide="clipboard-check" class="w-3 h-3 text-teal-500"></i>
              <span>Pemeriksaan di Klinik Del</span>
            </div>
          </div>

        </div>

        <!-- 3. LIVE 7-STAGE PROGRESS TRACKER (Interactive Stepper with Tooltips & Duration Timers) -->
        ${active ? `
          <div class="bg-white rounded-3xl border border-cyan-200 shadow-md p-6 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span class="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-md border border-cyan-200">LIVE TRACKER &bull; ${active.kode}</span>
                <h3 class="text-base font-black text-slate-900 mt-1">Status Alur 7 Tahapan Penanganan Medis</h3>
              </div>
              <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Status: ${active.status_label || active.status}
              </span>
            </div>

            <!-- 7-Stage Interactive Stepper Component -->
            ${this.render7StageInteractiveStepper(active.alur || [], active.status)}
          </div>
        ` : ''}

        <!-- 4. DIGITAL e-SURAT SAKIT CARD (Live QR & Rest Period Countdown Badge - Light Theme) -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 text-slate-800 shadow-sm relative overflow-hidden border border-slate-200/90">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-[11px] font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="badge-check" class="w-4 h-4 text-cyan-600"></i>
                Holographic Digital Medical Certificate
              </span>
              <h3 class="text-lg font-black text-slate-900 mt-1">e-Surat Sakit Resmi Terverifikasi</h3>
              <p class="text-xs text-slate-500">Terbit resmi dari dokter Klinik IT Del dengan kode QR audit dan proteksi enkripsi</p>
            </div>
            <button onclick="window.App.switchTab('letters')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center gap-1.5 self-start sm:self-auto">
              <span>Arsip Semua Surat</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="mt-5">
            ${latestLetter ? `
              <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <!-- Left: Certificate Details & Rest Countdown -->
                <div class="space-y-3 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-mono font-bold text-cyan-700 bg-cyan-100/80 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                      ${latestLetter.nomor}
                    </span>
                    
                    <!-- Real-Time Rest Period Countdown Badge -->
                    <div id="letter-countdown-badge" class="inline-flex items-center">
                      <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                        <i data-lucide="hourglass" class="w-3.5 h-3.5 animate-spin"></i>
                        <span>Menghitung sisa masa izin...</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 class="text-base font-extrabold text-slate-900">${latestLetter.keterangan || latestLetter.diagnosis || 'Izin Istirahat Medis'}</h4>
                    <p class="text-xs text-slate-600 mt-1">
                      Dokter: <strong class="text-slate-900">${latestLetter.dokter || 'dr. Maria Sihotang'}</strong> &bull;
                      Periode: <span class="font-mono text-cyan-700 font-bold">${latestLetter.mulai_izin} s.d ${latestLetter.selesai_izin}</span>
                    </p>
                  </div>

                  <!-- Instant Action Buttons -->
                  <div class="flex flex-wrap items-center gap-2 pt-1">
                    <button onclick="window.MahasiswaView.showLetterDetail(${latestLetter.id})" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs">
                      <i data-lucide="file-text" class="w-4 h-4"></i>
                      <span>Buka Dokumen PDF</span>
                    </button>

                    <!-- Instant Share to WhatsApp Action -->
                    <button onclick="window.MahasiswaView.shareToWhatsApp('${latestLetter.nomor}', '${latestLetter.nama || user.name}', '${latestLetter.mulai_izin}', '${latestLetter.selesai_izin}')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs">
                      <i data-lucide="message-circle" class="w-4 h-4"></i>
                      <span>Kirim ke Dosen / WA</span>
                    </button>

                    <button onclick="window.MahasiswaView.shareLetter(${latestLetter.id})" class="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition border border-slate-300" title="Salin Tautan Verifikasi Publik">
                      <i data-lucide="share-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

              </div>
            ` : `
              <div class="py-8 text-center text-slate-400 text-xs">
                <i data-lucide="file-question" class="w-8 h-8 text-slate-400 mx-auto mb-2"></i>
                <p>Belum ada e-Surat Sakit yang diterbitkan untuk Anda.</p>
                <p class="text-[11px] text-slate-500 mt-0.5">Surat akan otomatis terbit begitu dokter menyelesaikan pemeriksaan medis.</p>
              </div>
            `}
          </div>

        </div>

        <!-- Action bar at bottom of tracker (Multi-Activity Enabled - Light Theme) -->
        <div class="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-200/90 rounded-3xl p-5 text-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div class="space-y-1">
            <h5 class="text-sm font-black text-slate-900 flex items-center gap-2">
              <i data-lucide="info" class="w-4 h-4 text-blue-600"></i>
              <span>Dapat Melakukan Permintaan Kapan Saja</span>
            </h5>
            <p class="text-xs text-slate-600">Anda tidak dibatasi hanya 1 permintaan. Ajukan kapan saja untuk keluhan baru, kondisi mendesak, atau teman asrama.</p>
          </div>
          <button onclick="window.MahasiswaView.openRequestModal()" class="px-6 py-3 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-black rounded-2xl shadow-sm transition flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95">
            <i data-lucide="ambulance" class="w-4 h-4"></i>
            <span>Minta Penjemputan Darurat Baru</span>
          </button>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });

    if (latestLetter) {
      this.startLetterCountdown(latestLetter);
    }
  },

  /**
   * Real-Time Dynamic Live Countdown Timer for Sick Leave Rest Period
   */
  startLetterCountdown(letter) {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }

    const badgeContainer = document.getElementById('letter-countdown-badge');
    if (!badgeContainer || !letter) return;

    // Parse end date (inclusive until end of day 23:59:59.999)
    let endDate;
    if (letter.selesai_izin_iso) {
      endDate = new Date(letter.selesai_izin_iso);
    } else if (letter.selesai_izin) {
      const parts = String(letter.selesai_izin).split('-');
      if (parts.length === 3) {
        endDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59, 999);
      } else {
        endDate = new Date(letter.selesai_izin);
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      return;
    }

    // Parse start date (00:00:00)
    let startDate;
    if (letter.mulai_izin_iso) {
      startDate = new Date(letter.mulai_izin_iso);
    } else if (letter.mulai_izin) {
      const parts = String(letter.mulai_izin).split('-');
      if (parts.length === 3) {
        startDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
      } else {
        startDate = new Date(letter.mulai_izin);
        startDate.setHours(0, 0, 0, 0);
      }
    }

    // Synchronize client with server timestamp if provided
    const serverTime = letter.server_time_iso ? new Date(letter.server_time_iso).getTime() : Date.now();
    const timeOffset = serverTime - Date.now();

    const updateTimer = () => {
      const currentContainer = document.getElementById('letter-countdown-badge');
      if (!currentContainer) {
        if (this._countdownTimer) {
          clearInterval(this._countdownTimer);
          this._countdownTimer = null;
        }
        return;
      }

      const now = new Date(Date.now() + timeOffset);

      if (startDate && now < startDate) {
        // Scheduled in future
        const diffMs = startDate.getTime() - now.getTime();
        const totalSec = Math.max(0, Math.floor(diffMs / 1000));
        const days = Math.floor(totalSec / 86400);
        const hours = Math.floor((totalSec % 86400) / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        const pad = (n) => String(n).padStart(2, '0');

        const cd = days > 0 
          ? `${days} Hari ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` 
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

        currentContainer.innerHTML = `
          <span class="px-3 py-1 rounded-full text-xs font-black bg-cyan-50 text-cyan-800 border border-cyan-300 flex items-center gap-1.5 shadow-xs">
            <i data-lucide="calendar-clock" class="w-3.5 h-3.5 text-cyan-600"></i>
            <span>Masa Izin Terjadwal &bull; Dimulai dlm: <span class="font-mono font-black text-cyan-900 bg-cyan-100/90 px-1.5 py-0.5 rounded border border-cyan-200">${cd}</span></span>
          </span>
        `;
        if (window.lucide) lucide.createIcons({ root: currentContainer });
        return;
      }

      const diffMs = endDate.getTime() - now.getTime();

      if (diffMs > 0) {
        const totalSec = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSec / 86400);
        const hours = Math.floor((totalSec % 86400) / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        const pad = (n) => String(n).padStart(2, '0');

        const cd = days > 0 
          ? `${days} Hari ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` 
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

        currentContainer.innerHTML = `
          <span class="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-2 shadow-xs">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Masa Istirahat Aktif &bull; Sisa: <span class="font-mono font-black text-emerald-950 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300/80 tracking-wider">${cd}</span></span>
          </span>
        `;
        if (window.lucide) lucide.createIcons({ root: currentContainer });
      } else {
        // Expired
        currentContainer.innerHTML = `
          <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5 shadow-xs">
            <i data-lucide="clock-alert" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Masa Izin Telah Berakhir</span>
          </span>
        `;
        if (window.lucide) lucide.createIcons({ root: currentContainer });
        if (this._countdownTimer) {
          clearInterval(this._countdownTimer);
          this._countdownTimer = null;
        }
      }
    };

    updateTimer();
    this._countdownTimer = setInterval(updateTimer, 1000);
  },

  /**
   * 7-Stage Interactive Stepper with Glowing Nodes, Tooltips & Duration Timers
   */
  render7StageInteractiveStepper(backendAlur = [], currentStatus = '') {
    const SEVEN_STAGES = [
      { key: 'WAITING', label: 'Menunggu', desc: 'Permintaan Dikirim', tooltip: 'Permintaan telah masuk sistem antrean dispatch armada.', eta: '0 mnt' },
      { key: 'BATCHED', label: 'Dibatch', desc: 'Masuk Armada', tooltip: 'Telah dimasukkan ke dalam batch rombongan jemput asrama.', eta: '2 mnt' },
      { key: 'DRIVER_ON_THE_WAY', label: 'Driver OTW', desc: 'Menuju Asrama', tooltip: 'Driver sedang dalam rute perjalanan menuju asrama Anda.', eta: '5 mnt' },
      { key: 'PICKED_UP', label: 'Dijemput', desc: 'Naik Mobil', tooltip: 'Mahasiswa telah naik kendaraan dan sedang menuju klinik.', eta: '8 mnt' },
      { key: 'AT_CLINIC', label: 'Di Klinik', desc: 'Tiba di Klinik', tooltip: 'Telah tiba di ruang poliklinik kampus IT Del.', eta: '12 mnt' },
      { key: 'IN_EXAMINATION', label: 'Diperiksa', desc: 'Ruang Dokter', tooltip: 'Sedang menjalani pemeriksaan fisik oleh dokter.', eta: '15 mnt' },
      { key: 'E_SICK_LETTER_ISSUED', label: 'e-Surat Terbit', desc: 'Hasil Selesai', tooltip: 'Surat keterangan sakit resmi tervalidasi dan terbit.', eta: 'Selesai' }
    ];

    const statusToIndex = {
      WAITING: 0,
      BATCHED: 1,
      DRIVER_ACCEPTED: 1,
      DRIVER_ON_THE_WAY: 2,
      PICKED_UP: 3,
      AT_CLINIC: 4,
      WAITING_EXAM: 4,
      IN_EXAMINATION: 5,
      EXAM_COMPLETED: 6,
      SICK_CONFIRMED: 6,
      E_SICK_LETTER_ISSUED: 6,
      RETURN_PENDING: 6,
      RETURNED: 6,
      COMPLETED: 6
    };

    const activeIdx = statusToIndex[(currentStatus || '').toUpperCase()] ?? 0;

    return `
      <div class="overflow-x-auto pb-4 pt-2">
        <div class="flex items-center justify-between min-w-[760px] relative px-4">
          ${SEVEN_STAGES.map((stage, idx) => {
            const isDone = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const isPending = idx > activeIdx;

            const circleBg = isDone ? 'bg-emerald-500 text-white shadow-xs' :
                             isCurrent ? 'bg-cyan-500 text-slate-950 pulse-ring-blue shadow-[0_0_20px_rgba(6,182,212,0.6)] font-black' :
                             'bg-slate-200 text-slate-500';

            const lineBg = isDone ? 'bg-emerald-400' : 'bg-slate-200';

            return `
              <div class="flex-1 flex flex-col items-center relative text-center px-1 group cursor-pointer" title="${stage.tooltip}">
                ${idx < SEVEN_STAGES.length - 1 ? `
                  <div class="stepper-connector ${lineBg}"></div>
                ` : ''}
                
                <div class="w-10 h-10 rounded-full ${circleBg} flex items-center justify-center text-xs font-bold z-10 mb-2 transition transform ${isCurrent ? 'scale-115 ring-4 ring-cyan-200' : ''}">
                  ${isDone ? '<i data-lucide="check" class="w-4 h-4"></i>' : idx + 1}
                </div>
                
                <span class="text-xs font-bold ${isCurrent ? 'text-cyan-700 font-extrabold' : isDone ? 'text-slate-800' : 'text-slate-400'} leading-tight">
                  ${stage.label}
                </span>
                
                <span class="text-[10px] text-slate-400 mt-0.5">
                  ${stage.desc}
                </span>

                <span class="text-[9px] font-mono font-bold mt-1 px-1.5 py-0.2 rounded ${isCurrent ? 'bg-cyan-100 text-cyan-800 font-bold' : 'text-slate-400'}">
                  ${stage.eta}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  shareToWhatsApp(nomor, nama, mulai, selesai) {
    const text = encodeURIComponent(
      `Halo Bapak/Ibu Dosen & Pembina Asrama, saya ${nama} menginformasikan bahwa saya berhalangan hadir karena sakit dan telah diperiksa oleh Dokter Klinik IT Del.\n\n` +
      `No. e-Surat Sakit: ${nomor}\n` +
      `Periode Izin: ${mulai} s.d ${selesai}\n\n` +
      `Surat dapat dicek keasliannya melalui portal DEL-MediCare.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  },

  async renderActiveStatus(container, selectedId = null) {
    const url = selectedId ? `/mahasiswa/requests/active?id=${selectedId}` : '/mahasiswa/requests/active';
    const res = await Api.get(url);
    const active = res.data;
    const allActive = res.semua_aktif || (active ? [active] : []);

    if (!active && allActive.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-3xl flex items-center justify-center mx-auto">
            <i data-lucide="inbox" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800">Tidak Ada Antrean Aktif</h3>
          <p class="text-xs text-slate-500">Anda sedang tidak memiliki antrean penjemputan klinik saat ini.</p>
          <button onclick="window.MahasiswaView.openRequestModal()" class="px-5 py-2.5 bg-cyan-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-cyan-700">Daftar Pemeriksaan</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: container });
      return;
    }

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        
        <!-- MULTI-REQUEST SELECTOR TABS (Ketika mahasiswa memiliki lebih dari 1 antrean aktif - Light Theme) -->
        ${allActive.length > 1 ? `
          <div class="bg-white border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold text-slate-700 font-mono uppercase px-2 py-1">Pilih Antrean (${allActive.length} Berjalan):</span>
              ${allActive.map(req => {
                const isSelected = active && req.id === active.id;
                return `
                  <button onclick="window.MahasiswaView.renderActiveStatus(document.getElementById('app-view'), ${req.id})" 
                    class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${isSelected ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                    <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-blue-500'}"></span>
                    <span>#${req.nomor_antrean_label || 'ANT-' + req.nomor_antrean}</span>
                    <span class="text-[10px] opacity-90">(${req.status_label || req.status})</span>
                  </button>
                `;
              }).join('')}
            </div>
            <button onclick="window.MahasiswaView.openRequestModal()" class="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 hover:scale-105 active:scale-95">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Request Baru</span>
            </button>
          </div>
        ` : ''}

        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200">${active.kode}</span>
              ${Config.getStatusBadge(active.status)}
            </div>
            <h2 class="text-2xl font-black text-slate-900 mt-1">Live Tracking & Status Antrean</h2>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.MahasiswaView.openRequestModal()" class="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 hover:scale-105 active:scale-95">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
              <span>+ Ajukan Lagi</span>
            </button>
            <button onclick="window.MahasiswaView.renderActiveStatus(document.getElementById('app-view'), ${active ? active.id : ''})" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              <span>Segarkan Status</span>
            </button>
          </div>
        </div>

        <!-- 7-Stage Live Progress -->
        <div class="bg-white rounded-3xl border border-cyan-200 shadow-sm p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800">Progres Penanganan Pasien:</h3>
            <span class="text-xs font-semibold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full">
              ${active.status_label || active.status}
            </span>
          </div>
          ${this.render7StageInteractiveStepper(active.alur || [], active.status)}
        </div>

        <!-- Detail Rombongan & Driver -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="car" class="w-4 h-4 text-cyan-600"></i> Informasi Armada & Driver
            </h4>
            <div class="bg-slate-50 p-4 rounded-2xl text-xs space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-500">Batch Penjemputan:</span>
                <span class="font-bold text-slate-900">${active.batch?.label || 'Menunggu Pembentukan Batch'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Driver Penjemput:</span>
                <span class="font-bold text-indigo-700">${active.batch?.driver || 'Hendra Putra'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Estimasi Tiba di Asrama:</span>
                <span class="font-bold text-emerald-600">${active.batch?.estimasi_tiba ? active.batch.estimasi_tiba + ' WIB' : '~8 Menit'}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="map-pin" class="w-4 h-4 text-rose-600"></i> Lokasi & Keluhan
            </h4>
            <div class="bg-slate-50 p-4 rounded-2xl text-xs space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-500">Titik Jemput:</span>
                <span class="font-bold text-slate-900">${active.lokasi}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Nomor Antrean Klinik:</span>
                <span class="font-bold text-cyan-700 font-mono">${active.nomor_antrean_label || 'ANT-' + active.nomor_antrean}</span>
              </div>
              <div class="pt-1 border-t border-slate-200/60">
                <span class="text-slate-500 block text-[10px]">KELUHAN:</span>
                <p class="text-slate-800 italic font-medium">"${active.keluhan}"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action bar at bottom of tracker (Multi-Activity Enabled) -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-cyan-500/30 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div class="space-y-1">
            <h5 class="text-sm font-black text-white flex items-center gap-2">
              <i data-lucide="info" class="w-4 h-4 text-cyan-400"></i>
              <span>Dapat Melakukan Permintaan Kapan Saja</span>
            </h5>
            <p class="text-xs text-cyan-100/80">Anda tidak dibatasi hanya 1 permintaan. Ajukan kapan saja untuk keluhan baru, kondisi mendesak, atau teman asrama.</p>
          </div>
          <button onclick="window.MahasiswaView.openRequestModal()" class="px-6 py-3 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-black rounded-2xl shadow-lg transition flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95">
            <i data-lucide="ambulance" class="w-4 h-4"></i>
            <span>Minta Penjemputan Darurat Baru</span>
          </button>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  async renderHistory(container) {
    const res = await Api.get('/mahasiswa/requests');
    const items = res.data || [];

    container.innerHTML = `
      <div class="space-y-4 max-w-5xl mx-auto animate-fade-in-up">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Riwayat Layanan Pemeriksaan</h2>
            <p class="text-xs text-slate-500">Daftar seluruh riwayat penjemputan dan kunjungan Anda ke Klinik IT Del</p>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs divide-y divide-slate-100">
              <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3 px-4">Kode / Antrean</th>
                  <th class="py-3 px-4">Tanggal & Waktu</th>
                  <th class="py-3 px-4">Lokasi Jemput</th>
                  <th class="py-3 px-4">Keluhan</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Surat Sakit</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                ${items.length === 0 ? `
                  <tr>
                    <td colspan="6" class="py-8 text-center text-slate-400">Belum ada riwayat layanan</td>
                  </tr>
                ` : items.map(r => `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3 px-4">
                      <div class="font-mono font-bold text-slate-800">${r.kode}</div>
                      <div class="text-[10px] text-cyan-600 font-bold font-mono">${r.nomor_antrean_label || 'ANT-' + r.nomor_antrean}</div>
                    </td>
                    <td class="py-3 px-4 text-slate-600">
                      <div>${r.tanggal}</div>
                      <div class="text-[10px] text-slate-400">${r.waktu} WIB</div>
                    </td>
                    <td class="py-3 px-4 font-medium text-slate-800">${r.lokasi}</td>
                    <td class="py-3 px-4 max-w-xs truncate text-slate-600" title="${r.keluhan}">"${r.keluhan}"</td>
                    <td class="py-3 px-4">${Config.getStatusBadge(r.status)}</td>
                    <td class="py-3 px-4 text-right">
                      ${r.surat ? `
                        <button onclick="window.MahasiswaView.openLetterByNomor('${r.surat}')" class="px-2.5 py-1 bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1 font-mono">
                          <i data-lucide="file-text" class="w-3 h-3"></i>
                          <span>${r.surat}</span>
                        </button>
                      ` : '<span class="text-slate-400 text-[10px]">-</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  async renderLetters(container) {
    const res = await Api.get('/mahasiswa/letters');
    const letters = res.data || [];

    container.innerHTML = `
      <div class="space-y-4 max-w-5xl mx-auto animate-fade-in-up">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">e-Surat Sakit Anda</h2>
            <p class="text-xs text-slate-500">Surat keterangan sakit resmi yang diterbitkan oleh dokter Klinik IT Del</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${letters.length === 0 ? `
            <div class="col-span-2 bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
              <i data-lucide="file-question" class="w-12 h-12 text-slate-300 mx-auto mb-2"></i>
              <p class="text-sm font-semibold text-slate-700">Belum Ada e-Surat Sakit</p>
              <p class="text-xs text-slate-500 mt-1">Surat sakit akan muncul di sini setelah Anda diperiksa oleh dokter dan dinyatakan memerlukan istirahat.</p>
            </div>
          ` : letters.map(l => `
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-sm transition space-y-4">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">${l.nomor}</span>
                  <h3 class="text-sm font-bold text-slate-900 mt-1">Surat Keterangan Sakit</h3>
                  <div class="text-[11px] text-slate-500">Diterbitkan: ${l.issued_at || l.tanggal_terbit || '-'}</div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${(l.is_active || l.aktif) ? 'bg-emerald-100 text-emerald-800 flex items-center gap-1' : 'bg-slate-100 text-slate-600'}">
                  ${(l.is_active || l.aktif) ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sedang Aktif' : 'Selesai Izin'}
                </span>
              </div>

              <div class="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-1.5 border border-slate-100">
                <div class="flex justify-between">
                  <span class="text-slate-400 text-[11px]">Dokter Pemeriksa:</span>
                  <span class="font-semibold text-slate-800">${l.dokter || 'dr. Maria Sihotang'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400 text-[11px]">Lama Istirahat:</span>
                  <span class="font-bold text-cyan-700">${l.lama_hari || 1} Hari</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400 text-[11px]">Periode:</span>
                  <span class="font-medium text-slate-800">${l.mulai_izin} s.d ${l.selesai_izin}</span>
                </div>
                <div class="pt-1 border-t border-slate-200/60">
                  <span class="text-slate-400 text-[10px] block">DIAGNOSIS RINGKAS:</span>
                  <span class="font-medium text-slate-700 italic">"${l.keterangan || l.diagnosis || 'Izin Sakit'}"</span>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <button onclick="window.MahasiswaView.showLetterDetail(${l.id})" class="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs">
                  <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                  <span>Lihat Surat & PDF</span>
                </button>
                <button onclick="window.MahasiswaView.shareLetter(${l.id})" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1" title="Bagikan link publik">
                  <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  // Modal Request Penjemputan Baru
  openRequestModal() {
    const modalBox = document.getElementById('modal-box');
    const backdrop = document.getElementById('modal-backdrop');

    modalBox.innerHTML = `
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="text-base font-black text-slate-900">Minta Penjemputan Darurat Armada Klinik</h3>
          <p class="text-xs text-slate-500">Driver shuttle ambulans akan segera menjemput Anda di lokasi asrama</p>
        </div>
        <button onclick="window.App.closeModal()" class="text-slate-400 hover:text-slate-600">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form onsubmit="window.MahasiswaView.submitRequest(event)" class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Titik Asrama / Lokasi Penjemputan:</label>
          <div class="relative">
            <input type="text" id="req-lokasi" required class="w-full text-xs pl-9 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-400 font-medium" placeholder="Ketik manual lokasi penjemputan (misal: Asrama Silo Kamar 204, Gedung A Lantai 1, dll)...">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <i data-lucide="map-pin" class="w-4 h-4"></i>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Jelaskan Keluhan Utama:</label>
          <textarea id="req-keluhan" required rows="3" class="w-full text-xs p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" placeholder="Tuliskan gejala yang Anda rasakan (misal: demam tinggi, menggigil, mual, lemas)..."></textarea>
        </div>

        <div class="bg-cyan-50/80 p-3.5 rounded-2xl border border-cyan-100 text-[11px] text-cyan-900 space-y-1">
          <p class="font-bold flex items-center gap-1.5 text-cyan-950">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-cyan-600"></i>
            Protokol Penjemputan Darurat DEL-MediCare:
          </p>
          <ul class="list-disc list-inside text-cyan-800 space-y-0.5">
            <li>Sistem otomatis memasukkan Anda ke antrean prioritas penjemputan.</li>
            <li>Driver terdekat akan menerima notifikasi dispatch darurat.</li>
            <li>Anda dapat memantau rute dan waktu tiba driver secara langsung di dashboard.</li>
          </ul>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="window.App.closeModal()" class="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
          <button type="submit" id="submit-req-btn" class="px-6 py-2.5 text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5">
            <span>Kirim Permintaan Sekarang</span>
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>
        </div>
      </form>
    `;

    backdrop.classList.remove('hidden');
    if (window.lucide) lucide.createIcons({ root: modalBox });
  },

  viewSpecificRequest(id) {
    window.App.switchTab('active');
    setTimeout(() => {
      this.renderActiveStatus(document.getElementById('app-view'), id);
    }, 60);
  },

  async submitRequest(e) {
    e.preventDefault();
    const lokasi = document.getElementById('req-lokasi').value;
    const keluhan = document.getElementById('req-keluhan').value;
    const btn = document.getElementById('submit-req-btn');

    btn.disabled = true;
    btn.innerHTML = `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Menghubungi Posko...</span>`;

    try {
      const res = await Api.post('/mahasiswa/requests', { lokasi, keluhan });
      Api.toast('Permintaan penjemputan berhasil dikirim ke armada! Anda dapat mengajukan lagi kapan saja.', 'success');
      window.App.closeModal();
      window.App.switchTab('active');
      const newId = res && res.data ? res.data.id : null;
      if (newId) {
        setTimeout(() => {
          this.renderActiveStatus(document.getElementById('app-view'), newId);
        }, 80);
      }
    } catch (err) {
      Api.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>Kirim Permintaan Sekarang</span>`;
      if (window.lucide) lucide.createIcons({ root: btn });
    }
  },

  async showLetterDetail(id) {
    try {
      const res = await Api.get(`/mahasiswa/letters/${id}`);
      const letter = res.data;
      this.displayLetterModal(letter);
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  async openLetterByNomor(nomor) {
    try {
      const res = await Api.get('/mahasiswa/letters');
      const letter = res.data.find(l => l.nomor === nomor);
      if (letter) {
        this.showLetterDetail(letter.id);
      } else {
        Api.toast('Surat tidak ditemukan.', 'error');
      }
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  displayLetterModal(letter) {
    const modalBox = document.getElementById('modal-box');
    const backdrop = document.getElementById('modal-backdrop');

    modalBox.innerHTML = `
      <div class="p-4 bg-[#0F4C81] text-white flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <i data-lucide="file-check" class="w-5 h-5 text-cyan-400"></i>
            <span class="text-xs font-bold uppercase tracking-wider">Surat Keterangan Sakit Digital &bull; IT Del</span>
          </div>
          ${(letter.is_active || letter.aktif) ? `
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Masa Istirahat Aktif
            </span>
          ` : `
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              Selesai Izin
            </span>
          `}
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs flex items-center gap-1 transition">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>Cetak</span>
          </button>
          <button onclick="window.App.closeModal()" class="text-white/70 hover:text-white transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <div class="p-8 overflow-y-auto max-h-[75vh]" id="printable-surat">
        <div class="border-b-2 border-slate-900 pb-4 mb-6 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-serif text-2xl font-black">
            DEL
          </div>
          <div class="flex-1">
            <h2 class="text-xs font-bold uppercase tracking-wide text-slate-600">Institut Teknologi Del &bull; Layanan Kesehatan Kampus</h2>
            <h1 class="text-base font-black text-blue-900 tracking-tight">KLINIK KAMPUS INSTITUT TEKNOLOGI DEL</h1>
            <p class="text-[10px] text-slate-500">Jl. Sisingamangaraja, Sitoluama, Laguboti, Toba, Sumatera Utara 22381</p>
          </div>
        </div>

        <div class="text-center mb-6">
          <h3 class="text-sm font-bold uppercase tracking-widest text-slate-900 underline underline-offset-4">SURAT KETERANGAN SAKIT</h3>
          <p class="text-xs font-mono font-semibold text-slate-600 mt-1">Nomor: ${letter.nomor}</p>
        </div>

        <div class="text-xs text-slate-800 space-y-3 leading-relaxed">
          <p>
            Yang bertanda tangan di bawah ini, Dokter Pemeriksa pada Klinik Institut Teknologi Del, menerangkan bahwa:
          </p>

          <div class="grid grid-cols-3 gap-2 pl-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 font-medium">
            <div class="text-slate-500">Nama Lengkap</div>
            <div class="col-span-2 text-slate-900 font-bold">: ${letter.nama || letter.student?.name || '-'}</div>

            <div class="text-slate-500">NIM</div>
            <div class="col-span-2 text-slate-900 font-mono font-bold">: ${letter.nim || letter.student?.identifier || '-'}</div>

            <div class="text-slate-500">Asrama</div>
            <div class="col-span-2 text-slate-900">: ${letter.asrama || letter.student?.asrama || '-'}</div>

            <div class="text-slate-500">Diagnosis / Gejala</div>
            <div class="col-span-2 text-slate-900 font-semibold text-cyan-800">: ${letter.keterangan || letter.diagnosis || '-'}</div>
          </div>

          <p>
            Berdasarkan hasil pemeriksaan fisik klinis, yang bersangkutan memerlukan istirahat selama 
            <strong class="text-slate-900">${letter.lama_hari || 1} (${letter.lama_hari || 1}) hari</strong> terhitung mulai tanggal 
            <strong class="text-slate-900">${letter.mulai_izin}</strong> sampai dengan <strong class="text-slate-900">${letter.selesai_izin}</strong>.
          </p>

          <p>
            Demikian surat keterangan ini diberikan agar dapat dipergunakan sebagaimana mestinya untuk keperluan izin perkuliahan dan asrama.
          </p>
        </div>

        <!-- Tanda Tangan Dokter & Cap Digital -->
        <div class="mt-8 flex justify-end">
          <div class="text-center w-56 text-xs">
            <p class="text-[11px] text-slate-500">Sitoluama, ${letter.issued_at || letter.tanggal_terbit || '-'}</p>
            <p class="text-slate-700 font-semibold mt-1">Dokter Pemeriksa,</p>
            
            <div class="h-16 flex items-center justify-center my-1 relative">
              <span class="doctor-stamp">
                DEL-MEDICARE VERIFIED
              </span>
            </div>

            <p class="font-bold text-slate-900 underline">${letter.dokter || 'dr. Maria Sihotang'}</p>
            <p class="text-[10px] text-slate-500">SIP: 446/KLN-DEL/2026</p>
          </div>
        </div>

      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
        <div class="text-[11px] text-slate-500 flex items-center gap-1.5">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
          <span>Status: <strong class="text-emerald-700">Terverifikasi Resmi Klinik IT Del</strong></span>
        </div>
        <button onclick="window.MahasiswaView.shareLetter(${letter.id})" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition">
          <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          <span>Bagikan Tautan Publik (7 Hari)</span>
        </button>
      </div>
    `;

    backdrop.classList.remove('hidden');
    if (window.lucide) lucide.createIcons({ root: modalBox });
  },

  async shareLetter(id) {
    try {
      const res = await Api.post(`/mahasiswa/letters/${id}/share`);
      const url = res.data?.url;
      if (url) {
        navigator.clipboard.writeText(url);
        Api.toast('Tautan verifikasi publik e-Surat disalin ke clipboard!', 'success');
      }
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  }
};

window.MahasiswaView = MahasiswaView;
