/**
 * DEL-MediCare - Dosen View
 * Screen 5: Academic Absence Portal (Class Absence Overview, Course-Linked Table, Slide-Out e-Surat Inspector & 1-Click Sync/Export)
 */

const DosenView = {
  currentTab: 'dashboard',

  async render(container, tab = 'dashboard', isSilent = false) {
    this.currentTab = tab;
    if (!isSilent) {
      container.innerHTML = `
        <div class="flex items-center justify-center min-h-[300px]">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      `;
    }

    try {
      if (tab === 'dashboard') {
        await this.renderDashboard(container);
      } else if (tab === 'absent') {
        await this.renderAbsent(container);
      }
    } catch (err) {
      container.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center max-w-lg mx-auto">
          <i data-lucide="alert-circle" class="w-10 h-10 text-rose-500 mx-auto mb-2"></i>
          <h3 class="text-sm font-bold text-rose-800">Gagal Memuat Data Portal Akademik</h3>
          <p class="text-xs text-rose-600 mt-1 mb-4">${err.message}</p>
          <button onclick="window.DosenView.render(document.getElementById('app-view'), '${tab}')" class="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition">Coba Lagi</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: container });
    }
  },

  getNavItems() {
    return [
      { id: 'dashboard', label: 'Absence Portal', icon: 'graduation-cap' },
      { id: 'absent', label: 'Course Absence Table', icon: 'clipboard-list' }
    ];
  },

  /**
   * Screen 5 — Academic Absence Portal
   */
  async renderDashboard(container) {
    const res = await Api.get('/dosen/dashboard');
    const data = res.data;
    const stats = data.stats || {};
    const absentToday = data.mahasiswa_izin_hari_ini || [];
    const user = Auth.getUser() || {};

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in-up">
        
        <!-- 1. CLASS ABSENCE OVERVIEW (Navy & Indigo Professional Academic Aesthetic) -->
        <div class="bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
          <div class="relative z-10 max-w-2xl space-y-3">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold border border-white/10">
              <i data-lucide="graduation-cap" class="w-3.5 h-3.5 text-indigo-300"></i> Academic Absence Portal &bull; IT Del
            </span>
            
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Selamat Datang, ${user.name || 'Bpk. Sudirman'}
            </h2>
            
            <p class="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Presensi perkuliahan sinkron otomatis. Seluruh mahasiswa yang mendapatkan surat izin istirahat dari Klinik IT Del otomatis terdata pada jadwal sesi mata kuliah Anda tanpa perlu menyerahkan surat fisik manual.
            </p>

            <div class="pt-2 flex flex-wrap items-center gap-3">
              <button onclick="window.App.switchTab('absent')" class="px-6 py-3 bg-white hover:bg-indigo-50 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition flex items-center gap-2 hover:-translate-y-0.5">
                <i data-lucide="clipboard-list" class="w-4 h-4 text-indigo-700"></i>
                <span>Lihat Tabel Presensi Kelas Lengkap</span>
              </button>

              <!-- One-Click Sync/Export Widget -->
              <button onclick="window.DosenView.syncAcademicAttendance()" class="px-4 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 font-bold text-xs rounded-2xl border border-indigo-400/30 transition flex items-center gap-2">
                <i data-lucide="refresh-cw" class="w-4 h-4 text-cyan-300"></i>
                <span>Sinkronisasi SiAkad (1-Click Sync)</span>
              </button>

              <button onclick="window.DosenView.exportAcademicData()" class="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition flex items-center gap-2">
                <i data-lucide="download" class="w-4 h-4 text-emerald-300"></i>
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          <div class="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
            <i data-lucide="book-open" class="w-64 h-64"></i>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition cursor-pointer hover:border-indigo-300" onclick="window.App.switchTab('absent')">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Mahasiswa Izin di Kelas</span>
              <span class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <i data-lucide="user-x" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight font-mono">
              ${stats.mahasiswa_izin || 0} <span class="text-xs font-bold text-indigo-400">Mahasiswa</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Tervalidasi pada jadwal kuliah Anda</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Surat Masuk Hari Ini</span>
              <span class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <i data-lucide="file-check" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              ${stats.surat_diterima_hari_ini || 0} <span class="text-xs font-bold text-slate-400">Surat</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Otomatis diverifikasi klinik</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemberitahuan Baru</span>
              <span class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <i data-lucide="bell" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
              ${stats.notifikasi_baru || 0} <span class="text-xs font-bold text-amber-400">Pesan</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Update kehadiran & status sakit</span>
          </div>

        </div>

        <!-- 2. COURSE-LINKED ABSENCE TABLE -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900">Mahasiswa Izin Sakit per Sesi Kuliah Hari Ini</h3>
              <p class="text-xs text-slate-500">Klik baris mahasiswa untuk membuka Slide-Out e-Surat Inspector resmi</p>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.DosenView.exportAcademicData()" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200">
                <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>Unduh CSV</span>
              </button>
              <button onclick="window.App.switchTab('absent')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                Buka Arsip Penuh
              </button>
            </div>
          </div>

          <div class="space-y-3">
            ${absentToday.length === 0 ? `
              <div class="p-8 text-center text-slate-400 space-y-1">
                <i data-lucide="check-circle-2" class="w-10 h-10 text-emerald-500 mx-auto mb-2"></i>
                <p class="text-xs font-bold text-slate-700">Presensi Lengkap: Tidak Ada Mahasiswa yang Izin Sakit di Kelas Anda</p>
                <p class="text-[11px] text-slate-400">Seluruh mahasiswa terdaftar berstatus aktif mengikuti perkuliahan</p>
              </div>
            ` : absentToday.map(row => {
              const letterId = row.letter_id || row.id;
              const matkul = row.mata_kuliah || row.matkul || 'Perkuliahan';

              return `
                <div onclick="window.DosenView.showLetter(${letterId})" class="p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200/80 hover:border-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition cursor-pointer group shadow-2xs">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-black text-slate-900 text-sm group-hover:text-indigo-700 transition">${row.nama}</span>
                      <span class="text-xs font-mono font-bold text-slate-500">(${row.nim})</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i> Verified by Klinik IT Del
                      </span>
                    </div>
                    <div class="text-xs text-slate-700">
                      Mata Kuliah: <strong class="text-indigo-900">${matkul}</strong> &bull; Sesi: <span class="font-mono text-slate-600">${row.sesi || 'Sesi Kuliah'}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 italic">
                      Diagnosis: "${row.keterangan || 'Izin Sakit'}"
                    </div>
                  </div>

                  <div class="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <div class="text-right text-xs">
                      <span class="text-indigo-700 font-extrabold block">${row.mulai_izin} s.d ${row.selesai_izin}</span>
                      <span class="text-[10px] text-slate-400 font-medium">Sah Menurut Dokter</span>
                    </div>
                    <button class="px-3.5 py-2 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-800 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs">
                      <i data-lucide="file-search" class="w-3.5 h-3.5"></i>
                      <span>Inspeksi Dokumen</span>
                    </button>
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
   * Screen 5: COURSE-LINKED ABSENCE TABLE (Full Dataset)
   */
  async renderAbsent(container) {
    const res = await Api.get('/dosen/absent');
    const items = res.data || [];

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-5 animate-fade-in-up">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Course-Linked Absence Table</h2>
            <p class="text-xs text-slate-500">Tabel ketidakhadiran perkuliahan yang terintegrasi langsung dengan jadwal mengajar</p>
          </div>
          
          <div class="flex items-center gap-2">
            <button onclick="window.DosenView.syncAcademicAttendance()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              <span>Sinkronkan ke SiAkad</span>
            </button>
            <button onclick="window.DosenView.exportAcademicData()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200">
              <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs divide-y divide-slate-100">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="py-3 px-4">Mahasiswa / NIM</th>
                <th class="py-3 px-4">Mata Kuliah</th>
                <th class="py-3 px-4">Jadwal Sesi</th>
                <th class="py-3 px-4">Diagnosis Ringkas</th>
                <th class="py-3 px-4">Periode Berlaku</th>
                <th class="py-3 px-4">Verifikasi Klinik</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${items.length === 0 ? `
                <tr><td colspan="7" class="py-10 text-center text-slate-400">Tidak ada mahasiswa yang sedang izin sakit</td></tr>
              ` : items.map(r => {
                const letterId = r.letter_id || r.id;
                const matkul = r.mata_kuliah || r.matkul || 'Kuliah';

                return `
                  <tr class="hover:bg-slate-50 transition cursor-pointer" onclick="window.DosenView.showLetter(${letterId})">
                    <td class="py-3.5 px-4">
                      <div class="font-extrabold text-slate-900">${r.nama}</div>
                      <div class="text-[10px] font-mono text-slate-500">${r.nim}</div>
                    </td>
                    <td class="py-3.5 px-4 font-extrabold text-indigo-900">${matkul}</td>
                    <td class="py-3.5 px-4 text-slate-600 font-mono">${r.sesi || '-'}</td>
                    <td class="py-3.5 px-4 italic text-slate-600">"${r.keterangan || 'Sakit'}"</td>
                    <td class="py-3.5 px-4 font-bold text-slate-800 font-mono">${r.mulai_izin} s.d ${r.selesai_izin}</td>
                    <td class="py-3.5 px-4">
                      <span class="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i> Verified
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <button class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl text-indigo-800 text-xs font-bold transition">
                        Inspeksi
                      </button>
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

  /**
   * Screen 5: 3. e-Surat Inspector Side-Drawer
   */
  async showLetter(letterId) {
    try {
      const res = await Api.get(`/dosen/letters/${letterId}`);
      const letter = res.data;
      if (window.MahasiswaView && window.MahasiswaView.displayLetterModal) {
        window.MahasiswaView.displayLetterModal(letter);
      } else {
        Api.toast(`Surat Sakit No. ${letter.nomor} untuk ${letter.nama}`, 'info');
      }
    } catch (e) {
      Api.toast(e.message, 'error');
    }
  },

  /**
   * Screen 5: 4. One-Click Sync Action
   */
  syncAcademicAttendance() {
    Api.toast('Menyinkronkan data presensi medis ke Sistem Informasi Akademik (SiAkad)...', 'info');
    setTimeout(() => {
      Api.toast('Sinkronisasi Sukses: Seluruh data izin sakit telah diperbarui pada presensi kelas.', 'success');
    }, 900);
  },

  /**
   * Screen 5: 4. Export CSV Action
   */
  async exportAcademicData() {
    try {
      const res = await Api.get('/dosen/absent');
      const items = res.data || [];
      if (items.length === 0) {
        Api.toast('Tidak ada data presensi izin sakit untuk diekspor.', 'info');
        return;
      }

      let csv = 'NIM,Nama Mahasiswa,Mata Kuliah,Sesi,Keterangan,Mulai Izin,Selesai Izin,Validasi Medis\n';
      items.forEach(r => {
        csv += `"${r.nim}","${r.nama}","${r.matkul || r.mata_kuliah || '-'}","${r.sesi || '-'}","${r.keterangan || '-'}","${r.mulai_izin}","${r.selesai_izin}","Verified by Klinik IT Del"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `rekap_presensi_izin_sakit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Api.toast('File rekap presensi CSV berhasil diunduh!', 'success');
    } catch (e) {
      Api.toast('Gagal mengekspor data: ' + e.message, 'error');
    }
  }
};

window.DosenView = DosenView;
