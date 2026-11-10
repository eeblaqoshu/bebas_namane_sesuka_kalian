// app/(adsek)/dashboard/periode/page.tsx
import { requireAdsek } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PeriodeManager } from "@/components/dashboard/periode-manager";

export default async function PeriodePage() {
  // Hanya admin yang memiliki akses
  await requireAdsek(["admin"]);

  const daftarPeriode = await prisma.periode.findMany({
    orderBy: { tglMulai: "desc" },
    include: {
      _count: {
        select: {
          sto: true,
          proker: true,
        },
      },
    },
  });

  return (
    <div className="py-2">
      <PeriodeManager initialPeriode={daftarPeriode} />
    </div>
  );
}
