import { notFound } from "next/navigation";
import { getBoardByShareToken } from "@/lib/queries";
import { formatVnd } from "@/lib/domain/money";
import { splitSession } from "@/lib/domain/split";
import { AlbumGallery } from "@/components/album-gallery";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default async function SharePage({
  params
}: {
  params: { token: string };
}) {
  const data = await getBoardByShareToken(params.token);
  if (!data) notFound();

  const balanceRows = data.members
    .map((m) => ({ name: m.name, balance: data.balances[m.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance);

  const sessions = data.sessions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => {
      const { total } = splitSession({
        expenses: s.expenses.map((e) => ({ amount: e.amount })),
        attendeeIds: s.attendeeIds,
        payments: s.payments.map((p) => ({ memberId: p.memberId, amount: p.amount }))
      });
      return {
        id: s.id,
        date: s.date,
        attendeeCount: s.attendeeIds.length,
        total
      };
    });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      <header className="relative overflow-hidden rounded-lg border border-line bg-surface bg-hero p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-2">
          <p className="label-eyebrow">Bảng chia tiền</p>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {data.board.name}
          </h1>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
            <EyeIcon />
            Chỉ xem
          </span>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-soft blur-2xl"
        />
      </header>

      <section className="flex flex-col gap-3" aria-label="Số dư">
        <h2 className="label-eyebrow">Số dư</h2>
        {balanceRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-surface px-4 py-10 text-center text-muted">
            Chưa có thành viên nào.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {balanceRows.map(({ name, balance }) => {
              const owes = balance > 0;
              const receives = balance < 0;
              const label = owes ? "còn nợ" : receives ? "được nhận" : "đã xong";
              const color = owes
                ? "text-danger"
                : receives
                ? "text-ok"
                : "text-muted";
              return (
                <li
                  key={name}
                  className="rounded-lg border border-line bg-surface px-4 py-3 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
                      >
                        {name.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <span className="truncate font-medium text-ink">{name}</span>
                    </div>
                    <span className="flex shrink-0 flex-col items-end leading-tight">
                      <span className={`num font-semibold ${color}`}>
                        {formatVnd(Math.abs(balance))}
                      </span>
                      <span className="text-xs text-muted">{label}</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-label="Các buổi">
        <h2 className="label-eyebrow">Lịch sử buổi</h2>
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-surface px-4 py-10 text-center text-muted">
            Chưa có buổi nào.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-line bg-surface px-4 py-3 shadow-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium text-ink">{formatDate(s.date)}</span>
                    <span className="w-fit rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                      {s.attendeeCount} người
                    </span>
                  </div>
                  <span className="num shrink-0 font-semibold text-money">
                    {formatVnd(s.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlbumGallery boardId={data.board.id} photos={data.photos} />

      <footer className="flex flex-col items-center gap-1 border-t border-line pt-6 text-center">
        <span className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-accent-2">
          <ShuttlecockMark />
          Chia Tiền
        </span>
        <p className="text-xs text-muted">Trang chỉ xem, không thể chỉnh sửa.</p>
      </footer>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShuttlecockMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21a3 3 0 0 0 3-3l.6-7.2L12 8l-3.6 2.8L9 18a3 3 0 0 0 3 3Z" />
      <path d="M9 18h6" />
      <path d="M12 8l1.5-4.5M12 8l-2-4M12 8l4 1M12 8l-4 1" />
    </svg>
  );
}
