"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/app/SiteHeader";

type Message={id:string;message:string;createdAt:string;username:string};
type Ticket={id:string;subject:string;status:string;createdAt:string;updatedAt:string;messages:Message[]};

const statusMap: Record<string,{label:string;className:string;description:string}> = {
  OPEN:{label:"Открыта",className:"border-green-400/20 bg-green-400/10 text-green-300",description:"Заявка ожидает ответа или уточнения."},
  ANSWERED:{label:"Есть ответ",className:"border-blue-400/20 bg-blue-400/10 text-blue-300",description:"Сотрудник ответил на заявку."},
  APPROVED:{label:"Одобрено",className:"border-emerald-400/20 bg-emerald-400/10 text-emerald-300",description:"Заявка одобрена сотрудником."},
  REJECTED:{label:"Отказано",className:"border-red-400/20 bg-red-400/10 text-red-300",description:"Заявка отклонена сотрудником."},
  CLOSED:{label:"Закрыта",className:"border-white/10 bg-white/5 text-gray-400",description:"Заявка завершена. Для нового вопроса создайте новую заявку."},
};

export default function SupportPage(){
  const[tickets,setTickets]=useState<Ticket[]>([]); const[subject,setSubject]=useState(""); const[message,setMessage]=useState(""); const[reply,setReply]=useState<Record<string,string>>({}); const[loading,setLoading]=useState(true); const[msg,setMsg]=useState("");
  async function load(){const r=await fetch("/api/support",{cache:"no-store"});const d=await r.json();if(r.status===401){window.location.href="/login";return;}if(d.success)setTickets(d.tickets);else setMsg(d.error||"Ошибка");setLoading(false);}
  useEffect(()=>{load();},[]);
  async function create(){setMsg("");const r=await fetch("/api/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject,message})});const d=await r.json();if(!r.ok){setMsg(d.error||"Ошибка");return;}setSubject("");setMessage("");setMsg("Заявка создана — сотрудник скоро ответит.");load();}
  async function send(ticketId:string){const text=reply[ticketId]?.trim();if(!text)return;const r=await fetch("/api/support/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticketId,message:text})});const d=await r.json();if(!r.ok){setMsg(d.error||"Ошибка");return;}setReply(x=>({...x,[ticketId]:""}));load();}
  return <main className="min-h-screen text-white"><SiteHeader/><section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
    <div className="mb-10 overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#171717] via-[#101010] to-[#0b0b0b] p-7 shadow-2xl sm:p-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[.3em] text-green-400">CARTON SUPPORT</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Чат с сотрудником</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">Задайте вопрос по заказу, оплате или получению предмета. Ваши заявки видны только вам и сотрудникам магазина.</p></div>
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 px-5 py-4 text-sm text-gray-300"><span className="font-bold text-amber-300">Важно</span><br/>Закрытую заявку нельзя продолжить. Для нового вопроса создайте новую.</div>
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <div className="h-fit rounded-[26px] border border-white/10 bg-[#101010] p-6 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[.25em] text-green-400">Новая заявка</p><h2 className="mt-2 text-2xl font-black">Чем помочь?</h2>
        <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Например: вопрос по заказу" className="mt-6 w-full rounded-2xl border border-white/10 bg-[#080808] px-4 py-3.5 outline-none transition focus:border-green-400/40"/>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Опишите проблему или вопрос..." rows={7} className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-[#080808] px-4 py-3.5 outline-none transition focus:border-green-400/40"/>
        <button onClick={create} disabled={!subject.trim()||!message.trim()} className="mt-4 w-full rounded-2xl bg-green-400 px-5 py-3.5 font-black text-black shadow-lg shadow-green-400/10 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-40">Создать заявку</button>
        {msg&&<p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-300">{msg}</p>}
      </div>
      <div className="space-y-5">
        {loading?<div className="rounded-[26px] border border-white/10 bg-[#101010] p-10 text-gray-500">Загрузка заявок...</div>:tickets.length===0?<div className="rounded-[26px] border border-dashed border-white/10 bg-[#101010] p-10 text-center"><div className="text-4xl">💬</div><h2 className="mt-4 text-xl font-black">Пока нет заявок</h2><p className="mt-2 text-sm text-gray-500">Создайте первую заявку слева.</p></div>:tickets.map(t=>{const s=statusMap[t.status]||statusMap.OPEN;const locked=["CLOSED","APPROVED","REJECTED"].includes(t.status);return <article key={t.id} className="overflow-hidden rounded-[26px] border border-white/10 bg-[#101010] shadow-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-600">#{t.id.slice(0,8)}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${s.className}`}>{s.label}</span></div><h2 className="mt-3 text-xl font-black">{t.subject}</h2><p className="mt-1 text-xs text-gray-600">Обновлено {new Date(t.updatedAt).toLocaleString("ru-RU")}</p></div><div className="max-w-xs text-right text-xs leading-5 text-gray-500">{s.description}</div></div>
          <div className="space-y-3 p-6">{t.messages.map(m=><div key={m.id} className={`max-w-[90%] rounded-2xl p-4 ${m.username?"bg-[#080808]":"bg-green-400/10"}`}><div className="text-[11px] font-black uppercase tracking-widest text-green-400">{m.username}</div><div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-300">{m.message}</div><div className="mt-2 text-[10px] text-gray-600">{new Date(m.createdAt).toLocaleString("ru-RU")}</div></div>)}</div>
          <div className="border-t border-white/10 p-6">{locked?<div className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm text-gray-500">🔒 Эта заявка завершена. Отправить новое сообщение сюда нельзя. Если нужна помощь — создайте новую заявку.</div>:<div className="flex flex-col gap-3 sm:flex-row"><input value={reply[t.id]||""} onChange={e=>setReply(x=>({...x,[t.id]:e.target.value}))} placeholder="Написать сотруднику..." className="flex-1 rounded-2xl border border-white/10 bg-[#080808] px-4 py-3.5 outline-none focus:border-green-400/40"/><button onClick={()=>send(t.id)} className="rounded-2xl bg-green-400 px-5 py-3.5 font-black text-black transition hover:bg-green-300">Отправить</button></div>}</div>
        </article>})}
      </div>
    </div>
  </section></main>
}
