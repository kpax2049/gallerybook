/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `galleries` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ReactionType" AS ENUM ('LIKE', 'FAVORITE');

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- AlterTable
ALTER TABLE "public"."galleries" ADD COLUMN     "favoritesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "viewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibility" "public"."Visibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GalleryTag" (
    "galleryId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "GalleryTag_pkey" PRIMARY KEY ("galleryId","tagId")
);

-- CreateTable
CREATE TABLE "public"."GalleryReaction" (
    "userId" INTEGER NOT NULL,
    "galleryId" INTEGER NOT NULL,
    "type" "public"."ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryReaction_pkey" PRIMARY KEY ("userId","galleryId","type")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "GalleryTag_tagId_idx" ON "public"."GalleryTag"("tagId");

-- CreateIndex
CREATE INDEX "GalleryReaction_galleryId_type_idx" ON "public"."GalleryReaction"("galleryId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "galleries_slug_key" ON "public"."galleries"("slug");

-- CreateIndex
CREATE INDEX "galleries_status_updatedAt_idx" ON "public"."galleries"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "galleries_userId_updatedAt_idx" ON "public"."galleries"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "galleries_visibility_updatedAt_idx" ON "public"."galleries"("visibility", "updatedAt");

-- AddForeignKey
ALTER TABLE "public"."GalleryTag" ADD CONSTRAINT "GalleryTag_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "public"."galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GalleryTag" ADD CONSTRAINT "GalleryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GalleryReaction" ADD CONSTRAINT "GalleryReaction_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "public"."galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GalleryReaction" ADD CONSTRAINT "GalleryReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
