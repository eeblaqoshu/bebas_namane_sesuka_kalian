// lib/firebase-admin.ts
// Inisialisasi Firebase Admin SDK (hanya dijalankan di server runtime Node)
import { getApps, initializeApp, cert, getApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | undefined;
let adminAuth: Auth | null = null;

if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Tangani escape sequence \n pada private key .env
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    adminAuth = getAuth(adminApp);
  }
} else {
  adminApp = getApp();
  adminAuth = getAuth(adminApp);
}

export { adminApp, adminAuth };
