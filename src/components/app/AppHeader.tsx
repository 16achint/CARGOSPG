import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, ChevronDown, ChevronsRight, FileText, Files, HelpCircle, LogOut, Menu, Package, Percent, Plus, Search,
  Settings, UserRound, Users, Check, X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ALL_ROLES, ROLE_HOME } from "@/lib/roles";
import { quickActionsFor, type IconKey } from "@/lib/roles";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

const QK_ICON: Record<string, typeof Users> = {
  rfqs: Users, customers: Users, rates: Percent, quotes: FileText, docs: Files, vendors: Users, shipments: Package, truck: Users,
};


/* ---------------- Breadcrumbs ---------------- */
const LABELS: Record<string, string> = {
  overview: "Operations Overview", management: "Management Overview", customer: "Customer Overview",
  vendor: "Vendor Overview", sales: "Sales Overview", "finance-overview": "Finance Overview",
  customers: "Customers", rfqs: "RFQs", rates: "Rates", quotes: "Quotations", bookings: "Bookings",
  shipments: "Shipments", "control-tower": "Control Tower", documents: "Documents", customs: "Customs",
  warehouse: "Warehouse", vendors: "Vendors", finance: "Finance", reports: "Reports",
  users: "Users & Roles", roles: "Roles", "master-data": "Master Data", audit: "Audit Logs", settings: "Settings",
  journey: "Journey", milestones: "Milestones", exceptions: "Exceptions", new: "Create",
};

function Breadcrumbs() {
  const { pathname } = useLocation();
  const segs = pathname.replace(/^\/app\/?/, "").split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-[12.5px]">
        <li className="hidden text-steel-500 sm:inline">CargoOS</li>
        {segs.length > 0 && <li className="hidden text-steel-500 sm:inline" aria-hidden>/</li>}
        <li className="min-w-0 truncate font-medium text-frost-50">{LABELS[segs[0]] ?? "Overview"}</li>
        {segs[1] && <><li className="text-steel-500" aria-hidden>/</li><li className="truncate text-steel-400">{LABELS[segs[1]] ?? segs[1]}</li></>}
        {segs[2] && <><li className="text-steel-500" aria-hidden>/</li><li className="truncate text-steel-400">{LABELS[segs[2]] ?? segs[2]}</li></>}
      </ol>
    </nav>
  );
}

