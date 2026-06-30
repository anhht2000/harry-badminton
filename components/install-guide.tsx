"use client";
import { SITE_NAME } from "@/lib/site";

// Su kien Chrome/Edge/Android bo sung de cai PWA bang 1 cham.
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface InstallGuideProps {
  installed: boolean;
  canInstall: boolean;
  isIos: boolean;
  onInstall: () => void;
}

export function InstallGuide({ installed, canInstall, isIos, onInstall }: InstallGuideProps) {
  if (installed) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface px-6 py-12 text-center shadow-card">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ok/[0.12] text-ok">
          <CheckIcon />
        </span>
        <h2 className="font-display text-base font-semibold text-ink">
          Đã cài {SITE_NAME} trên máy
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Bạn đang mở app từ màn hình chính. Mở nhanh từ icon app, không cần gõ link.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <DownloadIcon />
          </span>
          <div className="flex flex-col">
            <h2 className="font-display text-base font-semibold text-ink">
              Cài {SITE_NAME} về máy
            </h2>
            <p className="text-sm text-muted">Mở nhanh từ màn hình chính, chạy toàn màn hình như app.</p>
          </div>
        </div>

        {canInstall && (
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-base font-semibold text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2"
          >
            <DownloadIcon />
            Cài đặt ngay
          </button>
        )}
      </div>

      <Steps
        title="iPhone / iPad (Safari)"
        steps={[
          "Mở trang này bằng trình duyệt Safari.",
          "Bấm nút Chia sẻ (ô vuông có mũi tên hướng lên) ở thanh dưới.",
          "Chọn Thêm vào MH chính (Add to Home Screen).",
          "Bấm Thêm — icon app sẽ xuất hiện ở màn hình chính."
        ]}
        highlight={isIos}
      />

      <Steps
        title="Android (Chrome)"
        steps={[
          "Mở trang này bằng trình duyệt Chrome.",
          canInstall
            ? "Bấm nút Cài đặt ngay ở trên."
            : "Bấm menu ⋮ ở góc trên bên phải.",
          "Chọn Cài đặt ứng dụng hoặc Thêm vào MH chính.",
          "Xác nhận — app sẽ xuất hiện ở màn hình chính."
        ]}
        highlight={!isIos}
      />
    </section>
  );
}

function Steps({ title, steps, highlight }: { title: string; steps: string[]; highlight: boolean }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-surface p-5 shadow-card ${
        highlight ? "border-accent" : "border-line"
      }`}
    >
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      <ol className="flex flex-col gap-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-muted">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
