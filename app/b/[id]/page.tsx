import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBoardData } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/auth";
import { splitSession } from "@/lib/domain/split";
import { BoardTabs } from "@/components/board-tabs";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const data = await getBoardData(params.id);
  if (!data) notFound();
  if (data.board.ownerId !== userId) redirect("/");

  const sessions = data.sessions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => {
      const { total, perHead } = splitSession({
        expenses: s.expenses.map((e) => ({ amount: e.amount })),
        attendeeIds: s.attendeeIds,
        payments: s.payments.map((p) => ({ memberId: p.memberId, amount: p.amount }))
      });
      return {
        id: s.id,
        date: s.date,
        attendeeCount: s.attendeeIds.length,
        total,
        perHead
      };
    });

  const shareUrl = `/s/${data.board.shareToken}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5">
        <Link href="/" className="text-sm text-muted">
          ← Danh sách
        </Link>
        <h1 className="mt-1 text-2xl">{data.board.name}</h1>
      </header>

      <BoardTabs
        boardId={data.board.id}
        shareUrl={shareUrl}
        members={data.members}
        sessions={sessions}
        balances={data.balances}
      />
    </main>
  );
}
