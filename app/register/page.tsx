"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Не удалось создать аккаунт");
        return;
      }

      router.push("/login");
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/10 bg-[#0d0d0d]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-white">CARTON</span>{" "}
            <span className="text-green-400">SHOP</span>
          </Link>

          <Link
            href="/"
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← На главную
          </Link>
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-400/10 text-3xl">
              ✨
            </div>

            <h1 className="text-3xl font-black">
              Создание аккаунта
            </h1>

            <p className="mt-2 text-gray-500">
              Создай аккаунт Carton Shop
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-2xl"
          >
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Логин
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Придумай логин"
                  autoComplete="username"
                  minLength={3}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-green-400/60"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-green-400/60"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Пароль
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Минимум 6 символов"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-green-400/60"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-green-400 px-4 py-3 font-bold text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Создаём аккаунт..." : "Создать аккаунт"}
              </button>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-gray-500">
                Уже есть аккаунт?
              </p>

              <Link
                href="/login"
                className="mt-1 inline-block text-sm font-semibold text-green-400 transition hover:text-green-300"
              >
                Войти →
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
