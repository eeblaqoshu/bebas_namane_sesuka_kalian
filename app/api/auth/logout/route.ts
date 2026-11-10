// app/api/auth/logout/route.ts
// Menghapus session cookie server dan mengarahkan kembali ke halaman login
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ sukses: true, pesan: "Berhasil keluar" });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
  });

  return response;
}
