/**
 * DEL-MediCare - Public Letter Verification View
 */

const PublicVerifyView = {
  render(container) {
    container.innerHTML = `
      <div class="max-w-xl mx-auto py-8">
        <div class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div class="text-center">
            <div class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <i data-lucide="shield-check" class="w-8 h-8"></i>
            </div>
            <h2 class="text-xl font-bold text-slate-900">Verifikasi Keaslian e-Surat Sakit</h2>
            <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Periksa keabsahan dan masa berlaku surat izin sakit resmi yang diterbitkan oleh Klinik Institut Teknologi Del
            </p>
          </div>

          <form onsubmit="window.PublicVerifyView.handleVerify(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Tempel Tautan Bagikan / Signed URL Surat:</label>
              <textarea id="verify-url-input" required rows="3" class="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="http://.../api/e-surat/SS-2026-0001/verify?expires=...&signature=..."></textarea>
            </div>

            <button type="submit" id="verify-submit-btn" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5">
              <i data-lucide="search" class="w-4 h-4"></i>
              <span>Verifikasi Keabsahan</span>
            </button>
          </form>

          <div id="verify-result" class="hidden pt-4 border-t border-slate-100">
            <!-- Hasil Verifikasi -->
          </div>

          <div class="pt-4 text-center border-t border-slate-100">
            <button type="button" onclick="window.App.navigateHome()" class="text-xs font-semibold text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1.5">
              <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
              <span>Kembali ke Halaman Utama</span>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: container });
  },

  async handleVerify(e) {
    e.preventDefault();
    const rawInput = document.getElementById('verify-url-input').value.trim();
    const resultBox = document.getElementById('verify-result');
    const btn = document.getElementById('verify-submit-btn');

    btn.disabled = true;
    btn.innerHTML = `<span>Memverifikasi...</span>`;
    resultBox.classList.add('hidden');

    try {
      // Ambil path / URL
      let url = rawInput;
      if (!url.startsWith('http')) {
        url = `${Config.getApiBaseUrl()}/${rawInput.replace(/^\/+/, '')}`;
      }

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Tautan tidak valid atau sudah kedaluwarsa (masa berlaku 7 hari).');
      }

      const l = data.data;
      resultBox.classList.remove('hidden');
      resultBox.innerHTML = `
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i>
            <span>SURAT RESMI & SAH TERVERIFIKASI</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-1">
            <div class="text-slate-500">Nomor Surat:</div>
            <div class="font-mono font-bold text-slate-800">${l.nomor}</div>

            <div class="text-slate-500">Nama Mahasiswa:</div>
            <div class="font-semibold text-slate-800">${l.nama} (${l.nim})</div>

            <div class="text-slate-500">Periode Izin:</div>
            <div class="font-bold text-emerald-700">${l.mulai_izin} s.d ${l.selesai_izin}</div>

            <div class="text-slate-500">Dokter Penerbit:</div>
            <div class="text-slate-800">${l.diterbitkan_oleh}</div>

            <div class="text-slate-500">Tanggal Terbit:</div>
            <div class="text-slate-800">${l.tanggal_terbit}</div>
          </div>

          <p class="text-[10px] text-slate-500 pt-2 border-t border-emerald-200/60 italic">
            * Sesuai ketentuan perlindungan privasi medis IT Del, diagnosis spesifik tidak ditampilkan pada halaman publik.
          </p>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: resultBox });
    } catch (err) {
      resultBox.classList.remove('hidden');
      resultBox.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-700 flex items-start gap-2">
          <i data-lucide="x-circle" class="w-4 h-4 text-rose-500 shrink-0 mt-0.5"></i>
          <div>
            <strong class="block font-bold">Verifikasi Gagal:</strong>
            <span>${err.message}</span>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: resultBox });
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="search" class="w-4 h-4"></i><span>Verifikasi Keabsahan</span>`;
      if (window.lucide) lucide.createIcons({ root: btn });
    }
  }
};

window.PublicVerifyView = PublicVerifyView;
