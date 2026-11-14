// components/dashboard/periode-manager.tsx
"use client";

import { useState, useTransition } from "react";
import {
  buatPeriodeAction,
  tutupPeriodeAction,
  aktifkanPeriodeAction,
  hapusPeriodeAction,
} from "@/lib/actions/periode";
import { StatusPeriode } from "@prisma/client";
import {
  Calendar,
  Plus,
  Lock,
  CheckCircle2,
  Trash2,
  AlertCircle,
  X,
  Loader2,
  Users,
  FolderKanban,
} from "lucide-react";

interface PeriodeItem {
  id: number;
  nama: string;
  tglMulai: Date;
  tglSelesai: Date;
  status: StatusPeriode;
  _count: {
    sto: number;
    proker: number;
  };
}

export function PeriodeManager({ initialPeriode }: { initialPeriode: PeriodeItem[] }) {
  const [modalBuka, setModalBuka] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "error"; teks: string } | null>(null);

  // Form State
  const [nama, setNama] = useState("");
  const [tglMulai, setTglMulai] = useState("");
  const [tglSelesai, setTglSelesai] = useState("");
  const [status, setStatus] = useState<"aktif" | "selesai">("aktif");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(null);

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("tglMulai", tglMulai);
    formData.append("tglSelesai", tglSelesai);
    formData.append("status", status);

    startTransition(async () => {
      const res = await buatPeriodeAction(null, formData);
      if (res?.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else if (res?.sukses) {
        setPesan({ tipe: "sukses", teks: res.pesan });
        setModalBuka(false);
        setNama("");
        setTglMulai("");
        setTglSelesai("");
      }
    });
  };

  const handleTutupPeriode = (id: number, namaPeriode: string) => {
    if (
      !confirm(
        `Yakin ingin menutup periode "${namaPeriode}"?\n\nPERINGATAN: Sesuai aturan PRD, periode selesai akan berstatus READ-ONLY (proker, panitia, agenda, dan sesi presensi tidak dapat dimanipulasi lagi).`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await tutupPeriodeAction(id);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
      }
    });
  };

  const handleAktifkanPeriode = (id: number, namaPeriode: string) => {
    if (
      !confirm(
        `Jadikan periode "${namaPeriode}" sebagai periode aktif?\nPeriode aktif saat ini akan otomatis dialihkan menjadi selesai.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await aktifkanPeriodeAction(id);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
      }
    });
  };

  const handleHapusPeriode = (id: number, namaPeriode: string) => {
    if (!confirm(`Hapus periode "${namaPeriode}"?`)) return;

    startTransition(async () => {
      const res = await hapusPeriodeAction(id);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-6 h-6 text-secondary" />
            Kelola Periode Kepengurusan
          </h2>
          <p className="text-xs text-slate-muted mt-1">
            Hanya 1 periode aktif pada satu waktu. Periode selesai bersifat read-only untuk menjaga riwayat.
          </p>
        </div>

        <button
          onClick={() => {
            setPesan(null);
            setModalBuka(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold shadow-md shadow-secondary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Buka Periode Baru
        </button>
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

      {/* Grid of Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialPeriode.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white">
            <Calendar className="w-10 h-10 text-slate-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-navy">
              Belum ada periode kepengurusan
            </p>
            <p className="text-xs text-slate-muted mt-1">
              Klik tombol &quot;Buka Periode Baru&quot; di atas untuk memulai.
            </p>
          </div>
        ) : (
          initialPeriode.map((item) => {
            const isAktif = item.status === StatusPeriode.aktif;
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isAktif
                    ? "bg-white border-secondary shadow-[0_4px_16px_rgba(30,111,224,0.08)] ring-1 ring-secondary/30"
                    : "bg-surface border-[#E2E8F0]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isAktif
                            ? "bg-accent/20 text-primary border border-accent/40"
                            : "bg-[#E2E8F0] text-slate-muted"
                        }`}
                      >
                        {isAktif ? "● Periode Aktif" : "Selesai (Read-only)"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-primary">
                      {item.nama}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {isAktif ? (
                      <button
                        onClick={() => handleTutupPeriode(item.id, item.nama)}
                        disabled={isPending}
                        title="Tutup Periode (Ubah jadi Read-Only)"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-highlight/15 hover:bg-highlight/25 text-[#B45309] border border-highlight/30 flex items-center gap-1.5 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Tutup Periode
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAktifkanPeriode(item.id, item.nama)}
                        disabled={isPending}
                        title="Jadikan sebagai Periode Aktif"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-surface text-navy border border-[#CBD5E1] transition-colors"
                      >
                        Aktifkan
                      </button>
                    )}

                    {item._count.sto === 0 && item._count.proker === 0 && (
                      <button
                        onClick={() => handleHapusPeriode(item.id, item.nama)}
                        disabled={isPending}
                        title="Hapus Periode Kosong"
                        className="p-1.5 rounded-lg text-slate-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date range */}
                <p className="text-xs text-slate-muted mb-4">
                  {new Date(item.tglMulai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  —{" "}
                  {new Date(item.tglSelesai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E2E8F0] text-xs">
                  <div className="flex items-center gap-2 text-navy">
                    <Users className="w-3.5 h-3.5 text-secondary" />
                    <span>{item._count.sto} Pengurus STO</span>
                  </div>
                  <div className="flex items-center gap-2 text-navy">
                    <FolderKanban className="w-3.5 h-3.5 text-accent" />
                    <span>{item._count.proker} Program Kerja</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tambah Periode */}
      {modalBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">
                Buka Periode Kepengurusan Baru
              </h3>
              <button
                onClick={() => setModalBuka(false)}
                className="text-slate-muted hover:text-navy"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Nama Periode
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kepengurusan 2026/2027"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={tglMulai}
                    onChange={(e) => setTglMulai(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={tglSelesai}
                    onChange={(e) => setTglSelesai(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Status Awal
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "aktif" | "selesai")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                >
                  <option value="aktif">Aktif (Akan menutup periode aktif sebelumnya)</option>
                  <option value="selesai">Selesai (Read-only)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalBuka(false)}
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
                  Simpan Periode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
