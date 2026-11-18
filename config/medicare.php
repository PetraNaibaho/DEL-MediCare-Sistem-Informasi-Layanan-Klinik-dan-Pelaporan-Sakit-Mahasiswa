<?php

return [

    /*
    | Aturan batching penjemputan (sesuai prototipe: window 15 menit, maks 5 mahasiswa/trip).
    */
    'batch_window_minutes' => (int) env('MEDICARE_BATCH_WINDOW', 15),
    'batch_max_members' => (int) env('MEDICARE_BATCH_MAX', 5),

    // Estimasi driver tiba di lokasi penjemputan setelah batch diterima driver.
    'pickup_eta_minutes' => (int) env('MEDICARE_PICKUP_ETA', 15),

    // Return trip aktif bila jumlah mahasiswa yang selesai diperiksa mencapai angka ini
    // (atau semua anggota batch bila anggotanya lebih sedikit).
    'return_trigger_threshold' => (int) env('MEDICARE_RETURN_TRIGGER', 3),

    // Batas lama izin sakit dalam satu e-Surat Sakit.
    'max_sick_leave_days' => (int) env('MEDICARE_MAX_SICK_DAYS', 14),

    'clinic' => [
        'name' => 'Klinik Institut Teknologi Del',
        'address' => 'Jl. Sisingamangaraja, Sitoluama, Laguboti, Toba — Klinik Kampus IT Del',
    ],

    // Pilihan lokasi penjemputan pada form "Daftar Pemeriksaan".
    'lokasi_penjemputan' => [
        'Asrama Putra Blok A',
        'Asrama Putra Blok B',
        'Asrama Putri Blok A',
        'Asrama Putri Blok B',
        'Asrama Putri Blok C',
        'Gedung A Lantai 1',
        'Gedung A Lantai 2',
        'Gedung B',
        'Gedung C',
        'Lapangan Utama',
    ],
];
