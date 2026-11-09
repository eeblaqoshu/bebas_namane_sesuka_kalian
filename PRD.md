# PRD: Sistem Presensi Pengurus Organisasi

Versi 1.0 | Status: Draft siap dikembangkan | Stack: Next.js, PostgreSQL, Tailwind CSS

## 1. Ringkasan

Website presensi kehadiran pengurus (STO) dan panitia organisasi. Presensi dilakukan dengan login akun Google mahasiswa (melalui Firebase Authentication), memilih agenda, lalu scan QR code dalam radius lokasi tertentu. Data dikelompokkan per **periode kepengurusan**, per **proker**, dan per **agenda** (rapat PJ, rapat besar, rapat koordinasi, hari H).

## 2. Tujuan dan non-tujuan

**Tujuan**
- Mencatat kehadiran STO dan panitia secara akurat dan sulit dicurangi (QR dinamis + validasi lokasi + validasi waktu).
- Memudahkan adsek membuat proker, kepanitiaan, agenda, dan sesi presensi.
- Memberi STO/panitia halaman home berisi agenda yang relevan bagi mereka.
- Menyimpan riwayat per periode; periode lama menjadi read-only.

**Non-tujuan (v1)**
- Aplikasi mobile native.
- Notifikasi push/email/WhatsApp.
- Pengajuan izin/sakit.
- Ekspor laporan canggih (v1 cukup rekap di layar dan ekspor CSV).

## 3. Pengguna dan peran

| Peran | Siapa | Cara login | Kemampuan |
|---|---|---|---|
| `admin` | Pengelola sistem | Email + password (Firebase) | Semua fitur adsek, kelola periode, kelola data STO, kelola akun adsek |
| `sekretaris_umum` | Adsek | Email + password (Firebase) | Buat proker, kepanitiaan, agenda, sesi presensi, ubah durasi |
| `sekretaris_inti` | Adsek | Email + password (Firebase) | Sama seperti sekretaris umum |
| STO / panitia | Pengurus terdaftar | Google via Firebase (email mahasiswa) | Lihat home, profil, scan QR |

Istilah: **adsek** = admin + sekretaris umum + sekretaris inti. **STO** = pengurus terdaftar pada suatu periode.

## 4. Konsep data

```
periode ─┬─< STO
         └─< proker ─┬─< kepanitiaan >─ STO
                     └─< agenda ─< sesi_presensi ─< presensi >─ STO
akun_adsek ── dibuat_oleh (proker, agenda, sesi_presensi)
```

Keputusan arsitektur: **satu database PostgreSQL** dengan tabel `periode`. Pergantian periode = admin menutup periode aktif (status `selesai`, data menjadi read-only) lalu membuat periode baru. Tidak membuat database fisik baru per periode.

### Skema tabel

```sql
-- ENUM
status_periode:   aktif | selesai
role_adsek:       admin | sekretaris_umum | sekretaris_inti
peran_panitia:    ketua | sekretaris | bendahara | pj_divisi | anggota
jenis_agenda:     rapat_pj | rapat_besar | rapat_koordinasi | hari_h
target_peserta:   hanya_pj_pi | semua_panitia | semua_panitia_sto
status_presensi:  hadir | terlambat

periode(id, nama, tgl_mulai, tgl_selesai, status)
akun_adsek(id, nama, email UNIQUE, firebase_uid UNIQUE NULL, role)
STO(id, periode_id, nama, nim, email_google UNIQUE, firebase_uid UNIQUE NULL, jabatan, divisi, foto)
proker(id, periode_id, nama, deskripsi, dibuat_oleh)
kepanitiaan(id, proker_id, sto_id, peran, divisi_panitia, UNIQUE(proker_id, sto_id))
agenda(id, proker_id, jenis, judul, urutan, tgl_pelaksanaan DATE,
       waktu_pelaksanaan TIME, lokasi_nama, target_peserta, dibuat_oleh)
sesi_presensi(id, agenda_id, dibuat_oleh, buka_at, tutup_at, durasi_menit,
              lat, lng, radius_m DEFAULT 500, qr_secret)
presensi(id, sesi_id, sto_id, waktu_scan, lat, lng, jarak_m, status,
         UNIQUE(sesi_id, sto_id))
```

## 5. Aturan bisnis

### 5.1 Periode
- Hanya satu periode berstatus `aktif` pada satu waktu.
- Periode `selesai` bersifat read-only: tidak boleh membuat/mengubah proker, kepanitiaan, agenda, sesi, maupun presensi di dalamnya.
- Data STO terikat ke periode. Email yang sama pada periode baru didaftarkan ulang (admin impor CSV dari Google Form).

