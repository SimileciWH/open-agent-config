import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "@/stores/ui-store";
import { QuickPreferences } from "../quick-preferences";

describe("QuickPreferences", () => {
  beforeEach(() => {
    localStorage.setItem("hk-language", "system");
    useUIStore.getState().setMode("system");
  });

  afterEach(() => {
    localStorage.removeItem("hk-language");
    useUIStore.getState().setMode("system");
  });

  it("renders the six compact controls without duplicate translations", () => {
    render(<QuickPreferences />);

    expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "简中" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "繁中" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "auto" })).toBeInTheDocument();
    expect(screen.queryByText("English")).not.toBeInTheDocument();
    expect(screen.queryByText("Follow System")).not.toBeInTheDocument();
  });

  it("uses Auto to restore both language and appearance to system", async () => {
    const user = userEvent.setup();
    localStorage.setItem("hk-language", "en");
    useUIStore.getState().setMode("dark");
    render(<QuickPreferences />);

    await user.click(screen.getByRole("button", { name: "auto" }));

    expect(localStorage.getItem("hk-language")).toBe("system");
    expect(useUIStore.getState().mode).toBe("system");
    expect(screen.getByRole("button", { name: "auto" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
