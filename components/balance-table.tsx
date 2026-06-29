"use client";
import { useState, useTransition } from "react";
import { formatVnd } from "@/lib/domain/money";
import { addSettlement } from "@/lib/actions/settlements";
import type { BoardMember } from "@/lib/queries";

interface BalanceTableProps {
  boardId: string;
  members: BoardMember[];
  balances: Record<string, number>;
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function BalanceTable({ boardId, members, balances }: BalanceTableProps) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

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
    .map((m) => ({ member: m, balance: balances[m.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-ink">Số dư</h2>
      <ul className="flex flex-col gap-3">
        {rows.map(({ member, balance }) => {
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

              {owes && (
                <div className="mt-3">
                  {openMemberId === member.id ? (
                    <SettlementForm
                      boardId={boardId}
                      memberId={member.id}
                      defaultAmount={balance}
                      onClose={() => setOpenMemberId(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenMemberId(member.id)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-[border-color,color] duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
                    >
                      <CheckIcon />
                      Đánh dấu đã trả
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
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

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SettlementForm({
  boardId,
  memberId,
  defaultAmount,
  onClose
}: {
  boardId: string;
  memberId: string;
  defaultAmount: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(defaultAmount));
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError("Số tiền phải là số nguyên dương");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await addSettlement(boardId, memberId, value, date);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2 p-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
        Số tiền đã trả
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="num h-11 rounded-xl border border-line bg-surface px-3 text-ink outline-none transition-colors duration-[var(--dur-fast)] ease-soft focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
        Ngày trả
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-xl border border-line bg-surface px-3 text-ink outline-none transition-colors duration-[var(--dur-fast)] ease-soft focus:border-accent"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-5 text-sm font-medium text-ink transition-[border-color,color] duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent disabled:opacity-60"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}
