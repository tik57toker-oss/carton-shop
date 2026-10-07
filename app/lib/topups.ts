import { Pool, PoolClient } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPool = globalThis as unknown as {
  topupPool: Pool | undefined;
};

const pool =
  globalForPool.topupPool ??
  new Pool({
    connectionString,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.topupPool = pool;
}

let tableReady: Promise<void> | null = null;

export function ensureTopUpTable() {
  if (!tableReady) {
    tableReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS "TopUp" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "amount" INTEGER NOT NULL CHECK ("amount" > 0),
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "processedAt" TIMESTAMPTZ,
          "processedBy" TEXT,
          "reference" TEXT,
          "paymentMethod" TEXT NOT NULL DEFAULT 'SBP',
          CONSTRAINT "TopUp_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS "TopUp_userId_createdAt_idx"
          ON "TopUp" ("userId", "createdAt" DESC);

        CREATE INDEX IF NOT EXISTS "TopUp_status_createdAt_idx"
          ON "TopUp" ("status", "createdAt" DESC);

        ALTER TABLE "TopUp"
          ADD COLUMN IF NOT EXISTS "reference" TEXT;

        ALTER TABLE "TopUp"
          ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'SBP';

        CREATE UNIQUE INDEX IF NOT EXISTS "TopUp_reference_key"
          ON "TopUp" ("reference")
          WHERE "reference" IS NOT NULL;
      `)
      .then(() => undefined);
  }

  return tableReady;
}

export { pool };
export type { PoolClient };
