// lib/actions/proker.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdsek } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { StatusPeriode, PeranPanitia } from "@prisma/client";

const BuatProkerSchema = z.object({
  nama: z.string().min(3, "Nama proker minimal 3 karakter"),
  deskripsi: z.string().optional().nullable(),
});

const TambahPanitiaSchema = z.object({
  prokerId: z.coerce.number(),
  stoId: z.coerce.number(),
  peran: z.nativeEnum(PeranPanitia),
  divisiPanitia: z.string().optional().nullable(),
});

export async function buatProkerAction(prevState: unknown, formData: FormData) {
  try {
    const adsek = await requireAdsek();

    const periodeAktif = await prisma.periode.findFirst({
      where: { status: StatusPeriode.aktif },
    });

    if (!periodeAktif) {
      return {
        error: {
          kode: "PERIODE_TIDAK_AKTIF",
          pesan: "Tidak ada periode aktif. Proker hanya dapat dibuat pada periode aktif.",
        },
      };
    }

    const rawData = {
      nama: formData.get("nama") as string,
      deskripsi: (formData.get("deskripsi") as string) || null,
    };

    const parsed = BuatProkerSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        error: {
          kode: "VALIDASI_GAGAL",
          pesan: parsed.error.issues[0].message,
        },
      };
    }

    await prisma.proker.create({
      data: {
        periodeId: periodeAktif.id,
        nama: parsed.data.nama,
        deskripsi: parsed.data.deskripsi,
        dibuatOleh: adsek.id,
      },
    });

    revalidatePath("/dashboard/proker");
    revalidatePath("/dashboard");
    return { sukses: true, pesan: "Program kerja berhasil dibuat" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal membuat program kerja",
      },
    };
  }
}

export async function ubahProkerAction(prokerId: number, formData: FormData) {
  try {
    await requireAdsek();

    const proker = await prisma.proker.findUnique({
      where: { id: prokerId },
      include: { periode: true },
    });

    if (!proker) {
      return {
        error: {
          kode: "TIDAK_DITEMUKAN",
          pesan: "Program kerja tidak ditemukan",
        },
      };
    }

    // Aturan bisnis: periode selesai bersifat read-only
    if (proker.periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "PERIODE_SELESAI",
          pesan: "Tidak dapat mengubah proker karena periode sudah selesai (read-only)",
        },
      };
    }

    const rawData = {
      nama: formData.get("nama") as string,
      deskripsi: (formData.get("deskripsi") as string) || null,
    };

    const parsed = BuatProkerSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        error: {
          kode: "VALIDASI_GAGAL",
          pesan: parsed.error.issues[0].message,
        },
      };
    }

    await prisma.proker.update({
      where: { id: prokerId },
      data: {
        nama: parsed.data.nama,
        deskripsi: parsed.data.deskripsi,
      },
    });

    revalidatePath(`/dashboard/proker/${prokerId}`);
    revalidatePath("/dashboard/proker");
    return { sukses: true, pesan: "Program kerja berhasil diperbarui" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal mengubah program kerja",
      },
    };
  }
}

export async function hapusProkerAction(prokerId: number) {
  try {
    await requireAdsek();

    const proker = await prisma.proker.findUnique({
      where: { id: prokerId },
      include: {
        periode: true,
        agenda: {
          include: { sesi: true },
        },
      },
    });

    if (!proker) {
      return {
        error: {
          kode: "TIDAK_DITEMUKAN",
          pesan: "Program kerja tidak ditemukan",
        },
      };
    }

    if (proker.periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "PERIODE_SELESAI",
          pesan: "Periode ini sudah selesai dan berstatus read-only",
        },
      };
    }

    // Periksa apakah sudah ada sesi presensi pada agenda proker ini
    const totalSesi = proker.agenda.reduce((acc, a) => acc + a.sesi.length, 0);
    if (totalSesi > 0) {
      return {
        error: {
          kode: "MEMILIKI_SESI_PRESENSI",
          pesan: "Proker tidak dapat dihapus karena sudah memiliki sesi presensi",
        },
      };
    }

    // Hapus kepanitiaan dan agenda terkait dalam transaksi
    await prisma.$transaction(async (tx) => {
      await tx.kepanitiaan.deleteMany({ where: { prokerId } });
      await tx.agenda.deleteMany({ where: { prokerId } });
      await tx.proker.delete({ where: { id: prokerId } });
    });

    revalidatePath("/dashboard/proker");
    revalidatePath("/dashboard");
    return { sukses: true, pesan: "Program kerja berhasil dihapus" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal menghapus program kerja",
      },
    };
  }
}

