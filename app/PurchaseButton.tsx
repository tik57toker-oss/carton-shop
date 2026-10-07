"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function PurchaseButton({
  productId,
  productName,
  price,
  stock,
}: {
  productId: string;
  productName: string;
  price: number;
  stock: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const total = price * quantity;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, loading]);

  function openModal() {
    if (stock <= 0 || loading) return;
    setMessage("");
    setError(false);
    setQuantity(1);
    setOpen(true);
  }

  async function buy() {
    if (loading || stock <= 0) return;
    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        setError(true);
        setMessage(data.error || "Не удалось купить товар");
        return;
      }

      setMessage(`Покупка оформлена! Заказ #${String(data.orderId).slice(0, 8)} · ${data.totalPrice} ₽`);
      setOpen(false);
    } catch {
      setError(true);
      setMessage("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={openModal}
          disabled={loading || stock <= 0}
          className="rounded-2xl bg-green-400 px-5 py-3 text-sm font-black text-black shadow-[0_10px_30px_rgba(74,222,128,0.14)] transition hover:-translate-y-0.5 hover:bg-green-300 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
        >
          {loading ? "Покупаем..." : stock > 0 ? "Купить сейчас" : "Нет в наличии"}
        </button>
        {message && (
          <p className={`max-w-64 text-right text-xs ${error ? "text-red-400" : "text-green-400"}`}>
            {message}
          </p>
        )}
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-[0_30px_100px_rgba(0,0,0,0.7)]">
            <div className="border-b border-white/10 px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">Покупка товара</div>
                  <h3 className="mt-2 text-2xl font-black text-white">{productName}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="rounded-xl border border-white/10 px-3 py-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-7">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Цена за 1 шт.</div>
                    <div className="mt-1 text-2xl font-black">{price} ₽</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">В наличии</div>
                    <div className="mt-1 font-bold text-green-400">{stock} шт.</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">Количество</span>
                  <span className="text-xs text-gray-500">до {stock} шт.</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    disabled={quantity <= 1 || loading}
                    className="h-12 w-12 rounded-xl border border-white/10 text-xl font-bold transition hover:bg-white/5 disabled:opacity-30"
                  >
                    −
                  </button>
                  <div className="flex h-12 flex-1 items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a] text-lg font-black">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
                    disabled={quantity >= stock || loading}
                    className="h-12 w-12 rounded-xl border border-white/10 text-xl font-bold transition hover:bg-white/5 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-green-400/15 bg-green-400/[0.06] p-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm text-gray-400">Итого к оплате</span>
                  <span className="text-3xl font-black text-green-300">{total} ₽</span>
                </div>
              </div>

              <p className="text-xs leading-5 text-gray-500">
                Сумма будет списана с баланса аккаунта. Перед подтверждением проверьте количество и итоговую стоимость.
              </p>

              <button
                type="button"
                onClick={buy}
                disabled={loading}
                className="w-full rounded-2xl bg-green-400 px-5 py-4 font-black text-black transition hover:bg-green-300 disabled:opacity-60"
              >
                {loading ? "Оформляем покупку..." : `Подтвердить покупку · ${total} ₽`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
