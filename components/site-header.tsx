import Link from "next/link";
import { auth } from "@/lib/auth";
import { AuthButtons } from "@/components/auth-buttons";

// Header dung chung: sticky, backdrop-blur, brand ben trai + auth ben phai.
// Goi auth() trong try/catch — loi DB coi nhu chua dang nhap, KHONG vo build.
export async function SiteHeader() {
  let user: { name?: string | null } | null = null;
  try {
    const session = await auth();
    user = session?.user ?? null;
  } catch {
    user = null;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Chia Tiền — về trang chủ"
          className="group inline-flex items-center gap-2.5 no-underline"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent transition-transform duration-[var(--dur-base)] ease-soft group-hover:-translate-y-0.5">
            <ShuttlecockMark />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Chia Tiền
          </span>
        </Link>

        <AuthButtons user={user} />
      </div>
    </header>
  );
}

// Mark cau long (shuttlecock) toi gian, dung currentColor (tong amber).
function ShuttlecockMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 21a3 3 0 0 0 3-3l.6-7.2L12 8l-3.6 2.8L9 18a3 3 0 0 0 3 3Z" />
      <path d="M9 18h6" />
      <path d="M12 8l1.5-4.5M12 8l-2-4M12 8l4 1M12 8l-4 1" />
    </svg>
  );
}
