import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import { ensureTopUpTable, pool } from "@/app/lib/topups";

async function getAdminId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const userId = await verifySession(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  return user?.role === "ADMIN" ? user.id : null;
}

export async function GET() {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      return Response.json(
        { success: false, error: "Доступ запрещён" },
        { status: 403 }
      );
    }

    await ensureTopUpTable();

    const result = await pool.query(`
      SELECT
        t."id",
        t."amount",
        ROUND(t."amount" * 1.20) AS "paymentAmount",
        t."status",
        t."createdAt",
        t."processedAt",
        t."reference",
        t."paymentMethod",
        u."username"
      FROM "TopUp" t
      JOIN "User" u ON u."id" = t."userId"
      ORDER BY
        CASE WHEN t."status" = 'PENDING' THEN 0 ELSE 1 END,
        t."createdAt" DESC
    `);

    return Response.json({ success: true, topUps: result.rows });
  } catch (error) {
    console.error("ADMIN TOPUPS GET ERROR:", error);
    return Response.json(
      { success: false, error: "Не удалось загрузить заявки" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const adminId = await getAdminId();
  if (!adminId) {
    return Response.json(
      { success: false, error: "Доступ запрещён" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const id = String(body.id || "").trim();
  const action = body.action === "APPROVE" ? "APPROVE" : body.action === "REJECT" ? "REJECT" : null;

  if (!id || !action) {
    return Response.json(
      { success: false, error: "Некорректная заявка" },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await ensureTopUpTable();
    await client.query("BEGIN");

    const topUpResult = await client.query(
      `SELECT "id", "userId", "amount", "status"
       FROM "TopUp"
       WHERE "id" = $1
       FOR UPDATE`,
      [id]
    );

    const topUp = topUpResult.rows[0];

    if (!topUp) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, error: "Заявка не найдена" },
        { status: 404 }
      );
    }

    if (topUp.status !== "PENDING") {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, error: "Заявка уже обработана" },
        { status: 409 }
      );
    }

    if (action === "APPROVE") {
      await client.query(
        `UPDATE "User"
         SET "balance" = "balance" + $1, "updatedAt" = NOW()
         WHERE "id" = $2`,
        [topUp.amount, topUp.userId]
      );
    }

    await client.query(
      `UPDATE "TopUp"
       SET "status" = $1, "processedAt" = NOW(), "processedBy" = $2
       WHERE "id" = $3`,
      [action === "APPROVE" ? "APPROVED" : "REJECTED", adminId, id]
    );

    await client.query("COMMIT");

    return Response.json({
      success: true,
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("ADMIN TOPUP UPDATE ERROR:", error);
    return Response.json(
      { success: false, error: "Не удалось обработать заявку" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
