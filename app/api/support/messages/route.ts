import { cookies } from "next/headers";
import { verifySession } from "@/app/lib/session";
import { ensureSupportTable, pool } from "@/app/lib/support";

async function auth() {
  const token = (await cookies()).get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function POST(request: Request) {
  const userId = await auth();
  if (!userId) return Response.json({ success: false, error: "Не авторизован" }, { status: 401 });

  await ensureSupportTable();
  const body = await request.json();
  const ticketId = String(body.ticketId || "");
  const message = String(body.message || "").trim();

  if (!ticketId || !message || message.length > 5000) {
    return Response.json({ success: false, error: "Некорректное сообщение" }, { status: 400 });
  }

  const ticket = await pool.query(
    `SELECT "id", "status" FROM "SupportTicket" WHERE "id"=$1 AND "userId"=$2`,
    [ticketId, userId]
  );

  if (!ticket.rows[0]) {
    return Response.json({ success: false, error: "Заявка не найдена" }, { status: 404 });
  }

  const status = String(ticket.rows[0].status);
  if (["CLOSED", "APPROVED", "REJECTED"].includes(status)) {
    return Response.json({
      success: false,
      error: "Эта заявка уже завершена. Создайте новую заявку, если нужна дополнительная помощь.",
    }, { status: 409 });
  }

  await pool.query(
    `INSERT INTO "SupportMessage" ("id","ticketId","userId","message") VALUES ($1,$2,$3,$4)`,
    [crypto.randomUUID(), ticketId, userId, message]
  );
  await pool.query(
    `UPDATE "SupportTicket" SET "status"='OPEN',"updatedAt"=NOW() WHERE "id"=$1`,
    [ticketId]
  );

  return Response.json({ success: true });
}
