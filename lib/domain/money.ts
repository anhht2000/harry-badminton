export function roundTo1000(n: number): number {
  return Math.round(n / 1000) * 1000;
}
export function formatVnd(n: number): string {
  // Tinh toan noi bo van chinh xac (khong lam tron); chi lam tron khi HIEN THI -> bo phan thap phan.
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + "đ";
}
