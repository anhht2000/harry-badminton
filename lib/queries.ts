import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  boards,
  members,
  gameSessions,
  expenses,
  attendees,
  payments,
  settlements
} from "@/lib/db/schema";
import { computeBalances, type SessionInput } from "@/lib/domain/split";

export interface BoardSessionExpense {
  id: string;
  label: string;
  amount: number;
}
export interface BoardSessionPayment {
  id: string;
  memberId: string;
  amount: number;
}
export interface BoardSession {
  id: string;
  date: string;
  note: string | null;
  expenses: BoardSessionExpense[];
  attendeeIds: string[];
  payments: BoardSessionPayment[];
}
export interface BoardMember {
  id: string;
  name: string;
}
export interface BoardSettlement {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  note: string | null;
}
export interface BoardData {
  board: { id: string; name: string; shareToken: string; ownerId: string };
  members: BoardMember[];
  sessions: BoardSession[];
  settlements: BoardSettlement[];
  balances: Record<string, number>;
}
export interface PublicBoardData {
  board: { name: string };
  members: BoardMember[];
  sessions: Omit<BoardSession, "note">[];
  balances: Record<string, number>;
}

export async function getBoardsByOwner(userId: string) {
  return db.select().from(boards).where(eq(boards.ownerId, userId));
}

async function loadBoardSessions(boardId: string): Promise<BoardSession[]> {
  const sessionRows = await db
    .select({
      id: gameSessions.id,
      date: gameSessions.date,
      note: gameSessions.note
    })
    .from(gameSessions)
    .where(eq(gameSessions.boardId, boardId));

  if (sessionRows.length === 0) return [];

  const sessionIds = sessionRows.map((s) => s.id);
  const [expenseRows, attendeeRows, paymentRows] = await Promise.all([
    db
      .select()
      .from(expenses)
      .where(inArray(expenses.sessionId, sessionIds)),
    db
      .select()
      .from(attendees)
      .where(inArray(attendees.sessionId, sessionIds)),
    db
      .select()
      .from(payments)
      .where(inArray(payments.sessionId, sessionIds))
  ]);

  const expensesBySession = new Map<string, BoardSessionExpense[]>();
  for (const e of expenseRows) {
    const list = expensesBySession.get(e.sessionId) ?? [];
    list.push({ id: e.id, label: e.label, amount: e.amount });
    expensesBySession.set(e.sessionId, list);
  }

  const attendeesBySession = new Map<string, string[]>();
  for (const a of attendeeRows) {
    const list = attendeesBySession.get(a.sessionId) ?? [];
    list.push(a.memberId);
    attendeesBySession.set(a.sessionId, list);
  }

  const paymentsBySession = new Map<string, BoardSessionPayment[]>();
  for (const p of paymentRows) {
    const list = paymentsBySession.get(p.sessionId) ?? [];
    list.push({ id: p.id, memberId: p.memberId, amount: p.amount });
    paymentsBySession.set(p.sessionId, list);
  }

  return sessionRows.map((s) => ({
    id: s.id,
    date: s.date,
    note: s.note,
    expenses: expensesBySession.get(s.id) ?? [],
    attendeeIds: attendeesBySession.get(s.id) ?? [],
    payments: paymentsBySession.get(s.id) ?? []
  }));
}

function toSessionInputs(sessions: BoardSession[]): SessionInput[] {
  return sessions.map((s) => ({
    expenses: s.expenses.map((e) => ({ amount: e.amount })),
    attendeeIds: s.attendeeIds,
    payments: s.payments.map((p) => ({ memberId: p.memberId, amount: p.amount }))
  }));
}

export async function getBoardData(boardId: string): Promise<BoardData | null> {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) return null;

  const [memberRows, sessionList, settlementRows] = await Promise.all([
    db.select().from(members).where(eq(members.boardId, boardId)),
    loadBoardSessions(boardId),
    db.select().from(settlements).where(eq(settlements.boardId, boardId))
  ]);

  const settlementList: BoardSettlement[] = settlementRows.map((s) => ({
    id: s.id,
    memberId: s.memberId,
    amount: s.amount,
    date: s.date,
    note: s.note
  }));

  const balances = computeBalances(
    toSessionInputs(sessionList),
    settlementList.map((s) => ({ memberId: s.memberId, amount: s.amount }))
  );

  return {
    board: {
      id: board.id,
      name: board.name,
      shareToken: board.shareToken,
      ownerId: board.ownerId
    },
    members: memberRows.map((m) => ({ id: m.id, name: m.name })),
    sessions: sessionList,
    settlements: settlementList,
    balances
  };
}

export async function getBoardByShareToken(
  token: string
): Promise<PublicBoardData | null> {
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.shareToken, token));
  if (!board) return null;

  const [memberRows, sessionList, settlementRows] = await Promise.all([
    db.select().from(members).where(eq(members.boardId, board.id)),
    loadBoardSessions(board.id),
    db.select().from(settlements).where(eq(settlements.boardId, board.id))
  ]);

  const balances = computeBalances(
    toSessionInputs(sessionList),
    settlementRows.map((s) => ({ memberId: s.memberId, amount: s.amount }))
  );

  return {
    board: { name: board.name },
    members: memberRows.map((m) => ({ id: m.id, name: m.name })),
    sessions: sessionList.map(({ note, ...rest }) => rest),
    balances
  };
}
