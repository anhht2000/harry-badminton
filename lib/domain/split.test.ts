import { describe, test, expect } from "vitest";
import { splitSession } from "./split";

describe("splitSession", () => {
  test("chia đều khít", () => {
    const r = splitSession({
      expenses: [{ amount: 200000 }, { amount: 100000 }],
      attendeeIds: ["a", "b", "c"],
      payments: [{ memberId: "a", amount: 300000 }]
    });
    expect(r.total).toBe(300000);
    expect(r.perHead).toBe(100000);
    expect(r.shares).toEqual({ a: 100000, b: 100000, c: 100000 });
    expect(r.net).toEqual({ a: -200000, b: 100000, c: 100000 });
    expect(Object.values(r.net).reduce((s, x) => s + x, 0)).toBe(0);
  });

  test("chia lẻ không làm tròn -> mỗi suất bằng nhau, không có người gánh dư", () => {
    const r = splitSession({
      expenses: [{ amount: 100000 }],
      attendeeIds: ["a", "b", "c"],
      payments: [{ memberId: "a", amount: 100000 }]
    });
    expect(r.perHead).toBeCloseTo(100000 / 3, 6);
    expect(r.shares.a).toBeCloseTo(100000 / 3, 6);
    expect(r.shares.b).toBeCloseTo(100000 / 3, 6);
    expect(r.shares.c).toBeCloseTo(100000 / 3, 6);
    expect(Object.values(r.shares).reduce((s, x) => s + x, 0)).toBeCloseTo(100000, 6);
    expect(r.net.a).toBeCloseTo(100000 / 3 - 100000, 6);
    expect(Object.values(r.net).reduce((s, x) => s + x, 0)).toBeCloseTo(0, 6);
  });

  test("người ứng không có mặt -> lẻ dồn attendee đầu", () => {
    const r = splitSession({
      expenses: [{ amount: 100000 }],
      attendeeIds: ["b", "c"],
      payments: [{ memberId: "a", amount: 100000 }]
    });
    expect(r.shares.b).toBe(50000);
    expect(r.shares.c).toBe(50000);
    expect(r.net.a).toBe(-100000);
  });

  test("người đi kèm: A x2 tính 2 suất", () => {
    const r = splitSession({
      expenses: [{ amount: 300000 }],
      attendeeIds: ["a", "b"],
      attendeeCounts: { a: 2, b: 1 }, // tổng 3 suất
      payments: [{ memberId: "a", amount: 300000 }]
    });
    expect(r.perHead).toBe(100000);
    expect(r.shares).toEqual({ a: 200000, b: 100000 });
    expect(r.net).toEqual({ a: 200000 - 300000, b: 100000 });
    expect(Object.values(r.net).reduce((s, x) => s + x, 0)).toBe(0);
  });

  test("không có người tham gia -> perHead 0, không chia", () => {
    const r = splitSession({ expenses: [{ amount: 100000 }], attendeeIds: [], payments: [] });
    expect(r.perHead).toBe(0);
    expect(r.shares).toEqual({});
  });
});
