import { eq, ne, and, inArray, desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  boards,
  members,
  users,
  gameSessions,
  expenses,
  attendees,
  payments,
  settlements,
  photos
} from "@/lib/db/schema";
import { computeBalances, splitSession, type SessionInput } from "@/lib/domain/split";

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
  attendeeCounts: Record<string, number>;
  payments: BoardSessionPayment[];
}
export interface BoardMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  userId: string | null;
  role: "secretary" | "member";
  linkedName: string | null;
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
export interface MemberSessionDebt {
  sessionId: string;
  date: string;
  share: number; // phai dong buoi nay
  paidAmount: number; // da dong (tong payment buoi nay)
  net: number; // share - paidAmount: >0 con no, <0 duoc nhan, 0 da du
  settled: boolean; // da danh dau "da tra" qua settlement
}
export interface BoardData {
  board: { id: string; name: string; shareToken: string; ownerId: string; active: boolean };
  members: BoardMember[];
  sessions: BoardSession[];
  settlements: BoardSettlement[];
  photos: BoardPhoto[];
  balances: Record<string, number>;
  sessionDebts: Record<string, MemberSessionDebt[]>;
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

export interface UserBoard {
  id: string;
  name: string;
  role: "leader" | "secretary" | "member";
  active: boolean;
}

// Nhom user co the truy cap: so huu (truong nhom) HOAC da link member.
export async function getBoardsForUser(userId: string): Promise<UserBoard[]> {
  const owned = await db
    .select({ id: boards.id, name: boards.name, active: boards.active })
    .from(boards)
    .where(eq(boards.ownerId, userId));

  const linked = await db
    .select({ id: boards.id, name: boards.name, active: boards.active, role: members.role })
    .from(members)
    .innerJoin(boards, eq(members.boardId, boards.id))
    .where(and(eq(members.userId, userId), ne(boards.ownerId, userId)));

  const result: UserBoard[] = owned.map((b) => ({ id: b.id, name: b.name, role: "leader", active: b.active }));
  const seen = new Set(result.map((b) => b.id));
  for (const b of linked) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    // Nhom draft chi hien voi truong nhom; voi member/thu ky thi an.
    if (!b.active) continue;
    result.push({
      id: b.id,
      name: b.name,
      role: b.role === "secretary" ? "secretary" : "member",
      active: b.active
    });
  }
  return result;
}

// Doc danh sach member kem account da link (ten/email) cua mot board.
async function loadBoardMembers(boardId: string): Promise<BoardMember[]> {
  const rows = await db
    .select({
      id: members.id,
      name: members.name,
      avatarUrl: members.avatarUrl,
      userId: members.userId,
      role: members.role,
      linkedName: users.name,
      linkedEmail: users.email
    })
    .from(members)
    .leftJoin(users, eq(members.userId, users.id))
    .where(eq(members.boardId, boardId));
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    avatarUrl: m.avatarUrl,
    userId: m.userId,
    role: m.role === "secretary" ? "secretary" : "member",
    linkedName: m.userId ? m.linkedName ?? m.linkedEmail ?? null : null
  }));
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
  const countsBySession = new Map<string, Record<string, number>>();
  for (const a of attendeeRows) {
    const list = attendeesBySession.get(a.sessionId) ?? [];
    list.push(a.memberId);
    attendeesBySession.set(a.sessionId, list);
    const counts = countsBySession.get(a.sessionId) ?? {};
    counts[a.memberId] = a.count ?? 1;
    countsBySession.set(a.sessionId, counts);
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
    attendeeCounts: countsBySession.get(s.id) ?? {},
    payments: paymentsBySession.get(s.id) ?? []
  }));
}

function toSessionInputs(sessions: BoardSession[]): SessionInput[] {
  return sessions.map((s) => ({
    id: s.id,
    expenses: s.expenses.map((e) => ({ amount: e.amount })),
    attendeeIds: s.attendeeIds,
    attendeeCounts: s.attendeeCounts,
    payments: s.payments.map((p) => ({ memberId: p.memberId, amount: p.amount }))
  }));
}

export interface SessionNet {
  sessionId: string;
  date: string;
  nets: Record<string, number>;
}

export async function loadBoardSessionNets(boardId: string): Promise<SessionNet[]> {
  const sessions = await loadBoardSessions(boardId);
  return sessions.map((s) => ({
    sessionId: s.id,
    date: s.date,
    nets: splitSession({
      expenses: s.expenses.map((e) => ({ amount: e.amount })),
      attendeeIds: s.attendeeIds,
      attendeeCounts: s.attendeeCounts,
      payments: s.payments.map((p) => ({ memberId: p.memberId, amount: p.amount }))
    }).net
  }));
}

