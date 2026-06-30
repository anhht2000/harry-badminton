"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { BoardMember } from "@/lib/queries";
import {
  addMember,
  renameMember,
  removeMember,
  setMemberAvatar,
  removeMemberAvatar,
  linkMemberAccount,
  unlinkMemberAccount,
  setMemberRole
} from "@/lib/actions/members";
import { transferLeadership } from "@/lib/actions/boards";

type OptimisticAction =
  | { type: "add"; member: BoardMember }
  | { type: "rename"; id: string; name: string }
  | { type: "remove"; id: string }
  | { type: "setRole"; id: string; role: "secretary" | "member" }
  | { type: "setAvatar"; id: string; avatarUrl: string }
  | { type: "removeAvatar"; id: string }
  | { type: "link"; id: string; userId: string; linkedName: string | null }
  | { type: "unlink"; id: string }
  | { type: "transfer"; id: string; newOwnerId: string };

function membersReducer(state: BoardMember[], action: OptimisticAction): BoardMember[] {
  switch (action.type) {
    case "add":
      return [...state, action.member];
    case "rename":
      return state.map((m) => (m.id === action.id ? { ...m, name: action.name } : m));
    case "remove":
      return state.filter((m) => m.id !== action.id);
    case "setRole":
      return state.map((m) => (m.id === action.id ? { ...m, role: action.role } : m));
    case "setAvatar":
      return state.map((m) => (m.id === action.id ? { ...m, avatarUrl: action.avatarUrl } : m));
    case "removeAvatar":
      return state.map((m) => (m.id === action.id ? { ...m, avatarUrl: null } : m));
    case "link":
      return state.map((m) =>
        m.id === action.id ? { ...m, userId: action.userId, linkedName: action.linkedName } : m
      );
    case "unlink":
      return state.map((m) => (m.id === action.id ? { ...m, userId: null, linkedName: null } : m));
    case "transfer":
      return state;
    default:
      return state;
  }
}

interface MemberManagerProps {
  boardId: string;
  ownerId: string;
  members: BoardMember[];
  usedMemberIds: string[];
}

