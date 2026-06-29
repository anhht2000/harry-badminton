import Link from "next/link";
import { formatVnd } from "@/lib/domain/money";

export interface SessionRow {
  id: string;
  date: string;
  attendeeCount: number;
  total: number;
  perHead: number;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function SessionList({
  boardId,
  sessions
}: {
  boardId: string;
  sessions: SessionRow[];
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base">Các buổi</h2>
        <Link
          href={`/b/${boardId}/buoi`}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-on-accent"
        >
          Thêm buổi
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-md border border-line bg-surface px-4 py-8 text-center text-muted">
          Chưa có buổi nào. Bấm “Thêm buổi” để bắt đầu.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/b/${boardId}/buoi/${s.id}`}
                className="block rounded-md border border-line bg-surface px-4 py-3 shadow-card transition-colors hover:border-accent"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{formatDate(s.date)}</span>
                  <span className="num font-semibold text-money">{formatVnd(s.total)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-muted">
                  <span>{s.attendeeCount} người</span>
                  <span className="num">Mỗi người {formatVnd(s.perHead)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