### 5.2 Kelompok peran panitia
| Kelompok | Peran |
|---|---|
| PI (pimpinan inti) | `ketua`, `sekretaris`, `bendahara` |
| PJ (penanggung jawab) | `pj_divisi` |
| Bukan PJ/PI | `anggota` |

### 5.3 Target peserta agenda
| `target_peserta` | Siapa yang berhak melihat dan absen |
|---|---|
| `hanya_pj_pi` | Terdaftar di `kepanitiaan` proker tsb **dan** peran bukan `anggota` |
| `semua_panitia` | Terdaftar di `kepanitiaan` proker tsb (peran apa pun) |
| `semua_panitia_sto` | Semua STO pada periode proker tsb |

Peran selalu dibaca dari `kepanitiaan` pada saat pengecekan (per pasangan `proker_id + sto_id`), tidak disalin ke tabel lain.

### 5.4 Sesi presensi
- Satu agenda boleh punya lebih dari satu sesi (contoh: absen masuk dan absen pulang saat hari H).
- `tutup_at = buka_at + durasi_menit`. Adsek dapat mengubah `durasi_menit` sebelum atau selama sesi berjalan; `tutup_at` dihitung ulang.
- `buka_at` default diisi dari `tgl_pelaksanaan` + `waktu_pelaksanaan` agenda, dapat diubah.
- Titik pusat (`lat`, `lng`) diambil dari lokasi browser adsek saat membuat sesi. Radius default 500 m.

### 5.5 Status presensi
- `hadir`: scan sampai 15 menit setelah `buka_at`.
- `terlambat`: scan setelah 15 menit sampai `tutup_at`.
- Tidak ada baris presensi = alpa (dihitung dari kepanitiaan/target peserta dikurangi presensi).
- Batas 15 menit adalah konstanta awal (lihat Pertanyaan Terbuka).

### 5.6 Validasi scan (semua dilakukan di server)
Presensi disimpan hanya jika **semua** syarat terpenuhi:
1. Sesi login valid (ID token/session cookie Firebase diverifikasi server) dan emailnya terdaftar di tabel `STO` periode aktif.
2. Token QR valid dan belum kedaluwarsa.
3. Waktu server berada di antara `buka_at` dan `tutup_at`.
4. Jarak (Haversine) antara lokasi pemindai dan titik sesi ≤ `radius_m`.
5. STO berhak atas agenda tersebut (aturan 5.3).
6. STO belum pernah absen di sesi tersebut (`UNIQUE(sesi_id, sto_id)`).

Setiap penolakan mengembalikan alasan yang jelas ke pengguna (di luar waktu, di luar radius, tidak berhak, sudah absen, QR kedaluwarsa).

### 5.7 QR code
- QR **dinamis**: berisi token HMAC dari `sesi_id` + jendela waktu (berganti sekitar tiap 30 detik) menggunakan `qr_secret` sesi.
- Layar adsek menampilkan QR yang diperbarui otomatis.
- Server menerima token pada jendela saat ini dan satu jendela sebelumnya (toleransi jam/jaringan).

## 6. Fitur dan alur

### 6.1 Login
Autentikasi memakai **Firebase Authentication**; otorisasi (siapa boleh apa) tetap diputuskan database lewat tabel `akun_adsek`, `STO`, `kepanitiaan`, dan `bolehAkses`.

Alur: klien login via Firebase dan mendapat ID token → dikirim ke API → server memverifikasi token dengan Firebase Admin SDK → server mencocokkan email ke database → jika cocok, server membuat **session cookie** httpOnly. Jika email tidak terdaftar, sesi tidak dibuat dan login ditolak dengan pesan jelas.

- **STO**: tombol "Masuk dengan Google" (provider Google di Firebase). Email dicek ke `STO` periode aktif.
- **Adsek**: form email + password (provider Email/Password di Firebase). Email dicek ke `akun_adsek`. Jika sebuah email ada di `akun_adsek` dan `STO`, `akun_adsek` diprioritaskan.
- **Pembuatan akun adsek**: dilakukan admin dari dashboard. Server membuat pengguna Firebase lewat Admin SDK, menyimpan `firebase_uid`, lalu mengirim tautan atur password ke email adsek. Aplikasi tidak pernah menyimpan atau melihat password.
- Kolom `firebase_uid` diisi saat akun dibuat (adsek) atau saat login pertama (STO), lalu dipakai sebagai penghubung tetap.
- Setelah login, STO diarahkan ke home; adsek ke dashboard.

