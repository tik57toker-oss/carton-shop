import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import { pool } from "@/app/lib/shop-data";

async function isAdmin() {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? await verifySession(token) : null;
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await isAdmin())) return Response.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
  await pool.query(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "robloxUsername" TEXT`);
  const result = await pool.query(`
    SELECT o."id", o."quantity", o."totalPrice", o."status", o."createdAt", COALESCE(o."robloxUsername", '') AS "robloxUsername", u."username", p."name" AS "productName"
    FROM "Order" o
    JOIN "User" u ON u."id"=o."userId"
    JOIN "Product" p ON p."id"=o."productId"
    ORDER BY o."createdAt" DESC
    LIMIT 200
  `);
  return Response.json({ success: true, orders: result.rows });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return Response.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
  const body = await request.json();
  const id = String(body.id || "");
  const status = body.status === "DELIVERED" ? "DELIVERED" : "PAID";
  if (!id) return Response.json({ success: false, error: "Не указан заказ" }, { status: 400 });
  const result = await pool.query(`UPDATE "Order" SET "status"=$1 WHERE "id"=$2 RETURNING "id"`, [status, id]);
  if (!result.rows[0]) return Response.json({ success: false, error: "Заказ не найден" }, { status: 404 });
  return Response.json({ success: true });
}
