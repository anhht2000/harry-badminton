import Link from "next/link";
import { getAllBoards } from "@/lib/queries";

export async function PublicBoardList({
  excludeOwnerId
}: {
  excludeOwnerId?: string;
} = {}) {
  const boards = await getAllBoards(excludeOwnerId);

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <ShuttlecockMark size={22} />
        </span>
        <h3 className="font-display text-lg font-semibold text-ink">
          Chưa có nhóm nào
        </h3>
        <p className="max-w-prose text-sm text-muted">
          {excludeOwnerId
            ? "Hiện chưa có nhóm nào khác để gợi ý."
            : "Hãy đăng nhập ở góc trên để tạo nhóm đầu tiên và bắt đầu chia tiền cho cả nhóm."}
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <li key={board.id}>
          <Link
            href={`/s/${board.shareToken}`}
            className="group flex h-full flex-col gap-4 rounded-lg border border-line bg-surface p-5 text-ink no-underline shadow-card transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-soft hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
                <ShuttlecockMark size={18} />
              </span>
              <span
                aria-hidden="true"
                className="text-muted transition-transform duration-[var(--dur-base)] ease-soft group-hover:translate-x-0.5 group-hover:text-accent"
              >
                <ArrowIcon />
              </span>
            </div>
            <span className="font-display text-lg font-semibold leading-snug text-ink">
              {board.name}
            </span>
            <p className="num text-sm text-muted">
              {board.memberCount} thành viên · {board.sessionCount} buổi
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ShuttlecockMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21a3 3 0 0 0 3-3l.6-7.2L12 8l-3.6 2.8L9 18a3 3 0 0 0 3 3Z" />
      <path d="M9 18h6" />
      <path d="M12 8l1.5-4.5M12 8l-2-4M12 8l4 1M12 8l-4 1" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
