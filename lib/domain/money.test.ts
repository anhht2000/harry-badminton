import { describe, test, expect } from "vitest";
import { roundTo1000, formatVnd } from "./money";

describe("roundTo1000", () => {
  test("làm tròn tới nghìn", () => {
    expect(roundTo1000(33333)).toBe(33000);
    expect(roundTo1000(33500)).toBe(34000);
    expect(roundTo1000(100000)).toBe(100000);
  });
});
describe("formatVnd", () => {
  test("định dạng VN có hậu tố đ", () => {
    expect(formatVnd(1234000)).toBe("1.234.000đ");
    expect(formatVnd(0)).toBe("0đ");
  });
});
