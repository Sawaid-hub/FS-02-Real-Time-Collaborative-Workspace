import { describe, expect, it } from "vitest";
import { canComment, canEdit, canView } from "./roles";

describe("roles", () => {
  it("viewers can view only", () => {
    expect(canView("VIEW")).toBe(true);
    expect(canComment("VIEW")).toBe(false);
    expect(canEdit("VIEW")).toBe(false);
  });

  it("commenters can comment but not edit", () => {
    expect(canView("COMMENT")).toBe(true);
    expect(canComment("COMMENT")).toBe(true);
    expect(canEdit("COMMENT")).toBe(false);
  });

  it("editors can do all three", () => {
    expect(canView("EDIT")).toBe(true);
    expect(canComment("EDIT")).toBe(true);
    expect(canEdit("EDIT")).toBe(true);
  });

  it("missing role has no access", () => {
    expect(canView(null)).toBe(false);
    expect(canComment(undefined)).toBe(false);
    expect(canEdit(null)).toBe(false);
  });
});
