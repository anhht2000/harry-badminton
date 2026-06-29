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
  sessions,
  canManage = false
}: {
  boardId: string;
  sessions: SessionRow[];
  canManage?: boolean;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Các buổi</h2>
        {canManage && (
          <Link
            href={`/b/${boardId}/buoi`}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-on-accent no-underline shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2"
          >
            <PlusIcon />
            Thêm buổi
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
            <CalendarIcon />
          </span>
          <h3 className="font-display text-base font-semibold text-ink">
            Chưa có buổi nào
          </h3>
          <p className="max-w-prose text-sm text-muted">
            Bấm “Thêm buổi” để ghi nhận chi phí buổi đầu tiên và chia đều cho cả
            nhóm.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/b/${boardId}/buoi/${s.id}`}
                className="group flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 no-underline shadow-card transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-soft hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="font-display text-base font-semibold text-ink">
                    {formatDate(s.date)}
                  </span>
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                    <UserIcon />
                    {s.attendeeCount} người
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="num text-lg font-bold text-money">
                    {formatVnd(s.total)}
                  </span>
                  <span className="num text-xs text-muted">
                    Mỗi người {formatVnd(s.perHead)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
