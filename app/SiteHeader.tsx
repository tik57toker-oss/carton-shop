"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const KEY = "carton-shop-cart";

export default function SiteHeader({ admin = false }: { admin?: boolean }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    const load = () => {
      try {
        const items = JSON.parse(localStorage.getItem(KEY) || "[]");
        setCount(Array.isArray(items) ? items.reduce((sum: number, item: { quantity?: number }) => sum + Number(item.quantity || 0), 0) : 0);
      } catch { setCount(0); }
    };
    load();
    window.addEventListener("cart-updated", load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener("cart-updated", load); window.removeEventListener("storage", load); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-rating", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || !data?.success) return;
        setRating(Number(data.average || 0));
        setRatingCount(Number(data.count || 0));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const links = [
    ["Товары", "/#products"], ["Категории", "/#categories"], ["Отзывы", "/reviews"], ["Поддержка", "/support"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080808]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="mr-auto flex items-center gap-3">
          <Image src="/carton-logo.png" alt="Carton Shop" width={48} height={48} className="h-11 w-11 rounded-xl object-cover" priority />
          <div className="hidden sm:block leading-none">
            <div className="text-lg font-black tracking-tight">CARTON <span className="text-green-400">SHOP</span></div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[.24em] text-gray-500">Lumber Tycoon 2</div>
          </div>
        </Link>
        <Link
            href="/reviews"
            aria-label="Рейтинг Carton Shop"
            className="hidden min-w-[104px] rounded-xl border border-amber-300/15 bg-amber-300/[.04] px-3 py-2 transition hover:border-amber-300/30 hover:bg-amber-300/[.08] md:block"
          >
            <div className="flex items-center gap-1.5 text-sm font-black text-amber-300">
              <span>★</span>
              <span>{rating === null ? "—" : rating.toFixed(1)}</span>
              <span className="text-gray-600">/5</span>
            </div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[.12em] text-gray-500">
              {ratingCount ? `${ratingCount} отзыв${ratingCount === 1 ? "" : ratingCount < 5 ? "а" : "ов"}` : "Пока без отзывов"}
            </div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white">{label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative rounded-xl border gold-border bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-400/15 sm:px-4">🛒 <span className="hidden sm:inline">Корзина</span>{count > 0 && <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-black text-black">{count}</span>}</Link>
          <Link href="/profile" className="hidden rounded-xl border border-white/10 bg-white/[.02] px-4 py-2 text-sm font-semibold text-gray-300 transition hover:-translate-y-0.5 hover:border-green-400/20 hover:bg-green-400/5 hover:text-white sm:block">👤 Профиль</Link>
          <button type="button" aria-label="Меню" onClick={() => setOpen(!open)} className="rounded-xl border border-white/10 px-3 py-2 text-gray-300 lg:hidden">☰</button>
        </div>
      </div>
      {open && <div className="border-t border-white/10 bg-[#0b0b0b] p-3 lg:hidden"><div className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2">{links.map(([label, href]) => <Link key={href} onClick={() => setOpen(false)} href={href} className="rounded-xl px-4 py-3 text-sm text-gray-300 hover:bg-white/5">{label}</Link>)}<Link href="/balance" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm text-gray-300 hover:bg-white/5">Баланс</Link><Link href="/profile" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm text-gray-300 hover:bg-white/5">Профиль</Link>{admin && <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-300">⚙ Админ-панель</Link>}</div></div>}
    </header>
  );
}