export async function getBoardData(boardId: string): Promise<BoardData | null> {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) return null;

  const [memberList, sessionList, settlementRows, photoList] = await Promise.all([
    loadBoardMembers(boardId),
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
    settlementRows.map((s) => ({ memberId: s.memberId, amount: s.amount, sessionId: s.sessionId }))
  );

  const paidSet = new Set(
    settlementRows
      .filter((s) => s.sessionId)
      .map((s) => `${s.memberId}:${s.sessionId}`)
  );
  const sessionDebts: Record<string, MemberSessionDebt[]> = {};
  for (const s of sessionList) {
    const r = splitSession({
      expenses: s.expenses.map((e) => ({ amount: e.amount })),
      attendeeIds: s.attendeeIds,
      attendeeCounts: s.attendeeCounts,
      payments: s.payments.map((p) => ({ memberId: p.memberId, amount: p.amount }))
    });
    // Lich su day du: moi buoi member co tham gia (share>0) hoac da dong tien (paidAmount>0).
    for (const memberId of Object.keys(r.net)) {
      const share = r.shares[memberId] ?? 0;
      const paidAmount = r.paid[memberId] ?? 0;
      if (share === 0 && paidAmount === 0) continue;
      (sessionDebts[memberId] ??= []).push({
        sessionId: s.id,
        date: s.date,
        share,
        paidAmount,
        net: r.net[memberId],
        settled: paidSet.has(`${memberId}:${s.id}`)
      });
    }
  }
  for (const list of Object.values(sessionDebts)) {
    list.sort((a, b) => b.date.localeCompare(a.date));
  }

  return {
    board: {
      id: board.id,
      name: board.name,
      shareToken: board.shareToken,
      ownerId: board.ownerId,
      active: board.active
    },
    members: memberList,
    sessions: sessionList,
    settlements: settlementList,
    photos: photoList,
    balances,
    sessionDebts
  };
}

// Lay board id tu share token, ke ca nhom draft — dung cho super admin redirect.
export async function getBoardIdByShareToken(token: string): Promise<string | null> {
  const [b] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(eq(boards.shareToken, token));
  return b?.id ?? null;
}

export async function getBoardByShareToken(
  token: string
): Promise<PublicBoardData | null> {
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.shareToken, token));
  if (!board || !board.active) return null;

  const [memberRows, sessionList, settlementRows, photoList] = await Promise.all([
    db.select().from(members).where(eq(members.boardId, board.id)),
    loadBoardSessions(board.id),
    db.select().from(settlements).where(eq(settlements.boardId, board.id)),
    loadBoardPhotos(board.id)
  ]);

  const balances = computeBalances(
    toSessionInputs(sessionList),
    settlementRows.map((s) => ({ memberId: s.memberId, amount: s.amount, sessionId: s.sessionId }))
  );

  return {
    board: { id: board.id, name: board.name, shareToken: board.shareToken },
    members: memberRows.map((m) => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl,
      userId: null,
      role: "member" as const,
      linkedName: null
    })),
    sessions: sessionList.map(({ note, ...rest }) => rest),
    photos: photoList,
    balances
  };
}

export async function getAllBoards(excludeOwnerId?: string): Promise<BoardSummary[]> {
  const boardRows = await db
    .select({ id: boards.id, name: boards.name, shareToken: boards.shareToken })
    .from(boards)
    .where(
      excludeOwnerId
        ? and(eq(boards.active, true), ne(boards.ownerId, excludeOwnerId))
        : eq(boards.active, true)
    )
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

export interface AdminBoard {
  id: string;
  name: string;
  ownerLabel: string;
  active: boolean;
  memberCount: number;
  sessionCount: number;
}

// Tat ca nhom toan he thong (active + draft) — chi super admin dung.
export async function getAllBoardsAdmin(): Promise<AdminBoard[]> {
  const boardRows = await db
    .select({
      id: boards.id,
      name: boards.name,
      active: boards.active,
      ownerName: users.name,
      ownerEmail: users.email
    })
    .from(boards)
    .innerJoin(users, eq(boards.ownerId, users.id))
    .orderBy(desc(boards.active), desc(boards.createdAt));
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
    ownerLabel: b.ownerName || b.ownerEmail || "?",
    active: b.active,
    memberCount: memberCountByBoard.get(b.id) ?? 0,
    sessionCount: sessionCountByBoard.get(b.id) ?? 0
  }));
}
