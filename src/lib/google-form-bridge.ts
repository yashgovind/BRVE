export const DEFAULT_GOOGLE_FORM_BRIDGE_URL = "https://script.google.com/macros/s/AKfycbwUmTnetzC1tCkDWk0Dpjk1QhNYpjC2pn15K9edzdV4crUCMppE5Y284fE_KYvS6O4Y/exec";

export function isGoogleAppsScriptUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "script.google.com" && /^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname);
  } catch { return false; }
}

export function resolveGoogleAppsScriptUrl(value?: string): string {
  const configured = value?.trim();
  return configured && isGoogleAppsScriptUrl(configured) ? configured : DEFAULT_GOOGLE_FORM_BRIDGE_URL;
}
