"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { browserSessionPersistence, getAuth, GoogleAuthProvider, onAuthStateChanged, setPersistence, signInWithPopup, signOut, type User } from "firebase/auth";
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { getFirebaseClientApp } from "@/lib/firebase/client";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import type { SiteSettings, Video } from "@/types/site";

const settingsFields = ["contactFormUrl", "instagramUrl", "linkedinUrl", "youtubeUrl", "journalUrl"] as const;
const settingsNames = ["Google Form URL", "Instagram URL", "LinkedIn URL", "YouTube URL", "Blogger homepage URL"];
const MAX_DURATION = 120;

function readVideo(file: File): Promise<{ duration: number; poster: Blob }> {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const clean = () => { URL.revokeObjectURL(source); video.removeAttribute("src"); video.load(); };
    video.onerror = () => { clean(); reject(new Error("This video file could not be read. Try an MP4 or WebM file.")); };
    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) { clean(); reject(new Error("Could not read this video’s duration.")); return; }
      if (video.duration > MAX_DURATION) { const duration = Math.ceil(video.duration); clean(); reject(new Error(`This video is ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}. Choose a video of 2 minutes or less.`)); return; }
      video.currentTime = Math.min(.25, video.duration / 2);
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, 1280 / video.videoWidth);
          canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Could not create a poster image.");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const duration = video.duration;
          canvas.toBlob(blob => {
            clean();
            if (blob) resolve({ duration, poster: blob });
            else reject(new Error("Could not create a poster image for this video."));
          }, "image/jpeg", .82);
        } catch (error) { clean(); reject(error); }
      };
    };
    video.src = source;
  });
}

function uploadFile(path: string, file: Blob, contentType: string, onProgress: (value: number) => void): Promise<string> {
  const task = uploadBytesResumable(ref(getStorage(getFirebaseClientApp()), path), file, { contentType });
  return new Promise((resolve, reject) => task.on("state_changed", snapshot => onProgress(snapshot.bytesTransferred / snapshot.totalBytes), reject, () => void getDownloadURL(task.snapshot.ref).then(resolve, reject)));
}

function makeId(title: string) {
  const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "film";
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}

