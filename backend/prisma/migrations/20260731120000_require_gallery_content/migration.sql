UPDATE "galleries"
SET "content" = '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
WHERE "content" IS NULL;

ALTER TABLE "galleries"
  ALTER COLUMN "content" SET DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  ALTER COLUMN "content" SET NOT NULL;
