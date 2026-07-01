"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBoard } from "@/lib/actions/boards";
import { LoadingOverlay } from "@/components/loading-overlay";

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
    <>
      <LoadingOverlay show={isPending} label="Đang tạo…" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          type="text"
          name="name"
          placeholder="Tên nhóm mới, ví dụ: Cầu lông thứ 5"
          aria-label="Tên nhóm mới"
          disabled={isPending}
          className="h-11 w-full sm:flex-1 rounded-full border border-line bg-surface px-4 text-ink shadow-card outline-none transition-colors duration-[var(--dur-fast)] ease-soft placeholder:text-muted focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-accent px-5 font-medium text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-60"
        >
          {isPending ? "Đang tạo…" : "Tạo nhóm"}
        </button>
      </div>
      {error && (
        <p role="alert" className="px-1 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
    </>
  );
}
