import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { verifySession } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { ensureCategoryTable, ensureProductVisibilityTable, pool as shopPool } from "@/app/lib/shop-data";
import AddToCartButton from "@/app/AddToCartButton";
import SiteHeader from "@/app/SiteHeader";

type Product = { id:string; name:string; description:string; price:number; stock:number; image:string|null; category:string|null; imageScale:number; imageFit:string; };

export default async function Home() {
  const token = (await cookies()).get("session")?.value;
  let isAdmin = false;
  if (token) { const userId = await verifySession(token); if (userId) { const user = await prisma.user.findUnique({ where:{id:userId}, select:{role:true} }); isAdmin = user?.role === "ADMIN"; } }
  await ensureCategoryTable();
  await ensureProductVisibilityTable();
  const categories = (await shopPool.query(`SELECT "id", "name" FROM "Category" ORDER BY "name" ASC`)).rows as {id:string;name:string}[];
  const products = (await shopPool.query(`SELECT * FROM "Product" WHERE COALESCE("isVisible", TRUE) = TRUE ORDER BY "createdAt" DESC`)).rows as Product[];

  return <main className="min-h-screen text-white"><SiteHeader admin={isAdmin}/>
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-amber-300"><span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_#35e58b]"/> Магазин открыт</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[.96] tracking-[-.04em] sm:text-7xl">Предметы для <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">Lumber Tycoon 2</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">Покупай игровые предметы через Carton Shop, собирай несколько товаров в корзину и указывай Roblox ник при оформлении заказа.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#products" className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 font-black text-black shadow-[0_10px_35px_rgba(255,166,35,.18)] transition hover:-translate-y-0.5">Смотреть товары</a><Link href="/reviews" className="rounded-2xl border border-white/10 bg-white/[.03] px-6 py-3.5 font-bold text-gray-200 transition hover:bg-white/[.06]">Отзывы покупателей</Link></div>
          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3"><div className="glass rounded-2xl p-4"><div className="text-xl font-black">⚡</div><div className="mt-2 text-xs text-gray-500">Быстрое оформление</div></div><div className="glass rounded-2xl p-4"><div className="text-xl font-black">🛒</div><div className="mt-2 text-xs text-gray-500">Общая корзина</div></div><div className="glass rounded-2xl p-4"><div className="text-xl font-black">⭐</div><div className="mt-2 text-xs text-gray-500">Отзывы после получения</div></div></div>
        </div>
        <div className="relative mx-auto w-full max-w-[560px]"><div className="absolute inset-8 rounded-full bg-amber-400/10 blur-3xl"/><div className="shine gold-glow relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-black/40 p-3"><Image src="/carton-logo.png" alt="Carton Shop" width={1024} height={1024} className="relative z-10 h-auto w-full rounded-[1.5rem] object-cover" priority/></div></div>
      </div>
    </section>

    <section id="categories" className="mx-auto max-w-7xl px-5 py-14 sm:px-6"><div className="mb-7 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.25em] text-amber-400">Explore</p><h2 className="mt-2 text-3xl font-black">Категории</h2></div><span className="text-sm text-gray-600">Выбери свой стиль</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map((c,i)=><Link href={`/#products`} key={c.id} className="shine glass group rounded-3xl p-5 transition hover:-translate-y-1 hover:border-amber-400/25"><div className="flex items-center justify-between"><span className="text-3xl">{i===0?"📦":i===1?"🪵":i===2?"🎨":"⭐"}</span><span className="text-xs text-gray-600">0{i+1}</span></div><h3 className="mt-5 text-lg font-black group-hover:text-amber-300">{c.name}</h3><p className="mt-1 text-sm text-gray-500">Предметы категории {c.name}</p></Link>)}</div></section>

    <section className="mx-auto max-w-7xl px-5 pb-4 sm:px-6"><Link href="/reviews" className="group flex flex-col gap-5 rounded-[2rem] border border-amber-400/15 bg-gradient-to-r from-amber-400/10 via-[#111] to-[#111] p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.22em] text-amber-400">После получения</p><h2 className="mt-2 text-2xl font-black">Получил товар — оставь отзыв ⭐</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">После того как сотрудник отметит заказ как выданный, в профиле появится кнопка для отзыва.</p></div><span className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-200 group-hover:bg-amber-400/15">Все отзывы →</span></Link></section>

    <section id="products" className="mx-auto max-w-7xl px-5 py-14 sm:px-6"><div className="mb-8 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.25em] text-green-400">Store</p><h2 className="mt-2 text-4xl font-black">Популярные товары</h2></div><span className="text-sm text-gray-500">{products.length} товаров</span></div>{products.length===0?<div className="glass rounded-3xl p-12 text-center text-gray-500">Товаров пока нет.</div>:<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map(p=><article key={p.id} className="product-card group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101111]"><Link href={`/product/${p.id}`} className="block"><div className="relative h-60 overflow-hidden bg-[#171818]"><div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-gray-300 backdrop-blur">{p.category||"Товар"}</div>{p.image?<img src={p.image} alt={p.name} className="h-full w-full transition duration-500 group-hover:scale-105" style={{objectFit:p.imageFit==="contain"?"contain":"cover",transform:`scale(${(p.imageScale??100)/100})`}}/>:<div className="flex h-full items-center justify-center text-7xl">{p.category==="Boxes"?"📦":p.category==="Wood"?"🪵":"🎨"}</div>}<div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent"/></div></Link><div className="p-5"><Link href={`/product/${p.id}`}><h3 className="text-xl font-black transition group-hover:text-amber-300">{p.name}</h3></Link><p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">{p.description}</p><div className="mt-5 flex items-end justify-between gap-3"><div><div className="text-2xl font-black">{p.price} ₽</div><div className={`mt-1 text-xs ${p.stock>0?"text-green-400":"text-red-400"}`}>{p.stock>0?`В наличии: ${p.stock}`:"Нет в наличии"}</div></div><AddToCartButton product={{id:p.id,name:p.name,price:p.price,stock:p.stock,image:p.image,category:p.category}}/></div></div></article>)}</div>}</section>

    <footer className="mt-8 border-t border-white/10 bg-black/30"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="font-bold text-gray-400">CARTON <span className="text-green-400">SHOP</span></div><div>© 2026 · Предметы для Lumber Tycoon 2</div><div className="flex gap-4"><Link href="/reviews" className="hover:text-white">Отзывы</Link><Link href="/support" className="hover:text-white">Поддержка</Link></div></div></footer>
  </main>;
}
