-- Manual balance top-ups for Carton Shop.
-- The app also creates this table automatically on the first top-up request.

CREATE TABLE IF NOT EXISTS "TopUp" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL CHECK ("amount" > 0),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "processedAt" TIMESTAMPTZ,
  "processedBy" TEXT,
  "reference" TEXT,
  CONSTRAINT "TopUp_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "TopUp_userId_createdAt_idx"
  ON "TopUp" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "TopUp_status_createdAt_idx"
  ON "TopUp" ("status", "createdAt" DESC);

ALTER TABLE "TopUp" ADD COLUMN IF NOT EXISTS "reference" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "TopUp_reference_key" ON "TopUp" ("reference") WHERE "reference" IS NOT NULL;

ALTER TABLE "TopUp" ADD COLUMN IF NOT EXISTS "reference" TEXT;
ALTER TABLE "TopUp" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'SBP';
CREATE UNIQUE INDEX IF NOT EXISTS "TopUp_reference_key" ON "TopUp" ("reference") WHERE "reference" IS NOT NULL;
