# BRVE.AI — local review build

Native Next.js App Router / React / TypeScript / Tailwind site reconstructed from
the supplied Claude design. Approved source copy is in `src/content`; Claude's
viewer and runtime are not included. No deployment has been performed.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Private management UI: http://localhost:3000/admin.
The original logo and seven selected supplied films are used. Source media is
kept unchanged in `docs/compressed_noaudio`; optimized copies are in `public/media`.
`python3 scripts/prepare-media.py` regenerates them with FFmpeg.

`LOCAL_CONTENT_PREVIEW=true` enables the supplied local video manifest and source
sample feed. This flag is for local review, not a live content substitute. The
React components do not contain a hardcoded video list. When Firestore is ready,
the server reads `videos`, `blogPosts`, and `siteSettings/general` and caches each
independently. Without the preview flag, missing videos are hidden and missing
data degrades gracefully. Preview mode is always disabled on Vercel production.

## Design and motion

- Original expanded Archivo, Inter, JetBrains Mono, and Caveat fonts are self-hosted.
- Full-screen film hero; seven approved headline/response pairs are retained.
- GSAP ScrollTrigger drives camera movement through a real React Three Fiber film
  gallery, image clipping, parallax, and the typographic interlude.
- WebGL is imported only near the gallery on desktop with motion enabled. It uses
  demand rendering. Mobile, reduced-motion, and WebGL failure use the DOM gallery.
- The feed uses a large, image-led horizontal editorial rail, inspired by the
  media galleries on https://white-desert.com/. No reference assets or copy are used.
- Only the active muted preview loads. Full films load on click. Background
  playback pauses off-screen, in hidden tabs, in the player, or using its control.
- Mobile and reduced-motion users retain all content and direct controls.

## Firebase setup still required for live management

The supplied web app configuration is already in ignored `.env.local`. Google
sign-in must have `localhost` under Authentication → Settings → Authorized domains
for local testing. Only the server-configured `ADMIN_EMAIL` can manage content;
it is currently `2brveai@gmail.com`.

Firebase Console → Project settings → Service accounts → Firebase Admin SDK:
generate a service-account key and keep the downloaded JSON **outside this repo**.
Set `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json` in `.env.local`.
Alternatively, set `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and
`FIREBASE_ADMIN_PRIVATE_KEY` (escaped `\n` is supported). Never prefix server keys
with `NEXT_PUBLIC_`, paste private keys into chat, or commit them.

Use a service identity with the Firestore read/write and Firebase Auth user-read
permissions needed by these handlers. The handlers verify ID tokens and revocation,
verified email, Google provider, and the exact admin allowlist. No login cookie is
used: every API request carries an Authorization bearer token, so ambient-cookie
CSRF does not apply. Anonymous requests and other users cannot write.

The public `/sign-in` page supports Google, email/password, and phone/SMS sign-in.
Enable Google, Email/Password, and Phone in Firebase Authentication → Sign-in
method. Set an SMS region policy for phone sign-in and authorize the deployed
domain. Firebase does not support phone authentication from `localhost`; the local
page explains this and keeps SMS sending disabled there. Public sign-in creates an
identity only; Firestore writes remain restricted to the server-side admin flow.
The `/` route redirects signed-out visitors to `/sign-in`; successful sign-in
returns them to the one-page site, and signing out returns them to sign-in. This
client-side route gate is for navigation only, not a security boundary for public
marketing copy or media. Search crawlers will not normally reach the gated page.

After configuring the service account and creating Firestore, seed the seven
selected videos (creates missing records only):

```sh
node --env-file=.env.local --import tsx scripts/seed-videos.ts
```

Configure the **Google Form URL** in the admin UI. It is stored as
`siteSettings/general.contactFormUrl`; the CTA remains disabled until a valid URL
exists, and the approved email link continues to work. Video uploads and generated
posters use Firebase Storage; deploy the included `storage.rules` before enabling
uploads. The current public queries use Firestore's automatic single-field indexes,
so composite indexes are not required.

## Blogger API and synchronization

1. In Google Cloud, choose the project and enable **Blogger API v3**.
2. Create an API key restricted to Blogger API v3. The key is used server-side.
3. Set `BLOGGER_BLOG_ID=7828446924761889663` for
   `https://2brveai.blogspot.com/` and add your `BLOGGER_API_KEY` in `.env.local`.
   A public blog needs no OAuth; a private blog would need a separate OAuth flow.
4. Configure Firebase server access above, then restart the local server.
5. Sign in at `/admin` and click **Sync Blogger now**.

`POST /api/sync/blogger` accepts a verified admin bearer token or a strong
`SYNC_SECRET` bearer token (minimum 32 characters). Protected GET supports a future
scheduler; no cron or scheduled write is installed. Never send credentials in URL
parameters. Manual sync is adequate for occasional posting; a daily cron can be
added later if the publishing frequency warrants it.

The sync fetches all pages before writing, rejects invalid posts, strips HTML from
excerpts, retains only normalized fields, preserves `featured`, `order`, and
editorial `active`, and records timestamps. A lease prevents overlapping syncs.
Source removals are marked `sourceRemoved` after successful upserts, never deleted.
The removal pass is scoped to the configured source blog. Malformed API responses abort synchronization. A valid empty Blogger post list
marks previously synchronized posts from that source as removed. The public page never calls Blogger directly.

The Journal links to `https://2brveai.blogspot.com/` by default and reads only
published Blogger posts synchronized into Firestore. The feed was checked on
2026-10-02 and currently contains no published posts, so the page shows an empty
state instead of source sample articles. Once posts are published, run a Blogger
sync to display their real titles, excerpts, dates, and cover images.

## Remaining content

- Approved founder biographies (the source includes Lorem ipsum); current founder
  portraits are clearly stylized AI avatar concepts, not likeness references.
- Blogger URL/blog ID and API key; Firebase server credentials.
- Real contact form URL.
- Approved human-readable titles for the unnamed video files, if desired; original
  filenames are preserved rather than inventing campaign names.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e  # local server must be running
npm run build
```

Auth allowlisting, unsafe URLs, Blogger normalization/editorial preservation, exact
source copy, lazy playback, dialog focus, mobile navigation, gallery controls, and
unauthenticated API rejection are tested. Live Google/Firestore/Blogger success
paths still require the actual server credentials and source blog.

The lockfile pins supported TypeScript 5.9 tooling. Overrides update transitive
gRPC to 1.14.5 and gaxios's UUID to 11.1.1 to resolve audit findings without
downgrading Firebase. `npm audit` was clean after those updates.

## Release boundary

Canonical domain: https://brveai.com. No DNS, Vercel, or production configuration
was changed. Do not deploy until the local design is approved, source placeholders
are resolved, integrations are verified, and preview mode is disabled.

## Local validation — 2026-10-02

Production build, ESLint, TypeScript, and six data/security tests passed.
Playwright against the production server passed nine desktop/mobile tests; the
mobile-menu case was intentionally skipped on desktop. Headless Chrome initial
loads at 390px and 1440px had no horizontal overflow, one preview-video request,
no initial WebGL canvas, approximately 230 KB encoded script resources, and CLS
of 0 / 0.000081 respectively. These are local lab observations, not field Core
Web Vitals or a Lighthouse score. The full desktop WebGL gallery was separately
rendered and visually inspected. Live authenticated integrations remain untested
until credentials and the Blogger source are supplied.
