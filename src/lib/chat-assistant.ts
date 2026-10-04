export type AssistantTurn = { role: "user" | "assistant"; content: string };

const FACTS = `BRVE.AI is an advertising and creative agency. Its services are Brand, Creative, Content, Advertising, and AI that earns its place. Its process is: find the real problem, find the idea, make it better, ship it, and check the receipts. The team is Rajni (founder and creative director), Bhaskar Vijay (co-founder and lead designer), and Yash (tech lead). BRVE does not promise virality. The contact form asks for name, email, phone number, and a short brief.`;

export const CHAT_SYSTEM_PROMPT = `You are the BRVE.AI website assistant. Answer the visitor in a warm, direct, concise way (usually under 70 words). Use only the facts below. Do not invent prices, clients, timelines, guarantees, or services. If you do not know an answer, say so plainly and offer the contact form. Do not claim you submitted a lead or changed anything.\n\n${FACTS}`;

export function parseAssistantTurns(value: unknown): { success: true; turns: AssistantTurn[] } | { success: false; error: string } {
  if (!value || typeof value !== "object" || !("messages" in value) || !Array.isArray(value.messages)) {
    return { success: false, error: "Send a message to start the chat." };
  }
  const raw = value.messages;
  if (raw.length < 1 || raw.length > 12) return { success: false, error: "Keep the conversation to 12 messages at a time." };
  const turns: AssistantTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || !("role" in item) || !("content" in item)) {
      return { success: false, error: "One of those messages is invalid." };
    }
    const role = item.role;
    const content = item.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return { success: false, error: "One of those messages is invalid." };
    }
    const text = content.trim();
    if (!text || text.length > 1200) return { success: false, error: "Messages must be between 1 and 1,200 characters." };
    turns.push({ role, content: text });
  }
  if (turns.at(-1)?.role !== "user") return { success: false, error: "Your latest message must be from you." };
  return { success: true, turns };
}

