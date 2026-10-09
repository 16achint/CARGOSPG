import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role, Shipment } from "@/data/mockData";
import { NOTIFS, SHIPMENTS, userForRole, type Notif } from "@/data/mockData";
import { COMM_NOTIFS } from "@/data/commercial";
import { ROLE_HOME } from "@/lib/roles";

export type DateRange = "7d" | "30d" | "90d" | "mtd" | "qtd";
export interface Filters { date: DateRange; branch: string; mode: string; customer: string; status: string }

export const EMPTY_FILTERS: Filters = { date: "30d", branch: "all", mode: "all", customer: "all", status: "all" };

interface Ctx {
  role: Role;
  setRole: (r: Role) => void;
  user: ReturnType<typeof userForRole>;
  home: string;
  filters: Filters;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  clearFilters: () => void;
  filtersActive: boolean;
  shipments: Shipment[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  notifs: Notif[];
  unread: number;
  markRead: (id: string, read: boolean) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notif, "id" | "read">) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  preview: Shipment | null;
  setPreview: (s: Shipment | null) => void;
  toast: string | null;
  notify: (msg: string) => void;
}

const AppCtx = createContext<Ctx | null>(null);

/** Simulated fetch so loading / error states are demonstrable. */
function useSimulatedLoad(key: string, delay = 850) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    setLoading(true);
    setError(false);
    const t = window.setTimeout(() => setLoading(false), delay);
    return () => window.clearTimeout(t);
  }, [key, nonce, delay]);
  const retry = useCallback(() => { setError(false); setNonce((n) => n + 1); }, []);
  return { loading, error, setError, retry };
}

export function AppProvider({ initialRole, children }: { initialRole: Role; children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(initialRole);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [notifs, setNotifs] = useState<Notif[]>([...COMM_NOTIFS.map((n) => ({ ...n, type: n.type as Notif["type"] })), ...NOTIFS]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [preview, setPreview] = useState<Shipment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { loading, error, retry } = useSimulatedLoad(role);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    setFilters(EMPTY_FILTERS);
    setPreview(null);
  }, []);

  const user = useMemo(() => userForRole(role), [role]);
  const home = ROLE_HOME[role].to;

  const setFilter = useCallback(<K extends keyof Filters>(k: K, v: Filters[K]) => {
    setFilters((f) => ({ ...f, [k]: v }));
  }, []);
  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const filtersActive = useMemo(
    () => filters.branch !== "all" || filters.mode !== "all" || filters.customer !== "all" || filters.status !== "all",
    [filters]
  );

  const shipments = useMemo(() => SHIPMENTS.filter((s) => {
    if (filters.branch !== "all" && s.branch !== filters.branch) return false;
    if (filters.mode !== "all" && s.mode !== filters.mode) return false;
    if (filters.customer !== "all" && s.customerId !== filters.customer) return false;
    if (filters.status !== "all" && s.status !== filters.status) return false;
    return true;
  }), [filters]);

  const unread = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);
  const markRead = useCallback((id: string, read: boolean) => {
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read } : n)));
  }, []);
  const markAllRead = useCallback(() => setNotifs((ns) => ns.map((n) => ({ ...n, read: true }))), []);
  const addNotification = useCallback((n: Omit<Notif, "id" | "read">) => {
    setNotifs((ns) => [{ ...n, id: `live-${Date.now()}`, read: false }, ...ns]);
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200);
  }, []);

  // global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); return; }
      if (e.key === "Escape") {
        setPaletteOpen(false); setCreateOpen(false); setNotifOpen(false); setNavOpen(false); setFiltersOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value: Ctx = {
    role, setRole, user, home, filters, setFilter, clearFilters, filtersActive, shipments,
    loading, error, retry: () => { retry(); },
    notifs, unread, markRead, markAllRead, addNotification,
    paletteOpen, setPaletteOpen, createOpen, setCreateOpen, notifOpen, setNotifOpen,
    navOpen, setNavOpen, filtersOpen, setFiltersOpen, collapsed, toggleCollapsed: () => setCollapsed((c) => !c),
    preview, setPreview, toast, notify,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
