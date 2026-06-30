"use client";

// Overlay loading toan man, hien NGAY khi bam (vd dang luu/xoa/import) -> khong cho man dong cung.
export function LoadingOverlay({ show, label = "Đang lưu…" }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 shadow-card">
        <Spinner />
        <span className="text-sm font-medium text-ink">{label}</span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
