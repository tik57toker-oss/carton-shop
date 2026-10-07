import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import { ensureProductVisibilityTable, pool } from "@/app/lib/shop-data";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return false;

  const userId = await verifySession(token);

  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

function parseImageSettings(body: Record<string, unknown>) {
  const rawScale = Number(body.imageScale ?? 100);
  const imageScale = Number.isInteger(rawScale)
    ? Math.min(150, Math.max(50, rawScale))
    : 100;

  const imageFit = body.imageFit === "contain" ? "contain" : "cover";

  return {
    imageScale,
    imageFit,
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json(
      { success: false, error: "Доступ запрещён" },
      { status: 403 }
    );
  }

  try {
    await ensureProductVisibilityTable();
    const result = await pool.query(`
      SELECT p.*, COALESCE(p."isVisible", TRUE) AS "isVisible"
      FROM "Product" p
      ORDER BY p."createdAt" DESC
    `);

    return Response.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error("ADMIN GET PRODUCTS ERROR:", error);

    return Response.json(
      { success: false, error: "Не удалось загрузить товары" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json(
      { success: false, error: "Доступ запрещён" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price);
    const stock = Number(body.stock);
    const category = String(body.category || "").trim();
    const image = String(body.image || "").trim() || null;

    const { imageScale, imageFit } = parseImageSettings(body);

    if (!name || !description || !category) {
      return Response.json(
        { success: false, error: "Заполни обязательные поля" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(price) || price < 0) {
      return Response.json(
        { success: false, error: "Некорректная цена" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return Response.json(
        { success: false, error: "Некорректное количество" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        category,
        image,
        imageScale,
        imageFit,
      },
    });

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("ADMIN CREATE PRODUCT ERROR:", error);

    return Response.json(
      { success: false, error: "Не удалось создать товар" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return Response.json(
      { success: false, error: "Доступ запрещён" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price);
    const stock = Number(body.stock);
    const category = String(body.category || "").trim();
    const image = String(body.image || "").trim() || null;

    const { imageScale, imageFit } = parseImageSettings(body);

    if (!id || !name || !description || !category) {
      return Response.json(
        { success: false, error: "Заполни обязательные поля" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(price) || price < 0) {
      return Response.json(
        { success: false, error: "Некорректная цена" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return Response.json(
        { success: false, error: "Некорректное количество" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        category,
        image,
        imageScale,
        imageFit,
      },
    });

    if (typeof body.isVisible === "boolean") {
      await ensureProductVisibilityTable();
      await pool.query(
        `UPDATE "Product" SET "isVisible" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
        [body.isVisible, id]
      );
    }

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("ADMIN UPDATE PRODUCT ERROR:", error);

    return Response.json(
      { success: false, error: "Не удалось изменить товар" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return Response.json(
      { success: false, error: "Доступ запрещён" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return Response.json(
        { success: false, error: "Не указан товар" },
        { status: 400 }
      );
    }

    await ensureProductVisibilityTable();

    const orderResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "Order" WHERE "productId" = $1`,
      [id]
    );
    const orderCount = Number(orderResult.rows[0]?.count || 0);

    if (orderCount > 0) {
      await pool.query(
        `UPDATE "Product" SET "isVisible" = FALSE, "updatedAt" = NOW() WHERE "id" = $1`,
        [id]
      );

      return Response.json({
        success: true,
        hidden: true,
        message: `Товар скрыт из магазина. У него есть ${orderCount} заказ(ов), поэтому история покупок сохранена.`,
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    return Response.json({
      success: true,
      deleted: true,
      message: "Товар удалён",
    });
  } catch (error) {
    console.error("ADMIN DELETE PRODUCT ERROR:", error);

    return Response.json(
      { success: false, error: "Не удалось удалить товар" },
      { status: 500 }
    );
  }
}
