import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { CUSTOMERS, SHIPMENTS, type ShipmentStatus } from "@/data/mockData";
import type { DateRange, Filters } from "@/context/AppContext";
import { cn } from "@/utils/cn";
import { EASE } from "@/lib/motion";

const MODES = ["ocean", "air", "road", "rail"] as const;
const STATUSES: ShipmentStatus[] = ["Confirmed", "Documentation", "Pickup", "Customs", "Gate-in", "In Transit", "Transshipment", "Destination", "Delivery", "Completed", "Exception"];
const BRANCHES = ["West", "North", "South", "East"];
const DATES: { id: DateRange; l: string }[] = [
  { id: "7d", l: "Last 7 days" }, { id: "30d", l: "Last 30 days" },
  { id: "90d", l: "Last 90 days" }, { id: "mtd", l: "Month to date" }, { id: "qtd", l: "Quarter to date" },
];

function Popover({ label, value, children, active, className }:
  { label: string; value: string; children: (close: () => void) => ReactNode; active?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox"
        className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] transition",
          active ? "border-cargo-400/60 bg-cargo-400/[0.09] text-frost-50" : "border-steel-400/20 bg-white text-steel-300 hover:border-steel-400/40 hover:text-frost-50")}>
        <span className="text-steel-500">{label}</span>
        <span className="max-w-[110px] truncate font-medium">{value}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }} transition={{ duration: 0.16, ease: EASE }}
            role="listbox"
            className="app-panel absolute left-0 z-50 mt-1.5 max-h-[290px] w-[228px] origin-top overflow-y-auto p-1.5 scroll-thin">
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Opt({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button role="option" aria-selected={selected} onClick={onClick}
      className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition",
        selected ? "bg-info/[0.09] text-frost-50" : "text-steel-300 hover:bg-work-200 hover:text-frost-50")}>
      <span className={cn("grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[4px] ring-1", selected ? "bg-info ring-info" : "ring-steel-400/35")}>
        {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

export function FilterBar({ filters, setFilter, clearFilters, active, resultCount }:
  { filters: Filters; setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void; clearFilters: () => void; active: boolean; resultCount: number }) {
  const dateLabel = DATES.find((d) => d.id === filters.date)?.l ?? "Last 30 days";
  const modeLabel = filters.mode === "all" ? "All modes" : filters.mode[0].toUpperCase() + filters.mode.slice(1);
  const statusLabel = filters.status === "all" ? "All statuses" : filters.status;
  const branchLabel = filters.branch === "all" ? "All branches" : filters.branch;
  const custLabel = filters.customer === "all" ? "All customers" : CUSTOMERS.find((c) => c.id === filters.customer)?.name ?? "Customer";

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Popover label="Date" value={dateLabel} active={filters.date !== "30d"}>
          {(close) => DATES.map((d) => <Opt key={d.id} selected={filters.date === d.id} onClick={() => { setFilter("date", d.id); close(); }}>{d.l}</Opt>)}
        </Popover>
        <Popover label="Branch" value={branchLabel} active={filters.branch !== "all"}>
          {(close) => <><Opt selected={filters.branch === "all"} onClick={() => { setFilter("branch", "all"); close(); }}>All branches</Opt>
            {BRANCHES.map((b) => <Opt key={b} selected={filters.branch === b} onClick={() => { setFilter("branch", b); close(); }}>{b}</Opt>)}</>}
        </Popover>
        <Popover label="Mode" value={modeLabel} active={filters.mode !== "all"}>
          {(close) => <><Opt selected={filters.mode === "all"} onClick={() => { setFilter("mode", "all"); close(); }}>All modes</Opt>
            {MODES.map((m) => <Opt key={m} selected={filters.mode === m} onClick={() => { setFilter("mode", m); close(); }}>{m[0].toUpperCase() + m.slice(1)}</Opt>)}</>}
        </Popover>
        <Popover label="Customer" value={custLabel} active={filters.customer !== "all"} className="hidden sm:block">
          {(close) => <><Opt selected={filters.customer === "all"} onClick={() => { setFilter("customer", "all"); close(); }}>All customers</Opt>
            {CUSTOMERS.map((c) => <Opt key={c.id} selected={filters.customer === c.id} onClick={() => { setFilter("customer", c.id); close(); }}>{c.name}</Opt>)}</>}
        </Popover>
        <Popover label="Status" value={statusLabel} active={filters.status !== "all"} className="hidden md:block">
          {(close) => <><Opt selected={filters.status === "all"} onClick={() => { setFilter("status", "all"); close(); }}>All statuses</Opt>
            {STATUSES.map((s) => <Opt key={s} selected={filters.status === s} onClick={() => { setFilter("status", s); close(); }}>{s}</Opt>)}</>}
        </Popover>

        {active && (
          <button onClick={clearFilters}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-cargo-300 transition hover:bg-cargo-400/10">
            <RotateCcw className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}

        <span className="ml-auto hidden items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-steel-500 lg:inline-flex">
          <SlidersHorizontal className="h-3.5 w-3.5" /> {resultCount} of {SHIPMENTS.length} shipments
        </span>
      </div>
      {active && (
        <div className="flex flex-wrap items-center gap-1.5">
          {([["Branch", branchLabel, filters.branch !== "all", () => setFilter("branch", "all")],
            ["Mode", modeLabel, filters.mode !== "all", () => setFilter("mode", "all")],
            ["Customer", custLabel, filters.customer !== "all", () => setFilter("customer", "all")],
            ["Status", statusLabel, filters.status !== "all", () => setFilter("status", "all")]] as [string, string, boolean, () => void][])
            .filter(([, , on]) => on)
            .map(([k, v, , off]) => (
              <span key={k} className="inline-flex items-center gap-1 rounded-md bg-cargo-400/[0.09] py-0.5 pl-2 pr-1 text-[11.5px] text-frost-100 ring-1 ring-cargo-400/30">
                <span className="text-steel-400">{k}:</span> {v}
                <button onClick={off} aria-label={`Clear ${k} filter`} className="grid h-4 w-4 place-items-center rounded text-steel-400 transition hover:bg-white hover:text-frost-50"><X className="h-3 w-3" /></button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
