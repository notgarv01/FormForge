import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const apps = getApps();
let adminApp;

if (!apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.trim();
    // Strip surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    // Unescape escaped quotes if any
    privateKey = privateKey.replace(/\\"/g, '"').replace(/\\'/g, "'");
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase] Service account env vars missing. Backend will reject all /api/* requests until FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
  } else {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    });
    console.log(`[Firebase] Admin SDK initialized for project: ${projectId}`);
  }
} else {
  adminApp = apps[0];
}

export async function verifyIdToken(token) {
  if (!getApps().length) {
    throw new Error('Firebase Admin SDK is not initialized.');
  }
  return getAuth().verifyIdToken(token);
}

export { adminApp as admin };