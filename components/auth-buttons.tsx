import { signIn, signOut } from "@/lib/auth";

// Nhan user tu SiteHeader (da goi auth() trong try/catch) de tranh goi DB 2 lan
// va de loi DB khong lam vo header. user null = chua dang nhap / loi -> nut Google.
export function AuthButtons({ user }: { user: { name?: string | null } | null }) {
  if (!user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink shadow-card transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
        >
          <GoogleIcon />
          <span className="hidden sm:inline">Đăng nhập với Google</span>
          <span className="sm:hidden">Đăng nhập</span>
        </button>
      </form>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
      className="flex items-center gap-3"
    >
      {user.name && (
        <span className="hidden max-w-[10rem] truncate text-sm text-muted sm:inline">
          {user.name}
        </span>
      )}
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
      >
        Đăng xuất
      </button>
    </form>
  );
}

// Logo Google da mau bang SVG inline (giu mau thuong hieu, khong currentColor).
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.48h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.77z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.12A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.25a7.2 7.2 0 0 1 0-4.5V6.63H1.27a12 12 0 0 0 0 10.74l4-3.12z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.27 6.63l4 3.12C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}
