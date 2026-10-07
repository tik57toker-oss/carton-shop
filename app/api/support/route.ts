import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import { ensureSupportTable, pool } from "@/app/lib/support";
async function auth() { const token=(await cookies()).get("session")?.value; return token ? verifySession(token) : null; }
export async function GET() {
  const userId=await auth(); if(!userId) return Response.json({success:false,error:"Не авторизован"},{status:401});
  await ensureSupportTable();
  const tickets=await pool.query(`SELECT t."id",t."subject",t."status",t."createdAt",t."updatedAt",COALESCE(json_agg(json_build_object('id',m."id",'message',m."message",'createdAt',m."createdAt",'username',u."username") ORDER BY m."createdAt") FILTER (WHERE m."id" IS NOT NULL),'[]') AS messages FROM "SupportTicket" t LEFT JOIN "SupportMessage" m ON m."ticketId"=t."id" LEFT JOIN "User" u ON u."id"=m."userId" WHERE t."userId"=$1 GROUP BY t."id" ORDER BY t."updatedAt" DESC`,[userId]);
  return Response.json({success:true,tickets:tickets.rows});
}
export async function POST(request:Request){
  const userId=await auth(); if(!userId) return Response.json({success:false,error:"Не авторизован"},{status:401});
  await ensureSupportTable(); const body=await request.json(); const subject=String(body.subject||"").trim(); const message=String(body.message||"").trim();
  if(!subject||subject.length>120||!message||message.length>5000) return Response.json({success:false,error:"Заполни тему и сообщение"},{status:400});
  const ticketId=crypto.randomUUID(); const messageId=crypto.randomUUID();
  await pool.query("BEGIN"); try { await pool.query(`INSERT INTO "SupportTicket" ("id","userId","subject") VALUES ($1,$2,$3)`,[ticketId,userId,subject]); await pool.query(`INSERT INTO "SupportMessage" ("id","ticketId","userId","message") VALUES ($1,$2,$3,$4)`,[messageId,ticketId,userId,message]); await pool.query("COMMIT"); return Response.json({success:true,ticketId},{status:201}); } catch(e){await pool.query("ROLLBACK"); throw e;}
}
