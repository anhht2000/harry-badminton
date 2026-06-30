"use client";
import { useEffect, useOptimistic, useRef, useTransition } from "react";
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

export function shortDate(iso: string): string {
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
          const rounded = Math.round(balance);
          const owes = rounded > 0;
          const receives = rounded < 0;
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
                    {formatVnd(Math.abs(rounded))}
                  </span>
                  <span className={`text-xs font-medium ${color}`}>{label}</span>
                </span>
              </div>

              {debts.length > 0 && canManage && (
                <SessionChecklist boardId={boardId} memberId={member.id} debts={debts} canManage={canManage} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SessionChecklist({
  boardId,
  memberId,
  debts,
  canManage = true
}: {
  boardId: string;
  memberId: string;
  debts: MemberSessionDebt[];
  canManage?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const allRef = useRef<HTMLInputElement>(null);

  // State doi NGAY khi click (optimistic), server reconcile sau -> khong cho round-trip.
  const [optimisticDebts, applyOptimistic] = useOptimistic(
    debts,
    (state, action: { settled: boolean; sessionId?: string }) =>
      state.map((d) =>
        Math.round(d.net) > 0 && (action.sessionId === undefined || d.sessionId === action.sessionId)
          ? { ...d, settled: action.settled }
          : d
      )
  );

  // Chi buoi con no (net>0) moi danh dau tra; buoi da du / duoc nhan chi hien lich su.
  // Lam tron de bo phan le sub-1d (vd no 0,33d) -> coi nhu da du, tranh "con no 0d".
  const debtRows = optimisticDebts.filter((d) => Math.round(d.net) > 0);
  const allPaid = debtRows.length > 0 && debtRows.every((d) => d.settled);
  const somePaid = debtRows.some((d) => d.settled);

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = somePaid && !allPaid;
  }, [somePaid, allPaid]);

  function toggleAll() {
    if (allPaid) {
      if (!window.confirm("Bỏ đánh dấu tất cả các buổi đã trả? Số tiền sẽ tính nợ lại."))
        return;
      startTransition(async () => {
        applyOptimistic({ settled: false });
        await unmarkAllSessionsPaid(boardId, memberId);
      });
    } else {
      startTransition(async () => {
        applyOptimistic({ settled: true });
        await markAllSessionsPaid(boardId, memberId);
      });
    }
  }

  function toggleOne(debt: MemberSessionDebt) {
    if (debt.settled) {
      if (
        !window.confirm(
          `Bỏ đánh dấu đã trả buổi ${shortDate(debt.date)}? Số tiền sẽ tính nợ lại.`
        )
      )
        return;
      startTransition(async () => {
        applyOptimistic({ settled: false, sessionId: debt.sessionId });
        await unmarkSessionPaid(boardId, memberId, debt.sessionId);
      });
    } else {
      startTransition(async () => {
        applyOptimistic({ settled: true, sessionId: debt.sessionId });
        await markSessionPaid(boardId, memberId, debt.sessionId);
      });
    }
  }

  const checkboxClass =
    "h-4 w-4 shrink-0 rounded border-line text-accent accent-accent focus:ring-accent";

  return (
    <div className="mt-3 flex flex-col gap-1 rounded-xl border border-line bg-surface-2 p-3">
      {canManage && debtRows.length > 0 && (
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
      )}
      <ul className="flex flex-col">
        {optimisticDebts.map((debt) => {
          const net = Math.round(debt.net);
          const owes = net > 0;
          return (
            <li key={debt.sessionId}>
              <label className="flex items-center justify-between gap-2.5 py-1.5 text-sm">
                <span className="flex items-center gap-2.5">
                  {owes ? (
                    <input
                      type="checkbox"
                      checked={debt.settled}
                      disabled={pending || !canManage}
                      onChange={() => toggleOne(debt)}
                      className={checkboxClass}
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="flex flex-col">
                    <span className={debt.settled ? "text-muted line-through decoration-2" : "text-ink"}>
                      Buổi {shortDate(debt.date)}
                    </span>
                    {debt.paidAmount > 0 && (
                      <span className="text-xs text-muted">đã đóng {formatVnd(debt.paidAmount)}</span>
                    )}
                  </span>
                </span>
                <span className="num font-medium">
                  {debt.settled ? (
                    <span className="text-muted line-through decoration-2">
                      còn nợ {formatVnd(net)}
                    </span>
                  ) : owes ? (
                    <span className="text-danger">còn nợ {formatVnd(net)}</span>
                  ) : net < 0 ? (
                    <span className="text-ok">được nhận {formatVnd(-net)}</span>
                  ) : (
                    <span className="text-muted line-through decoration-2">đã đủ</span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
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
