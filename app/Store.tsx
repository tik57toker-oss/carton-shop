"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  imageScale: number;
  imageFit: string;
  category: string | null;
};

type User = { username: string; balance: number } | null;

const categoryIcons: Record<string, string> = {
  Boxes: "📦",
  Wood: "🪵",
  Decor: "🪧",
};

function formatCategory(category: string) {
  return category === "Boxes" ? "Ящики" : category === "Wood" ? "Ресурсы" : category === "Decor" ? "Декор" : category;
}

export default function Store({ products: initialProducts, user, isAdmin }: { products: Product[]; user: User; isAdmin: boolean }) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [query, setQuery] = useState("");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const router = useRouter();

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category || "Другое"))), [products]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = selectedCategory === "Все" || (p.category || "Другое") === selectedCategory;
      const matchesQuery = !normalized || `${p.name} ${p.description} ${p.category || ""}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCategory]);

  async function buy(product: Product) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (product.stock <= 0 || buyingId) return;
    setBuyingId(product.id);
    setNotice("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setNotice(data.error || "Не удалось купить товар");
        return;
      }
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: data.stock } : item));
      setNotice(`Покупка оформлена: ${product.name}. Списано ${product.price} ₽.`);
    } catch {
      setNotice("Ошибка соединения с сервером");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#070909] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 md:px-6">
          <Link href="/" className="shrink-0 text-2xl font-black tracking-tight">CARTON <span className="text-green-400">SHOP</span></Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-400 md:flex">
            <a href="#shop" className="hover:text-white">Магазин</a>
            <a href="#categories" className="hover:text-white">Категории</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/profile" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold hover:border-green-400/30">
                {user.username} · {user.balance} ₽
              </Link>
            ) : (
              <Link href="/login" className="rounded-xl bg-green-400 px-4 py-2 text-sm font-bold text-black hover:bg-green-300">Войти</Link>
            )}
            {isAdmin && <Link href="/admin" className="hidden rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-300 sm:block">⚙ Админ</Link>}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(74,222,128,0.13),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[1.2fr_.8fr] md:px-6 md:py-28">
          <div>
            <span className="inline-flex rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-green-400">Lumber Tycoon 2</span>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">Редкие предметы.<br /><span className="text-green-400">Без лишнего.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">Выбирай предметы для Lumber Tycoon 2, покупай с баланса и следи за своими заказами в профиле.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#shop" className="rounded-xl bg-green-400 px-6 py-3 font-bold text-black hover:bg-green-300">Открыть магазин</a>
              {!user && <Link href="/register" className="rounded-xl border border-white/10 px-6 py-3 font-bold hover:bg-white/5">Создать аккаунт</Link>}
            </div>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-[2rem] border border-green-400/20 bg-green-400/[0.04] shadow-[0_0_100px_rgba(74,222,128,0.08)]">
              <div className="text-8xl">📦</div>
              <div className="absolute -right-4 top-8 rounded-2xl border border-white/10 bg-[#101515] px-4 py-3 text-sm shadow-2xl">Быстрая покупка</div>
              <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-[#101515] px-4 py-3 text-sm shadow-2xl">Проверенный магазин</div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">Каталог</p><h2 className="mt-2 text-3xl font-black">Разделы</h2></div>
          <span className="text-sm text-gray-500">{products.length} товаров</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button onClick={() => setSelectedCategory("Все")} className={`rounded-2xl border p-5 text-left transition ${selectedCategory === "Все" ? "border-green-400/40 bg-green-400/10" : "border-white/10 bg-[#0d1111] hover:border-white/20"}`}>
            <div className="text-3xl">🛒</div><div className="mt-4 font-bold">Все товары</div><div className="mt-1 text-sm text-gray-500">Показать весь каталог</div>
          </button>
          {categories.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={`rounded-2xl border p-5 text-left transition ${selectedCategory === category ? "border-green-400/40 bg-green-400/10" : "border-white/10 bg-[#0d1111] hover:border-white/20"}`}>
              <div className="text-3xl">{categoryIcons[category] || "✨"}</div><div className="mt-4 font-bold">{formatCategory(category)}</div><div className="mt-1 text-sm text-gray-500">{category}</div>
            </button>
          ))}
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-7xl px-5 pb-20 md:px-6">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">Store</p><h2 className="mt-2 text-3xl font-black">{selectedCategory === "Все" ? "Все товары" : formatCategory(selectedCategory)}</h2></div>
          <div className="relative w-full md:w-80"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск товара..." className="w-full rounded-xl border border-white/10 bg-[#0d1111] px-4 py-3 pl-11 text-sm outline-none placeholder:text-gray-600 focus:border-green-400/40" /><span className="absolute left-4 top-3 text-gray-500">⌕</span></div>
        </div>
        {notice && <div className="mb-5 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-300">{notice}</div>}
        {filtered.length === 0 ? <div className="rounded-2xl border border-white/10 bg-[#0d1111] p-12 text-center text-gray-500">Ничего не найдено.</div> : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0d1111] transition duration-300 hover:-translate-y-1 hover:border-green-400/30 hover:shadow-2xl hover:shadow-green-950/20">
                <div className="relative h-52 overflow-hidden bg-[#151a1a]">
                  {product.image ? <img src={product.image} alt={product.name} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" style={{ objectFit: product.imageFit === "contain" ? "contain" : "cover", transform: `scale(${(product.imageScale || 100) / 100})` }} /> : <div className="flex h-full items-center justify-center text-7xl">{categoryIcons[product.category || ""] || "✨"}</div>}
                  <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-300 backdrop-blur">{product.category || "Other"}</div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold">{product.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">{product.description}</p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div><div className="text-2xl font-black">{product.price} ₽</div><div className="mt-1 text-xs text-gray-500">В наличии: {product.stock}</div></div>
                    <button onClick={() => buy(product)} disabled={product.stock <= 0 || buyingId !== null} className="rounded-xl bg-green-400 px-4 py-2.5 text-sm font-bold text-black hover:bg-green-300 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500">{buyingId === product.id ? "Покупаем..." : product.stock > 0 ? "Купить" : "Нет в наличии"}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 bg-[#090c0c]"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm text-gray-600 md:flex-row md:items-center md:justify-between md:px-6"><span>© 2026 Carton Shop</span><span>Lumber Tycoon 2 Items</span></div></footer>
    </main>
  );
}
