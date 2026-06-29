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
      <p className="rounded-md border border-line bg-surface px-4 py-8 text-center text-muted">
        Chưa có thành viên nào.
      </p>
    );
  }

  const rows = members
    .map((m) => ({ member: m, balance: balances[m.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance);

  return (
    <section>
      <h2 className="mb-4 text-base">Số dư</h2>
      <ul className="flex flex-col gap-2">
        {rows.map(({ member, balance }) => {
          const owes = balance > 0;
          const receives = balance < 0;
          const label = owes ? "còn nợ" : receives ? "được nhận" : "đã xong";
          const color = owes ? "text-danger" : receives ? "text-ok" : "text-muted";
          return (
            <li
              key={member.id}
              className="rounded-md border border-line bg-surface px-4 py-3 shadow-card"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-ink">{member.name}</span>
                <span className={`num font-semibold ${color}`}>
                  {formatVnd(Math.abs(balance))}
                  <span className="ml-1 text-xs font-normal">{label}</span>
                </span>
              </div>

              {owes && (
                <div className="mt-2">
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
                      className="rounded-md border border-line px-3 py-1.5 text-sm text-ink"
                    >
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
    <div className="flex flex-col gap-2 rounded-md border border-line bg-bg p-3">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Số tiền đã trả
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="num rounded-sm border border-line bg-surface px-3 py-2 text-ink"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Ngày trả
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-sm border border-line bg-surface px-3 py-2 text-ink"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-on-accent disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}
