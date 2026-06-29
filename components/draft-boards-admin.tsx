import Link from "next/link";
import { getDraftBoards } from "@/lib/queries";
import { BoardStatusControl } from "@/components/board-status-control";

export async function DraftBoardsAdmin() {
  const drafts = await getDraftBoards();

  if (drafts.length === 0) {
    return (
      <p className="text-sm text-muted">Hiện không có nhóm nào ở trạng thái nháp.</p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {drafts.map((b) => (
        <li
          key={b.id}
          className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card"
        >
          <Link
            href={`/b/${b.id}`}
            className="font-display text-lg font-semibold leading-snug text-ink no-underline transition-colors duration-[var(--dur-fast)] ease-soft hover:text-accent"
          >
            {b.name}
          </Link>
          <p className="text-xs text-muted">Trưởng nhóm: {b.ownerLabel}</p>
          <BoardStatusControl boardId={b.id} active={false} canToggle />
        </li>
      ))}
    </ul>
  );
}
