import { answerCommonQuestion } from "@/lib/chatbot";
import { CHAT_SYSTEM_PROMPT, parseAssistantTurns } from "@/lib/chat-assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const rateWindows = new Map<string, { start: number; count: number }>();

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function isRateLimited(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map(part => part.trim()).filter(Boolean);
  const ip = forwarded?.at(-1) || "unknown";
  const now = Date.now();
  const window = rateWindows.get(ip);
  if (!window || now - window.start >= WINDOW_MS) {
    rateWindows.set(ip, { start: now, count: 1 });
    if (rateWindows.size > 1000) {
      for (const [key, value] of rateWindows) if (now - value.start >= WINDOW_MS) rateWindows.delete(key);
    }
    return false;
  }
  window.count += 1;
  return window.count > MAX_REQUESTS_PER_WINDOW;
}

function fallbackReply(question: string, reason: "unconfigured" | "unavailable") {
  return Response.json({ reply: answerCommonQuestion(question), provider: "fallback", reason }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (isRateLimited(request)) return jsonError("Please wait a moment before sending another message.", 429);
  const raw = await request.text();
  if (raw.length > 12_000) return jsonError("That conversation is too long. Please start a new question.", 413);

  let body: unknown;
  try { body = JSON.parse(raw); }
  catch { return jsonError("The request was not valid. Please try again.", 400); }

  const parsed = parseAssistantTurns(body);
  if (!parsed.success) return jsonError(parsed.error, 400);
  const latestQuestion = parsed.turns.at(-1)!.content;
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  if (!apiKey) return fallbackReply(latestQuestion, "unconfigured");

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || "ministral-3b-latest",
        messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...parsed.turns],
        temperature: 0.3,
        max_tokens: 220,
        stream: false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error("BRVE Mistral chat failed", response.status);
      return fallbackReply(latestQuestion, "unavailable");
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = payload.choices?.[0]?.message?.content;
    const reply = typeof content === "string" ? content.trim()
      : Array.isArray(content) ? content.map(part => part && typeof part === "object" && "text" in part && typeof part.text === "string" ? part.text : "").join("").trim()
      : "";
    if (!reply || reply.length > 4000) return fallbackReply(latestQuestion, "unavailable");
    return Response.json({ reply, provider: "mistral" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("BRVE Mistral chat unavailable", error instanceof Error ? error.name : "UnknownError");
    return fallbackReply(latestQuestion, "unavailable");
  }
}
