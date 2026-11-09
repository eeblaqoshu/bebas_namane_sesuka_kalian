// prisma/seed.ts
// Data simulasi awal untuk pengujian lokal sesuai PRD
import {
  PrismaClient,
  StatusPeriode,
  RoleAdsek,
  PeranPanitia,
  JenisAgenda,
  TargetPeserta,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data simulasi...");

  // 1. Bersihkan database terlebih dahulu (urutan penghapusan sesuai relasi)
  await prisma.presensi.deleteMany();
  await prisma.sesiPresensi.deleteMany();
  await prisma.agenda.deleteMany();
  await prisma.kepanitiaan.deleteMany();
  await prisma.proker.deleteMany();
  await prisma.sto.deleteMany();
  await prisma.akunAdsek.deleteMany();
  await prisma.periode.deleteMany();

  // 2. Buat Periode Aktif
  const periode = await prisma.periode.create({
    data: {
      nama: "Periode Kepengurusan 2026/2027",
      tglMulai: new Date("2026-01-01"),
      tglSelesai: new Date("2026-12-31"),
      status: StatusPeriode.aktif,
    },
  });
  console.log(`✅ Periode dibuat: ${periode.nama}`);

  // 3. Buat Akun Adsek
  const adminUser = await prisma.akunAdsek.create({
    data: {
      nama: "Admin Utama PCC",
      email: "admin@pcc.polines.ac.id",
      role: RoleAdsek.admin,
    },
  });

  const sekumUser = await prisma.akunAdsek.create({
    data: {
      nama: "Sekretaris Umum",
      email: "sekum@pcc.polines.ac.id",
      role: RoleAdsek.sekretaris_umum,
    },
  });

  console.log("✅ Akun Adsek dibuat (admin & sekum)");

  // 4. Buat Data STO (Pengurus Organisasi)
  const sto1 = await prisma.sto.create({
    data: {
      periodeId: periode.id,
      nama: "Muhammad Albi",
      nim: "3.34.22.0.01",
      emailGoogle: "albi@student.polines.ac.id",
      jabatan: "Ketua Umum",
      divisi: "Pengurus Harian",
    },
  });

  const sto2 = await prisma.sto.create({
    data: {
      periodeId: periode.id,
      nama: "Budi Santoso",
      nim: "3.34.22.0.02",
      emailGoogle: "budi@student.polines.ac.id",
      jabatan: "Koordinator Divisi Web Development",
      divisi: "Web Development",
    },
  });

  const sto3 = await prisma.sto.create({
    data: {
      periodeId: periode.id,
      nama: "Citra Lestari",
      nim: "3.34.22.0.03",
      emailGoogle: "citra@student.polines.ac.id",
      jabatan: "Staff Hubungan Masyarakat",
      divisi: "Humas",
    },
  });

  console.log("✅ 3 Anggota STO dibuat");

  // 5. Buat Proker
  const proker = await prisma.proker.create({
    data: {
      periodeId: periode.id,
      nama: "PCC National IT Festival 2026",
      deskripsi: "Seminar dan Lomba Teknologi Nasional tahunan UKM PCC",
      dibuatOleh: adminUser.id,
    },
  });

  console.log(`✅ Proker dibuat: ${proker.nama}`);

  // 6. Buat Kepanitiaan Proker
  // sto1 -> Ketua Pelaksana (PI)
  await prisma.kepanitiaan.create({
    data: {
      prokerId: proker.id,
      stoId: sto1.id,
      peran: PeranPanitia.ketua,
      divisiPanitia: "Panitia Inti",
    },
  });

  // sto2 -> PJ Acara (PJ)
  await prisma.kepanitiaan.create({
    data: {
      prokerId: proker.id,
      stoId: sto2.id,
      peran: PeranPanitia.pj_divisi,
      divisiPanitia: "Divisi Acara",
    },
  });

  // sto3 -> Anggota Konsumsi (bukan PJ/PI)
  await prisma.kepanitiaan.create({
    data: {
      prokerId: proker.id,
      stoId: sto3.id,
      peran: PeranPanitia.anggota,
      divisiPanitia: "Divisi Konsumsi",
    },
  });

  console.log("✅ Kepanitiaan proker dibuat (Ketua, PJ, Anggota)");

  // 7. Buat Agenda-Agenda dengan variasi Target Peserta
  // Agenda 1: Rapat PJ & PI (hanya_pj_pi)
  await prisma.agenda.create({
    data: {
      prokerId: proker.id,
      jenis: JenisAgenda.rapat_pj,
      judul: "Rapat Koordinasi PJ & Pengurus Inti",
      urutan: 1,
      tglPelaksanaan: new Date("2026-11-10"),
      waktuPelaksanaan: new Date("1970-01-01T15:00:00Z"),
      lokasiNama: "Ruang Rapat UKM PCC Polines",
      targetPeserta: TargetPeserta.hanya_pj_pi,
      dibuatOleh: sekumUser.id,
    },
  });

  // Agenda 2: Rapat Besar Panitia (semua_panitia)
  await prisma.agenda.create({
    data: {
      prokerId: proker.id,
      jenis: JenisAgenda.rapat_besar,
      judul: "Rapat Pleno 1 Seluruh Panitia",
      urutan: 2,
      tglPelaksanaan: new Date("2026-11-15"),
      waktuPelaksanaan: new Date("1970-01-01T16:30:00Z"),
      lokasiNama: "Gedung Serbaguna Polines",
      targetPeserta: TargetPeserta.semua_panitia,
      dibuatOleh: sekumUser.id,
    },
  });

  // Agenda 3: Hari H Pelaksanaan (semua_panitia_sto)
  await prisma.agenda.create({
    data: {
      prokerId: proker.id,
      jenis: JenisAgenda.hari_h,
      judul: "Hari-H National IT Festival",
      urutan: 3,
      tglPelaksanaan: new Date("2026-11-20"),
      waktuPelaksanaan: new Date("1970-01-01T08:00:00Z"),
      lokasiNama: "Auditorium Polines",
      targetPeserta: TargetPeserta.semua_panitia_sto,
      dibuatOleh: adminUser.id,
    },
  });

  console.log("✅ 3 Agenda dibuat dengan target_peserta berbeda");
  console.log("🎉 Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
