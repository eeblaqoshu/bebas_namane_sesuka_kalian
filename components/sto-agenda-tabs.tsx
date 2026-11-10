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
      {/* Tab Header Controls: Sangat rapi di mobile & desktop (tanpa teks terpotong/turun baris) */}
      <div className="p-1.5 bg-zinc-100/90 dark:bg-zinc-800/70 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 overflow-x-auto scrollbar-none">
        <div className="flex items-center min-w-full sm:min-w-0 sm:grid sm:grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 shrink-0 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none"
              >
                <span
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-zinc-950 dark:text-white font-semibold"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Badge Jumlah Agenda */}
                <span
                  className={`text-[10px] min-w-[18px] h-[18px] px-1 rounded-full font-bold flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                      : "bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {tab.count}
                </span>

                {/* Pill sliding indicator */}
                {isActive && (
                  <motion.div
                    layoutId="stoTabPill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/80 -z-10"
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
            <div className="py-14 px-4 rounded-3xl bg-white dark:bg-[#121212] border border-zinc-200/80 dark:border-zinc-800/80 text-center">
              <Calendar className="w-9 h-9 text-zinc-300 dark:text-zinc-600 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Belum ada agenda di kategori ini
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Agenda kegiatan akan otomatis terdata setelah dijadwalkan oleh adsek/panitia terkait.
              </p>
            </div>
          ) : (
            currentTabData.map((agenda) => (
              <div
                key={agenda.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {agenda.jenis.replace("_", " ")}
                    </span>
                    <span className="text-xs text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-xs font-medium text-zinc-500">
                      {agenda.prokerNama}
                    </span>
                  </div>

                  <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {agenda.judul}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{agenda.tglFormatted}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{agenda.jamFormatted}</span>
                    </div>
                    {agenda.lokasiNama && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{agenda.lokasiNama}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status / Aksi Presensi */}
                <div className="sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100 dark:border-zinc-800">
                  {agenda.adaSesiAktif ? (
                    <Link
                      href="/scan"
                      className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Scan Presensi
                    </Link>
                  ) : agenda.statusDihitung === "selesai" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Agenda Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
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
