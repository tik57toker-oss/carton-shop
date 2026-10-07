import { ensureReviewsTable, pool } from "@/app/lib/reviews";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureReviewsTable();
    const result = await pool.query(`
      SELECT COUNT(*)::int AS "count",
             COALESCE(ROUND(AVG("rating")::numeric, 1), 0) AS "average"
      FROM "Review"
    `);
    const row = result.rows[0] ?? { count: 0, average: 0 };
    return Response.json({ success: true, count: Number(row.count || 0), average: Number(row.average || 0) });
  } catch (error) {
    console.error("SITE RATING ERROR:", error);
    return Response.json({ success: false, count: 0, average: 0 }, { status: 500 });
  }
}
