import { validateChatLead } from "@/lib/chatbot";
import { resolveGoogleAppsScriptUrl } from "@/lib/google-form-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 5000) return jsonError("That message is too long. Please shorten it and try again.", 413);
  let body: unknown;
  try { body = JSON.parse(raw); }
  catch { return jsonError("The request was not valid. Please try again.", 400); }
  if (body && typeof body === "object" && "website" in body && body.website) return Response.json({ ok: true });

  const result = validateChatLead(body);
  if (!result.success) return jsonError(result.error, 400);

  const bridgeUrl = resolveGoogleAppsScriptUrl(process.env.GOOGLE_FORM_BRIDGE_URL);
  const secret = process.env.GOOGLE_FORM_BRIDGE_SECRET;
  if (!bridgeUrl || !secret) return jsonError("The Google Form handoff is not connected yet. Please use the Google Form link on the page.", 503);

  try {
    const response = await fetch(bridgeUrl, {
      method: "POST", redirect: "follow", signal: AbortSignal.timeout(12000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ ...result.data, secret }), cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as { ok?: boolean } | null;
    if (!response.ok || payload?.ok !== true) {
      console.error("BRVE form bridge rejected a lead", response.status);
      return jsonError("We couldn’t send that just now. Please try again or use the Google Form on the page.", 502);
    }
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("BRVE form bridge unavailable", error instanceof Error ? error.name : "UnknownError");
    return jsonError("We couldn’t connect to the Google Form. Please try again or use the form on the page.", 502);
  }
}
