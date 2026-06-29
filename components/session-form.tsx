"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSession,
  updateSession,
  deleteSession
} from "@/lib/actions/sessions";
import { splitSession } from "@/lib/domain/split";
import { formatVnd } from "@/lib/domain/money";
import type { BoardMember } from "@/lib/queries";

interface ExpenseRow {
  key: string;
  label: string;
  amount: string;
}
interface PaymentRow {
  key: string;
  memberId: string;
  amount: string;
}

const PRESETS = ["Sân", "Cầu", "Nước"];

let counter = 0;
function nextKey(): string {
  counter += 1;
  return `r${counter}`;
}

function todayLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function toAmount(raw: string): number {
  const n = Number(raw.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export interface SessionFormInitial {
  date: string;
  note: string;
  attendeeIds: string[];
  expenses: { label: string; amount: number }[];
  payments: { memberId: string; amount: number }[];
}

export function SessionForm({
  boardId,
  members,
  sessionId,
  initial
}: {
  boardId: string;
  members: BoardMember[];
  sessionId?: string;
  initial?: SessionFormInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(sessionId);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(() => initial?.date ?? todayLocal());
  const [note, setNote] = useState(() => initial?.note ?? "");
  const [attendeeIds, setAttendeeIds] = useState<Set<string>>(() =>
    initial ? new Set(initial.attendeeIds) : new Set(members.map((m) => m.id))
  );
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>(() =>
    initial && initial.expenses.length > 0
      ? initial.expenses.map((e) => ({
          key: nextKey(),
          label: e.label,
          amount: String(e.amount)
        }))
      : [{ key: nextKey(), label: "", amount: "" }]
  );
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>(() =>
    initial && initial.payments.length > 0
      ? initial.payments.map((p) => ({
          key: nextKey(),
          memberId: p.memberId,
          amount: String(p.amount)
        }))
      : [{ key: nextKey(), memberId: members[0]?.id ?? "", amount: "" }]
  );

  const expensesTotal = useMemo(
    () => expenseRows.reduce((s, e) => s + toAmount(e.amount), 0),
    [expenseRows]
  );

  const split = useMemo(() => {
    const expenses = expenseRows
      .map((e) => ({ amount: toAmount(e.amount) }))
      .filter((e) => e.amount > 0);
    const ids = [...attendeeIds];
    const payments = paymentRows
      .map((p) => ({ memberId: p.memberId, amount: toAmount(p.amount) }))
      .filter((p) => p.memberId && p.amount > 0);
    return splitSession({ expenses, attendeeIds: ids, payments });
  }, [expenseRows, attendeeIds, paymentRows]);

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addExpense(label = "") {
    setExpenseRows((prev) => [...prev, { key: nextKey(), label, amount: "" }]);
  }
  function updateExpense(key: string, patch: Partial<ExpenseRow>) {
    setExpenseRows((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...patch } : e))
    );
  }
  function removeExpense(key: string) {
    setExpenseRows((prev) => prev.filter((e) => e.key !== key));
  }

  function addPayment() {
    setPaymentRows((prev) => [
      ...prev,
      { key: nextKey(), memberId: members[0]?.id ?? "", amount: "" }
    ]);
  }
  function updatePayment(key: string, patch: Partial<PaymentRow>) {
    setPaymentRows((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p))
    );
  }
  function removePayment(key: string) {
    setPaymentRows((prev) => prev.filter((p) => p.key !== key));
  }

  function fillFirstPayerWithTotal() {
    setPaymentRows((prev) => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      return [{ ...first, amount: String(expensesTotal) }, ...rest];
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const expenses = expenseRows
      .map((row) => ({ label: row.label.trim(), amount: toAmount(row.amount) }))
      .filter((row) => row.amount > 0);
    const ids = [...attendeeIds];
    const payments = paymentRows
      .map((row) => ({ memberId: row.memberId, amount: toAmount(row.amount) }))
      .filter((row) => row.memberId && row.amount > 0);

    if (ids.length === 0) {
      setError("Cần tick ít nhất 1 người tham gia");
      return;
    }
    if (expenses.length === 0) {
      setError("Cần ít nhất 1 khoản chi có số tiền");
      return;
    }
    if (expenses.some((row) => !row.label)) {
      setError("Mỗi khoản chi cần có nội dung");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          date,
          note: note.trim() || undefined,
          attendeeIds: ids,
          expenses,
          payments
        };
        if (sessionId) {
          await updateSession(sessionId, payload);
        } else {
          await createSession(boardId, payload);
        }
        router.push(`/b/${boardId}`);
      } catch {
        setError("Không lưu được buổi, thử lại sau");
      }
    });
  }

  function handleDelete() {
    if (!sessionId) return;
    if (!window.confirm("Xóa buổi này? Hành động không thể hoàn tác.")) return;

    setError(null);
    startDelete(async () => {
      try {
        await deleteSession(sessionId);
        router.push(`/b/${boardId}`);
      } catch {
        setError("Không xóa được buổi, thử lại sau");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <label htmlFor="session-date" className="text-sm font-semibold">
          Ngày
        </label>
        <input
          id="session-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink disabled:opacity-60"
        />
      </section>

      <section className="flex flex-col gap-2">
        <span className="text-sm font-semibold">
          Người có mặt
          <span className="ml-2 font-normal text-muted">
            {attendeeIds.size}/{members.length}
          </span>
        </span>
        {members.length === 0 ? (
          <p className="text-sm text-muted">
            Chưa có thành viên nào trong nhóm.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const on = attendeeIds.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAttendee(m.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    on
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line bg-surface text-muted"
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Khoản chi</span>
          <span className="num text-sm text-money">{formatVnd(expensesTotal)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => addExpense(p)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-accent-2"
            >
              + {p}
            </button>
          ))}
        </div>

        <ul className="flex flex-col gap-2">
          {expenseRows.map((row) => (
            <li key={row.key} className="flex gap-2">
              <input
                type="text"
                value={row.label}
                placeholder="Nội dung"
                aria-label="Nội dung khoản chi"
                onChange={(e) => updateExpense(row.key, { label: e.target.value })}
                disabled={isPending}
                className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted disabled:opacity-60"
              />
              <input
                type="text"
                inputMode="numeric"
                value={row.amount}
                placeholder="Số tiền"
                aria-label="Số tiền khoản chi"
                onChange={(e) =>
                  updateExpense(row.key, {
                    amount: e.target.value.replace(/\D/g, "")
                  })
                }
                disabled={isPending}
                className="num w-32 rounded-md border border-line bg-surface px-3 py-2 text-right text-ink placeholder:text-muted disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => removeExpense(row.key)}
                aria-label="Xóa khoản chi"
                className="rounded-md border border-line bg-surface px-3 text-muted"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => addExpense()}
          className="self-start text-sm text-accent-2"
        >
          + Thêm khoản chi
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Người ứng tiền</span>
          <button
            type="button"
            onClick={fillFirstPayerWithTotal}
            disabled={expensesTotal === 0}
            className="text-sm text-accent-2 disabled:opacity-50"
          >
            Ứng toàn bộ
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {paymentRows.map((row) => (
            <li key={row.key} className="flex gap-2">
              <select
                value={row.memberId}
                aria-label="Người ứng tiền"
                onChange={(e) =>
                  updatePayment(row.key, { memberId: e.target.value })
                }
                disabled={isPending || members.length === 0}
                className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-ink disabled:opacity-60"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                value={row.amount}
                placeholder="Số tiền"
                aria-label="Số tiền ứng"
                onChange={(e) =>
                  updatePayment(row.key, {
                    amount: e.target.value.replace(/\D/g, "")
                  })
                }
                disabled={isPending}
                className="num w-32 rounded-md border border-line bg-surface px-3 py-2 text-right text-ink placeholder:text-muted disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => removePayment(row.key)}
                aria-label="Xóa người ứng"
                className="rounded-md border border-line bg-surface px-3 text-muted"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addPayment}
          disabled={members.length === 0}
          className="self-start text-sm text-accent-2 disabled:opacity-50"
        >
          + Thêm người ứng
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="session-note" className="text-sm font-semibold">
          Ghi chú
        </label>
        <input
          id="session-note"
          type="text"
          value={note}
          placeholder="Tùy chọn"
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted disabled:opacity-60"
        />
      </section>

      <div className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3 shadow-card">
        <span className="text-sm text-muted">Mỗi người</span>
        <span className="num text-lg font-bold text-money">
          {formatVnd(split.perHead)}
        </span>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={isPending || isDeleting}
        className="rounded-md bg-accent px-4 py-3 text-base font-semibold text-on-accent disabled:opacity-60"
      >
        {isPending ? "Đang lưu…" : isEdit ? "Lưu thay đổi" : "Lưu buổi"}
      </button>

      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending || isDeleting}
          className="rounded-md border border-danger px-4 py-3 text-base font-semibold text-danger disabled:opacity-60"
        >
          {isDeleting ? "Đang xóa…" : "Xóa buổi"}
        </button>
      )}
    </form>
  );
}
