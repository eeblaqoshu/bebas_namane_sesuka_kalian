// lib/actions/sto.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdsek } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { StatusPeriode } from "@prisma/client";

const StoInputSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  nim: z.string().min(3, "NIM minimal 3 karakter"),
  emailGoogle: z.string().email("Format email Google tidak valid").toLowerCase(),
  jabatan: z.string().optional().nullable(),
  divisi: z.string().optional().nullable(),
  foto: z.string().optional().nullable(),
});

export async function tambahStoAction(prevState: unknown, formData: FormData) {
  try {
    await requireAdsek(["admin"]);

    const periodeAktif = await prisma.periode.findFirst({
      where: { status: StatusPeriode.aktif },
    });

    if (!periodeAktif) {
      return {
        error: {
          kode: "PERIODE_TIDAK_AKTIF",
          pesan: "Tidak ada periode aktif. Buka periode kepengurusan terlebih dahulu.",
        },
      };
    }

    const rawData = {
      nama: formData.get("nama") as string,
      nim: formData.get("nim") as string,
      emailGoogle: formData.get("emailGoogle") as string,
      jabatan: (formData.get("jabatan") as string) || null,
      divisi: (formData.get("divisi") as string) || null,
      foto: (formData.get("foto") as string) || null,
    };

    const parsed = StoInputSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        error: {
          kode: "VALIDASI_GAGAL",
          pesan: parsed.error.issues[0].message,
        },
      };
    }

    const { nama, nim, emailGoogle, jabatan, divisi, foto } = parsed.data;

    // Cek duplikasi email di tabel STO
    const emailExist = await prisma.sto.findUnique({
      where: { emailGoogle },
    });

    if (emailExist) {
      return {
        error: {
          kode: "EMAIL_SUDAH_TERDAFTAR",
          pesan: `Email ${emailGoogle} sudah terdaftar pada database STO.`,
        },
      };
    }

    await prisma.sto.create({
      data: {
        periodeId: periodeAktif.id,
        nama,
        nim,
        emailGoogle,
        jabatan,
        divisi,
        foto,
      },
    });

    revalidatePath("/dashboard/sto");
    revalidatePath("/dashboard");
    return { sukses: true, pesan: `Pengurus ${nama} berhasil ditambahkan` };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal menambahkan pengurus STO",
      },
    };
  }
}

export async function ubahStoAction(stoId: number, formData: FormData) {
  try {
    await requireAdsek(["admin"]);

    const rawData = {
      nama: formData.get("nama") as string,
      nim: formData.get("nim") as string,
      emailGoogle: formData.get("emailGoogle") as string,
      jabatan: (formData.get("jabatan") as string) || null,
      divisi: (formData.get("divisi") as string) || null,
      foto: (formData.get("foto") as string) || null,
    };

    const parsed = StoInputSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        error: {
          kode: "VALIDASI_GAGAL",
          pesan: parsed.error.issues[0].message,
        },
      };
    }

    const { nama, nim, emailGoogle, jabatan, divisi, foto } = parsed.data;

    // Cek duplikasi email ke id lain
    const emailExist = await prisma.sto.findFirst({
      where: {
        emailGoogle,
        NOT: { id: stoId },
      },
    });

    if (emailExist) {
      return {
        error: {
          kode: "EMAIL_SUDAH_TERDAFTAR",
          pesan: `Email ${emailGoogle} sudah digunakan oleh pengurus lain.`,
        },
      };
    }

    await prisma.sto.update({
      where: { id: stoId },
      data: {
        nama,
        nim,
        emailGoogle,
        jabatan,
        divisi,
        ...(foto ? { foto } : {}),
      },
    });

    revalidatePath("/dashboard/sto");
    return { sukses: true, pesan: `Data pengurus ${nama} berhasil diperbarui` };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal mengubah data STO",
      },
    };
  }
}

