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
  return "I can help with BRVE’s services, process, team, and AI approach. Use the contact form to tell us about your brief.";
}
