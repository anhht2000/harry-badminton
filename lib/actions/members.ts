"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards, members } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import { assertOwner } from "@/lib/domain/guard";
import { validateImage } from "@/lib/domain/image";
import { uploadImage } from "@/lib/storage";

// Nap board tu boardId va xac thuc quyen owner
async function loadOwnedBoard(boardId: string, userId: string) {
  const [b] = await db.select().from(boards).where(eq(boards.id, boardId));
  assertOwner(b, userId);
  return b;
}

// Chan ten trung (case-insensitive) trong cung board, bo qua chinh member dang sua
async function assertNameAvailable(boardId: string, name: string, excludeMemberId?: string) {
  const rows = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(eq(members.boardId, boardId));
  const lower = name.toLowerCase();
  const clash = rows.some((m) => m.id !== excludeMemberId && m.name.toLowerCase() === lower);
  if (clash) throw new Error("Tên đã tồn tại");
}

export async function addMember(boardId: string, name: string) {
  const userId = await requireUserId();
  await loadOwnedBoard(boardId, userId);
  const clean = name.trim();
  if (!clean) throw new Error("Tên thành viên trống");
  await assertNameAvailable(boardId, clean);
  const [m] = await db.insert(members).values({ boardId, name: clean }).returning();
  revalidatePath(`/b/${boardId}`);
  return m;
}

export async function renameMember(memberId: string, name: string) {
  const userId = await requireUserId();
  const [m] = await db.select().from(members).where(eq(members.id, memberId));
  if (!m) throw new Error("Không tìm thấy thành viên");
  await loadOwnedBoard(m.boardId, userId);
  const clean = name.trim();
  if (!clean) throw new Error("Tên thành viên trống");
  await assertNameAvailable(m.boardId, clean, memberId);
  await db.update(members).set({ name: clean }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}`);
}

export async function removeMember(memberId: string) {
  const userId = await requireUserId();
  const [m] = await db.select().from(members).where(eq(members.id, memberId));
  if (!m) throw new Error("Không tìm thấy thành viên");
  await loadOwnedBoard(m.boardId, userId);
  await db.delete(members).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}`);
}

export async function setMemberAvatar(memberId: string, formData: FormData) {
  const userId = await requireUserId();
  const [m] = await db.select().from(members).where(eq(members.id, memberId));
  if (!m) throw new Error("Không tìm thấy thành viên");
  await loadOwnedBoard(m.boardId, userId);

  const file = formData.get("file");
  if (!(file instanceof Blob)) throw new Error("Thiếu tệp ảnh");
  const check = validateImage(file.type, file.size);
  if (!check.ok) throw new Error(check.error);

  const buf = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadImage(buf, file.type, "badminton/avatars");

  await db.update(members).set({ avatarUrl: url }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}/thanh-vien`);
  revalidatePath(`/b/${m.boardId}`);
  return { url };
}

export async function removeMemberAvatar(memberId: string) {
  const userId = await requireUserId();
  const [m] = await db.select().from(members).where(eq(members.id, memberId));
  if (!m) throw new Error("Không tìm thấy thành viên");
  await loadOwnedBoard(m.boardId, userId);
  await db.update(members).set({ avatarUrl: null }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}/thanh-vien`);
  revalidatePath(`/b/${m.boardId}`);
}
