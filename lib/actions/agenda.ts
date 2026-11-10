// lib/actions/agenda.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdsek } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { StatusPeriode, JenisAgenda, TargetPeserta } from "@prisma/client";

const AgendaInputSchema = z.object({
  prokerId: z.coerce.number(),
  jenis: z.nativeEnum(JenisAgenda),
  judul: z.string().min(3, "Judul agenda minimal 3 karakter"),
  urutan: z.coerce.number().default(1),
  tglPelaksanaan: z.string().min(1, "Tanggal pelaksanaan wajib diisi"),
  waktuPelaksanaan: z.string().min(1, "Waktu pelaksanaan wajib diisi"),
  lokasiNama: z.string().optional().nullable(),
  targetPeserta: z.nativeEnum(TargetPeserta),
});

export async function buatAgendaAction(prevState: unknown, formData: FormData) {
  try {
    const adsek = await requireAdsek();

    const rawData = {
      prokerId: formData.get("prokerId"),
      jenis: formData.get("jenis"),
      judul: formData.get("judul"),
      urutan: formData.get("urutan") || 1,
      tglPelaksanaan: formData.get("tglPelaksanaan"),
      waktuPelaksanaan: formData.get("waktuPelaksanaan"),
      lokasiNama: (formData.get("lokasiNama") as string) || null,
      targetPeserta: formData.get("targetPeserta"),
    };

    const parsed = AgendaInputSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        error: {
          kode: "VALIDASI_GAGAL",
          pesan: parsed.error.issues[0].message,
        },
      };
    }

    const {
      prokerId,
      jenis,
      judul,
      urutan,
      tglPelaksanaan,
      waktuPelaksanaan,
      lokasiNama,
      targetPeserta,
    } = parsed.data;

    // Cek proker dan status periode
    const proker = await prisma.proker.findUnique({
      where: { id: prokerId },
      include: { periode: true },
    });

    if (!proker || proker.periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "PERIODE_READ_ONLY",
          pesan: "Tidak dapat menambah agenda pada periode kepengurusan yang sudah selesai",
        },
      };
    }

    // Parsing Date & Time
    const tglDate = new Date(tglPelaksanaan);

    // Format waktu ke dummy Date 1970-01-01T...Z untuk kolom @db.Time(0)
    const [jam, menit] = waktuPelaksanaan.split(":");
    const waktuDate = new Date(
      `1970-01-01T${jam.padStart(2, "0")}:${menit.padStart(2, "0")}:00Z`
    );

    await prisma.agenda.create({
      data: {
        prokerId,
        jenis,
        judul,
        urutan,
        tglPelaksanaan: tglDate,
        waktuPelaksanaan: waktuDate,
        lokasiNama,
        targetPeserta,
        dibuatOleh: adsek.id,
      },
    });

    revalidatePath(`/dashboard/proker/${prokerId}`);
    return { sukses: true, pesan: "Agenda kegiatan berhasil ditambahkan" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal membuat agenda kegiatan",
      },
    };
  }
}

export async function ubahAgendaAction(agendaId: number, formData: FormData) {
  try {
    await requireAdsek();

    const agenda = await prisma.agenda.findUnique({
      where: { id: agendaId },
      include: { proker: { include: { periode: true } } },
    });

    if (!agenda || agenda.proker.periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "PERIODE_READ_ONLY",
          pesan: "Tidak dapat mengubah agenda pada periode yang sudah selesai",
        },
      };
    }

    const rawData = {
      prokerId: agenda.prokerId,
      jenis: formData.get("jenis"),
      judul: formData.get("judul"),
      urutan: formData.get("urutan") || agenda.urutan,
      tglPelaksanaan: formData.get("tglPelaksanaan"),
      waktuPelaksanaan: formData.get("waktuPelaksanaan"),
      lokasiNama: (formData.get("lokasiNama") as string) || null,
      targetPeserta: formData.get("targetPeserta"),
    };

    const parsed = AgendaInputSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        error: {
          kode: "VALIDASI_GAGAL",
          pesan: parsed.error.issues[0].message,
        },
      };
    }

    const {
      jenis,
      judul,
      urutan,
      tglPelaksanaan,
      waktuPelaksanaan,
      lokasiNama,
      targetPeserta,
    } = parsed.data;

    const tglDate = new Date(tglPelaksanaan);
    const [jam, menit] = waktuPelaksanaan.split(":");
    const waktuDate = new Date(
      `1970-01-01T${jam.padStart(2, "0")}:${menit.padStart(2, "0")}:00Z`
    );

    await prisma.agenda.update({
      where: { id: agendaId },
      data: {
        jenis,
        judul,
        urutan,
        tglPelaksanaan: tglDate,
        waktuPelaksanaan: waktuDate,
        lokasiNama,
        targetPeserta,
      },
    });

    revalidatePath(`/dashboard/proker/${agenda.prokerId}`);
    return { sukses: true, pesan: "Agenda kegiatan berhasil diperbarui" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal mengubah agenda",
      },
    };
  }
}

export async function hapusAgendaAction(agendaId: number) {
  try {
    await requireAdsek();

    const agenda = await prisma.agenda.findUnique({
      where: { id: agendaId },
      include: {
        proker: { include: { periode: true } },
        sesi: { include: { _count: { select: { presensi: true } } } },
      },
    });

    if (!agenda || agenda.proker.periode.status === StatusPeriode.selesai) {
      return {
        error: {
          kode: "PERIODE_READ_ONLY",
          pesan: "Tidak dapat menghapus agenda pada periode selesai",
        },
      };
    }

    // Periksa apakah sesi presensi ada riwayat scan
    const hasPresensi = agenda.sesi.some((s) => s._count.presensi > 0);
    if (hasPresensi) {
      return {
        error: {
          kode: "MEMILIKI_RIWAYAT_PRESENSI",
          pesan: "Agenda tidak dapat dihapus karena sudah memiliki rekaman presensi peserta",
        },
      };
    }

    await prisma.$transaction(async (tx) => {
      // Hapus sesi presensi kosong jika ada
      await tx.sesiPresensi.deleteMany({ where: { agendaId } });
      await tx.agenda.delete({ where: { id: agendaId } });
    });

    revalidatePath(`/dashboard/proker/${agenda.prokerId}`);
    return { sukses: true, pesan: "Agenda berhasil dihapus" };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      error: {
        kode: "SERVER_ERROR",
        pesan: error.message || "Gagal menghapus agenda",
      },
    };
  }
}
