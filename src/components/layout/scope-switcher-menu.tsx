import { clsx } from "clsx";
import {
  Check,
  Folder,
  FolderCog,
  GitBranch,
  Layers3,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useScope } from "@/hooks/use-scope";
import { useProjectStore } from "@/stores/project-store";
import type { ScopeValue } from "@/stores/scope-store";

interface MenuItem {
  key: string;
  scope: ScopeValue;
  label: string;
  icon: React.ElementType;
}

const ADD_PROJECT_KEY = "__add_project__";
const MANAGE_PROJECTS_KEY = "__manage_projects__";

type ActionItem = {
  key: typeof ADD_PROJECT_KEY | typeof MANAGE_PROJECTS_KEY;
};
type NavigableItem = MenuItem | ActionItem;

export function ScopeSwitcherMenu({
  onClose,
  onAddProject,
  onManageProjects,
  placement = "bottom",
}: {
  onClose: () => void;
  onAddProject: () => void;
  onManageProjects: () => void;
  placement?: "bottom" | "top";
}) {
  const { t } = useTranslation("common");
  const { scope, setScope } = useScope();
  const projects = useProjectStore((s) => s.projects);
  const items = useMemo<MenuItem[]>(() => {
    const next: MenuItem[] = [];
    if (projects.length > 0) {
      next.push({
        key: "all",
        scope: { type: "all" },
        label: t("scope.all"),
        icon: Layers3,
      });
    }
    next.push({
      key: "global",
      scope: { type: "global" },
      label: t("scope.global"),
      icon: Folder,
    });
    for (const project of projects) {
      next.push({
        key: project.path,
        scope: {
          type: "project",
          name: project.name,
          path: project.path,
        },
        label: project.name,
        icon: GitBranch,
      });
    }
    return next;
  }, [projects, t]);

  const isCurrent = (item: MenuItem): boolean => {
    if (scope.type === "all" && item.key === "all") return true;
    if (scope.type === "global" && item.key === "global") return true;
    if (scope.type === "project" && item.key === scope.path) return true;
    return false;
  };

  const handleSelect = useCallback(
    (item: MenuItem) => {
      setScope(item.scope);
      onClose();
    },
    [onClose, setScope],
  );

  const handleAction = useCallback(
    (key: ActionItem["key"]) => {
      if (key === ADD_PROJECT_KEY) onAddProject();
      else onManageProjects();
    },
    [onAddProject, onManageProjects],
  );

  // Group items: All scopes | (sep) | Global + projects | (sep) | Add Project
  const allItem = items.find((i) => i.key === "all");
  const restItems = useMemo(
    () => items.filter((item) => item.key !== "all"),
    [items],
  );

  // Flat list of every selectable row in render order, used for ↑/↓ keyboard
  // navigation. The Add Project virtual row is appended at the end.
  const navigableItems = useMemo<NavigableItem[]>(() => {
    const list: NavigableItem[] = [];
    if (allItem) list.push(allItem);
    for (const it of restItems) list.push(it);
    list.push({ key: ADD_PROJECT_KEY });
    if (projects.length > 0) list.push({ key: MANAGE_PROJECTS_KEY });
    return list;
  }, [allItem, restItems, projects.length]);

  const [activeIndex, setActiveIndex] = useState(() => {
    // Start with the currently selected scope highlighted, so opening the
    // menu doesn't visually jump to "All scopes" regardless of state.
    const idx = navigableItems.findIndex(
      (item) =>
        item.key !== ADD_PROJECT_KEY &&
        item.key !== MANAGE_PROJECTS_KEY &&
        isCurrent(item as MenuItem),
    );
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, navigableItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = navigableItems[activeIndex];
        if (!item) return;
        if (item.key === ADD_PROJECT_KEY || item.key === MANAGE_PROJECTS_KEY) {
          handleAction(item.key);
        } else handleSelect(item as MenuItem);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeIndex, handleAction, handleSelect, navigableItems]);

  const activeKey = navigableItems[activeIndex]?.key;

  // Render helper: JSX requires a CapitalCase identifier for components, so
  // we alias item.icon to a local PascalCase variable before using it as JSX.
  const renderOption = (item: MenuItem) => {
    const ItemIcon = item.icon;
    return (
      <button
        key={item.key}
        role="menuitemradio"
        aria-checked={isCurrent(item)}
        data-active={activeKey === item.key ? "true" : undefined}
        onClick={() => handleSelect(item)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/60 data-[active=true]:bg-accent"
      >
        <ItemIcon size={14} className="text-muted-foreground" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        {isCurrent(item) && <Check size={12} />}
      </button>
    );
  };

  return (
    <div
      role="menu"
      className={clsx(
        "absolute z-50 max-h-80 overflow-y-auto rounded-2xl border border-border/80 bg-popover p-1.5 shadow-xl shadow-primary/10 animate-scale-in",
        placement === "top"
          ? "left-0 top-full mt-2 w-72"
          : "bottom-full left-0 right-0 mb-2",
      )}
    >
      {allItem && (
        <>
          {renderOption(allItem)}
          <div className="my-1 border-t border-border/40" />
        </>
      )}
      {restItems.map((item) => renderOption(item))}
      <div className="my-1 border-t border-border/40" />
      <button
        type="button"
        role="menuitem"
        onClick={() => handleAction(ADD_PROJECT_KEY)}
        data-active={activeKey === ADD_PROJECT_KEY ? "true" : undefined}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 data-[active=true]:bg-accent"
      >
        <Plus size={14} />
        <span>{t("scope.addProject")}</span>
      </button>
      {projects.length > 0 && (
        <button
          type="button"
          role="menuitem"
          onClick={() => handleAction(MANAGE_PROJECTS_KEY)}
          data-active={activeKey === MANAGE_PROJECTS_KEY ? "true" : undefined}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 data-[active=true]:bg-accent"
        >
          <FolderCog size={14} />
          <span>{t("scope.manageProjects")}</span>
        </button>
      )}
    </div>
  );
}
