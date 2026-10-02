import { isValidEmailAddress, normalizePhoneNumber } from "./auth-validation";

export const commonQuestions = [
  "What does BRVE do?",
  "How does the process work?",
  "Who will work on my brief?",
  "Can you make it go viral?",
] as const;

export function answerCommonQuestion(question: string) {
  const value = question.toLowerCase();
  if (/what (does|do)|services|offer|help/.test(value)) return "Brand. Creative. Content. Advertising. AI that earns its place.";
  if (/who|team|founder|people/.test(value)) return "You brief the people who make the work — not a handler. Nobody relays your feedback to a team you’ve never met.";
  if (/viral|guarantee/.test(value)) return "“Make it viral.” Also no. Tell us what you’re trying to solve and we’ll start with the real problem.";
  if (/ai|artificial intelligence/.test(value)) return "AI can make 500 versions of your idea. It cannot tell you all 500 are terrible. That’s our job. We don’t outsource taste.";
  if (/process|work|approach|start/.test(value)) return "Find the real problem. Then break it. We ask what the actual problem is, find the idea, make it better, ship it, and check the receipts.";
  if (/contact|brief|talk|quote|price|cost/.test(value)) return "Tell us a little about the brief and the right person at BRVE can follow up.";
  return "I can help with BRVE’s services, process, team, and AI approach. Or leave your details and tell us about the brief.";
}

export type ChatLead = { name: string; email: string; phone: string; brief: string };

export function validateChatLead(value: unknown): { success: true; data: ChatLead } | { success: false; error: string } {
  if (!value || typeof value !== "object") return { success: false, error: "Enter your contact details and brief." };
  const lead = value as Record<string, unknown>;
  const name = typeof lead.name === "string" ? lead.name.trim() : "";
  const email = typeof lead.email === "string" ? lead.email.trim() : "";
  const phone = typeof lead.phone === "string" ? normalizePhoneNumber(lead.phone) : null;
  const brief = typeof lead.brief === "string" ? lead.brief.trim() : "";
  if (name.length < 2 || name.length > 100) return { success: false, error: "Enter your name (2–100 characters)." };
  if (!isValidEmailAddress(email)) return { success: false, error: "Enter a valid email address." };
  if (!phone) return { success: false, error: "Enter a valid phone number with its country code, such as +1 415 555 2671." };
  if (brief.length < 5 || brief.length > 2000) return { success: false, error: "Tell us a little about the brief (5–2,000 characters)." };
  return { success: true, data: { name, email, phone, brief } };
}
