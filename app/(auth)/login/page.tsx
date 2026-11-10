"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth, googleProvider } from "@/lib/firebase-client";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sto" | "adsek">("sto");
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);

  // State Form Adsek
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleTabChange(tab: "sto" | "adsek") {
    if (tab === activeTab) return;
    setSlideDirection(tab === "adsek" ? 1 : -1);
    setActiveTab(tab);
    setErrorMsg(null);
  }

  async function kirimTokenKeServer(idToken: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.pesan || "Terjadi kesalahan saat memverifikasi sesi");
    }

    router.push(data.redirectUrl || "/");
    router.refresh();
  }

  async function handleLoginGoogle() {
    setErrorMsg(null);
    setLoading(true);

    try {
      const auth = getClientAuth();
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken(true);
      await kirimTokenKeServer(idToken);
    } catch (err: unknown) {
      console.error("Login Google error:", err);
      if (err instanceof Error) {
        if (err.message.includes("auth/popup-closed-by-user")) {
          setErrorMsg("Jendela login Google ditutup sebelum selesai.");
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg("Gagal melakukan login dengan Google.");
      }
      setLoading(false);
    }
  }

  async function handleLoginAdsek(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken(true);
      await kirimTokenKeServer(idToken);
    } catch (err: unknown) {
      console.error("Login Adsek error:", err);
      if (err instanceof Error) {
        if (
          err.message.includes("auth/invalid-credential") ||
          err.message.includes("auth/wrong-password") ||
          err.message.includes("auth/user-not-found")
        ) {
          setErrorMsg("Alamat email atau kata sandi tidak valid.");
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg("Gagal melakukan autentikasi adsek.");
      }
      setLoading(false);
    }
  }

  const slideVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 24 : -24,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        x: { type: "spring" as const, stiffness: 350, damping: 32 },
        opacity: { duration: 0.25 },
        filter: { duration: 0.2 },
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -24 : 24,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        x: { type: "spring" as const, stiffness: 350, damping: 32 },
        opacity: { duration: 0.18 },
        filter: { duration: 0.15 },
      },
    }),
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0A] p-4 sm:p-6 font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 antialiased">
      {/* Background Ambience (Minimalist subtle glow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-gradient-to-tr from-blue-100/40 via-zinc-100/60 to-transparent dark:from-blue-950/20 dark:via-zinc-900/40 dark:to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[410px] bg-white dark:bg-[#121212] rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden"
      >
        {/* Header Section */}
        <div className="px-8 pt-8 pb-5 text-center">
          {/* Logo Resmi UKM PCC */}
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white p-0.5 mx-auto mb-3.5 shadow-sm">
            <Image
              src="/logo-pcc.png"
              alt="Logo UKM PCC"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sistem Presensi STO
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
            Polytechnic Computer Club • Polines
          </p>

          {/* Segmented Control Switcher */}
          <div className="mt-6 p-1 bg-zinc-100/80 dark:bg-zinc-800/60 rounded-xl relative grid grid-cols-2">
            <button
              type="button"
              onClick={() => handleTabChange("sto")}
              className="relative z-10 py-2 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none"
            >
              <span
                className={`transition-colors duration-200 ${
                  activeTab === "sto"
                    ? "text-zinc-900 dark:text-white font-semibold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Pengurus STO
              </span>
              {activeTab === "sto" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 -z-10"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("adsek")}
              className="relative z-10 py-2 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none"
            >
              <span
                className={`transition-colors duration-200 ${
                  activeTab === "adsek"
                    ? "text-zinc-900 dark:text-white font-semibold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Adsek / Inti
              </span>
              {activeTab === "adsek" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 -z-10"
                />
              )}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="px-8 overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Form Content */}
        <div className="overflow-hidden relative min-h-[190px]">
          <AnimatePresence mode="wait" custom={slideDirection}>
            {activeTab === "sto" ? (
              <motion.div
                key="tab-sto"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="px-8 pb-8 space-y-4"
              >
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                  Gunakan akun Google mahasiswa resmi yang terdaftar pada kepengurusan aktif.
                </p>

                <motion.button
                  whileHover={{ scale: 1.008 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  disabled={loading}
                  onClick={handleLoginGoogle}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                      <span>Memverifikasi akun...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Masuk dengan Google</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="tab-adsek"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="px-8 pb-8"
              >
                <form onSubmit={handleLoginAdsek} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Email Adsek
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@pcc.polines.ac.id"
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-900 dark:focus:border-zinc-400 transition-all placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-900 dark:focus:border-zinc-400 transition-all placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.008 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimalist Status Footer */}
        <div className="px-8 py-3.5 bg-zinc-50/70 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Sistem Presensi v1.0</span>
          </div>
          <span>UKM PCC</span>
        </div>
      </motion.div>
    </div>
  );
}
