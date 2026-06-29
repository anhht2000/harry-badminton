"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBoard } from "@/lib/actions/boards";

export function CreateBoardForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = inputRef.current?.value.trim() ?? "";
    if (!name) {
      setError("Vui lòng nhập tên nhóm");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createBoard(name);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } catch {
        setError("Không tạo được nhóm, thử lại sau");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          name="name"
          placeholder="Tên nhóm mới"
          aria-label="Tên nhóm mới"
          disabled={isPending}
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-2 text-on-accent disabled:opacity-60"
        >
          {isPending ? "Đang tạo…" : "Tạo nhóm"}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
