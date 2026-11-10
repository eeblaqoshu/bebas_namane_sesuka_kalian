// middleware.ts
// Proteksi rute berbasis keberadaan session cookie di edge runtime
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/konstanta";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/home") ||
    pathname.startsWith("/scan") ||
    pathname.startsWith("/profil");

  // Jika mencoba mengakses rute terproteksi tanpa cookie sesi -> arahkan ke login
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah punya cookie dan mencoba buka /login, biarkan Server Component di /login mengecek & mengarahkan
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/home/:path*",
    "/scan/:path*",
    "/profil/:path*",
    "/login",
  ],
};
