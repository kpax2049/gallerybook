-- Allow a gallery and its dependent comment thread to be removed together.
ALTER TABLE "Comment"
DROP CONSTRAINT "Comment_galleryId_fkey";

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_galleryId_fkey"
FOREIGN KEY ("galleryId") REFERENCES "galleries"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
