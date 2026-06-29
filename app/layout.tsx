import type { Metadata } from "next";
import { Roboto, Caveat } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

// Font body + heading — Roboto: am, sach, than thien. Bold 700 cho heading.
const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap"
});

// Font viet tay cho chu ky ca nhan o footer.
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
  display: "swap"
});

// Script chong FOUC: dat class .dark tren <html> truoc khi React hydrate.
// App chua luu theme server -> chi doc localStorage 'theme', fallback prefers.
const themeInitScript = `
(function(){try{var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.dataset.theme=t;}catch(e){}})();
`;

export const metadata: Metadata = {
  title: "Chia Cầu — Chia tiền cầu lông",
  description:
    "Chia đều chi phí mỗi buổi cầu lông cho người có mặt và theo dõi số nợ cả nhóm."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${roboto.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />

        <div className="pointer-events-none fixed bottom-4 right-4 z-30 flex justify-end">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
      </body>
    </html>
  );
}