export async function hapusStoAction(stoId: number) {
  try {
    await requireAdsek(["admin"]);

    const sto = await prisma.sto.findUnique({
      where: { id: stoId },
      include: {
        _count: {
          select: { kepanitiaan: true, presensi: true },
        },
      },
    });

    if (!sto) {
      return {
        error: {
          kode: "TIDAK_DITEMUKAN",
          pesan: "Data STO tidak ditemukan",
        },
      };
    }

    if (sto._count.presensi > 0) {
      return {
        error: {
          kode: "MEMILIKI_RIWAYAT_PRESENSI",
          pesan: "Pengurus tidak dapat dihapus karena sudah memiliki riwayat presensi",
        },
      };
    }

    // Hapus kepanitiaan terkait terlebih dahulu jika ada
    if (sto._count.kepanitiaan > 0) {
      await prisma.kepanitiaan.deleteMany({
        where: { stoId },
      });
    }

    await prisma.sto.delete({
      where: { id: stoId },
    });

    revalidatePath("/dashboard/sto");
    revalidatePath("/dashboard");
    return { sukses: true, pesan: `Pengurus ${sto.nama} berhasil dihapus` };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal menghapus pengurus STO",
      },
    };
  }
}

export interface CsvBarisSto {
  nama: string;
  nim: string;
  email: string;
  jabatan?: string;
  divisi?: string;
}

export async function imporCsvStoAction(barisList: CsvBarisSto[]) {
  try {
    await requireAdsek(["admin"]);

    const periodeAktif = await prisma.periode.findFirst({
      where: { status: StatusPeriode.aktif },
    });

    if (!periodeAktif) {
      return {
        error: {
          kode: "PERIODE_TIDAK_AKTIF",
          pesan: "Tidak ada periode aktif untuk mengimpor data STO.",
        },
      };
    }

    if (!barisList || barisList.length === 0) {
      return {
        error: {
          kode: "DATA_KOSONG",
          pesan: "Tidak ada baris data yang ditemukan dalam file CSV.",
        },
      };
    }

    // Ambil semua email STO yang sudah ada di database
    const existingStos = await prisma.sto.findMany({
      select: { emailGoogle: true },
    });
    const existingEmailSet = new Set(existingStos.map((s) => s.emailGoogle.toLowerCase()));

    const dataValid: {
      periodeId: number;
      nama: string;
      nim: string;
      emailGoogle: string;
      jabatan: string | null;
      divisi: string | null;
    }[] = [];

    const pesanGagal: string[] = [];
    const seenCsvEmail = new Set<string>();

    for (let i = 0; i < barisList.length; i++) {
      const row = barisList[i];
      const noBaris = i + 2; // Mengingat baris 1 adalah header CSV

      const emailClean = row.email?.trim().toLowerCase();
      const namaClean = row.nama?.trim();
      const nimClean = row.nim?.trim();

      if (!namaClean || !nimClean || !emailClean) {
        pesanGagal.push(`Baris ${noBaris}: Nama, NIM, atau Email kosong.`);
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
        pesanGagal.push(`Baris ${noBaris}: Format email tidak valid (${emailClean}).`);
        continue;
      }

      if (existingEmailSet.has(emailClean)) {
        pesanGagal.push(`Baris ${noBaris}: Email ${emailClean} sudah terdaftar di sistem.`);
        continue;
      }

      if (seenCsvEmail.has(emailClean)) {
        pesanGagal.push(`Baris ${noBaris}: Duplikasi email dalam file CSV (${emailClean}).`);
        continue;
      }

      seenCsvEmail.add(emailClean);
      dataValid.push({
        periodeId: periodeAktif.id,
        nama: namaClean,
        nim: nimClean,
        emailGoogle: emailClean,
        jabatan: row.jabatan?.trim() || null,
        divisi: row.divisi?.trim() || null,
      });
    }

    if (dataValid.length > 0) {
      await prisma.sto.createMany({
        data: dataValid,
      });
    }

    revalidatePath("/dashboard/sto");
    revalidatePath("/dashboard");

    return {
      sukses: true,
      totalDiproses: barisList.length,
      totalBerhasil: dataValid.length,
      totalGagal: pesanGagal.length,
      pesanGagal,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal memproses impor CSV",
      },
    };
  }
}
