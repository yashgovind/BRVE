"use client";

import { useCallback, useEffect, useState } from "react";
import { browserSessionPersistence, getAuth, GoogleAuthProvider, onAuthStateChanged, setPersistence, signInWithPopup, signOut, type User } from "firebase/auth";
import { getFirebaseClientApp } from "@/lib/firebase/client";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import type { SiteSettings, Video } from "@/types/site";

const emptyVideo: Video = { id: "", title: "", thumbnail: "", videoUrl: "", provider: "hosted", featured: true, order: 0, active: true, heroSlide: 0 };
const textFields = ["title", "description", "thumbnail", "videoUrl", "providerId", "previewUrl", "mobilePreviewUrl", "duration"] as const;
const fieldNames: Record<string, string> = { title: "Video title", description: "Description", thumbnail: "Poster image URL", videoUrl: "Full video URL", providerId: "YouTube / Vimeo ID", previewUrl: "Muted desktop preview URL", mobilePreviewUrl: "Muted mobile preview URL", duration: "Duration (ISO 8601, e.g. PT20S)" };
const settingsFields = ["contactFormUrl", "instagramUrl", "linkedinUrl", "youtubeUrl", "journalUrl", "journalAllPostsLabel", "journalReadMoreLabel"] as const;
const settingsNames = ["Contact form URL", "Instagram URL", "LinkedIn URL", "YouTube URL", "Blogger homepage URL", "All-posts label (approved copy)", "Article link label (approved copy)"];

export function AdminPanel({ backendReady }: { backendReady: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [draft, setDraft] = useState<Video>(emptyVideo);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const api = useCallback(async (path: string, options?: RequestInit) => {
    const current = getAuth(getFirebaseClientApp()).currentUser;
    if (!current) throw new Error("Sign in first.");
    const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${await current.getIdToken()}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }, []);

  const load = useCallback(async () => {
    const data = await api("/api/admin/content");
    setVideos(data.videos); setSettings(data.settings); setAuthorized(true);
  }, [api]);

  useEffect(() => {
    try {
      return onAuthStateChanged(getAuth(getFirebaseClientApp()), current => {
        setUser(current); setAuthReady(true); setAuthorized(false);
        if (current) { setStatus("Checking admin access…"); void load().then(() => setStatus("")).catch(e => setStatus(e.message)); }
      });
    } catch { queueMicrotask(() => { setStatus("Firebase web configuration is missing."); setAuthReady(true); }); }
  }, [load]);

  async function login() {
    setBusy(true); setStatus("");
    try {
      const auth = getAuth(getFirebaseClientApp());
      await setPersistence(auth, browserSessionPersistence);
      const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      const code = (error as { code?: string }).code;
      setStatus(code === "auth/unauthorized-domain" ? "Add localhost to Firebase Authentication → Settings → Authorized domains, then try again." : code === "auth/popup-closed-by-user" ? "Sign-in was cancelled." : "Google sign-in could not complete. Check Firebase Google provider and authorized domains.");
    } finally { setBusy(false); }
  }

  async function save(kind: "video" | "settings") {
    setBusy(true); setStatus("");
    try {
      await api("/api/admin/content", { method: "PUT", body: JSON.stringify({ kind, data: kind === "video" ? draft : settings }) });
      await load(); setStatus(kind === "video" ? "Video saved to Firestore." : "Site settings saved to Firestore.");
      if (kind === "video") setExistingId(draft.id);
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }

  async function sync() {
    setBusy(true); setStatus("Synchronizing Blogger…");
    try { const result = await api("/api/sync/blogger", { method: "POST" }); setStatus(`Synced ${result.synced} posts. ${result.removed} removed posts hidden.`); }
    catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }

  return <main className="admin-shell"><header className="admin-header"><Link href="/" aria-label="BRVE homepage"><Logo /></Link><Link href="/" className="eyebrow">← Website preview</Link></header><div className="admin-intro"><span className="eyebrow">Private administration</span><h1>BRVE control room.</h1><p>Manage video links, site settings, and Blogger synchronization.</p></div>
    {!backendReady && <div className="admin-notice"><strong>Server connection pending.</strong><p>Google sign-in is configured. To verify admin access and save to Firestore, configure a Firebase service account on the server. No live edits are enabled until then.</p></div>}
    <div className="admin-auth">{user ? <><span>{user.email}</span><button className="admin-button secondary" onClick={() => void signOut(getAuth(getFirebaseClientApp()))}>Sign out</button></> : <button className="admin-button" disabled={!authReady || busy} onClick={login}>{authReady ? "Sign in with Google" : "Loading sign-in…"}</button>}</div>
    {status && <p role="status" className="admin-status">{status}</p>}
    {authorized && <div className="admin-grid"><section className="admin-panel"><h2>Videos</h2><p className="admin-help">External URLs only. Use “Active” to publish or hide a film. Lower order numbers appear first.</p><div className="admin-video-list">{videos.map(v => <button key={v.id} onClick={() => { setDraft(v); setExistingId(v.id); }} className={draft.id === v.id ? "selected" : ""}><span>{v.order.toString().padStart(2, "0")}</span>{v.title}<small>{v.active ? "Live" : "Hidden"}</small></button>)}</div><button className="admin-button secondary" onClick={() => { setDraft({ ...emptyVideo, order: videos.length }); setExistingId(null); }}>Add video</button>
      <form onSubmit={e => { e.preventDefault(); void save("video"); }}><label>Document ID<input required pattern="[a-zA-Z0-9_-]{1,100}" value={draft.id} readOnly={Boolean(existingId)} onChange={e => setDraft({ ...draft, id: e.target.value })} /></label>{textFields.map(field => <label key={field}>{fieldNames[field]}<input required={["title", "thumbnail", "videoUrl"].includes(field)} value={draft[field] || ""} onChange={e => setDraft({ ...draft, [field]: e.target.value })} /></label>)}<label>Provider<select value={draft.provider} onChange={e => setDraft({ ...draft, provider: e.target.value as Video["provider"] })}><option value="hosted">Hosted MP4</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option></select></label><div className="admin-fields-row"><label>Order<input type="number" min="0" max="10000" value={draft.order} onChange={e => setDraft({ ...draft, order: Number(e.target.value) })} /></label><label>Original hero message (1–7)<input type="number" min="1" max="7" value={(draft.heroSlide || 0) + 1} onChange={e => setDraft({ ...draft, heroSlide: Number(e.target.value) - 1 })} /></label></div><label className="checkbox-label"><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />Active</label><label className="checkbox-label"><input type="checkbox" checked={draft.featured} onChange={e => setDraft({ ...draft, featured: e.target.checked })} />Featured</label><button className="admin-button" disabled={busy}>Save video</button></form></section>
    <section className="admin-panel"><h2>Site settings</h2><form onSubmit={e => { e.preventDefault(); void save("settings"); }}>{settingsFields.map((field, i) => <label key={field}>{settingsNames[i]}<input value={settings[field] || ""} onChange={e => setSettings({ ...settings, [field]: e.target.value })} placeholder={field.endsWith("Label") ? "Approved label" : "https://"} /></label>)}<button className="admin-button" disabled={busy}>Save settings</button></form><div className="admin-sync"><h2>Blogger</h2><p className="admin-help">Sync published posts from Blogger into Firestore. Existing featured and ordering settings are preserved. Missing posts are hidden, not deleted.</p><button className="admin-button secondary" disabled={busy} onClick={sync}>Sync Blogger now</button></div></section></div>}
  </main>;
}
