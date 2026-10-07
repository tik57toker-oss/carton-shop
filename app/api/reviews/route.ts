import { cookies } from "next/headers";
import { verifySession } from "@/app/lib/session";
import { ensureReviewsTable, pool } from "@/app/lib/reviews";

async function auth() { const token=(await cookies()).get("session")?.value; return token ? verifySession(token) : null; }

export async function POST(request: Request) {
  const userId=await auth();
  if(!userId) return Response.redirect(new URL("/login", request.url));
  await ensureReviewsTable();
  const contentType=request.headers.get("content-type")||"";
  const body=contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const orderId=String(body.orderId||""); const message=String(body.message||"").trim(); const rating=Number(body.rating);
  if(!orderId || !Number.isInteger(rating) || rating<1 || rating>5 || !message || message.length>1000) return Response.json({success:false,error:"Укажи оценку от 1 до 5 и текст отзыва"},{status:400});
  const order=await pool.query(`SELECT "id","productId" FROM "Order" WHERE "id"=$1 AND "userId"=$2 AND "status"='DELIVERED'`,[orderId,userId]);
  if(!order.rows[0]) return Response.json({success:false,error:"Покупка не найдена"},{status:404});
  const existing=await pool.query(`SELECT "id" FROM "Review" WHERE "orderId"=$1`,[orderId]);
  if(existing.rows[0]) {
    if (contentType.includes("application/json")) {
      return Response.json({success:false,error:"Отзыв на эту покупку уже оставлен"},{status:409});
    }
    return Response.redirect(new URL("/profile?review=already", request.url), 303);
  }
  await pool.query(`INSERT INTO "Review" ("id","userId","orderId","productId","rating","message") VALUES ($1,$2,$3,$4,$5,$6)`,[crypto.randomUUID(),userId,orderId,order.rows[0].productId,rating,message]);
  if(contentType.includes("application/json")) return Response.json({success:true});
  return Response.redirect(new URL("/profile?review=success",request.url),303);
}
