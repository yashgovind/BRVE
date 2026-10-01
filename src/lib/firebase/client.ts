import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";

// Called only by browser interactions that need Firebase. Public page data will
// be fetched separately on the server; Analytics is deliberately not started.
export function getFirebaseClientApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client initialization requires a browser.");
  }

  if (getApps().some((app) => app.name === "[DEFAULT]")) return getApp();

  const config: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing Firebase configuration: ${missing.join(", ")}`);
  }

  return initializeApp(config);
}
