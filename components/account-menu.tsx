"use client";

import { useEffect, useRef, useState } from "react";

// Menu tai khoan o header: hien ten + "Ma cua toi" (users.id) de copy di lien ket member,
// va nut dang xuat (server action truyen tu SiteHeader).
export function AccountMenu({
  name,
  accountId,
  signOutAction
}: {
  name: string | null;
  accountId: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Sao chép mã tài khoản:", accountId);
    }
  }

  const label = name?.trim() || "Tài khoản";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {label.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{label}</span>
        <ChevronIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 flex w-72 flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-lg"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">{label}</span>
            <span className="text-xs text-muted">Mã của tôi (gửi cho trưởng nhóm để liên kết)</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 p-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{accountId}</code>
            <button
              type="button"
              onClick={copyId}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-accent px-3 text-xs font-medium text-on-accent transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Đã chép" : "Chép"}
            </button>
          </div>

          <form action={signOutAction} className="border-t border-line pt-3">
            <button
              type="submit"
              className="inline-flex h-9 w-full items-center justify-center rounded-full border border-line bg-surface text-sm font-medium text-ink transition-colors duration-[var(--dur-fast)] ease-soft hover:border-danger hover:text-danger"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
