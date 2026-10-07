"use client";

import { useRef, useState } from "react";

export default function AvatarEditor({ initialUrl, username }: { initialUrl: string | null; username: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const fallback = username.charAt(0).toUpperCase();

  async function upload(file: File) {
    setLoading(true); setMessage(""); setError(false);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Не удалось обновить аватар");
      setAvatar(`${data.avatarUrl}?v=${Date.now()}`);
      setMessage("Аватар обновлён");
    } catch (e) {
      setError(true); setMessage(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally { setLoading(false); }
  }

  async function remove() {
    setLoading(true); setMessage(""); setError(false);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Не удалось удалить аватар");
      setAvatar(null); setMessage("Аватар удалён");
    } catch (e) {
      setError(true); setMessage(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="avatar-ring relative shrink-0">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-amber-300 to-orange-500 text-4xl font-black text-black shadow-2xl shadow-amber-500/10">
          {avatar ? <img src={avatar} alt="Аватар" className="h-full w-full object-cover" /> : fallback}
        </div>
        <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-2xl border-4 border-[#151515] bg-green-400 text-sm text-black">✓</span>
      </div>
      <div className="text-center sm:text-left">
        <p className="text-xs font-black uppercase tracking-[.24em] text-gray-500">Фото профиля</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <button type="button" disabled={loading} onClick={() => inputRef.current?.click()} className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-gray-200 disabled:opacity-50">{loading ? "Загрузка..." : "Изменить аватар"}</button>
          {avatar && <button type="button" disabled={loading} onClick={remove} className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50">Удалить</button>}
        </div>
        <p className="mt-2 text-xs text-gray-600">JPG, PNG или WEBP · максимум 3 МБ</p>
        {message && <p className={`mt-2 text-xs font-semibold ${error ? "text-red-300" : "text-green-300"}`}>{message}</p>}
        <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file=e.target.files?.[0]; if(file) upload(file); e.currentTarget.value=""; }} />
      </div>
    </div>
  );
}
