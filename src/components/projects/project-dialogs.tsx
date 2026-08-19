import { clsx } from "clsx";
import {
  AlertTriangle,
  Check,
  FolderGit2,
  FolderSearch,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/modal";
import { openDirectoryPicker } from "@/lib/dialog";
import { humanizeError } from "@/lib/errors";
import { api } from "@/lib/invoke";
import { isDesktop } from "@/lib/transport";
import type { DiscoveredProject } from "@/lib/types";
import { useProjectStore } from "@/stores/project-store";
import { useScopeStore } from "@/stores/scope-store";
import { toast } from "@/stores/toast-store";

interface DialogProps {
  onClose(): void;
}

export function AddProjectDialog({ onClose }: DialogProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");
  const projects = useProjectStore((s) => s.projects);
  const addProjects = useProjectStore((s) => s.addProjects);
  const [path, setPath] = useState("");
  const [candidates, setCandidates] = useState<DiscoveredProject[] | null>(
    null,
  );
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingPaths = useMemo(
    () => new Set(projects.map((project) => project.path)),
    [projects],
  );
  const availablePaths = useMemo(
    () =>
      candidates
        ?.map((candidate) => candidate.path)
        .filter((candidatePath) => !existingPaths.has(candidatePath)) ?? [],
    [candidates, existingPaths],
  );
  const allAvailableSelected =
    availablePaths.length > 0 &&
    availablePaths.every((candidatePath) => selectedPaths.has(candidatePath));

  async function loadCandidates(inputPath: string) {
    const trimmed = inputPath.trim();
    const results = await api.discoverProjects(trimmed);
    setPath(trimmed);
    setCandidates(results);
    setSelectedPaths(
      new Set(
        results
          .map((result) => result.path)
          .filter((resultPath) => !existingPaths.has(resultPath)),
      ),
    );
    if (results.length === 0) setError(t("add.noneFound"));
  }

  function showDiscoveryError(cause: unknown) {
    setCandidates(null);
    setSelectedPaths(new Set());
    setError(humanizeError(cause));
  }

  async function discover(inputPath: string) {
    const trimmed = inputPath.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await loadCandidates(trimmed);
    } catch (cause) {
      showDiscoveryError(cause);
    } finally {
      setBusy(false);
    }
  }

  async function chooseFolder() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const selected = isDesktop()
        ? await openDirectoryPicker({ title: t("add.chooseTitle") })
        : await api.selectProjectDirectory();
      if (!selected) return;
      await loadCandidates(selected);
    } catch (cause) {
      showDiscoveryError(cause);
    } finally {
      setBusy(false);
    }
  }

  function toggleCandidate(candidatePath: string) {
    if (existingPaths.has(candidatePath)) return;
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(candidatePath)) next.delete(candidatePath);
      else next.add(candidatePath);
      return next;
    });
  }

  function toggleAllAvailable() {
    setSelectedPaths(
      allAvailableSelected ? new Set() : new Set(availablePaths),
    );
  }

  async function addSelected() {
    if (selectedPaths.size === 0 || busy) return;
    const orderedPaths =
      candidates
        ?.map((candidate) => candidate.path)
        .filter((candidatePath) => selectedPaths.has(candidatePath)) ?? [];
    setBusy(true);
    setError(null);
    try {
      const { added, failed } = await addProjects(orderedPaths);
      if (added.length > 0) {
        toast.success(t("toast.addedCount", { count: added.length }));
        useScopeStore.getState().setScope(
          added.length === 1
            ? {
                type: "project",
                name: added[0].name,
                path: added[0].path,
              }
            : { type: "all" },
        );
      }
      if (failed.length > 0) {
        toast.error(
          t("toast.failedAdd", {
            count: failed.length,
            paths: failed.map((item) => item.path).join(", "),
          }),
        );
      }
      if (added.length > 0 || failed.length === 0) onClose();
      else setError(t("add.allFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      busy={busy}
      ariaLabelledBy="add-project-title"
      containerClassName="flex max-h-[88vh] w-[min(680px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderGit2 size={19} />
          </div>
          <div>
            <h2 id="add-project-title" className="text-base font-bold">
              {t("add.title")}
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
              {t("add.description")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label={tc("actions.close")}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <button
          type="button"
          onClick={() => void chooseFolder()}
          disabled={busy}
          className="group flex w-full items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.055] p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.085] disabled:opacity-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm ring-1 ring-primary/15">
            <FolderSearch size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-foreground">
              {t("add.chooseFolder")}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t("add.chooseFolderHint")}
            </span>
          </span>
          {busy && <Loader2 size={16} className="animate-spin text-primary" />}
        </button>

        <div className="space-y-2">
          <label
            htmlFor="project-discovery-path"
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {t("add.orPaste")}
          </label>
          <div className="flex gap-2">
            <input
              id="project-discovery-path"
              type="text"
              value={path}
              onChange={(event) => setPath(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  void discover(path);
                }
              }}
              disabled={busy}
              placeholder={t("add.placeholder")}
              className="min-w-0 flex-1 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-sm shadow-inner placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void discover(path)}
              disabled={busy || !path.trim()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FolderSearch size={14} />
              )}
              {t("add.scan")}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-400/25 dark:bg-amber-950/25 dark:text-amber-200">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {candidates && candidates.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/35 px-3.5 py-3">
              <div>
                <h3 className="text-sm font-bold">{t("add.resultsTitle")}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("add.resultsSummary", { count: candidates.length })}
                </p>
              </div>
              {availablePaths.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllAvailable}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  {allAvailableSelected
                    ? t("add.clearAll")
                    : t("add.selectAll")}
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5">
              {candidates.map((candidate) => {
                const alreadyAdded = existingPaths.has(candidate.path);
                const checked = selectedPaths.has(candidate.path);
                return (
                  <label
                    key={candidate.path}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors",
                      alreadyAdded
                        ? "cursor-not-allowed opacity-55"
                        : "cursor-pointer hover:bg-muted/60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={alreadyAdded}
                      onChange={() => toggleCandidate(candidate.path)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <FolderGit2
                      size={16}
                      className="shrink-0 text-primary/75"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {candidate.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {candidate.path}
                      </span>
                    </span>
                    {alreadyAdded && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {t("add.added")}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-5 py-3.5">
        <span className="text-xs text-muted-foreground">
          {t("add.selected", { count: selectedPaths.size })}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            {tc("actions.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void addSelected()}
            disabled={busy || selectedPaths.size === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {t("add.addSelected", { count: selectedPaths.size })}
          </button>
        </div>
      </footer>
    </Modal>
  );
}

export function ManageProjectsDialog({ onClose }: DialogProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");
  const projects = useProjectStore((s) => s.projects);
  const removeProject = useProjectStore((s) => s.removeProject);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function remove(id: string) {
    if (removingId) return;
    setRemovingId(id);
    try {
      await removeProject(id);
      toast.success(t("toast.projectRemoved"));
      setConfirmingId(null);
    } catch (cause) {
      toast.error(humanizeError(cause));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Modal
      onClose={onClose}
      busy={removingId != null}
      ariaLabelledBy="manage-projects-title"
      containerClassName="flex max-h-[82vh] w-[min(620px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div>
          <h2 id="manage-projects-title" className="text-base font-bold">
            {t("manage.title")}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("manage.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={removingId != null}
          aria-label={tc("actions.close")}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <FolderGit2
              size={24}
              className="mx-auto text-muted-foreground/60"
            />
            <p className="mt-3 text-sm font-semibold">{t("manage.empty")}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {projects.map((project) => {
              const confirming = confirmingId === project.id;
              const removing = removingId === project.id;
              return (
                <div
                  key={project.id}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl border px-3 py-3",
                    project.exists
                      ? "border-border/70 bg-card"
                      : "border-amber-300/60 bg-amber-50/45 dark:border-amber-400/25 dark:bg-amber-950/15",
                  )}
                >
                  <FolderGit2
                    size={17}
                    className={clsx(
                      "shrink-0",
                      project.exists ? "text-primary/75" : "text-amber-600",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {project.name}
                      </span>
                      {!project.exists && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          <AlertTriangle size={10} /> {t("manage.missing")}
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-0.5 truncate text-xs text-muted-foreground"
                      title={project.path}
                    >
                      {project.path}
                    </p>
                  </div>
                  {confirming ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        disabled={removing}
                        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
                      >
                        {tc("actions.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(project.id)}
                        disabled={removing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-2.5 py-1.5 text-xs font-bold text-destructive-foreground disabled:opacity-40"
                      >
                        {removing ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        {t("manage.confirmRemove")}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(project.id)}
                      disabled={removingId != null}
                      aria-label={t("manage.removeAria", {
                        name: project.name,
                      })}
                      className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-5 py-3.5">
        <span className="text-xs text-muted-foreground">
          {t("manage.filesStay")}
        </span>
        <button
          type="button"
          onClick={onClose}
          disabled={removingId != null}
          className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {tc("actions.close")}
        </button>
      </footer>
    </Modal>
  );
}
