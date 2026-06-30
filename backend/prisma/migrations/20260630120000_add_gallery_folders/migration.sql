-- Create folders as an owner-scoped organization layer for galleries.
CREATE TABLE "folders" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folders_userId_slug_key" ON "folders"("userId", "slug");

-- CreateIndex
CREATE INDEX "folders_userId_updatedAt_idx" ON "folders"("userId", "updatedAt");

-- AlterTable
ALTER TABLE "galleries" ADD COLUMN "folderId" INTEGER;

-- CreateIndex
CREATE INDEX "galleries_folderId_updatedAt_idx" ON "galleries"("folderId", "updatedAt");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
