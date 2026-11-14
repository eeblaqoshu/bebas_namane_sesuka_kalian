"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, QrCode } from "lucide-react";
import Link from "next/link";

export interface AgendaItem {
  id: number;
  judul: string;
  prokerNama: string;
  jenis: string;
  tglFormatted: string;
  jamFormatted: string;
  lokasiNama: string | null;
  targetPeserta: string;
  statusDihitung: "akan_datang" | "sedang_berlangsung" | "selesai";
  adaSesiAktif: boolean;
}

export function StoAgendaTabs({
  akanDatang,
  sedangBerlangsung,
  selesai,
}: {
  akanDatang: AgendaItem[];
  sedangBerlangsung: AgendaItem[];
  selesai: AgendaItem[];
}) {
  const [activeTab, setActiveTab] = useState<"mendatang" | "berlangsung" | "selesai">("mendatang");

  const tabs = [
    {
      id: "mendatang" as const,
      label: "Akan Datang",
      count: akanDatang.length,
      data: akanDatang,
    },
    {
      id: "berlangsung" as const,
      label: "Sedang Berlangsung",
      count: sedangBerlangsung.length,
      data: sedangBerlangsung,
    },
    {
      id: "selesai" as const,
      label: "Selesai",
      count: selesai.length,
      data: selesai,
    },
  ];

  const currentTabData = tabs.find((t) => t.id === activeTab)?.data || [];

  return (
    <div className="space-y-4">
      {/* Tab Header Controls: Komponen lonjong (capsule / pill) */}
      <div className="p-1.5 bg-surface rounded-full border border-[#E2E8F0] overflow-x-auto scrollbar-none shadow-sm">
        <div className="flex items-center min-w-full sm:min-w-0 sm:grid sm:grid-cols-3 gap-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 shrink-0 py-2.5 px-4 sm:px-5 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center whitespace-nowrap focus:outline-none"
              >
                {/* Konten teks & badge selalu di layer atas (z-10) */}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span
                    className={`transition-colors duration-200 ${
                      isActive
                        ? "text-primary font-extrabold"
                        : "text-slate-muted hover:text-navy"
                    }`}
                  >
                    {tab.label}
                  </span>

                  {/* Badge Jumlah Agenda */}
                  <span
                    className={`text-[10px] min-w-[20px] h-[20px] px-1.5 rounded-full font-bold flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-[#E2E8F0] text-slate-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                </span>

                {/* Komponen lonjong aktif (capsule pill indicator) */}
                {isActive && (
                  <motion.div
                    layoutId="stoTabPill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-white rounded-full shadow-[0_2px_10px_rgba(11,42,91,0.12)] border border-[#CBD5E1] z-0"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {currentTabData.length === 0 ? (
            <div className="py-14 px-4 rounded-3xl bg-white border border-[#E2E8F0] text-center shadow-sm">
              <Calendar className="w-9 h-9 text-slate-muted mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-navy">
                Belum ada agenda di kategori ini
              </p>
              <p className="text-xs text-slate-muted mt-1 max-w-sm mx-auto leading-relaxed">
                Agenda kegiatan akan otomatis terdata setelah dijadwalkan oleh adsek/panitia terkait.
              </p>
            </div>
          ) : (
            currentTabData.map((agenda) => (
              <div
                key={agenda.id}
                className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:border-secondary transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-primary uppercase tracking-wide border border-accent/30">
                      {agenda.jenis.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-muted">•</span>
                    <span className="text-xs font-semibold text-secondary">
                      {agenda.prokerNama}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-primary tracking-tight">
                    {agenda.judul}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-muted">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-secondary" />
                      <span>{agenda.tglFormatted}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-secondary" />
                      <span>{agenda.jamFormatted}</span>
                    </div>
                    {agenda.lokasiNama && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span>{agenda.lokasiNama}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status / Aksi Presensi */}
                <div className="sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#E2E8F0]">
                  {agenda.adaSesiAktif ? (
                    <Link
                      href="/scan"
                      className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-secondary hover:bg-primary text-white font-semibold text-xs shadow-md shadow-secondary/25 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Scan Presensi
                    </Link>
                  ) : agenda.statusDihitung === "selesai" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-[#E2E8F0] text-slate-muted text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-muted" />
                      Agenda Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-[#E2E8F0] text-slate-muted text-xs font-medium">
                      <AlertCircle className="w-3.5 h-3.5 text-highlight" />
                      Belum Dibuka
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
