import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Check, Clock3, Package, Radar, Search, ShieldAlert, Ship,
} from "lucide-react";
import { useExecution } from "@/context/ExecutionContext";
import { Btn, Field, PageHead, Row, Select, Textarea } from "@/components/app/commercial/parts";
import { Drawer, EmptyState, KpiCard, Panel, PositiveState, Skeleton, StatusBadge, type ToneKey } from "@/components/app/ui/primitives";
import { DEMO_EXEC_NOW, EXCEPTION_SEVERITIES, EXCEPTION_STATUSES, LEG_TONE, getMilestoneStatus, openExceptions, shipmentIsDelayed, shipmentProgress, type ExceptionStatus, type OperationalException, type OperationalShipment } from "@/data/execution";
import { EventFeed, ModeIcon, StageBadge, formatDate, getStageCurrent, relativeAge } from "@/components/app/execution/ExecutionParts";
import { ExceptionEditorDrawer } from "@/components/app/execution/ExecutionDrawers";
import { cn } from "@/utils/cn";

const NetworkMap = lazy(() => import("@/components/app/execution/ControlTowerMap"));
const OWNERS = ["R. Kulkarni", "A. Sharma", "D. Menon", "S. Iyer", "P. Joshi", "N. Verma"];

function ShipmentPreviewDrawer({ shipment, open, onClose }: { shipment: OperationalShipment | null; open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const { addException } = useExecution();
  const [reportOpen, setReportOpen] = useState(false);
  if (!shipment) return null;
  const current = shipment.legs.find((l) => ["In Progress", "Ready", "Delayed", "Exception"].includes(l.status));
  const next = shipment.milestones.find((m) => !m.actualAt);
  return <>
    <Drawer open={open} onClose={onClose} title={shipment.id} subtitle={`${shipment.origin} → ${shipment.destination} · ${shipment.customerName}`} width="sm:max-w-[460px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2"><StageBadge stage={shipment.stage} /><StatusBadge tone={shipmentIsDelayed(shipment) ? "warn" : "ok"} dot={false}>{shipmentIsDelayed(shipment) ? "At risk" : "On schedule"}</StatusBadge><span className="ml-auto font-mono text-[10px] text-steel-500">{shipment.priority} priority</span></div>
        <div className="rounded-xl bg-work-100 p-3.5 ring-1 ring-steel-400/12">
          <div className="flex items-center justify-between"><span className="text-[12.5px] text-steel-400">Journey progress</span><span className="t-num text-[13px] text-frost-50">{shipmentProgress(shipment)}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-steel-400/15"><div className="h-full rounded-full bg-[linear-gradient(90deg,#1C6FE8,#18A0D8)]" style={{ width: `${shipmentProgress(shipment)}%` }} /></div>
        </div>
        <dl><Row k="Current leg" v={current ? `Leg ${current.sequence} · ${current.origin} → ${current.destination}` : "No active leg"} /><Row k="Current movement" v={getStageCurrent(shipment)} /><Row k="Next milestone" v={next?.name ?? "—"} /><Row k="ETA" v={shipment.eta} /><Row k="Owner" v={shipment.owner} /><Row k="Booking" v={shipment.bookingId} mono /></dl>
        {shipment.legs.length > 0 && <div className="rounded-xl bg-white p-3 ring-1 ring-steel-400/12"><p className="t-meta mb-2 !text-[9px]">Journey mini-timeline</p><ol className="space-y-2">{shipment.legs.map((l) => <li key={l.id} className="flex items-center gap-2"><ModeIcon mode={l.mode} className="h-3.5 w-3.5 text-steel-400" /><span className="min-w-0 flex-1 truncate text-[11.5px] text-steel-300">{l.origin} → {l.destination}</span><StatusBadge tone={LEG_TONE[l.status]} dot={false}>{l.status}</StatusBadge></li>)}</ol></div>}
        {openExceptions(shipment).length > 0 && <div className="space-y-2">{openExceptions(shipment).map((e) => <div key={e.id} className="rounded-xl bg-risk/[0.05] p-3 ring-1 ring-risk/20"><div className="flex items-center justify-between"><span className="text-[12.5px] text-frost-50">{e.type}</span><StatusBadge tone={e.severity === "Critical" || e.severity === "High" ? "risk" : "warn"} dot={false}>{e.severity}</StatusBadge></div><p className="mt-1 text-[11.5px] text-steel-400">{e.description}</p></div>)}</div>}
        <div className="grid grid-cols-3 gap-2"><Btn size="sm" onClick={() => { onClose(); nav(`/app/shipments/${shipment.id}`); }}>Open Shipment</Btn><Btn size="sm" onClick={() => { onClose(); nav(`/app/shipments/${shipment.id}/journey`); }}>Open Journey</Btn><Btn size="sm" variant="primary" onClick={() => setReportOpen(true)}>Report Exception</Btn></div>
      </div>
    </Drawer>
    <ExceptionEditorDrawer open={reportOpen} onClose={() => setReportOpen(false)} shipment={shipment} onSave={(x) => { addException(shipment.id, x); setReportOpen(false); }} />
  </>;
}

function dateStamp(s: string) { return s.slice(0, 10); }

export function ControlTowerPage() {
  const { shipments } = useExecution();
  const nav = useNavigate();
  const [selected, setSelected] = useState<OperationalShipment | null>(null);
  const [f, setF] = useState({ date: "all", mode: "all", status: "all", exception: "all", owner: "all", customer: "all" });
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  const filtered = useMemo(() => shipments.filter((s) => {
    if (f.date === "today" && s.eta !== "2025-10-10" && !s.milestones.some((m) => m.plannedAt.startsWith("2025-10-10"))) return false;
    if (f.date === "7d" && (s.eta < "2025-10-10" || s.eta > "2025-10-17")) return false;
    if (f.mode !== "all" && !s.legs.some((l) => l.mode === f.mode)) return false;
    if (f.status !== "all" && s.stage !== f.status) return false;
    if (f.exception === "yes" && !openExceptions(s).length) return false;
    if (f.exception === "no" && openExceptions(s).length) return false;
    if (f.owner !== "all" && s.owner !== f.owner) return false;
    if (f.customer !== "all" && s.customerName !== f.customer) return false;
    if (location && ![s.origin, s.destination, ...s.legs.flatMap((l) => [l.origin, l.destination])].some((x) => x.toLowerCase().includes(location.toLowerCase()))) return false;
    if (search) {
      const term = search.toLowerCase();
      const all = [s.id, s.customerName, s.origin, s.destination, ...s.legs.flatMap((l) => [...l.tracking.map((x) => x.value), l.vendor?.vendorName ?? ""])];
      if (!all.some((x) => x.toLowerCase().includes(term))) return false;
    }
    return s.stage !== "Completed" && s.stage !== "Cancelled";
  }), [shipments, f, location, search]);

  const openEx = shipments.flatMap((s) => openExceptions(s));
  const arrivals = shipments.flatMap((s) => s.milestones.filter((m) => m.type === "Destination Arrival").map((m) => ({ s, m })));
  const departures = shipments.flatMap((s) => s.milestones.filter((m) => ["Vessel Departed", "Flight Departed", "Rail Departed", "Pickup"].includes(m.type)).map((m) => ({ s, m })));
  const today = DEMO_EXEC_NOW.slice(0, 10);
  const arrToday = arrivals.filter(({ m }) => dateStamp(m.plannedAt) === today && !m.actualAt);
  const depToday = departures.filter(({ m }) => dateStamp(m.plannedAt) === today && !m.actualAt);
  const kpis = {
    active: shipments.filter((s) => !["Completed", "Cancelled"].includes(s.stage)).length,
    ontime: shipments.filter((s) => !shipmentIsDelayed(s) && !["Completed", "Cancelled"].includes(s.stage)).length,
    atRisk: shipments.filter((s) => shipmentIsDelayed(s)).length,
    delayed: shipments.filter((s) => s.legs.some((l) => l.status === "Delayed") || s.milestones.some((m) => m.status === "Delayed")).length,
    critical: openEx.filter((e) => e.severity === "Critical").length,
  };

  const drop = (key: keyof typeof f, label: string, options: string[]) => <select key={key} value={f[key]} onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))} aria-label={`Filter by ${label}`} className={cn("h-8 max-w-[150px] appearance-none rounded-lg border pl-2.5 pr-7 text-[12px] outline-none transition", f[key] !== "all" ? "border-cargo-400/50 bg-cargo-400/[0.08] text-frost-50" : "border-steel-400/20 bg-white text-steel-300")}><option value="all">All {label}</option>{options.map((x) => <option key={x} value={x}>{x}</option>)}</select>;

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Execution · Network monitoring" title="Control Tower" support="Global operational movement, arrivals and risk across active multimodal shipments." actions={<Btn onClick={() => nav("/app/control-tower/exceptions")} icon={<AlertTriangle className="h-3.5 w-3.5" />}>Exception Center</Btn>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Active shipments" value={kpis.active} icon={Package} tone="info" secondary="Across network" />
        <KpiCard label="On time" value={kpis.active ? Math.round((kpis.ontime / kpis.active) * 100) : 0} suffix="%" icon={Check} tone="ok" secondary={`${kpis.ontime} healthy`} />
        <KpiCard label="At risk" value={kpis.atRisk} icon={Clock3} tone="warn" secondary="Delay signals" />
        <KpiCard label="Delayed" value={kpis.delayed} icon={AlertTriangle} tone="warn" secondary="Milestone overdue" />
        <KpiCard label="Critical exceptions" value={kpis.critical} icon={ShieldAlert} tone="risk" secondary="Action now" />
      </div>

      <Panel bodyClass="p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[210px] flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Shipment, container, BL, AWB, vehicle, vendor…" className="h-9 w-full rounded-lg border border-steel-400/22 bg-white pl-9 pr-3 text-[13px] text-frost-50 outline-none placeholder:text-steel-500/90 focus:border-cargo-400" /></div>
          {drop("date", "date", ["today", "7d"])}
          {drop("mode", "mode", ["truck", "ocean", "air", "rail"])}
          {drop("status", "status", ["Pickup", "Customs", "Gate-In", "In Transit", "Transshipment", "Destination", "Delivery"])}
          {drop("exception", "exceptions", ["yes", "no"])}
          {drop("owner", "owner", [...new Set(shipments.map((s) => s.owner))])}
          {drop("customer", "customer", [...new Set(shipments.map((s) => s.customerName))])}
          {location && <button onClick={() => setLocation("")} className="rounded-md bg-cargo-400/10 px-2 py-1 text-[11.5px] text-cargo-300">Location: {location} ×</button>}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-steel-500">{filtered.length} active routes</span>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr] md:gap-5">
        <Panel title="Global network" subtitle="Click a route for operational detail · click a node to filter by location" action={<StatusBadge tone="ok" dot>LIVE PROTOTYPE</StatusBadge>} bodyClass="p-3 md:p-4">
          {filtered.length ? <Suspense fallback={<Skeleton className="aspect-[1000/460] w-full rounded-xl" />}><NetworkMap shipments={filtered} onSelect={setSelected} selectedId={selected?.id} onLocation={setLocation} /></Suspense> : <EmptyState title="No active shipments for these filters" body="Clear a filter to see movement across the network." action={<Btn onClick={() => { setF({ date: "all", mode: "all", status: "all", exception: "all", owner: "all", customer: "all" }); setSearch(""); setLocation(""); }}>Clear filters</Btn>} />}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[{ k: "Arrivals today", n: arrToday.length, tone: "text-info" }, { k: "Departures today", n: depToday.length, tone: "text-cargo-300" }, { k: "Exceptions open", n: openEx.length, tone: "text-warn" }, { k: "Location filter", n: location || "All network", tone: "text-steel-300" }].map((x) => <div key={x.k} className="rounded-lg bg-work-100 px-3 py-2 ring-1 ring-steel-400/10"><p className="t-meta !text-[9px]">{x.k}</p><p className={cn("mt-1 truncate text-[12.5px]", x.tone)}>{x.n}</p></div>)}
          </div>
          <ul className="mt-3 space-y-1.5 sm:hidden">
            {filtered.slice(0, 4).map((s) => <li key={s.id}><button onClick={() => setSelected(s)} className="flex w-full items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-left ring-1 ring-steel-400/12"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: openExceptions(s).length ? "#C93D3A" : shipmentIsDelayed(s) ? "#C07E14" : "#1C6FE8" }} /><span className="min-w-0 flex-1"><span className="block truncate font-mono text-[10.5px] text-frost-50">{s.id}</span><span className="block truncate text-[10.5px] text-steel-500">{s.origin} → {s.destination}</span></span><StageBadge stage={s.stage} /></button></li>)}
          </ul>
        </Panel>

        <Panel title="Movement feed" subtitle="Latest operational events" bodyClass="p-0" action={<StatusBadge tone="info" dot={false}>{filtered.length} visible</StatusBadge>}>
          <div className="max-h-[420px] overflow-y-auto p-3 scroll-thin">
            <EventFeed events={filtered.flatMap((s) => s.activity).sort((a, b) => b.at.localeCompare(a.at))} limit={9} empty="No movement activity for the selected network." />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 md:gap-5">
        <MovementBoard title="Arrivals" subtitle="Destination arrivals" icon={<Package className="h-4 w-4 text-info" />} rows={arrivals.slice(0, 7)} onSelect={setSelected} />
        <MovementBoard title="Departures" subtitle="Vessel, flight, rail and pickup" icon={<Ship className="h-4 w-4 text-cargo-300" />} rows={departures.slice(0, 7)} onSelect={setSelected} />
        <Panel title="Operational action center" subtitle={`${openEx.length} open issues`} action={<Btn size="sm" variant="ghost" onClick={() => nav("/app/control-tower/exceptions")}>Open queue</Btn>} bodyClass="p-3">
          {openEx.length === 0 ? <PositiveState title="Everything looks on track" body="No active exception needs attention." /> : <ul className="space-y-2">{openEx.slice(0, 6).map((e) => { const sh = shipments.find((s) => s.id === e.shipmentId); return <li key={e.id}><button onClick={() => sh && setSelected(sh)} className="flex w-full items-start gap-2.5 rounded-lg bg-white p-2.5 text-left ring-1 ring-steel-400/12 hover:ring-steel-400/30"><span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", e.severity === "Critical" || e.severity === "High" ? "bg-risk" : e.severity === "Medium" ? "bg-warn" : "bg-steel-400")} /><span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-frost-50">{e.type} · {sh?.id}</span><span className="block truncate text-[11px] text-steel-500">{e.description}</span></span><span className="shrink-0 text-[10px] text-steel-500">{relativeAge(e.openedAt)}</span></button></li>; })}</ul>}
        </Panel>
      </div>

      <ShipmentPreviewDrawer shipment={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function MovementBoard({ title, subtitle, icon, rows, onSelect }: { title: string; subtitle: string; icon: React.ReactNode; rows: { s: OperationalShipment; m: OperationalShipment["milestones"][number] }[]; onSelect: (s: OperationalShipment) => void }) {
  return <Panel title={title} subtitle={subtitle} action={icon} bodyClass="p-0">
    {rows.length ? <ul className="divide-y divide-steel-400/[0.08]">{rows.map(({ s, m }) => <li key={s.id + m.id}><button onClick={() => onSelect(s)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-work-100"><span className="w-11 shrink-0 font-mono text-[10.5px] text-steel-500">{formatDate(m.plannedAt).split(",").at(-1)?.trim()}</span><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-work-100 ring-1 ring-steel-400/12"><ModeIcon mode={s.legs.find((l) => l.id === m.legId)?.mode ?? "ocean"} className="h-3.5 w-3.5 text-steel-400" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-frost-50">{m.name}</span><span className="block truncate font-mono text-[10px] text-steel-500">{s.id} · {s.customerName}</span></span><StatusBadge tone={getMilestoneStatus(m) === "Delayed" ? "risk" : getMilestoneStatus(m) === "Completed" ? "ok" : "info"} dot={false}>{getMilestoneStatus(m)}</StatusBadge></button></li>)}</ul> : <p className="px-4 py-8 text-center text-[12px] text-steel-500">No movement windows scheduled.</p>}
  </Panel>;
}

export function ExceptionCenterPage() {
  const { shipments, exceptions, updateException } = useExecution();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState({ severity: "all", type: "all", owner: "all", customer: "all", mode: "all", status: "all", overdue: "all" });
  const [selected, setSelected] = useState<(OperationalException & { shipmentCustomer?: string; route?: string; stage?: string }) | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<ExceptionStatus>("Open");
  const [resolution, setResolution] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [preventive, setPreventive] = useState("");
  const [error, setError] = useState("");
  const open = exceptions.filter((e) => !["Resolved", "Closed"].includes(e.status));
  const term = q.trim().toLowerCase();
  const rows = exceptions.filter((e) => {
    const sh = shipments.find((s) => s.id === e.shipmentId);
    if (term && ![e.id, e.shipmentId, e.type, e.description, sh?.customerName ?? ""].some((x) => x.toLowerCase().includes(term))) return false;
    if (f.severity !== "all" && e.severity !== f.severity) return false;
    if (f.type !== "all" && e.type !== f.type) return false;
    if (f.owner !== "all" && e.owner !== f.owner) return false;
    if (f.customer !== "all" && sh?.customerName !== f.customer) return false;
    if (f.mode !== "all" && !sh?.legs.some((l) => l.mode === f.mode)) return false;
    if (f.status !== "all" && e.status !== f.status) return false;
    if (f.overdue === "yes" && new Date(e.dueAt).getTime() >= new Date(DEMO_EXEC_NOW).getTime()) return false;
    return true;
  }).sort((a, b) => (a.severity === "Critical" ? -1 : b.severity === "Critical" ? 1 : a.dueAt.localeCompare(b.dueAt)));
  const now = new Date(DEMO_EXEC_NOW).getTime();
  const today = DEMO_EXEC_NOW.slice(0, 10);
  const setFilter = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const startEdit = (e: typeof selected) => { setSelected(e); setOwner(e?.owner ?? ""); setStatus(e?.status ?? "Open"); setResolution(e?.resolutionNote ?? ""); setRootCause(e?.rootCause ?? ""); setPreventive(e?.preventiveAction ?? ""); setError(""); setEditOpen(true); };
  const save = () => {
    if (!selected) return;
    if ((status === "Resolved" || status === "Closed") && !resolution.trim()) { setError("A resolution note is required to resolve an exception."); return; }
    updateException(selected.shipmentId, selected.id, { owner, status, resolutionNote: resolution || undefined, rootCause: rootCause || undefined, preventiveAction: preventive || undefined, resolvedAt: status === "Resolved" || status === "Closed" ? DEMO_EXEC_NOW : undefined });
    setEditOpen(false);
  };
  const count = (severity: string) => open.filter((e) => e.severity === severity).length;
  const tone = (severity: string): ToneKey => severity === "Critical" || severity === "High" ? "risk" : severity === "Medium" ? "warn" : "neutral";
  const options = (key: keyof typeof f, values: string[]) => <select value={f[key]} onChange={(e) => setFilter(key, e.target.value)} aria-label={`Filter by ${key}`} className={cn("h-8 max-w-[180px] appearance-none rounded-lg border pl-2.5 pr-6 text-[12px] outline-none", f[key] !== "all" ? "border-cargo-400/50 bg-cargo-400/[0.08] text-frost-50" : "border-steel-400/20 bg-white text-steel-300")}><option value="all">All {key}</option>{values.map((x) => <option key={x} value={x}>{x}</option>)}</select>;

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Control Tower · Risk management" title="Exceptions" support="Triage, assign and resolve operational issues across active shipments." actions={<Btn variant="primary" onClick={() => nav("/app/control-tower")}>Control Tower Map</Btn>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Critical" value={count("Critical")} icon={ShieldAlert} tone="risk" secondary="Immediate attention" />
        <KpiCard label="High" value={count("High")} icon={AlertTriangle} tone="warn" secondary="Urgent" />
        <KpiCard label="Open" value={open.length} icon={Radar} tone="info" secondary="All severities" />
        <KpiCard label="Overdue" value={open.filter((e) => new Date(e.dueAt).getTime() < now).length} icon={Clock3} tone="risk" secondary="Past due time" />
        <KpiCard label="Resolved today" value={exceptions.filter((e) => e.resolvedAt?.slice(0, 10) === today).length} icon={Check} tone="ok" secondary="Kept in history" />
      </div>
      <Panel bodyClass="p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[210px] flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shipment, customer, exception…" className="h-9 w-full rounded-lg border border-steel-400/22 bg-white pl-9 pr-3 text-[13px] text-frost-50 outline-none focus:border-cargo-400" /></div>
          {options("severity", [...EXCEPTION_SEVERITIES])}
          {options("type", [...new Set(exceptions.map((e) => e.type))])}
          {options("owner", [...new Set(exceptions.map((e) => e.owner))])}
          {options("customer", [...new Set(exceptions.map((e) => shipments.find((s) => s.id === e.shipmentId)?.customerName ?? "").filter((x) => !!x))])}
          {options("mode", ["truck", "ocean", "air", "rail"])}
          {options("status", [...EXCEPTION_STATUSES])}
          {options("overdue", ["yes"])}
          <span className="ml-auto font-mono text-[10px] text-steel-500">{rows.length} results</span>
        </div>
      </Panel>

      <Panel bodyClass="p-0">
        {rows.length === 0 ? <EmptyState title="No exceptions match these filters" body={open.length === 0 ? "Everything looks on track across the network." : "Clear filters to see other issues."} /> : <div className="overflow-x-auto scroll-thin"><table className="w-full min-w-[1040px] text-left text-[12.5px]"><caption className="sr-only">Exception queue</caption><thead className="border-b border-steel-400/12 bg-work-50/70"><tr className="[&>th]:px-3.5 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500"><th>Severity</th><th>Shipment</th><th>Customer</th><th>Exception</th><th>Leg</th><th>Owner</th><th>Opened</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((e) => { const sh = shipments.find((s) => s.id === e.shipmentId); const leg = sh?.legs.find((l) => l.id === e.legId); const overdue = new Date(e.dueAt).getTime() < now && !["Resolved", "Closed"].includes(e.status); return <tr key={e.id} className="border-b border-steel-400/[0.07] last:border-0 hover:bg-work-100 [&>td]:whitespace-nowrap [&>td]:px-3.5 [&>td]:py-2.5"><td><StatusBadge tone={tone(e.severity)} dot>{e.severity}</StatusBadge></td><td><button onClick={() => sh && nav(`/app/shipments/${sh.id}`)} className="font-mono text-[11.5px] text-cargo-300">{e.shipmentId}</button></td><td className="max-w-[150px] truncate text-steel-300">{sh?.customerName}</td><td className="max-w-[260px] truncate"><span className="block text-frost-50">{e.type}</span><span className="block truncate text-[11px] text-steel-500">{e.description}</span></td><td className="text-steel-400">{leg ? `Leg ${leg.sequence} · ${leg.mode}` : "Shipment"}</td><td className="text-steel-300">{e.owner}</td><td className="text-steel-500">{relativeAge(e.openedAt)}</td><td className={overdue ? "font-medium text-risk" : "text-steel-400"}>{formatDate(e.dueAt)}{overdue ? " · overdue" : ""}</td><td><StatusBadge tone={e.status === "Resolved" || e.status === "Closed" ? "ok" : e.status === "In Progress" ? "info" : "warn"} dot={false}>{e.status}</StatusBadge></td><td><Btn size="sm" onClick={() => startEdit(e)}>Update</Btn></td></tr>; })}</tbody></table></div>}
      </Panel>

      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title={selected?.type ?? "Update exception"} subtitle={selected?.shipmentId} width="sm:max-w-[520px]" footer={<div className="flex justify-between"><Btn size="sm" onClick={() => setEditOpen(false)}>Cancel</Btn><Btn size="sm" variant="primary" onClick={save}>Save update</Btn></div>}>
        {selected && <div className="space-y-4"><div className="rounded-xl bg-work-100 p-3.5 ring-1 ring-steel-400/12"><div className="flex items-center justify-between"><span className="text-[12.5px] text-frost-50">{selected.type}</span><StatusBadge tone={tone(selected.severity)} dot={false}>{selected.severity}</StatusBadge></div><p className="mt-1 text-[12px] leading-relaxed text-steel-400">{selected.description}</p><p className="mt-1 font-mono text-[10px] text-steel-500">{selected.id} · {selected.shipmentId}</p></div><div className="grid gap-3 sm:grid-cols-2"><Field id="ex-owner-update" label="Assign owner"><Select id="ex-owner-update" options={OWNERS.map((x) => ({ v: x, l: x }))} value={owner} onChange={(e) => setOwner(e.target.value)} /></Field><Field id="ex-status-update" label="Status"><Select id="ex-status-update" options={EXCEPTION_STATUSES.map((x) => ({ v: x, l: x }))} value={status} onChange={(e) => setStatus(e.target.value as ExceptionStatus)} /></Field><Field id="ex-resolution" label="Resolution note" required={status === "Resolved" || status === "Closed"}><Textarea id="ex-resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What resolved the issue?" /></Field><Field id="ex-root" label="Root cause"><Textarea id="ex-root" value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="Optional root cause…" /></Field><Field id="ex-prevent" label="Preventive action" className="sm:col-span-2"><Textarea id="ex-prevent" value={preventive} onChange={(e) => setPreventive(e.target.value)} placeholder="Optional prevention step…" /></Field></div>{error && <p className="text-[12px] text-risk">{error}</p>}</div>}
      </Drawer>
    </div>
  );
}
