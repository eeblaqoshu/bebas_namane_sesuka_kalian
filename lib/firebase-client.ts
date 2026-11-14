// lib/firebase-client.ts
// Inisialisasi Firebase JS SDK untuk sisi browser / klien (Lazy load agar aman saat Next.js prerender)
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let clientAuth: Auth | undefined;

export function getClientAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("getClientAuth hanya dapat dipanggil di browser.");
  }

  if (!app) {
    if (!firebaseConfig.apiKey) {
      throw new Error(
        "Kunci Firebase belum diatur di file .env (NEXT_PUBLIC_FIREBASE_API_KEY)."
      );
    }
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }

  if (!clientAuth) {
    clientAuth = getAuth(app);
  }

  return clientAuth;
}

export const googleProvider = new GoogleAuthProvider();

// Batasi pilihan akun Google hanya untuk domain kampus mahasiswa Polines (@mhs.polines.ac.id)
googleProvider.setCustomParameters({
  hd: "mhs.polines.ac.id",
  prompt: "select_account",
});
