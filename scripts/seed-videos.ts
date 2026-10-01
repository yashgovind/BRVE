// Run only after configuring server credentials. Creates missing video records;
// it never overwrites edits to existing records and never uploads media.
import { readFile } from "node:fs/promises";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { videoSchema } from "../src/lib/validation";

async function main() {
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId || !(process.env.GOOGLE_APPLICATION_CREDENTIALS || (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY))) throw new Error("Configure Firebase server credentials before seeding.");
const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n") });
const db = getFirestore(initializeApp({ projectId, credential }));
const videos = JSON.parse(await readFile("src/content/preview-videos.json", "utf8")).map((v: unknown) => videoSchema.parse(v));
let added = 0;
for (const video of videos) {
  const ref = db.collection("videos").doc(video.id);
  const created = await db.runTransaction(async transaction => {
    if ((await transaction.get(ref)).exists) return false;
    const data = Object.fromEntries(Object.entries(video).filter(([key]) => key !== "id"));
    transaction.create(ref, { ...data, updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (created) added++;
}
console.log(`Created ${added} missing video records; existing records were preserved.`);

}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
