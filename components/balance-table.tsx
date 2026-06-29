"use client";
import { useEffect, useRef, useTransition } from "react";
import { formatVnd } from "@/lib/domain/money";
import {
  markSessionPaid,
  unmarkSessionPaid,
  markAllSessionsPaid,
  unmarkAllSessionsPaid
} from "@/lib/actions/settlements";
import type { BoardMember, MemberSessionDebt } from "@/lib/queries";

interface BalanceTableProps {
  boardId: string;
  members: BoardMember[];
  balances: Record<string, number>;
  sessionDebts: Record<string, MemberSessionDebt[]>;
  canManage?: boolean;
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function BalanceTable({ boardId, members, balances, sessionDebts, canManage = false }: BalanceTableProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <UsersIcon />
        </span>
        <h3 className="font-display text-base font-semibold text-ink">
          Chưa có thành viên nào
        </h3>
        <p className="max-w-prose text-sm text-muted">
          Thêm thành viên vào nhóm để theo dõi số dư nợ của mỗi người.
        </p>
      </div>
    );
  }

  const rows = members
    .map((m) => ({ member: m, balance: balances[m.id] ?? 0, debts: sessionDebts[m.id] ?? [] }))
    .sort((a, b) => b.balance - a.balance);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-ink">Số dư</h2>
      <ul className="flex flex-col gap-3">
        {rows.map(({ member, balance, debts }) => {
          const owes = balance > 0;
          const receives = balance < 0;
          const label = owes ? "còn nợ" : receives ? "được nhận" : "đã xong";
          const color = owes ? "text-danger" : receives ? "text-ok" : "text-muted";
          return (
            <li
              key={member.id}
              className="rounded-lg border border-line bg-surface p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-base font-semibold text-ink">
                  {member.name}
                </span>
                <span className="flex flex-col items-end gap-0.5 text-right">
                  <span className={`num text-lg font-bold ${color}`}>
                    {formatVnd(Math.abs(balance))}
                  </span>
                  <span className={`text-xs font-medium ${color}`}>{label}</span>
                </span>
              </div>

              {debts.length > 0 && canManage && (
                <SessionChecklist boardId={boardId} memberId={member.id} debts={debts} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SessionChecklist({
  boardId,
  memberId,
  debts
}: {
  boardId: string;
  memberId: string;
  debts: MemberSessionDebt[];
}) {
  const [pending, startTransition] = useTransition();
  const allRef = useRef<HTMLInputElement>(null);

  const allPaid = debts.every((d) => d.paid);
  const somePaid = debts.some((d) => d.paid);

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = somePaid && !allPaid;
  }, [somePaid, allPaid]);

  function toggleAll() {
    if (allPaid) {
      if (!window.confirm("Bỏ đánh dấu tất cả các buổi đã trả? Số tiền sẽ tính nợ lại."))
        return;
      startTransition(() => unmarkAllSessionsPaid(boardId, memberId));
    } else {
      startTransition(() => markAllSessionsPaid(boardId, memberId));
    }
  }

  function toggleOne(debt: MemberSessionDebt) {
    if (debt.paid) {
      if (
        !window.confirm(
          `Bỏ đánh dấu đã trả buổi ${shortDate(debt.date)}? Số tiền sẽ tính nợ lại.`
        )
      )
        return;
      startTransition(() => unmarkSessionPaid(boardId, memberId, debt.sessionId));
    } else {
      startTransition(() => markSessionPaid(boardId, memberId, debt.sessionId));
    }
  }

  const checkboxClass =
    "h-4 w-4 shrink-0 rounded border-line text-accent accent-accent focus:ring-accent";

  return (
    <div className="mt-3 flex flex-col gap-1 rounded-xl border border-line bg-surface-2 p-3">
      <label className="flex items-center gap-2.5 border-b border-line pb-2 text-sm font-medium text-ink">
        <input
          ref={allRef}
          type="checkbox"
          checked={allPaid}
          disabled={pending}
          onChange={toggleAll}
          className={checkboxClass}
        />
        Tất cả các buổi
      </label>
      <ul className="flex flex-col">
        {debts.map((debt) => (
          <li key={debt.sessionId}>
            <label className="flex items-center justify-between gap-2.5 py-1.5 text-sm text-muted">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={debt.paid}
                  disabled={pending}
                  onChange={() => toggleOne(debt)}
                  className={checkboxClass}
                />
                <span className={debt.paid ? "text-muted line-through" : "text-ink"}>
                  Buổi {shortDate(debt.date)}
                </span>
              </span>
              <span className={`num font-medium ${debt.paid ? "text-muted" : "text-ink"}`}>
                {formatVnd(debt.amount)}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
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
