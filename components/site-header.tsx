import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { AuthButtons } from "@/components/auth-buttons";
import { AccountMenu } from "@/components/account-menu";
import { ShuttlecockMark } from "@/components/brand-logo";

// Header dung chung: sticky, backdrop-blur, brand ben trai + auth ben phai.
// Goi auth() trong try/catch — loi DB coi nhu chua dang nhap, KHONG vo build.
export async function SiteHeader() {
  let user: { id?: string | null; name?: string | null } | null = null;
  try {
    const session = await auth();
    user = session?.user ?? null;
  } catch {
    user = null;
  }

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Chia Cầu — về trang chủ"
          className="group inline-flex items-center gap-2.5 no-underline"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent shadow-card transition-transform duration-[var(--dur-base)] ease-soft group-hover:-translate-y-0.5">
            <ShuttlecockMark />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Chia Cầu
          </span>
        </Link>

        {user?.id ? (
          <AccountMenu name={user.name ?? null} accountId={user.id} signOutAction={doSignOut} />
        ) : (
          <AuthButtons user={null} />
        )}
      </div>
    </header>
  );
}
