export function roundTo1000(n: number): number {
  return Math.round(n / 1000) * 1000;
}
export function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}
