// lib/qr-token.ts
// Pembuatan dan verifikasi token QR dinamis berbasis HMAC
import crypto from "crypto";
import { QR_WINDOW_SECONDS } from "./konstanta";

/**
 * Mendapatkan nomor jendela waktu saat ini berdasarkan timestamp
 */
export function getWindowNumber(
  timestampMs: number = Date.now(),
  windowSeconds: number = QR_WINDOW_SECONDS
): number {
  return Math.floor(timestampMs / 1000 / windowSeconds);
}

/**
 * Membuat token QR dinamis menggunakan HMAC-SHA256
 * @param qrSecret Secret sesi presensi yang tersimpan di DB
 * @param sesiId ID sesi presensi
 * @param windowNumber Nomor jendela waktu (opsional, default ke waktu sekarang)
 */
export function generateQrToken(
  qrSecret: string,
  sesiId: number,
  windowNumber: number = getWindowNumber()
): string {
  const payload = `${sesiId}:${windowNumber}`;
  return crypto
    .createHmac("sha256", qrSecret)
    .update(payload)
    .digest("hex");
}

/**
 * Memverifikasi token QR.
 * Mengizinkan token dari jendela saat ini atau 1 jendela sebelumnya (toleransi 30 detik).
 */
export function verifyQrToken(
  token: string,
  qrSecret: string,
  sesiId: number,
  timestampMs: number = Date.now()
): boolean {
  if (!token || !qrSecret) return false;

  const currentWindow = getWindowNumber(timestampMs);
  const previousWindow = currentWindow - 1;

  const validTokenCurrent = generateQrToken(qrSecret, sesiId, currentWindow);
  const validTokenPrevious = generateQrToken(qrSecret, sesiId, previousWindow);

  // Menggunakan crypto.timingSafeEqual untuk mencegah timing attacks
  const tokenBuf = Buffer.from(token);
  const currentBuf = Buffer.from(validTokenCurrent);
  const prevBuf = Buffer.from(validTokenPrevious);

  const matchCurrent =
    tokenBuf.length === currentBuf.length &&
    crypto.timingSafeEqual(tokenBuf, currentBuf);

  const matchPrev =
    tokenBuf.length === prevBuf.length &&
    crypto.timingSafeEqual(tokenBuf, prevBuf);

  return matchCurrent || matchPrev;
}
