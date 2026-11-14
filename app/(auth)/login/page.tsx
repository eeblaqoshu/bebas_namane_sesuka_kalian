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
      throw new Error(
        data.error?.pesan || "Terjadi kesalahan saat memverifikasi sesi",
      );
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
        } else if (err.message.includes("auth/operation-not-allowed")) {
          setErrorMsg(
            "Provider 'Email/Password' belum diaktifkan di Firebase Console. Buka Firebase Console > Authentication > Sign-in method, lalu aktifkan 'Email/Password'.",
          );
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
    <div className="relative min-h-screen flex items-center justify-center bg-surface p-4 sm:p-6 font-sans selection:bg-primary selection:text-white antialiased">
      {/* Background Ambience (Subtle brand glow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-gradient-to-tr from-secondary/15 via-accent/10 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[410px] bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(11,42,91,0.06)] overflow-hidden"
      >
        {/* Header Section */}
        <div className="px-8 pt-8 pb-5 text-center">
          {/* Logo Resmi UKM PCC */}
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white p-0.5 mx-auto mb-3.5 shadow-sm">
            <Image
              src="/logo-pcc.png"
              alt="Logo UKM PCC"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <h1 className="text-lg font-bold tracking-tight text-primary">
            Sistem Presensi STO
          </h1>
          <p className="text-xs text-slate-muted mt-1 font-normal">
            Polytechnic Computer Club • Polines
          </p>

          {/* Segmented Control Switcher */}
          <div className="mt-6 p-1 bg-surface border border-[#E2E8F0] rounded-xl relative grid grid-cols-2">
            <button
              type="button"
              onClick={() => handleTabChange("sto")}
              className="relative z-10 py-2 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none"
            >
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  activeTab === "sto"
                    ? "text-primary font-bold"
                    : "text-slate-muted hover:text-navy"
                }`}
              >
                Pengurus STO
              </span>
              {activeTab === "sto" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-white rounded-lg shadow-sm border border-[#E2E8F0] z-0"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("adsek")}
              className="relative z-10 py-2 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none"
            >
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  activeTab === "adsek"
                    ? "text-primary font-bold"
                    : "text-slate-muted hover:text-navy"
                }`}
              >
                Adsek / Inti
              </span>
              {activeTab === "adsek" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-white rounded-lg shadow-sm border border-[#E2E8F0] z-0"
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
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
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
                <p className="text-xs text-slate-muted text-center leading-relaxed">
                  Gunakan akun Google mahasiswa resmi (
                  <span className="font-semibold text-primary">
                    @mhs.polines.ac.id
                  </span>
                  ) yang terdaftar pada kepengurusan aktif.
                </p>

                <motion.button
                  whileHover={{ scale: 1.008 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  disabled={loading}
                  onClick={handleLoginGoogle}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-surface text-navy font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-secondary" />
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
                    <label className="block text-[11px] font-semibold text-navy mb-1">
                      Email Adsek
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@pcc.polines.ac.id"
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-surface/50 text-navy text-xs focus:outline-none focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-slate-muted"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-surface/50 text-navy text-xs focus:outline-none focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-slate-muted"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.008 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
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
      </motion.div>
    </div>
  );
}
