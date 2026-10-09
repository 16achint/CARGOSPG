import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Check, ChevronRight, Clock3, Download, Filter, Package, Plus, Search, Ship, Truck } from "lucide-react";
import { useExecution } from "@/context/ExecutionContext";
import { useApp } from "@/context/AppContext";
import { Btn, PageHead } from "@/components/app/commercial/parts";
import { EmptyState, KpiCard, Panel, Progress, StatusBadge } from "@/components/app/ui/primitives";
import { getMilestoneStatus, openExceptions, shipmentIsDelayed, shipmentProgress, type OperationalShipment, type ShipmentStage } from "@/data/execution";
import { ModeIcon, StageBadge } from "@/components/app/execution/ExecutionParts";
import { cn } from "@/utils/cn";

type ViewKey = "all" | "mine" | "delayed" | "exceptions" | "pickup" | "arrivals" | "docs" | "completed";
const VIEW_LABEL: Record<ViewKey, string> = { all: "All shipments", mine: "My shipments", delayed: "Delayed", exceptions: "Exceptions", pickup: "Pickup due", arrivals: "Arriving today", docs: "Docs pending", completed: "Recently completed" };
const STAGES: ShipmentStage[] = ["Enquiry", "Quoted", "Confirmed", "Booking", "Documentation", "Pickup", "Customs", "Gate-In", "In Transit", "Transshipment", "Destination", "Delivery", "Completed", "Cancelled"];

function includesTerm(s: OperationalShipment, term: string) {
  if (!term) return true;
  const values = [s.id, s.bookingId, s.quoteId, s.rfqId, s.customerName, s.origin, s.destination, s.internalRef, s.customerVisibleRef ?? "", s.bookingRef, ...s.legs.flatMap((l) => [l.origin, l.destination, l.vendor?.vendorName ?? "", ...l.tracking.map((x) => x.value)])];
  return values.some((v) => v.toLowerCase().includes(term));
}

