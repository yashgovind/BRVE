/** Validate the common public email address form before calling Firebase. */
export function isValidEmailAddress(value: string): boolean {
  const email = value.trim();
  if (!email || email.length > 254 || /\s/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  if (!domain || domain.length > 253) return false;
  const labels = domain.split(".");
  const topLevel = labels.at(-1) || "";
  return labels.length > 1 && (/^[A-Z]{2,63}$/i.test(topLevel) || /^xn--[a-z0-9-]{2,59}$/i.test(topLevel)) && labels.every(label =>
    label.length > 0 && label.length <= 63 && /^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i.test(label),
  );
}

/** Normalize common human phone formatting to E.164 and reject invalid lengths. */
export function normalizePhoneNumber(value: string): string | null {
  const phone = value.trim().replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}
