import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { QuickPreferences } from "./quick-preferences";
import { ScopeSwitcher } from "./scope-switcher";

const PAGE_KEYS = [
  "overview",
  "agents",
  "extensions",
  "kits",
  "audit",
  "marketplace",
  "settings",
] as const;
type PageKey = (typeof PAGE_KEYS)[number];

export function Topbar() {
  const location = useLocation();
  const { t } = useTranslation("navigation");
  const segment = location.pathname.split("/")[1] || "overview";
  const pageKey: PageKey = PAGE_KEYS.includes(segment as PageKey)
    ? (segment as PageKey)
    : "overview";

  return (
    <header className="relative z-40 flex h-[4.5rem] shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-card/90 px-5 backdrop-blur-xl sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden min-w-0 flex-col sm:flex">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
            {t("workspace")}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {t(pageKey)}
          </span>
        </div>
        <span
          className="hidden h-7 w-px bg-border sm:block"
          aria-hidden="true"
        />
        <ScopeSwitcher placement="top" />
      </div>
      <QuickPreferences />
    </header>
  );
}
