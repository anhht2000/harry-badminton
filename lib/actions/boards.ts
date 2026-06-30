"use server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards, members } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import { requireBoardAccess, canManageBoard, requireBoardDeactivateAccess } from "@/lib/access";

export async function createBoard(name: string) {
  const userId = await requireUserId();
  const clean = name.trim();
  if (!clean) throw new Error("Tên board trống");
  const [b] = await db.insert(boards).values({ ownerId: userId, name: clean }).returning();
  revalidatePath("/");
  return b;
}

export async function renameBoard(boardId: string, name: string) {
  await requireBoardAccess(boardId, canManageBoard);
  const clean = name.trim();
  if (!clean) throw new Error("Tên board trống");
  await db.update(boards).set({ name: clean }).where(eq(boards.id, boardId));
  revalidatePath(`/b/${boardId}`);
}

export async function deleteBoard(boardId: string) {
  const { board } = await requireBoardAccess(boardId, canManageBoard);
  // Chi xoa duoc nhom da an (inactive) — tranh xoa nham nhom dang dung.
  if (board.active) throw new Error("Phải ẩn nhóm trước khi xóa");
  await db.delete(boards).where(eq(boards.id, boardId));
  revalidatePath("/");
}

// Deactivate (an thanh draft) / khoi phuc nhom. Truong nhom hoac super admin.
export async function setBoardActive(boardId: string, active: boolean) {
  await requireBoardDeactivateAccess(boardId);
  await db.update(boards).set({ active }).where(eq(boards.id, boardId));
  revalidatePath("/");
  revalidatePath(`/b/${boardId}`);
}

// Chuyen quyen truong nhom cho mot thanh vien da link account.
// Truong nhom cu (neu co member row) tut xuong "member".
export async function transferLeadership(boardId: string, memberId: string) {
  const { board, userId } = await requireBoardAccess(boardId, canManageBoard);

  const [target] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.boardId, boardId)));
  if (!target) throw new Error("Không tìm thấy thành viên");
  if (!target.userId) throw new Error("Thành viên này chưa liên kết tài khoản");
  if (target.userId === board.ownerId) throw new Error("Thành viên này đã là trưởng nhóm");

  const newOwnerId = target.userId;
  await db.transaction(async (tx) => {
    await tx.update(boards).set({ ownerId: newOwnerId }).where(eq(boards.id, boardId));
    // truong nhom moi: role ve "member" cho gon (quyen leader suy ra tu ownerId)
    await tx.update(members).set({ role: "member" }).where(eq(members.id, memberId));
    // truong nhom cu: neu co member row trong nhom thi ha xuong "member"
    await tx
      .update(members)
      .set({ role: "member" })
      .where(and(eq(members.boardId, boardId), eq(members.userId, userId)));
  });

  revalidatePath(`/b/${boardId}`);
  revalidatePath(`/b/${boardId}/thanh-vien`);
}
