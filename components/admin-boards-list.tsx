import Link from "next/link";
import { getAllBoardsAdmin } from "@/lib/queries";
import { BoardStatusControl } from "@/components/board-status-control";
import { AdminBoardDelete } from "@/components/admin-board-delete";

export async function AdminBoardsList() {
  const all = await getAllBoardsAdmin();

  if (all.length === 0) {
    return <p className="text-sm text-muted">Chưa có nhóm nào trong hệ thống.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {all.map((b) => (
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
          <p className="num text-xs text-muted">
            {b.memberCount} thành viên · {b.sessionCount} buổi
          </p>
          <p className="text-xs text-muted">Trưởng nhóm: {b.ownerLabel}</p>
          <div className="mt-auto flex flex-col items-start gap-2 pt-1">
            <BoardStatusControl boardId={b.id} active={b.active} canToggle />
            {!b.active && <AdminBoardDelete boardId={b.id} boardName={b.name} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
