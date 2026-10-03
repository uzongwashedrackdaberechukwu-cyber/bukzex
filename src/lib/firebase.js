import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Firebase Auth once with durable browser storage. IndexedDB is
// preferred, with browser local storage as a fallback for mobile browsers.
let initializedAuth;
try {
  initializedAuth = initializeAuth(firebaseApp, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });
} catch (error) {
  if (error?.code !== "auth/already-initialized") throw error;
  initializedAuth = getAuth(firebaseApp);
}
export const auth = initializedAuth;
// Hold sign-in and registration until Firebase has restored the saved
// browser session and finished selecting its configured persistence store.
export const authPersistenceReady = auth.authStateReady();
export const db = getFirestore(firebaseApp);
