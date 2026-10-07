import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("session")?.value;
    if (!token) return Response.json({ success: false, error: "Войди в аккаунт" }, { status: 401 });
    const userId = await verifySession(token);
    if (!userId) return Response.json({ success: false, error: "Сессия недействительна" }, { status: 401 });

    const body = await request.json() as { productId?: string; quantity?: number };
    const productId = String(body.productId || "").trim();
    const quantity = Number(body.quantity ?? 1);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return Response.json({ success: false, error: "Некорректные данные покупки" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (product.stock < quantity) throw new Error("OUT_OF_STOCK");
      const totalPrice = product.price * quantity;
      const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.balance < totalPrice) throw new Error("INSUFFICIENT_BALANCE");

      const updatedUser = await tx.user.update({ where: { id: userId }, data: { balance: { decrement: totalPrice } }, select: { balance: true } });
      const updatedProduct = await tx.product.update({ where: { id: productId }, data: { stock: { decrement: quantity } }, select: { stock: true } });
      const order = await tx.order.create({
        data: { userId, productId, quantity, totalPrice, status: "PAID" },
        select: { id: true, totalPrice: true, status: true, createdAt: true },
      });
      return { order, balance: updatedUser.balance, stock: updatedProduct.stock };
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "PRODUCT_NOT_FOUND") return Response.json({ success: false, error: "Товар не найден" }, { status: 404 });
    if (message === "OUT_OF_STOCK") return Response.json({ success: false, error: "Недостаточно товара на складе" }, { status: 409 });
    if (message === "INSUFFICIENT_BALANCE") return Response.json({ success: false, error: "Недостаточно средств на балансе" }, { status: 409 });
    if (message === "USER_NOT_FOUND") return Response.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    console.error("ORDER CREATE ERROR:", error);
    return Response.json({ success: false, error: "Не удалось оформить покупку" }, { status: 500 });
  }
}
