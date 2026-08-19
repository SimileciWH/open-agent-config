import { create } from "zustand";
import i18n from "@/lib/i18n";
import { api } from "@/lib/invoke";
import type { Project } from "@/lib/types";
import { useExtensionStore } from "./extension-store";
import { useScopeStore } from "./scope-store";
import { toast } from "./toast-store";

interface ProjectState {
  projects: Project[];
  loading: boolean;
  loaded: boolean;

  loadProjects: () => Promise<void>;
  addProjects: (paths: string[]) => Promise<{
    added: Project[];
    failed: Array<{ path: string; error: unknown }>;
  }>;
  removeProject: (id: string) => Promise<void>;
}

async function refreshExtensions() {
  try {
    await api.scanAndSync();
  } catch (e) {
    console.error("Failed to scan after changing projects:", e);
  }
  await useExtensionStore.getState().fetch();
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  loaded: false,

  async loadProjects() {
    set({ loading: true });
    try {
      const projects = await api.listProjects();
      set({ projects, loading: false, loaded: true });
    } catch (e) {
      console.error("Failed to load projects:", e);
      set({ loading: false, loaded: true });
    }
  },

  async addProjects(paths: string[]) {
    const added: Project[] = [];
    const failed: Array<{ path: string; error: unknown }> = [];
    for (const path of paths) {
      try {
        added.push(await api.addProject(path));
      } catch (error) {
        failed.push({ path, error });
      }
    }

    if (added.length > 0) {
      set((state) => {
        const byId = new Map(
          state.projects.map((project) => [project.id, project]),
        );
        for (const project of added) byId.set(project.id, project);
        return { projects: [...byId.values()] };
      });
      await refreshExtensions();
    }
    return { added, failed };
  },

  async removeProject(id: string) {
    const project = get().projects.find((p) => p.id === id);
    await api.removeProject(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    if (project) {
      const scope = useScopeStore.getState().current;
      if (scope.type === "project" && scope.path === project.path) {
        useScopeStore.getState().setScope({ type: "global" });
        toast.warning(
          i18n.t("projects:toast.projectRemovedSwitched", {
            name: project.name,
          }),
        );
      }
    }
    // Backend cascades the project's extension rows on delete, so refresh
    // the in-memory list to drop the now-stale entries (web mode has no
    // event channel for this; see addProject above).
    await useExtensionStore.getState().fetch();
  },
}));
