import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { openDirectoryPicker } from "@/lib/dialog";
import { api } from "@/lib/invoke";
import { isDesktop } from "@/lib/transport";
import type { Project } from "@/lib/types";
import { useProjectStore } from "@/stores/project-store";
import { useScopeStore } from "@/stores/scope-store";
import { AddProjectDialog, ManageProjectsDialog } from "../project-dialogs";

vi.mock("@/lib/dialog", () => ({
  openDirectoryPicker: vi.fn(),
}));

vi.mock("@/lib/transport", () => ({
  isDesktop: vi.fn(() => false),
}));

vi.mock("@/lib/invoke", () => ({
  api: {
    discoverProjects: vi.fn(),
    selectProjectDirectory: vi.fn(),
  },
}));

const existingProject: Project = {
  id: "existing",
  name: "existing",
  path: "/workspace/existing",
  created_at: "",
  exists: true,
};

beforeEach(() => {
  useScopeStore.setState({ current: { type: "global" }, hydrated: true });
  useProjectStore.setState({
    projects: [existingProject],
    loading: false,
    loaded: true,
  });
  vi.clearAllMocks();
  vi.mocked(isDesktop).mockReturnValue(false);
});

describe("AddProjectDialog", () => {
  it("opens the host folder picker in Web mode and scans the selected path", async () => {
    const user = userEvent.setup();
    vi.mocked(api.selectProjectDirectory).mockResolvedValue("/workspace");
    vi.mocked(api.discoverProjects).mockResolvedValue([
      { name: "alpha", path: "/workspace/alpha" },
    ]);

    render(<AddProjectDialog onClose={vi.fn()} />);
    await user.click(
      screen.getByRole("button", { name: /Choose workspace folder/ }),
    );

    expect(api.selectProjectDirectory).toHaveBeenCalledOnce();
    expect(openDirectoryPicker).not.toHaveBeenCalled();
    expect(api.discoverProjects).toHaveBeenCalledWith("/workspace");
    expect(await screen.findByRole("textbox")).toHaveValue("/workspace");
  });

  it("keeps the Tauri picker path for desktop builds", async () => {
    const user = userEvent.setup();
    vi.mocked(isDesktop).mockReturnValue(true);
    vi.mocked(openDirectoryPicker).mockResolvedValue("/workspace");
    vi.mocked(api.discoverProjects).mockResolvedValue([
      { name: "alpha", path: "/workspace/alpha" },
    ]);

    render(<AddProjectDialog onClose={vi.fn()} />);
    await user.click(
      screen.getByRole("button", { name: /Choose workspace folder/ }),
    );

    expect(openDirectoryPicker).toHaveBeenCalledOnce();
    expect(api.selectProjectDirectory).not.toHaveBeenCalled();
    expect(api.discoverProjects).toHaveBeenCalledWith("/workspace");
  });

  it("scans first, disables existing projects, and switches to one added project", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const addedProject: Project = {
      id: "alpha",
      name: "alpha",
      path: "/workspace/alpha",
      created_at: "",
      exists: true,
    };
    vi.mocked(api.discoverProjects).mockResolvedValue([
      { name: "alpha", path: addedProject.path },
      { name: "existing", path: existingProject.path },
    ]);
    const addProjects = vi.fn().mockResolvedValue({
      added: [addedProject],
      failed: [],
    });
    useProjectStore.setState({ addProjects });

    render(<AddProjectDialog onClose={onClose} />);
    await user.type(screen.getByRole("textbox"), "/workspace");
    await user.click(screen.getByRole("button", { name: "Scan" }));

    expect(api.discoverProjects).toHaveBeenCalledWith("/workspace");
    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add selected (1)" }));
    expect(addProjects).toHaveBeenCalledWith([addedProject.path]);
    expect(useScopeStore.getState().current).toEqual({
      type: "project",
      name: "alpha",
      path: addedProject.path,
    });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ManageProjectsDialog", () => {
  it("requires an inline confirmation before removing a project", async () => {
    const user = userEvent.setup();
    const removeProject = vi.fn().mockResolvedValue(undefined);
    useProjectStore.setState({ removeProject });

    render(<ManageProjectsDialog onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Remove existing" }));
    expect(removeProject).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(removeProject).toHaveBeenCalledWith(existingProject.id);
  });
});
