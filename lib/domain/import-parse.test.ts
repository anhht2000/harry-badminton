import { describe, test, expect } from "vitest";
import { parseRows } from "./import-parse";

describe("parseRows", () => {
  test("2 dòng cùng ngày -> 1 buổi 2 khoản", () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "200000", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" },
      { ngày: "2026-06-20", khoản: "Cầu", "số tiền": "120000", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" }
    ]);
    expect(r.errors).toEqual([]);
    expect(r.sessions).toHaveLength(1);
    expect(r.sessions[0].date).toBe("2026-06-20");
    expect(r.sessions[0].expenses).toEqual([
      { label: "Sân", amount: 200000 },
      { label: "Cầu", amount: 120000 }
    ]);
    expect(r.sessions[0].attendeeNames).toEqual(["Tuấn", "Nam"]);
    expect(r.sessions[0].payments).toEqual([{ memberName: "Tuấn", amount: 320000 }]);
  });

  test("dòng thiếu số tiền -> 1 error đúng row index", () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "200000", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" },
      { ngày: "2026-06-20", khoản: "Cầu", "số tiền": "", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" }
    ]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].row).toBe(2);
    expect(r.sessions).toHaveLength(1);
    expect(r.sessions[0].expenses).toEqual([{ label: "Sân", amount: 200000 }]);
  });

  test('tiền "200.000đ" -> 200000', () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "200.000đ", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" }
    ]);
    expect(r.errors).toEqual([]);
    expect(r.sessions[0].expenses[0].amount).toBe(200000);
  });

  test("ngày sai định dạng -> error", () => {
    const r = parseRows([
      { ngày: "20/06/2026", khoản: "Sân", "số tiền": "200000", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" }
    ]);
    expect(r.sessions).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].row).toBe(1);
  });

  test("người ứng không có trong tham gia -> vẫn thêm vào members + attendees", () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "200000", "người ứng": "Long", "người tham gia": "Tuấn, Nam" }
    ]);
    expect(r.errors).toEqual([]);
    expect(r.members).toContain("Long");
    expect(r.sessions[0].attendeeNames).toContain("Long");
    expect(r.sessions[0].payments).toEqual([{ memberName: "Long", amount: 200000 }]);
  });

  test("2 ngày khác nhau -> 2 buổi", () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "200000", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" },
      { ngày: "2026-06-21", khoản: "Sân", "số tiền": "180000", "người ứng": "Nam", "người tham gia": "Tuấn, Nam" }
    ]);
    expect(r.errors).toEqual([]);
    expect(r.sessions).toHaveLength(2);
    expect(r.sessions.map((s) => s.date)).toEqual(["2026-06-20", "2026-06-21"]);
  });

  test("members là danh sách tên duy nhất gộp toàn bộ buổi", () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "200000", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" },
      { ngày: "2026-06-21", khoản: "Sân", "số tiền": "180000", "người ứng": "Hùng", "người tham gia": "Tuấn, Hùng" }
    ]);
    expect(r.members.sort()).toEqual(["Hùng", "Nam", "Tuấn"]);
  });

  test("số tiền không nguyên dương -> error", () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "0", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" },
      { ngày: "2026-06-20", khoản: "Cầu", "số tiền": "-50000", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" }
    ]);
    expect(r.sessions).toHaveLength(0);
    expect(r.errors).toHaveLength(2);
    expect(r.errors.map((e) => e.row)).toEqual([1, 2]);
  });

  test("thiếu người tham gia -> error", () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "200000", "người ứng": "Tuấn", "người tham gia": "" }
    ]);
    expect(r.sessions).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
  });

  test("payment cùng người ứng qua nhiều khoản được gộp", () => {
    const r = parseRows([
      { ngày: "2026-06-20", khoản: "Sân", "số tiền": "200000", "người ứng": "Tuấn", "người tham gia": "Tuấn, Nam" },
      { ngày: "2026-06-20", khoản: "Cầu", "số tiền": "120000", "người ứng": "Nam", "người tham gia": "Tuấn, Nam" }
    ]);
    expect(r.errors).toEqual([]);
    expect(r.sessions[0].payments).toEqual([
      { memberName: "Tuấn", amount: 200000 },
      { memberName: "Nam", amount: 120000 }
    ]);
  });
});
