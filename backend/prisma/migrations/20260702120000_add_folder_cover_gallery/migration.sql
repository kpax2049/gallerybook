ALTER TABLE "folders" ADD COLUMN "coverGalleryId" INTEGER;

CREATE INDEX "folders_coverGalleryId_idx" ON "folders"("coverGalleryId");

ALTER TABLE "folders"
  ADD CONSTRAINT "folders_coverGalleryId_fkey"
  FOREIGN KEY ("coverGalleryId") REFERENCES "galleries"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
