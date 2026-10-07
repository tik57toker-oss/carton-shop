import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import AdminProducts from "./AdminProducts";
import AdminTopUps from "./AdminTopUps";
import AdminCategories from "./AdminCategories";
import AdminSupport from "./AdminSupport";
import AdminReviews from "./AdminReviews";
import AdminOrders from "./AdminOrders";
import { ensureCategoryTable, ensureProductVisibilityTable, pool as shopPool } from "@/app/lib/shop-data";
import SiteHeader from "@/app/SiteHeader";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) redirect("/login");

  const userId = await verifySession(token);
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, role: true },
  });

  if (!user || user.role !== "ADMIN") redirect("/");

  await ensureProductVisibilityTable();
  const productsResult = await shopPool.query(`SELECT p.*, COALESCE(p."isVisible", TRUE) AS "isVisible" FROM "Product" p ORDER BY p."createdAt" DESC`);
  const products = productsResult.rows;

  await ensureCategoryTable();
  const categoryResult = await shopPool.query(
    `SELECT "id", "name", "createdAt" FROM "Category" ORDER BY "name" ASC`
  );

  const stockTotal = products.reduce((sum, product) => sum + product.stock, 0);
  const productCount = products.length;
  const categoryCount = categoryResult.rows.length;

  let orderCount = 0;
  let pendingTopUps = 0;
  try {
    const [orders, topups] = await Promise.all([
      shopPool.query(`SELECT COUNT(*)::int AS count FROM "Order"`),
      shopPool.query(`SELECT COUNT(*)::int AS count FROM "TopUp" WHERE "status" = 'PENDING'`),
    ]);
    orderCount = Number(orders.rows[0]?.count || 0);
    pendingTopUps = Number(topups.rows[0]?.count || 0);
  } catch {
    // Дополнительные счётчики не должны ломать админку, если таблица ещё не создана.
  }

  return (
    <main className="min-h-screen text-white">
      <SiteHeader admin />
      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="admin-hero">
          <div className="admin-hero-glow" />
          <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.28em] text-amber-300">
                <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_rgba(53,229,139,.8)]" />
                Carton Shop Admin
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Панель управления</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
                Управляй магазином из одного места: товары, заказы, категории, пополнения, отзывы и обращения покупателей.
              </p>
            </div>
            <div className="admin-user-card">
              <span className="admin-user-avatar">{user.username.slice(0, 1).toUpperCase()}</span>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/35">Администратор</p>
                <p className="mt-1 font-black text-amber-200">{user.username}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-stats-grid">
          <a href="#products" className="admin-stat-card group">
            <span className="admin-stat-icon">📦</span>
            <span><b>{productCount}</b><small>Товаров</small></span>
            <i>→</i>
          </a>
          <a href="#orders" className="admin-stat-card group">
            <span className="admin-stat-icon">🧾</span>
            <span><b>{orderCount}</b><small>Заказов</small></span>
            <i>→</i>
          </a>
          <a href="#categories" className="admin-stat-card group">
            <span className="admin-stat-icon">🗂️</span>
            <span><b>{categoryCount}</b><small>Категорий</small></span>
            <i>→</i>
          </a>
          <a href="#topups" className="admin-stat-card group">
            <span className="admin-stat-icon">💳</span>
            <span><b>{pendingTopUps}</b><small>Ожидают проверки</small></span>
            <i>→</i>
          </a>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">🏷️</span>
            <span><b>{stockTotal}</b><small>Товаров на складе</small></span>
          </div>
        </div>

        <nav className="admin-quick-nav" aria-label="Разделы админ-панели">
          <a href="#products">📦 Товары</a>
          <a href="#orders">🧾 Заказы</a>
          <a href="#categories">🗂️ Категории</a>
          <a href="#topups">💳 Пополнения</a>
          <a href="#support">💬 Поддержка</a>
          <a href="#reviews">⭐ Отзывы</a>
        </nav>

        <div id="products" className="admin-section-anchor">
          <AdminProducts initialProducts={products} categories={categoryResult.rows} />
        </div>
        <div id="categories" className="admin-section-anchor">
          <AdminCategories initialCategories={categoryResult.rows} />
        </div>
        <div id="topups" className="admin-section-anchor">
          <AdminTopUps />
        </div>
        <div id="support" className="admin-section-anchor">
          <AdminSupport />
        </div>
        <div id="orders" className="admin-section-anchor">
          <AdminOrders />
        </div>
        <div id="reviews" className="admin-section-anchor">
          <AdminReviews />
        </div>
      </section>
    </main>
  );
}
