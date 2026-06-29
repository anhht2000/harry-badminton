// Cau hinh SEO dung chung cho metadata, sitemap, robots, OG image.
// Doi domain qua env NEXT_PUBLIC_SITE_URL khi deploy; fallback la domain production.
// Dung || (khong dung ??) de fallback ca khi env la chuoi rong "" tren Vercel.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://badminton.harry-dev.click"
).replace(/\/$/, "");

export const SITE_NAME = "Chia Cầu";

export const SITE_TITLE = "Chia Cầu — App chia tiền cầu lông cho cả nhóm";

export const SITE_DESCRIPTION =
  "Chia Cầu giúp chia đều tiền sân, tiền cầu mỗi buổi cầu lông cho người có mặt, theo dõi ai trả trước, ai còn nợ và quản lý quỹ nhóm — miễn phí, không cần cài đặt.";

// Keyword tieng Viet nguoi choi cau long hay tim.
export const SITE_KEYWORDS = [
  "chia tiền cầu lông",
  "app chia tiền cầu lông",
  "tính tiền cầu lông",
  "chia tiền sân cầu lông",
  "chia tiền theo buổi",
  "quản lý quỹ nhóm cầu lông",
  "chia tiền thể thao",
  "tính tiền sân cầu lông theo buổi"
];
