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

  test("lẻ dồn vào người ứng", () => {
    const r = splitSession({
      expenses: [{ amount: 100000 }],
      attendeeIds: ["a", "b", "c"],
      payments: [{ memberId: "a", amount: 100000 }]
    });
    expect(r.perHead).toBe(33000);
    // 100000 - 33000*3 = 1000 dồn vào a
    expect(r.shares).toEqual({ a: 34000, b: 33000, c: 33000 });
    expect(Object.values(r.shares).reduce((s, x) => s + x, 0)).toBe(100000);
    expect(r.net.a).toBe(34000 - 100000);
    expect(Object.values(r.net).reduce((s, x) => s + x, 0)).toBe(0);
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

  test("không có người tham gia -> perHead 0, không chia", () => {
    const r = splitSession({ expenses: [{ amount: 100000 }], attendeeIds: [], payments: [] });
    expect(r.perHead).toBe(0);
    expect(r.shares).toEqual({});
  });
});
