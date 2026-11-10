// lib/actions/periode.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdsek } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { StatusPeriode } from "@prisma/client";

const BuatPeriodeSchema = z.object({
  nama: z.string().min(3, "Nama periode minimal 3 karakter"),
  tglMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  tglSelesai: z.string().min(1, "Tanggal selesai wajib diisi"),
  status: z.enum(["aktif", "selesai"]).default("aktif"),
});

export async function buatPeriodeAction(prevState: unknown, formData: FormData) {
  try {
    await requireAdsek(["admin"]);

    const rawData = {
      nama: formData.get("nama") as string,
      tglMulai: formData.get("tglMulai") as string,
      tglSelesai: formData.get("tglSelesai") as string,
      status: (formData.get("status") as "aktif" | "selesai") || "aktif",
    };

    const parsed = BuatPeriodeSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        error: {
          kode: "VALIDASI_GAGAL",
          pesan: parsed.error.issues[0].message,
        },
      };
    }

    const { nama, tglMulai, tglSelesai, status } = parsed.data;
    const mulaiDate = new Date(tglMulai);
    const selesaiDate = new Date(tglSelesai);

    if (selesaiDate <= mulaiDate) {
      return {
        error: {
          kode: "TANGGAL_TIDAK_VALID",
          pesan: "Tanggal selesai harus lebih besar dari tanggal mulai",
        },
      };
    }

    // Jika membuat periode aktif, tutup semua periode aktif yang ada sebelumnya
    // sesuai aturan PRD: hanya satu periode aktif pada satu waktu
    await prisma.$transaction(async (tx) => {
      if (status === "aktif") {
        await tx.periode.updateMany({
          where: { status: StatusPeriode.aktif },
          data: { status: StatusPeriode.selesai },
        });
      }

      await tx.periode.create({
        data: {
          nama,
          tglMulai: mulaiDate,
          tglSelesai: selesaiDate,
          status: status === "aktif" ? StatusPeriode.aktif : StatusPeriode.selesai,
        },
      });
    });

    revalidatePath("/dashboard/periode");
    revalidatePath("/dashboard");
    return { sukses: true, pesan: "Periode kepengurusan berhasil dibuat" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal membuat periode kepengurusan",
      },
    };
  }
}

export async function tutupPeriodeAction(periodeId: number) {
  try {
    await requireAdsek(["admin"]);

    const periode = await prisma.periode.findUnique({
      where: { id: periodeId },
    });

    if (!periode) {
      return {
        error: {
          kode: "TIDAK_DITEMUKAN",
          pesan: "Periode tidak ditemukan",
        },
      };
    }

    if (periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "SUDAH_SELESAI",
          pesan: "Periode ini sudah berstatus selesai",
        },
      };
    }

    await prisma.periode.update({
      where: { id: periodeId },
      data: { status: StatusPeriode.selesai },
    });

    revalidatePath("/dashboard/periode");
    revalidatePath("/dashboard");
    return { sukses: true, pesan: `Periode ${periode.nama} berhasil ditutup (read-only)` };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal menutup periode",
      },
    };
  }
}

export async function aktifkanPeriodeAction(periodeId: number) {
  try {
    await requireAdsek(["admin"]);

    await prisma.$transaction(async (tx) => {
      // Nonaktifkan semua periode aktif lainnya
      await tx.periode.updateMany({
        where: { status: StatusPeriode.aktif },
        data: { status: StatusPeriode.selesai },
      });

      // Aktifkan periode yang dipilih
      await tx.periode.update({
        where: { id: periodeId },
        data: { status: StatusPeriode.aktif },
      });
    });

    revalidatePath("/dashboard/periode");
    revalidatePath("/dashboard");
    return { sukses: true, pesan: "Periode berhasil diaktifkan" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal mengaktifkan periode",
      },
    };
  }
}

export async function hapusPeriodeAction(periodeId: number) {
  try {
    await requireAdsek(["admin"]);

    const periode = await prisma.periode.findUnique({
      where: { id: periodeId },
      include: {
        _count: {
          select: { sto: true, proker: true },
        },
      },
    });

    if (!periode) {
      return {
        error: {
          kode: "TIDAK_DITEMUKAN",
          pesan: "Periode tidak ditemukan",
        },
      };
    }

    if (periode._count.sto > 0 || periode._count.proker > 0) {
      return {
        error: {
          kode: "PERIODE_MEMILIKI_DATA",
          pesan: "Periode tidak dapat dihapus karena masih memiliki data STO atau Proker",
        },
      };
    }

    await prisma.periode.delete({
      where: { id: periodeId },
    });

    revalidatePath("/dashboard/periode");
    revalidatePath("/dashboard");
    return { sukses: true, pesan: "Periode berhasil dihapus" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal menghapus periode",
      },
    };
  }
}
