import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { ToastContainer } from "@/components/shared/toast-container";
import { useProjectStore } from "@/stores/project-store";
import { useScopeStore } from "@/stores/scope-store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const INTERACTIVE = "a, button, input, select, textarea, [role='button']";
// A mousedown/dblclick on these must not drive the window: interactive
// controls, the scrollable content (<main>), the nav rail, and overlay dialogs
// (which can render outside <main>, e.g. the update dialog — without this they'd
// be undraggable-window chrome where text can't be selected).
const NO_WINDOW_GESTURE = `${INTERACTIVE}, main, nav, [role='dialog']`;

export function AppShell() {
  const mainRef = useRef<HTMLElement>(null);
  useLocation();
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const projects = useProjectStore((s) => s.projects);
  const projectsLoaded = useProjectStore((s) => s.loaded);
  const scopeHydrated = useScopeStore((s) => s.hydrated);
  const scope = useScopeStore((s) => s.current);

  // Effect 1: load projects on first mount if not already loaded
  useEffect(() => {
    if (
      useProjectStore.getState().projects.length === 0 &&
      !useProjectStore.getState().loading
    ) {
      useProjectStore.getState().loadProjects();
    }
  }, []);

  // Effect 2: hydrate scope-store once after projects load
  useEffect(() => {
    if (!projectsLoaded || scopeHydrated) return;
    const urlScope = searchParams.get("scope");
    useScopeStore.getState().hydrate(urlScope, projects);
  }, [projectsLoaded, projects, searchParams, scopeHydrated]);

  // Effect 3: keep URL in sync with store (covers programmatic setScope from
  // stores that can't use the useScope hook, e.g. project-store.removeProject
  // in Task 10). Without this, the URL would drift stale after such calls.
  useEffect(() => {
    if (!scopeHydrated) return;
    const expected =
      scope.type === "global"
        ? null
        : scope.type === "all"
          ? "all"
          : scope.path;
    const current = searchParams.get("scope");
    if (current === expected) return;
    const params = new URLSearchParams(searchParams);
    if (expected == null) params.delete("scope");
    else params.set("scope", expected);
    setSearchParams(params, { replace: true });
  }, [scope, scopeHydrated, searchParams, setSearchParams]);

  // Window dragging — anywhere outside <main> and interactive elements
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest(NO_WINDOW_GESTURE)) return;
      e.preventDefault();
      getCurrentWindow().startDragging();
    };

    const onDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(NO_WINDOW_GESTURE)) return;
      getCurrentWindow().toggleMaximize();
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("dblclick", onDblClick);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("dblclick", onDblClick);
    };
  }, []);

  return (
    <div className="workspace-shell h-screen overflow-hidden text-foreground">
      <div className="flex h-full min-h-0 bg-background/95">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <main
            ref={mainRef}
            className="m-3 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-[0_10px_40px_color-mix(in_oklch,var(--primary)_7%,transparent)] sm:p-7"
          >
            <div className="page-enter flex min-h-0 flex-1 flex-col">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
