"use client";

import { useEffect, useState } from "react";

type TopUp = {
  id: string;
  username: string;
  amount: number;
  paymentAmount: number;
  status: string;
  createdAt: string;
  reference: string | null;
  paymentMethod: "SBP" | "TBANK";
};

export default function AdminTopUps() {
  const [items, setItems] = useState<TopUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/topups", { cache: "no-store" });
    const data = await response.json();
    if (response.ok && data.success) setItems(data.topUps);
    else setMessage(data.error || "Не удалось загрузить заявки");
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/topups", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) setItems(data.topUps);
        else setMessage(data.error || "Не удалось загрузить заявки");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMessage("Не удалось загрузить заявки");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function process(id: string, action: "APPROVE" | "REJECT") {
    setMessage("");
    const response = await fetch("/api/admin/topups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || "Не удалось обработать заявку");
      return;
    }
    await load();
    setMessage(action === "APPROVE" ? "Пополнение зачислено" : "Заявка отклонена");
  }

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-green-400">Balance</p>
          <h2 className="mt-2 text-2xl font-black">Пополнения</h2>
        </div>
        <button onClick={load} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Обновить</button>
      </div>

      {message && <div className="mb-4 rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300">{message}</div>}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#101010] p-8 text-gray-500">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#101010] p-8 text-center text-gray-500">Заявок пока нет.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#101010] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-bold">{item.username}</div>
                <div className="mt-1 text-2xl font-black text-green-400">Баланс: {item.amount} ₽</div>
                <div className="mt-1 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString("ru-RU")}</div>
                {item.reference && <div className="mt-1 text-xs text-green-300">Заявка: {item.reference}</div>}
                <div className="mt-1 text-sm text-gray-300">К оплате: <b className="text-white">{item.paymentAmount} ₽</b></div>
                <div className="mt-1 text-xs text-gray-500">{item.paymentMethod === "TBANK" ? "Т-Банк → карта" : "Другой банк → СБП"}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400">
                  {item.status === "PENDING" ? "На проверке" : item.status === "APPROVED" ? "Зачислено" : "Отклонено"}
                </span>
                {item.status === "PENDING" && (
                  <>
                    <button onClick={() => process(item.id, "APPROVE")} className="rounded-xl bg-green-400 px-4 py-2.5 text-sm font-bold text-black hover:bg-green-300">Зачислить</button>
                    <button onClick={() => process(item.id, "REJECT")} className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10">Отклонить</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
