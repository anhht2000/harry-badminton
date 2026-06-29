import Link from "next/link";

export default function ShareNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
        <BrokenLinkIcon />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">
        Không tìm thấy bảng
      </h1>
      <p className="mt-2 max-w-prose text-muted">
        Đường dẫn chia sẻ không đúng hoặc đã bị thu hồi.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-accent px-5 font-medium text-on-accent no-underline shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2"
      >
        Về trang chủ
      </Link>
    </main>
  );
}

function BrokenLinkIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 3.5 8.5M8 12h3M2 2l20 20" />
    </svg>
  );
}
