"use client";

import { useState } from "react";

const amounts = [100, 250, 500, 1000];

type PaymentMethod = "SBP" | "TBANK";

export default function BalanceTopUp({
  sbpRecipient,
  sbpPhone,
  tbankCard,
  instructions,
}: {
  sbpRecipient: string;
  sbpPhone: string;
  tbankCard: string;
  instructions: string;
}) {
  const [amount, setAmount] = useState("100");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("SBP");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const numericAmount = Number(amount);
  const validAmount = Number.isInteger(numericAmount) && numericAmount >= 10 && numericAmount <= 100000;
  const paymentAmount = validAmount ? Math.ceil(numericAmount * 1.2) : 0;

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Скопировано");
    } catch {
      setMessage("Не удалось скопировать");
    }
  }

  async function createRequest() {
    if (!validAmount) {
      setMessage("Введите целую сумму от 10 до 100000 ₽.");
      return;
    }

    setLoading(true);
    setMessage("");
    setReference("");

    try {
      const response = await fetch("/api/topups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, paymentMethod }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Не удалось создать заявку");
        return;
      }

      setReference(data.topUp.reference || "");
      setMessage("Заявка создана. После проверки администратор зачислит сумму на баланс.");
    } catch {
      setMessage("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101010] p-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-green-400">Шаг 1</p>
      <h2 className="mt-2 text-2xl font-black">Выбери сумму</h2>
      <p className="mt-2 text-sm text-gray-500">Сначала выбери способ оплаты — реквизиты ниже поменяются автоматически.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {amounts.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => { setAmount(String(value)); setMessage(""); setReference(""); }}
            className={amount === String(value)
              ? "rounded-xl border border-green-400 bg-green-400/10 px-4 py-3 font-bold text-green-400"
              : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold hover:bg-white/10"}
          >
            {value} ₽
          </button>
        ))}
      </div>

      <input
        type="number"
        min="10"
        max="100000"
        step="1"
        value={amount}
        onChange={(e) => { setAmount(e.target.value); setMessage(""); setReference(""); }}
        className="mt-4 w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 outline-none focus:border-green-400/50"
        placeholder="Введите сумму"
      />

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-gray-300">Способ оплаты</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => { setPaymentMethod("SBP"); setMessage(""); setReference(""); }}
            className={paymentMethod === "SBP"
              ? "rounded-xl border border-green-400 bg-green-400/10 p-4 text-left"
              : "rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"}
          >
            <div className="font-bold">🏦 Другой банк</div>
            <div className="mt-1 text-sm text-gray-500">Оплата через СБП</div>
          </button>
          <button
            type="button"
            onClick={() => { setPaymentMethod("TBANK"); setMessage(""); setReference(""); }}
            className={paymentMethod === "TBANK"
              ? "rounded-xl border border-green-400 bg-green-400/10 p-4 text-left"
              : "rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"}
          >
            <div className="font-bold">💳 Т-Банк</div>
            <div className="mt-1 text-sm text-gray-500">Перевод на номер карты</div>
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-green-400/20 bg-green-400/5 p-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-400">Шаг 2 — перевод</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <span className="text-sm text-gray-400">На баланс поступит</span>
            <div className="mt-1 text-2xl font-black text-green-400">{validAmount ? numericAmount : "—"} ₽</div>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-400">Нужно перевести</span>
            <div className="mt-1 text-3xl font-black text-white">{validAmount ? paymentAmount : "—"} ₽</div>
          </div>
        </div>

        {paymentMethod === "SBP" ? (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm font-semibold text-gray-300">СБП</p>
            <p className="mt-2 text-xs text-gray-500">В банковском приложении выбери перевод через СБП потом Т банк и переведи указанную сумму.</p>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#080808] p-4">
              <div>
                <p className="text-xs text-gray-500">Номер телефона</p>
                <p className="mt-1 font-bold text-white">{sbpPhone}</p>
                <p className="mt-1 text-xs text-gray-500">Получатель: {sbpRecipient}</p>
              </div>
              <button type="button" onClick={() => copyText(sbpPhone)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/5">
                Копировать
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm font-semibold text-gray-300">Т-Банк → карта</p>
            <p className="mt-2 text-xs text-gray-500">Переведи указанную сумму на эту карту.</p>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#080808] p-4">
              <div>
                <p className="text-xs text-gray-500">Номер карты</p>
                <p className="mt-1 break-all font-bold text-white">{tbankCard}</p>
              </div>
              <button type="button" onClick={() => copyText(tbankCard)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/5">
                Копировать
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 whitespace-pre-wrap text-xs leading-5 text-gray-500">{instructions}</p>
      </div>

      <button
        type="button"
        onClick={createRequest}
        disabled={loading || !validAmount}
        className="mt-4 w-full rounded-xl bg-green-400 px-5 py-3 font-bold text-black hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Создаём заявку..." : "Я перевёл деньги — создать заявку"}
      </button>

      {reference && (
        <div className="mt-4 rounded-xl border border-green-400/20 bg-green-400/10 p-4">
          <p className="text-xs text-gray-400">Номер заявки</p>
          <p className="mt-1 font-bold text-green-300">{reference}</p>
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
          {message}
        </div>
      )}
    </div>
  );
}
