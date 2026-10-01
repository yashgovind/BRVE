import "server-only";
import { adminAuth, hasAdminCredentials } from "./admin";
import { isAllowedAdmin } from "./authorization";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function requireAdmin(request: Request) {
  const bearer = request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ")) throw new HttpError(401, "Sign in with the authorized Google account.");
  if (!hasAdminCredentials() || !process.env.ADMIN_EMAIL) throw new HttpError(503, "Firebase server credentials must be configured before admin access can be verified.");
  let token;
  try { token = await adminAuth().verifyIdToken(bearer.slice(7), true); }
  catch { throw new HttpError(401, "Your session is invalid or expired. Please sign in again."); }
  if (!isAllowedAdmin(token, process.env.ADMIN_EMAIL)) throw new HttpError(403, "This Google account is not authorized to manage BRVE.");
  return token;
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "JSON content is required.");
  if (Number(request.headers.get("content-length") || 0) > 20000) throw new HttpError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body is required.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 20000) { await reader.cancel(); throw new HttpError(413, "Request is too large."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError(400, "Invalid JSON."); }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  console.error("BRVE API operation failed", error instanceof Error ? error.name : "UnknownError");
  return Response.json({ error: "The operation could not be completed. Please try again." }, { status: 500 });
}
