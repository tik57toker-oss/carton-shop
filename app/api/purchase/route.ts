import { cookies } from "next/headers";
import { verifySession } from "@/app/lib/session";
import { pool } from "@/app/lib/shop-data";
export async function POST(request: Request) {
 try {
  const token=(await cookies()).get("session")?.value; const userId=token?await verifySession(token):null;
  if(!userId)return Response.json({success:false,error:"Войдите в аккаунт, чтобы оформить заказ"},{status:401});
  const body=await request.json(); const robloxUsername=String(body.robloxUsername||"").trim().replace(/^@/,"");
  if(!/^[A-Za-z0-9_]{3,20}$/.test(robloxUsername))return Response.json({success:false,error:"Укажи корректный ник Roblox (3–20 символов: латиница, цифры и _)."},{status:400});
  const rawItems=Array.isArray(body.items)?body.items:[{productId:body.productId,quantity:body.quantity??1}];
  if(!rawItems.length||rawItems.length>50)return Response.json({success:false,error:"Корзина пуста или слишком много позиций"},{status:400});
  const quantities=new Map<string,number>();
  for(const x of rawItems){const id=String(x.productId||"");const q=Number(x.quantity??1);if(!id||!Number.isInteger(q)||q<1||q>99)return Response.json({success:false,error:"Некорректный товар или количество"},{status:400});quantities.set(id,(quantities.get(id)||0)+q)}
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   await client.query(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "robloxUsername" TEXT`);
   const ids=[...quantities.keys()].sort(); const products=new Map<string,any>();
   for(const id of ids){const result=await client.query(`SELECT "id","name","price","stock" FROM "Product" WHERE "id"=$1 FOR UPDATE`,[id]);if(!result.rows[0])throw new Error(`Товар не найден: ${id}`);const product=result.rows[0];const q=quantities.get(id)!;if(Number(product.stock)<q)throw new Error(`Недостаточно товара «${product.name}». Осталось: ${product.stock}`);products.set(id,product)}
   const totalPrice=[...quantities].reduce((sum,[id,q])=>sum+Number(products.get(id).price)*q,0);
   const bal=await client.query(`UPDATE "User" SET "balance"="balance"-$1,"updatedAt"=NOW() WHERE "id"=$2 AND "balance">=$1 RETURNING "balance"`,[totalPrice,userId]);
   if(!bal.rows[0])throw new Error(`Недостаточно средств на балансе. Нужно ${totalPrice} ₽`);
   const orders=[];
   for(const [id,q] of quantities){const product=products.get(id);await client.query(`UPDATE "Product" SET "stock"="stock"-$1,"updatedAt"=NOW() WHERE "id"=$2`,[q,id]);const orderId=crypto.randomUUID();await client.query(`INSERT INTO "Order" ("id","userId","productId","quantity","totalPrice","status","robloxUsername") VALUES ($1,$2,$3,$4,$5,'PAID',$6)`,[orderId,userId,id,q,Number(product.price)*q,robloxUsername]);orders.push({orderId,productName:product.name,quantity:q,totalPrice:Number(product.price)*q})}
   await client.query("COMMIT");return Response.json({success:true,orders,totalPrice,balance:Number(bal.rows[0].balance),robloxUsername});
  }catch(error){await client.query("ROLLBACK");const message=error instanceof Error?error.message:"Не удалось оформить заказ";const status=message.includes("Недостаточно")?400:message.includes("не найден")?404:409;return Response.json({success:false,error:message},{status})}finally{client.release()}
 }catch(error){console.error("PURCHASE ERROR:",error);return Response.json({success:false,error:"Не удалось оформить покупку"},{status:500})}
}
