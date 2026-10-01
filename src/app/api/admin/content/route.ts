import { revalidateTag } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, readJson, apiError, HttpError } from "@/lib/firebase/auth";
import { canUseImage, settingsSchema, videoSchema } from "@/lib/validation";
import { publicVideo } from "@/lib/firebase/data";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = adminDb();
    const [videos, settings] = await Promise.all([db.collection("videos").orderBy("order").limit(100).get(), db.collection("siteSettings").doc("general").get()]);
    const raw = settings.data() || {};
    const general = Object.fromEntries(Object.keys(settingsSchema.shape).filter(k => k in raw).map(k => [k, raw[k]]));
    return Response.json({ videos: videos.docs.map(d => publicVideo(d.id, d.data())).filter(Boolean), settings: general }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await readJson(request);
    if (body?.kind === "video") {
      const result = videoSchema.safeParse(body.data);
      if (!result.success) throw new HttpError(400, result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
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
  } catch (error) { return apiError(error); }
}
