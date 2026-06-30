import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBoardData } from "@/lib/queries";
import { getCurrentUserId, getCurrentUserEmail } from "@/lib/auth";
import { roleFromMembers, canManageBooks, isSuperAdmin } from "@/lib/access";
import { formatVnd } from "@/lib/domain/money";
import { SessionChecklist } from "@/components/balance-table";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params
}: {
  params: { id: string; memberId: string };
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");
  const superAdmin = isSuperAdmin(await getCurrentUserEmail());

  const data = await getBoardData(params.id);
  if (!data) notFound();

  const role = roleFromMembers(data.board.ownerId, data.members, userId);
  if (!role && !superAdmin) redirect("/");
  if (!data.board.active && role !== "leader" && !superAdmin) redirect("/");

  const effectiveRole = superAdmin ? "leader" : role ?? "member";
  const manageBooks = canManageBooks(effectiveRole);

  const member = data.members.find((m) => m.id === params.memberId);
  if (!member) notFound();

  const balance = data.balances[member.id] ?? 0;
  const debts = data.sessionDebts[member.id] ?? [];
  const rounded = Math.round(balance);
  const owes = rounded > 0;
  const receives = rounded < 0;
  const label = owes ? "còn nợ" : receives ? "được nhận" : "đã xong";
  const color = owes ? "text-danger" : receives ? "text-ok" : "text-muted";

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <Link
          href={`/b/${data.board.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted no-underline transition-colors duration-[var(--dur-fast)] ease-soft hover:text-accent-2"
        >
          <BackIcon />
          {data.board.name}
        </Link>
        <p className="label-eyebrow">Thành viên</p>
        <h1 className="font-display text-2xl font-bold text-ink">{member.name}</h1>
      </header>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-hero p-5 shadow-card">
        <span className="label-eyebrow">Số dư</span>
        <span className="flex flex-col items-end gap-0.5 text-right">
          <span className={`num text-3xl font-bold ${color}`}>{formatVnd(Math.abs(rounded))}</span>
          <span className={`text-xs font-medium ${color}`}>{label}</span>
        </span>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Theo từng buổi</h2>
        {debts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center text-sm text-muted">
            Chưa có buổi nào liên quan đến người này.
          </p>
        ) : (
          <SessionChecklist
            boardId={data.board.id}
            memberId={member.id}
            debts={debts}
            canManage={manageBooks}
          />
        )}
      </section>
    </main>
  );
}

function BackIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
