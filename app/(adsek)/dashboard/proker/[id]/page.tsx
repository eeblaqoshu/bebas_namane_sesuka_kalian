// app/(adsek)/dashboard/proker/[id]/page.tsx
import { requireAdsek } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProkerDetail } from "@/components/dashboard/proker-detail";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProkerDetailPage({ params }: PageProps) {
  await requireAdsek();

  const { id } = await params;
  const prokerId = parseInt(id, 10);

  if (isNaN(prokerId)) {
    notFound();
  }

  const proker = await prisma.proker.findUnique({
    where: { id: prokerId },
    include: {
      periode: {
        select: {
          id: true,
          nama: true,
          status: true,
        },
      },
      kepanitiaan: {
        include: {
          sto: {
            select: {
              id: true,
              nama: true,
              nim: true,
              emailGoogle: true,
              jabatan: true,
              divisi: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
      agenda: {
        include: {
          sesi: {
            select: {
              id: true,
              durasiMenit: true,
              bukaAt: true,
              tutupAt: true,
            },
          },
        },
        orderBy: {
          urutan: "asc",
        },
      },
    },
  });

  if (!proker) {
    notFound();
  }

  // Ambil semua daftar STO pada periode proker ini untuk pilihan penambahan panitia
  const availableStos = await prisma.sto.findMany({
    where: { periodeId: proker.periode.id },
    select: {
      id: true,
      nama: true,
      nim: true,
      divisi: true,
    },
    orderBy: { nama: "asc" },
  });

  return (
    <div className="py-2">
      <ProkerDetail proker={proker} availableStos={availableStos} />
    </div>
  );
}
