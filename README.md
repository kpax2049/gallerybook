# Gallerybook

Gallerybook is a full-stack app for creating and sharing rich, image-heavy galleries with tags, reactions, comments, and follows.

## Product Overview

- Create and publish galleries with a rich-text editor and embedded images.
- Upload images directly to S3 with presigned URLs and serve via CloudFront.
- Organize content with tags, drafts, and search/sort filters.
- Social engagement: likes, favorites, threaded comments, and reactions.
- Follow other users to build a personalized gallery feed.
- Profile management with avatar uploads.

## Tech Stack

- Frontend: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: NestJS + Prisma + PostgreSQL
- Media: AWS S3 + CloudFront (gallery images), Cloudinary (avatars)
- Auth: JWT access tokens + refresh tokens

## Project Structure

```
backend/        NestJS API (Prisma, auth, galleries, comments, follow, profile)
frontend/       React app (Vite, Tailwind, shadcn/ui)
docker-compose.yml  Postgres containers for dev + test
```

## Requirements

- Node.js 18+ (frontend), Node.js 20+ (backend recommended)
- npm
- Docker (for Postgres containers)

## Local Development

### 1) Start Postgres

```
docker compose up -d postgres_db
```

### 2) Backend

```
cd backend
npm install

# create .env from scratch (see Environment Variables below)
npm run start:dev
```

Default backend port is `3333` (set `PORT` to change). CORS allows `http://localhost:5173` and `http://localhost:5174`.

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
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
JWT_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"
COOKIE_SECRET="your-cookie-secret"
PORT=3333
BACKEND_URL="http://localhost:3333"
FRONTEND_URL="http://localhost:5173"

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

### Test Env (Backend)

Create `backend/.env.test` from `backend/.env.test.example` and set `DATABASE_URL` to match the `test_db` container in `docker-compose.yml` (defaults: host `localhost`, port `5435`, user `postgres`, password `secret`, db `nest_db`). Set `JWT_SECRET` to any non-empty value.

## Useful Scripts

### Backend

```
npm run start:dev
npm run test
npm run test:e2e
```

### Frontend

```
npm run dev
npm run build
npm run test
```

## Notes

- The backend uses presigned S3 URLs for gallery uploads and rewrites image URLs for optimized CloudFront delivery.
- Refresh tokens are issued as HTTP-only cookies; access tokens are stored on the client.
- Docker Compose includes dev and test Postgres containers.
