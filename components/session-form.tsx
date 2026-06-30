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
import { MoneyInput } from "@/components/money-input";
import { LoadingOverlay } from "@/components/loading-overlay";
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
  full: boolean; // dong du: tu lay dung suat, khong nhap tay
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
  attendees: { memberId: string; count: number }[];
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
  // Map memberId -> so suat (count). Co trong map = co tham gia (count >= 1).
  const [attendees, setAttendees] = useState<Map<string, number>>(() =>
    initial ? new Map(initial.attendees.map((a) => [a.memberId, a.count])) : new Map()
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
  // Suat dung cua mot nguoi tinh tu du lieu ban dau (luc mo form sua) — de tu tick "Du".
  function initialShareOf(memberId: string): number {
    if (!initial) return 0;
    const total = initial.expenses.reduce((s, e) => s + e.amount, 0);
    const heads = initial.attendees.reduce((s, a) => s + Math.max(1, Math.floor(a.count)), 0);
    const att = initial.attendees.find((a) => a.memberId === memberId);
    if (!att || heads === 0 || total === 0) return 0;
    return Math.round((total / heads) * Math.max(1, Math.floor(att.count)));
  }

  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>(() =>
    initial && initial.payments.length > 0
      ? initial.payments.map((p) => ({
          key: nextKey(),
          memberId: p.memberId,
          amount: String(p.amount),
          // Da ung dung suat -> tick "Du" san.
          full: p.amount === initialShareOf(p.memberId)
        }))
      : [{ key: nextKey(), memberId: members[0]?.id ?? "", amount: "", full: false }]
  );

  const expensesTotal = useMemo(
    () => expenseRows.reduce((s, e) => s + toAmount(e.amount), 0),
    [expenseRows]
  );

  const totalHeads = useMemo(
    () => [...attendees.values()].reduce((s, n) => s + n, 0),
    [attendees]
  );

  // Dung suat cua mot nguoi (lam tron ve VND nguyen) — chi phu thuoc chi & so suat, khong phu thuoc tien ung.
  function shareOf(memberId: string): number {
    const count = attendees.get(memberId) ?? 0;
    if (count <= 0 || totalHeads === 0 || expensesTotal === 0) return 0;
    return Math.round((expensesTotal / totalHeads) * count);
  }
  function paymentAmount(row: PaymentRow): number {
    return row.full ? shareOf(row.memberId) : toAmount(row.amount);
  }

  const split = useMemo(() => {
    const expenses = expenseRows
      .map((e) => ({ amount: toAmount(e.amount) }))
      .filter((e) => e.amount > 0);
    const ids = [...attendees.keys()];
    const attendeeCounts = Object.fromEntries(attendees);
    const payments = paymentRows
      .map((p) => ({ memberId: p.memberId, amount: paymentAmount(p) }))
      .filter((p) => p.memberId && p.amount > 0);
    return splitSession({ expenses, attendeeIds: ids, attendeeCounts, payments });
  }, [expenseRows, attendees, paymentRows]);

  function toggleAttendee(id: string) {
    setAttendees((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, 1);
      return next;
    });
  }

  function changeCount(id: string, delta: number) {
    setAttendees((prev) => {
      const next = new Map(prev);
      const v = (next.get(id) ?? 0) + delta;
      if (v <= 0) next.delete(id);
      else next.set(id, Math.min(50, v));
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
      { key: nextKey(), memberId: members[0]?.id ?? "", amount: "", full: false }
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
      return [{ ...first, amount: String(expensesTotal), full: false }, ...rest];
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const expenses = expenseRows
      .map((row) => ({ label: row.label.trim(), amount: toAmount(row.amount) }))
      .filter((row) => row.amount > 0);
    const attendeeList = [...attendees].map(([memberId, count]) => ({ memberId, count }));
    const payments = paymentRows
      .map((row) => ({ memberId: row.memberId, amount: paymentAmount(row) }))
      .filter((row) => row.memberId && row.amount > 0);

    if (attendeeList.length === 0) {
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
          attendees: attendeeList,
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

  const fieldClass =
    "h-11 rounded-xl border border-line bg-surface px-3 text-ink outline-none transition-colors duration-[var(--dur-fast)] ease-soft placeholder:text-muted focus:border-accent disabled:opacity-60";
  const removeBtnClass =
    "grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors duration-[var(--dur-fast)] ease-soft hover:border-danger hover:text-danger";
  const checkboxClass =
    "h-4 w-4 shrink-0 rounded border-line text-accent accent-accent focus:ring-accent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <LoadingOverlay show={isPending || isDeleting} label={isDeleting ? "Đang xóa…" : "Đang lưu…"} />
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card">
        <p className="label-eyebrow">Ngày</p>
        <label htmlFor="session-date" className="sr-only">
          Ngày diễn ra buổi
        </label>
        <input
          id="session-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isPending}
          className={fieldClass}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="label-eyebrow">Người tham gia</p>
          <span className="num text-sm font-medium text-muted">
            {attendees.size}/{members.length} · {totalHeads} suất
          </span>
        </div>
        <p className="text-xs text-muted">
          Bấm tên để chọn. Người dẫn khách thì tăng số suất (×2, ×3…).
        </p>
        {members.length === 0 ? (
          <p className="text-sm text-muted">
            Chưa có thành viên nào trong nhóm.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const count = attendees.get(m.id);
              const on = count != null;
              if (!on) {
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={false}
                    onClick={() => toggleAttendee(m.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-[background-color,border-color,color] duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
                  >
                    {m.name}
                  </button>
                );
              }
              return (
                <span
                  key={m.id}
                  className="inline-flex items-center rounded-full border border-accent bg-accent text-on-accent"
                >
                  <button
                    type="button"
                    aria-pressed
                    onClick={() => toggleAttendee(m.id)}
                    className="inline-flex items-center gap-1.5 py-2 pl-3.5 pr-2 text-sm font-medium"
                  >
                    <CheckIcon />
                    {m.name}
                  </button>
                  <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-black/10 px-1 py-0.5">
                    <button
                      type="button"
                      aria-label={`Giảm suất ${m.name}`}
                      onClick={() => changeCount(m.id, -1)}
                      className="grid h-6 w-6 place-items-center rounded-full text-base font-bold leading-none hover:bg-black/15"
                    >
                      −
                    </button>
                    <span className="num min-w-[1.5rem] text-center text-sm font-bold">
                      ×{count}
                    </span>
                    <button
                      type="button"
                      aria-label={`Tăng suất ${m.name}`}
                      onClick={() => changeCount(m.id, 1)}
                      className="grid h-6 w-6 place-items-center rounded-full text-base font-bold leading-none hover:bg-black/15"
                    >
                      +
                    </button>
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="label-eyebrow">Khoản chi</p>
          <span className="num text-base font-bold text-money">
            {formatVnd(expensesTotal)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => addExpense(p)}
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent transition-transform duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5"
            >
              <PlusIcon />
              {p}
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
                className={`min-w-0 flex-1 ${fieldClass}`}
              />
              <MoneyInput
                value={row.amount}
                placeholder="Số tiền"
                aria-label="Số tiền khoản chi"
                onValueChange={(raw) => updateExpense(row.key, { amount: raw })}
                disabled={isPending}
                className={`num w-32 text-right ${fieldClass}`}
              />
              <button
                type="button"
                onClick={() => removeExpense(row.key)}
                aria-label="Xóa khoản chi"
                className={removeBtnClass}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => addExpense()}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-2 transition-colors duration-[var(--dur-fast)] ease-soft hover:text-accent"
        >
          <PlusIcon />
          Thêm khoản chi
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="label-eyebrow">Người ứng</p>
          <button
            type="button"
            onClick={fillFirstPayerWithTotal}
            disabled={expensesTotal === 0}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent transition-opacity duration-[var(--dur-fast)] ease-soft disabled:opacity-50"
          >
            Ứng toàn bộ
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {paymentRows.map((row) => (
            <li key={row.key} className="flex flex-wrap items-center gap-2">
              <select
                value={row.memberId}
                aria-label="Người ứng tiền"
                onChange={(e) =>
                  updatePayment(row.key, { memberId: e.target.value })
                }
                disabled={isPending || members.length === 0}
                className={`min-w-0 flex-1 ${fieldClass}`}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <label className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={row.full}
                  aria-label="Đóng đủ suất"
                  onChange={(e) => updatePayment(row.key, { full: e.target.checked })}
                  disabled={isPending}
                  className={checkboxClass}
                />
                Đủ
              </label>
              <MoneyInput
                value={row.full ? String(shareOf(row.memberId)) : row.amount}
                placeholder="Số tiền"
                aria-label="Số tiền ứng"
                onValueChange={(raw) => updatePayment(row.key, { amount: raw })}
                disabled={isPending || row.full}
                className={`num w-28 text-right ${fieldClass}`}
              />
              <button
                type="button"
                onClick={() => removePayment(row.key)}
                aria-label="Xóa người ứng"
                className={removeBtnClass}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addPayment}
          disabled={members.length === 0}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-2 transition-colors duration-[var(--dur-fast)] ease-soft hover:text-accent disabled:opacity-50"
        >
          <PlusIcon />
          Thêm người ứng
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card">
        <p className="label-eyebrow">Ghi chú</p>
        <label htmlFor="session-note" className="sr-only">
          Ghi chú
        </label>
        <input
          id="session-note"
          type="text"
          value={note}
          placeholder="Tùy chọn"
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
          className={fieldClass}
        />
      </section>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-hero p-5 shadow-card">
        <span className="flex flex-col gap-1">
          <span className="label-eyebrow">Mỗi suất</span>
          <span className="text-sm text-muted">
            {totalHeads} suất · {attendees.size} người
          </span>
        </span>
        <span className="num text-3xl font-bold text-money">
          {formatVnd(split.perHead)}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || isDeleting}
        className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-5 text-base font-semibold text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-60"
      >
        {isPending ? "Đang lưu…" : isEdit ? "Lưu thay đổi" : "Lưu buổi"}
      </button>

      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending || isDeleting}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-danger px-5 text-sm font-medium text-danger transition-colors duration-[var(--dur-fast)] ease-soft hover:bg-danger hover:text-surface disabled:opacity-60"
        >
          {isDeleting ? "Đang xóa…" : "Xóa buổi"}
        </button>
      )}
    </form>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}
