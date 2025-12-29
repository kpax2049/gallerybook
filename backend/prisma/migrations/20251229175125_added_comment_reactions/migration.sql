/*
  Warnings:

  - A unique constraint covering the columns `[commentId,userId,type]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Reaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ActionCount" DROP CONSTRAINT "ActionCount_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_commentId_fkey";

-- AlterTable
ALTER TABLE "ActionCount" ALTER COLUMN "upvote" SET DEFAULT 0,
ALTER COLUMN "rocket" SET DEFAULT 0,
ALTER COLUMN "heart" SET DEFAULT 0,
ALTER COLUMN "thumbUp" SET DEFAULT 0,
ALTER COLUMN "thumbDown" SET DEFAULT 0,
ALTER COLUMN "laugh" SET DEFAULT 0,
ALTER COLUMN "hooray" SET DEFAULT 0,
ALTER COLUMN "confused" SET DEFAULT 0,
ALTER COLUMN "eye" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Reaction" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_commentId_userId_type_key" ON "Reaction"("commentId", "userId", "type");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionCount" ADD CONSTRAINT "ActionCount_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
