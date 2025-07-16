-- CreateEnum
CREATE TYPE "GalleryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "status" "GalleryStatus" NOT NULL DEFAULT 'DRAFT';
