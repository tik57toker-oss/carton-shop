import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const globalForAvatar = globalThis as unknown as { avatarPool: Pool | undefined };
const pool = globalForAvatar.avatarPool ?? new Pool({ connectionString, max: 5 });
if (process.env.NODE_ENV !== "production") globalForAvatar.avatarPool = pool;

let ready: Promise<void> | null = null;

export function ensureAvatarColumn() {
  if (!ready) {
    ready = pool.query(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
      CREATE INDEX IF NOT EXISTS "User_avatarUrl_idx" ON "User" ("avatarUrl");
    `).then(() => undefined);
  }
  return ready;
}

export { pool };
