import "server-only";
import { createRequire } from "node:module";

const require = createRequire(`${process.cwd()}/package.json`);
const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app") as typeof import("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth") as typeof import("firebase-admin/auth");

export function hasAdminCredentials() {
  const hasInlineCredentials = Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const hasLocalCredentialsFile = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.VERCEL);
  return hasInlineCredentials || hasLocalCredentialsFile;
}
export function getAdminApp() {
  if (!hasAdminCredentials()) throw new Error("Firebase server credentials are not configured.");
  const existing = getApps().find(app => app.name === "brve-server");
  if (existing) return existing;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const hasInlineCredentials = Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const credential = hasInlineCredentials
    ? cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n") })
    : applicationDefault();
  return initializeApp({ projectId, credential }, "brve-server");
}
export const adminDb = () => getFirestore(getAdminApp());
export const adminAuth = () => getAuth(getAdminApp());
export const adminFirestoreValues = { FieldValue, Timestamp };
