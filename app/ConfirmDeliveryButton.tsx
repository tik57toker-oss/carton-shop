"use client";

import { useState } from "react";

export default function ConfirmDeliveryButton({ orderId, onDone }: { orderId: string; onDone?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelivery() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/orders/confirm-delivery", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({orderId}) });
      const data = await response.json();
      if (!response.ok || !data.success) { setError(data.error || "Не удалось подтвердить получение"); return; }
      onDone?.(); window.location.reload();
    } catch { setError("Ошибка соединения"); } finally { setLoading(false); }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mt-3 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-2 text-xs font-black text-green-300 transition hover:bg-green-400/20">✓ Я получил товар</button>
      {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111212] p-6 shadow-2xl">
          <div className="text-xs font-black uppercase tracking-[.2em] text-green-400">Получение заказа</div>
          <h3 className="mt-2 text-2xl font-black">Ты уже получил товар?</h3>
          <p className="mt-3 text-sm leading-6 text-gray-500">После подтверждения заказа откроется форма, где можно оставить отзыв.</p>
          {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-4 py-3 font-bold text-gray-300 hover:bg-white/5">Не сейчас</button>
            <button type="button" onClick={confirmDelivery} disabled={loading} className="rounded-xl bg-green-400 px-4 py-3 font-black text-black hover:bg-green-300 disabled:opacity-50">{loading?"Подтверждаем…":"Да, получил"}</button>
          </div>
        </div>
      </div>}
    </>
  );
}
