"use client";
import { useState } from "react";
import Link from "next/link";
import { SessionList, type SessionRow } from "@/components/session-list";
import { BalanceTable } from "@/components/balance-table";
import { AlbumGallery } from "@/components/album-gallery";
import type { BoardMember, MemberSessionDebt, BoardPhoto } from "@/lib/queries";

type Tab = "sessions" | "balances" | "photos";

interface BoardTabsProps {
  boardId: string;
  shareUrl: string;
  members: BoardMember[];
  sessions: SessionRow[];
  balances: Record<string, number>;
  sessionDebts: Record<string, MemberSessionDebt[]>;
  photos: BoardPhoto[];
  canManageBooks: boolean;
  canManageMembers: boolean;
}

export function BoardTabs({ boardId, shareUrl, members, sessions, balances, sessionDebts, photos, canManageBooks, canManageMembers }: BoardTabsProps) {
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

  const secondaryClass =
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink no-underline shadow-card transition-[transform,border-color,color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:border-accent hover:text-accent";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {canManageMembers && (
          <Link href={`/b/${boardId}/thanh-vien`} className={secondaryClass}>
            <UsersIcon />
            Thành viên
          </Link>
        )}
        {canManageBooks && (
          <Link href={`/b/${boardId}/import`} className={secondaryClass}>
            <SheetIcon />
            Nhập Excel
          </Link>
        )}
        <button type="button" onClick={handleShare} className={secondaryClass}>
          {copied ? <CheckIcon /> : <ShareIcon />}
          {copied ? "Đã sao chép" : "Chia sẻ"}
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Chế độ xem"
        className="flex gap-1 rounded-full bg-accent-soft p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "sessions"}
          onClick={() => setTab("sessions")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-[var(--dur-fast)] ease-soft ${
            tab === "sessions"
              ? "bg-accent text-on-accent shadow-card"
              : "text-accent-2 hover:text-accent"
          }`}
        >
          Buổi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "balances"}
          onClick={() => setTab("balances")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-[var(--dur-fast)] ease-soft ${
            tab === "balances"
              ? "bg-accent text-on-accent shadow-card"
              : "text-accent-2 hover:text-accent"
          }`}
        >
          Số dư
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "photos"}
          onClick={() => setTab("photos")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-[var(--dur-fast)] ease-soft ${
            tab === "photos"
              ? "bg-accent text-on-accent shadow-card"
              : "text-accent-2 hover:text-accent"
          }`}
        >
          Ảnh
        </button>
      </div>

      {tab === "sessions" ? (
        <SessionList boardId={boardId} sessions={sessions} canManage={canManageBooks} />
      ) : tab === "balances" ? (
        <BalanceTable
          boardId={boardId}
          members={members}
          balances={balances}
          sessionDebts={sessionDebts}
          canManage={canManageBooks}
        />
      ) : (
        <AlbumGallery boardId={boardId} photos={photos} canDelete={canManageBooks} />
      )}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 19v-1.5a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3V19" />
      <circle cx="9.5" cy="8" r="3" />
      <path d="M21 19v-1.5a3 3 0 0 0-2.25-2.9M16 5.1a3 3 0 0 1 0 5.8" />
    </svg>
  );
}

function SheetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 9h16M4 15h16M10 3v18" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" />
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
