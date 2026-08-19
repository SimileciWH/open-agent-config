import { clsx } from "clsx";
import {
  CircleCheck,
  CircleOff,
  FileSearch,
  FolderPlus,
  FolderSearch,
  MapPin,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useScope } from "@/hooks/use-scope";
import { openDirectoryPicker, openFilePicker } from "@/lib/dialog";
import { isDesktop } from "@/lib/transport";
import {
  agentDisplayName,
  CONFIG_CATEGORY_ORDER,
  type ConfigCategory,
  type ConfigScope,
  type ExtensionCounts,
} from "@/lib/types";
import { useAgentConfigStore } from "@/stores/agent-config-store";
import { useAgentStore } from "@/stores/agent-store";
import { useExtensionStore } from "@/stores/extension-store";
import { ConfigSection } from "./config-section";
import { ExtensionsSummaryCard } from "./extensions-summary-card";
import { SectionAnchorRail } from "./section-anchor-rail";

export function AgentDetail() {
  const { t } = useTranslation("agents");
  const { t: tc } = useTranslation("common");
  const agentDetails = useAgentConfigStore((s) => s.agentDetails);
  const selectedAgent = useAgentConfigStore((s) => s.selectedAgent);
  const addCustomPath = useAgentConfigStore((s) => s.addCustomPath);
  const allExtensions = useExtensionStore((s) => s.extensions);
  const { scope } = useScope();
  const agent = agentDetails.find((a) => a.name === selectedAgent);
  const agents = useAgentStore((s) => s.agents);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customPath, setCustomPath] = useState("");

  const matchesScope = (s: ConfigScope) => {
    if (scope.type === "all") return true;
    if (scope.type === "global") return s.type === "global";
    // scope.type === "project"
    return s.type === "project" && s.path === scope.path;
  };

  // Client-side compute scope-filtered counts for THIS agent so the summary
  // card reflects the global scope rather than the system-wide Rust totals.
  // The scope check is inlined (rather than calling matchesScope) so the
  // useMemo dependency list stays minimal — `scope` is the only reactive input
  // beyond `allExtensions` and `agent`.
  const scopedCounts = useMemo<ExtensionCounts>(() => {
    const c: ExtensionCounts = { skill: 0, mcp: 0, plugin: 0, hook: 0, cli: 0 };
    if (!agent) return c;
    for (const ext of allExtensions) {
      if (!ext.agents.includes(agent.name)) continue;
      const s = ext.scope;
      if (scope.type === "global" && s.type !== "global") continue;
      if (
        scope.type === "project" &&
        !(s.type === "project" && s.path === scope.path)
      ) {
        continue;
      }
      c[ext.kind] = (c[ext.kind] ?? 0) + 1;
    }
    return c;
  }, [allExtensions, agent, scope]);

  if (!agent) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        {t("detail.selectAgent")}
      </div>
    );
  }

  const agentInfo = agents.find((item) => item.name === agent.name);

  const customFiles = agent.config_files.filter(
    (f) => f.custom_id != null && matchesScope(f.scope),
  );
  const nonCustomFiles = agent.config_files.filter(
    (f) => f.custom_id == null && matchesScope(f.scope),
  );
  const byCategory = new Map<ConfigCategory, typeof agent.config_files>();
  for (const cat of CONFIG_CATEGORY_ORDER) byCategory.set(cat, []);
  for (const file of nonCustomFiles) {
    const list = byCategory.get(file.category);
    if (list) list.push(file);
  }

  const totalVisible = nonCustomFiles.length + customFiles.length;
  const isConfigEmpty = totalVisible === 0;

  const summaryActiveScope =
    scope.type === "all"
      ? null
      : scope.type === "global"
        ? "global"
        : scope.path;

  return (
    // Keyed by agent so switching agents resets the scroll position.
    <div
      key={agent.name}
      className="flex-1 overflow-y-auto overscroll-contain p-5"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight">
            {agentDisplayName(agent.name)}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold",
                agent.detected
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {agent.detected ? (
                <CircleCheck size={11} />
              ) : (
                <CircleOff size={11} />
              )}
              {agent.detected ? t("detail.detected") : t("detail.notDetected")}
            </span>
            <span
              className={clsx(
                "rounded-full px-2 py-1 text-[10px] font-semibold",
                agentInfo?.enabled === false
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary",
              )}
            >
              {agentInfo?.enabled === false
                ? t("detail.disabled")
                : t("detail.enabled")}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <FolderPlus size={12} />
          {t("detail.addConfigLocation")}
        </button>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-border/75 bg-muted/25 px-3.5 py-3">
        <MapPin size={16} className="mt-0.5 shrink-0 text-primary/70" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t("detail.defaultLocation")}
          </p>
          <code
            className="mt-1 block truncate text-xs text-foreground/80"
            title={agentInfo?.path}
          >
            {agentInfo?.path ?? t("detail.locationUnavailable")}
          </code>
          <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
            {agent.detected
              ? t("detail.defaultLocationHint")
              : t("detail.notDetectedHint")}
          </p>
        </div>
      </div>

      {/* Add Custom Path form */}
      {showAddForm && (
        <div className="mb-5 rounded-lg border border-border p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-foreground">
              {t("detail.addConfigLocation")}
            </span>
            <button
              onClick={() => {
                setShowAddForm(false);
                setCustomPath("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder={t("detail.addCustomPathPlaceholder")}
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229 &&
                  customPath.trim()
                ) {
                  // Add Custom Path lands in the current scope; All-scopes
                  // mode falls back to Global since "all" is not a real
                  // install target.
                  const target: ConfigScope =
                    scope.type === "all" ? { type: "global" } : scope;
                  addCustomPath(
                    agent.name,
                    customPath.trim(),
                    "",
                    "settings",
                    target,
                  );
                  setShowAddForm(false);
                  setCustomPath("");
                }
              }}
              className="flex-1 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {isDesktop() && (
              <button
                onClick={async () => {
                  const selected = await openFilePicker({
                    title: t("detail.selectFile"),
                  });
                  if (selected) setCustomPath(selected);
                }}
                className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={t("detail.browseFile")}
              >
                <FileSearch size={14} />
              </button>
            )}
            {isDesktop() && (
              <button
                onClick={async () => {
                  const selected = await openDirectoryPicker({
                    title: t("detail.selectFolder"),
                  });
                  if (selected) setCustomPath(selected);
                }}
                className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={t("detail.browseFolder")}
              >
                <FolderSearch size={14} />
              </button>
            )}
            <button
              disabled={!customPath.trim()}
              onClick={async () => {
                const target: ConfigScope =
                  scope.type === "all" ? { type: "global" } : scope;
                await addCustomPath(
                  agent.name,
                  customPath.trim(),
                  "",
                  "settings",
                  target,
                );
                setShowAddForm(false);
                setCustomPath("");
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {t("detail.add")}
            </button>
          </div>
        </div>
      )}

      {isConfigEmpty ? (
        <div className="my-4 rounded-xl border border-dashed border-border bg-muted/15 p-7 text-center">
          <FolderSearch
            size={24}
            className="mx-auto text-muted-foreground/55"
          />
          <p className="mt-3 text-sm font-semibold">
            {!agent.detected
              ? t("detail.noConfigDetected")
              : t("detail.emptyForScope", {
                  agent: agentDisplayName(agent.name),
                  scope:
                    scope.type === "project"
                      ? scope.name
                      : scope.type === "global"
                        ? tc("scope.global")
                        : tc("scope.all"),
                })}
          </p>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
            {!agent.detected
              ? t("detail.noConfigDetectedHint")
              : t("detail.emptyForScopeHint")}
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <FolderPlus size={13} />
            {t("detail.addConfigLocation")}
          </button>
        </div>
      ) : (
        <>
          {CONFIG_CATEGORY_ORDER.map((cat) => {
            const files = byCategory.get(cat) ?? [];
            // When the active scope hides everything in a category, collapse
            // the section instead of rendering a "0" header. Always show
            // categories when scope is "all" so empty categories render once
            // across scopes.
            if (scope.type !== "all" && files.length === 0) return null;
            return (
              <ConfigSection
                key={cat}
                category={cat}
                files={files}
                agentName={agent.name}
              />
            );
          })}
          {customFiles.length > 0 && (
            <ConfigSection
              key="custom"
              category={"custom" as ConfigCategory}
              files={customFiles}
              agentName={agent.name}
            />
          )}
        </>
      )}
      <ExtensionsSummaryCard
        counts={scopedCounts}
        agentName={agent.name}
        activeScope={summaryActiveScope}
      />
      <SectionAnchorRail
        revisionKey={`${agent.name}|${summaryActiveScope ?? "all"}|${nonCustomFiles.length}|${customFiles.length}`}
      />
    </div>
  );
}
