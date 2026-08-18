import { beforeEach, describe, expect, it } from "vitest";
import {
  readMigratedStorage,
  removeMigratedStorage,
  writeMigratedStorage,
} from "../storage";

describe("storage migration", () => {
  beforeEach(() => localStorage.clear());

  it("moves a legacy value to the OAC key", () => {
    localStorage.setItem("legacy", "value");

    expect(readMigratedStorage("oac", "legacy")).toBe("value");
    expect(localStorage.getItem("oac")).toBe("value");
    expect(localStorage.getItem("legacy")).toBeNull();
  });

  it("keeps the current value when both generations exist", () => {
    localStorage.setItem("oac", "current");
    localStorage.setItem("legacy", "stale");

    expect(readMigratedStorage("oac", "legacy")).toBe("current");
    expect(localStorage.getItem("legacy")).toBeNull();
  });

  it("writes and removes both generations deterministically", () => {
    localStorage.setItem("legacy", "old");
    writeMigratedStorage("oac", "new", "legacy");
    expect(localStorage.getItem("oac")).toBe("new");
    expect(localStorage.getItem("legacy")).toBeNull();

    removeMigratedStorage("oac", "legacy");
    expect(localStorage.getItem("oac")).toBeNull();
  });
});
