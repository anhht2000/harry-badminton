import { notFound, redirect } from "next/navigation";
import { getBoardData } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/auth";
import { SessionForm } from "@/components/session-form";

export const dynamic = "force-dynamic";

export default async function EditSessionPage({
  params
}: {
  params: { id: string; sessionId: string };
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const data = await getBoardData(params.id);
  if (!data) notFound();
  if (data.board.ownerId !== userId) redirect("/");

  const session = data.sessions.find((s) => s.id === params.sessionId);
  if (!session) notFound();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl">Sửa buổi</h1>
        <p className="text-sm text-muted">{data.board.name}</p>
      </header>
      <SessionForm
        boardId={data.board.id}
        members={data.members}
        sessionId={session.id}
        initial={{
          date: session.date,
          note: session.note ?? "",
          attendeeIds: session.attendeeIds,
          expenses: session.expenses.map((e) => ({
            label: e.label,
            amount: e.amount
          })),
          payments: session.payments.map((p) => ({
            memberId: p.memberId,
            amount: p.amount
          }))
        }}
      />
    </main>
  );
}
