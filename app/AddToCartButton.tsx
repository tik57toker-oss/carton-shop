"use client";
import { useState } from "react";

type Props={product:{id:string;name:string;price:number;stock:number;image:string|null;category:string|null}};
export default function AddToCartButton({product}:Props){
 const [added,setAdded]=useState(false);
 function add(){
  if(product.stock<1)return;
  try{
   const key="carton-shop-cart"; const raw=localStorage.getItem(key); const cart=raw?JSON.parse(raw):[];
   const found=cart.find((x:any)=>x.id===product.id);
   if(found)found.quantity=Math.min(product.stock,Number(found.quantity||1)+1);else cart.push({...product,quantity:1});
   localStorage.setItem(key,JSON.stringify(cart)); window.dispatchEvent(new Event("cart-updated")); setAdded(true); setTimeout(()=>setAdded(false),1400);
  }catch{ setAdded(false); }
 }
 return <button type="button" onClick={add} disabled={product.stock<1} className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-sm font-black text-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-400/15 disabled:opacity-40">{product.stock<1?"Нет в наличии":added?"✓ В корзине":"＋ В корзину"}</button>
}
