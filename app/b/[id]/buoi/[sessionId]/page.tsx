import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBoardData } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/auth";
import { resolveRoleWithSuper, canManageBooks } from "@/lib/access";
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
  const role = await resolveRoleWithSuper(data.board.ownerId, data.members, userId);
  if (!role || !canManageBooks(role)) redirect(`/b/${params.id}`);

  const session = data.sessions.find((s) => s.id === params.sessionId);
  if (!session) notFound();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <Link
          href={`/b/${data.board.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted no-underline transition-colors duration-[var(--dur-fast)] ease-soft hover:text-accent-2"
        >
          <BackIcon />
          {data.board.name}
        </Link>
        <p className="label-eyebrow">Sửa buổi</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Sửa buổi
        </h1>
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

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
