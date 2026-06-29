"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards, settlements } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import { assertOwner } from "@/lib/domain/guard";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function loadOwnedBoard(boardId: string, userId: string) {
  const [b] = await db.select().from(boards).where(eq(boards.id, boardId));
  assertOwner(b, userId);
  return b;
}

export async function addSettlement(
  boardId: string,
  memberId: string,
  amount: number,
  date: string,
  note?: string
) {
  const userId = await requireUserId();
  await loadOwnedBoard(boardId, userId);
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Số tiền phải là số nguyên dương");
  if (!DATE_RE.test(date)) throw new Error("Ngày sai định dạng (YYYY-MM-DD)");
  const [s] = await db
    .insert(settlements)
    .values({ boardId, memberId, amount, date, note: note?.trim() || null })
    .returning();
  revalidatePath(`/b/${boardId}`);
  return s;
}

export async function removeSettlement(id: string) {
  const userId = await requireUserId();
  const [s] = await db.select().from(settlements).where(eq(settlements.id, id));
  if (!s) throw new Error("Không tìm thấy settlement");
  await loadOwnedBoard(s.boardId, userId);
  await db.delete(settlements).where(eq(settlements.id, id));
  revalidatePath(`/b/${s.boardId}`);
}
