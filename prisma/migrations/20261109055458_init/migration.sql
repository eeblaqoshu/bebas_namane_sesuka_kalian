-- CreateEnum
CREATE TYPE "status_periode" AS ENUM ('aktif', 'selesai');

-- CreateEnum
CREATE TYPE "role_adsek" AS ENUM ('admin', 'sekretaris_umum', 'sekretaris_inti');

-- CreateEnum
CREATE TYPE "peran_panitia" AS ENUM ('ketua', 'sekretaris', 'bendahara', 'pj_divisi', 'anggota');

-- CreateEnum
CREATE TYPE "jenis_agenda" AS ENUM ('rapat_pj', 'rapat_besar', 'rapat_koordinasi', 'hari_h');

-- CreateEnum
CREATE TYPE "target_peserta" AS ENUM ('hanya_pj_pi', 'semua_panitia', 'semua_panitia_sto');

-- CreateEnum
CREATE TYPE "status_presensi" AS ENUM ('hadir', 'terlambat');

-- CreateTable
CREATE TABLE "periode" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "tgl_mulai" DATE NOT NULL,
    "tgl_selesai" DATE NOT NULL,
    "status" "status_periode" NOT NULL DEFAULT 'aktif',

    CONSTRAINT "periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "akun_adsek" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firebase_uid" TEXT,
    "role" "role_adsek" NOT NULL,

    CONSTRAINT "akun_adsek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "STO" (
    "id" SERIAL NOT NULL,
    "periode_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "email_google" TEXT NOT NULL,
    "firebase_uid" TEXT,
    "jabatan" TEXT,
    "divisi" TEXT,
    "foto" TEXT,

    CONSTRAINT "STO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proker" (
    "id" SERIAL NOT NULL,
    "periode_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "dibuat_oleh" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kepanitiaan" (
    "id" SERIAL NOT NULL,
    "proker_id" INTEGER NOT NULL,
    "sto_id" INTEGER NOT NULL,
    "peran" "peran_panitia" NOT NULL,
    "divisi_panitia" TEXT,

    CONSTRAINT "kepanitiaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda" (
    "id" SERIAL NOT NULL,
    "proker_id" INTEGER NOT NULL,
    "jenis" "jenis_agenda" NOT NULL,
    "judul" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "tgl_pelaksanaan" DATE NOT NULL,
    "waktu_pelaksanaan" TIME(0) NOT NULL,
    "lokasi_nama" TEXT,
    "target_peserta" "target_peserta" NOT NULL,
    "dibuat_oleh" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi_presensi" (
    "id" SERIAL NOT NULL,
    "agenda_id" INTEGER NOT NULL,
    "dibuat_oleh" INTEGER NOT NULL,
    "buka_at" TIMESTAMPTZ(6) NOT NULL,
    "tutup_at" TIMESTAMPTZ(6) NOT NULL,
    "durasi_menit" INTEGER NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "radius_m" INTEGER NOT NULL DEFAULT 500,
    "qr_secret" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesi_presensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presensi" (
    "id" SERIAL NOT NULL,
    "sesi_id" INTEGER NOT NULL,
    "sto_id" INTEGER NOT NULL,
    "waktu_scan" TIMESTAMPTZ(6) NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "jarak_m" INTEGER NOT NULL,
    "status" "status_presensi" NOT NULL,

    CONSTRAINT "presensi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "akun_adsek_email_key" ON "akun_adsek"("email");

-- CreateIndex
CREATE UNIQUE INDEX "akun_adsek_firebase_uid_key" ON "akun_adsek"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "STO_email_google_key" ON "STO"("email_google");

-- CreateIndex
CREATE UNIQUE INDEX "STO_firebase_uid_key" ON "STO"("firebase_uid");

-- CreateIndex
CREATE INDEX "STO_periode_id_idx" ON "STO"("periode_id");

-- CreateIndex
CREATE INDEX "proker_periode_id_idx" ON "proker"("periode_id");

-- CreateIndex
CREATE INDEX "kepanitiaan_sto_id_idx" ON "kepanitiaan"("sto_id");

-- CreateIndex
CREATE UNIQUE INDEX "kepanitiaan_proker_id_sto_id_key" ON "kepanitiaan"("proker_id", "sto_id");

-- CreateIndex
CREATE INDEX "agenda_proker_id_tgl_pelaksanaan_idx" ON "agenda"("proker_id", "tgl_pelaksanaan");

-- CreateIndex
CREATE INDEX "sesi_presensi_agenda_id_idx" ON "sesi_presensi"("agenda_id");

-- CreateIndex
CREATE INDEX "presensi_sto_id_idx" ON "presensi"("sto_id");

-- CreateIndex
CREATE UNIQUE INDEX "presensi_sesi_id_sto_id_key" ON "presensi"("sesi_id", "sto_id");

-- AddForeignKey
ALTER TABLE "STO" ADD CONSTRAINT "STO_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proker" ADD CONSTRAINT "proker_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proker" ADD CONSTRAINT "proker_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "akun_adsek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kepanitiaan" ADD CONSTRAINT "kepanitiaan_proker_id_fkey" FOREIGN KEY ("proker_id") REFERENCES "proker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kepanitiaan" ADD CONSTRAINT "kepanitiaan_sto_id_fkey" FOREIGN KEY ("sto_id") REFERENCES "STO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_proker_id_fkey" FOREIGN KEY ("proker_id") REFERENCES "proker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "akun_adsek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_presensi" ADD CONSTRAINT "sesi_presensi_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "agenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_presensi" ADD CONSTRAINT "sesi_presensi_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "akun_adsek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_sesi_id_fkey" FOREIGN KEY ("sesi_id") REFERENCES "sesi_presensi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_sto_id_fkey" FOREIGN KEY ("sto_id") REFERENCES "STO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Aturan Bisnis: Hanya satu periode berstatus 'aktif' pada satu waktu
CREATE UNIQUE INDEX "periode_satu_aktif" ON "periode" ("status") WHERE "status" = 'aktif';

