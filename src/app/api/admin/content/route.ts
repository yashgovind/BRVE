export const runtime = "nodejs";

function errorResponse(error: unknown, stage: string) {
  const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : 500;
  const message = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : "The operation could not be completed. Please try again.";
  if (status >= 500) console.error("BRVE admin API failed", error instanceof Error ? error.name : "UnknownError");
  const safeMessage = status < 500 || (error instanceof Error && error.name === "HttpError") ? message : "The operation could not be completed. Please try again.";
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : error instanceof Error ? error.name : "UnknownError";
  const detail = error instanceof Error ? error.message.replace(/[\r\n]/g, " ").slice(0, 120) : "";
  return Response.json({ error: safeMessage, ...(status >= 500 ? { diagnostic: `${stage}:${code}:${detail}` } : {}) }, { status });
}

export async function GET(request: Request) {
  let stage = "loading-authorization";
  try {
    const { requireAdmin } = await import("@/lib/firebase/auth");
    stage = "checking-admin-token";
    await requireAdmin(request);
    stage = "loading-admin-data";
    const [{ adminDb }, { settingsSchema }, { publicVideo }] = await Promise.all([
      import("@/lib/firebase/admin"), import("@/lib/validation"), import("@/lib/firebase/data"),
    ]);
    const db = adminDb();
    const [videos, settings] = await Promise.all([db.collection("videos").orderBy("order").limit(100).get(), db.collection("siteSettings").doc("general").get()]);
    const raw = settings.data() || {};
    const general = Object.fromEntries(Object.keys(settingsSchema.shape).filter(k => k in raw).map(k => [k, raw[k]]));
    return Response.json({ videos: videos.docs.map(d => publicVideo(d.id, d.data())).filter(Boolean), settings: general }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, stage); }
}
export async function PUT(request: Request) {
  let stage = "loading-authorization";
  try {
    const { requireAdmin, readJson, HttpError } = await import("@/lib/firebase/auth");
    stage = "checking-admin-token";
    await requireAdmin(request);
    stage = "loading-admin-data";
    const [{ revalidateTag }, { FieldValue, Timestamp }, { adminDb }, { canUseImage, settingsSchema, videoSchema }] = await Promise.all([
      import("next/cache"), import("firebase-admin/firestore"), import("@/lib/firebase/admin"), import("@/lib/validation"),
    ]);
    const body = await readJson(request);
    if (body?.kind === "video") {
      const result = videoSchema.safeParse(body.data);
      if (!result.success) throw new HttpError(400, result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
      if (result.data.provider === "hosted" && result.data.duration) {
        const match = result.data.duration.match(/^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/i);
        const seconds = match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : Number.NaN;
        if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 120) throw new HttpError(400, "Hosted videos must be 2 minutes or shorter.");
      }
      if (!canUseImage(result.data.thumbnail)) throw new HttpError(400, "Add the thumbnail host to MEDIA_IMAGE_HOSTS before saving this image URL.");
      const { id, publishedAt, ...video } = result.data;
      await adminDb().collection("videos").doc(id).set({ ...video, ...(publishedAt ? { publishedAt: Timestamp.fromDate(new Date(publishedAt)) } : {}), updatedAt: FieldValue.serverTimestamp() });
      revalidateTag("videos", { expire: 0 });
    } else if (body?.kind === "settings") {
      const result = settingsSchema.safeParse(body.data);
      if (!result.success) throw new HttpError(400, result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
      await adminDb().collection("siteSettings").doc("general").set({ ...result.data, updatedAt: FieldValue.serverTimestamp() });
      revalidateTag("siteSettings", { expire: 0 });
    } else throw new HttpError(400, "Choose video or settings.");
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error, stage); }
}
