import Link from "next/link";
import { getBoardsByOwner } from "@/lib/queries";

export async function BoardList({ userId }: { userId: string }) {
  const boards = await getBoardsByOwner(userId);

  if (boards.length === 0) {
    return (
      <p className="rounded-md border border-line bg-surface px-4 py-6 text-center text-muted">
        Chưa có nhóm nào. Tạo nhóm đầu tiên để bắt đầu chia tiền.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {boards.map((board) => (
        <li key={board.id}>
          <Link
            href={`/b/${board.id}`}
            className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3 text-ink no-underline shadow-card transition-colors hover:border-accent"
          >
            <span className="font-medium">{board.name}</span>
            <span aria-hidden className="text-muted">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
