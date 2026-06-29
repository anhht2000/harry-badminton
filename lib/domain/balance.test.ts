import { describe, test, expect } from "vitest";
import { computeBalances } from "./split";

describe("computeBalances", () => {
  test("cộng dồn nhiều buổi", () => {
    const sessions = [
      { expenses: [{ amount: 300000 }], attendeeIds: ["a", "b", "c"], payments: [{ memberId: "a", amount: 300000 }] },
      { expenses: [{ amount: 200000 }], attendeeIds: ["a", "b"], payments: [{ memberId: "b", amount: 200000 }] }
    ];
    const bal = computeBalances(sessions, []);
    // buổi1: a -200k, b +100k, c +100k ; buổi2: a +100k, b -100k
    expect(bal.a).toBe(-100000);
    expect(bal.b).toBe(0);
    expect(bal.c).toBe(100000);
  });

  test("settlement giảm nợ", () => {
    const sessions = [
      { expenses: [{ amount: 300000 }], attendeeIds: ["a", "b", "c"], payments: [{ memberId: "a", amount: 300000 }] }
    ];
    const bal = computeBalances(sessions, [{ memberId: "c", amount: 100000 }]);
    expect(bal.c).toBe(0);        // c đã trả 100k
    expect(bal.a).toBe(-200000);
  });
});
