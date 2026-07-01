import { describe, test, expect } from "vitest";
import { nextVisitScore, VISIT_HALF_LIFE_DAYS } from "./board-rank";

describe("nextVisitScore", () => {
  const base = new Date("2026-01-01T00:00:00Z");

  test("lan vao dau tien tu score 0 = 1", () => {
    expect(nextVisitScore(0, base, base)).toBeCloseTo(1, 5);
  });

  test("vao lai ngay lap tuc cong don gan +1", () => {
    expect(nextVisitScore(1, base, base)).toBeCloseTo(2, 5);
  });

  test("sau 1 half-life, phan diem cu giam con nua roi +1", () => {
    const later = new Date(base.getTime() + VISIT_HALF_LIFE_DAYS * 86_400_000);
    // 4 * 0.5 + 1 = 3
    expect(nextVisitScore(4, base, later)).toBeCloseTo(3, 5);
  });

  test("khong am neu prevAt o tuong lai (clamp days >= 0)", () => {
    const earlier = new Date(base.getTime() - 86_400_000);
    expect(nextVisitScore(2, base, earlier)).toBeCloseTo(3, 5);
  });
});
