"use client";
import { useState } from "react";
import Link from "next/link";
import { SessionList, type SessionRow } from "@/components/session-list";
import { BalanceTable } from "@/components/balance-table";
import type { BoardMember } from "@/lib/queries";

type Tab = "sessions" | "balances";

interface BoardTabsProps {
  boardId: string;
  shareUrl: string;
  members: BoardMember[];
  sessions: SessionRow[];
  balances: Record<string, number>;
}

export function BoardTabs({ boardId, shareUrl, members, sessions, balances }: BoardTabsProps) {
  const [tab, setTab] = useState<Tab>("sessions");
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${shareUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Sao chép link chia sẻ:", url);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-on-accent"
        >
          {copied ? "Đã sao chép" : "Chia sẻ"}
        </button>
        <Link
          href={`/b/${boardId}/thanh-vien`}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink"
        >
          Thành viên
        </Link>
        <Link
          href={`/b/${boardId}/import`}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink"
        >
          Nhập từ Excel
        </Link>
      </div>

      <div role="tablist" className="mb-4 flex gap-1 rounded-md bg-surface p-1 shadow-card">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "sessions"}
          onClick={() => setTab("sessions")}
          className={`flex-1 rounded-sm px-3 py-2 text-sm transition-colors ${
            tab === "sessions" ? "bg-accent text-on-accent" : "text-muted"
          }`}
        >
          Buổi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "balances"}
          onClick={() => setTab("balances")}
          className={`flex-1 rounded-sm px-3 py-2 text-sm transition-colors ${
            tab === "balances" ? "bg-accent text-on-accent" : "text-muted"
          }`}
        >
          Số dư
        </button>
      </div>

      {tab === "sessions" ? (
        <SessionList boardId={boardId} sessions={sessions} />
      ) : (
        <BalanceTable boardId={boardId} members={members} balances={balances} />
      )}
    </div>
  );
}
