# Gallerybook

Gallerybook is a full-stack app for creating and sharing rich, image-heavy galleries with tags, reactions, comments, follows, and admin-managed publishing.

## Product Overview

- Create and publish galleries with a rich-text editor and embedded images.
- Upload images directly to S3 with presigned URLs and serve via CloudFront.
- Organize content with tags, drafts, and search/sort filters.
- Social engagement: likes, favorites, comments, comment reactions, and gallery reactions.
- Follow other users to build a personalized gallery feed.
- Profile management with avatar uploads, display names, and usernames.
- Email/password auth plus Google and GitHub OAuth sign-in.
- Terms and privacy pages linked from the login flow.

## Tech Stack

- Frontend: React 18 + Vite 6 + TypeScript 6 + Tailwind 4 + shadcn/ui
- Backend: NestJS 11 + Prisma 6 + PostgreSQL
- Media: AWS S3 + CloudFront (gallery images), Cloudinary (avatars)
- Auth: JWT access tokens + HTTP-only refresh-token cookies

## Project Structure

```
backend/                 NestJS API (Prisma, auth, galleries, comments, follow, profile)
frontend/                React app (Vite, Tailwind, shadcn/ui)
frontend/nginx.conf      Production nginx config with SPA fallback
docker-compose.yml       Backend plus dev/test Postgres services
```

## Requirements

- Node.js 20+
- npm
- Docker (for Postgres and production container builds)

## Local Development

### 1) Start Postgres

```
docker compose up -d postgres_db
```

The dev database is exposed on `localhost:5434` with database `nest_db`, user `postgres`, and password `secret`.

### 2) Backend

```
cd backend
npm install

# create .env from scratch (see Environment Variables below)
npm run prisma:dev:deploy
npx prisma db seed
npm run start:dev
```

Default backend port is `3333` (set `PORT` to change). CORS uses `CORS_ORIGINS` when set, otherwise it allows `FRONTEND_URL` plus local Vite ports `5173`, `5174`, and `5175`.

### 3) Frontend

```
cd frontend
npm install

# create .env.development (see Environment Variables below)
npm run dev -- --port 5173
```

If port 5173 is in use, you can run `5174` (already allowed by backend CORS).

## Environment Variables

### Backend (`backend/.env`)

```
NODE_ENV="development"
DATABASE_URL="postgresql://postgres:secret@localhost:5434/nest_db?schema=public"
JWT_SECRET="your-access-token-secret-16-chars-min"
JWT_REFRESH_SECRET="your-refresh-token-secret-16-chars-min"
COOKIE_SECRET="your-cookie-secret-16-chars-min"
PORT=3333
BACKEND_URL="http://localhost:3333"
FRONTEND_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:5175"

# Admin bootstrap used by `npx prisma db seed`
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="change-this-password"
ADMIN_USERNAME="admin"
ADMIN_FULL_NAME="Gallerybook Admin"

# OAuth
GOOGLE_OAUTH_CLIENT_ID="..."
GOOGLE_OAUTH_CLIENT_SECRET="..."
GITHUB_OAUTH_CLIENT_ID="..."
GITHUB_OAUTH_CLIENT_SECRET="..."

# Optional if your provider callback differs from BACKEND_URL defaults:
# GOOGLE_OAUTH_CALLBACK_URL="http://localhost:3333/auth/oauth/google/callback"
# GITHUB_OAUTH_CALLBACK_URL="http://localhost:3333/auth/oauth/github/callback"

# AWS / S3 / CloudFront
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="gallerybook-images"
CLOUDFRONT_DOMAIN="https://your-cloudfront-domain"
LAMBDA_TRANSFORM_PARAMS="w=800&format=webp"
THUMB_IMG_TRANSFORM_PARAMS="w=480&h=320&fit=cover&fm=webp&q=80"

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Frontend (`frontend/.env.development`)

```
VITE_API_URL="http://localhost:3333/"
VITE_S3_DOMAIN="https://your-s3-bucket.s3.us-east-1.amazonaws.com"
VITE_S3_FOLDER="uploads/"
```

These frontend variables are build-time values. When building the frontend Docker image, pass them as `--build-arg` values so nginx serves an app compiled for the correct backend and media origins.

### Test Env (Backend)

Create `backend/.env.test` from `backend/.env.test.example` and set `DATABASE_URL` to match the `test_db` container in `docker-compose.yml` (defaults: host `localhost`, port `5435`, user `postgres`, password `secret`, db `nest_db`). Set `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET` to values with at least 16 characters.

## Useful Scripts

### Backend

```
npm run start:dev
npm run prisma:dev:deploy
npx prisma generate
npx prisma db seed
npm run build
npm run lint
npm run test
npm run test:e2e
```

### Frontend

```
npm run dev
npm run build
npm run lint
npm run test
npm run preview
```

## Production Deployment

### Backend container

`backend/Dockerfile` builds on Node 20 Alpine, runs `npm ci`, generates the Prisma client, builds the Nest app, installs production dependencies, and starts with:

```
npm run prisma:dev:deploy && npm run start:prod
```

Set production `DATABASE_URL`, `NODE_ENV=production`, `FRONTEND_URL`, `BACKEND_URL`, `CORS_ORIGINS`, JWT secrets, media credentials, OAuth credentials, and admin bootstrap values in the runtime environment. In production, refresh-token cookies use `SameSite=None` and `Secure`, so the frontend and backend must be served over HTTPS.

### Frontend container

`frontend/Dockerfile` builds the Vite app with Node 20 and serves the static output with nginx on port `80`. The nginx config includes SPA fallback for deep routes such as `/galleries/:slug`, `/terms`, `/privacy`, and `/auth/oauth/callback`, plus long-lived cache headers for static assets.

Build with the deployed API and media values:

```
docker build \
  --build-arg VITE_API_URL="https://api.example.com/" \
  --build-arg VITE_S3_DOMAIN="https://media.example.com" \
  --build-arg VITE_S3_FOLDER="uploads/" \
  -t gallerybook-frontend ./frontend
```

## Notes

- The backend uses presigned S3 URLs for gallery uploads and rewrites image URLs for optimized CloudFront delivery.
- Refresh tokens are issued as HTTP-only cookies scoped to `/auth/refresh`; access tokens are stored on the client and automatically refreshed after a 401.
- Signup, signin, password verification, and OAuth start endpoints are rate-limited.
- Gallery creation/editing and the admin user list are restricted to admin users in the frontend routes.
- Docker Compose includes backend, dev Postgres, and test Postgres services. The frontend service is documented in compose but commented out.
- In production, seed one admin user with `ADMIN_EMAIL` / `ADMIN_PASSWORD` after migrations are applied.
- For split frontend/backend cloud domains, set `FRONTEND_URL`, `BACKEND_URL`, and `CORS_ORIGINS` to the deployed HTTPS origins.
