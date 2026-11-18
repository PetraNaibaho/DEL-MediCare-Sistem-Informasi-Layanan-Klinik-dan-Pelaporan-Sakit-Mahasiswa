/**
 * DEL-MediCare - Keasramaan View
 * Screen 4: Warden Overview Hub (Dormitory Health Matrix with Heatmap, Profile Cards, Instant Verification & Real-Time Log Sidebar)
 */

const KeasramaanView = {
  currentTab: 'dashboard',

  async render(container, tab = 'dashboard', isSilent = false) {
    this.currentTab = tab;
    if (!isSilent) {
      container.innerHTML = `
        <div class="flex items-center justify-center min-h-[300px]">
          <div class="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      `;
    }

    try {
      if (tab === 'dashboard') {
        await this.renderDashboard(container);
      } else if (tab === 'students') {
        await this.renderSickStudents(container);
      } else if (tab === 'verifications') {
        await this.renderVerifications(container);
      }
    } catch (err) {
      container.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center max-w-lg mx-auto">
          <i data-lucide="alert-circle" class="w-10 h-10 text-rose-500 mx-auto mb-2"></i>
          <h3 class="text-sm font-bold text-rose-800">Gagal Memuat Data Warden Hub</h3>
          <p class="text-xs text-rose-600 mt-1 mb-4">${err.message}</p>
          <button onclick="window.KeasramaanView.render(document.getElementById('app-view'), '${tab}')" class="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition">Coba Lagi</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: container });
    }
  },

  getNavItems() {
    return [
      { id: 'dashboard', label: 'Warden Hub', icon: 'building-2' },
      { id: 'students', label: 'Sick Student Matrix', icon: 'bed-double' },
      { id: 'verifications', label: 'Instant Verification', icon: 'check-square' }
    ];
  },

  /**
   * Screen 4 — Warden Overview Hub
   */
  async renderDashboard(container) {
    const res = await Api.get('/keasramaan/dashboard');
    const data = res.data;
    const stats = data.stats || {};
    const activeStudents = data.mahasiswa_dalam_izin || [];
    const notifs = data.notifikasi_terbaru || [];
    const user = Auth.getUser() || {};

    let unverifiedCount = 0;
    try {
      const vRes = await Api.get('/keasramaan/verifications');
      if (vRes.data) {
        unverifiedCount = vRes.data.filter(l => !l.terverifikasi).length;
      }
    } catch (e) {}

    // Grouping mahasiswa sakit berdasarkan Asrama untuk visual Health Matrix & Heatmap
    const dormHeatmap = {
      'Asrama Putra Blok A': { cases: 0, level: 'normal', color: 'emerald' },
      'Asrama Putra Blok B': { cases: 0, level: 'normal', color: 'emerald' },
      'Asrama Putri Silo': { cases: 0, level: 'normal', color: 'emerald' },
      'Asrama Putri Kapernaum': { cases: 0, level: 'normal', color: 'emerald' },
      'Asrama Putri Ruth': { cases: 0, level: 'normal', color: 'emerald' },
      'Asrama Anthiokia': { cases: 0, level: 'normal', color: 'emerald' }
    };

    activeStudents.forEach(s => {
      const dorm = s.asrama || s.student?.asrama || 'Asrama Putra Blok A';
      if (!dormHeatmap[dorm]) {
        dormHeatmap[dorm] = { cases: 0, level: 'normal', color: 'emerald' };
      }
      dormHeatmap[dorm].cases += 1;
      if (dormHeatmap[dorm].cases >= 3) {
        dormHeatmap[dorm].level = 'Waspada Tinggi';
        dormHeatmap[dorm].color = 'rose';
      } else if (dormHeatmap[dorm].cases >= 1) {
        dormHeatmap[dorm].level = 'Perhatian Medis';
        dormHeatmap[dorm].color = 'amber';
      }
    });

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in-up">
        
        <!-- 1. DORMITORY HEALTH MATRIX (Top Banner with Heatmap Visualization) -->
        <div class="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-500/30">
          <div class="relative z-10 max-w-3xl space-y-3">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-semibold border border-white/10">
              <i data-lucide="shield" class="w-3.5 h-3.5 text-purple-300"></i> Warden Overview Hub &bull; Pengawasan Keasramaan
            </span>
            
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Dormitory Health Command &bull; ${user.name || 'Kristian S.'}
            </h2>
            
            <p class="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Pantau persebaran kasus sakit per blok gedung asrama secara real-time. Konfirmasi izin isolasi kamar dan pastikan mahasiswa mendapatkan pasokan makanan & obat dari poliklinik.
            </p>

            <!-- Visual Heatmaps Bar -->
            <div class="pt-2">
              <span class="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider block mb-2">INCIDENCE HEATMAP PER GEDUNG ASRAMA:</span>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                ${Object.keys(dormHeatmap).map(dormKey => {
                  const d = dormHeatmap[dormKey];
                  const bgClass = d.cases >= 3 ? 'bg-rose-500/25 border-rose-400 text-rose-300' :
                                  d.cases >= 1 ? 'bg-amber-500/25 border-amber-400 text-amber-300' :
                                  'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
                  return `
                    <div class="p-2.5 rounded-2xl border ${bgClass} backdrop-blur-sm text-center">
                      <span class="text-[10px] font-bold block truncate" title="${dormKey}">${dormKey.replace('Asrama ', '')}</span>
                      <strong class="text-lg font-black block font-mono mt-0.5">${d.cases} Kasus</strong>
                      <span class="text-[8px] uppercase tracking-wider font-semibold opacity-80">${d.level}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="pt-2 flex flex-wrap items-center gap-3">
              <button onclick="window.App.switchTab('verifications')" class="px-5 py-2.5 bg-white hover:bg-purple-50 text-purple-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2">
                <i data-lucide="check-check" class="w-4 h-4 text-purple-700"></i>
                <span>Verifikasi Izin Asrama (${unverifiedCount} Pending)</span>
              </button>
              <button onclick="window.App.switchTab('students')" class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5">
                <i data-lucide="users" class="w-4 h-4"></i>
                <span>Matriks Mahasiswa Lengkap</span>
              </button>
            </div>
          </div>

          <div class="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
            <i data-lucide="building" class="w-64 h-64"></i>
          </div>
        </div>

        <!-- Metric Summary KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition cursor-pointer hover:border-purple-300" onclick="window.App.switchTab('students')">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Mahasiswa Sakit di Asrama</span>
              <span class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <i data-lucide="bed-double" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight font-mono">
              ${stats.mahasiswa_sakit || 0} <span class="text-xs font-bold text-purple-400">Orang</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Tirah baring di kamar asrama</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">e-Surat Masuk Hari Ini</span>
              <span class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <i data-lucide="file-text" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              ${stats.surat_masuk_hari_ini || 0} <span class="text-xs font-bold text-slate-400">Surat</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Telah divalidasi klinik</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition cursor-pointer hover:border-amber-300" onclick="window.App.switchTab('verifications')">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Menunggu Verifikasi</span>
              <span class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
              ${unverifiedCount} <span class="text-xs font-bold text-amber-400">Izin</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Perlu konfirmasi satu-klik pembina</span>
          </div>
        </div>

        <!-- MAIN LAYOUT: 2. SICK STUDENT MONITOR GRID (Left) & 4. REAL-TIME LOG SIDEBAR (Right) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Rich Profile Cards of Sick Students (8 Cols) -->
          <div class="lg:col-span-8 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-black text-slate-900">Sick Student Monitor Grid</h3>
                <p class="text-xs text-slate-500">Kartu profil mahasiswa yang sedang menjalani masa pemulihan di kamar</p>
              </div>
              <button onclick="window.App.switchTab('students')" class="text-xs font-bold text-purple-700 hover:text-purple-900">
                Lihat Semua
              </button>
            </div>

            ${activeStudents.length === 0 ? `
              <div class="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                <i data-lucide="check-circle" class="w-10 h-10 text-emerald-500 mx-auto"></i>
                <p class="text-sm font-bold text-slate-700">Tidak Ada Mahasiswa Sakit Aktif</p>
                <p class="text-xs text-slate-500">Seluruh penghuni asrama tercatat dalam kondisi sehat bugar.</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${activeStudents.map((s, idx) => `
                  <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3">
                    <div class="flex items-start justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
                          ${(s.nama || s.student?.name || 'M').charAt(0)}
                        </div>
                        <div>
                          <h4 class="font-extrabold text-slate-900 text-sm leading-tight">${s.nama || s.student?.name}</h4>
                          <span class="text-[10px] text-slate-500 font-mono">${s.nim || s.student?.identifier} &bull; Kamar #${(idx + 1) * 102}</span>
                        </div>
                      </div>
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                        Isolasi Kamar
                      </span>
                    </div>

                    <div class="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 border border-slate-100">
                      <div class="flex justify-between">
                        <span class="text-slate-400 text-[11px]">Asrama:</span>
                        <strong class="text-slate-800">${s.asrama || s.student?.asrama || 'Asrama Kampus'}</strong>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-400 text-[11px]">Diagnosis:</span>
                        <span class="text-slate-800 font-medium italic">"${s.keterangan || s.diagnosis || 'Izin Sakit'}"</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-400 text-[11px]">Dokter Bertugas:</span>
                        <span class="text-slate-800">${s.dokter || 'dr. Maria Sihotang'}</span>
                      </div>
                      <div class="flex justify-between pt-1 border-t border-slate-200/60">
                        <span class="text-slate-400 text-[11px]">Masa Berlaku:</span>
                        <span class="text-purple-700 font-bold font-mono">${s.mulai_izin} s.d ${s.selesai_izin}</span>
                      </div>
                    </div>

                    <div class="flex items-center justify-between pt-1">
                      <span class="text-[10px] text-slate-400 font-medium">${s.lama_hari || 1} Hari Pemulihan</span>
                      <button onclick="window.MahasiswaView.displayLetterModal(${JSON.stringify(s).replace(/"/g, '&quot;')})" class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition">
                        Buka e-Surat
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- 4. REAL-TIME LOG SIDEBAR (Right Sidebar, 4 Cols) -->
          <div class="lg:col-span-4 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-slate-900 flex items-center gap-2">
                <i data-lucide="radio" class="w-4 h-4 text-purple-600 animate-pulse"></i>
                <span>Real-Time Activity Log</span>
              </h3>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Live</span>
            </div>

            <div class="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <p class="text-[11px] text-slate-400">Arus log pergerakan mahasiswa asrama ⇄ klinik:</p>

              <div class="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                ${notifs.length === 0 ? `
                  <div class="p-4 text-center text-slate-400 text-xs">Belum ada aktivitas log terbaru</div>
                ` : notifs.map(n => `
                  <div class="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold uppercase text-purple-800 tracking-wider">Aktivitas Asrama</span>
                      <span class="text-[10px] text-slate-400 font-mono">${n.waktu || 'Baru Saja'}</span>
                    </div>
                    <p class="text-xs text-slate-800 font-medium leading-relaxed">${n.pesan || n.message}</p>
                  </div>
                `).join('')}
                
                <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div class="font-bold text-slate-800 flex items-center gap-1.5">
                    <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-purple-600"></i>
                    Catatan Disiplin Kamar
                  </div>
                  <p>Seluruh mahasiswa berstatus izin sakit dibebaskan dari apel malam dan kegiatan ibadah gabungan.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  /**
   * Screen 4: 3. INSTANT VERIFICATION TABLE (One-Click Approve/Flag Switches with Digital Timestamps)
   */
  async renderVerifications(container) {
    const res = await Api.get('/keasramaan/verifications');
    const items = res.data || [];

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-5 animate-fade-in-up">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Instant Verification Workflow</h2>
            <p class="text-xs text-slate-500">Konfirmasi status izin sakit mahasiswa dengan sakelar satu-klik dan stempel jejak audit digital</p>
          </div>
          <button onclick="window.KeasramaanView.render(document.getElementById('app-view'), 'verifications')" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Segarkan</span>
          </button>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs divide-y divide-slate-100">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="py-3 px-4">No. Dokumen</th>
                <th class="py-3 px-4">Mahasiswa / NIM</th>
                <th class="py-3 px-4">Gedung Asrama</th>
                <th class="py-3 px-4">Periode Izin</th>
                <th class="py-3 px-4">Status & Audit Stamp</th>
                <th class="py-3 px-4 text-right">Verifikasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${items.length === 0 ? `
                <tr><td colspan="6" class="py-10 text-center text-slate-400">Seluruh izin sakit telah diverifikasi</td></tr>
              ` : items.map(l => {
                const isVerified = l.terverifikasi || l.verified_at;

                return `
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-4 font-mono font-bold text-purple-700">
                      <span class="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-xs">${l.nomor}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="font-extrabold text-slate-900">${l.nama || l.student?.name}</div>
                      <div class="text-[10px] font-mono text-slate-500">${l.nim || l.student?.identifier}</div>
                    </td>
                    <td class="py-3.5 px-4 font-semibold text-slate-800">${l.asrama || l.student?.asrama || '-'}</td>
                    <td class="py-3.5 px-4 text-purple-700 font-bold">${l.mulai_izin} s.d ${l.selesai_izin}</td>
                    <td class="py-3.5 px-4">
                      ${isVerified ? `
                        <div class="flex flex-col">
                          <span class="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-xs">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> Disetujui Pembina
                          </span>
                          <span class="text-[10px] text-slate-400 font-mono mt-0.5">${l.verified_at || 'Tervalidasi'}</span>
                        </div>
                      ` : `
                        <span class="inline-flex items-center gap-1 text-amber-600 font-bold text-xs">
                          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Menunggu Konfirmasi
                        </span>
                      `}
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      ${isVerified ? `
                        <span class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs">Selesai</span>
                      ` : `
                        <button onclick="window.KeasramaanView.verifyLetter(${l.id})" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 ml-auto">
                          <i data-lucide="check" class="w-3.5 h-3.5"></i>
                          <span>Setujui Izin</span>
                        </button>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  async renderSickStudents(container) {
    const res = await Api.get('/keasramaan/sick-students?aktif=1');
    const items = res.data || [];

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-4 animate-fade-in-up">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Daftar Mahasiswa Sakit di Asrama</h2>
            <p class="text-xs text-slate-500">Daftar seluruh mahasiswa yang sedang dalam masa izin istirahat sakit aktif</p>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs divide-y divide-slate-100">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="py-3 px-4">Mahasiswa / NIM</th>
                <th class="py-3 px-4">Lokasi Asrama</th>
                <th class="py-3 px-4">Diagnosis Medis</th>
                <th class="py-3 px-4">Periode Izin</th>
                <th class="py-3 px-4">Dokter</th>
                <th class="py-3 px-4 text-right">e-Surat</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${items.length === 0 ? `
                <tr><td colspan="6" class="py-8 text-center text-slate-400">Tidak ada mahasiswa sakit aktif</td></tr>
              ` : items.map(s => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-3 px-4">
                    <div class="font-extrabold text-slate-900">${s.nama || s.student?.name}</div>
                    <div class="text-[10px] font-mono text-slate-500">${s.nim || s.student?.identifier}</div>
                  </td>
                  <td class="py-3 px-4 text-slate-700 font-bold">${s.asrama || s.student?.asrama || '-'}</td>
                  <td class="py-3 px-4 italic text-slate-700">"${s.keterangan || s.diagnosis || '-'}"</td>
                  <td class="py-3 px-4 text-purple-700 font-bold">${s.mulai_izin} s.d ${s.selesai_izin}</td>
                  <td class="py-3 px-4 text-slate-500">${s.dokter || 'dr. Maria Sihotang'}</td>
                  <td class="py-3 px-4 text-right">
                    <button onclick="window.MahasiswaView.displayLetterModal(${JSON.stringify(s).replace(/"/g, '&quot;')})" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-xl text-purple-800 text-xs font-bold transition">
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
  },

  async verifyLetter(id) {
    try {
      await Api.post(`/keasramaan/letters/${id}/verify`);
      Api.toast('Izin asrama berhasil disetujui & notifikasi terkirim ke warden.', 'success');
      await this.render(document.getElementById('app-view'), 'verifications');
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  }
};

window.KeasramaanView = KeasramaanView;
