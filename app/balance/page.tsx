import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import BalanceTopUp from "./BalanceTopUp";
import SiteHeader from "@/app/SiteHeader";
import { ensureTopUpTable, pool } from "@/app/lib/topups";

export default async function BalancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const userId = token ? await verifySession(token) : null;

  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, balance: true },
  });

  if (!user) redirect("/login");

  const sbpRecipient = process.env.TOPUP_SBP_RECIPIENT || "Получатель СБП ещё не настроен";
  const sbpPhone = process.env.TOPUP_SBP_PHONE || "Номер СБП ещё не настроен";
  const tbankCard = process.env.TOPUP_TBANK_CARD || "Номер карты Т-Банка ещё не настроен";
  const topUpInstructions = process.env.TOPUP_INSTRUCTIONS || "После перевода создай заявку ниже.";

  await ensureTopUpTable();
  const result = await pool.query(
    `SELECT "id", "amount", "status", "createdAt", "reference", "paymentMethod"
     FROM "TopUp"
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC
     LIMIT 20`,
    [userId]
  );

  return (
    <main className="min-h-screen text-white">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 rounded-[30px] border border-white/10 bg-gradient-to-br from-[#171717] via-[#101010] to-[#0b0b0b] p-7 shadow-2xl sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-400">
          Balance
        </p>
        <h1 className="mt-2 text-4xl font-black">Пополнение баланса</h1>
        <p className="mt-2 text-gray-500">
          Укажи сумму, которая должна поступить на баланс. К оплате будет добавлено 20% комиссии.
        </p>

        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <BalanceTopUp
            sbpRecipient={sbpRecipient}
            sbpPhone={sbpPhone}
            tbankCard={tbankCard}
            instructions={topUpInstructions}
          />

          <div className="rounded-2xl border border-white/10 bg-[#101010] p-6">
            <p className="text-sm text-gray-500">Текущий баланс</p>
            <p className="mt-2 text-4xl font-black text-green-400">{user.balance} ₽</p>
            <p className="mt-2 text-xs text-gray-500">Комиссия при пополнении: 20%</p>
            <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-gray-400">
              После перевода обязательно создай заявку на сайте. Администратор проверит перевод и зачислит сумму вручную.
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-black">История пополнений</h2>
          <div className="mt-5 space-y-3">
            {result.rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#101010] p-8 text-center text-gray-500">
                Пополнений пока нет.
              </div>
            ) : (
              result.rows.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101010] p-5">
                  <div>
                    <div className="font-bold">На баланс: {item.amount} ₽</div>
                    <div className="mt-1 text-sm text-gray-400">К оплате: {Math.ceil(Number(item.amount) * 1.2)} ₽</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString("ru-RU")}
                    </div>
                    {item.reference && (
                      <div className="mt-1 text-xs text-green-300">Заявка: {item.reference}</div>
                    )}
                    <div className="mt-1 text-xs text-gray-500">Способ: {item.paymentMethod === "TBANK" ? "Т-Банк → карта" : "Другой банк → СБП"}</div>
                  </div>
                  <span className="rounded-lg bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
                    {item.status === "PENDING" ? "На проверке" : item.status === "APPROVED" ? "Зачислено" : "Отклонено"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
