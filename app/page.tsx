import { getCurrentUserId } from "@/lib/auth";
import { AuthButtons } from "@/components/auth-buttons";
import { BoardList } from "@/components/board-list";
import { CreateBoardForm } from "@/components/create-board-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <main className="mx-auto max-w-md p-4">
        <header className="mt-10 mb-6 text-center">
          <h1 className="text-2xl">Chia Tiền Thể Thao</h1>
          <p className="mt-3 text-muted">
            Chia đều chi phí mỗi buổi tập cho người có mặt và theo dõi số nợ
            tích lũy của cả nhóm.
          </p>
        </header>
        <div className="flex justify-center">
          <AuthButtons />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mt-6 mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl">Nhóm của bạn</h1>
        <AuthButtons />
      </header>

      <section className="mb-6">
        <CreateBoardForm />
      </section>

      <BoardList userId={userId} />
    </main>
  );
}
