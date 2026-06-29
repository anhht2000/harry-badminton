import { describe, test, expect } from "vitest";
import { assertOwner } from "./guard";

describe("assertOwner", () => {
  test("throw khi board undefined", () => {
    expect(() => assertOwner(undefined, "u1")).toThrow("Không tìm thấy board");
  });

  test("throw khi khác owner", () => {
    expect(() => assertOwner({ ownerId: "u2" }, "u1")).toThrow("Không có quyền");
  });

  test("pass khi đúng owner", () => {
    expect(() => assertOwner({ ownerId: "u1" }, "u1")).not.toThrow();
  });
});
