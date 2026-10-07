import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const globalForShop = globalThis as unknown as { shopPool: Pool | undefined };
const pool = globalForShop.shopPool ?? new Pool({ connectionString, max: 5 });
if (process.env.NODE_ENV !== "production") globalForShop.shopPool = pool;

let ready: Promise<void> | null = null;
let productVisibilityReady: Promise<void> | null = null;

// Создаём только таблицу. Категории НЕ создаются автоматически.
// Администратор сам добавляет нужные категории через админ-панель.
export function ensureCategoryTable() {
  if (!ready) {
    ready = pool.query(`
      CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).then(() => undefined);
  }
  return ready;
}

export { pool };


// Adds a visibility flag without touching existing product/order data.
export function ensureProductVisibilityTable() {
  if (!productVisibilityReady) {
    productVisibilityReady = pool.query(`
      ALTER TABLE "Product"
      ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT TRUE;
    `).then(() => undefined);
  }
  return productVisibilityReady;
}
