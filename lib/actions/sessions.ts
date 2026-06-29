"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  members,
  gameSessions,
  expenses,
  attendees,
  payments
} from "@/lib/db/schema";
import { requireBoardAccess, canManageBooks } from "@/lib/access";

export interface SessionFormData {
  date: string;
  note?: string;
  attendeeIds: string[];
  expenses: { label: string; amount: number }[];
  payments: { memberId: string; amount: number }[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isPositiveInt(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

async function loadBoardMemberIds(boardId: string): Promise<Set<string>> {
  const rows = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.boardId, boardId));
  return new Set(rows.map((r) => r.id));
}

function validate(data: SessionFormData, memberIds: Set<string>) {
  if (!DATE_RE.test(data.date)) throw new Error("Ngày không hợp lệ (YYYY-MM-DD)");
  if (data.attendeeIds.length === 0) throw new Error("Cần ít nhất 1 người tham gia");

  for (const id of data.attendeeIds) {
    if (!memberIds.has(id)) throw new Error("Người tham gia không thuộc board");
  }
  for (const e of data.expenses) {
    if (!e.label.trim()) throw new Error("Khoản chi thiếu nội dung");
    if (!isPositiveInt(e.amount)) throw new Error("Số tiền khoản chi phải là số nguyên dương");
  }
  for (const p of data.payments) {
    if (!memberIds.has(p.memberId)) throw new Error("Người ứng tiền không thuộc board");
    if (!isPositiveInt(p.amount)) throw new Error("Số tiền ứng phải là số nguyên dương");
  }
}

export async function createSession(boardId: string, data: SessionFormData) {
  await requireBoardAccess(boardId, canManageBooks);

  const memberIds = await loadBoardMemberIds(boardId);
  validate(data, memberIds);

  const session = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(gameSessions)
      .values({ boardId, date: data.date, note: data.note ?? null })
      .returning();

    if (data.expenses.length > 0) {
      await tx.insert(expenses).values(
        data.expenses.map((e) => ({
          sessionId: created.id,
          label: e.label.trim(),
          amount: e.amount
        }))
      );
    }

    await tx.insert(attendees).values(
      data.attendeeIds.map((memberId) => ({ sessionId: created.id, memberId }))
    );

    if (data.payments.length > 0) {
      await tx.insert(payments).values(
        data.payments.map((p) => ({
          sessionId: created.id,
          memberId: p.memberId,
          amount: p.amount
        }))
      );
    }

    return created;
  });

  revalidatePath(`/b/${boardId}`);
  return session;
}

export async function updateSession(sessionId: string, data: SessionFormData) {
  const [row] = await db
    .select({ boardId: gameSessions.boardId })
    .from(gameSessions)
    .where(eq(gameSessions.id, sessionId));

  if (!row) throw new Error("Không tìm thấy buổi");
  await requireBoardAccess(row.boardId, canManageBooks);

  const boardId = row.boardId;
  const memberIds = await loadBoardMemberIds(boardId);
  validate(data, memberIds);

  await db.transaction(async (tx) => {
    await tx.delete(expenses).where(eq(expenses.sessionId, sessionId));
    await tx.delete(attendees).where(eq(attendees.sessionId, sessionId));
    await tx.delete(payments).where(eq(payments.sessionId, sessionId));

    await tx
      .update(gameSessions)
      .set({ date: data.date, note: data.note ?? null })
      .where(eq(gameSessions.id, sessionId));

    if (data.expenses.length > 0) {
      await tx.insert(expenses).values(
        data.expenses.map((e) => ({
          sessionId,
          label: e.label.trim(),
          amount: e.amount
        }))
      );
    }

    await tx.insert(attendees).values(
      data.attendeeIds.map((memberId) => ({ sessionId, memberId }))
    );

    if (data.payments.length > 0) {
      await tx.insert(payments).values(
        data.payments.map((p) => ({
          sessionId,
          memberId: p.memberId,
          amount: p.amount
        }))
      );
    }
  });

  revalidatePath(`/b/${boardId}`);
}

export async function deleteSession(sessionId: string) {
  const [row] = await db
    .select({ boardId: gameSessions.boardId })
    .from(gameSessions)
    .where(eq(gameSessions.id, sessionId));

  if (!row) throw new Error("Không tìm thấy buổi");
  await requireBoardAccess(row.boardId, canManageBooks);

  await db.delete(gameSessions).where(eq(gameSessions.id, sessionId));
  revalidatePath(`/b/${row.boardId}`);
}
