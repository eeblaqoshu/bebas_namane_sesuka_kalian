// components/dashboard/sto-manager.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  tambahStoAction,
  ubahStoAction,
  hapusStoAction,
  imporCsvStoAction,
  CsvBarisSto,
} from "@/lib/actions/sto";
import {
  Users,
  Plus,
  Upload,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileSpreadsheet,
  Download,
} from "lucide-react";

interface StoItem {
  id: number;
  nama: string;
  nim: string;
  emailGoogle: string;
  jabatan: string | null;
  divisi: string | null;
  foto: string | null;
}

export function StoManager({
  initialSto,
  namaPeriode,
}: {
  initialSto: StoItem[];
  namaPeriode: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "error"; teks: string } | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("all");

  // Modals
  const [modalTambahBuka, setModalTambahBuka] = useState(false);
  const [modalEditBuka, setModalEditBuka] = useState(false);
  const [modalCsvBuka, setModalCsvBuka] = useState(false);
  const [stoSedangDiedit, setStoSedangDiedit] = useState<StoItem | null>(null);

  // Form State (Tambah / Edit)
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [emailGoogle, setEmailGoogle] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [divisi, setDivisi] = useState("");

  // CSV Import State
  const [csvPreview, setCsvPreview] = useState<CsvBarisSto[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvHasil, setCsvHasil] = useState<{
    totalBerhasil: number;
    totalGagal: number;
    pesanGagal: string[];
  } | null>(null);

  // List of unique divisions
  const divisiList = useMemo(() => {
    const set = new Set<string>();
    initialSto.forEach((s) => {
      if (s.divisi) set.add(s.divisi);
    });
    return Array.from(set).sort();
  }, [initialSto]);

  // Filtered STO
  const filteredSto = useMemo(() => {
    return initialSto.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        item.nim.toLowerCase().includes(search.toLowerCase()) ||
        item.emailGoogle.toLowerCase().includes(search.toLowerCase());
      const matchDivisi =
        filterDivisi === "all" || item.divisi?.toLowerCase() === filterDivisi.toLowerCase();
      return matchSearch && matchDivisi;
    });
  }, [initialSto, search, filterDivisi]);

  const resetForm = () => {
    setNama("");
    setNim("");
    setEmailGoogle("");
    setJabatan("");
    setDivisi("");
    setStoSedangDiedit(null);
  };

  const handleOpenEdit = (item: StoItem) => {
    setStoSedangDiedit(item);
    setNama(item.nama);
    setNim(item.nim);
    setEmailGoogle(item.emailGoogle);
    setJabatan(item.jabatan || "");
    setDivisi(item.divisi || "");
    setModalEditBuka(true);
  };

  const handleSubmitTambah = (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(null);

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("nim", nim);
    formData.append("emailGoogle", emailGoogle);
    formData.append("jabatan", jabatan);
    formData.append("divisi", divisi);

    startTransition(async () => {
      const res = await tambahStoAction(null, formData);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
        setModalTambahBuka(false);
        resetForm();
      }
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stoSedangDiedit) return;
    setPesan(null);

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("nim", nim);
    formData.append("emailGoogle", emailGoogle);
    formData.append("jabatan", jabatan);
    formData.append("divisi", divisi);

    startTransition(async () => {
      const res = await ubahStoAction(stoSedangDiedit.id, formData);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
        setModalEditBuka(false);
        resetForm();
      }
    });
  };

  const handleHapusSto = (id: number, namaSto: string) => {
    if (!confirm(`Hapus data pengurus "${namaSto}"?`)) return;

    startTransition(async () => {
      const res = await hapusStoAction(id);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setPesan({ tipe: "sukses", teks: res.pesan });
      }
    });
  };

  // CSV File Handler
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvHasil(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        alert("File CSV tidak memiliki data baris.");
        return;
      }

      // Deteksi delimiter (koma atau titik koma)
      const delimiter = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0]
        .split(delimiter)
        .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

      const namaIdx = headers.findIndex((h) => h.includes("nama"));
      const nimIdx = headers.findIndex((h) => h.includes("nim"));
      const emailIdx = headers.findIndex((h) => h.includes("email"));
      const jabatanIdx = headers.findIndex((h) => h.includes("jabatan"));
      const divisiIdx = headers.findIndex((h) => h.includes("divisi"));

      const parsedRows: CsvBarisSto[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length < 3) continue;

        parsedRows.push({
          nama: namaIdx !== -1 ? cols[namaIdx] || "" : cols[0] || "",
          nim: nimIdx !== -1 ? cols[nimIdx] || "" : cols[1] || "",
          email: emailIdx !== -1 ? cols[emailIdx] || "" : cols[2] || "",
          jabatan: jabatanIdx !== -1 ? cols[jabatanIdx] : cols[3] || undefined,
          divisi: divisiIdx !== -1 ? cols[divisiIdx] : cols[4] || undefined,
        });
      }

      setCsvPreview(parsedRows);
    };

    reader.readAsText(file);
  };

  const handleProsesImporCsv = () => {
    if (csvPreview.length === 0) return;

    startTransition(async () => {
      const res = await imporCsvStoAction(csvPreview);
      if (res.error) {
        setPesan({ tipe: "error", teks: res.error.pesan });
      } else {
        setCsvHasil({
          totalBerhasil: res.totalBerhasil || 0,
          totalGagal: res.totalGagal || 0,
          pesanGagal: res.pesanGagal || [],
        });
        setPesan({
          tipe: "sukses",
          teks: `Impor selesai: ${res.totalBerhasil} berhasil, ${res.totalGagal} dilewati/gagal.`,
        });
      }
    });
  };

  const downloadSampleCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Nama,NIM,Email,Jabatan,Divisi\n" +
      "Budi Santoso,3.34.23.0.01,budi@mhs.polines.ac.id,Ketua Umum,Pengurus Inti\n" +
      "Siti Rahma,3.34.23.0.02,siti@mhs.polines.ac.id,Staff,Divisi Litbang\n" +
      "Andi Prasetyo,3.34.23.0.03,andi@mhs.polines.ac.id,PJ Acara,Divisi Humas";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_sto_presensi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-secondary" />
            Data Pengurus STO
          </h2>
          <p className="text-xs text-slate-muted mt-1">
            Terikat pada periode aktif: <span className="font-semibold text-primary">{namaPeriode}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCsvPreview([]);
              setCsvHasil(null);
              setCsvFileName("");
              setModalCsvBuka(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#CBD5E1] text-navy text-xs font-semibold hover:bg-surface shadow-sm transition-all"
          >
            <Upload className="w-4 h-4 text-secondary" />
            Impor CSV
          </button>

          <button
            onClick={() => {
              resetForm();
              setModalTambahBuka(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold shadow-md shadow-secondary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah STO
          </button>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-muted" />
          <input
            type="text"
            placeholder="Cari nama, NIM, atau email pengurus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy placeholder:text-slate-muted focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
          />
        </div>

        {divisiList.length > 0 && (
          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
          >
            <option value="all">Semua Divisi ({initialSto.length})</option>
            {divisiList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table STO */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-slate-muted uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3.5">Nama & NIM</th>
                <th className="px-6 py-3.5">Email Google</th>
                <th className="px-6 py-3.5">Jabatan</th>
                <th className="px-6 py-3.5">Divisi</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredSto.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-muted">
                    Tidak ada data pengurus STO yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredSto.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface/70 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {item.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-navy">
                            {item.nama}
                          </div>
                          <div className="text-[11px] text-slate-muted">{item.nim}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-muted font-mono text-[11px]">
                      {item.emailGoogle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-navy font-medium">
                      {item.jabatan || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-surface text-primary border border-[#E2E8F0] text-[11px] font-medium">
                        {item.divisi || "Umum"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Pengurus"
                          className="p-1.5 rounded-lg text-slate-muted hover:text-secondary hover:bg-secondary/10 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleHapusSto(item.id, item.nama)}
                          disabled={isPending}
                          title="Hapus Pengurus"
                          className="p-1.5 rounded-lg text-slate-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit STO dengan Animasi Opening & Closing */}
      <AnimatePresence>
        {(modalTambahBuka || modalEditBuka) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => {
                setModalTambahBuka(false);
                setModalEditBuka(false);
                resetForm();
              }}
              className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 360 }}
              className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">
                  {modalTambahBuka ? "Tambah Pengurus STO" : "Edit Pengurus STO"}
                </h3>
                <button
                  onClick={() => {
                    setModalTambahBuka(false);
                    setModalEditBuka(false);
                    resetForm();
                  }}
                  className="text-slate-muted hover:text-navy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={modalTambahBuka ? handleSubmitTambah : handleSubmitEdit}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Albi"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    NIM
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 3.34.23.0.12"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Email Google (Mahasiswa)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: albi@mhs.polines.ac.id"
                    value={emailGoogle}
                    onChange={(e) => setEmailGoogle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  />
                  <p className="text-[10px] text-slate-muted mt-1">
                    Email ini digunakan STO untuk login via akun Google.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Staff Muda"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Divisi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Litbang"
                      value={divisi}
                      onChange={(e) => setDivisi(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-navy focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTambahBuka(false);
                      setModalEditBuka(false);
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
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Impor CSV dengan Animasi Opening & Closing */}
      <AnimatePresence>
        {modalCsvBuka && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setModalCsvBuka(false)}
              className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 360 }}
              className="relative w-full max-w-xl bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-secondary" />
                  <h3 className="text-sm font-bold text-primary">
                    Impor Pengurus STO dari CSV
                  </h3>
                </div>
                <button
                  onClick={() => setModalCsvBuka(false)}
                  className="text-slate-muted hover:text-navy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {/* Petunjuk & Download Template */}
                <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-primary">
                      Format Kolom CSV:
                    </p>
                    <p className="text-secondary font-mono text-[11px] mt-0.5">
                      Nama, NIM, Email, Jabatan, Divisi
                    </p>
                  </div>
                  <button
                    onClick={downloadSampleCsv}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-secondary border border-secondary/30 font-semibold text-[11px] shadow-sm hover:bg-surface"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Template CSV
                  </button>
                </div>

                {/* Upload Input */}
                <div className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-6 text-center hover:border-secondary transition-colors">
                  <Upload className="w-8 h-8 text-slate-muted mx-auto mb-2" />
                  <p className="text-xs font-semibold text-navy">
                    Pilih file CSV dari komputer Anda
                  </p>
                  <p className="text-[11px] text-slate-muted mt-0.5">
                    Mendukung pemisah koma (,) atau titik koma (;)
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="mt-3 block w-full text-xs text-slate-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer"
                  />
                </div>

                {/* Hasil Ringkasan Impor */}
                {csvHasil && (
                  <div className="p-4 rounded-xl bg-surface border border-[#E2E8F0] text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-navy">Laporan Impor:</span>
                    </div>
                    <p className="text-slate-muted">
                      • Berhasil disimpan: <strong className="text-emerald-600">{csvHasil.totalBerhasil} data</strong>
                    </p>
                    {csvHasil.totalGagal > 0 && (
                      <div className="space-y-1">
                        <p className="text-rose-600 font-semibold">
                          • Dilewati / Gagal: {csvHasil.totalGagal} data
                        </p>
                        <ul className="list-disc pl-5 text-[11px] text-rose-500 space-y-0.5 max-h-28 overflow-y-auto">
                          {csvHasil.pesanGagal.map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Preview Baris CSV */}
                {csvPreview.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-navy">
                        Preview Data ({csvPreview.length} baris ditemukan di {csvFileName}):
                      </span>
                    </div>
                    <div className="border border-[#E2E8F0] rounded-xl overflow-x-auto max-h-48 text-[11px]">
                      <table className="w-full text-left">
                        <thead className="bg-surface sticky top-0 font-semibold text-slate-muted">
                          <tr>
                            <th className="px-3 py-2">Nama</th>
                            <th className="px-3 py-2">NIM</th>
                            <th className="px-3 py-2">Email</th>
                            <th className="px-3 py-2">Jabatan</th>
                            <th className="px-3 py-2">Divisi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {csvPreview.slice(0, 10).map((row, i) => (
                            <tr key={i}>
                              <td className="px-3 py-1.5 font-medium text-navy">{row.nama}</td>
                              <td className="px-3 py-1.5 text-slate-muted">{row.nim}</td>
                              <td className="px-3 py-1.5 font-mono text-slate-muted">{row.email}</td>
                              <td className="px-3 py-1.5 text-navy">{row.jabatan || "-"}</td>
                              <td className="px-3 py-1.5 text-navy">{row.divisi || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvPreview.length > 10 && (
                      <p className="text-[10px] text-slate-muted italic">
                        + {csvPreview.length - 10} baris lainnya akan diproses...
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2 bg-surface">
                <button
                  type="button"
                  onClick={() => setModalCsvBuka(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-muted hover:bg-white hover:text-navy"
                >
                  Tutup
                </button>
                {csvPreview.length > 0 && !csvHasil && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleProsesImporCsv}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-primary text-white text-xs font-semibold disabled:opacity-60 shadow-md shadow-secondary/25"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Mulai Impor ({csvPreview.length} Data)
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