// ─────────────────────────────────────────────
// KEPANITIAAN ACTIONS
// ─────────────────────────────────────────────

export async function tambahPanitiaAction(formData: FormData) {
  try {
    await requireAdsek();

    const rawData = {
      prokerId: formData.get("prokerId"),
      stoId: formData.get("stoId"),
      peran: formData.get("peran"),
      divisiPanitia: (formData.get("divisiPanitia") as string) || null,
    };

    const parsed = TambahPanitiaSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        error: {
          kode: "VALIDASI_GAGAL",
          pesan: parsed.error.issues[0].message,
        },
      };
    }

    const { prokerId, stoId, peran, divisiPanitia } = parsed.data;

    // Cek proker dan status periodenya
    const proker = await prisma.proker.findUnique({
      where: { id: prokerId },
      include: { periode: true },
    });

    if (!proker || proker.periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "PERIODE_READ_ONLY",
          pesan: "Tidak dapat mengubah kepanitiaan pada periode yang sudah selesai",
        },
      };
    }

    // Cek apakah STO sudah terdaftar di kepanitiaan proker ini
    const existing = await prisma.kepanitiaan.findUnique({
      where: {
        prokerId_stoId: {
          prokerId,
          stoId,
        },
      },
    });

    if (existing) {
      return {
        error: {
          kode: "SUDAH_TERDAFTAR",
          pesan: "Pengurus ini sudah terdaftar dalam kepanitiaan proker ini",
        },
      };
    }

    await prisma.kepanitiaan.create({
      data: {
        prokerId,
        stoId,
        peran,
        divisiPanitia,
      },
    });

    revalidatePath(`/dashboard/proker/${prokerId}`);
    return { sukses: true, pesan: "Panitia berhasil ditambahkan" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal menambahkan panitia",
      },
    };
  }
}

export async function ubahPanitiaAction(kepanitiaanId: number, formData: FormData) {
  try {
    await requireAdsek();

    const kepanitiaan = await prisma.kepanitiaan.findUnique({
      where: { id: kepanitiaanId },
      include: { proker: { include: { periode: true } } },
    });

    if (!kepanitiaan || kepanitiaan.proker.periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "PERIODE_READ_ONLY",
          pesan: "Tidak dapat mengubah data kepanitiaan pada periode yang selesai",
        },
      };
    }

    const peran = formData.get("peran") as PeranPanitia;
    const divisiPanitia = (formData.get("divisiPanitia") as string) || null;

    if (!Object.values(PeranPanitia).includes(peran)) {
      return {
        error: {
          kode: "PERAN_TIDAK_VALID",
          pesan: "Peran panitia tidak valid",
        },
      };
    }

    await prisma.kepanitiaan.update({
      where: { id: kepanitiaanId },
      data: {
        peran,
        divisiPanitia,
      },
    });

    revalidatePath(`/dashboard/proker/${kepanitiaan.prokerId}`);
    return { sukses: true, pesan: "Data panitia berhasil diperbarui" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal mengubah data panitia",
      },
    };
  }
}

export async function hapusPanitiaAction(kepanitiaanId: number) {
  try {
    await requireAdsek();

    const kepanitiaan = await prisma.kepanitiaan.findUnique({
      where: { id: kepanitiaanId },
      include: { proker: { include: { periode: true } } },
    });

    if (!kepanitiaan || kepanitiaan.proker.periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "PERIODE_READ_ONLY",
          pesan: "Tidak dapat menghapus panitia pada periode selesai",
        },
      };
    }

    await prisma.kepanitiaan.delete({
      where: { id: kepanitiaanId },
    });

    revalidatePath(`/dashboard/proker/${kepanitiaan.prokerId}`);
    return { sukses: true, pesan: "Panitia berhasil dihapus dari proker" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal menghapus panitia",
      },
    };
  }
}
