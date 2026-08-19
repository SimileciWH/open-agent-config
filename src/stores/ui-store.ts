import { create } from "zustand";
import { readMigratedStorage, writeMigratedStorage } from "@/lib/storage";

// The product ships one blue-white base theme. Keep the type so the DOM theme
// attribute remains explicit, while avoiding a second user-facing theme.
export type ThemeName = "tiesen";
export type Mode = "system" | "dark" | "light";
export type AppIcon = "icon-1" | "icon-2";
export type AgentVisibility = "all" | "detected";

/**
 * Safely retrieves and validates a localStorage value against allowed values.
 * Falls back to the default if localStorage is unavailable or the value is invalid.
 */
function getValidItem<T extends string>(
  key: string,
  legacyKey: string,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof localStorage === "undefined") return fallback;
  const val = readMigratedStorage(key, legacyKey);
  return val && (allowed as readonly string[]).includes(val)
    ? (val as T)
    : fallback;
}

interface UIState {
  sidebarOpen: boolean;
  themeName: ThemeName;
  mode: Mode;
  appIcon: AppIcon;
  agentVisibility: AgentVisibility;
  toggleSidebar: () => void;
  setThemeName: (name: ThemeName) => void;
  setMode: (mode: Mode) => void;
  setAppIcon: (icon: AppIcon) => void;
  setAgentVisibility: (visibility: AgentVisibility) => void;
}

const ALLOWED_MODES: readonly Mode[] = ["system", "dark", "light"];
const ALLOWED_THEME_NAMES: readonly ThemeName[] = ["tiesen"];
const ALLOWED_APP_ICONS: readonly AppIcon[] = ["icon-1", "icon-2"];
const ALLOWED_AGENT_VISIBILITY: readonly AgentVisibility[] = [
  "all",
  "detected",
];

const storedMode = getValidItem(
  "oac-theme",
  "hk-theme",
  ALLOWED_MODES,
  "system",
);
const storedThemeName = getValidItem(
  "oac-theme-name",
  "hk-theme-name",
  ALLOWED_THEME_NAMES,
  "tiesen",
);
const storedAppIcon = getValidItem(
  "oac-app-icon",
  "hk-app-icon",
  ALLOWED_APP_ICONS,
  "icon-1",
);
const storedAgentVisibility = getValidItem(
  "oac-agent-visibility",
  "hk-agent-visibility",
  ALLOWED_AGENT_VISIBILITY,
  "all",
);
/** Resolve "system" to actual light/dark based on OS preference */
export function resolveMode(mode: Mode): "dark" | "light" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  themeName: storedThemeName,
  mode: storedMode,
  appIcon: storedAppIcon,
  agentVisibility: storedAgentVisibility,
  toggleSidebar() {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }));
  },
  setThemeName(themeName) {
    writeMigratedStorage("oac-theme-name", themeName, "hk-theme-name");
    set({ themeName });
  },
  setMode(mode) {
    writeMigratedStorage("oac-theme", mode, "hk-theme");
    set({ mode });
  },
  setAppIcon(appIcon) {
    writeMigratedStorage("oac-app-icon", appIcon, "hk-app-icon");
    set({ appIcon });
  },
  setAgentVisibility(agentVisibility) {
    writeMigratedStorage(
      "oac-agent-visibility",
      agentVisibility,
      "hk-agent-visibility",
    );
    set({ agentVisibility });
  },
}));
