import { describe, expect, it } from "vitest";
import { privacyModeFromCookie } from "@/lib/privacy";

describe("privacyModeFromCookie", () => {
  it("enables privacy only for the persisted enabled value", () => {
    expect(privacyModeFromCookie("1")).toBe(true);
    expect(privacyModeFromCookie("0")).toBe(false);
    expect(privacyModeFromCookie(undefined)).toBe(false);
  });
});
