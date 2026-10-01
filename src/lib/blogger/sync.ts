import "server-only";
import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { fetchAllBloggerPosts } from "./client";
import { normalizePost, syncEditorial } from "./normalize";
import { HttpError } from "@/lib/firebase/auth";

export async function syncBlogger() {
  if (!process.env.BLOGGER_BLOG_ID || !process.env.BLOGGER_API_KEY) throw new HttpError(503, "Configure BLOGGER_BLOG_ID and BLOGGER_API_KEY to enable synchronization.");
  const db = adminDb(); const lock = db.doc("_internal/bloggerSync"); const owner = randomUUID();
  await db.runTransaction(async transaction => {
    const existing = await transaction.get(lock);
    if ((existing.data()?.expiresAt?.toMillis() || 0) > Date.now()) throw new HttpError(409, "A Blogger synchronization is already running.");
    transaction.set(lock, { owner, expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000) });
  });
  try {
    // Complete and validate the entire source before mutating any post.
    const normalized = (await fetchAllBloggerPosts()).map(normalizePost);
    const existing = await db.collection("blogPosts").where("sourceBlogId", "==", process.env.BLOGGER_BLOG_ID).get();
    const byId = new Map(existing.docs.map(d => [d.id, d.data()]));
    // Adopt older records without losing the editor's visibility and ordering.
    // Never overwrite a document explicitly belonging to another blog.
    const unscoped = normalized.filter(p => !byId.has(p.bloggerPostId));
    for (let offset = 0; offset < unscoped.length; offset += 400) {
      const records = await db.getAll(...unscoped.slice(offset, offset + 400).map(p => db.collection("blogPosts").doc(p.bloggerPostId)));
      for (const record of records) {
        const previous = record.data();
        if (previous?.sourceBlogId && previous.sourceBlogId !== process.env.BLOGGER_BLOG_ID) throw new HttpError(409, "A post ID belongs to a different configured blog.");
        if (previous) byId.set(record.id, previous);
      }
    }
    const ids = new Set(normalized.map(p => p.bloggerPostId));
    const now = Timestamp.now();
    // Upserts must all succeed before any removals are marked. An interrupted
    // upsert is safe to retry; it never triggers the removal pass.
    for (let offset = 0; offset < normalized.length; offset += 400) {
      const batch = db.batch();
      for (const p of normalized.slice(offset, offset + 400)) {
        const previous = byId.get(p.bloggerPostId);
        batch.set(db.collection("blogPosts").doc(p.bloggerPostId), { ...p, ...syncEditorial(previous), sourceBlogId: process.env.BLOGGER_BLOG_ID, sourceRemoved: false, publishedAt: Timestamp.fromDate(new Date(p.publishedAt)), updatedAt: p.updatedAt ? Timestamp.fromDate(new Date(p.updatedAt)) : FieldValue.delete(), coverImage: p.coverImage || FieldValue.delete(), author: p.author || FieldValue.delete(), syncedAt: now }, { merge: true });
      }
      await batch.commit();
    }
    const removed = existing.docs.filter(d => !ids.has(d.id));
    for (let offset = 0; offset < removed.length; offset += 400) {
      const batch = db.batch();
      removed.slice(offset, offset + 400).forEach(d => batch.update(d.ref, { sourceRemoved: true, syncedAt: now }));
      await batch.commit();
    }
    return { synced: normalized.length, removed: removed.length, syncedAt: now.toDate().toISOString() };
  } finally {
    await db.runTransaction(async transaction => { const current = await transaction.get(lock); if (current.data()?.owner === owner) transaction.delete(lock); });
  }
}
