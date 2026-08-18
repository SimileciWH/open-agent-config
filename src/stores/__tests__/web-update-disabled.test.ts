import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebUpdateStore } from "../web-update-store";

describe("disabled web app update channel", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useWebUpdateStore.setState({
      available: null,
      checking: false,
      showDialog: false,
      dismissed: false,
    });
  });

  it("does not contact a release service", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await useWebUpdateStore.getState().checkForUpdate(true);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(useWebUpdateStore.getState().available).toBeNull();
    expect(useWebUpdateStore.getState().checking).toBe(false);
    vi.unstubAllGlobals();
  });
});
