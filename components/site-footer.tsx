import { ShuttlecockMark } from "@/components/brand-logo";

// Footer dùng chung: thương hiệu + chữ ký cá nhân (font viết tay Caveat).
// pb lớn để không bị nút ThemeToggle (floating góc dưới phải) che.
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pb-24 pt-12 sm:px-6">
      <div className="flex flex-col items-center gap-4 border-t border-line pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="inline-flex items-center gap-2 text-xs text-muted">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-accent">
            <ShuttlecockMark size={13} />
          </span>
          <span>© 2026 Chia Cầu — chia tiền cầu lông gọn nhẹ.</span>
        </p>

        <p className="inline-flex items-center gap-2 text-muted">
          <span className="text-xs">Thiết kế &amp; xây dựng bởi</span>
          <span className="signature text-2xl leading-none text-accent-2">
            Harry Hoang
          </span>
        </p>
      </div>
    </footer>
  );
}
