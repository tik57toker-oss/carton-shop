import { cookies } from "next/headers";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { verifySession } from "@/app/lib/session";
import { ensureAvatarColumn, pool } from "@/app/lib/avatar";

const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

async function auth() {
  const token = (await cookies()).get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function POST(request: Request) {
  const userId = await auth();
  if (!userId) return Response.json({ success: false, error: "Войдите в аккаунт" }, { status: 401 });

  await ensureAvatarColumn();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ success: false, error: "Выберите изображение" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_SIZE) return Response.json({ success: false, error: "Размер аватара — максимум 3 МБ" }, { status: 400 });

  const ext = ALLOWED.get(file.type);
  if (!ext) return Response.json({ success: false, error: "Разрешены JPG, PNG и WEBP" }, { status: 400 });

  const current = await pool.query(`SELECT "avatarUrl" FROM "User" WHERE "id"=$1`, [userId]);
  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  const avatarUrl = `/uploads/avatars/${filename}`;
  await pool.query(`UPDATE "User" SET "avatarUrl"=$1,"updatedAt"=NOW() WHERE "id"=$2`, [avatarUrl, userId]);

  const oldUrl = current.rows[0]?.avatarUrl as string | null | undefined;
  if (oldUrl?.startsWith("/uploads/avatars/")) {
    await unlink(path.join(process.cwd(), "public", oldUrl.replace(/^\//, ""))).catch(() => undefined);
  }

  return Response.json({ success: true, avatarUrl });
}

export async function DELETE() {
  const userId = await auth();
  if (!userId) return Response.json({ success: false, error: "Войдите в аккаунт" }, { status: 401 });
  await ensureAvatarColumn();

  const current = await pool.query(`SELECT "avatarUrl" FROM "User" WHERE "id"=$1`, [userId]);
  await pool.query(`UPDATE "User" SET "avatarUrl"=NULL,"updatedAt"=NOW() WHERE "id"=$1`, [userId]);

  const oldUrl = current.rows[0]?.avatarUrl as string | null | undefined;
  if (oldUrl?.startsWith("/uploads/avatars/")) {
    await unlink(path.join(process.cwd(), "public", oldUrl.replace(/^\//, ""))).catch(() => undefined);
  }

  return Response.json({ success: true });
}
