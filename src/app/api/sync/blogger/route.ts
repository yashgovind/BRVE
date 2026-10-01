import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { requireAdmin, apiError, HttpError } from "@/lib/firebase/auth";
import { syncBlogger } from "@/lib/blogger/sync";
import { hasAdminCredentials } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function validSecret(request: Request) {
  const secret = process.env.SYNC_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!secret || secret.length < 32 || !supplied) return false;
  return timingSafeEqual(createHash("sha256").update(secret).digest(), createHash("sha256").update(supplied).digest());
}
async function run(request: Request) {
  try {
    if (!validSecret(request)) await requireAdmin(request);
    if (!hasAdminCredentials()) throw new HttpError(503, "Firebase server credentials are not configured.");
    const result = await syncBlogger();
    revalidateTag("blogPosts", { expire: 0 });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export const POST = run;
// Protected GET is reserved for an eventual scheduler. No cron is configured.
export const GET = run;
