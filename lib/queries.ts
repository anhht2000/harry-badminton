import { eq, inArray, desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  boards,
  members,
  gameSessions,
  expenses,
  attendees,
  payments,
  settlements,
  photos
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
  avatarUrl: string | null;
}
export interface BoardPhoto {
  id: string;
  url: string;
  uploaderName: string | null;
  createdAt: Date;
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
  photos: BoardPhoto[];
  balances: Record<string, number>;
}
export interface PublicBoardData {
  board: { id: string; name: string; shareToken: string };
  members: BoardMember[];
  sessions: Omit<BoardSession, "note">[];
  photos: BoardPhoto[];
  balances: Record<string, number>;
}
export interface BoardSummary {
  id: string;
  name: string;
  shareToken: string;
  memberCount: number;
  sessionCount: number;
}

async function loadBoardPhotos(boardId: string): Promise<BoardPhoto[]> {
  const rows = await db
    .select({
      id: photos.id,
      url: photos.url,
      uploaderName: photos.uploaderName,
      createdAt: photos.createdAt
    })
    .from(photos)
    .where(eq(photos.boardId, boardId))
    .orderBy(desc(photos.createdAt));
  return rows;
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

  const [memberRows, sessionList, settlementRows, photoList] = await Promise.all([
    db.select().from(members).where(eq(members.boardId, boardId)),
    loadBoardSessions(boardId),
    db.select().from(settlements).where(eq(settlements.boardId, boardId)),
    loadBoardPhotos(boardId)
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
    members: memberRows.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl })),
    sessions: sessionList,
    settlements: settlementList,
    photos: photoList,
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

  const [memberRows, sessionList, settlementRows, photoList] = await Promise.all([
    db.select().from(members).where(eq(members.boardId, board.id)),
    loadBoardSessions(board.id),
    db.select().from(settlements).where(eq(settlements.boardId, board.id)),
    loadBoardPhotos(board.id)
  ]);

  const balances = computeBalances(
    toSessionInputs(sessionList),
    settlementRows.map((s) => ({ memberId: s.memberId, amount: s.amount }))
  );

  return {
    board: { id: board.id, name: board.name, shareToken: board.shareToken },
    members: memberRows.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl })),
    sessions: sessionList.map(({ note, ...rest }) => rest),
    photos: photoList,
    balances
  };
}

export async function getAllBoards(): Promise<BoardSummary[]> {
  const boardRows = await db
    .select({ id: boards.id, name: boards.name, shareToken: boards.shareToken })
    .from(boards)
    .orderBy(desc(boards.createdAt));
  if (boardRows.length === 0) return [];

  const boardIds = boardRows.map((b) => b.id);
  const [memberCounts, sessionCounts] = await Promise.all([
    db
      .select({ boardId: members.boardId, value: count() })
      .from(members)
      .where(inArray(members.boardId, boardIds))
      .groupBy(members.boardId),
    db
      .select({ boardId: gameSessions.boardId, value: count() })
      .from(gameSessions)
      .where(inArray(gameSessions.boardId, boardIds))
      .groupBy(gameSessions.boardId)
  ]);

  const memberCountByBoard = new Map(memberCounts.map((r) => [r.boardId, r.value]));
  const sessionCountByBoard = new Map(sessionCounts.map((r) => [r.boardId, r.value]));

  return boardRows.map((b) => ({
    id: b.id,
    name: b.name,
    shareToken: b.shareToken,
    memberCount: memberCountByBoard.get(b.id) ?? 0,
    sessionCount: sessionCountByBoard.get(b.id) ?? 0
  }));
}
