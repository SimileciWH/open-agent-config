import { clsx } from "clsx";
import {
  Check,
  Download,
  FolderOpen,
  FolderSearch,
  GitBranch,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ScanSearch,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { isAppUpdateEnabledForRuntime } from "@/lib/app-update-policy";
import { openDirectoryPicker } from "@/lib/dialog";
import { api } from "@/lib/invoke";
import { isDesktop } from "@/lib/transport";
import { agentDisplayName, type DiscoveredProject } from "@/lib/types";
import { useAgentStore } from "@/stores/agent-store";
import { useProjectStore } from "@/stores/project-store";
import { toast } from "@/stores/toast-store";
import type { AgentVisibility } from "@/stores/ui-store";
import { useUIStore } from "@/stores/ui-store";
import { useUpdateStore } from "@/stores/update-store";
import { useWebUpdateStore } from "@/stores/web-update-store";

const AGENT_VISIBILITY_OPTIONS: {
  value: AgentVisibility;
  labelKey: "agentPaths.visibilityAll" | "agentPaths.visibilityDetected";
}[] = [
  { value: "all", labelKey: "agentPaths.visibilityAll" },
  { value: "detected", labelKey: "agentPaths.visibilityDetected" },
];

function UpdateSection() {
  const { t } = useTranslation("settings");
  const available = useUpdateStore((s) => s.available);
  const checking = useUpdateStore((s) => s.checking);
  const installing = useUpdateStore((s) => s.installing);
  const checkForUpdate = useUpdateStore((s) => s.checkForUpdate);
  const promptUpdate = useUpdateStore((s) => s.promptUpdate);

  const handleCheck = async () => {
    await checkForUpdate();
    // Show toast if no update found (checked becomes true, available stays null)
    if (!useUpdateStore.getState().available) {
      toast.success(t("update.upToDate"));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">v{__APP_VERSION__}</span>
      {available ? (
        <button
          onClick={promptUpdate}
          disabled={installing}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {installing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Download size={12} />
          )}
          {installing
            ? t("update.updating")
            : t("update.updateTo", { version: available.version })}
        </button>
      ) : (
        <button
          onClick={handleCheck}
          disabled={checking}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            size={12}
            className={checking ? "origin-center animate-spin" : ""}
          />
          {checking ? t("update.checking") : t("update.checkForUpdates")}
        </button>
      )}
    </div>
  );
}

function WebUpdateSection() {
  const { t } = useTranslation("settings");
  const available = useWebUpdateStore((s) => s.available);
  const checking = useWebUpdateStore((s) => s.checking);
  const checkForUpdate = useWebUpdateStore((s) => s.checkForUpdate);
  const promptUpdate = useWebUpdateStore((s) => s.promptUpdate);

  const handleCheck = async () => {
    await checkForUpdate(true);
    if (!useWebUpdateStore.getState().available) {
      toast.success(t("update.upToDate"));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">v{__APP_VERSION__}</span>
      {available ? (
        <button
          onClick={promptUpdate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Download size={12} />
          {t("update.updateTo", { version: available.version })}
        </button>
      ) : (
        <button
          onClick={handleCheck}
          disabled={checking}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            size={12}
            className={checking ? "origin-center animate-spin" : ""}
          />
          {checking ? t("update.checking") : t("update.checkForUpdates")}
        </button>
      )}
    </div>
  );
}

function AppVersionSection() {
  const desktop = isDesktop();
  if (!isAppUpdateEnabledForRuntime(desktop)) {
    return (
      <span className="text-xs text-muted-foreground">v{__APP_VERSION__}</span>
    );
  }
  return desktop ? <UpdateSection /> : <WebUpdateSection />;
}

export default function SettingsPage() {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  const {
    agentVisibility,
    autoDisabledAgents,
    setAgentVisibility,
    setAutoDisabledAgents,
  } = useUIStore();
  const { projects, loading, loadProjects, addProject, removeProject } =
    useProjectStore();

  const {
    agents,
    fetch: fetchAgents,
    updatePath,
    setEnabled,
    setEnabledBulk,
  } = useAgentStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState("");
  const [adding, setAdding] = useState(false);
  const [projectPathInput, setProjectPathInput] = useState("");
  const [discoveredProjects, setDiscoveredProjects] = useState<
    DiscoveredProject[] | null
  >(null);
  const [discoveredSelected, setDiscoveredSelected] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    const scrollTo = searchParams.get("scrollTo");
    if (scrollTo) {
      const el = document.getElementById(scrollTo);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        searchParams.delete("scrollTo");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  const agentOrder = useAgentStore((s) => s.agentOrder);
  const agentNames = agentOrder;
  const agentMap = new Map(agents.map((a) => [a.name.toLowerCase(), a]));

  // Entering "Detected only" is handled by the App-level reconcile effect: it
  // disables undetected agents and records them in the snapshot (so it also
  // catches agents added by a later app update). Here we only restore that
  // snapshot on the way back to "All agents" — re-enabling exactly those, never
  // agents the user disabled by hand.
  const handleVisibilityChange = (next: AgentVisibility) => {
    if (next === agentVisibility) return;
    if (next === "all") {
      setEnabledBulk(autoDisabledAgents, true);
      setAutoDisabledAgents([]);
    }
    setAgentVisibility(next);
    toast.success(
      t("agentPaths.visibilityToast", {
        label: t(
          AGENT_VISIBILITY_OPTIONS.find((o) => o.value === next)?.labelKey ??
            "agentPaths.visibilityAll",
        ),
      }),
    );
  };

  const existingPaths = new Set(projects.map((p) => p.path));

  const showDiscoveredProjects = (results: DiscoveredProject[]) => {
    if (results.length === 0) {
      toast.error(t("projectPaths.toast.noProjectsFound"));
      return;
    }

    setDiscoveredProjects(results);
    setDiscoveredSelected(
      new Set(
        results
          .map((result) => result.path)
          .filter((item) => !existingPaths.has(item)),
      ),
    );
  };

  const discoverProjectsInPath = async (path: string) => {
    const results = await api.discoverProjects(path);
    showDiscoveredProjects(results);
  };

  const handleAddPath = async (path: string) => {
    if (!path) return;
    setAdding(true);
    try {
      await addProject(path);
      setDiscoveredProjects(null);
      setProjectPathInput("");
      toast.success(t("projectPaths.toast.projectAdded"));
    } catch {
      try {
        await discoverProjectsInPath(path);
      } catch (e) {
        console.error("Failed to discover projects:", e);
        toast.error(t("projectPaths.toast.failedDiscover"));
      }
    } finally {
      setAdding(false);
    }
  };

  const handleBrowseProject = async () => {
    const path = await openDirectoryPicker({
      title: t("projectPaths.selectDir"),
    });
    if (!path) return;

    setAdding(true);
    try {
      await discoverProjectsInPath(path);
    } catch (e) {
      console.error("Failed to discover projects:", e);
      toast.error(t("projectPaths.toast.failedDiscover"));
    } finally {
      setAdding(false);
    }
  };

  const handleAddDiscovered = async () => {
    setAdding(true);
    let added = 0;
    const failed: string[] = [];
    try {
      for (const path of discoveredSelected) {
        try {
          await addProject(path);
          added++;
        } catch {
          failed.push(path);
        }
      }
      if (added > 0)
        toast.success(t("projectPaths.toast.addedCount", { count: added }));
      if (failed.length > 0)
        toast.error(
          t("projectPaths.toast.failedAdd", {
            count: failed.length,
            paths: failed.join(", "),
          }),
        );
    } finally {
      setAdding(false);
      setDiscoveredProjects(null);
      setDiscoveredSelected(new Set());
    }
  };

  const toggleDiscovered = (path: string) => {
    setDiscoveredSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
              {tc("settingsLabel")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground select-none">
              {t("title")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          <AppVersionSection />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-8 pb-6 pt-7">
          {/* Agent Paths */}
          <section className="settings-section space-y-4">
            {/* Header: title + description, with visibility toggle top-right */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/70">
                    01
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("agentPaths.section")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("agentPaths.description")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/75">
                  {t("agentPaths.visibilityHint")}
                </p>
              </div>
              <div className="flex shrink-0 rounded-xl border border-border/80 bg-background/70 p-1">
                {AGENT_VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleVisibilityChange(opt.value)}
                    aria-pressed={agentVisibility === opt.value}
                    className={clsx(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
                      agentVisibility === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm divide-y divide-border/70">
              {agentNames.map((agent) => {
                const info = agentMap.get(agent);
                const isEnabled = info?.enabled ?? true;
                // In "Detected only" we auto-disable undetected agents, so lock
                // their toggle — switch to "All agents" to change them. Detected
                // agents stay toggleable: enabling/disabling them is the user's
                // call.
                const locked =
                  agentVisibility === "detected" && !(info?.detected ?? false);
                return (
                  <div
                    key={agent}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 transition-colors transition-opacity hover:bg-primary/[0.025]",
                      !isEnabled && "opacity-50",
                    )}
                  >
                    <button
                      type="button"
                      disabled={locked}
                      title={locked ? t("agentPaths.lockedHint") : undefined}
                      onClick={() => setEnabled(agent, !isEnabled)}
                      className={clsx(
                        "shrink-0 w-16 text-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                        isEnabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                        !locked &&
                          (isEnabled
                            ? "hover:bg-primary/20"
                            : "hover:bg-muted/80"),
                        locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {isEnabled
                        ? t("agentPaths.enabled")
                        : t("agentPaths.disabled")}
                    </button>
                    <span className="shrink-0 w-28 text-sm font-medium text-foreground">
                      {agentDisplayName(agent)}
                    </span>
                    <input
                      type="text"
                      readOnly={editingAgent !== agent}
                      disabled={!isEnabled}
                      value={
                        editingAgent === agent
                          ? editingPath
                          : (info?.path ?? "")
                      }
                      placeholder={t("agentPaths.notDetected")}
                      aria-label={t("agentPaths.configPath", { agent })}
                      onChange={(e) => setEditingPath(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.nativeEvent.isComposing &&
                          e.keyCode !== 229 &&
                          editingPath.trim()
                        ) {
                          updatePath(agent, editingPath.trim());
                          setEditingAgent(null);
                        }
                        if (e.key === "Escape") setEditingAgent(null);
                      }}
                      className={clsx(
                        "flex-1 rounded-md border border-border px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground truncate disabled:opacity-40",
                        editingAgent === agent
                          ? "bg-card ring-1 ring-ring"
                          : "bg-muted cursor-default",
                      )}
                    />
                    {editingAgent === agent ? (
                      <>
                        {isDesktop() && (
                          <button
                            type="button"
                            aria-label={t("agentPaths.browse", { agent })}
                            className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={async () => {
                              const path = await openDirectoryPicker({
                                title: t("agentPaths.selectDir", { agent }),
                              });
                              if (path) {
                                updatePath(agent, path);
                                setEditingAgent(null);
                              }
                            }}
                          >
                            <FolderSearch size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={t("agentPaths.cancel")}
                          className="shrink-0 rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setEditingAgent(null)}
                        >
                          <X size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={t("agentPaths.save")}
                          disabled={!editingPath.trim()}
                          className="shrink-0 rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                          onClick={() => {
                            updatePath(agent, editingPath.trim());
                            setEditingAgent(null);
                          }}
                        >
                          <Check size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={!isEnabled}
                        aria-label={t("agentPaths.edit", { agent })}
                        className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:pointer-events-none disabled:opacity-40"
                        onClick={() => {
                          setEditingAgent(agent);
                          setEditingPath(info?.path ?? "");
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Project Paths */}
          <section
            id="project-paths"
            className="settings-section space-y-5 border-t border-border/70 pt-8"
          >
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">
                  02
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("projectPaths.section")}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t("projectPaths.description")}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary/75">
                <GitBranch size={13} />
                {t("projectPaths.recursiveHint")}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/[0.045] p-3 shadow-sm sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder={
                  isDesktop()
                    ? t("projectPaths.placeholderDesktop")
                    : t("projectPaths.placeholderWeb")
                }
                value={projectPathInput}
                onChange={(e) => setProjectPathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.nativeEvent.isComposing &&
                    e.keyCode !== 229 &&
                    projectPathInput.trim()
                  )
                    handleAddPath(projectPathInput.trim());
                }}
                aria-label={t("projectPaths.inputAria")}
                className="min-w-0 flex-1 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-sm text-foreground shadow-inner placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              {isDesktop() && (
                <button
                  type="button"
                  disabled={adding}
                  onClick={handleBrowseProject}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
                  title={t("projectPaths.browse")}
                >
                  <FolderSearch size={16} />
                  <span className="sm:hidden lg:inline">
                    {t("projectPaths.browse")}
                  </span>
                </button>
              )}
              <button
                onClick={() => handleAddPath(projectPathInput.trim())}
                disabled={adding || !projectPathInput.trim()}
                aria-label={t("projectPaths.addAria")}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-[color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Plus size={12} />
                )}
                {t("projectPaths.add")}
              </button>
            </div>

            {/* Discovered projects (shown when user selected a non-project root dir) */}
            {discoveredProjects !== null && (
              <div className="space-y-4 rounded-2xl border border-sky-300/50 bg-sky-50/70 p-4 shadow-sm dark:border-sky-400/20 dark:bg-sky-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300">
                      <ScanSearch size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {t("projectPaths.discoveryTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("projectPaths.notProject", {
                          count: discoveredProjects.length,
                        })}
                      </p>
                    </div>
                  </div>
                  {discoveredProjects.length > 0 && (
                    <span className="shrink-0 rounded-full bg-sky-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">
                      {discoveredProjects.length} Git
                    </span>
                  )}
                </div>
                {discoveredProjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {t("projectPaths.noneFound")}
                  </p>
                ) : (
                  <>
                    <div className="max-h-64 space-y-1 overflow-y-auto overscroll-contain rounded-xl border border-sky-300/40 bg-card/75 p-1.5 dark:border-sky-400/15">
                      {discoveredProjects.map((dp) => {
                        const already = existingPaths.has(dp.path);
                        return (
                          <label
                            key={dp.path}
                            className={clsx(
                              "flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors",
                              already
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-muted",
                            )}
                          >
                            <input
                              type="checkbox"
                              disabled={already}
                              checked={discoveredSelected.has(dp.path)}
                              onChange={() => toggleDiscovered(dp.path)}
                              className="h-4 w-4 rounded border-border accent-primary"
                            />
                            <GitBranch
                              size={15}
                              className="shrink-0 text-primary/70"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-foreground">
                                {dp.name}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {dp.path}
                              </span>
                            </div>
                            {already && (
                              <span className="text-xs text-muted-foreground">
                                {t("projectPaths.addedBadge")}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {t("projectPaths.selectedCount", {
                          count: discoveredSelected.size,
                        })}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDiscoveredProjects(null)}
                          className="rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                        >
                          {t("projectPaths.cancel")}
                        </button>
                        <button
                          onClick={handleAddDiscovered}
                          disabled={discoveredSelected.size === 0 || adding}
                          className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {t("projectPaths.addSelected", {
                            count: discoveredSelected.size,
                          })}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Project list */}
            {loading ? (
              <p className="text-xs text-muted-foreground">
                {tc("status.loading")}
              </p>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.025] p-7">
                <h4 className="text-sm font-bold text-foreground">
                  {t("projectPaths.emptyTitle")}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("projectPaths.emptyDescription")}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={clsx(
                      "flex min-w-0 w-full items-start gap-3 rounded-2xl border bg-card px-4 py-3.5 text-sm shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md",
                      project.exists
                        ? "border-border/80"
                        : "border-amber-300/60 dark:border-amber-400/30",
                    )}
                  >
                    <FolderOpen
                      size={17}
                      className={clsx(
                        "mt-0.5 shrink-0",
                        project.exists
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={clsx(
                          "font-bold",
                          project.exists
                            ? "text-foreground"
                            : "text-muted-foreground line-through",
                        )}
                      >
                        {project.name}
                      </span>
                      {!project.exists && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                          <TriangleAlert size={10} />{" "}
                          {t("projectPaths.missing")}
                        </span>
                      )}
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {project.path}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeProject(project.id);
                        toast.success(t("projectPaths.toast.projectRemoved"));
                      }}
                      className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none"
                      aria-label={t("projectPaths.removeAria", {
                        name: project.name,
                      })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="border-t border-border pt-6 pb-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
            <span>HarnessKit</span>
            <span>&middot;</span>
            <span>{t("footer.tagline")}</span>
            <span>&middot;</span>
            <a
              href="https://github.com/RealZST/HarnessKit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              {t("footer.github")}
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
