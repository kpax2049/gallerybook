# Gallerybook v1.0.0

Release date: 2026-06-08

## Highlights

- Added production-ready backend configuration, CORS, throttling, secure cookies, and admin bootstrapping.
- Added Google and GitHub OAuth account creation/linking with refresh-token sessions.
- Added Cloudflare Turnstile verification for public email/password signup.
- Added an approval gate: new email/password and OAuth users start inactive, while protected API access requires an active account.
- Restricted gallery creation, gallery editing, and admin user management to admin users.
- Added legal pages, refreshed login/signup flows, and Docker/nginx deployment support.

## Deployment Notes

- Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`, and `ADMIN_FULL_NAME`, then run `npx prisma db seed` after migrations to create the active admin account.
- Set `TURNSTILE_SECRET_KEY` on the backend and `VITE_TURNSTILE_SITE_KEY` at frontend build time for production signup.
- Set deployed `FRONTEND_URL`, `BACKEND_URL`, and `CORS_ORIGINS` to HTTPS origins.
- Configure Google and GitHub OAuth client IDs/secrets and provider callback URLs before enabling OAuth sign-in.

## Verification

- Backend test suite passed.
- Frontend test suite passed.
- Backend and frontend production builds passed.
