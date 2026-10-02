import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

function errorResponse(error: unknown, stage: string) {
  const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : 500;
  const message = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : "The operation could not be completed. Please try again.";
  if (status >= 500) console.error("BRVE Blogger sync failed", error instanceof Error ? error.name : "UnknownError");
  const safeMessage = status < 500 || (error instanceof Error && error.name === "HttpError") ? message : "The operation could not be completed. Please try again.";
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : error instanceof Error ? error.name : "UnknownError";
  return Response.json({ error: safeMessage, ...(status >= 500 ? { diagnostic: `${stage}:${code}` } : {}) }, { status });
}

function validSecret(request: Request) {
  const secret = process.env.SYNC_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!secret || secret.length < 32 || !supplied) return false;
  return timingSafeEqual(createHash("sha256").update(secret).digest(), createHash("sha256").update(supplied).digest());
}
async function run(request: Request) {
  let stage = "loading-authorization";
  try {
    const isSecretAuthorized = validSecret(request);
    if (!isSecretAuthorized) {
      const { requireAdmin } = await import("@/lib/firebase/auth");
      stage = "checking-admin-token";
      await requireAdmin(request);
    }
    stage = "loading-blogger-integrations";
    const [{ syncBlogger }, { hasAdminCredentials }, { revalidateTag }] = await Promise.all([
      import("@/lib/blogger/sync"), import("@/lib/firebase/admin"), import("next/cache"),
    ]);
    if (!hasAdminCredentials()) throw Object.assign(new Error("Firebase server credentials are not configured."), { status: 503, name: "HttpError" });
    const result = await syncBlogger();
    revalidateTag("blogPosts", { expire: 0 });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, stage); }
}
export const POST = run;
// Protected GET is reserved for an eventual scheduler. No cron is configured.
export const GET = run;
