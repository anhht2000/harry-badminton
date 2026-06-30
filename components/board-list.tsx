import { getBoardsForUser } from "@/lib/queries";
import { BoardListClient } from "@/components/board-list-client";

export async function BoardList({ userId }: { userId: string }) {
  const boards = await getBoardsForUser(userId);

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <PlusGroupIcon />
        </span>
        <h2 className="font-display text-lg font-semibold text-ink">
          Chưa có nhóm nào
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Tạo nhóm đầu tiên ở trên để bắt đầu ghi nhận chi phí và chia tiền cho
          cả nhóm.
        </p>
      </div>
    );
  }

  return <BoardListClient boards={boards} />;
}

function PlusGroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
