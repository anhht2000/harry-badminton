import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards, members } from "@/lib/db/schema";
import { requireUserId, getCurrentUserEmail } from "@/lib/auth";

// Super admin (toan he thong): thay duoc nhom draft, deactivate/khoi phuc bat ky nhom nao.
const SUPER_ADMIN_EMAILS = new Set([
  "anhht@avadagroup.com",
  "tuananhcx2000@gmail.com"
]);
export function isSuperAdmin(email: string | null | undefined): boolean {
  return !!email && SUPER_ADMIN_EMAILS.has(email.toLowerCase());
}

// Vai tro trong nhom. "leader" suy ra tu boards.ownerId, khong luu o members.role.
export type BoardRole = "leader" | "secretary" | "member";

export type Board = typeof boards.$inferSelect;

// Trang nhom (so sach): truong nhom + thu ky.
export const canManageBooks = (r: BoardRole) => r === "leader" || r === "secretary";
// Quan ly thanh vien / phan quyen: chi truong nhom.
export const canManageMembers = (r: BoardRole) => r === "leader";
// Doi ten / xoa nhom / chuyen quyen: chi truong nhom.
export const canManageBoard = (r: BoardRole) => r === "leader";

// Suy ra vai tro tu du lieu da co san (board.ownerId + danh sach member da link),
// khong goi them DB. Tra ve null neu user khong co quyen truy cap nhom.
export function roleFromMembers(
  ownerId: string,
  linked: { userId: string | null; role: "secretary" | "member" }[],
  userId: string
): BoardRole | null {
  if (ownerId === userId) return "leader";
  const m = linked.find((x) => x.userId === userId);
  return m ? m.role : null;
}

// Tra ve board + vai tro cua user, hoac null neu khong co quyen truy cap.
export async function resolveBoardRole(
  boardId: string,
  userId: string
): Promise<{ board: Board; role: BoardRole } | null> {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) return null;
  if (board.ownerId === userId) return { board, role: "leader" };
  const [m] = await db
    .select({ role: members.role })
    .from(members)
    .where(and(eq(members.boardId, boardId), eq(members.userId, userId)));
  if (!m) return null;
  return { board, role: m.role === "secretary" ? "secretary" : "member" };
}

// Deactivate / khoi phuc nhom: cho truong nhom HOAC super admin.
export async function requireBoardDeactivateAccess(
  boardId: string
): Promise<{ board: Board; userId: string; superAdmin: boolean }> {
  const userId = await requireUserId();
  const email = await getCurrentUserEmail();
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) throw new Error("Không tìm thấy board");
  const superAdmin = isSuperAdmin(email);
  if (board.ownerId !== userId && !superAdmin) throw new Error("Không có quyền");
  return { board, userId, superAdmin };
}

// Suy ra vai tro co tinh ca super admin (full quyen = "leader" tren moi nhom).
// Dung trong server component (page) thay cho roleFromMembers khi can full quyen super admin.
export async function resolveRoleWithSuper(
  ownerId: string,
  linked: { userId: string | null; role: "secretary" | "member" }[],
  userId: string
): Promise<BoardRole | null> {
  if (isSuperAdmin(await getCurrentUserEmail())) return "leader";
  return roleFromMembers(ownerId, linked, userId);
}

// Dung trong server action: xac thuc dang nhap + kiem tra capability, nem loi neu khong du quyen.
// Super admin: bo qua cap, coi nhu "leader" tren moi nhom.
export async function requireBoardAccess(
  boardId: string,
  cap: (r: BoardRole) => boolean,
  message = "Không có quyền"
): Promise<{ board: Board; role: BoardRole; userId: string }> {
  const userId = await requireUserId();
  if (isSuperAdmin(await getCurrentUserEmail())) {
    const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
    if (!board) throw new Error("Không tìm thấy board");
    return { board, role: "leader", userId };
  }
  const res = await resolveBoardRole(boardId, userId);
  if (!res || !cap(res.role)) throw new Error(message);
  return { ...res, userId };
}
