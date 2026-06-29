"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import { assertOwner } from "@/lib/domain/guard";

export async function createBoard(name: string) {
  const userId = await requireUserId();
  const clean = name.trim();
  if (!clean) throw new Error("Tên board trống");
  const [b] = await db.insert(boards).values({ ownerId: userId, name: clean }).returning();
  revalidatePath("/");
  return b;
}

export async function renameBoard(boardId: string, name: string) {
  const userId = await requireUserId();
  const clean = name.trim();
  if (!clean) throw new Error("Tên board trống");
  const [b] = await db.select().from(boards).where(eq(boards.id, boardId));
  assertOwner(b, userId);
  await db.update(boards).set({ name: clean }).where(eq(boards.id, boardId));
  revalidatePath(`/b/${boardId}`);
}

export async function deleteBoard(boardId: string) {
  const userId = await requireUserId();
  const [b] = await db.select().from(boards).where(eq(boards.id, boardId));
  assertOwner(b, userId);
  await db.delete(boards).where(eq(boards.id, boardId));
  revalidatePath("/");
}
