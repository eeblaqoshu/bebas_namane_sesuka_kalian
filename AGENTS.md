# AGENTS.md: Panduan untuk AI Agent

Panduan ini wajib dibaca sebelum menulis kode di proyek **Sistem Presensi Pengurus Organisasi**. Sumber kebenaran kebutuhan ada di `PRD.md`. Jika panduan ini dan PRD bertentangan, **berhenti dan tanyakan** ke developer; jangan menebak.

## 1. Ringkasan proyek

Website presensi STO/panitia dengan login Firebase Authentication (Google untuk STO, email/password untuk adsek), scan QR dinamis, dan validasi lokasi radius 500 m. Data dikelompokkan: `periode → proker → agenda → sesi_presensi → presensi`.

## 2. Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- MySQL + Prisma ORM
- Firebase Authentication: provider Google (STO) + Email/Password (adsek). Klien memakai Firebase JS SDK, server memakai **Firebase Admin SDK** (session cookie httpOnly). Auth.js tidak dipakai.
- `qrcode.react` (menampilkan QR), `@yudiel/react-qr-scanner` (scan)
- Validasi input: Zod

## 3. Istilah dan nama (jangan diubah)

| Istilah | Arti |
|---|---|
| adsek | admin + sekretaris umum + sekretaris inti |
| STO | pengurus terdaftar (tabel `STO`) |
| proker | program kerja (tabel `proker`), pengganti kata "kegiatan" |
| PI | peran `ketua`, `sekretaris`, `bendahara` |
| PJ | peran `pj_divisi` |

Nama tabel/enum/kolom mengikuti PRD persis (akun adsek memakai `email` dan `firebase_uid`, tanpa `username`/`password_hash`): `akun_adsek`, `STO`, `proker`, `kepanitiaan`, `agenda`, `sesi_presensi`, `presensi`. Kolom relasi: `proker_id`, `sto_id`, `agenda_id`, `sesi_id`. Jangan memakai nama lama (`kegiatan`, `users_pengurus`, `akun_staf`, `pengurus_id`).

Di Prisma, pakai nama model PascalCase (`Sto`, `Proker`, ...) dengan `@@map` ke nama tabel di atas bila perlu.

## 4. Aturan bisnis yang tidak boleh dilanggar

1. **Semua validasi presensi di server.** Klien hanya mengirim token QR dan koordinat. Jangan percaya `sto_id`, waktu, atau jarak dari klien.
2. `sto_id` diambil dari **sesi login server**, bukan dari body request.
3. Validasi scan (urutan wajib, semuanya harus lolos):
   1. Email sesi terdaftar di `STO` periode aktif
   2. Token QR valid (HMAC, jendela saat ini atau sebelumnya)
   3. Waktu server dalam `buka_at`–`tutup_at`
   4. Jarak Haversine ≤ `radius_m`
   5. `bolehAkses(stoId, agendaId)` bernilai true
   6. Belum absen (`UNIQUE(sesi_id, sto_id)`; tangani error unik dengan pesan ramah)
4. Aturan akses agenda (`target_peserta`) hanya diimplementasi di **satu fungsi**: `lib/akses.ts → bolehAkses`. Dipakai oleh query home dan API scan. Jangan menduplikasi logikanya.
   - `semua_panitia_sto`: semua STO di periode proker
   - `semua_panitia`: ada di `kepanitiaan` proker tsb
   - `hanya_pj_pi`: ada di `kepanitiaan` dan `peran <> 'anggota'`
5. Peran dibaca dari `kepanitiaan` setiap kali dicek (pasangan `proker_id + sto_id`). Jangan menyalin peran ke tabel lain.
6. **Periode `selesai` read-only.** Setiap mutasi (proker, kepanitiaan, agenda, sesi, presensi) harus menolak jika periodenya bukan `aktif`.
7. Hanya satu periode `aktif` pada satu waktu.
8. `tutup_at = buka_at + durasi_menit`. Setiap perubahan durasi menghitung ulang `tutup_at`.
9. Status presensi: `hadir` jika scan ≤ 15 menit sejak `buka_at`, selain itu `terlambat`. Simpan batas sebagai konstanta di `lib/konstanta.ts`, bukan angka sembarang di kode.
10. Status home (akan datang / sedang berlangsung / selesai) **dihitung**, tidak disimpan di database.
11. QR **dinamis**: token = HMAC(`qr_secret`, `sesi_id` + jendela waktu 30 detik). `qr_secret` tidak pernah dikirim ke klien.

## 5. Struktur folder

```
app/
  (auth)/login/
  (sto)/home, profil, scan
  (adsek)/dashboard/ (periode, sto, proker, presensi, rekap)
  api/
    presensi/scan/route.ts
    presensi/qr-token/route.ts
lib/
  firebase-client.ts  inisialisasi Firebase JS SDK (klien)
  firebase-admin.ts   inisialisasi Admin SDK (server saja)
  auth.ts             verifikasi session cookie, ambil pengguna (adsek/STO) dari database
  prisma.ts        singleton Prisma client
  akses.ts         bolehAkses (satu-satunya aturan target_peserta)
  geo.ts           haversine
  qr-token.ts      buat/verifikasi token HMAC
  waktu.ts         helper zona Asia/Jakarta
  konstanta.ts     batas terlambat, radius default, durasi jendela QR
prisma/
  schema.prisma
  seed.ts          data simulasi sesuai PRD
components/         komponen UI reusable
```

