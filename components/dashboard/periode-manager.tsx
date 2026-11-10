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
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Kelola Periode Kepengurusan
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Hanya 1 periode aktif pada satu waktu. Periode selesai bersifat read-only untuk menjaga riwayat.
          </p>
        </div>

        <button
          onClick={() => {
            setPesan(null);
            setModalBuka(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
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

      {/* Grid of Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialPeriode.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Calendar className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Belum ada periode kepengurusan
            </p>
            <p className="text-xs text-zinc-500 mt-1">
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
                    ? "bg-white dark:bg-zinc-900 border-emerald-500/50 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/30"
                    : "bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isAktif
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {isAktif ? "● Periode Aktif" : "Selesai (Read-only)"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
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
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Tutup Periode
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAktifkanPeriode(item.id, item.nama)}
                        disabled={isPending}
                        title="Jadikan sebagai Periode Aktif"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        Aktifkan
                      </button>
                    )}

                    {item._count.sto === 0 && item._count.proker === 0 && (
                      <button
                        onClick={() => handleHapusPeriode(item.id, item.nama)}
                        disabled={isPending}
                        title="Hapus Periode Kosong"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date range */}
                <p className="text-xs text-zinc-500 mb-4">
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
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{item._count.sto} Pengurus STO</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Buka Periode Kepengurusan Baru
              </h3>
              <button
                onClick={() => setModalBuka(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Periode
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kepengurusan 2026/2027"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={tglMulai}
                    onChange={(e) => setTglMulai(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={tglSelesai}
                    onChange={(e) => setTglSelesai(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Status Awal
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "aktif" | "selesai")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aktif">Aktif (Akan menutup periode aktif sebelumnya)</option>
                  <option value="selesai">Selesai (Read-only)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalBuka(false)}
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
