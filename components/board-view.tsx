import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBoardData, recordBoardVisit } from "@/lib/queries";
import { roleFromMembers, canManageBooks, canManageMembers } from "@/lib/access";
import { splitSession } from "@/lib/domain/split";
import { BoardTabs } from "@/components/board-tabs";
import { BoardNameEditor } from "@/components/board-name-editor";
import { BoardStatusControl } from "@/components/board-status-control";

type BoardViewProps = {
  boardId: string;
  userId: string;
  superAdmin: boolean;
  backHref: string;
  backLabel: string;
  recordVisit: boolean;
};

export async function BoardView({
  boardId,
  userId,
  superAdmin,
  backHref,
  backLabel,
  recordVisit
}: BoardViewProps) {
  const data = await getBoardData(boardId);
  if (!data) notFound();

  const role = roleFromMembers(data.board.ownerId, data.members, userId);
  if (!role && !superAdmin) redirect(backHref);
  if (!data.board.active && role !== "leader" && !superAdmin) redirect(backHref);

  if (recordVisit) await recordBoardVisit(userId, boardId);

  const effectiveRole = superAdmin ? "leader" : role ?? "member";
  const manageBooks = canManageBooks(effectiveRole);
  const manageMembers = canManageMembers(effectiveRole);
  const canToggleActive = effectiveRole === "leader";

  const sessions = data.sessions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => {
      const { total, perHead } = splitSession({
        expenses: s.expenses.map((e) => ({ amount: e.amount })),
        attendeeIds: s.attendeeIds,
        attendeeCounts: s.attendeeCounts,
        payments: s.payments.map((p) => ({ memberId: p.memberId, amount: p.amount }))
      });
      return {
        id: s.id,
        date: s.date,
        attendeeCount: s.attendeeIds.reduce((n, id) => n + (s.attendeeCounts[id] ?? 1), 0),
        total,
        perHead
      };
    });

  const shareUrl = `/s/${data.board.shareToken}`;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted no-underline transition-colors duration-[var(--dur-fast)] ease-soft hover:text-accent-2"
        >
          <BackIcon />
          {backLabel}
        </Link>
        <p className="label-eyebrow">Nhóm</p>
        <BoardNameEditor boardId={data.board.id} name={data.board.name} canEdit={manageMembers} />
        {(!data.board.active || canToggleActive) && (
          <BoardStatusControl
            boardId={data.board.id}
            active={data.board.active}
            canToggle={canToggleActive}
          />
        )}
      </header>

      <BoardTabs
        boardId={data.board.id}
        shareUrl={shareUrl}
        members={data.members}
        sessions={sessions}
        balances={data.balances}
        sessionDebts={data.sessionDebts}
        photos={data.photos}
        canManageBooks={manageBooks}
        canManageMembers={manageMembers}
      />
    </main>
  );
}

function BackIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
