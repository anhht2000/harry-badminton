import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBoardData } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/auth";
import { DownloadTemplate } from "@/components/download-template";
import { ImportWizard } from "@/components/import-wizard";

export const dynamic = "force-dynamic";

export default async function ImportPage({
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
    <main className="mx-auto flex max-w-2xl flex-col gap-5 p-4">
      <header className="flex flex-col gap-1">
        <Link href={`/b/${data.board.id}`} className="text-sm text-muted">
          ← {data.board.name}
        </Link>
        <h1 className="mt-1 text-xl">Nhập từ file</h1>
        <p className="text-sm text-muted">
          Tải file mẫu, điền dữ liệu rồi tải lên để xem trước trước khi nhập.
        </p>
      </header>

      <DownloadTemplate />

      <ImportWizard boardId={data.board.id} />
    </main>
  );
}