export function ShipmentsPage() {
  const { shipments } = useExecution();
  const { user, notify } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewKey>(() => (localStorage.getItem("cargoos.shipment-view") as ViewKey) ?? "all");
  const [f, setF] = useState({ date: "all", customer: "all", origin: "all", destination: "all", mode: "all", status: "all", vendor: "all", owner: "all", branch: "all", exception: "all", delayed: "all", documents: "all" });
  const [sort, setSort] = useState<"id" | "eta" | "customer">("eta");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const values = useMemo(() => ({
    customers: [...new Set(shipments.map((s) => s.customerName))],
    origins: [...new Set(shipments.map((s) => s.origin))],
    destinations: [...new Set(shipments.map((s) => s.destination))],
    vendors: [...new Set(shipments.flatMap((s) => s.legs.flatMap((l) => l.vendor ? [l.vendor.vendorName] : [])))],
    owners: [...new Set(shipments.map((s) => s.owner))],
    branches: [...new Set(shipments.map((s) => s.branch))],
  }), [shipments]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let result = shipments.filter((s) => {
      if (!includesTerm(s, term)) return false;
      if (f.date === "today" && s.eta !== "2025-10-10" && !s.milestones.some((m) => m.plannedAt.startsWith("2025-10-10"))) return false;
      if (f.date === "7d" && (s.eta < "2025-10-10" || s.eta > "2025-10-17")) return false;
      if (f.date === "30d" && (s.eta < "2025-10-10" || s.eta > "2025-11-09")) return false;
      if (f.customer !== "all" && s.customerName !== f.customer) return false;
      if (f.origin !== "all" && s.origin !== f.origin) return false;
      if (f.destination !== "all" && s.destination !== f.destination) return false;
      if (f.mode !== "all" && !s.legs.some((l) => l.mode === f.mode)) return false;
      if (f.status !== "all" && s.stage !== f.status) return false;
      if (f.vendor !== "all" && !s.legs.some((l) => l.vendor?.vendorName === f.vendor)) return false;
      if (f.owner !== "all" && s.owner !== f.owner) return false;
      if (f.branch !== "all" && s.branch !== f.branch) return false;
      if (f.exception === "yes" && openExceptions(s).length === 0) return false;
      if (f.exception === "no" && openExceptions(s).length > 0) return false;
      if (f.delayed === "yes" && !shipmentIsDelayed(s)) return false;
      if (f.delayed === "no" && shipmentIsDelayed(s)) return false;
      if (f.documents === "yes" && s.documentTotal <= s.documentComplete) return false;
      if (view === "mine" && s.owner !== user.name && s.owner !== user.initials && !s.owner.includes(user.name.split(" ")[0])) return false;
      if (view === "delayed" && !shipmentIsDelayed(s)) return false;
      if (view === "exceptions" && openExceptions(s).length === 0) return false;
      if (view === "pickup" && !s.milestones.some((m) => m.type === "Pickup" && !m.actualAt)) return false;
      if (view === "arrivals" && !s.milestones.some((m) => m.type === "Destination Arrival" && !m.actualAt && m.plannedAt.startsWith("2025-10-10"))) return false;
      if (view === "docs" && s.documentComplete >= s.documentTotal) return false;
      if (view === "completed" && s.stage !== "Completed") return false;
      return true;
    });
    result = [...result].sort((a, b) => sort === "eta" ? a.eta.localeCompare(b.eta) : sort === "customer" ? a.customerName.localeCompare(b.customerName) : a.id.localeCompare(b.id));
    return result;
  }, [shipments, q, f, view, sort, user]);

  const setViewPick = (v: ViewKey) => { setView(v); setPage(1); try { localStorage.setItem("cargoos.shipment-view", v); } catch { /* noop */ } };
  const setFilter = (k: keyof typeof f, value: string) => { setF((p) => ({ ...p, [k]: value })); setPage(1); };
  const clear = () => { setQ(""); setF({ date: "all", customer: "all", origin: "all", destination: "all", mode: "all", status: "all", vendor: "all", owner: "all", branch: "all", exception: "all", delayed: "all", documents: "all" }); setViewPick("all"); };
  const kpi = {
    active: shipments.filter((s) => !["Completed", "Cancelled"].includes(s.stage)).length,
    transit: shipments.filter((s) => ["In Transit", "Transshipment", "Destination"].includes(s.stage)).length,
    delayed: shipments.filter(shipmentIsDelayed).length,
    exception: shipments.filter((s) => openExceptions(s).length > 0).length,
    arrivals: shipments.filter((s) => s.milestones.some((m) => m.type === "Destination Arrival" && !m.actualAt && m.plannedAt.startsWith("2025-10-10"))).length,
    pickups: shipments.filter((s) => s.milestones.some((m) => m.type === "Pickup" && !m.actualAt)).length,
    completed: shipments.filter((s) => s.stage === "Completed").length,
  };
  const dropdown = (key: keyof typeof f, label: string, options: string[]) => (
    <select value={f[key]} onChange={(e) => setFilter(key, e.target.value)} aria-label={`Filter by ${label}`}
      className={cn("h-8 max-w-[165px] appearance-none rounded-lg border pl-2.5 pr-7 text-[12px] outline-none transition",
        f[key] !== "all" ? "border-cargo-400/55 bg-cargo-400/[0.08] text-frost-50" : "border-steel-400/20 bg-white text-steel-300 hover:border-steel-400/40")}>
      <option value="all">All {label.toLowerCase()}</option>{options.map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  );
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Execution · Shipment register" title="Shipments" support="Monitor and manage active multimodal shipments across every operating branch."
        actions={<>
          <Btn onClick={() => notify("Export prepared · shipments.csv")} icon={<Download className="h-3.5 w-3.5" />}>Export</Btn>
          <Btn onClick={() => notify("Saved view settings are stored locally in this prototype")}>Saved Views</Btn>
          <Btn variant="primary" onClick={() => nav("/app/shipments/new")} icon={<Plus className="h-3.5 w-3.5" />}>Create Shipment</Btn>
        </>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Active" value={kpi.active} icon={Package} tone="info" secondary="Not closed" />
        <KpiCard label="In transit" value={kpi.transit} icon={Ship} tone="cyan" secondary="Moving now" />
        <KpiCard label="Delayed" value={kpi.delayed} icon={Clock3} tone="warn" secondary="ETA at risk" />
        <KpiCard label="Exceptions" value={kpi.exception} icon={AlertTriangle} tone="risk" secondary="Open issues" />
        <KpiCard label="Arriving today" value={kpi.arrivals} icon={Package} tone="info" secondary="Destination milestones" />
        <KpiCard label="Pickup due" value={kpi.pickups} icon={Truck} tone="warn" secondary="No actual pickup yet" />
        <KpiCard label="Completed" value={kpi.completed} icon={Check} tone="ok" secondary="Operationally closed" />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-steel-400/12 scroll-thin">
        {(["all", "mine", "delayed", "exceptions", "pickup", "arrivals", "docs", "completed"] as ViewKey[]).map((v) => (
          <button key={v} onClick={() => setViewPick(v)} aria-pressed={view === v}
            className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition", view === v ? "bg-work-200 text-frost-50" : "text-steel-400 hover:text-frost-50")}>
            {VIEW_LABEL[v]}
          </button>
        ))}
      </div>

      <Panel bodyClass="p-3 md:p-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[210px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Shipment, booking, customer, container, BL, AWB, vehicle…" aria-label="Search shipments"
                className="h-9 w-full rounded-lg border border-steel-400/22 bg-white pl-9 pr-3 text-[13px] text-frost-50 outline-none transition placeholder:text-steel-500/90 focus:border-cargo-400 focus:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]" />
            </div>
            {dropdown("date", "date", ["today", "7d", "30d"])}
            {dropdown("customer", "customers", values.customers)}
            {dropdown("origin", "origin", values.origins)}
            {dropdown("destination", "destination", values.destinations)}
            {dropdown("mode", "mode", ["truck", "ocean", "air", "rail"])}
            {dropdown("status", "status", STAGES)}
            <button onClick={() => notify("Additional filters: vendor, owner, branch, exception, delay and document health are available below.")}
              aria-label="More filters" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-steel-400/20 bg-white px-2.5 text-[12px] text-steel-300 hover:border-steel-400/40"><Filter className="h-3 w-3" /> More</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dropdown("vendor", "vendor", values.vendors)}{dropdown("owner", "owner", values.owners)}{dropdown("branch", "branch", values.branches)}
            {dropdown("exception", "exceptions", ["yes", "no"])}{dropdown("delayed", "delay", ["yes", "no"])}{dropdown("documents", "docs pending", ["yes"])}
            {(q || Object.values(f).some((v) => v !== "all") || view !== "all") && <Btn size="sm" variant="ghost" onClick={clear}>Clear all</Btn>}
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-steel-500">{rows.length} shipments</span>
          </div>
        </div>
      </Panel>

      <Panel bodyClass="p-0">
        {rows.length === 0 ? (
          <EmptyState title={view === "exceptions" ? "No active exceptions" : "No shipments match these filters"}
            body={view === "exceptions" ? "Everything looks on track across this view." : "Clear a filter or search a different shipment reference."}
            action={q || Object.values(f).some((v) => v !== "all") ? <Btn onClick={clear}>Clear filters</Btn> : undefined} />
        ) : (
          <>
            <div className="hidden overflow-x-auto scroll-thin lg:block">
              <table className="w-full min-w-[1100px] text-left text-[12.5px]">
                <caption className="sr-only">Master shipment operational register</caption>
                <thead className="border-b border-steel-400/12 bg-work-50/70">
                  <tr className="[&>th]:whitespace-nowrap [&>th]:px-3 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500">
                    <th><button onClick={() => setSort(sort === "id" ? "eta" : "id")}>Shipment ID ↕</button></th>
                    <th>Customer</th><th>Route</th><th>Modes</th><th>Current leg</th><th>Current milestone</th><th>Next milestone</th>
                    <th><button onClick={() => setSort(sort === "eta" ? "customer" : "eta")}>ETA ↕</button></th><th>Status</th><th>Exception</th><th>Owner</th><th />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((s) => {
                    const curr = s.legs.find((l) => ["In Progress", "Delayed", "Exception", "Ready"].includes(l.status));
                    const next = s.milestones.map((m) => ({ m, state: getMilestoneStatus(m) })).find((x) => !["Completed", "Skipped"].includes(x.state))?.m;
                    const exceptions = openExceptions(s);
                    return (
                      <tr key={s.id} onClick={() => nav(`/app/shipments/${s.id}`)} className="cursor-pointer border-b border-steel-400/[0.07] transition-colors last:border-0 hover:bg-work-100 [&>td]:whitespace-nowrap [&>td]:px-3 [&>td]:py-2.5">
                        <td><span className="font-mono text-[11.5px] text-frost-50">{s.id}</span><span className="mt-0.5 block font-mono text-[9.5px] text-steel-500">{s.bookingId}</span></td>
                        <td className="max-w-[155px] truncate text-steel-300">{s.customerName}</td>
                        <td className="text-steel-300">{s.origin} <span className="text-steel-500">→</span> {s.destination}</td>
                        <td><span className="flex items-center gap-1.5">{[...new Set(s.legs.map((l) => l.mode))].map((m) => <ModeIcon key={m} mode={m} className="h-3.5 w-3.5 text-steel-400" />)}</span></td>
                        <td className="text-steel-300">{curr ? `Leg ${curr.sequence}/${s.legs.length}` : "Not started"}</td>
                        <td className="max-w-[150px] truncate text-steel-400">{curr?.status ?? "—"}</td>
                        <td className="max-w-[150px] truncate text-steel-400">{next?.name ?? "—"}</td>
                        <td className="font-mono text-[11px] text-steel-300">{s.eta}</td>
                        <td><StageBadge stage={s.stage} /></td>
                        <td>{exceptions.length ? <StatusBadge tone={exceptions.some((e) => e.severity === "Critical") ? "risk" : "warn"} dot={false}>{exceptions.length} open</StatusBadge> : <span className="text-steel-500">—</span>}</td>
                        <td className="text-steel-400">{s.owner}</td>
                        <td><ChevronRight className="h-4 w-4 text-steel-500" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-steel-400/[0.08] lg:hidden">
              {pageRows.map((s) => {
                const curr = s.legs.find((l) => ["In Progress", "Delayed", "Exception", "Ready"].includes(l.status));
                const next = s.milestones.map((m) => ({ m, state: getMilestoneStatus(m) })).find((x) => !["Completed", "Skipped"].includes(x.state))?.m;
                const ex = openExceptions(s);
                return (
                  <li key={s.id}>
                    <button onClick={() => nav(`/app/shipments/${s.id}`)} className="w-full px-4 py-3 text-left transition hover:bg-work-100">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[12px] text-frost-50">{s.id}</span><StageBadge stage={s.stage} /></div>
                      <div className="mt-1 text-[13px] text-frost-100">{s.origin} → {s.destination}</div>
                      <div className="mt-1 flex items-center gap-1.5">{[...new Set(s.legs.map((l) => l.mode))].map((m) => <ModeIcon key={m} mode={m} className="h-3.5 w-3.5 text-steel-400" />)}<span className="ml-1 text-[11px] text-steel-500">{s.customerName}</span></div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-steel-500">
                        <span>{curr ? `Leg ${curr.sequence}/${s.legs.length} · ${curr.status}` : "Journey not started"}</span><span>Next {next?.name ?? "—"}</span><span>ETA {s.eta}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={shipmentProgress(s)} tone={ex.length ? "warn" : "cyan"} className="flex-1" />
                        {ex.length > 0 && <StatusBadge tone="risk" dot={false}>{ex.length} exception</StatusBadge>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-steel-400/12 px-4 py-3">
              <span className="text-[12px] text-steel-500">Showing {Math.min(rows.length, (page - 1) * pageSize + 1)}–{Math.min(rows.length, page * pageSize)} of {rows.length}</span>
              <div className="flex items-center gap-1.5">
                <Btn size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Btn>
                <span className="px-1 font-mono text-[10.5px] text-steel-500">{page}/{pageCount}</span>
                <Btn size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</Btn>
              </div>
            </footer>
          </>
        )}
      </Panel>
    </div>
  );
}
