import { notFound, redirect } from "next/navigation";
import { getBoardData } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/auth";
import { SessionForm } from "@/components/session-form";

export const dynamic = "force-dynamic";

export default async function NewSessionPage({
  params
}: {
  params: { id: string };
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const data = await getBoardData(params.id);
  if (!data) notFound();
  if (data.board.ownerId !== userId) redirect("/");

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl">Tạo buổi mới</h1>
        <p className="text-sm text-muted">{data.board.name}</p>
      </header>
      <SessionForm boardId={data.board.id} members={data.members} />
    </main>
  );
}
