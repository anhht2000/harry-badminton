import { describe, test, expect } from "vitest";
import { validateImage } from "./image";

describe("validateImage", () => {
  test("chấp nhận jpeg/png/webp/gif hợp lệ", () => {
    expect(validateImage("image/jpeg", 1024)).toEqual({ ok: true });
    expect(validateImage("image/png", 1024)).toEqual({ ok: true });
    expect(validateImage("image/webp", 1024)).toEqual({ ok: true });
    expect(validateImage("image/gif", 1024)).toEqual({ ok: true });
  });

  test("từ chối loại không hỗ trợ", () => {
    const r = validateImage("application/pdf", 1024);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/định dạng/i);
  });

  test("từ chối khi quá 8MB", () => {
    const r = validateImage("image/png", 8 * 1024 * 1024 + 1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/lớn/i);
  });

  test("chấp nhận đúng 8MB", () => {
    expect(validateImage("image/png", 8 * 1024 * 1024)).toEqual({ ok: true });
  });

  test("từ chối size <= 0", () => {
    expect(validateImage("image/png", 0).ok).toBe(false);
  });
});
