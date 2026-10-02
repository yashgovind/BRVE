# BRVE.AI

A cinematic creative-agency website built with Next.js, Firebase, and Google Blogger. The site brings together campaign films, services, the team, journal posts, and a Google Form contact flow.

**Domain:** [brveai.com](https://brveai.com) · **Journal:** [2brveai.blogspot.com](https://2brveai.blogspot.com/) · **Repository:** [yashgovind/BRVE](https://github.com/yashgovind/BRVE)

## Start here

- **Run the website on your computer:** follow [Local setup](#local-setup).
- **Upload videos or change the Google Form:** see [Managing content](#managing-content).
- **Publish the website:** follow [Deploy to Vercel](#deploy-to-vercel).
- **Something is not working:** check [Troubleshooting](#troubleshooting).

## What the website includes

- One-page agency experience with responsive layouts and section navigation.
- A muted video hero that advances when a clip finishes and loops through the playlist.
- A film gallery with fullscreen playback, desktop 3D effects, and simpler mobile and reduced-motion alternatives.
- Google, email/password, and phone sign-in.
- An admin area for videos, Blogger synchronization, and site settings.
- A horizontal journal carousel populated from Google Blogger through Firestore.
- A configurable Google Form CTA and support links that open Gmail compose.

Visitors who are signed out are routed to `/sign-in`. The main website is at `/`; management is at `/admin`. The sign-in gate controls navigation, but it does not make the marketing content or media private. It also affects how search engines can access the homepage.

## How the pieces fit together

| Tool | What it does |
| --- | --- |
| Next.js, React, TypeScript | Build the pages and server endpoints |
| Tailwind CSS and custom CSS | Control layout, colors, typography, and responsive styling |
| Motion and GSAP ScrollTrigger | Animate navigation, text, and scrolling |
| React Three Fiber / Three.js | Provide the enhanced desktop film gallery |
| Firebase Authentication | Sign users in |
| Firestore | Store video records, journal posts, and site settings |
| Firebase Storage | Store videos and thumbnails uploaded through admin |
| Google Blogger | Remain the source of truth for journal articles |
| Vercel | Build and host the website |

Fonts and the supplied optimized campaign media are included in `public/`. The site is a native Next.js application; it does not embed the Claude Design viewer.

## Local setup

### 1. Install the tools

Install **Node.js 22.x**, which includes npm, and **Git**. You also need access to the Firebase project to use sign-in and live content.

Check your installation in a terminal:

```bash
node --version
npm --version
git --version
```

### 2. Download the project

```bash
git clone https://github.com/yashgovind/BRVE.git
cd BRVE
npm ci
```

`npm ci` installs the dependency versions recorded in the lockfile.

### 3. Create your local configuration

Copy the example file **only if you do not already have `.env.local`**:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead.

Open `.env.local` in a text editor and fill in the values described below. The leading dot makes the file hidden in some file managers. In Dolphin, press **Alt + .** to show hidden files.

`.env.local` is excluded from Git. Keep it and Firebase service-account JSON files off GitHub. The tracked `.env.example` contains the variable names, not credentials.

### 4. Start the website

```bash
npm run dev
```

Open **http://localhost:3000**. Sign in to access the homepage. Use **Ctrl+C** in the terminal to stop the server. Restart it after changing `.env.local`.

## Firebase configuration

Use the same Firebase project for the web app configuration, server credentials, database, and storage bucket.

### Web app values

In [Firebase Console](https://console.firebase.google.com/), open **Project settings → General → Your apps**. Register a web app if needed and copy its configuration into these variables:

| Firebase value | Environment variable |
| --- | --- |
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

`NEXT_PUBLIC_` values are available to the browser. Never use this prefix for service-account credentials or the Blogger API key. `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is optional; this application does not currently initialize Analytics.

### Server credentials

The server uses the Firebase Admin SDK to read content and perform authorized updates.

1. Open **Project settings → Service accounts → Firebase Admin SDK**.
2. Generate a private key and keep the downloaded JSON outside this repository.
3. Copy these fields into `.env.local` or Vercel's environment settings:

| Field in the JSON file | Environment variable |
| --- | --- |
| `project_id` | `FIREBASE_ADMIN_PROJECT_ID` |
| `client_email` | `FIREBASE_ADMIN_CLIENT_EMAIL` |
| `private_key` | `FIREBASE_ADMIN_PRIVATE_KEY` |

Keep the complete private key, including its BEGIN/END lines. The application accepts escaped `\n` line breaks. In a `.env` file, quote the value; when entering it directly in Vercel, paste the key value without the surrounding JSON quotes.

For local development, you can alternatively set `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of the downloaded JSON file.

**Do not set `GOOGLE_APPLICATION_CREDENTIALS` on Vercel.** A path on your computer does not exist there, and this variable takes priority over the three credential fields above.

### Sign-in and authorized domains

In **Authentication → Sign-in method**, enable **Google**, **Email/Password**, and **Phone** for the methods you want to offer. Configure the allowed SMS regions for phone sign-in.

In **Authentication → Settings → Authorized domains**, add the hostnames you use:

- `localhost` for local Google sign-in.
- Your actual Vercel hostname, such as `your-project.vercel.app`.
- `brveai.com` and `www.brveai.com` for the production domain.

Use hostnames without `https://` or paths. Test phone sign-in on an authorized hosted domain; this application's local sign-in page disables SMS requests on localhost. See the [Firebase Google sign-in guide](https://firebase.google.com/docs/auth/web/google-signin) for provider configuration.

Set `ADMIN_EMAIL` to the Google account allowed to manage the site. Admin API access requires a verified Google sign-in matching this setting. Ordinary signed-in users do not receive admin access.

### Database and upload rules

Create a Firestore database and initialize Firebase Storage if you want file uploads. The app uses:

| Collection / document | Contents |
| --- | --- |
| `videos` | Titles, media URLs, thumbnails, ordering, and visibility |
| `blogPosts` | Normalized articles synchronized from Blogger |
| `siteSettings/general` | Google Form URL and social links |

Install the Firebase CLI, sign in, and deploy the repository's rules to **your intended project**:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage --project YOUR_FIREBASE_PROJECT_ID
```

Replace `YOUR_FIREBASE_PROJECT_ID` before running the command. If Storage is not initialized, deploy just `firestore:rules,firestore:indexes` first.

The current `storage.rules` explicitly allows uploads for `2brveai@gmail.com`. If the administrator changes, update that rule as well as `ADMIN_EMAIL`, then deploy the rules again. Do not replace the rules with unrestricted public writes.

## Managing content

Sign in with the admin Google account and open `/admin`, or use the **Admin** navigation link when available.

### Add a video

1. Choose a video file in the upload card.
2. Enter its title and complete the available fields.
3. Save it, then check it on the homepage.

The upload interface rejects videos longer than **2 minutes** and generates a thumbnail. The duration check runs in the browser; it is not a server-side media inspection. Firebase Storage must be configured and its rules deployed for uploads to work.

To add the seven supplied films to a new database, run this once after configuring server credentials:

```bash
node --env-file=.env.local --import tsx scripts/seed-videos.ts
```

This creates missing video records only. It does not overwrite existing records or upload files; the supplied films are already in `public/media/`.

### Set the contact form

In admin site settings, paste the public Google Form responder link into **Google Form URL** and save. The existing contact CTA uses this setting. It is stored as `siteSettings/general.contactFormUrl`.

### Publish journal posts

Write and publish articles in [Blogger](https://www.blogger.com/), then click **Sync Blogger now** in admin. The website displays up to four eligible synchronized posts and links readers to the original Blogger articles.

## Connect Google Blogger

1. In [Google Cloud Console](https://console.cloud.google.com/), enable **Blogger API v3**.
2. Create an API key and restrict its API access to Blogger API v3. This project calls Blogger from the server, so browser-referrer restrictions are not appropriate.
3. Add `BLOGGER_API_KEY` and `BLOGGER_BLOG_ID` to the environment.
4. Restart locally, or redeploy on Vercel, then run **Sync Blogger now**.

The BRVE blog is `https://2brveai.blogspot.com/`; its configured blog ID is `7828446924761889663`. Public Blogger content can be read using an API key; private-blog OAuth is not implemented. [Blogger API documentation](https://developers.google.com/blogger/docs/3.0/using).

```text
Blogger → protected server sync → Firestore → homepage journal
```

Sync updates articles while preserving editorial settings. Articles removed from the source are hidden from the public feed rather than deleted from Firestore. An empty blog produces an empty journal state.

Manual sync is sufficient for occasional publishing. No cron job is configured. For a future external scheduler, `/api/sync/blogger` accepts a bearer `SYNC_SECRET` of at least 32 characters. This secret is optional when using the authenticated admin sync button.

## Deploy to Vercel

1. Sign in to [Vercel](https://vercel.com/) and import `yashgovind/BRVE` from GitHub.
2. Use the **Next.js** preset and the repository root as the root directory. Keep the default build and output settings.
3. Add environment variables before deploying. You can import `.env.local` through the environment-variable import control.
4. **Remove `GOOGLE_APPLICATION_CREDENTIALS`** from the imported variables. Use the three `FIREBASE_ADMIN_*` fields instead.
5. Set **`LOCAL_CONTENT_PREVIEW=false`** and include the Firebase web values, server credentials, `ADMIN_EMAIL`, and Blogger values.
6. Deploy, add the resulting hostname to Firebase's authorized domains, and test sign-in, videos, admin uploads, the contact form, and Blogger sync.

Select Production and any Preview environments that need these values. Redeploy after changing environment variables; existing deployments do not receive changes automatically. See [Vercel environment variables](https://vercel.com/docs/environment-variables) and [Git deployment](https://vercel.com/docs/git).

Once Git integration is connected, pushes to the configured production branch—normally `main`—can trigger deployments automatically.

### Connect the domain

In Vercel's project domain settings, add `brveai.com` and `www.brveai.com`. Use **`brveai.com` as canonical** and redirect `www` to it.

At your domain provider, enter the exact DNS records Vercel shows for this project. Do not guess the record values. Verify the domain and HTTPS in Vercel, then confirm both hostnames are authorized in Firebase Authentication.

## Everyday development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Check code quality |
| `npm test` | Run unit tests for validation, authorization, and Blogger data handling |
| `npm run build` | Create a production build |
| `npm start` | Run the production build locally; run `build` first |
| `npm run test:e2e` | Run browser tests against a running local server |

For browser tests, install Chromium first with `npx playwright install chromium`. Tests that interact with the homepage may need updates or authenticated test state to account for the current sign-in gate; do not treat old browser-test results as validation of the latest login flow.

### Where to edit things

```text
src/
  app/                  Pages, metadata, global CSS, and API endpoints
  components/
    admin/              Video uploads and site settings
    auth/               Sign-in methods and homepage gate
    layout/             Navigation
    sections/           Homepage sections
    motion/             Scroll and reveal animations
    three/              Desktop film gallery enhancement
    ui/                 Reusable controls and media players
  content/              Static copy, founder details, local video manifest
  lib/
    firebase/           Firebase initialization, data access, authorization
    blogger/            Blogger fetching, normalization, synchronization
  types/                Shared TypeScript types
public/                 Fonts, branding, avatars, optimized media
scripts/                Media preparation and initial video records
tests/                  Unit and browser tests
```

Keep approved website copy unchanged unless a content edit is explicitly requested. Some founder biographies still contain source placeholder text and need editorial approval. Founder portraits are stylized AI-generated avatars.

`LOCAL_CONTENT_PREVIEW=true` is an optional local video fallback when Firestore has no videos. It does not bypass sign-in or generate sample journal posts, and it is disabled in Vercel production.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `.env.local` is missing from the folder view | Enable hidden files. It sits beside `package.json`, not inside `src/`. |
| Firebase says the domain is unauthorized | Add the exact hostname in Authentication → Settings → Authorized domains. |
| Admin link or access is missing | Use Google sign-in with the verified account matching `ADMIN_EMAIL`. |
| The deployed site has no live videos or settings | Check all three Firebase Admin variables, remove `GOOGLE_APPLICATION_CREDENTIALS` on Vercel, and review server logs. |
| Uploaded videos are rejected | Check the 2-minute limit, Storage setup, and deployed admin upload rules. |
| Journal is empty | Publish public Blogger posts, verify the API key/blog ID, and run the admin sync. |
| Contact CTA is disabled | Save a valid Google Form responder URL in admin site settings. |
| Environment changes have no effect | Restart the local server or redeploy on Vercel. |
| Hydration warning mentions `data-darkreader` | Disable Dark Reader for the site and reload to check whether the extension is modifying the page. |
| Support opens Gmail but mail is not delivered | The link opens compose only; `support@brveai.com` needs a separately configured mailbox. |

## License

See [LICENSE](LICENSE).
