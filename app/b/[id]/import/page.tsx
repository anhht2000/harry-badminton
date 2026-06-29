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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-3">
        <Link
          href={`/b/${data.board.id}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink no-underline shadow-card transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
        >
          <BackIcon />
          {data.board.name}
        </Link>
        <div className="flex flex-col gap-1">
          <p className="label-eyebrow">Nhập từ Excel</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Nhập nhiều buổi từ file
          </h1>
          <p className="text-muted">
            Tải file mẫu, điền dữ liệu rồi tải lên để xem trước trước khi nhập.
          </p>
        </div>
      </header>

      <DownloadTemplate />

      <ImportWizard boardId={data.board.id} />
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
