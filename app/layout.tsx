import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// Font body + heading — Roboto: am, sach, than thien. Bold 700 cho heading.
const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap"
});

// Script chong FOUC: dat class .dark tren <html> truoc khi React hydrate.
// App chua luu theme server -> chi doc localStorage 'theme', fallback prefers.
const themeInitScript = `
(function(){try{var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.dataset.theme=t;}catch(e){}})();
`;

export const metadata: Metadata = {
  title: "Chia Tiền Thể Thao",
  description: "Chia đều chi phí mỗi buổi và theo dõi số nợ"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={roboto.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <SiteHeader />
        {children}

        <div className="pointer-events-none fixed bottom-4 right-4 z-30 flex justify-end">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
      </body>
    </html>
  );
}
