"use client";

import * as XLSX from "xlsx";

const sampleRows = [
  {
    "ngày": "2026-06-20",
    "khoản": "Sân",
    "số tiền": 200000,
    "người ứng": "Tuấn",
    "người tham gia": "Tuấn, Nam, Hùng",
  },
  {
    "ngày": "2026-06-20",
    "khoản": "Cầu",
    "số tiền": 120000,
    "người ứng": "Tuấn",
    "người tham gia": "Tuấn, Nam, Hùng",
  },
];

export function DownloadTemplate() {
  function handleDownloadExcel() {
    const sheet = XLSX.utils.json_to_sheet(sampleRows, {
      header: ["ngày", "khoản", "số tiền", "người ứng", "người tham gia"],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Mẫu");
    XLSX.writeFile(workbook, "mau-nhap-lieu.xlsx");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="/templates/mau-nhap-lieu.csv"
        download="mau-nhap-lieu.csv"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink no-underline shadow-card transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
      >
        <DownloadIcon />
        Tải file mẫu (CSV)
      </a>
      <button
        type="button"
        onClick={handleDownloadExcel}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink shadow-card transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
      >
        <DownloadIcon />
        Tải file mẫu (Excel)
      </button>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
