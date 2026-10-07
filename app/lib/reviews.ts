import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const globalForReviews = globalThis as unknown as { reviewsPool: Pool | undefined };
const pool = globalForReviews.reviewsPool ?? new Pool({ connectionString, max: 5 });
if (process.env.NODE_ENV !== "production") globalForReviews.reviewsPool = pool;

let ready: Promise<void> | null = null;
export function ensureReviewsTable() {
  if (!ready) ready = pool.query(`
    CREATE TABLE IF NOT EXISTS "Review" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "orderId" TEXT NOT NULL UNIQUE,
      "productId" TEXT NOT NULL,
      "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
      "message" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
      CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS "Review_productId_createdAt_idx" ON "Review" ("productId", "createdAt" DESC);
    CREATE INDEX IF NOT EXISTS "Review_userId_createdAt_idx" ON "Review" ("userId", "createdAt" DESC);
  `).then(() => undefined);
  return ready;
}
export { pool };
