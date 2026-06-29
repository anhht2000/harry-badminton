"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  boards,
  members,
  gameSessions,
  expenses,
  attendees,
  payments
} from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import { assertOwner } from "@/lib/domain/guard";
import type { ParseResult } from "@/lib/domain/import-parse";

export async function importSessions(boardId: string, parsed: ParseResult): Promise<{ created: number }> {
  const userId = await requireUserId();
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  assertOwner(board, userId);

  if (parsed.errors.length > 0) throw new Error("Dữ liệu import còn lỗi, không thể nhập");
  if (parsed.sessions.length === 0) return { created: 0 };

  // gom toàn bộ tên cần resolve (members + attendees + payments) để chắc chắn không bỏ sót
  const neededNames = new Set<string>();
  for (const name of parsed.members) neededNames.add(name);
  for (const s of parsed.sessions) {
    for (const name of s.attendeeNames) neededNames.add(name);
    for (const p of s.payments) neededNames.add(p.memberName);
  }

  const created = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(eq(members.boardId, boardId));

    // map tên (lowercase) -> memberId; resolve case-insensitive
    const idByLowerName = new Map<string, string>();
    for (const m of existing) idByLowerName.set(m.name.toLowerCase(), m.id);

    const toCreate: string[] = [];
    for (const name of neededNames) {
      if (!idByLowerName.has(name.toLowerCase())) toCreate.push(name);
    }
    if (toCreate.length > 0) {
      const inserted = await tx
        .insert(members)
        .values(toCreate.map((name) => ({ boardId, name })))
        .returning({ id: members.id, name: members.name });
      for (const m of inserted) idByLowerName.set(m.name.toLowerCase(), m.id);
    }

    const resolve = (name: string): string => {
      const id = idByLowerName.get(name.toLowerCase());
      if (!id) throw new Error(`Không tìm thấy thành viên: ${name}`);
      return id;
    };

    for (const session of parsed.sessions) {
      const [createdSession] = await tx
        .insert(gameSessions)
        .values({ boardId, date: session.date, note: null })
        .returning();

      if (session.expenses.length > 0) {
        await tx.insert(expenses).values(
          session.expenses.map((e) => ({
            sessionId: createdSession.id,
            label: e.label.trim(),
            amount: e.amount
          }))
        );
      }

      await tx.insert(attendees).values(
        session.attendeeNames.map((name) => ({
          sessionId: createdSession.id,
          memberId: resolve(name)
        }))
      );

      if (session.payments.length > 0) {
        await tx.insert(payments).values(
          session.payments.map((p) => ({
            sessionId: createdSession.id,
            memberId: resolve(p.memberName),
            amount: p.amount
          }))
        );
      }
    }

    return parsed.sessions.length;
  });

  revalidatePath(`/b/${boardId}`);
  return { created };
}
