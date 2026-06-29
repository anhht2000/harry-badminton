import { notFound } from "next/navigation";
import { getBoardByShareToken } from "@/lib/queries";
import { formatVnd } from "@/lib/domain/money";
import { splitSession } from "@/lib/domain/split";

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
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5">
        <p className="text-sm text-muted">Bảng chia tiền</p>
        <h1 className="mt-1 text-2xl">{data.board.name}</h1>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-base">Số dư</h2>
        {balanceRows.length === 0 ? (
          <p className="rounded-md border border-line bg-surface px-4 py-8 text-center text-muted">
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
                  className="rounded-md border border-line bg-surface px-4 py-3 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink">{name}</span>
                    <span className={`num font-semibold ${color}`}>
                      {formatVnd(Math.abs(balance))}
                      <span className="ml-1 text-xs font-normal">{label}</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-base">Các buổi</h2>
        {sessions.length === 0 ? (
          <p className="rounded-md border border-line bg-surface px-4 py-8 text-center text-muted">
            Chưa có buổi nào.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-line bg-surface px-4 py-3 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{formatDate(s.date)}</span>
                  <span className="num font-semibold text-money">
                    {formatVnd(s.total)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted">{s.attendeeCount} người</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-muted">
        Trang chỉ xem, không thể chỉnh sửa.
      </p>
    </main>
  );
}
