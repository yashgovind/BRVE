export function isGoogleAppsScriptUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "script.google.com" && /^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname);
  } catch { return false; }
}
