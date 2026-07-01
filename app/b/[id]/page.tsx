import { redirect } from "next/navigation";
import { getCurrentUserId, getCurrentUserEmail } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/access";
import { BoardView } from "@/components/board-view";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");
  const superAdmin = isSuperAdmin(await getCurrentUserEmail());

  return (
    <BoardView
      boardId={params.id}
      userId={userId}
      superAdmin={superAdmin}
      backHref="/"
      backLabel="Danh sách nhóm"
      recordVisit
    />
  );
}
