import { clsx } from "clsx";
import {
  Blocks,
  Bot,
  Command,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { isAppUpdateEnabledForRuntime } from "@/lib/app-update-policy";
import { isDesktop } from "@/lib/transport";
import { useServerInfo } from "@/lib/use-server-info";
import { UpdateCard } from "./update-card";
import { WebUpdateCard } from "./web-update-card";

const mainNavItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "overview" },
  { to: "/agents", icon: Bot, labelKey: "agents" },
  { to: "/extensions", icon: Blocks, labelKey: "extensions" },
  { to: "/kits", icon: Package, labelKey: "kits" },
  { to: "/audit", icon: Shield, labelKey: "audit" },
  { to: "/marketplace", icon: ShoppingBag, labelKey: "marketplace" },
] as const;

const utilityNavItems = [
  { to: "/settings", icon: Settings, labelKey: "settings" },
] as const;

function SidebarLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <NavLink
      key={to}
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        clsx(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors duration-150 ease-out",
          isActive
            ? "bg-sidebar-accent/90 text-sidebar-accent-foreground font-semibold shadow-sm"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className={clsx(
              "transition-colors duration-200",
              isActive && "text-sidebar-primary",
            )}
          />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { t } = useTranslation("navigation");
  const serverInfo = useServerInfo();
  const desktop = isDesktop();
  const appUpdateEnabled = isAppUpdateEnabledForRuntime(desktop);
  return (
    <aside className="flex h-full w-[15.5rem] shrink-0 flex-col bg-sidebar px-4 pb-5 text-sidebar-foreground shadow-[8px_0_30px_color-mix(in_oklch,var(--primary)_8%,transparent)] select-none">
      {/* Top spacer for traffic lights */}
      <div className="h-10 shrink-0" />

      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/10">
          <Command size={20} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold tracking-tight text-sidebar-foreground">
            Open Agent Config
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/45">
            {t("controlCenter")}
          </p>
        </div>
      </div>

      {serverInfo?.nodeName && (
        <div className="mb-5 rounded-xl border border-sidebar-border/80 bg-black/10 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
            {t("node")}
          </p>
          <p
            className="mt-1 truncate text-xs font-medium text-sidebar-foreground/80"
            title={serverInfo.nodeName}
          >
            {serverInfo.nodeName}
          </p>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/40">
          {t("workspace")}
        </p>
        {mainNavItems.map((item) => (
          <SidebarLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={t(item.labelKey)}
          />
        ))}

        <div className="mt-auto mx-2 mb-3 border-t border-sidebar-border/70" />

        {appUpdateEnabled && (desktop ? <UpdateCard /> : <WebUpdateCard />)}

        {utilityNavItems.map((item) => (
          <SidebarLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={t(item.labelKey)}
          />
        ))}
      </nav>
    </aside>
  );
}
