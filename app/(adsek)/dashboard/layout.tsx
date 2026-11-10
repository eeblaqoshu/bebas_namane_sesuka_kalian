import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import Image from "next/image";
import { Calendar, FolderKanban, LayoutDashboard, Users } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.type !== "adsek" || !session.adsek) {
    redirect("/login");
  }

  const { adsek } = session;
  const isAdmin = adsek.role === "admin";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Navigation */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                  <Image
                    src="/logo-pcc.png"
                    alt="Logo UKM PCC"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                    Presensi Adsek
                  </h1>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    {adsek.role.replace("_", " ")}
                  </p>
                </div>
              </Link>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Ringkasan
                </Link>
                <Link
                  href="/dashboard/proker"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <FolderKanban className="w-4 h-4" />
                  Proker & Agenda
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/dashboard/periode"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Periode
                    </Link>
                    <Link
                      href="/dashboard/sto"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Data STO
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Right: User Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {adsek.nama}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {session.email}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-zinc-200/60 dark:border-zinc-800/60 overflow-x-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Ringkasan
          </Link>
          <Link
            href="/dashboard/proker"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Proker & Agenda
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/dashboard/periode"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" />
                Periode
              </Link>
              <Link
                href="/dashboard/sto"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5" />
                Data STO
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
