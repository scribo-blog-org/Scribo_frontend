# Scribo frontend

Web client for the Scribo blog platform: reading, writing, accounts, search, support, and the admin panel.

**Vite 8** + **React 18** + **React Router 7**. Talks to **Scribo_nest** (`/api/...`). Version `4.0.0` matches the API package.

## Stack

| Layer | Choice |
| --- | --- |
| Bundler | Vite (dev server default port **3000**) |
| UI | React 18, SCSS, Geist |
| Routing | react-router-dom 7 |
| Editor | Lexical (posts) |
| Auth UI | JWT in memory + refresh cookie; Google Identity (`@react-oauth/google`) |
| API docs page | Swagger UI (`/api` in the app), spec from the backend |

Design tokens live in `src/styles/theme.scss`. Keep canvas / object / field roles from that file; do not wrap the feed in extra cards.

## Features

- Feed, article, search (including hashtags)
- Register / login (email + Google), password reset, sessions in settings
- Create and edit posts, categories, hashtag suggestions
- Comments with nested replies
- Profiles, follow, saved posts, likes, share, view counts
- Support tickets (user + admin)
- Admin panel: users, categories, logs, analytics dashboard
- Light / dark theme
- In-app API reference at `/api`

## Requirements

- Node.js 20+ (22.x matches the API)
- Running Scribo API (see `../Scribo_nest`)
- Google Cloud OAuth 2.0 **Web client** id for Google sign-in

## Setup

```bash
cd Scribo_frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`. If that port is taken, Vite picks the next one (e.g. 3001/3002); put the real origin in the API `FRONTEND_ORIGIN`.

`npm start` is an alias of `npm run dev`.

## Environment

Vite only exposes variables prefixed with `VITE_`. Restart the dev server after changing `.env`.

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_APP_API_URL` | yes | API origin **without** a trailing slash, e.g. `http://localhost:3001` |
| `VITE_GOOGLE_CLIENT_ID` | for Google login | OAuth web client id |
| `VITE_APP_VERCEL_PROJECT_PRODUCTION_URL` | for share/copy, SEO, sitemap | Host only, no `https://` — e.g. `scribo-blog.vercel.app` |

Example local file:

```env
VITE_APP_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=
VITE_APP_VERCEL_PROJECT_PRODUCTION_URL=localhost:3000
```

Requests use `credentials: 'include'` so the refresh cookie is sent. The API must list this app’s origin in `FRONTEND_ORIGIN` (production) or allow localhost (non-production).

## Scripts

```bash
npm run dev        # Vite
npm start          # same
npm run build      # lint + sitemap, then production bundle → dist/
npm run generate:sitemap
npm run preview    # serve dist/
npm run lint
npm run lint:fix
```

`prebuild` runs ESLint and `generate:sitemap` (writes `public/sitemap.xml` and `public/robots.txt` from the API when it is reachable).

## SEO (Google)

- Per-page meta: title, description, canonical, Open Graph — `src/seo/`, `RouteSeo` in `App.jsx`, extra tags on article and profile pages
- `public/robots.txt` — public pages allowed; admin, settings, messages, auth, etc. disallowed
- `public/sitemap.xml` — regenerated on build via `npm run generate:sitemap` (static routes + posts and profiles from the API)
- Google Search Console verification — meta tag in `index.html` (do not remove after confirm)

After deploy, submit the sitemap in Search Console: `https://<your-domain>/sitemap.xml`.

## Layout

```
src/
  index.jsx              GoogleOAuthProvider, root
  App.jsx                routes, session restore, theme
  api/                   fetch helpers (http.js holds the access token)
  components/
  layouts/
  pages/                 posts, article, auth, settings, admin, support, api docs
  styles/                theme.scss, common.scss
  config/                API_URL
```

Notable routes:

| Path | Page |
| --- | --- |
| `/posts` | Feed |
| `/posts/:id` | Article |
| `/search` | Search |
| `/auth/login`, `/auth/register` | Auth |
| `/create-post`, `/posts/:id/edit` | Editor |
| `/users/:id` | Profile |
| `/settings` | Account / sessions |
| `/admin-panel` | Admin |
| `/support` | Support |
| `/api` | Live OpenAPI (Swagger UI) |

## Auth with the API

On load the app calls `POST /api/auth/refresh` with cookies. A new access token is kept in memory (not `localStorage`). `apiFetch` attaches `Authorization: Bearer` and retries once after refresh on 401.

Google: the browser obtains a Google access token; the API validates it via Google userinfo. Authorized JavaScript origins and redirect URIs in Google Cloud must include this frontend origin.

## Production

Static host (Vercel or any static CDN):

1. Build with production `VITE_*` values (baked in at build time).
2. Point `VITE_APP_API_URL` at the public Nest origin.
3. SPA fallback: all paths rewrite to `index.html`.
4. Align `FRONTEND_ORIGIN` on the API with the real site origin (custom domain, not only `*.vercel.app`, if you use a custom domain).

This app is a client-rendered SPA. The HTML shell title/description are in `index.html`; per-article meta is not server-rendered.
