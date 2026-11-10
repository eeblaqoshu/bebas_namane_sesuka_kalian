// components/dashboard/proker-detail.tsx
"use client";

import { useState, useTransition } from "react";
import {
  tambahPanitiaAction,
  ubahPanitiaAction,
  hapusPanitiaAction,
} from "@/lib/actions/proker";
import {
  buatAgendaAction,
  ubahAgendaAction,
  hapusAgendaAction,
} from "@/lib/actions/agenda";
import { PeranPanitia, JenisAgenda, TargetPeserta, StatusPeriode } from "@prisma/client";
import {
  Users,
  Calendar,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  Shield,
  QrCode,
} from "lucide-react";
import Link from "next/link";

interface PanitiaItem {
  id: number;
  peran: PeranPanitia;
  divisiPanitia: string | null;
  sto: {
    id: number;
    nama: string;
    nim: string;
    emailGoogle: string;
    jabatan: string | null;
    divisi: string | null;
  };
}

interface AgendaItem {
  id: number;
  jenis: JenisAgenda;
  judul: string;
  urutan: number;
  tglPelaksanaan: Date;
  waktuPelaksanaan: Date;
  lokasiNama: string | null;
  targetPeserta: TargetPeserta;
  sesi: {
    id: number;
    durasiMenit: number;
    bukaAt: Date;
    tutupAt: Date;
  }[];
}

interface StoOption {
  id: number;
  nama: string;
  nim: string;
  divisi: string | null;
}

