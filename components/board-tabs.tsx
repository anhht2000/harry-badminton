"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SessionList, type SessionRow } from "@/components/session-list";
import { BalanceTable } from "@/components/balance-table";
import { OverviewSummary } from "@/components/overview-summary";
import { AlbumGallery } from "@/components/album-gallery";
import { InstallGuide, type InstallPromptEvent } from "@/components/install-guide";
import type { BoardMember, MemberSessionDebt, BoardPhoto } from "@/lib/queries";

type Tab = "overview" | "sessions" | "balances" | "photos" | "install";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Tổng kết" },
  { key: "sessions", label: "Buổi" },
  { key: "balances", label: "Số dư" },
  { key: "photos", label: "Ảnh" },
  { key: "install", label: "Cài app" }
];

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
  // Quan ly so (truong nhom/thu ky): uu tien tab Buoi len dau. Member: giu Tong ket dau.
  const orderedTabs = canManageBooks
    ? [...TABS.filter((t) => t.key === "sessions"), ...TABS.filter((t) => t.key !== "sessions")]
    : TABS;
  const [tab, setTab] = useState<Tab>(canManageBooks ? "sessions" : "overview");
  const [copied, setCopied] = useState(false);

  // Bat su kien cai PWA som (truoc khi mo tab) de nut "Cai dat ngay" khong bi lo.
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

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
        {orderedTabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-sm transition-[background-color,color,box-shadow] duration-[var(--dur-fast)] ease-soft ${
              tab === key
                ? "bg-accent font-bold text-on-accent shadow-card"
                : "font-medium text-accent-2 hover:text-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <OverviewSummary boardId={boardId} members={members} balances={balances} />
      ) : tab === "sessions" ? (
        <SessionList boardId={boardId} sessions={sessions} canManage={canManageBooks} />
      ) : tab === "balances" ? (
        <BalanceTable
          boardId={boardId}
          members={members}
          balances={balances}
          sessionDebts={sessionDebts}
          canManage={canManageBooks}
        />
      ) : tab === "photos" ? (
        <AlbumGallery boardId={boardId} photos={photos} canDelete={canManageBooks} />
      ) : (
        <InstallGuide
          installed={installed}
          canInstall={installEvent !== null}
          isIos={isIos}
          onInstall={handleInstall}
        />
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
