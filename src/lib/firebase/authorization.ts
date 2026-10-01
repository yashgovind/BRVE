// Pure authorization predicate; the caller must first cryptographically verify
// the Firebase token and check revocation with the Admin SDK.
export function isAllowedAdmin(token: { email?: string; email_verified?: boolean; firebase?: { sign_in_provider?: string } }, allowedEmail?: string) {
  return Boolean(allowedEmail?.trim() && token.email_verified === true && token.firebase?.sign_in_provider === "google.com" && token.email?.toLowerCase() === allowedEmail.trim().toLowerCase());
}
