"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBoardActive } from "@/lib/actions/boards";

export function BoardStatusControl({
  boardId,
  active,
  canToggle
}: {
  boardId: string;
  active: boolean;
  canToggle: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    if (
      !next &&
      !window.confirm(
        "Ẩn nhóm này (deactivate)? Nhóm sẽ biến mất khỏi danh sách công khai và link chia sẻ — chỉ trưởng nhóm và super admin còn thấy."
      )
    )
      return;
    startTransition(async () => {
      await setBoardActive(boardId, next);
      router.refresh();
    });
  }

  const btnClass =
    "inline-flex h-8 items-center justify-center rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink transition-[border-color,color] duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent disabled:opacity-60";

  if (!active) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-danger bg-surface px-3 py-1 text-xs font-medium text-danger">
          <DraftIcon />
          Bản nháp — đã ẩn
        </span>
        {canToggle && (
          <button type="button" onClick={() => toggle(true)} disabled={pending} className={btnClass}>
            {pending ? "Đang lưu…" : "Khôi phục"}
          </button>
        )}
      </div>
    );
  }

  if (!canToggle) return null;
  return (
    <button
      type="button"
      onClick={() => toggle(false)}
      disabled={pending}
      className="inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-medium text-muted transition-[border-color,color] duration-[var(--dur-fast)] ease-soft hover:border-danger hover:text-danger disabled:opacity-60"
    >
      <EyeOffIcon />
      {pending ? "Đang lưu…" : "Ẩn nhóm"}
    </button>
  );
}

function DraftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c5.5 0 9 6 9 6a14 14 0 0 1-2.2 2.9M6.6 6.6A14 14 0 0 0 3 10s3.5 6 9 6a8.7 8.7 0 0 0 3.4-.7" />
      <path d="m2 2 20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