### 6.2 Home STO/panitia
- Tiga tab: **Akan Datang**, **Sedang Berlangsung**, **Selesai**.
- Daftar agenda hanya yang lolos aturan 5.3 untuk STO tersebut.
- Status dihitung dari `tgl_pelaksanaan` + `waktu_pelaksanaan` dan waktu sekarang (zona Asia/Jakarta).
- Kartu profil: nama, NIM, email, jabatan, divisi, foto.
- Jika belum ada agenda: tampilan kosong "Belum ada kegiatan".

### 6.3 Scan presensi (STO)
1. Buka halaman scan, pilih proker lalu agenda (hanya agenda yang berhak dan sesinya sedang buka).
2. Izinkan kamera dan GPS.
3. Scan QR di layar adsek. Hasil sukses/gagal tampil dengan alasan.

### 6.4 Dashboard adsek
- **Periode** (admin): buat, tutup periode.
- **STO** (admin): CRUD dan impor CSV.
- **Proker**: CRUD (dalam periode aktif).
- **Kepanitiaan**: tambah/ubah/hapus STO per proker beserta peran.
- **Agenda**: CRUD per proker; pilih jenis, tanggal, waktu, lokasi, target peserta.
- **Sesi presensi**: buat sesi, tampilkan QR dinamis, ubah durasi, tutup lebih awal.
- **Rekap**: kehadiran per sesi, per agenda, per proker, per STO; ekspor CSV.

## 7. Halaman dan rute

```
/login                      Pilih: login Google (STO) / login adsek
/home                       Home STO (3 tab + profil)
/profil                     Profil STO
/scan                       Pilih agenda + scanner QR
/dashboard                  Ringkasan adsek
/dashboard/periode          Kelola periode (admin)
/dashboard/sto              Kelola STO (admin)
/dashboard/proker           Daftar dan form proker
/dashboard/proker/[id]      Detail proker: kepanitiaan + agenda
/dashboard/presensi/[sesi]  Layar QR dinamis + daftar hadir langsung
/dashboard/rekap            Rekap dan ekspor
```

## 8. Kebutuhan non-fungsional

- **Keamanan**: semua validasi presensi di server; route adsek dilindungi role; password dikelola Firebase dan tidak disimpan di database; secret QR tidak pernah dikirim ke klien.
- **HTTPS wajib** di produksi (kamera dan geolokasi tidak berfungsi di HTTP).
- **Zona waktu**: simpan timestamp UTC (`timestamptz`), tampilkan Asia/Jakarta (WIB).
- **Responsif**: mobile-first (STO memakai ponsel), dashboard adsek nyaman di desktop.
- **Performa**: scan diproses < 2 detik pada kondisi normal; indeks pada `presensi(sesi_id)`, `kepanitiaan(proker_id, sto_id)`, `agenda(proker_id, tgl_pelaksanaan)`.
- **Audit ringan**: simpan `dibuat_oleh` dan timestamp pembuatan pada tabel utama.

## 9. Kriteria penerimaan (contoh yang harus lulus)

1. STO dengan email tidak terdaftar tidak bisa login.
2. Anggota biasa tidak melihat agenda `hanya_pj_pi` di home dan tidak bisa absen via API langsung.
3. Scan dari luar radius 500 m ditolak.
4. Scan setelah `tutup_at` ditolak; scan kedua pada sesi yang sama ditolak.
5. Mengubah durasi sesi memperbarui `tutup_at`.
6. Screenshot QR lama (lewat jendela token) ditolak.
7. Periode `selesai` tidak bisa diubah.
8. STO yang bukan panitia proker tetap melihat agenda `semua_panitia_sto`.

## 10. Tahapan pengembangan

1. **Fondasi**: setup proyek, `schema.prisma`, migrasi, seed data simulasi.
2. **Autentikasi**: Firebase Auth (Google untuk STO, email/password untuk adsek), session cookie server, proteksi route per role.
3. **Master data**: periode, STO (impor CSV), proker, kepanitiaan, agenda.
4. **Presensi inti**: sesi, QR dinamis, API scan dengan 6 validasi, `bolehAkses`.
5. **Home dan profil STO**: tiga tab status.
6. **Rekap dan ekspor CSV**.
7. **Pengujian dan deploy** (HTTPS).

## 11. Pertanyaan terbuka

- Batas "terlambat" tetap 15 menit atau dibuat per sesi (`batas_terlambat_menit`)?
- Perlu waktu selesai agenda (`waktu_selesai`)?
- Adsek/admin pertama dibuat lewat skrip seed yang membuat pengguna Firebase dan baris `akun_adsek` sekaligus.
- Apakah STO yang bukan panitia boleh melihat agenda berlabel `semua_panitia_sto` dari proker yang bukan miliknya? (Asumsi v1: ya, selama satu periode.)