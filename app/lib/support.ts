import { Pool } from "pg";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const globalForSupport = globalThis as unknown as { supportPool: Pool | undefined };
const pool = globalForSupport.supportPool ?? new Pool({ connectionString, max: 5 });
if (process.env.NODE_ENV !== "production") globalForSupport.supportPool = pool;
let ready: Promise<void> | null = null;
export function ensureSupportTable() {
  if (!ready) ready = pool.query(`
    CREATE TABLE IF NOT EXISTS "SupportTicket" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "SupportMessage" (
      "id" TEXT PRIMARY KEY,
      "ticketId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE,
      CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS "SupportTicket_userId_updatedAt_idx" ON "SupportTicket" ("userId", "updatedAt" DESC);
    CREATE INDEX IF NOT EXISTS "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage" ("ticketId", "createdAt" ASC);
  `).then(() => undefined);
  return ready;
}
export { pool };
