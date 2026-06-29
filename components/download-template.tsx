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
        className="rounded-md border border-line bg-surface px-4 py-2 text-ink"
      >
        Tải file mẫu (CSV)
      </a>
      <button
        type="button"
        onClick={handleDownloadExcel}
        className="rounded-md border border-line bg-surface px-4 py-2 text-ink"
      >
        Tải file mẫu (Excel)
      </button>
    </div>
  );
}
