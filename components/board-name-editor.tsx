"use client";
import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameBoard } from "@/lib/actions/boards";

export function BoardNameEditor({
  boardId,
  name,
  canEdit = false
}: {
  boardId: string;
  name: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimisticName, applyOptimistic] = useOptimistic(
    name,
    (_state, next: string) => next
  );

  function save() {
    const clean = value.trim();
    if (!clean) {
      setError("Tên nhóm không được trống");
      return;
    }
    if (clean === name) {
      setEditing(false);
      return;
    }
    setError(null);
    setEditing(false);
    startTransition(async () => {
      applyOptimistic(clean);
      try {
        await renameBoard(boardId, clean);
        router.refresh();
      } catch (e) {
        setEditing(true);
        setError(e instanceof Error ? e.message : "Đổi tên thất bại");
      }
    });
  }

  function cancel() {
    setValue(name);
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {optimisticName}
        </h1>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setValue(name);
              setEditing(true);
            }}
            aria-label="Đổi tên nhóm"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted transition-[border-color,color] duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
          >
            <PencilIcon />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={value}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 font-display text-xl font-bold text-ink outline-none transition-colors duration-[var(--dur-fast)] ease-soft focus:border-accent disabled:opacity-60"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu"}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-[border-color,color] duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent disabled:opacity-60"
        >
          Huỷ
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
