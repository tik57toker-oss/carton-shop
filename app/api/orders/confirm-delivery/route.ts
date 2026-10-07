import { cookies } from "next/headers";
import { verifySession } from "@/app/lib/session";
import { pool } from "@/app/lib/shop-data";

export async function POST(request: Request) {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? await verifySession(token) : null;
  if (!userId) return Response.json({ success: false, error: "Войдите в аккаунт" }, { status: 401 });
  const body = await request.json();
  const orderId = String(body.orderId || "");
  if (!orderId) return Response.json({ success: false, error: "Не указан заказ" }, { status: 400 });

  const result = await pool.query(`
    UPDATE "Order"
    SET "status"='DELIVERED'
    WHERE "id"=$1 AND "userId"=$2 AND "status"='PAID'
    RETURNING "id"
  `, [orderId, userId]);

  if (!result.rows[0]) return Response.json({ success: false, error: "Заказ не найден или уже подтверждён" }, { status: 404 });
  return Response.json({ success: true });
}