/* ---------------- Profile menu ---------------- */
function ProfileMenu() {
  const { user, role, setRole } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const signOut = () => { setOpen(false); navigate("/login"); };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-work-200 sm:pr-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(135deg,#2F86FF,#18A0D8)] text-[11px] font-medium text-white">{user.initials}</span>
        <span className="hidden min-w-0 text-left leading-tight lg:block">
          <span className="block max-w-[130px] truncate text-[12.5px] font-medium text-frost-50">{user.name}</span>
          <span className="block text-[11px] text-steel-500">{user.roleLabel}</span>
        </span>
        <ChevronDown className={cn("hidden h-3.5 w-3.5 shrink-0 text-steel-400 transition-transform lg:block", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.2, ease: EASE }}
            className="app-panel absolute right-0 z-50 mt-2 w-[264px] origin-top-right overflow-hidden p-0">
            <div className="border-b border-steel-400/12 px-4 py-3.5">
              <div className="text-[13.5px] font-medium text-frost-50">{user.name}</div>
              <div className="mt-0.5 truncate text-[12px] text-steel-400">{user.email}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-cargo-400/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-cargo-300 ring-1 ring-cargo-400/25">{user.roleLabel}</span>
                <span className="rounded-full bg-work-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-steel-400 ring-1 ring-steel-400/20">{user.branch}</span>
              </div>
            </div>
            <div className="p-1.5">
              {([
                { l: "My Profile", I: UserRound },
                { l: "Preferences", I: Settings },
                { l: "Help", I: HelpCircle },
              ]).map(({ l, I }) => (
                <button key={l} role="menuitem" onClick={() => { setOpen(false); navigate("/app/settings"); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-steel-300 transition hover:bg-work-200 hover:text-frost-50">
                  <I className="h-4 w-4 text-steel-400" strokeWidth={1.7} /> {l}
                </button>
              ))}
              <div className="my-1.5 h-px bg-steel-400/12" />
              <p className="px-2.5 pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-steel-500">Switch demo role</p>
              <div className="max-h-[214px] overflow-y-auto scroll-thin">
                {ALL_ROLES.map((r) => (
                  <button key={r.id} role="menuitemradio" aria-checked={r.id === role}
                    onClick={() => { setRole(r.id); setOpen(false); navigate(ROLE_HOME[r.id].to); }}
                    className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition",
                      r.id === role ? "bg-info/[0.09] text-frost-50" : "text-steel-300 hover:bg-work-200 hover:text-frost-50")}>
                    <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-[4px] ring-1", r.id === role ? "bg-info ring-info" : "ring-steel-400/35")}>
                      {r.id === role && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    <span className="max-w-[92px] truncate text-[11px] text-steel-500">{r.person}</span>
                  </button>
                ))}
              </div>
              <div className="my-1.5 h-px bg-steel-400/12" />
              <button role="menuitem" onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-risk transition hover:bg-risk/[0.07]">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Quick create ---------------- */
export function QuickCreatePanel({ onClose }: { onClose: () => void }) {
  const { role, notify } = useApp();
  const navigate = useNavigate();
  const actions = quickActionsFor(role);
  const TARGET: Record<string, string> = {
    rfq: "/app/rfqs/new", customer: "/app/customers/new", quote: "/app/rfqs", rate: "/app/rates",
    document: "/app/documents", vendor: "/app/vendors", shipment: "/app/shipments", pod: "/app/documents",
  };
  return (
    <div className="p-2">
      <p className="dock-group-label !text-steel-500 px-2.5 pb-2 pt-1.5">Create new</p>
      <ul className="grid gap-0.5 sm:grid-cols-2">
        {actions.map((a) => {
          const Icon = QK_ICON[a.icon as IconKey] ?? Package;
          return (
            <li key={a.key}>
              <button onClick={() => { onClose(); if (TARGET[a.key]) navigate(TARGET[a.key]); else notify(`${a.label} — opens in a later phase`); }}
                className="group flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-work-200">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-work-200 ring-1 ring-steel-400/15 transition group-hover:bg-info/[0.1] group-hover:ring-cargo-400/35">
                  <Icon className="h-4 w-4 text-steel-400 transition group-hover:text-cargo-300" strokeWidth={1.7} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-frost-50">{a.label}</span>
                  <span className="block truncate text-[11.5px] text-steel-500">{a.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="px-2.5 pb-1.5 pt-2.5 text-[11.5px] leading-relaxed text-steel-500">
        Deep create forms arrive with the commercial and execution phases.
      </p>
    </div>
  );
}

/* ---------------- Header ---------------- */
export function AppHeader() {
  const { setPaletteOpen, setCreateOpen, createOpen, setNotifOpen, unread, setNavOpen, role, home, notify } = useApp();
  const createRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!createOpen) return;
    const onDoc = (e: MouseEvent) => { if (!createRef.current?.contains(e.target as Node)) setCreateOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [createOpen, setCreateOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-steel-400/12 bg-white/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-3 md:px-5">
        <button onClick={() => setNavOpen(true)} aria-label="Open navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-steel-300 transition hover:bg-work-200 hover:text-frost-50 md:hidden">
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <Breadcrumbs />

        <button onClick={() => setPaletteOpen(true)}
          className="group ml-auto flex h-9 max-w-[210px] flex-1 items-center gap-2 rounded-lg bg-work-200/80 px-2.5 text-left ring-1 ring-steel-400/15 transition hover:bg-work-200 hover:ring-steel-400/30 sm:max-w-[340px] md:flex-none md:w-[340px]">
          <Search className="h-4 w-4 shrink-0 text-steel-400" />
          <span className="hidden min-w-0 flex-1 truncate text-[13px] text-steel-500 sm:block">Search shipment, RFQ, customer…</span>
          <kbd className="hidden shrink-0 rounded border border-steel-400/20 bg-white px-1.5 py-0.5 font-mono text-[10px] text-steel-500 sm:block">⌘K</kbd>
        </button>

        <div className="hidden h-6 w-px bg-steel-400/12 md:block" />

        <div ref={createRef} className="relative hidden md:block">
          <button onClick={() => setCreateOpen(!createOpen)} aria-expanded={createOpen} aria-haspopup="menu"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[linear-gradient(180deg,#2F86FF,#1C6FE8)] px-3 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_1px_2px_rgba(19,85,196,0.25)] transition hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_-8px_rgba(28,111,232,0.7)]">
            <Plus className="h-4 w-4" /> Create
          </button>
          <AnimatePresence>
            {createOpen && (
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.18, ease: EASE }}
                className="app-panel absolute right-0 z-50 mt-2 w-[380px] origin-top-right p-0">
                <QuickCreatePanel onClose={() => setCreateOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => notify("Help centre opens in a later phase")} aria-label="Help"
          className="hidden h-9 w-9 place-items-center rounded-lg text-steel-400 transition hover:bg-work-200 hover:text-frost-50 md:grid">
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>

        <button onClick={() => setNotifOpen(true)} aria-label={`Notifications, ${unread} unread`}
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-steel-400 transition hover:bg-work-200 hover:text-frost-50">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid min-w-[15px] place-items-center rounded-full bg-risk px-1 text-[9.5px] font-semibold leading-[15px] text-white ring-2 ring-white">
              {unread}
            </span>
          )}
        </button>

        <button onClick={() => notify("Mobile quick create arrives with execution phase")} aria-label="Create new record"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[linear-gradient(180deg,#2F86FF,#1C6FE8)] text-white md:hidden">
          <Plus className="h-[18px] w-[18px]" />
        </button>

        <ProfileMenu />
      </div>

      {/* role context strip */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-steel-400/10 bg-work-100/70 px-3 py-1.5 text-[11.5px] md:px-5 scroll-thin">
        <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-steel-500">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Signed in as
        </span>
        <span className="shrink-0 font-medium text-steel-300">{role}</span>
        <span className="shrink-0 text-steel-500">·</span>
        <Link to={home} className="inline-flex shrink-0 items-center gap-1 text-cargo-300 hover:text-cargo-400">
          {ROLE_HOME[role].label} <ChevronsRight className="h-3 w-3" />
        </Link>
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-steel-500 sm:inline-flex">
          <X className="h-3 w-3 opacity-0" /> Prototype data · refreshed 06 Oct, 12:45 IST
        </span>
      </div>
    </header>
  );
}
