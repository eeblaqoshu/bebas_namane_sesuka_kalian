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
    <div className="min-h-screen bg-surface font-sans text-navy antialiased pb-16">
      {/* Top Navbar Desktop & Mobile */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(11,42,91,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#E2E8F0] bg-white p-0.5 shrink-0 shadow-sm">
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
              <h1 className="text-sm font-bold tracking-tight text-primary">
                Presensi STO
              </h1>
              <p className="text-[11px] text-slate-muted font-normal">
                Polytechnic Computer Club • Polines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-primary border border-accent/40">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
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
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4">
                {/* Tempat Foto STO (Photo Slot) */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl border-2 border-[#CBD5E1] bg-surface shadow-sm overflow-hidden flex items-center justify-center relative">
                    {sto.foto ? (
                      <Image
                        src={sto.foto}
                        alt={`Foto ${sto.nama}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold text-xl tracking-wider select-none">
                        <span>{inisialNama || "STO"}</span>
                      </div>
                    )}
                  </div>

                  {/* Icon Indikator Foto */}
                  <div
                    title="Foto Pengurus STO"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-secondary text-white flex items-center justify-center shadow-md border-2 border-white"
                  >
                    <Camera className="w-3 h-3" />
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-accent/20 text-primary border border-accent/40 shrink-0">
                  Pengurus Aktif
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-primary tracking-tight">
                  {sto.nama}
                </h2>
                <p className="text-xs text-slate-muted mt-0.5 font-mono">{sto.nim}</p>
              </div>

              <div className="pt-3.5 border-t border-[#E2E8F0] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[11px] text-slate-muted">Divisi</p>
                  <p className="font-semibold text-navy mt-0.5 truncate">
                    {sto.divisi || "Pengurus Harian"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-muted">Jabatan</p>
                  <p className="font-semibold text-navy mt-0.5 truncate">
                    {sto.jabatan || "Pengurus"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action: Scan QR Presensi */}
            <Link
              href="/scan"
              className="group block p-5 rounded-3xl bg-primary hover:bg-secondary text-white shadow-md shadow-primary/20 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-white">
                    <QrCode className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      Scan QR Presensi
                    </h3>
                    <p className="text-[11px] text-accent/90 mt-0.5">
                      Buka scanner kamera & GPS
                    </p>
                  </div>
                </div>
                <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs font-semibold group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>

            {/* Ringkasan Kehadiran */}
            <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-muted uppercase tracking-wider">
                Statistik Kehadiran
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-accent/15 border border-accent/30">
                  <div className="flex items-center gap-1.5 text-secondary text-xs mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                    <span className="font-bold">Tepat Waktu</span>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {hadirCount}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-highlight/15 border border-highlight/30">
                  <div className="flex items-center gap-1.5 text-[#B45309] text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                    <span className="font-bold">Terlambat</span>
                  </div>
                  <p className="text-xl font-bold text-[#B45309]">
                    {telatCount}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Kolom Kanan: Daftar Agenda Kegiatan (Desktop 8/12, Mobile Full) */}
          <section className="lg:col-span-8 space-y-5">
            {/* Banner Salam & Status Periode */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-highlight" />
                  <span className="text-xs font-semibold text-slate-muted">
                    Portal Kehadiran Pengurus
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-primary">
                  Agenda Kepengurusan PCC
                </h2>
                <p className="text-xs text-slate-muted mt-1">
                  Daftar agenda kegiatan yang disesuaikan dengan divisi dan kepanitiaan Anda.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                  <Shield className="w-3.5 h-3.5 text-secondary" />
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
