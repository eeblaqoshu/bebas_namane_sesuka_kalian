// lib/konstanta.ts
// Konstanta aturan bisnis presensi STO

/** Batas keterlambatan dalam menit sejak sesi presensi dibuka */
export const BATAS_TERLAMBAT_MENIT = 15;

/** Radius default validasi lokasi presensi dalam meter */
export const RADIUS_DEFAULT_M = 500;

/** Durasi satu jendela waktu QR dinamis dalam detik (30 detik) */
export const QR_WINDOW_SECONDS = 30;

/** Zona waktu resmi sistem */
export const DEFAULT_TIMEZONE = "Asia/Jakarta";