export function MemberManager({
  boardId,
  ownerId,
  members,
  usedMemberIds
}: MemberManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [optimisticMembers, applyOptimistic] = useOptimistic(members, membersReducer);

  const used = new Set(usedMemberIds);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError("Vui lòng nhập tên thành viên");
      return;
    }
    setError(null);
    const tempId = `temp-${Date.now()}`;
    const tempMember: BoardMember = {
      id: tempId,
      name,
      avatarUrl: null,
      userId: null,
      role: "member",
      linkedName: null
    };
    startTransition(async () => {
      applyOptimistic({ type: "add", member: tempMember });
      try {
        await addMember(boardId, name);
        setNewName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại sau");
      }
    });
  }

  function startEdit(member: BoardMember) {
    setError(null);
    setEditingId(member.id);
    setEditingName(member.name);
  }

  function handleRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) {
      setError("Tên thành viên không được trống");
      return;
    }
    const id = editingId;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "rename", id, name });
      try {
        await renameMember(id, name);
        setEditingId(null);
        setEditingName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại sau");
      }
    });
  }

  function handleRemove(member: BoardMember) {
    const message = used.has(member.id)
      ? `${member.name} đã có trong một số buổi. Xoá sẽ ảnh hưởng tới số liệu các buổi đó. Vẫn xoá?`
      : `Xoá thành viên ${member.name}?`;
    if (!window.confirm(message)) return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: member.id });
      try {
        await removeMember(member.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại sau");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên thành viên mới"
            aria-label="Tên thành viên mới"
            disabled={isPending}
            className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-ink shadow-card outline-none transition-colors duration-[var(--dur-fast)] ease-soft placeholder:text-muted focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-accent px-5 font-medium text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-60"
          >
            <PlusIcon />
            {isPending ? "Đang thêm…" : "Thêm"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="px-1 text-sm text-danger">
          {error}
        </p>
      )}

      {optimisticMembers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
            <UsersIcon />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink">
            Chưa có thành viên nào
          </h2>
          <p className="max-w-prose text-sm text-muted">
            Thêm thành viên ở trên để bắt đầu chia tiền cho các buổi tập.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {optimisticMembers.map((member) => (
            <li
              key={member.id}
              className="rounded-lg border border-line bg-surface px-3.5 py-3 shadow-card"
            >
              {editingId === member.id ? (
                <form onSubmit={handleRename} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    aria-label={`Sửa tên ${member.name}`}
                    autoFocus
                    disabled={isPending}
                    className="h-10 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-ink outline-none transition-colors duration-[var(--dur-fast)] ease-soft focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-60"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent disabled:opacity-60"
                  >
                    Huỷ
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <MemberAvatar member={member} usedInSession={used.has(member.id)} applyOptimistic={applyOptimistic} />
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(member)}
                        disabled={isPending}
                        aria-label={`Sửa ${member.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent disabled:opacity-60"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(member)}
                        disabled={isPending}
                        aria-label={`Xoá ${member.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors duration-[var(--dur-fast)] ease-soft hover:border-danger hover:text-danger disabled:opacity-60"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <MemberRoleControls boardId={boardId} ownerId={ownerId} member={member} applyOptimistic={applyOptimistic} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MemberRoleControls({
  boardId,
  ownerId,
  member,
  applyOptimistic
}: {
  boardId: string;
  ownerId: string;
  member: BoardMember;
  applyOptimistic: (action: OptimisticAction) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");

  const isLeader = !!member.userId && member.userId === ownerId;
  const isLinked = !!member.userId;

  function handleLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = accountId.trim();
    if (!id) {
      setError("Dán mã tài khoản của thành viên");
      return;
    }
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "link", id: member.id, userId: id, linkedName: null });
      try {
        await linkMemberAccount(member.id, id);
        setAccountId("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại sau");
      }
    });
  }

  function handleTransfer() {
    if (
      !window.confirm(
        `Chuyển quyền trưởng nhóm cho ${member.name}? Bạn sẽ trở thành thành viên thường và mất quyền quản lý.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "transfer", id: member.id, newOwnerId: member.userId ?? member.id });
      try {
        await transferLeadership(boardId, member.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại sau");
      }
    });
  }

  function handleSetRole(role: "secretary" | "member") {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "setRole", id: member.id, role });
      try {
        await setMemberRole(member.id, role);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại sau");
      }
    });
  }

  function handleUnlink() {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "unlink", id: member.id });
      try {
        await unlinkMemberAccount(member.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại sau");
      }
    });
  }

  const badge = isLeader ? "Trưởng nhóm" : member.role === "secretary" ? "Thư ký" : "Thành viên";
  const badgeClass = isLeader
    ? "bg-accent text-on-accent"
    : member.role === "secretary"
      ? "bg-accent-soft text-accent"
      : "bg-surface-2 text-muted";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {badge}
        </span>
        {isLinked && (
          <span className="truncate text-xs text-muted">
            {member.linkedName ? `Liên kết: ${member.linkedName}` : "Đã liên kết tài khoản"}
          </span>
        )}
      </div>

      {!isLinked ? (
        <form onSubmit={handleLink} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Dán mã tài khoản để liên kết"
            aria-label={`Mã tài khoản liên kết cho ${member.name}`}
            disabled={pending}
            className="h-9 min-w-0 flex-1 rounded-full border border-line bg-surface px-3 font-mono text-xs text-ink outline-none transition-colors duration-[var(--dur-fast)] ease-soft placeholder:font-sans placeholder:text-muted focus:border-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-xs font-medium text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-60"
          >
            <LinkIcon />
            Liên kết
          </button>
        </form>
      ) : isLeader ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Vai trò
            <select
              value={member.role}
              disabled={pending}
              onChange={(e) => handleSetRole(e.target.value as "secretary" | "member")}
              className="h-9 rounded-full border border-line bg-surface px-3 text-xs text-ink outline-none transition-colors duration-[var(--dur-fast)] ease-soft focus:border-accent disabled:opacity-60"
            >
              <option value="member">Thành viên</option>
              <option value="secretary">Thư ký</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={pending}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent disabled:opacity-60"
          >
            <CrownIcon />
            Đặt làm trưởng nhóm
          </button>
          <button
            type="button"
            onClick={handleUnlink}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3 text-xs font-medium text-muted transition-colors duration-[var(--dur-fast)] ease-soft hover:border-danger hover:text-danger disabled:opacity-60"
          >
            Gỡ liên kết
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7l4 4 5-7 5 7 4-4-2 13H5L3 7Z" />
    </svg>
  );
}

function MemberAvatar({
  member,
  usedInSession,
  applyOptimistic
}: {
  member: BoardMember;
  usedInSession: boolean;
  applyOptimistic: (action: OptimisticAction) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      applyOptimistic({ type: "setAvatar", id: member.id, avatarUrl: previewUrl });
      try {
        await setMemberAvatar(member.id, fd);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được ảnh, thử lại sau");
      } finally {
        URL.revokeObjectURL(previewUrl);
      }
    });
  }

  function handleRemoveAvatar() {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "removeAvatar", id: member.id });
      try {
        await removeMemberAvatar(member.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không xoá được ảnh, thử lại sau");
      }
    });
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft text-base font-semibold text-accent">
        {member.avatarUrl ? (
          <Image
            src={member.avatarUrl}
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initial(member.name)}</span>
        )}
        {isPending && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-accent-soft text-accent">
            <SpinnerIcon />
          </span>
        )}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium text-ink">{member.name}</span>
        {usedInSession && (
          <span className="w-fit rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            đã có trong buổi
          </span>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="inline-flex h-9 min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-medium text-muted transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent disabled:opacity-60"
          >
            <CameraIcon />
            {isPending ? "Đang tải…" : member.avatarUrl ? "Đổi ảnh" : "Thêm ảnh"}
          </button>
          {member.avatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={isPending}
              className="inline-flex h-9 min-h-9 items-center rounded-full border border-line bg-surface px-3 text-xs font-medium text-muted transition-colors duration-[var(--dur-fast)] ease-soft hover:border-danger hover:text-danger disabled:opacity-60"
            >
              Xoá ảnh
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L8 6H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-4l-1.5-2Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6M10 11v6M14 11v6" />
    </svg>
  );
}
