import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getBoardData } from "@/lib/queries";
import { MemberManager } from "@/components/member-manager";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  params
}: {
  params: { id: string };
}) {
  const userId = await getCurrentUserId();
  const data = await getBoardData(params.id);

  if (!data || !userId || data.board.ownerId !== userId) {
    notFound();
  }

  const usedMemberIds = new Set<string>();
  for (const session of data.sessions) {
    for (const id of session.attendeeIds) usedMemberIds.add(id);
    for (const p of session.payments) usedMemberIds.add(p.memberId);
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mt-6 mb-6">
        <Link href={`/b/${data.board.id}`} className="text-sm text-muted no-underline">
          ‹ Quay lại {data.board.name}
        </Link>
        <h1 className="mt-2 text-2xl">Thành viên</h1>
      </header>

      <MemberManager
        boardId={data.board.id}
        members={data.members}
        usedMemberIds={[...usedMemberIds]}
      />
    </main>
  );
}
