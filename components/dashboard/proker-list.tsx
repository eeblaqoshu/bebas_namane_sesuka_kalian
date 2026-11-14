// components/dashboard/proker-list.tsx
"use client";

import { useState, useTransition } from "react";
import { buatProkerAction, ubahProkerAction, hapusProkerAction } from "@/lib/actions/proker";
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Edit2,
  Trash2,
  Users,
  Calendar,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface ProkerItem {
  id: number;
  nama: string;
  deskripsi: string | null;
  pembuat: {
    nama: string;
    role: string;
  };
  _count: {
    kepanitiaan: number;
    agenda: number;
  };
}

export function ProkerList({
  initialProker,
  namaPeriode,
  isPeriodeAktif,
}: {
  initialProker: ProkerItem[];
  namaPeriode: string;
  isPeriodeAktif: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "error"; teks: string } | null>(null);

  // Modals
  const [modalBuka, setModalBuka] = useState(false);
  const [prokerDiedit, setProkerDiedit] = useState<ProkerItem | null>(null);

  // Form
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const resetForm = () => {
    setNama("");
    setDeskripsi("");
    setProkerDiedit(null);
  };

  const handleOpenEdit = (item: ProkerItem) => {
    setProkerDiedit(item);
    setNama(item.nama);
    setDeskripsi(item.deskripsi || "");
    setModalBuka(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(null);

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("deskripsi", deskripsi);

    startTransition(async () => {
      let res;
      if (prokerDiedit) {
        res = await ubahProkerAction(prokerDiedit.id, formData);
      } else {
        res = await buatProkerAction(null, formData);
      }

      if (res?.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else if (res?.sukses) {
        setPesan({ tipe: "sukses", teks: res.pesan });
        setModalBuka(false);
        resetForm();
      }
    });
  };

  const handleHapusProker = (id: number, namaProker: string) => {
    if (
      !confirm(
        `Yakin ingin menghapus proker "${namaProker}"?\nSemua susunan panitia dan agenda di dalamnya akan ikut terhapus.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await hapusProkerAction(id);
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
            <FolderKanban className="w-6 h-6 text-secondary" />
            Program Kerja (Proker)
          </h2>
          <p className="text-xs text-slate-muted mt-1">
            Periode: <strong className="text-primary">{namaPeriode}</strong>
            {!isPeriodeAktif && " (Status: Selesai / Read-Only)"}
          </p>
        </div>

        {isPeriodeAktif && (
          <button
            onClick={() => {
              resetForm();
              setModalBuka(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold shadow-md shadow-secondary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Buat Proker Baru
          </button>
        )}
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

      {/* Grid of Prokers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialProker.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white">
            <FolderKanban className="w-10 h-10 text-slate-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-navy">
              Belum ada program kerja di periode ini
            </p>
            <p className="text-xs text-slate-muted mt-1">
              {isPeriodeAktif
                ? 'Klik tombol "Buat Proker Baru" untuk menambahkan kegiatan.'
                : "Periode ini sudah selesai dan tidak memiliki data proker."}
            </p>
          </div>
        ) : (
          initialProker.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:border-secondary hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-primary line-clamp-1 group-hover:text-secondary transition-colors">
                    {item.nama}
                  </h3>
                  {isPeriodeAktif && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Proker"
                        className="p-1.5 rounded-lg text-slate-muted hover:text-secondary hover:bg-secondary/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleHapusProker(item.id, item.nama)}
                        disabled={isPending}
                        title="Hapus Proker"
                        className="p-1.5 rounded-lg text-slate-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-muted line-clamp-2 min-h-[2rem]">
                  {item.deskripsi || "Tidak ada deskripsi tambahan."}
                </p>

                {/* Info pembuat */}
                <p className="text-[11px] text-slate-muted mt-3">
                  Dibuat oleh: <span className="font-medium text-navy">{item.pembuat.nama}</span>
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#E2E8F0] text-xs">
                  <div className="flex items-center gap-1.5 text-navy">
                    <Users className="w-3.5 h-3.5 text-secondary" />
                    <span>{item._count.kepanitiaan} Panitia</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-navy">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>{item._count.agenda} Agenda</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-[#E2E8F0]">
                <Link
                  href={`/dashboard/proker/${item.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-secondary hover:text-white text-navy text-xs font-semibold transition-colors"
                >
                  Kelola Panitia & Agenda
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah / Edit Proker */}
      {modalBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">
                {prokerDiedit ? "Edit Program Kerja" : "Buat Program Kerja Baru"}
              </h3>
              <button
                onClick={() => {
                  setModalBuka(false);
                  resetForm();
                }}
                className="text-slate-muted hover:text-navy"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Nama Program Kerja
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PCC National IT Festival 2026"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Deskripsi Kegiatan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ringkas mengenai tujuan dan konsep proker ini..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalBuka(false);
                    resetForm();
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
                  {prokerDiedit ? "Simpan Perubahan" : "Buat Proker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
