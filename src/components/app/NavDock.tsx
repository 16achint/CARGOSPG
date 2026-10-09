import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid, Users, Inbox, Percent, FileText, CalendarCheck, Package, Radar, Files, ShieldCheck,
  Warehouse, Truck, Wallet, BarChart3, UserCog, Database, ScrollText, LifeBuoy, Settings,
  ChevronsLeft, ChevronsRight, LogOut, X, type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { useApp } from "@/context/AppContext";
import { navForRole, type IconKey } from "@/lib/roles";
import { DOCUMENTS } from "@/data/mockData";
import { useCommercial } from "@/context/CommercialContext";
import { useExecution } from "@/context/ExecutionContext";
import { cn } from "@/utils/cn";
import { EASE } from "@/lib/motion";

const ICON_MAP: Record<IconKey, LucideIcon> = {
  overview: LayoutGrid, customers: Users, rfqs: Inbox, rates: Percent, quotes: FileText,
  bookings: CalendarCheck, shipments: Package, tower: Radar, docs: Files, customs: ShieldCheck,
  warehouse: Warehouse, vendors: Truck, finance: Wallet, reports: BarChart3, users: UserCog,
  master: Database, audit: ScrollText, help: LifeBuoy, settings: Settings, create: Package,
  bell: Radar, search: FileText, chevron: ChevronsRight, menu: LayoutGrid, close: X, filter: Percent,
  refresh: Radar, logout: LogOut, user: Users, check: LifeBuoy, alert: Radar, clock: Radar,
  arrow: ChevronsRight, external: ChevronsRight, truck: Truck, ship: Package, plane: Radar,
  train: Package, pin: Radar, eye: Radar, spark: BarChart3, panel: LayoutGrid, sun: Radar,
};

export function NavDock() {
  const { role, user, collapsed, toggleCollapsed, navOpen, setNavOpen, home } = useApp();
  const navigate = useNavigate();
  const com = useCommercial();
  const execution = useExecution();
  const groups = navForRole(role);
  const badges = {
    rfq: com.rfqs.filter((r) => r.status === "New").length,
    docs: DOCUMENTS.filter((d) => d.status === "Missing").length,
    attention: execution.exceptions.filter((e) => !["Resolved", "Closed"].includes(e.status)).length,
  } as const;

  const list = (mobile = false) => (
    <nav aria-label="Application" className="scroll-thin-dark flex-1 overflow-y-auto px-2.5 pb-4">
      {groups.map((g, gi) => (
        <div key={g.label} className={cn(gi > 0 && "mt-5")}>
          {!collapsed && <p className="dock-group-label mb-1.5">{g.label}</p>}
          {collapsed && gi > 0 && <div className="mx-auto my-3 h-px w-6 bg-shell-hair" />}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const Icon = ICON_MAP[it.icon] ?? Package;
              const count = it.badgeKey ? badges[it.badgeKey] : 0;
              return (
                <li key={it.key}>
                  <NavLink
                    to={it.to}
                    end={it.to === "/app"}
                    onClick={() => mobile && setNavOpen(false)}
                    className={({ isActive }) => cn("dock-item group", isActive && "!text-white")}
                  >
                    {({ isActive }) => (
                      <>
                        <span data-active={isActive} className="dock-item hidden" aria-hidden />
                        <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.7} aria-hidden />
                        {!collapsed && <span className="min-w-0 flex-1 truncate">{it.label}</span>}
                        {!collapsed && count > 0 && (
                          <span className={cn(
                            "shrink-0 rounded-full px-1.5 py-px font-mono text-[9.5px] tabular-nums ring-1",
                            isActive ? "bg-white/15 text-white ring-white/25" : "bg-shell-600 text-[#a9c3da] ring-shell-hair"
                          )}>{count}</span>
                        )}
                        {collapsed && count > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cargo-400" aria-hidden />}
                        {collapsed && (
                          <span role="tooltip" className="pointer-events-none absolute left-full z-50 ml-2.5 hidden whitespace-nowrap rounded-md bg-shell-700 px-2.5 py-1.5 text-[12px] text-frost-100 opacity-0 shadow-[0_8px_24px_-8px_rgba(4,12,20,0.8)] ring-1 ring-shell-hair transition-opacity duration-200 group-hover:opacity-100 md:block">
                            {it.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const inner = (mobile = false) => (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2.5 px-4 pb-4 pt-5", collapsed && !mobile && "justify-center px-2")}>
        <LogoMark className="h-[30px] w-[30px] shrink-0" />
        {(!collapsed || mobile) && (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13.5px] font-medium tracking-[-0.01em] text-frost-50">SPG CargoOS</div>
            <div className="truncate font-mono text-[9.5px] uppercase tracking-[0.16em] text-steel-500">{user.branch}</div>
          </div>
        )}
        {mobile && (
          <button onClick={() => setNavOpen(false)} aria-label="Close navigation"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-steel-400 transition hover:bg-shell-600 hover:text-frost-50">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mx-4 h-px bg-shell-hair" />
      {list(mobile)}
      <div className="mx-4 h-px bg-shell-hair" />
      <div className="space-y-0.5 p-2.5">
        {[
          { l: "Help & Support", I: LifeBuoy },
          { l: "Settings", I: Settings },
        ].map((x) => (
          <button key={x.l} onClick={() => { if (mobile) setNavOpen(false); navigate("/app/settings"); }}
            className={cn("dock-item", collapsed && !mobile && "justify-center px-0")}>
            <x.I className="h-[17px] w-[17px] shrink-0" strokeWidth={1.7} />
            {(!collapsed || mobile) && <span>{x.l}</span>}
          </button>
        ))}
        {!mobile && (
          <button onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-pressed={collapsed}
            className={cn("dock-item mt-1", collapsed && "justify-center px-0")}>
            {collapsed ? <ChevronsRight className="h-[17px] w-[17px]" /> : <><ChevronsLeft className="h-[17px] w-[17px]" /><span>Collapse</span></>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / laptop dock */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 232 }}
        transition={{ duration: 0.42, ease: EASE }}
        className="relative z-30 hidden shrink-0 bg-[linear-gradient(180deg,#081522_0%,#06101B_55%,#040C14_100%)] md:block"
      >
        <div className="fixed bottom-0 left-0 top-0 flex flex-col border-r border-shell-hair bg-[linear-gradient(180deg,#081522_0%,#06101B_55%,#040C14_100%)]" style={{ width: collapsed ? 68 : 232 }}>
          {inner()}
        </div>
      </motion.aside>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
            onClick={() => setNavOpen(false)} className="absolute inset-0 bg-shell-950/50 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute inset-y-0 left-0 w-[272px] border-r border-shell-hair bg-[linear-gradient(180deg,#081522_0%,#06101B_60%,#040C14_100%)]">
            {inner(true)}
            <button onClick={() => { setNavOpen(false); navigate(home); }}
              className="absolute bottom-20 left-2.5 right-2.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-steel-400 transition hover:bg-shell-600 hover:text-frost-50">
              <LogOut className="h-[17px] w-[17px]" strokeWidth={1.7} /> Sign out
            </button>
          </motion.aside>
        </div>
      )}
    </>
  );
}
