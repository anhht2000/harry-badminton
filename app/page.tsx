import { getCurrentUserId } from "@/lib/auth";
import { BoardList } from "@/components/board-list";
import { PublicBoardList } from "@/components/public-board-list";
import { CreateBoardForm } from "@/components/create-board-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  let userId: string | null = null;
  try {
    userId = await getCurrentUserId();
  } catch {
    userId = null;
  }

  if (!userId) {
    return <HomeHero />;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1.5">
        <p className="label-eyebrow">Bảng điều khiển</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Nhóm của bạn
        </h1>
        <p className="text-muted">
          Chọn một nhóm để xem chi tiết hoặc tạo nhóm mới để bắt đầu chia tiền.
        </p>
      </header>

      <section aria-label="Tạo nhóm mới">
        <CreateBoardForm />
      </section>

      <BoardList userId={userId} />
    </main>
  );
}

// Trang chu khi chua dang nhap: hero moi goi + 3 diem tinh nang.
function HomeHero() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-lg border border-line bg-surface bg-hero p-8 shadow-lg sm:p-12">
        <div className="flex max-w-2xl flex-col gap-5">
          <p className="label-eyebrow">Chia tiền cầu lông</p>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            Chia đều tiền cầu lông mỗi buổi, theo dõi nợ cả nhóm
          </h1>
          <p className="max-w-prose text-lg text-muted">
            Mỗi buổi cầu lông, tính tiền sân và tiền cầu rồi chia đều cho người
            có mặt. Ai trả trước, ai còn nợ — tất cả rõ ràng trong một bảng,
            miễn phí và không cần cài đặt.
          </p>
          <p className="text-sm text-muted">
            Đăng nhập với Google ở góc trên để tạo nhóm đầu tiên của bạn.
          </p>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent-soft blur-2xl"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Tính năng">
        <FeatureCard
          title="Chia đều theo buổi"
          desc="Tính tổng chi phí mỗi buổi rồi chia cho đúng người có mặt."
          icon={<SplitIcon />}
        />
        <FeatureCard
          title="Theo dõi số nợ"
          desc="Cộng dồn qua nhiều buổi, biết ngay ai đang nợ và nợ bao nhiêu."
          icon={<LedgerIcon />}
        />
        <FeatureCard
          title="Chia sẻ dễ dàng"
          desc="Gửi đường dẫn để cả nhóm cùng xem bảng số dư công khai."
          icon={<ShareIcon />}
        />
      </section>

      <section
        className="relative overflow-hidden rounded-lg border border-accent bg-accent-soft p-6 shadow-lg sm:p-8"
        aria-label="Tất cả nhóm"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent opacity-20 blur-3xl"
        />
        <header className="relative flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-on-accent shadow-card">
              <CommunityIcon />
            </span>
            <p className="label-eyebrow">Cộng đồng</p>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Tất cả nhóm
          </h2>
          <p className="max-w-prose text-muted">
            Xem bảng số dư công khai của các nhóm. Đăng nhập để tạo và quản lý
            nhóm của riêng bạn.
          </p>
        </header>
        <div className="relative mt-6">
          <PublicBoardList />
        </div>
      </section>

      <FaqSection />
    </main>
  );
}

// Cau hoi thuong gap: vua tot cho nguoi dung, vua sinh rich result FAQ tren Google.
const FAQ_ITEMS = [
  {
    q: "Chia Cầu là gì?",
    a: "Chia Cầu là công cụ web miễn phí giúp chia tiền cầu lông cho cả nhóm: tính tiền sân và tiền cầu mỗi buổi rồi chia đều cho người có mặt, đồng thời theo dõi ai trả trước, ai còn nợ."
  },
  {
    q: "Cách chia tiền cầu lông cho cả nhóm như thế nào?",
    a: "Bạn nhập tổng chi phí mỗi buổi (tiền sân, tiền cầu) và chọn những người có mặt. Chia Cầu tự chia đều cho từng người, cộng dồn qua nhiều buổi để biết chính xác số nợ của cả nhóm."
  },
  {
    q: "App chia tiền cầu lông này có miễn phí không?",
    a: "Có. Chia Cầu hoàn toàn miễn phí. Bạn chỉ cần đăng nhập bằng Google để tạo và quản lý nhóm của mình."
  },
  {
    q: "Có cần cài đặt ứng dụng không?",
    a: "Không. Chia Cầu chạy trực tiếp trên trình duyệt điện thoại hoặc máy tính, không cần tải hay cài đặt bất kỳ ứng dụng nào."
  },
  {
    q: "Làm sao chia sẻ bảng chi phí cho cả nhóm?",
    a: "Mỗi nhóm có một đường dẫn công khai. Bạn chỉ cần gửi link đó để cả nhóm cùng xem bảng số dư mà không cần đăng nhập."
  }
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a }
  }))
};

function FaqSection() {
  return (
    <section
      className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6 shadow-card sm:p-8"
      aria-label="Câu hỏi thường gặp"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <header className="flex flex-col gap-1.5">
        <p className="label-eyebrow">Câu hỏi thường gặp</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Chia tiền cầu lông — những điều bạn cần biết
        </h2>
      </header>
      <div className="flex flex-col divide-y divide-line">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
              {item.q}
              <span className="text-accent transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-3 text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  desc,
  icon
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="text-sm text-muted">{desc}</p>
    </div>
  );
}

function CommunityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 19v-1.5a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3V19" />
      <circle cx="9.5" cy="8" r="3" />
      <path d="M21 19v-1.5a3 3 0 0 0-2.25-2.9M16 5.1a3 3 0 0 1 0 5.8" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v18" />
      <circle cx="6" cy="8" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <path d="M6 10.5V16M18 10.5V16M4 19h4M16 19h4" />
    </svg>
  );
}

function LedgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" />
    </svg>
  );
}
