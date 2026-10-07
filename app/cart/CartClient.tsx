"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/app/SiteHeader";

type Item = { id: string; name: string; price: number; stock: number; image: string | null; category: string | null; quantity: number };
const KEY = "carton-shop-cart";

export default function CartClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [roblox, setRoblox] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [ordered, setOrdered] = useState(false);

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    load();
    const fn = () => load();
    window.addEventListener("cart-updated", fn);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener("cart-updated", fn);
      window.removeEventListener("storage", fn);
    };
  }, []);

  function save(next: Item[]) {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  }

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  async function checkout() {
    setMessage("");
    setError(false);
    const nick = roblox.trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(nick)) {
      setError(true);
      setMessage("Укажи корректный ник Roblox: 3–20 символов, только латиница, цифры и _.");
      return;
    }
    if (!items.length) return;

    setLoading(true);
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
          robloxUsername: nick,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          window.location.href = "/login?next=/cart";
          return;
        }
        setError(true);
        setMessage(data.error || "Не удалось оформить заказ");
        return;
      }

      localStorage.removeItem(KEY);
      window.dispatchEvent(new Event("cart-updated"));
      setItems([]);
      setOrdered(true);
      setMessage(`Заказ оформлен. Списано ${data.totalPrice} ₽. Roblox: ${nick}`);
    } catch {
      setError(true);
      setMessage("Ошибка соединения. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.25em] text-green-400">Your selection</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">Корзина</h1>
            <p className="mt-3 text-sm text-gray-500">{count ? `${count} ${count === 1 ? "товар" : "товара"} · ` : ""}Проверь заказ и укажи ник Roblox.</p>
          </div>
          <Link href="/#products" className="text-sm font-semibold text-gray-400 hover:text-white">← Продолжить покупки</Link>
        </div>

        {!items.length ? (
          <div className="mx-auto mt-12 max-w-2xl rounded-[2rem] border border-white/10 bg-[#101010] p-10 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-400/10 text-4xl">🛒</div>
            <h2 className="mt-6 text-2xl font-black">{ordered ? "Заказ успешно оформлен" : "Корзина пуста"}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">{ordered ? "После получения товара зайди в профиль и оставь отзыв. Сотрудник увидит ник Roblox из заказа и сможет передать предметы." : "Добавляй товары из каталога. Их можно собрать в один заказ и оплатить одной суммой."}</p>
            {ordered && message && <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300">{message}</div>}
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/#products" className="rounded-xl bg-green-400 px-6 py-3 font-black text-black hover:bg-green-300">Вернуться к товарам</Link>
              {ordered && <Link href="/profile" className="rounded-xl border border-white/10 px-6 py-3 font-bold hover:bg-white/5">Открыть профиль</Link>}
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.id} className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#101010] p-4 transition hover:border-white/15 sm:flex-row sm:items-center sm:p-5">
                  <Link href={`/product/${item.id}`} className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#181818] sm:h-28 sm:w-28">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-contain transition group-hover:scale-105" /> : <span className="text-5xl">📦</span>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black uppercase tracking-[.18em] text-green-400">{item.category || "Товар"}</div>
                    <Link href={`/product/${item.id}`} className="mt-1 block text-xl font-black hover:text-green-300">{item.name}</Link>
                    <p className="mt-1 text-sm text-gray-500">{item.price} ₽ за штуку</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => save(items.map((x) => x.id === item.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))} className="h-9 w-9 rounded-xl border border-white/10 text-lg hover:bg-white/5">−</button>
                      <span className="flex h-9 min-w-12 items-center justify-center rounded-xl border border-white/10 bg-[#080808] px-3 font-black">{item.quantity}</span>
                      <button type="button" onClick={() => save(items.map((x) => x.id === item.id ? { ...x, quantity: Math.min(x.stock, x.quantity + 1) } : x))} disabled={item.quantity >= item.stock} className="h-9 w-9 rounded-xl border border-white/10 text-lg hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30">＋</button>
                      <span className="ml-1 text-xs text-gray-600">макс. {item.stock}</span>
                      <button type="button" onClick={() => save(items.filter((x) => x.id !== item.id))} className="ml-auto rounded-lg px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-400/10">Удалить</button>
                    </div>
                  </div>
                  <div className="self-end text-2xl font-black sm:self-center">{item.price * item.quantity} ₽</div>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-[2rem] border border-white/10 bg-[#101010] p-6 shadow-2xl lg:sticky lg:top-24">
              <p className="text-xs font-black uppercase tracking-[.2em] text-green-400">Оформление</p>
              <h2 className="mt-2 text-2xl font-black">Один заказ — все товары</h2>
              <label className="mt-7 block text-sm font-bold">Ник в Roblox <span className="text-red-400">*</span>
                <input value={roblox} onChange={(e) => setRoblox(e.target.value)} placeholder="Builder_123" autoComplete="off" className="mt-2 w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3.5 outline-none transition focus:border-green-400/60" />
              </label>
              <div className="mt-3 rounded-xl border border-green-400/10 bg-green-400/5 p-3 text-xs leading-5 text-gray-500">Укажи точный ник Roblox. Сотрудник будет использовать его для передачи предметов после покупки.</div>
              <div className="mt-7 space-y-3 border-t border-white/10 pt-5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Товаров</span><span>{count} шт.</span></div>
                <div className="flex items-end justify-between pt-2"><span className="font-semibold text-gray-300">Итого</span><span className="text-3xl font-black text-green-300">{total} ₽</span></div>
              </div>
              {message && <div className={`mt-5 rounded-xl p-3 text-sm leading-5 ${error ? "border border-red-500/20 bg-red-500/10 text-red-300" : "border border-green-400/20 bg-green-400/10 text-green-300"}`}>{message}</div>}
              <button type="button" onClick={checkout} disabled={loading} className="mt-6 w-full rounded-xl bg-green-400 px-4 py-4 font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Оформляем…" : `Оплатить ${total} ₽`}</button>
              <p className="mt-4 text-center text-xs leading-5 text-gray-600">После получения товара оставьте отзыв в профиле ⭐</p>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
