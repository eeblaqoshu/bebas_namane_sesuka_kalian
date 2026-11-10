// app/(sto)/home/page.tsx
import { requireSto } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bolehAkses } from "@/lib/akses";
import {
  formatTanggalIndo,
  formatJamIndo,
  gabungTanggalDanWaktu,
  hitungStatusAgenda,
} from "@/lib/waktu";
import { LogoutButton } from "@/components/logout-button";
import { StoAgendaTabs, type AgendaItem } from "@/components/sto-agenda-tabs";
import { QrCode, Sparkles, CheckCircle2, Clock, Shield, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function StoHomePage() {
  const sto = await requireSto();

  // 1. Ambil Periode Aktif
  const periode = await prisma.periode.findUnique({
    where: { id: sto.periodeId },
  });

  // 2. Ambil Semua Agenda di Periode Ini
  const semuaAgenda = await prisma.agenda.findMany({
    where: {
      proker: {
        periodeId: sto.periodeId,
      },
    },
    include: {
      proker: { select: { nama: true } },
      sesi: {
        orderBy: { bukaAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ tglPelaksanaan: "asc" }, { waktuPelaksanaan: "asc" }],
  });

  // 3. Filter Agenda Berdasarkan Aturan Otorisasi bolehAkses
  const agendaAkses: typeof semuaAgenda = [];
  for (const ag of semuaAgenda) {
    const izin = await bolehAkses(sto.id, ag.id);
    if (izin.boleh) {
      agendaAkses.push(ag);
    }
  }

  // 4. Hitung Status Real-Time dan Pisahkan ke 3 Kategori
  const now = new Date();
  const akanDatang: AgendaItem[] = [];
  const sedangBerlangsung: AgendaItem[] = [];
  const selesai: AgendaItem[] = [];

  for (const ag of agendaAkses) {
    const waktuMulai = gabungTanggalDanWaktu(
      ag.tglPelaksanaan,
      ag.waktuPelaksanaan
    );
    const sesiAktif = ag.sesi[0];
    const statusDihitung = hitungStatusAgenda(
      waktuMulai,
      sesiAktif?.bukaAt,
      sesiAktif?.tutupAt,
      now
    );

    const adaSesiAktif =
      statusDihitung === "sedang_berlangsung" &&
      Boolean(sesiAktif && now >= sesiAktif.bukaAt && now <= sesiAktif.tutupAt);

    const item: AgendaItem = {
      id: ag.id,
      judul: ag.judul,
      prokerNama: ag.proker.nama,
      jenis: ag.jenis,
      tglFormatted: formatTanggalIndo(ag.tglPelaksanaan),
      jamFormatted: formatJamIndo(waktuMulai),
      lokasiNama: ag.lokasiNama,
      targetPeserta: ag.targetPeserta,
      statusDihitung,
      adaSesiAktif,
    };

    if (statusDihitung === "sedang_berlangsung") {
      sedangBerlangsung.push(item);
    } else if (statusDihitung === "akan_datang") {
      akanDatang.push(item);
    } else {
      selesai.push(item);
    }
  }

  // 5. Hitung Riwayat Kehadiran STO
  const riwayat = await prisma.presensi.findMany({
    where: { stoId: sto.id },
    select: { status: true },
  });
  const hadirCount = riwayat.filter((r) => r.status === "hadir").length;
  const telatCount = riwayat.filter((r) => r.status === "terlambat").length;

  // Inisial Nama untuk Avatar Placeholder jika foto belum ada
  const inisialNama = sto.nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#FBFBFB] dark:bg-[#0A0A0A] font-sans text-zinc-900 dark:text-zinc-100 antialiased pb-16">
      {/* Top Navbar Desktop & Mobile */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#121212]/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white p-0.5 shrink-0 shadow-sm">
              <Image
                src="/logo-pcc.png"
                alt="Logo UKM PCC"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Presensi STO
              </h1>
              <p className="text-[11px] text-zinc-500 font-normal">
                Polytechnic Computer Club • Polines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {periode?.nama || "Periode Aktif"}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Profil & Quick Action (Desktop 4/12, Mobile Full) */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Kartu Profil STO dengan Tempat Foto Resmi */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-zinc-200/80 dark:border-zinc-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-5">
              <div className="flex items-start justify-between gap-4">
                {/* Tempat Foto STO (Photo Slot) */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700/80 bg-zinc-100 dark:bg-zinc-800 shadow-sm overflow-hidden flex items-center justify-center relative">
                    {sto.foto ? (
                      <Image
                        src={sto.foto}
                        alt={`Foto ${sto.nama}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xl tracking-wider select-none">
                        <span>{inisialNama || "STO"}</span>
                      </div>
                    )}
                  </div>

                  {/* Icon Indikator Foto */}
                  <div
                    title="Foto Pengurus STO"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-md border-2 border-white dark:border-[#121212]"
                  >
                    <Camera className="w-3 h-3" />
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 shrink-0">
                  Pengurus Aktif
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {sto.nama}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">{sto.nim}</p>
              </div>

              <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[11px] text-zinc-400">Divisi</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                    {sto.divisi || "Pengurus Harian"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Jabatan</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                    {sto.jabatan || "Pengurus"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action: Scan QR Presensi */}
            <Link
              href="/scan"
              className="group block p-5 rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center text-white dark:text-zinc-900">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">
                      Scan QR Presensi
                    </h3>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                      Buka scanner kamera & GPS
                    </p>
                  </div>
                </div>
                <span className="w-7 h-7 rounded-full bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center text-xs font-semibold group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>

            {/* Ringkasan Kehadiran */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-zinc-200/80 dark:border-zinc-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Statistik Kehadiran
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-medium">Tepat Waktu</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {hadirCount}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 text-amber-600 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-medium">Terlambat</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {telatCount}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Kolom Kanan: Daftar Agenda Kegiatan (Desktop 8/12, Mobile Full) */}
          <section className="lg:col-span-8 space-y-5">
            {/* Banner Salam & Status Periode */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-zinc-200/80 dark:border-zinc-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-zinc-500">
                    Portal Kehadiran Pengurus
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Agenda Kepengurusan PCC
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Daftar agenda kegiatan yang disesuaikan dengan divisi dan kepanitiaan Anda.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-200/60 dark:border-blue-900/60">
                  <Shield className="w-3.5 h-3.5" />
                  STO Terverifikasi
                </span>
              </div>
            </div>

            {/* Komponen 3 Tab Agenda (Mobile-Friendly & Desktop-Ready) */}
            <StoAgendaTabs
              akanDatang={akanDatang}
              sedangBerlangsung={sedangBerlangsung}
              selesai={selesai}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
