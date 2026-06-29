"use server";
import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { members, users } from "@/lib/db/schema";
import { requireBoardAccess, canManageMembers } from "@/lib/access";
import { validateImage } from "@/lib/domain/image";
import { uploadImage } from "@/lib/storage";

// Nap member, xac thuc quyen quan ly thanh vien (chi truong nhom), tra ve member.
async function requireManagedMember(memberId: string) {
  const [m] = await db.select().from(members).where(eq(members.id, memberId));
  if (!m) throw new Error("Không tìm thấy thành viên");
  await requireBoardAccess(m.boardId, canManageMembers);
  return m;
}

// Chan ten trung (case-insensitive) trong cung board, bo qua chinh member dang sua
async function assertNameAvailable(boardId: string, name: string, excludeMemberId?: string) {
  const rows = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(eq(members.boardId, boardId));
  const lower = name.toLowerCase();
  const clash = rows.some((m) => m.id !== excludeMemberId && m.name.toLowerCase() === lower);
  if (clash) throw new Error("Tên đã tồn tại");
}

export async function addMember(boardId: string, name: string) {
  await requireBoardAccess(boardId, canManageMembers);
  const clean = name.trim();
  if (!clean) throw new Error("Tên thành viên trống");
  await assertNameAvailable(boardId, clean);
  const [m] = await db.insert(members).values({ boardId, name: clean }).returning();
  revalidatePath(`/b/${boardId}`);
  return m;
}

export async function renameMember(memberId: string, name: string) {
  const m = await requireManagedMember(memberId);
  const clean = name.trim();
  if (!clean) throw new Error("Tên thành viên trống");
  await assertNameAvailable(m.boardId, clean, memberId);
  await db.update(members).set({ name: clean }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}`);
}

export async function removeMember(memberId: string) {
  const m = await requireManagedMember(memberId);
  await db.delete(members).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}`);
}

// Lien ket member voi mot tai khoan qua "Ma tai khoan" (users.id).
export async function linkMemberAccount(memberId: string, accountId: string) {
  const m = await requireManagedMember(memberId);
  const id = accountId.trim();
  if (!id) throw new Error("Thiếu mã tài khoản");

  const [account] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!account) throw new Error("Mã tài khoản không tồn tại");

  // 1 tai khoan chi link 1 member trong cung nhom
  const clash = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.boardId, m.boardId), eq(members.userId, id), ne(members.id, memberId)));
  if (clash.length > 0) throw new Error("Tài khoản này đã liên kết với thành viên khác trong nhóm");

  await db.update(members).set({ userId: id }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}/thanh-vien`);
  revalidatePath(`/b/${m.boardId}`);
}

export async function unlinkMemberAccount(memberId: string) {
  const m = await requireManagedMember(memberId);
  await db.update(members).set({ userId: null, role: "member" }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}/thanh-vien`);
  revalidatePath(`/b/${m.boardId}`);
}

export async function setMemberRole(memberId: string, role: "secretary" | "member") {
  if (role !== "secretary" && role !== "member") throw new Error("Vai trò không hợp lệ");
  const m = await requireManagedMember(memberId);
  if (!m.userId) throw new Error("Chỉ gán vai trò cho thành viên đã liên kết tài khoản");
  await db.update(members).set({ role }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}/thanh-vien`);
  revalidatePath(`/b/${m.boardId}`);
}

export async function setMemberAvatar(memberId: string, formData: FormData) {
  const m = await requireManagedMember(memberId);

  const file = formData.get("file");
  if (!(file instanceof Blob)) throw new Error("Thiếu tệp ảnh");
  const check = validateImage(file.type, file.size);
  if (!check.ok) throw new Error(check.error);

  const buf = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadImage(buf, file.type, "badminton/avatars");

  await db.update(members).set({ avatarUrl: url }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}/thanh-vien`);
  revalidatePath(`/b/${m.boardId}`);
  return { url };
}

export async function removeMemberAvatar(memberId: string) {
  const m = await requireManagedMember(memberId);
  await db.update(members).set({ avatarUrl: null }).where(eq(members.id, memberId));
  revalidatePath(`/b/${m.boardId}/thanh-vien`);
  revalidatePath(`/b/${m.boardId}`);
}
