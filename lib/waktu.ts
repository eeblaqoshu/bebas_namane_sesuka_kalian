// lib/waktu.ts
// Helper manipulasi dan pemformatan waktu zona Asia/Jakarta (WIB)
import { DEFAULT_TIMEZONE } from "./konstanta";

/**
 * Menggabungkan Date (dari tgl_pelaksanaan) dan Time (dari waktu_pelaksanaan)
 * menjadi objek Date UTC yang tepat berdasarkan zona Asia/Jakarta (+07:00).
 */
export function gabungTanggalDanWaktu(
  tglPelaksanaan: Date,
  waktuPelaksanaan: Date
): Date {
  const tglStr = tglPelaksanaan.toISOString().split("T")[0]; // YYYY-MM-DD
  const jam = waktuPelaksanaan.getUTCHours().toString().padStart(2, "0");
  const menit = waktuPelaksanaan.getUTCMinutes().toString().padStart(2, "0");
  const detik = waktuPelaksanaan.getUTCSeconds().toString().padStart(2, "0");

  // ISO string dengan offset Jakarta (+07:00)
  return new Date(`${tglStr}T${jam}:${menit}:${detik}+07:00`);
}

/**
 * Format Date ke string tanggal bahasa Indonesia (contoh: "Senin, 10 November 2026")
 */
export function formatTanggalIndo(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: DEFAULT_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Format Date ke string jam (contoh: "14:30 WIB")
 */
export function formatJamIndo(date: Date): string {
  const timeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: DEFAULT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${timeStr} WIB`;
}

export type StatusAgendaDihitung = "akan_datang" | "sedang_berlangsung" | "selesai";

/**
 * Menghitung status agenda secara real-time berdasarkan waktu pelaksanaan dan sesi aktif
 */
export function hitungStatusAgenda(
  waktuMulai: Date,
  sesiAktifBukaAt?: Date | null,
  sesiAktifTutupAt?: Date | null,
  now: Date = new Date()
): StatusAgendaDihitung {
  // Jika ada sesi yang sedang berlangsung
  if (sesiAktifBukaAt && sesiAktifTutupAt) {
    if (now >= sesiAktifBukaAt && now <= sesiAktifTutupAt) {
      return "sedang_berlangsung";
    }
    if (now > sesiAktifTutupAt) {
      return "selesai";
    }
  }

  // Jika belum dimulai
  if (now < waktuMulai) {
    return "akan_datang";
  }

  // Default jika waktu mulai sudah lewat dan tidak ada sesi yang sedang buka
  return "selesai";
}
