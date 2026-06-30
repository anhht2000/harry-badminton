"use server";
import { revalidatePath } from "next/cache";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards, photos } from "@/lib/db/schema";
import { requireBoardAccess, canManageBooks } from "@/lib/access";
import { validateImage, isVideoUrl } from "@/lib/domain/image";
import { uploadImage, deleteImage } from "@/lib/storage";

const MAX_PHOTOS_PER_BOARD = 300;

export async function uploadBoardPhoto(boardId: string, formData: FormData) {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) throw new Error("Không tìm thấy board");

  const file = formData.get("file");
  if (!(file instanceof Blob)) throw new Error("Thiếu tệp ảnh");
  const check = validateImage(file.type, file.size);
  if (!check.ok) throw new Error(check.error);

  const rawName = formData.get("uploaderName");
  const uploaderName =
    typeof rawName === "string" ? rawName.trim().slice(0, 60) || null : null;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(photos)
    .where(eq(photos.boardId, boardId));
  if (total >= MAX_PHOTOS_PER_BOARD) throw new Error("Album đã đầy");

  const buf = Buffer.from(await file.arrayBuffer());
  const { url, key } = await uploadImage(buf, file.type, `badminton/albums/${boardId}`);

  const [row] = await db
    .insert(photos)
    .values({ boardId, url, key, uploaderName })
    .returning({ id: photos.id, url: photos.url });

  revalidatePath(`/b/${boardId}`);
  revalidatePath(`/s/${board.shareToken}`);
  return { id: row.id, url: row.url };
}

// Ghi DB sau khi video da upload thang len Blob tu browser (xem app/api/album-media).
export async function addBoardVideo(boardId: string, url: string, uploaderName?: string) {
  const { board } = await requireBoardAccess(boardId, () => true);

  // Chi chap nhan URL Blob public + dung duoi video -> tranh chen URL bay.
  const isBlob = /\.public\.blob\.vercel-storage\.com\//.test(url);
  if (!isBlob || !isVideoUrl(url)) throw new Error("URL video không hợp lệ");

  const name = typeof uploaderName === "string" ? uploaderName.trim().slice(0, 60) || null : null;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(photos)
    .where(eq(photos.boardId, boardId));
  if (total >= MAX_PHOTOS_PER_BOARD) throw new Error("Album đã đầy");

  const key = new URL(url).pathname.replace(/^\//, "");
  const [row] = await db
    .insert(photos)
    .values({ boardId, url, key, uploaderName: name })
    .returning({ id: photos.id, url: photos.url });

  revalidatePath(`/b/${boardId}`);
  revalidatePath(`/s/${board.shareToken}`);
  return { id: row.id, url: row.url };
}

export async function deleteBoardPhoto(photoId: string) {
  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId));
  if (!photo) throw new Error("Không tìm thấy ảnh");
  const { board } = await requireBoardAccess(photo.boardId, canManageBooks);

  await deleteImage(photo.url);
  await db.delete(photos).where(eq(photos.id, photoId));

  revalidatePath(`/b/${board.id}`);
  revalidatePath(`/s/${board.shareToken}`);
}
