import { clsx } from "clsx";
import { ChevronDown, Folder } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useScope } from "@/hooks/use-scope";
import type { ScopeValue } from "@/stores/scope-store";
import { ScopeSwitcherMenu } from "./scope-switcher-menu";

export function ScopeSwitcher({
  placement = "bottom",
}: {
  placement?: "bottom" | "top";
}) {
  const { t } = useTranslation("common");
  const { scope } = useScope();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const scopeLabel = (s: ScopeValue): string => {
    if (s.type === "all") return t("scope.all");
    if (s.type === "global") return t("scope.global");
    return s.name;
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const label = scopeLabel(scope);

  return (
    <div
      ref={containerRef}
      className={clsx("relative", placement === "top" && "min-w-0")}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("scope.switchAria", { label })}
        className={clsx(
          "flex items-center gap-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-150 ease-out",
          placement === "top"
            ? "max-w-[min(22rem,48vw)] bg-background/70 px-3 py-2 text-foreground shadow-sm ring-1 ring-border/70 hover:bg-accent"
            : "w-full px-3 py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
        )}
      >
        <Folder size={20} strokeWidth={1.75} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className="shrink-0 opacity-60"
        />
      </button>
      {open && (
        <ScopeSwitcherMenu
          onClose={() => setOpen(false)}
          placement={placement}
        />
      )}
    </div>
  );
}