Letakkan logika bisnis di `lib/` atau server actions/route handlers, bukan di komponen UI.

## 6. Konvensi kode

- TypeScript `strict`. Hindari `any`.
- Validasi semua input API/form dengan Zod; kembalikan error terstruktur `{ error: { kode, pesan } }`.
- Pesan error untuk pengguna dalam **Bahasa Indonesia**, singkat dan jelas (contoh: "Anda berada di luar radius presensi").
- Nama variabel/fungsi dalam bahasa Inggris atau Indonesia yang konsisten dengan istilah di bagian 3; jangan campur sinonim.
- Komponen: Server Component secara default; gunakan Client Component hanya untuk kamera, GPS, dan interaktivitas.
- Tailwind: mobile-first (`sm:`, `md:` untuk layar lebih besar). Jangan menambah library UI berat tanpa persetujuan.
- Waktu: simpan `timestamptz` (UTC), tampilkan Asia/Jakarta. Semua perbandingan waktu dilakukan di server dengan jam server.
- Tanggal dan jam agenda: `tgl_pelaksanaan` (`DATE`) dan `waktu_pelaksanaan` (`TIME`); gabungkan lewat helper di `lib/waktu.ts`.

## 7. Keamanan

- Password dikelola Firebase; **jangan menyimpan atau mencatat password** di database/log. Jangan mencatat `qr_secret` ke log.
- Verifikasi ID token/session cookie **hanya di server** (Admin SDK `verifyIdToken` / `verifySessionCookie` dengan pengecekan revoked). Jangan mempercayai email atau uid dari klien.
- Setelah token valid, selalu cocokkan email ke `akun_adsek` lalu `STO` periode aktif. Tidak ada di keduanya = tolak, jangan buat sesi.
- Firebase Admin SDK tidak jalan di Edge runtime: middleware hanya mengecek keberadaan cookie sesi; verifikasi penuh dilakukan di route handler dan server component (runtime Node).
- Kunci service account adalah rahasia server: jangan di kode klien, jangan di-commit, jangan memakai prefix `NEXT_PUBLIC_`.
- Lindungi route dengan middleware berbasis role: `/dashboard/*` hanya adsek, `/home|/scan|/profil` hanya STO. Hak `admin`-only: periode, STO, akun adsek.
- Jangan percaya data dari klien (koordinat hanya masukan untuk dihitung server; tetap batasi rate pada endpoint scan).
- Simpan rahasia di `.env`; jangan commit. Sediakan `.env.example`.
- Kamera dan GPS hanya jalan di HTTPS (localhost dikecualikan saat pengembangan).

## 6b. Variabel lingkungan

```
DATABASE_URL=
# Klien (publik, aman terlihat di browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
# Server (RAHASIA)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 8. Cara kerja yang diharapkan

1. Kerjakan **satu tahap** pada satu waktu sesuai urutan di PRD bagian 10. Jangan melompat ke fitur tahap berikutnya.
2. Sebelum mengubah skema database: baca `prisma/schema.prisma`, buat migrasi (`npx prisma migrate dev --name <deskripsi>`), perbarui `seed.ts`. Jangan mengedit migrasi lama yang sudah diterapkan.
3. Jangan mengubah nama tabel/kolom/enum di PRD tanpa persetujuan developer.
4. Jika ada aturan bisnis yang ambigu, daftar di "Pertanyaan terbuka" PRD lalu tanyakan; jangan memutuskan sendiri.
5. Tambahkan tes untuk logika penting: `bolehAkses`, `haversine`, verifikasi token QR, penentuan status `hadir/terlambat`, dan API scan (semua jalur penolakan).
6. Perubahan kecil dan terfokus per commit; pesan commit jelas.

## 9. Perintah umum

```bash
npm install
npx prisma migrate dev        # migrasi lokal
npx prisma db seed            # isi data simulasi
npm run dev                   # jalankan lokal
npm run lint && npm run build # cek sebelum selesai
npm test                      # jalankan tes
```

## 10. Definition of Done (per tugas)

- [ ] Sesuai PRD dan aturan bisnis di bagian 4.
- [ ] Validasi server untuk semua input; tidak ada logika keamanan hanya di klien.
- [ ] Tipe TypeScript bersih, `npm run lint` dan `npm run build` lolos.
- [ ] Tes relevan ditambahkan dan lulus.
- [ ] Tampilan diperiksa di lebar ponsel dan desktop.
- [ ] Tidak ada secret atau data pribadi di kode/log.
- [ ] Seed dan dokumentasi diperbarui bila skema berubah.

## 11. Yang tidak boleh dilakukan

- Menggunakan `localStorage` untuk keputusan keamanan atau status presensi.
- Menyimpan status kegiatan (akan datang/berlangsung/selesai) sebagai kolom.
- Membuat database terpisah per periode (keputusan: satu database dengan tabel `periode`).
- Menambah fitur di luar PRD (notifikasi, izin/sakit, aplikasi native) tanpa persetujuan.
- Menghapus data presensi secara fisik; gunakan koreksi oleh adsek yang tercatat bila diperlukan.