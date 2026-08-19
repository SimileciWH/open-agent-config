import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentDetail, AgentInfo } from "@/lib/types";
import { useAgentConfigStore } from "@/stores/agent-config-store";
import { useAgentStore } from "@/stores/agent-store";
import { useUIStore } from "@/stores/ui-store";
import { AgentList } from "../agent-list";

const capabilities = {
  project_install: { skill: true, mcp: true, hook: false, cli: true },
  hooks_supported: false,
  global_hook_install: false,
};

const details: AgentDetail[] = [
  {
    name: "claude",
    detected: true,
    config_files: [],
    extension_counts: { skill: 0, mcp: 0, hook: 0, plugin: 0, cli: 0 },
  },
  {
    name: "kimi",
    detected: false,
    config_files: [],
    extension_counts: { skill: 0, mcp: 0, hook: 0, plugin: 0, cli: 0 },
  },
];

const agents: AgentInfo[] = [
  {
    name: "claude",
    detected: true,
    extension_count: 0,
    path: "/home/.claude",
    enabled: true,
    capabilities,
  },
  {
    name: "kimi",
    detected: false,
    extension_count: 0,
    path: "/home/.kimi-code",
    enabled: false,
    capabilities,
  },
];

beforeEach(() => {
  useUIStore.setState({ agentVisibility: "all" });
  useAgentConfigStore.setState({
    agentDetails: details,
    selectedAgent: "claude",
  });
  useAgentStore.setState({
    agents,
    agentOrder: ["claude", "kimi"],
  });
});

describe("AgentList controls", () => {
  it("keeps an undetected agent selectable in All mode", async () => {
    const user = userEvent.setup();
    render(<AgentList />);

    const selectButton = screen.getByText("Kimi Code").closest("button");
    expect(selectButton).not.toBeNull();
    if (!selectButton) throw new Error("Kimi selection button was not found");
    await user.click(selectButton);
    expect(useAgentConfigStore.getState().selectedAgent).toBe("kimi");
  });

  it("Detected is a visual filter and does not mutate enablement", async () => {
    const user = userEvent.setup();
    const setEnabled = vi.fn().mockResolvedValue(undefined);
    useAgentStore.setState({ setEnabled });
    render(<AgentList />);

    await user.click(screen.getByRole("button", { name: "Detected" }));
    expect(screen.queryByText("Kimi Code")).not.toBeInTheDocument();
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it("changes enablement only through the per-agent switch", async () => {
    const user = userEvent.setup();
    const setEnabled = vi.fn().mockResolvedValue(undefined);
    useAgentStore.setState({ setEnabled });
    render(<AgentList />);

    await user.click(screen.getByRole("switch", { name: "Enable Kimi Code" }));
    expect(setEnabled).toHaveBeenCalledWith("kimi", true);
  });
});
