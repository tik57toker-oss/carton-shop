"use client";

import { useEffect, useState } from "react";

type Order = { id: string; username: string; robloxUsername: string; productName: string; quantity: number; totalPrice: number; status: string; createdAt: string };

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = await response.json();
    if (data.success) setOrders(data.orders);
    else setMessage(data.error || "Ошибка");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || "Ошибка");
      return;
    }
    load();
  }

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-green-400">Orders</p>
          <h2 className="mt-2 text-2xl font-black">Заказы и выдача</h2>
          <p className="mt-1 text-sm text-gray-500">Здесь сотрудник видит ник Roblox и может отметить товар выданным.</p>
        </div>
        <button onClick={load} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Обновить</button>
      </div>
      {message && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{message}</div>}
      {loading ? <div className="rounded-2xl border border-white/10 bg-[#101010] p-8 text-gray-500">Загрузка...</div> : orders.length === 0 ? <div className="rounded-2xl border border-white/10 bg-[#101010] p-8 text-gray-500">Заказов пока нет.</div> : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-white/10 bg-[#101010] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><span className="font-bold">{order.productName}</span><span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gray-400">×{order.quantity}</span><span className={`rounded-lg px-2 py-1 text-xs font-bold ${order.status === "DELIVERED" ? "bg-green-400/10 text-green-300" : "bg-yellow-400/10 text-yellow-300"}`}>{order.status === "DELIVERED" ? "Выдан" : "Ожидает выдачи"}</span></div>
                  <p className="mt-2 text-sm text-gray-500">Покупатель: {order.username} · Roblox: <span className="font-bold text-white">{order.robloxUsername || "—"}</span></p>
                  <p className="mt-1 text-xs text-gray-600">{new Date(order.createdAt).toLocaleString("ru-RU")} · {order.totalPrice} ₽</p>
                </div>
                {order.status === "PAID" && <button onClick={() => setStatus(order.id, "DELIVERED")} className="rounded-xl bg-green-400 px-5 py-3 text-sm font-black text-black hover:bg-green-300">✓ Отметить выданным</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
