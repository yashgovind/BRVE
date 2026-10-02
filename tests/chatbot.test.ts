import assert from "node:assert/strict";
import test from "node:test";
import { answerCommonQuestion, validateChatLead } from "../src/lib/chatbot";
import { isGoogleAppsScriptUrl } from "../src/lib/google-form-bridge";

function errorOf(value: unknown) {
  const result = validateChatLead(value);
  assert.equal(result.success, false);
  return result.success ? "" : result.error;
}

test("chatbot gives BRVE-specific answers for common questions", () => {
  assert.match(answerCommonQuestion("What services do you offer?"), /^Brand\. Creative\. Content\./);
  assert.match(answerCommonQuestion("How does your process work?"), /check the receipts/);
  assert.match(answerCommonQuestion("Who will work on my brief?"), /not a handler/);
  assert.match(answerCommonQuestion("Can you make it viral?"), /Also no/);
  assert.match(answerCommonQuestion("What is your AI approach?"), /don’t outsource taste/);
});

test("chat lead accepts normalized contact details and a brief", () => {
  assert.deepEqual(validateChatLead({ name: "  Sam Lee ", email: " SAM@EXAMPLE.COM ", phone: "+1 (415) 555-2671", brief: "We need a campaign idea." }), {
    success: true,
    data: { name: "Sam Lee", email: "SAM@EXAMPLE.COM", phone: "+14155552671", brief: "We need a campaign idea." },
  });
});

test("chat lead rejects missing, malformed, oversized, or non-object values", () => {
  assert.equal(validateChatLead(null).success, false);
  assert.match(errorOf({ name: "S", email: "sam", phone: "555", brief: "hi" }), /name/i);
  assert.match(errorOf({ name: "Sam", email: "sam@example.com", phone: "555", brief: "Need a campaign" }), /phone/i);
  assert.match(errorOf({ name: "Sam", email: "sam@example.com", phone: "+14155552671", brief: "no" }), /brief/i);
  assert.equal(validateChatLead({ name: "Sam", email: "sam@example.com", phone: "+14155552671", brief: "x".repeat(2001) }).success, false);
});

test("Google Form bridge only accepts deployed HTTPS Apps Script endpoints", () => {
  assert.equal(isGoogleAppsScriptUrl("https://script.google.com/macros/s/AKfycbxExample/exec"), true);
  assert.equal(isGoogleAppsScriptUrl("http://script.google.com/macros/s/id/exec"), false);
  assert.equal(isGoogleAppsScriptUrl("https://script.google.com.evil.example/macros/s/id/exec"), false);
  assert.equal(isGoogleAppsScriptUrl("https://example.com/macros/s/id/exec"), false);
  assert.equal(isGoogleAppsScriptUrl("https://script.google.com/"), false);
});
