import { ensureProductVisibilityTable, pool } from "@/app/lib/shop-data";

export async function GET() {
  try {
    await ensureProductVisibilityTable();
    const products = (await pool.query(`
      SELECT * FROM "Product"
      WHERE COALESCE("isVisible", TRUE) = TRUE
      ORDER BY "createdAt" DESC
    `)).rows;

    return Response.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("PRODUCTS ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Не удалось загрузить товары",
      },
      { status: 500 }
    );
  }
}