export function AdminPanel({ backendReady }: { backendReady: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [poster, setPoster] = useState<Blob | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

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

  async function selectVideo(next: File | undefined) {
    if (!next) return;
    setStatus("");
    if (!next.type.startsWith("video/")) { setStatus("Choose a video file (MP4 or WebM recommended)."); return; }
    try {
      const result = await readVideo(next);
      setFile(next); setPoster(result.poster); setDuration(result.duration); setStatus("");
    } catch (error) { setFile(null); setPoster(null); setDuration(null); setStatus((error as Error).message); }
  }

  async function onPickerChange(event: ChangeEvent<HTMLInputElement>) { await selectVideo(event.target.files?.[0]); event.target.value = ""; }
  async function onDrop(event: DragEvent<HTMLButtonElement>) { event.preventDefault(); setDragging(false); await selectVideo(event.dataTransfer.files?.[0]); }

  async function addVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !poster || duration === null) { setStatus("Choose a video file first."); return; }
    setBusy(true); setProgress(0); setStatus("Uploading video…");
    const id = makeId(title);
    let videoUrl = ""; let thumbnail = "";
    let videoPath = ""; let posterPath = "";
    try {
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
      videoPath = `videos/${id}.${extension}`;
      posterPath = `thumbnails/${id}.jpg`;
      videoUrl = await uploadFile(videoPath, file, file.type, value => setProgress(Math.round(value * 75)));
      setStatus("Creating poster…");
      thumbnail = await uploadFile(posterPath, poster, "image/jpeg", value => setProgress(75 + Math.round(value * 15)));
      const nextOrder = Math.max(-1, ...videos.map(video => video.order)) + 1;
      const video: Video = { id, title: title.trim(), thumbnail, videoUrl, provider: "hosted", duration: `PT${duration.toFixed(2)}S`, featured: true, order: nextOrder, active: true };
      await api("/api/admin/content", { method: "PUT", body: JSON.stringify({ kind: "video", data: video }) });
      await load(); setTitle(""); setFile(null); setPoster(null); setDuration(null); setProgress(100); setStatus("Video added and published.");
    } catch (error) {
      const storage = getStorage(getFirebaseClientApp());
      if (videoPath) void deleteObject(ref(storage, videoPath)).catch(() => undefined);
      if (posterPath) void deleteObject(ref(storage, posterPath)).catch(() => undefined);
      const uploadError = error as { message?: string; code?: string };
      setStatus(uploadError.code === "storage/unauthorized"
        ? "Upload blocked by Firebase Storage rules. Enable Storage and deploy the included storage.rules file."
        : uploadError.message || "Upload could not complete. Check that Firebase Storage is enabled and try again.");
    }
    finally { setBusy(false); }
  }

  async function setVideoActive(video: Video) {
    setBusy(true); setStatus("");
    try { await api("/api/admin/content", { method: "PUT", body: JSON.stringify({ kind: "video", data: { ...video, active: !video.active } }) }); await load(); }
    catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try { await api("/api/admin/content", { method: "PUT", body: JSON.stringify({ kind: "settings", data: settings }) }); await load(); setStatus("Site settings saved to Firestore."); }
    catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }

  async function sync() {
    setBusy(true); setStatus("Synchronizing Blogger…");
    try { const result = await api("/api/sync/blogger", { method: "POST" }); setStatus(`Synced ${result.synced} posts. ${result.removed} removed posts hidden.`); }
    catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }

  return <main className="admin-shell">
    <header className="admin-header"><Link href="/" aria-label="BRVE homepage"><Logo /></Link><Link href="/" className="eyebrow">← Website preview</Link></header>
    <div className="admin-intro"><span className="eyebrow">Private administration</span><h1>BRVE control room.</h1><p>Manage video links, site settings, and Blogger synchronization.</p></div>
    {!backendReady && <div className="admin-notice"><strong>Server connection pending.</strong><p>Google sign-in is configured. To verify admin access and save to Firestore, configure a Firebase service account on the server. No live edits are enabled until then.</p></div>}
    <div className="admin-auth">{user ? <><span>{user.email}</span><button className="admin-button secondary" onClick={() => void signOut(getAuth(getFirebaseClientApp()))}>Sign out</button></> : <button className="admin-button" disabled={!authReady || busy} onClick={login}>{authReady ? "Sign in with Google" : "Loading sign-in…"}</button>}</div>
    {status && <p role="status" className="admin-status">{status}{busy && progress > 0 && <span className="upload-progress-text"> {progress}%</span>}</p>}
    {authorized && <div className="admin-grid">
      <section className="admin-panel admin-video-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Video library</span><h2>Add a film</h2></div><span className="admin-count">{videos.length.toString().padStart(2, "0")} films</span></div>
        <form className="video-upload-form" onSubmit={addVideo}>
          <label className="upload-field-label" htmlFor="new-video-title">Video title</label>
          <input id="new-video-title" className="upload-title" required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} placeholder="Enter the film title" />
          <input ref={picker} className="visually-hidden-file" type="file" accept="video/mp4,video/webm,video/quicktime,video/*" onChange={onPickerChange} aria-label="Choose a video file" />
          <button className={`video-drop-card${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`} type="button" onClick={() => picker.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} aria-describedby="video-upload-help">
            <span className="drop-icon" aria-hidden="true">{file ? "✓" : "↑"}</span><span className="drop-title">{file ? file.name : "Choose a video or drop it here"}</span><span className="drop-subtitle">Select from your files · MP4 or WebM</span>
            {duration !== null && <span className="drop-duration">{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")} / 2:00 max</span>}
          </button>
          <p id="video-upload-help" className="upload-help">Videos longer than 2 minutes are not accepted. We’ll create the poster image automatically.</p>
          <button className="admin-button upload-submit" disabled={busy || !file || !title.trim()}>{busy && progress > 0 ? `Uploading ${progress}%` : "Upload and publish video"}<span aria-hidden="true">↗</span></button>
        </form>
        {videos.length > 0 && <div className="video-library"><h3>Published videos</h3>{videos.map(video => <div key={video.id} className="video-library-item"><span className="video-library-dot" data-active={video.active} /><span className="video-library-title">{video.title}</span><button type="button" className="video-visibility" disabled={busy} onClick={() => void setVideoActive(video)}>{video.active ? "Live · hide" : "Hidden · publish"}</button></div>)}</div>}
      </section>
      <div className="admin-side-column"><section className="admin-panel"><span className="eyebrow">Configuration</span><h2>Site settings</h2><form onSubmit={saveSettings}>{settingsFields.map((field, i) => <label key={field}>{settingsNames[i]}<input value={settings[field] || ""} onChange={event => setSettings({ ...settings, [field]: event.target.value })} placeholder="https://" /></label>)}<button className="admin-button" disabled={busy}>Save settings</button></form></section>
        <section className="admin-panel admin-blogger-panel"><span className="eyebrow">Editorial</span><h2>Blogger</h2><p className="admin-help">Sync published posts from Blogger into Firestore. Existing featured and ordering settings are preserved. Missing posts are hidden, not deleted.</p><button className="admin-button secondary" disabled={busy} onClick={sync}>Sync Blogger now <span aria-hidden="true">↗</span></button></section></div>
    </div>}
  </main>;
}
