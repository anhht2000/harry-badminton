import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getBoardData } from "@/lib/queries";
import { resolveRoleWithSuper, canManageMembers } from "@/lib/access";
import { MemberManager } from "@/components/member-manager";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  params
}: {
  params: { id: string };
}) {
  const userId = await getCurrentUserId();
  const data = await getBoardData(params.id);

  if (!data || !userId) notFound();
  const role = await resolveRoleWithSuper(data.board.ownerId, data.members, userId);
  if (!role || !canManageMembers(role)) notFound();

  const usedMemberIds = new Set<string>();
  for (const session of data.sessions) {
    for (const id of session.attendeeIds) usedMemberIds.add(id);
    for (const p of session.payments) usedMemberIds.add(p.memberId);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-3">
        <Link
          href={`/b/${data.board.id}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink no-underline shadow-card transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
        >
          <BackIcon />
          Quay lại nhóm
        </Link>
        <div className="flex flex-col gap-1">
          <p className="label-eyebrow">Thành viên</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {data.board.name}
          </h1>
        </div>
      </header>

      <MemberManager
        boardId={data.board.id}
        ownerId={data.board.ownerId}
        members={data.members}
        usedMemberIds={[...usedMemberIds]}
      />
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
