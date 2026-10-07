import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import { ensureSupportTable, pool } from "@/app/lib/support";

async function admin() {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? await verifySession(token) : null;
  if (!userId) return null;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  return u?.role === "ADMIN" ? u.id : null;
}

const allowedStatuses = ["OPEN", "ANSWERED", "APPROVED", "REJECTED", "CLOSED"] as const;
type Status = typeof allowedStatuses[number];

export async function GET() {
  const adminId = await admin();
  if (!adminId) return Response.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
  await ensureSupportTable();
  const r = await pool.query(`
    SELECT t."id",t."subject",t."status",t."createdAt",t."updatedAt",u."username",
    COALESCE(json_agg(json_build_object(
      'id',m."id",'message',m."message",'createdAt',m."createdAt",
      'username',mu."username",'isAdmin',mu."role"='ADMIN'
    ) ORDER BY m."createdAt") FILTER (WHERE m."id" IS NOT NULL),'[]') AS messages
    FROM "SupportTicket" t
    JOIN "User" u ON u."id"=t."userId"
    LEFT JOIN "SupportMessage" m ON m."ticketId"=t."id"
    LEFT JOIN "User" mu ON mu."id"=m."userId"
    GROUP BY t."id",u."username"
    ORDER BY CASE t."status"
      WHEN 'OPEN' THEN 0
      WHEN 'ANSWERED' THEN 1
      WHEN 'APPROVED' THEN 2
      WHEN 'REJECTED' THEN 3
      ELSE 4 END, t."updatedAt" DESC
  `);
  return Response.json({ success: true, tickets: r.rows });
}

export async function POST(request: Request) {
  const adminId = await admin();
  if (!adminId) return Response.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
  await ensureSupportTable();
  const body = await request.json();
  const ticketId = String(body.ticketId || "");
  const message = String(body.message || "").trim();
  const action = String(body.action || "");

  if (!ticketId) return Response.json({ success: false, error: "Заявка не указана" }, { status: 400 });

  if (action.startsWith("STATUS:")) {
    const next = action.slice("STATUS:".length) as Status;
    if (!allowedStatuses.includes(next)) return Response.json({ success: false, error: "Недопустимый статус" }, { status: 400 });
    const result = await pool.query(
      `UPDATE "SupportTicket" SET "status"=$1,"updatedAt"=NOW() WHERE "id"=$2 RETURNING "id"`,
      [next, ticketId]
    );
    if (!result.rows[0]) return Response.json({ success: false, error: "Заявка не найдена" }, { status: 404 });
    return Response.json({ success: true });
  }

  if (!message || message.length > 5000) {
    return Response.json({ success: false, error: "Введите ответ" }, { status: 400 });
  }

  const t = await pool.query(`SELECT "id","status" FROM "SupportTicket" WHERE "id"=$1`, [ticketId]);
  if (!t.rows[0]) return Response.json({ success: false, error: "Заявка не найдена" }, { status: 404 });
  if (["CLOSED", "APPROVED", "REJECTED"].includes(String(t.rows[0].status))) {
    return Response.json({ success: false, error: "Завершённую заявку нельзя продолжить. Измените статус на открытую перед ответом." }, { status: 409 });
  }

  await pool.query(
    `INSERT INTO "SupportMessage" ("id","ticketId","userId","message") VALUES ($1,$2,$3,$4)`,
    [crypto.randomUUID(), ticketId, adminId, message]
  );
  await pool.query(`UPDATE "SupportTicket" SET "status"='ANSWERED',"updatedAt"=NOW() WHERE "id"=$1`, [ticketId]);
  return Response.json({ success: true });
}
