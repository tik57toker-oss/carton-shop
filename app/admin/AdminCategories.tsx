"use client";
import { useState } from "react";

type Category = { id: string; name: string; createdAt: string };
export default function AdminCategories({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createCategory() {
    setLoading(true); setMessage("");
    try {
      const r = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const d = await r.json();
      if (!r.ok || !d.success) { setMessage(d.error || "Ошибка"); return; }
      setCategories((x) => [...x, d.category].sort((a, b) => a.name.localeCompare(b.name)));
      setName(""); setMessage("Категория создана");
    } catch { setMessage("Ошибка соединения"); } finally { setLoading(false); }
  }

  async function removeCategory(id: string, categoryName: string) {
    if (!confirm(`Удалить категорию «${categoryName}»? Товары этой категории останутся без категории.`)) return;
    const r = await fetch("/api/admin/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const d = await r.json();
    if (!r.ok || !d.success) { setMessage(d.error || "Не удалось удалить"); return; }
    setCategories((x) => x.filter((c) => c.id !== id)); setMessage("Категория удалена");
  }

  return <section className="mt-10 overflow-hidden rounded-[26px] border border-white/10 bg-[#101010] shadow-2xl">
    <div className="border-b border-white/8 bg-gradient-to-r from-[#17130d] via-[#111] to-[#101010] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[.25em] text-amber-300">Catalog</p><h2 className="mt-2 text-2xl font-black">Категории</h2><p className="mt-1 text-sm text-white/40">Категории создаются только вручную администратором. Сайт больше не добавляет их автоматически.</p></div>
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 px-4 py-3 text-xs font-semibold text-amber-200">🛠 Ручное управление</div>
      </div>
    </div>
    <div className="p-6">
    <div className="flex flex-col gap-3 sm:flex-row">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Limited" className="flex-1 rounded-xl border border-white/10 bg-[#080808] px-4 py-3 outline-none focus:border-green-400/50" />
      <button onClick={createCategory} disabled={loading || !name.trim()} className="rounded-xl bg-green-400 px-5 py-3 font-bold text-black disabled:opacity-50">{loading ? "Создаём..." : "Создать категорию"}</button>
    </div>
    {message && <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-300">{message}</div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#080808] p-4"><span className="font-semibold">{c.name}</span><button onClick={() => removeCategory(c.id, c.name)} className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10">Удалить</button></div>)}
    </div>
    </div>
  </section>;
}
