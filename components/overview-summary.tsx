"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatVnd } from "@/lib/domain/money";
import type { BoardMember } from "@/lib/queries";

interface OverviewSummaryProps {
  boardId: string;
  members: BoardMember[];
  balances: Record<string, number>;
}

function storageKey(boardId: string): string {
  return `overview:hidden:${boardId}`;
}

export function OverviewSummary({ boardId, members, balances }: OverviewSummaryProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);

  // Doc lua chon an/hien tu localStorage (chi tren may nay). Server render mac dinh hien tat ca.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(boardId));
      if (raw) setHidden(new Set(JSON.parse(raw) as string[]));
    } catch {
      // bo qua localStorage loi (private mode...)
    }
  }, [boardId]);

  function toggleHidden(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey(boardId), JSON.stringify([...next]));
      } catch {
        // bo qua
      }
      return next;
    });
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <UsersIcon />
        </span>
        <h3 className="font-display text-base font-semibold text-ink">Chưa có thành viên nào</h3>
        <p className="max-w-prose text-sm text-muted">
          Thêm thành viên vào nhóm để xem tổng kết nợ dư của mỗi người.
        </p>
      </div>
    );
  }

  const rows = members
    .map((m) => ({ member: m, balance: balances[m.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance);
  const visible = rows.filter((r) => !hidden.has(r.member.id));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Tổng kết</h2>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink shadow-card transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
        >
          {editing ? <CheckIcon /> : <SlidersIcon />}
          {editing ? "Xong" : "Tùy chỉnh"}
        </button>
      </div>

      {editing ? (
        <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-2 shadow-card">
          <p className="px-2 py-1.5 text-xs text-muted">Chọn người hiện trong tổng kết (lưu trên máy này).</p>
          {rows.map(({ member }) => {
            const shown = !hidden.has(member.id);
            return (
              <label
                key={member.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-ink hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={shown}
                  onChange={() => toggleHidden(member.id)}
                  className="h-4 w-4 shrink-0 rounded border-line text-accent accent-accent focus:ring-accent"
                />
                {member.name}
              </label>
            );
          })}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center text-sm text-muted">
          Đã ẩn tất cả. Bấm “Tùy chỉnh” để hiện lại.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map(({ member, balance }) => {
            const rounded = Math.round(balance);
            const owes = rounded > 0;
            const receives = rounded < 0;
            const label = owes ? "còn nợ" : receives ? "được nhận" : "đã xong";
            const color = owes ? "text-danger" : receives ? "text-ok" : "text-muted";
            return (
              <li key={member.id}>
                <Link
                  href={`/b/${boardId}/thanh-vien/${member.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4 no-underline shadow-card transition-[transform,border-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:border-accent"
                >
                  <span className="min-w-0 truncate font-display text-base font-semibold text-ink">
                    {member.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-right">
                    <span className="flex flex-col items-end gap-0.5">
                      <span className={`num text-base font-bold ${color}`}>
                        {formatVnd(Math.abs(rounded))}
                      </span>
                      <span className={`text-xs font-medium ${color}`}>{label}</span>
                    </span>
                    <ChevronIcon />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 19v-1.5a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3V19" />
      <circle cx="9.5" cy="8" r="3" />
      <path d="M21 19v-1.5a3 3 0 0 0-2.25-2.9M16 5.1a3 3 0 0 1 0 5.8" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-muted">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
