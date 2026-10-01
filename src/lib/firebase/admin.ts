import "server-only";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export function hasAdminCredentials() {
  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY));
}
export function getAdminApp() {
  if (!hasAdminCredentials()) throw new Error("Firebase server credentials are not configured.");
  const existing = getApps().find(app => app.name === "brve-server");
  if (existing) return existing;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n") });
  return initializeApp({ projectId, credential }, "brve-server");
}
export const adminDb = () => getFirestore(getAdminApp());
export const adminAuth = () => getAuth(getAdminApp());
