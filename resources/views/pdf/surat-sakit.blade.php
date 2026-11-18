<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>e-Surat Sakit {{ $letter->nomor }}</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #0f172a; margin: 0; }
        .header { background: #0f766e; color: #fff; padding: 18px 28px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 2px 0 0; font-size: 12px; color: #99f6e4; }
        .body { padding: 24px 28px; }
        .klinik { text-align: center; color: #64748b; font-size: 11px; margin-bottom: 20px; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data td { padding: 7px 0; vertical-align: top; border-bottom: 1px solid #e2e8f0; }
        table.data td.k { width: 35%; color: #64748b; }
        table.data td.v { font-weight: bold; }
        .foot { margin-top: 28px; font-size: 11px; color: #64748b; }
        .sign { margin-top: 36px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>e-Surat Sakit</h1>
        <p>No. {{ $letter->nomor }}</p>
    </div>
    <div class="body">
        <div class="klinik">
            <strong>{{ strtoupper($clinic['name']) }}</strong><br>
            {{ $clinic['address'] }}
        </div>

        <table class="data">
            <tr><td class="k">Nama Mahasiswa</td><td class="v">{{ $letter->student->name }}</td></tr>
            <tr><td class="k">NIM</td><td class="v">{{ $letter->student->identifier }}</td></tr>
            <tr><td class="k">Tanggal Terbit</td><td class="v">{{ $letter->issued_at->translatedFormat('d F Y') }}</td></tr>
            <tr><td class="k">Keterangan</td><td class="v">{{ $letter->keterangan }}</td></tr>
            <tr><td class="k">Mulai Izin</td><td class="v">{{ $letter->mulai_izin->translatedFormat('d F Y') }}</td></tr>
            <tr><td class="k">Selesai Izin</td><td class="v">{{ $letter->selesai_izin->translatedFormat('d F Y') }}</td></tr>
            <tr><td class="k">Dokter Pemeriksa</td><td class="v">{{ $letter->doctor->name }}</td></tr>
        </table>

        <div class="sign">
            Diterbitkan secara elektronik oleh<br><br><br>
            <strong>{{ $letter->doctor->name }}</strong>
        </div>

        <div class="foot">
            Dokumen ini diterbitkan secara elektronik melalui sistem DEL-MediCare dan sah tanpa tanda tangan basah.
            Catatan medis bersifat rahasia dan tidak dicantumkan dalam surat ini.
        </div>
    </div>
</body>
</html>
