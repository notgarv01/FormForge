import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const apps = getApps();
let adminApp;

if (!apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

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