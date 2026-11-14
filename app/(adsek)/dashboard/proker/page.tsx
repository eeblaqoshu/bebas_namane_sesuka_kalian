// app/(adsek)/dashboard/proker/page.tsx
import { requireAdsek } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProkerList } from "@/components/dashboard/proker-list";
import { StatusPeriode } from "@prisma/client";
import Link from "next/link";
import { AlertCircle, Calendar } from "lucide-react";

export default async function ProkerPage() {
  await requireAdsek();

  // Cari periode aktif (atau periode terbaru jika belum ada yang aktif)
  const periodeAktif = await prisma.periode.findFirst({
    where: { status: StatusPeriode.aktif },
  });

  const periodeTerkini =
    periodeAktif ||
    (await prisma.periode.findFirst({
      orderBy: { tglMulai: "desc" },
    }));

  if (!periodeTerkini) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-4 max-w-lg mx-auto my-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-highlight/15 text-[#B45309] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-primary">
            Belum Ada Periode Kepengurusan
          </h2>
          <p className="text-xs text-slate-muted mt-1">
            Program kerja harus terikat pada periode kepengurusan. Silakan buat periode baru terlebih dahulu.
          </p>
        </div>
        <Link
          href="/dashboard/periode"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold shadow-md shadow-secondary/25 transition-all"
        >
          <Calendar className="w-4 h-4" />
          Buka Periode
        </Link>
      </div>
    );
  }

  // Ambil daftar proker untuk periode ini
  const daftarProker = await prisma.proker.findMany({
    where: { periodeId: periodeTerkini.id },
    include: {
      pembuat: {
        select: { nama: true, role: true },
      },
      _count: {
        select: {
          kepanitiaan: true,
          agenda: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="py-2">
      <ProkerList
        initialProker={daftarProker}
        namaPeriode={periodeTerkini.nama}
        isPeriodeAktif={periodeTerkini.status === StatusPeriode.aktif}
      />
    </div>
  );
}
