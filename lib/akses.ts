// lib/akses.ts
// Aturan tunggal otorisasi hak akses STO terhadap agenda kegiatan (target_peserta)
import { prisma } from "./prisma";
import { TargetPeserta } from "@prisma/client";

export interface BolehAksesResult {
  boleh: boolean;
  alasan?: string;
}

/**
 * Memeriksa apakah seorang STO berhak melihat atau melakukan presensi pada suatu agenda.
 *
 * Aturan target_peserta (PRD 5.3):
 * - semua_panitia_sto : Semua STO pada periode proker tersebut berhak.
 * - semua_panitia     : Harus terdaftar di kepanitiaan proker tersebut (peran apa pun).
 * - hanya_pj_pi       : Harus terdaftar di kepanitiaan proker tersebut DAN peran bukan 'anggota'.
 *
 * @param stoId ID STO dari sesi yang login
 * @param agendaId ID agenda yang akan diakses
 */
export async function bolehAkses(
  stoId: number,
  agendaId: number
): Promise<BolehAksesResult> {
  const agenda = await prisma.agenda.findUnique({
    where: { id: agendaId },
    include: {
      proker: {
        select: {
          id: true,
          periodeId: true,
        },
      },
    },
  });

  if (!agenda) {
    return { boleh: false, alasan: "Agenda tidak ditemukan" };
  }

  // 1. Cek apakah STO berada di periode yang sama dengan proker
  const sto = await prisma.sto.findUnique({
    where: { id: stoId },
    select: { periodeId: true },
  });

  if (!sto || sto.periodeId !== agenda.proker.periodeId) {
    return {
      boleh: false,
      alasan: "Anda tidak terdaftar pada periode kepengurusan agenda ini",
    };
  }

  // Skenario A: target_peserta === semua_panitia_sto
  if (agenda.targetPeserta === TargetPeserta.semua_panitia_sto) {
    return { boleh: true };
  }

  // Cari peran di kepanitiaan untuk proker ini
  const panitia = await prisma.kepanitiaan.findUnique({
    where: {
      prokerId_stoId: {
        prokerId: agenda.proker.id,
        stoId: stoId,
      },
    },
    select: {
      peran: true,
    },
  });

  if (!panitia) {
    return {
      boleh: false,
      alasan: "Agenda ini hanya untuk panitia program kerja tersebut",
    };
  }

  // Skenario B: target_peserta === semua_panitia
  if (agenda.targetPeserta === TargetPeserta.semua_panitia) {
    return { boleh: true };
  }

  // Skenario C: target_peserta === hanya_pj_pi
  if (agenda.targetPeserta === TargetPeserta.hanya_pj_pi) {
    if (panitia.peran === "anggota") {
      return {
        boleh: false,
        alasan: "Agenda ini khusus untuk Koordinator/PJ Divisi dan Pengurus Inti (PI)",
      };
    }
    return { boleh: true };
  }

  return { boleh: false, alasan: "Akses tidak diizinkan" };
}
