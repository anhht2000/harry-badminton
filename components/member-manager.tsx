"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BoardMember } from "@/lib/queries";
import { addMember, renameMember, removeMember } from "@/lib/actions/members";

interface MemberManagerProps {
  boardId: string;
  members: BoardMember[];
  usedMemberIds: string[];
}

export function MemberManager({
  boardId,
  members,
  usedMemberIds
}: MemberManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const used = new Set(usedMemberIds);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại sau");
      }
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError("Vui lòng nhập tên thành viên");
      return;
    }
    run(async () => {
      await addMember(boardId, name);
      setNewName("");
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
    run(async () => {
      await renameMember(editingId, name);
      setEditingId(null);
      setEditingName("");
    });
  }

  function handleRemove(member: BoardMember) {
    const message = used.has(member.id)
      ? `${member.name} đã có trong một số buổi. Xoá sẽ ảnh hưởng tới số liệu các buổi đó. Vẫn xoá?`
      : `Xoá thành viên ${member.name}?`;
    if (!window.confirm(message)) return;
    run(async () => {
      await removeMember(member.id);
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

      {members.length === 0 ? (
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
          {members.map((member) => (
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
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-base font-semibold text-accent"
                    >
                      {initial(member.name)}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium text-ink">
                        {member.name}
                      </span>
                      {used.has(member.id) && (
                        <span className="w-fit rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                          đã có trong buổi
                        </span>
                      )}
                    </div>
                  </div>
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
              )}
            </li>
          ))}
        </ul>
      )}
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

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6M10 11v6M14 11v6" />
    </svg>
  );
}
