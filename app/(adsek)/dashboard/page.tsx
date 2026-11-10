// app/(adsek)/dashboard/page.tsx
import { requireAdsek } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusPeriode } from "@prisma/client";
import { Calendar, FolderKanban, Users, ShieldCheck, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export default async function AdsekDashboardPage() {
  const adsek = await requireAdsek();

  // Ambil periode aktif dan statistik
  const periodeAktif = await prisma.periode.findFirst({
    where: { status: StatusPeriode.aktif },
    include: {
      _count: {
        select: {
          sto: true,
          proker: true,
        },
      },
    },
  });

  const totalProker = periodeAktif?._count.proker ?? 0;
  const totalSto = periodeAktif?._count.sto ?? 0;

  // Hitung total agenda periode aktif
  const totalAgenda = periodeAktif
    ? await prisma.agenda.count({
        where: { proker: { periodeId: periodeAktif.id } },
      })
    : 0;

  return (
    <div className="space-y-6">
      {/* Banner Periode Aktif */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                periodeAktif ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                periodeAktif
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {periodeAktif ? "Periode Aktif Berjalan" : "Tidak Ada Periode Aktif"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {periodeAktif?.nama || "Sistem Belum Memiliki Periode Aktif"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {periodeAktif
              ? `Dimulai: ${new Date(periodeAktif.tglMulai).toLocaleDateString("id-ID")} • Selesai: ${new Date(
                  periodeAktif.tglSelesai
                ).toLocaleDateString("id-ID")}`
              : "Silakan buka periode baru melalui menu Kelola Periode (Admin)."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {adsek.role.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Ringkasan Angka Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Total Pengurus STO</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {totalSto}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Program Kerja (Proker)</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {totalProker}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Total Agenda Kegiatan</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {totalAgenda}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Menu Cepat Navigasi Modul Master Data */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
          Modul Master Data Organisasi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/proker"
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all shadow-sm group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-3">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                Program Kerja & Agenda
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                Kelola proker, kepanitiaan (PI/PJ/Anggota), serta agenda kegiatan.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Buka Proker <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {adsek.role === "admin" && (
            <>
              <Link
                href="/dashboard/sto"
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all shadow-sm group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                    Data Pengurus STO
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Kelola data pengurus STO manual dan impor massal dari file CSV.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Kelola STO <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/dashboard/periode"
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all shadow-sm group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                    Kelola Periode
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Buka periode kepengurusan baru atau tutup periode (read-only).
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Kelola Periode <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
