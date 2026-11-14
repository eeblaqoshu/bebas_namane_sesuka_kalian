// components/dashboard/proker-detail.tsx
"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        return { label: "Ketua Pelaksana", bg: "bg-primary text-white border-primary" };
      case PeranPanitia.sekretaris:
        return { label: "Sekretaris", bg: "bg-secondary/10 text-secondary border-secondary/30" };
      case PeranPanitia.bendahara:
        return { label: "Bendahara", bg: "bg-highlight/15 text-[#B45309] border-highlight/40" };
      case PeranPanitia.pj_divisi:
        return { label: "PJ Divisi", bg: "bg-accent/20 text-primary border-accent/40" };
      default:
        return { label: "Anggota", bg: "bg-surface text-slate-muted border-[#E2E8F0]" };
    }
  };

  const getJenisAgendaBadge = (jenis: JenisAgenda) => {
    switch (jenis) {
      case JenisAgenda.rapat_pj:
        return { label: "Rapat PJ & PI", color: "text-primary bg-primary/10 border border-primary/20" };
      case JenisAgenda.rapat_besar:
        return { label: "Rapat Besar", color: "text-secondary bg-secondary/10 border border-secondary/20" };
      case JenisAgenda.rapat_koordinasi:
        return { label: "Rapat Koordinasi", color: "text-primary bg-accent/20 border border-accent/30" };
      case JenisAgenda.hari_h:
        return { label: "Hari H Pelaksanaan", color: "text-[#B45309] bg-highlight/20 border border-highlight/30" };
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-muted hover:text-navy mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-secondary" />
          Kembali ke Daftar Proker
        </Link>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  !isReadonly
                    ? "bg-accent/20 text-primary border border-accent/30"
                    : "bg-[#E2E8F0] text-slate-muted"
                }`}
              >
                {!isReadonly ? "Periode Aktif" : "Periode Selesai (Read-Only)"}
              </span>
              <span className="text-xs text-slate-muted">• {proker.periode.nama}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary">
              {proker.nama}
            </h2>
            <p className="text-xs text-slate-muted mt-1 max-w-2xl">
              {proker.deskripsi || "Tidak ada deskripsi rinci untuk proker ini."}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-navy border-t sm:border-t-0 sm:border-l border-[#E2E8F0] pt-3 sm:pt-0 sm:pl-6">
            <div>
              <div className="text-lg font-bold text-primary">
                {proker.kepanitiaan.length}
              </div>
              <div className="text-[11px] text-slate-muted">Total Panitia</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {proker.agenda.length}
              </div>
              <div className="text-[11px] text-slate-muted">Agenda Kegiatan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {pesan && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            pesan.tipe === "sukses"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
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
            className="text-slate-muted hover:text-navy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTabAktif("panitia")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              tabAktif === "panitia"
                ? "border-secondary text-secondary"
                : "border-transparent text-slate-muted hover:text-navy"
            }`}
          >
            <Users className="w-4 h-4" />
            Susunan Kepanitiaan ({proker.kepanitiaan.length})
          </button>
          <button
            onClick={() => setTabAktif("agenda")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              tabAktif === "agenda"
                ? "border-secondary text-secondary"
                : "border-transparent text-slate-muted hover:text-navy"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-primary disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold shadow-sm transition-all"
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
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white">
              <Users className="w-10 h-10 text-slate-muted mx-auto mb-3" />
              <p className="text-sm font-semibold text-navy">
                Belum ada susunan panitia untuk proker ini
              </p>
              <p className="text-xs text-slate-muted mt-1">
                Tambahkan pengurus STO ke dalam kepanitiaan melalui tombol &quot;Tambah Panitia&quot;.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-slate-muted uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-6 py-3.5">Nama & NIM Pengurus</th>
                      <th className="px-6 py-3.5">Peran Kepanitiaan</th>
                      <th className="px-6 py-3.5">Divisi Panitia</th>
                      <th className="px-6 py-3.5">Asal Divisi STO</th>
                      {!isReadonly && <th className="px-6 py-3.5 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {proker.kepanitiaan.map((item) => {
                      const badge = getPeranBadge(item.peran);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-surface/70 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                {item.sto.nama.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-navy">
                                  {item.sto.nama}
                                </div>
                                <div className="text-[11px] text-slate-muted">
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
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-navy">
                            {item.divisiPanitia || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-muted">
                            {item.sto.divisi || "Umum"}
                          </td>
                          {!isReadonly && (
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditPanitia(item)}
                                  title="Ubah Peran Panitia"
                                  className="p-1.5 rounded-lg text-slate-muted hover:text-secondary hover:bg-secondary/10 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleHapusPanitia(item.id, item.sto.nama)}
                                  disabled={isPending}
                                  title="Hapus dari Panitia"
                                  className="p-1.5 rounded-lg text-slate-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white">
              <Calendar className="w-10 h-10 text-slate-muted mx-auto mb-3" />
              <p className="text-sm font-semibold text-navy">
                Belum ada agenda untuk proker ini
              </p>
              <p className="text-xs text-slate-muted mt-1">
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
                    className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:border-secondary hover:shadow-md transition-all"
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
                              className="p-1.5 rounded-lg text-slate-muted hover:text-secondary hover:bg-secondary/10 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleHapusAgenda(item.id, item.judul)}
                              disabled={isPending}
                              title="Hapus Agenda"
                              className="p-1.5 rounded-lg text-slate-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-primary mb-2">
                        {item.judul}
                      </h3>

                      <div className="space-y-1.5 text-xs text-navy">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <span>
                            {tglStr} • {jamStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="text-slate-muted">{item.lokasiNama || "Lokasi belum ditentukan"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>
                            Target Peserta: <strong className="text-primary">{targetText}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sesi Presensi Status / Quick Action */}
                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                      <div>
                        {item.sesi.length > 0 ? (
                          <span className="text-secondary font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-accent" />
                            {item.sesi.length} Sesi Presensi
                          </span>
                        ) : (
                          <span className="text-slate-muted">Belum ada sesi presensi</span>
                        )}
                      </div>

                      {item.sesi.length > 0 && (
                        <Link
                          href={`/dashboard/presensi/${item.sesi[0].id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary text-[11px] font-semibold transition-colors"
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
      <AnimatePresence>
        {modalPanitiaBuka && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setModalPanitiaBuka(false)}
              className="fixed inset-0 bg-navy/50 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 360 }}
              className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">
                  Tambah Panitia ke Proker
                </h3>
                <button
                  onClick={() => setModalPanitiaBuka(false)}
                  className="text-slate-muted hover:text-navy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitTambahPanitia} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Pilih Pengurus STO
                  </label>
                  <select
                    required
                    value={pilihanStoId}
                    onChange={(e) => setPilihanStoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
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
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Peran Panitia
                  </label>
                  <select
                    value={peranPanitia}
                    onChange={(e) => setPeranPanitia(e.target.value as PeranPanitia)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
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
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Divisi Panitia (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Divisi Acara, Humas, Konsumsi"
                    value={divisiPanitia}
                    onChange={(e) => setDivisiPanitia(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalPanitiaBuka(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-muted hover:bg-surface hover:text-navy"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold disabled:opacity-60 shadow-md shadow-secondary/25"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Simpan Panitia
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────
          MODAL EDIT PANITIA
      ───────────────────────────────────────────── */}
      <AnimatePresence>
        {modalEditPanitiaBuka && panitiaDiedit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setModalEditPanitiaBuka(false)}
              className="fixed inset-0 bg-navy/50 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 360 }}
              className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">
                  Ubah Peran Panitia ({panitiaDiedit.sto.nama})
                </h3>
                <button
                  onClick={() => setModalEditPanitiaBuka(false)}
                  className="text-slate-muted hover:text-navy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitEditPanitia} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Peran Panitia
                  </label>
                  <select
                    value={peranPanitia}
                    onChange={(e) => setPeranPanitia(e.target.value as PeranPanitia)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
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
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Divisi Panitia (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Divisi Acara, Humas, Konsumsi"
                    value={divisiPanitia}
                    onChange={(e) => setDivisiPanitia(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEditPanitiaBuka(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-muted hover:bg-surface hover:text-navy"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold disabled:opacity-60 shadow-md shadow-secondary/25"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────
          MODAL TAMBAH / EDIT AGENDA
      ───────────────────────────────────────────── */}
      <AnimatePresence>
        {(modalAgendaBuka || modalEditAgendaBuka) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setModalAgendaBuka(false);
                setModalEditAgendaBuka(false);
                resetFormAgenda();
              }}
              className="fixed inset-0 bg-navy/50 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 360 }}
              className="relative w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">
                  {modalAgendaBuka ? "Tambah Agenda Kegiatan Baru" : "Edit Agenda Kegiatan"}
                </h3>
                <button
                  onClick={() => {
                    setModalAgendaBuka(false);
                    setModalEditAgendaBuka(false);
                    resetFormAgenda();
                  }}
                  className="text-slate-muted hover:text-navy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={modalAgendaBuka ? handleSubmitTambahAgenda : handleSubmitEditAgenda}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Judul Agenda
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rapat Pleno 1 Persiapan Lomba"
                    value={judulAgenda}
                    onChange={(e) => setJudulAgenda(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Jenis Agenda
                    </label>
                    <select
                      value={jenisAgenda}
                      onChange={(e) => setJenisAgenda(e.target.value as JenisAgenda)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    >
                      <option value={JenisAgenda.rapat_pj}>Rapat PJ & PI</option>
                      <option value={JenisAgenda.rapat_besar}>Rapat Besar</option>
                      <option value={JenisAgenda.rapat_koordinasi}>Rapat Koordinasi</option>
                      <option value={JenisAgenda.hari_h}>Hari H Pelaksanaan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Urutan Agenda
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={urutanAgenda}
                      onChange={(e) => setUrutanAgenda(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      required
                      value={tglAgenda}
                      onChange={(e) => setTglAgenda(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Jam Mulai (WIB)
                    </label>
                    <input
                      type="time"
                      required
                      value={waktuAgenda}
                      onChange={(e) => setWaktuAgenda(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Target Peserta (Akses Presensi)
                  </label>
                  <select
                    value={targetPeserta}
                    onChange={(e) => setTargetPeserta(e.target.value as TargetPeserta)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
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
                  <p className="text-[10px] text-slate-muted mt-1">
                    Aturan akses ini menentukan siapa saja yang dapat melihat agenda ini di /home dan melakukan scan presensi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Lokasi Pertemuan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Sidang Utama Lt. 2 / Google Meet"
                    value={lokasiAgenda}
                    onChange={(e) => setLokasiAgenda(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
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
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-muted hover:bg-surface hover:text-navy"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold disabled:opacity-60 shadow-md shadow-secondary/25"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Simpan Agenda
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
