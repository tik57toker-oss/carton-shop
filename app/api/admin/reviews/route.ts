import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import { ensureReviewsTable, pool } from "@/app/lib/reviews";

async function admin() {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? await verifySession(token) : null;
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await admin())) return Response.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
  await ensureReviewsTable();
  const result = await pool.query(`
    SELECT r."id",r."rating",r."message",r."createdAt",u."username",u."avatarUrl",p."name" AS "productName",r."orderId"
    FROM "Review" r
    JOIN "User" u ON u."id"=r."userId"
    JOIN "Product" p ON p."id"=r."productId"
    ORDER BY r."createdAt" DESC
  `);
  return Response.json({ success: true, reviews: result.rows });
}

export async function DELETE(request: Request) {
  if (!(await admin())) return Response.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
  await ensureReviewsTable();
  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return Response.json({ success: false, error: "Не указан отзыв" }, { status: 400 });
  await pool.query(`DELETE FROM "Review" WHERE "id"=$1`, [id]);
  return Response.json({ success: true });
}
