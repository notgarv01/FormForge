import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup as firebaseSignInWithPopup,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseMocked = !firebaseConfig.apiKey;

let authInstance;
let googleProviderInstance;

if (isFirebaseMocked) {
  console.warn('[Firebase] API key is missing. Using local mock auth for design/development.');
  const listeners = new Set();
  
  authInstance = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      listeners.add(callback);
      // Immediately invoke with current state
      setTimeout(() => callback(authInstance.currentUser), 0);
      return () => listeners.delete(callback);
    },
    _triggerStateChange: () => {
      listeners.forEach(cb => cb(authInstance.currentUser));
    }
  };
  
  googleProviderInstance = {};
} else {
  try {
    const app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.error('Failed to initialize Firebase app. Falling back to mock auth.', error);
    isFirebaseMocked = true;
  }
}

export const auth = authInstance;
export const googleProvider = googleProviderInstance;

export async function signInWithPopup(authObj, providerObj) {
  if (isFirebaseMocked) {
    authInstance.currentUser = {
      uid: 'mock-google-user',
      email: 'google-dev@formforge.dev',
      displayName: 'Google Dev User',
      getIdToken: async () => 'mock-google-token'
    };
    authInstance._triggerStateChange();
    return { user: authInstance.currentUser };
  }
  return firebaseSignInWithPopup(authObj, providerObj);
}

export async function signInWithEmailAndPassword(authObj, email, password) {
  if (isFirebaseMocked) {
    authInstance.currentUser = {
      uid: 'mock-email-user-' + btoa(email).substring(0, 10),
      email: email,
      displayName: email.split('@')[0],
      getIdToken: async () => 'mock-email-token'
    };
    authInstance._triggerStateChange();
    return { user: authInstance.currentUser };
  }
  return firebaseSignInWithEmailAndPassword(authObj, email, password);
}

export async function createUserWithEmailAndPassword(authObj, email, password) {
  if (isFirebaseMocked) {
    authInstance.currentUser = {
      uid: 'mock-email-user-' + btoa(email).substring(0, 10),
      email: email,
      displayName: email.split('@')[0],
      getIdToken: async () => 'mock-email-token'
    };
    authInstance._triggerStateChange();
    return { user: authInstance.currentUser };
  }
  return firebaseCreateUserWithEmailAndPassword(authObj, email, password);
}

export async function signOut(authObj) {
  if (isFirebaseMocked) {
    authInstance.currentUser = null;
    authInstance._triggerStateChange();
    return;
  }
  return firebaseSignOut(authObj);
}