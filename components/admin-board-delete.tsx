"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBoard } from "@/lib/actions/boards";

export function AdminBoardDelete({
  boardId,
  boardName
}: {
  boardId: string;
  boardName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Xóa vĩnh viễn nhóm "${boardName}"? Toàn bộ buổi, chi phí, thanh toán và ảnh sẽ bị xóa và KHÔNG thể khôi phục.`
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteBoard(boardId);
        router.refresh();
      } catch {
        window.alert("Không xóa được nhóm. Thử lại sau.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-full border border-danger bg-surface px-3 text-xs font-medium text-danger transition-colors duration-[var(--dur-fast)] ease-soft hover:bg-danger hover:text-surface disabled:opacity-60"
    >
      <TrashIcon />
      {pending ? "Đang xóa…" : "Xóa vĩnh viễn"}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}
