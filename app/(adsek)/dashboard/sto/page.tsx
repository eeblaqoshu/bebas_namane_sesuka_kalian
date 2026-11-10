// app/(adsek)/dashboard/sto/page.tsx
import { requireAdsek } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoManager } from "@/components/dashboard/sto-manager";
import { StatusPeriode } from "@prisma/client";
import Link from "next/link";
import { AlertCircle, Calendar } from "lucide-react";

export default async function StoPage() {
  // Hanya admin yang berhak mengelola data STO
  await requireAdsek(["admin"]);

  // Ambil periode aktif
  const periodeAktif = await prisma.periode.findFirst({
    where: { status: StatusPeriode.aktif },
  });

  if (!periodeAktif) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Tidak Ada Periode Aktif
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Data STO wajib terikat ke periode kepengurusan aktif. Silakan buka periode baru terlebih dahulu.
          </p>
        </div>
        <Link
          href="/dashboard/periode"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <Calendar className="w-4 h-4" />
          Buka Periode Sekarang
        </Link>
      </div>
    );
  }

  // Ambil daftar STO pada periode aktif
  const daftarSto = await prisma.sto.findMany({
    where: { periodeId: periodeAktif.id },
    orderBy: { nama: "asc" },
  });

  return (
    <div className="py-2">
      <StoManager initialSto={daftarSto} namaPeriode={periodeAktif.nama} />
    </div>
  );
}
