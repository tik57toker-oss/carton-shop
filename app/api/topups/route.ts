import { cookies } from "next/headers";
import { verifySession } from "@/app/lib/session";
import { ensureTopUpTable, pool } from "@/app/lib/topups";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const userId = token ? await verifySession(token) : null;

    if (!userId) {
      return Response.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    await ensureTopUpTable();

    const result = await pool.query(
      `SELECT "id", "amount", "status", "createdAt", "processedAt"
       FROM "TopUp"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC`,
      [userId]
    );

    return Response.json({ success: true, topUps: result.rows });
  } catch (error) {
    console.error("TOPUPS GET ERROR:", error);
    return Response.json(
      { success: false, error: "Не удалось загрузить пополнения" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const userId = token ? await verifySession(token) : null;

    if (!userId) {
      return Response.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);
    const paymentMethod = body.paymentMethod === "TBANK" ? "TBANK" : body.paymentMethod === "SBP" ? "SBP" : null;

    if (!paymentMethod) {
      return Response.json(
        { success: false, error: "Выберите способ оплаты" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amount) || amount < 10 || amount > 100000) {
      return Response.json(
        { success: false, error: "Сумма должна быть от 10 до 100000 ₽" },
        { status: 400 }
      );
    }

    await ensureTopUpTable();

    const id = crypto.randomUUID();
    const reference = `CS-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const result = await pool.query(
      `INSERT INTO "TopUp" ("id", "userId", "amount", "reference", "paymentMethod")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING "id", "amount", "status", "createdAt", "reference", "paymentMethod"`,
      [id, userId, amount, reference, paymentMethod]
    );

    return Response.json(
      { success: true, topUp: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("TOPUP CREATE ERROR:", error);
    return Response.json(
      { success: false, error: "Не удалось создать заявку" },
      { status: 500 }
    );
  }
}