export function ProkerDetail({
  proker,
  availableStos,
}: {
  proker: {
    id: number;
    nama: string;
    deskripsi: string | null;
    periode: {
      id: number;
      nama: string;
      status: StatusPeriode;
    };
    kepanitiaan: PanitiaItem[];
    agenda: AgendaItem[];
  };
  availableStos: StoOption[];
}) {
  const [tabAktif, setTabAktif] = useState<"panitia" | "agenda">("panitia");
  const [isPending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "error"; teks: string } | null>(null);

  const isReadonly = proker.periode.status === StatusPeriode.selesai;

  // ─────────────────────────────────────────────
  // MODAL PANITIA STATE
  // ─────────────────────────────────────────────
  const [modalPanitiaBuka, setModalPanitiaBuka] = useState(false);
  const [modalEditPanitiaBuka, setModalEditPanitiaBuka] = useState(false);
  const [panitiaDiedit, setPanitiaDiedit] = useState<PanitiaItem | null>(null);

  const [pilihanStoId, setPilihanStoId] = useState<string>("");
  const [peranPanitia, setPeranPanitia] = useState<PeranPanitia>(PeranPanitia.anggota);
  const [divisiPanitia, setDivisiPanitia] = useState("");

  // ─────────────────────────────────────────────
  // MODAL AGENDA STATE
  // ─────────────────────────────────────────────
  const [modalAgendaBuka, setModalAgendaBuka] = useState(false);
  const [modalEditAgendaBuka, setModalEditAgendaBuka] = useState(false);
  const [agendaDiedit, setAgendaDiedit] = useState<AgendaItem | null>(null);

  const [judulAgenda, setJudulAgenda] = useState("");
  const [jenisAgenda, setJenisAgenda] = useState<JenisAgenda>(JenisAgenda.rapat_besar);
  const [urutanAgenda, setUrutanAgenda] = useState<number>(1);
  const [tglAgenda, setTglAgenda] = useState("");
  const [waktuAgenda, setWaktuAgenda] = useState("15:00");
  const [lokasiAgenda, setLokasiAgenda] = useState("");
  const [targetPeserta, setTargetPeserta] = useState<TargetPeserta>(TargetPeserta.semua_panitia);

  // ─────────────────────────────────────────────
  // FILTER STO YANG BELUM TERDAFTAR DI PROKER
  // ─────────────────────────────────────────────
  const panitiaStoIdSet = new Set(proker.kepanitiaan.map((k) => k.sto.id));
  const stoBelumMasuk = availableStos.filter((s) => !panitiaStoIdSet.has(s.id));

  // Handler Panitia
  const handleSubmitTambahPanitia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilihanStoId) return;
    setPesan(null);

    const formData = new FormData();
    formData.append("prokerId", proker.id.toString());
    formData.append("stoId", pilihanStoId);
    formData.append("peran", peranPanitia);
    formData.append("divisiPanitia", divisiPanitia);

    startTransition(async () => {
      const res = await tambahPanitiaAction(formData);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
        setModalPanitiaBuka(false);
        setPilihanStoId("");
        setDivisiPanitia("");
      }
    });
  };

  const handleOpenEditPanitia = (item: PanitiaItem) => {
    setPanitiaDiedit(item);
    setPeranPanitia(item.peran);
    setDivisiPanitia(item.divisiPanitia || "");
    setModalEditPanitiaBuka(true);
  };

  const handleSubmitEditPanitia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panitiaDiedit) return;
    setPesan(null);

    const formData = new FormData();
    formData.append("peran", peranPanitia);
    formData.append("divisiPanitia", divisiPanitia);

    startTransition(async () => {
      const res = await ubahPanitiaAction(panitiaDiedit.id, formData);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
        setModalEditPanitiaBuka(false);
      }
    });
  };

  const handleHapusPanitia = (kepanitiaanId: number, namaSto: string) => {
    if (!confirm(`Hapus "${namaSto}" dari kepanitiaan proker ini?`)) return;

    startTransition(async () => {
      const res = await hapusPanitiaAction(kepanitiaanId);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
      }
    });
  };

  // Handler Agenda
  const resetFormAgenda = () => {
    setJudulAgenda("");
    setJenisAgenda(JenisAgenda.rapat_besar);
    setUrutanAgenda(proker.agenda.length + 1);
    setTglAgenda("");
    setWaktuAgenda("15:00");
    setLokasiAgenda("");
    setTargetPeserta(TargetPeserta.semua_panitia);
    setAgendaDiedit(null);
  };

  const handleSubmitTambahAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(null);

    const formData = new FormData();
    formData.append("prokerId", proker.id.toString());
    formData.append("judul", judulAgenda);
    formData.append("jenis", jenisAgenda);
    formData.append("urutan", urutanAgenda.toString());
    formData.append("tglPelaksanaan", tglAgenda);
    formData.append("waktuPelaksanaan", waktuAgenda);
    formData.append("lokasiNama", lokasiAgenda);
    formData.append("targetPeserta", targetPeserta);

    startTransition(async () => {
      const res = await buatAgendaAction(null, formData);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
        setModalAgendaBuka(false);
        resetFormAgenda();
      }
    });
  };

  const handleOpenEditAgenda = (item: AgendaItem) => {
    setAgendaDiedit(item);
    setJudulAgenda(item.judul);
    setJenisAgenda(item.jenis);
    setUrutanAgenda(item.urutan);

    const tgl = new Date(item.tglPelaksanaan).toISOString().split("T")[0];
    setTglAgenda(tgl);

    const jam = new Date(item.waktuPelaksanaan).getUTCHours().toString().padStart(2, "0");
    const menit = new Date(item.waktuPelaksanaan).getUTCMinutes().toString().padStart(2, "0");
    setWaktuAgenda(`${jam}:${menit}`);

    setLokasiAgenda(item.lokasiNama || "");
    setTargetPeserta(item.targetPeserta);
    setModalEditAgendaBuka(true);
  };

  const handleSubmitEditAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaDiedit) return;
    setPesan(null);

    const formData = new FormData();
    formData.append("judul", judulAgenda);
    formData.append("jenis", jenisAgenda);
    formData.append("urutan", urutanAgenda.toString());
    formData.append("tglPelaksanaan", tglAgenda);
    formData.append("waktuPelaksanaan", waktuAgenda);
    formData.append("lokasiNama", lokasiAgenda);
    formData.append("targetPeserta", targetPeserta);

    startTransition(async () => {
      const res = await ubahAgendaAction(agendaDiedit.id, formData);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
        setModalEditAgendaBuka(false);
        resetFormAgenda();
      }
    });
  };

  const handleHapusAgenda = (agendaId: number, judul: string) => {
    if (!confirm(`Hapus agenda "${judul}"?`)) return;

    startTransition(async () => {
      const res = await hapusAgendaAction(agendaId);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
      }
    });
  };

  // Label Helper
  const getPeranBadge = (peran: PeranPanitia) => {
    switch (peran) {
      case PeranPanitia.ketua:
        return { label: "Ketua Pelaksana", bg: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800" };
      case PeranPanitia.sekretaris:
        return { label: "Sekretaris", bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
      case PeranPanitia.bendahara:
        return { label: "Bendahara", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
      case PeranPanitia.pj_divisi:
        return { label: "PJ Divisi", bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800" };
      default:
        return { label: "Anggota", bg: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700" };
    }
  };

  const getJenisAgendaBadge = (jenis: JenisAgenda) => {
    switch (jenis) {
      case JenisAgenda.rapat_pj:
        return { label: "Rapat PJ & PI", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50" };
      case JenisAgenda.rapat_besar:
        return { label: "Rapat Besar", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" };
      case JenisAgenda.rapat_koordinasi:
        return { label: "Rapat Koordinasi", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" };
      case JenisAgenda.hari_h:
        return { label: "Hari H Pelaksanaan", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50" };
    }
  };

  const getTargetPesertaLabel = (target: TargetPeserta) => {
    switch (target) {
      case TargetPeserta.hanya_pj_pi:
        return "Khusus PJ & PI";
      case TargetPeserta.semua_panitia:
        return "Semua Panitia Proker";
      case TargetPeserta.semua_panitia_sto:
        return "Semua STO Satu Periode";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div>
        <Link
          href="/dashboard/proker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Proker
        </Link>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  !isReadonly
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {!isReadonly ? "Periode Aktif" : "Periode Selesai (Read-Only)"}
              </span>
              <span className="text-xs text-zinc-400">• {proker.periode.nama}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {proker.nama}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
              {proker.deskripsi || "Tidak ada deskripsi rinci untuk proker ini."}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-3 sm:pt-0 sm:pl-6">
            <div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {proker.kepanitiaan.length}
              </div>
              <div className="text-[11px] text-zinc-400">Total Panitia</div>
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {proker.agenda.length}
              </div>
              <div className="text-[11px] text-zinc-400">Agenda Kegiatan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {pesan && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            pesan.tipe === "sukses"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          {pesan.tipe === "sukses" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{pesan.teks}</div>
          <button
            onClick={() => setPesan(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTabAktif("panitia")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              tabAktif === "panitia"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Susunan Kepanitiaan ({proker.kepanitiaan.length})
          </button>
          <button
            onClick={() => setTabAktif("agenda")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              tabAktif === "agenda"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Agenda Kegiatan ({proker.agenda.length})
          </button>
        </div>

        {!isReadonly && (
          <div>
            {tabAktif === "panitia" ? (
              <button
                onClick={() => {
                  setPilihanStoId("");
                  setPeranPanitia(PeranPanitia.anggota);
                  setDivisiPanitia("");
                  setModalPanitiaBuka(true);
                }}
                disabled={stoBelumMasuk.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Panitia
              </button>
            ) : (
              <button
                onClick={() => {
                  resetFormAgenda();
                  setModalAgendaBuka(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Agenda
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          TAB 1: KEPANITIAAN CONTENT
      ───────────────────────────────────────────── */}
      {tabAktif === "panitia" && (
        <div className="space-y-4">
          {proker.kepanitiaan.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <Users className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Belum ada susunan panitia untuk proker ini
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Tambahkan pengurus STO ke dalam kepanitiaan melalui tombol &quot;Tambah Panitia&quot;.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-3.5">Nama & NIM Pengurus</th>
                      <th className="px-6 py-3.5">Peran Kepanitiaan</th>
                      <th className="px-6 py-3.5">Divisi Panitia</th>
                      <th className="px-6 py-3.5">Asal Divisi STO</th>
                      {!isReadonly && <th className="px-6 py-3.5 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {proker.kepanitiaan.map((item) => {
                      const badge = getPeranBadge(item.peran);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {item.sto.nama.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {item.sto.nama}
                                </div>
                                <div className="text-[11px] text-zinc-500">
                                  {item.sto.nim} • {item.sto.emailGoogle}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                            {item.divisiPanitia || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                            {item.sto.divisi || "Umum"}
                          </td>
                          {!isReadonly && (
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditPanitia(item)}
                                  title="Ubah Peran Panitia"
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleHapusPanitia(item.id, item.sto.nama)}
                                  disabled={isPending}
                                  title="Hapus dari Panitia"
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          TAB 2: AGENDA KEGIATAN CONTENT
      ───────────────────────────────────────────── */}
      {tabAktif === "agenda" && (
        <div className="space-y-4">
          {proker.agenda.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <Calendar className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Belum ada agenda untuk proker ini
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Klik tombol &quot;Tambah Agenda&quot; untuk membuat jadwal rapat atau hari H kegiatan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proker.agenda.map((item) => {
                const jenisBadge = getJenisAgendaBadge(item.jenis);
                const targetText = getTargetPesertaLabel(item.targetPeserta);
                const tglStr = new Date(item.tglPelaksanaan).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                const jamStr = `${new Date(item.waktuPelaksanaan)
                  .getUTCHours()
                  .toString()
                  .padStart(2, "0")}:${new Date(item.waktuPelaksanaan)
                  .getUTCMinutes()
                  .toString()
                  .padStart(2, "0")} WIB`;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${jenisBadge.color}`}
                        >
                          {jenisBadge.label}
                        </span>

                        {!isReadonly && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditAgenda(item)}
                              title="Edit Agenda"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleHapusAgenda(item.id, item.judul)}
                              disabled={isPending}
                              title="Hapus Agenda"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                        {item.judul}
                      </h3>

                      <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>
                            {tglStr} • {jamStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{item.lokasiNama || "Lokasi belum ditentukan"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>
                            Target Peserta: <strong className="text-zinc-800 dark:text-zinc-200">{targetText}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sesi Presensi Status / Quick Action */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div className="text-zinc-500">
                        {item.sesi.length > 0 ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {item.sesi.length} Sesi Presensi
                          </span>
                        ) : (
                          <span className="text-zinc-400">Belum ada sesi presensi</span>
                        )}
                      </div>

                      {item.sesi.length > 0 && (
                        <Link
                          href={`/dashboard/presensi/${item.sesi[0].id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-[11px] font-semibold transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Buka Layar Sesi
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL TAMBAH PANITIA
      ───────────────────────────────────────────── */}
      {modalPanitiaBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Tambah Panitia ke Proker
              </h3>
              <button
                onClick={() => setModalPanitiaBuka(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTambahPanitia} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Pilih Pengurus STO
                </label>
                <select
                  required
                  value={pilihanStoId}
                  onChange={(e) => setPilihanStoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Pengurus --</option>
                  {stoBelumMasuk.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nim}) - {s.divisi || "Umum"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Peran Panitia
                </label>
                <select
                  value={peranPanitia}
                  onChange={(e) => setPeranPanitia(e.target.value as PeranPanitia)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="Pimpinan Inti (PI)">
                    <option value={PeranPanitia.ketua}>Ketua Pelaksana</option>
                    <option value={PeranPanitia.sekretaris}>Sekretaris</option>
                    <option value={PeranPanitia.bendahara}>Bendahara</option>
                  </optgroup>
                  <optgroup label="Penanggung Jawab (PJ)">
                    <option value={PeranPanitia.pj_divisi}>PJ Divisi</option>
                  </optgroup>
                  <optgroup label="Anggota">
                    <option value={PeranPanitia.anggota}>Anggota Panitia</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Divisi Panitia (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Divisi Acara, Humas, Konsumsi"
                  value={divisiPanitia}
                  onChange={(e) => setDivisiPanitia(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalPanitiaBuka(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60 shadow-md shadow-blue-500/20"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Panitia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL EDIT PANITIA
      ───────────────────────────────────────────── */}
      {modalEditPanitiaBuka && panitiaDiedit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Ubah Peran Panitia ({panitiaDiedit.sto.nama})
              </h3>
              <button
                onClick={() => setModalEditPanitiaBuka(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditPanitia} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Peran Panitia
                </label>
                <select
                  value={peranPanitia}
                  onChange={(e) => setPeranPanitia(e.target.value as PeranPanitia)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="Pimpinan Inti (PI)">
                    <option value={PeranPanitia.ketua}>Ketua Pelaksana</option>
                    <option value={PeranPanitia.sekretaris}>Sekretaris</option>
                    <option value={PeranPanitia.bendahara}>Bendahara</option>
                  </optgroup>
                  <optgroup label="Penanggung Jawab (PJ)">
                    <option value={PeranPanitia.pj_divisi}>PJ Divisi</option>
                  </optgroup>
                  <optgroup label="Anggota">
                    <option value={PeranPanitia.anggota}>Anggota Panitia</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Divisi Panitia (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Divisi Acara, Humas, Konsumsi"
                  value={divisiPanitia}
                  onChange={(e) => setDivisiPanitia(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEditPanitiaBuka(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60 shadow-md shadow-blue-500/20"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL TAMBAH / EDIT AGENDA
      ───────────────────────────────────────────── */}
      {(modalAgendaBuka || modalEditAgendaBuka) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {modalAgendaBuka ? "Tambah Agenda Kegiatan Baru" : "Edit Agenda Kegiatan"}
              </h3>
              <button
                onClick={() => {
                  setModalAgendaBuka(false);
                  setModalEditAgendaBuka(false);
                  resetFormAgenda();
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={modalAgendaBuka ? handleSubmitTambahAgenda : handleSubmitEditAgenda}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Judul Agenda
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Pleno 1 Persiapan Lomba"
                  value={judulAgenda}
                  onChange={(e) => setJudulAgenda(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Jenis Agenda
                  </label>
                  <select
                    value={jenisAgenda}
                    onChange={(e) => setJenisAgenda(e.target.value as JenisAgenda)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={JenisAgenda.rapat_pj}>Rapat PJ & PI</option>
                    <option value={JenisAgenda.rapat_besar}>Rapat Besar</option>
                    <option value={JenisAgenda.rapat_koordinasi}>Rapat Koordinasi</option>
                    <option value={JenisAgenda.hari_h}>Hari H Pelaksanaan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Urutan Agenda
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={urutanAgenda}
                    onChange={(e) => setUrutanAgenda(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    required
                    value={tglAgenda}
                    onChange={(e) => setTglAgenda(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Jam Mulai (WIB)
                  </label>
                  <input
                    type="time"
                    required
                    value={waktuAgenda}
                    onChange={(e) => setWaktuAgenda(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Peserta (Akses Presensi)
                </label>
                <select
                  value={targetPeserta}
                  onChange={(e) => setTargetPeserta(e.target.value as TargetPeserta)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={TargetPeserta.hanya_pj_pi}>
                    hanya_pj_pi (Hanya Panitia berstatus PJ dan PI)
                  </option>
                  <option value={TargetPeserta.semua_panitia}>
                    semua_panitia (Seluruh panitia terdaftar di proker ini)
                  </option>
                  <option value={TargetPeserta.semua_panitia_sto}>
                    semua_panitia_sto (Semua anggota STO satu periode)
                  </option>
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Aturan akses ini menentukan siapa saja yang dapat melihat agenda ini di /home dan melakukan scan presensi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Lokasi Pertemuan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang Sidang Utama Lt. 2 / Google Meet"
                  value={lokasiAgenda}
                  onChange={(e) => setLokasiAgenda(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalAgendaBuka(false);
                    setModalEditAgendaBuka(false);
                    resetFormAgenda();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60 shadow-md shadow-blue-500/20"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
