import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = "Chia Cầu — App chia tiền cầu lông cho cả nhóm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OG image dong: nen kem, logo cau long amber, tieu de + slogan.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #fff5e7 0%, #fdf6ec 55%, #ffe9c9 100%)",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#ffb959",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="62" height="62" viewBox="0 0 32 32" fill="none" stroke="#3a2a12" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.6 20.1c0 3.1 1.7 5.8 4.4 5.8s4.4-2.7 4.4-5.8" />
              <path d="M11.6 20.1c1.5 1 7.3 1 8.8 0" />
              <path d="M11.6 20.1 6.8 7.1" />
              <path d="M20.4 20.1 25.2 7.1" />
              <path d="M6.8 7.1c4.5-2.4 13.9-2.4 18.4 0" />
              <path d="M16 20.5V5.6" />
              <path d="M13.7 20.2 11.2 6.4" />
              <path d="M18.3 20.2 20.8 6.4" />
            </svg>
          </div>
          <span style={{ fontSize: 44, fontWeight: 700, color: "#594750" }}>
            {SITE_NAME}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 76, fontWeight: 700, color: "#1e1e1e", lineHeight: 1.1 }}>
            Chia tiền cầu lông
          </span>
          <span style={{ fontSize: 38, color: "#606060", lineHeight: 1.35, maxWidth: 900 }}>
            Chia đều tiền sân, tiền cầu mỗi buổi cho người có mặt và theo dõi số nợ cả nhóm.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", padding: "10px 24px", borderRadius: 999, background: "#ffb959", color: "#3a2a12", fontSize: 30, fontWeight: 700 }}>
            Miễn phí · Không cần cài đặt
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
