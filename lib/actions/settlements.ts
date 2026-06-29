"use server";
import { revalidatePath } from "next/cache";
import { eq, and, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards, members, settlements } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import { assertOwner } from "@/lib/domain/guard";
import { loadBoardSessionNets } from "@/lib/queries";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

async function loadOwnedBoard(boardId: string, userId: string) {
  const [b] = await db.select().from(boards).where(eq(boards.id, boardId));
  assertOwner(b, userId);
  return b;
}

async function assertMemberInBoard(memberId: string, boardId: string) {
  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member || member.boardId !== boardId) throw new Error("Thành viên không thuộc board");
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
  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member || member.boardId !== boardId) throw new Error("Thành viên không thuộc board");
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

// --- Đánh dấu đã trả theo từng buổi ---

export async function markSessionPaid(
  boardId: string,
  memberId: string,
  sessionId: string
) {
  const userId = await requireUserId();
  await loadOwnedBoard(boardId, userId);
  await assertMemberInBoard(memberId, boardId);

  const nets = await loadBoardSessionNets(boardId);
  const session = nets.find((s) => s.sessionId === sessionId);
  const amount = session?.nets[memberId] ?? 0;
  if (amount <= 0) return; // buổi này không nợ, bỏ qua

  const existing = await db
    .select({ id: settlements.id })
    .from(settlements)
    .where(and(eq(settlements.memberId, memberId), eq(settlements.sessionId, sessionId)));
  if (existing.length > 0) return; // đã đánh dấu rồi

  await db
    .insert(settlements)
    .values({ boardId, memberId, sessionId, amount, date: todayIso() });
  revalidatePath(`/b/${boardId}`);
}

export async function unmarkSessionPaid(
  boardId: string,
  memberId: string,
  sessionId: string
) {
  const userId = await requireUserId();
  await loadOwnedBoard(boardId, userId);
  await db
    .delete(settlements)
    .where(
      and(
        eq(settlements.boardId, boardId),
        eq(settlements.memberId, memberId),
        eq(settlements.sessionId, sessionId)
      )
    );
  revalidatePath(`/b/${boardId}`);
}

export async function markAllSessionsPaid(boardId: string, memberId: string) {
  const userId = await requireUserId();
  await loadOwnedBoard(boardId, userId);
  await assertMemberInBoard(memberId, boardId);

  const nets = await loadBoardSessionNets(boardId);
  const owed = nets.filter((s) => (s.nets[memberId] ?? 0) > 0);

  const existing = await db
    .select({ sessionId: settlements.sessionId })
    .from(settlements)
    .where(and(eq(settlements.boardId, boardId), eq(settlements.memberId, memberId)));
  const paidSessionIds = new Set(existing.map((e) => e.sessionId));

  const toInsert = owed
    .filter((s) => !paidSessionIds.has(s.sessionId))
    .map((s) => ({
      boardId,
      memberId,
      sessionId: s.sessionId,
      amount: s.nets[memberId],
      date: todayIso()
    }));
  if (toInsert.length > 0) await db.insert(settlements).values(toInsert);
  revalidatePath(`/b/${boardId}`);
}

export async function unmarkAllSessionsPaid(boardId: string, memberId: string) {
  const userId = await requireUserId();
  await loadOwnedBoard(boardId, userId);
  await db
    .delete(settlements)
    .where(
      and(
        eq(settlements.boardId, boardId),
        eq(settlements.memberId, memberId),
        isNotNull(settlements.sessionId)
      )
    );
  revalidatePath(`/b/${boardId}`);
}
