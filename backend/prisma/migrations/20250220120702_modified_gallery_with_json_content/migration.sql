/*
  Warnings:

  - You are about to drop the `files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `images` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `settings` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_imageId_fkey";

-- DropForeignKey
ALTER TABLE "galleries" DROP CONSTRAINT "galleries_userId_fkey";

-- DropForeignKey
ALTER TABLE "images" DROP CONSTRAINT "images_galleryId_fkey";

-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "content" JSONB,
ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "settings" JSONB NOT NULL,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active';

-- DropTable
DROP TABLE "files";

-- DropTable
DROP TABLE "images";

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "configuration" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
