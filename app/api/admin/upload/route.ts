import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySession } from "@/app/lib/session";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return Response.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const userId = await verifySession(token);

    if (!userId) {
      return Response.json(
        { success: false, error: "Сессия недействительна" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return Response.json(
        { success: false, error: "Доступ запрещён" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { success: false, error: "Файл не выбран" },
        { status: 400 }
      );
    }

    const extension = allowedTypes[file.type];

    if (!extension) {
      return Response.json(
        { success: false, error: "Разрешены только JPG, PNG, WEBP и GIF" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        { success: false, error: "Максимальный размер файла — 5 МБ" },
        { status: 400 }
      );
    }

    const filename = `${crypto.randomUUID()}${extension}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products"
    );

    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);

    return Response.json({
      success: true,
      url: `/uploads/products/${filename}`,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return Response.json(
      { success: false, error: "Не удалось загрузить изображение" },
      { status: 500 }
    );
  }
}
