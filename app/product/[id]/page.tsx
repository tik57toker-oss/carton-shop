import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/app/AddToCartButton";
import SiteHeader from "@/app/SiteHeader";
import { ensureReviewsTable, pool } from "@/app/lib/reviews";
import { ensureProductVisibilityTable, pool as shopPool } from "@/app/lib/shop-data";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureProductVisibilityTable();
  const productResult = await shopPool.query(`SELECT * FROM "Product" WHERE "id" = $1 AND COALESCE("isVisible", TRUE) = TRUE LIMIT 1`, [id]);
  const product = productResult.rows[0];

  if (!product) notFound();

  await ensureReviewsTable();
  const reviewResult = await pool.query(`
    SELECT r."id", r."rating", r."message", r."createdAt", u."username"
    FROM "Review" r
    JOIN "User" u ON u."id" = r."userId"
    WHERE r."productId" = $1
    ORDER BY r."createdAt" DESC
    LIMIT 20
  `, [product.id]);

  const icon =
    product.category === "Boxes" ? "📦" :
    product.category === "Wood" ? "🪵" :
    product.category === "Decor" ? "🪧" : "✨";

  const stockLabel = product.stock > 10 ? "Много" : product.stock > 0 ? "В наличии" : "Нет в наличии";
  const stockWidth = Math.min(100, Math.max(6, product.stock * 10));

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-7 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
          <Link href="/" className="hover:text-white">Магазин</Link>
          <span>/</span>
          <span>{product.category || "Другое"}</span>
          <span>/</span>
          <span className="text-gray-300">{product.name}</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative min-h-[380px] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_45%,rgba(74,222,128,0.16),transparent_48%),linear-gradient(145deg,#151515,#0d0d0d)] lg:min-h-[650px] lg:border-b-0 lg:border-r">
              <div className="absolute left-6 top-6 z-10 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-green-300">
                {product.category || "Товар"}
              </div>
              <div className="absolute right-6 top-6 z-10 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-gray-400 backdrop-blur">
                Lumber Tycoon 2
              </div>

              <div className="absolute inset-0 flex items-center justify-center p-10 sm:p-16">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full rounded-3xl drop-shadow-[0_35px_70px_rgba(0,0,0,0.7)]"
                    style={{
                      objectFit: product.imageFit === "contain" ? "contain" : "cover",
                      transform: `scale(${(product.imageScale ?? 100) / 100})`,
                    }}
                  />
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/[0.035] text-[8rem] shadow-2xl sm:h-80 sm:w-80">
                    {icon}
                  </div>
                )}
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Статус</div>
                  <div className="mt-1 text-sm font-bold text-green-300">{stockLabel}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-right backdrop-blur">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Остаток</div>
                  <div className="mt-1 text-sm font-bold">{product.stock} шт.</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-9 lg:p-12">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]" />
                Товар доступен
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{product.name}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-gray-500">Подробная информация о товаре, стоимости и доступном количестве.</p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                <div className="flex items-end justify-between gap-5">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Цена</div>
                    <div className="mt-1 text-4xl font-black sm:text-5xl">{product.price} <span className="text-2xl text-green-400">₽</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">В наличии</div>
                    <div className="mt-1 text-lg font-black text-green-400">{product.stock} шт.</div>
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-green-400" style={{ width: `${stockWidth}%` }} />
                </div>
              </div>

              <div className="mt-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">О товаре</div>
                <p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-gray-300">
                  {product.description || "Подробное описание этого товара пока не добавлено."}
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="text-lg">⚡</div>
                  <div className="mt-2 text-sm font-bold">Мгновенное оформление</div>
                  <div className="mt-1 text-xs leading-5 text-gray-500">Заказ создаётся сразу после успешной оплаты.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="text-lg">🛡️</div>
                  <div className="mt-2 text-sm font-bold">Прозрачная цена</div>
                  <div className="mt-1 text-xs leading-5 text-gray-500">Перед подтверждением ты увидишь итоговую сумму.</div>
                </div>
              </div>

              <div className="mt-9 border-t border-white/10 pt-7">
                <AddToCartButton product={{id:product.id,name:product.name,price:product.price,stock:product.stock,image:product.image,category:product.category}} />
                <p className="mt-4 text-xs leading-5 text-gray-600">Добавь товар в корзину, укажи ник Roblox и оформи весь заказ одной оплатой с внутреннего баланса.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Пополни баланс", "Выбери способ пополнения и создай заявку."],
            ["02", "Выбери количество", "Проверь товар и укажи нужное количество."],
            ["03", "Оформи заказ", "Средства спишутся, а заказ появится в профиле."],
          ].map(([number, title, text]) => (
            <div key={number} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
              <div className="text-xs font-black tracking-[0.2em] text-green-400">{number}</div>
              <h2 className="mt-4 font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.22em] text-green-400">Отзывы</p>
              <h2 className="mt-2 text-3xl font-black">Отзывы об этом товаре</h2>
              <p className="mt-2 text-sm text-gray-500">После получения товара покупатель может оставить отзыв в профиле.</p>
            </div>
            <Link href="/reviews" className="text-sm font-bold text-green-300 hover:text-green-200">Все отзывы →</Link>
          </div>
          {reviewResult.rows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-7 text-center text-sm text-gray-500">Пока никто не оставил отзыв об этом товаре.</div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {reviewResult.rows.map((review) => (
                <article key={review.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold">{review.username}</div>
                    <div className="text-yellow-300">{"★".repeat(review.rating)}<span className="text-gray-700">{"★".repeat(5-review.rating)}</span></div>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-300">{review.message}</p>
                  <p className="mt-4 text-xs text-gray-600">{new Date(review.createdAt).toLocaleDateString("ru-RU")}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
