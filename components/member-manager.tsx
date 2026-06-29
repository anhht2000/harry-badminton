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
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên thành viên mới"
            aria-label="Tên thành viên mới"
            disabled={isPending}
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-accent px-4 py-2 text-on-accent disabled:opacity-60"
          >
            Thêm
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      {members.length === 0 ? (
        <p className="rounded-md border border-line bg-surface px-4 py-6 text-center text-muted">
          Chưa có thành viên nào.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="rounded-md border border-line bg-surface px-3 py-2 shadow-card"
            >
              {editingId === member.id ? (
                <form onSubmit={handleRename} className="flex gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    aria-label={`Sửa tên ${member.name}`}
                    autoFocus
                    disabled={isPending}
                    className="flex-1 rounded-md border border-line bg-surface px-3 py-1.5 text-ink disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-accent px-3 py-1.5 text-on-accent disabled:opacity-60"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={isPending}
                    className="rounded-md border border-line px-3 py-1.5 text-ink disabled:opacity-60"
                  >
                    Huỷ
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{member.name}</span>
                    {used.has(member.id) && (
                      <span className="rounded-sm border border-line px-1.5 py-0.5 text-xs text-muted">
                        đã có trong buổi
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(member)}
                      disabled={isPending}
                      className="rounded-md border border-line px-3 py-1.5 text-sm text-ink disabled:opacity-60"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      disabled={isPending}
                      className="rounded-md border border-line px-3 py-1.5 text-sm text-danger disabled:opacity-60"
                    >
                      Xoá
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
