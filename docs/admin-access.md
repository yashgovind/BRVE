# Admin access

The user authorized a private admin area for video metadata and the external
contact-form link, with one Google account allowed: `2brveai@gmail.com`.
The public homepage remains accessible without authentication.

Firebase Storage is out of scope. Video records reference externally hosted
media, YouTube, or Vimeo; the admin area does not upload video files.

## Required enforcement

- Keep `ADMIN_EMAIL` server-only.
- Verify Firebase ID tokens or session cookies using the Admin SDK before
  granting access. Never trust an email submitted by the browser.
- Require a verified email, Google sign-in provider, and an exact normalized
  match to the configured admin email. Fail closed when configuration is absent.
- Enforce authorization for every protected read and mutation, not only the UI.
- Protect cookie-authenticated mutations against CSRF and validate input.
- Deny anonymous and ordinary signed-in users direct Firestore writes.
- No service-account private keys or session secrets in client bundles or Git.

## Status

The Google sign-in UI and server-side authorization are implemented. Every
admin read, update, and synchronization request verifies a Firebase bearer token,
its revocation status, verified email, Google provider, and the configured account.
Firebase server credentials are still required to exercise the live integration.
No deployed rules or live data were changed.
