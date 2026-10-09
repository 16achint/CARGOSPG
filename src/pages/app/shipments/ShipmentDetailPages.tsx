import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CalendarClock, Check, ChevronRight,
  MoreHorizontal, Plus, Trash2,
} from "lucide-react";
import { useExecution } from "@/context/ExecutionContext";
import { useApp } from "@/context/AppContext";
import { Drawer, EmptyState, Panel, PositiveState, StatusBadge } from "@/components/app/ui/primitives";
import { ActivityTimeline, Btn, Field, Input, PageHead, Row, Select, Textarea } from "@/components/app/commercial/parts";
import { EventFeed, JourneyProgress, JourneyStrip, LegBadge, ModeIcon, PlannedActual, PriorityBadge, StageBadge, TimelineMilestone, formatDate, modeLabel } from "@/components/app/execution/ExecutionParts";
import { ExceptionEditorDrawer, LegEditorDrawer, MilestoneEditorDrawer } from "@/components/app/execution/ExecutionDrawers";
import {
  DEMO_EXEC_NOW, getMilestoneStatus,
  openExceptions, shipmentIsDelayed, type MilestoneStatus, type OperationalShipment, type ShipmentMilestone,
  type ShipmentStage,
} from "@/data/execution";
import { cn } from "@/utils/cn";

function StatusDrawer({ open, onClose, shipment, onSave }: { open: boolean; onClose: () => void; shipment: OperationalShipment; onSave: (stage: ShipmentStage) => void }) {
  const closureReady = shipment.legs.length > 0 && shipment.legs.every((l) => ["Completed", "Cancelled"].includes(l.status)) &&
    shipment.milestones.filter((m) => m.type !== "POD").every((m) => ["Completed", "Skipped"].includes(m.status)) &&
    shipment.milestones.some((m) => m.type === "POD" && ["Completed", "Skipped"].includes(m.status));
  const allowed: ShipmentStage[] = shipment.stage === "Cancelled" ? ["Cancelled"]
    : shipment.stage === "Completed" ? ["Completed"]
      : shipment.stage === "Confirmed" ? ["Documentation", "Pickup", "Cancelled"]
        : shipment.stage === "Pickup" ? ["Pickup", "Customs", "Gate-In", "In Transit", "Cancelled"]
          : shipment.stage === "In Transit" ? ["In Transit", "Transshipment", "Destination", "Delivery", "Cancelled"]
          : shipment.stage === "Destination" ? ["Destination", "Delivery", ...(closureReady ? ["Completed" as const] : []), "Cancelled"]
            : [shipment.stage, "Pickup", "Customs", "Gate-In", "In Transit", "Transshipment", "Destination", "Delivery", ...(closureReady ? ["Completed" as const] : []), "Cancelled"];
  const [stage, setStage] = useState<ShipmentStage>(shipment.stage);
  return (
    <Drawer open={open} onClose={onClose} title="Update shipment stage" subtitle={shipment.id}
      footer={<div className="flex justify-between"><Btn size="sm" onClick={onClose}>Cancel</Btn><Btn size="sm" variant="primary" onClick={() => { onSave(stage); onClose(); }}>Save stage</Btn></div>}>
      <div className="space-y-4">
        <div className="rounded-xl bg-work-100 p-3.5 ring-1 ring-steel-400/12"><p className="text-[12.5px] text-steel-400">Current stage</p><div className="mt-1"><StageBadge stage={shipment.stage} /></div></div>
        <Field id="stage-update" label="New operational stage" required>
          <Select id="stage-update" value={stage} options={allowed.map((v) => ({ v, l: v }))} onChange={(e) => setStage(e.target.value as ShipmentStage)} />
        </Field>
        <p className="text-[11.5px] leading-relaxed text-steel-500">Exceptions can exist alongside a shipment stage. Critical operational changes are written to the activity timeline.</p>
      </div>
    </Drawer>
  );
}

function CancelDrawer({ open, onClose, shipment, onCancel }: { open: boolean; onClose: () => void; shipment: OperationalShipment; onCancel: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Drawer open={open} onClose={onClose} title="Cancel shipment?" subtitle={shipment.id}
      footer={<div className="flex justify-between"><Btn size="sm" onClick={onClose}>Keep shipment</Btn><Btn size="sm" variant="danger" disabled={!reason.trim()} onClick={() => { onCancel(reason); setReason(""); onClose(); }}>Cancel shipment</Btn></div>}>
      <div className="space-y-4">
        <div className="rounded-xl bg-risk/[0.06] p-3.5 ring-1 ring-risk/25">
          <p className="text-[13px] font-medium text-frost-50">This is a significant action.</p>
          <p className="mt-1 text-[12px] leading-relaxed text-steel-400">The shipment will be marked Cancelled, planned legs will stop, and the activity history will remain available.</p>
        </div>
        <Field id="cancel-reason" label="Cancellation reason" required><Textarea id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this shipment being cancelled?" /></Field>
      </div>
    </Drawer>
  );
}

/* =========================================================
   SHIPMENT 360
   ========================================================= */
const TABS = ["Overview", "Journey", "Milestones", "Documents", "Customs", "Warehouse", "Vendors", "Costs", "Invoices", "Profitability", "Activity"] as const;

export function Shipment360Page() {
  const { shipmentId = "" } = useParams();
  const nav = useNavigate();
  const { notify } = useApp();
  const { shipmentById, addLeg, addMilestone, addShipmentNote, updateStage, cancelShipment, addException } = useExecution();
  const s = shipmentById(shipmentId);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [legDrawer, setLegDrawer] = useState(false);
  const [milestoneDrawer, setMilestoneDrawer] = useState(false);
  const [exceptionDrawer, setExceptionDrawer] = useState(false);
  const [statusDrawer, setStatusDrawer] = useState(false);
  const [cancelDrawer, setCancelDrawer] = useState(false);
  const [noteDrawer, setNoteDrawer] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  if (!s) return <EmptyState title="Shipment not found" body="This master shipment may have been removed." action={<Btn onClick={() => nav("/app/shipments")}>Back to Shipments</Btn>} />;

  const current = s.legs.find((l) => ["In Progress", "Delayed", "Exception", "Ready"].includes(l.status));
  const next = s.milestones.map((m) => ({ m, st: getMilestoneStatus(m) })).find((x) => !["Completed", "Skipped"].includes(x.st))?.m;
  const open = openExceptions(s);
  const tabChange = (v: (typeof TABS)[number]) => {
    setTab(v);
    if (v === "Journey") nav(`/app/shipments/${s.id}/journey`);
    if (v === "Milestones") nav(`/app/shipments/${s.id}/milestones`);
  };

  const actions = (
    <>
      <Btn size="sm" onClick={() => setStatusDrawer(true)} icon={<ChevronRight className="h-3.5 w-3.5" />}>Update Status</Btn>
      <Btn size="sm" onClick={() => setLegDrawer(true)} icon={<Plus className="h-3.5 w-3.5" />}>Add Leg</Btn>
      <Btn size="sm" onClick={() => setMilestoneDrawer(true)} icon={<CalendarClock className="h-3.5 w-3.5" />}>Add Milestone</Btn>
      <Btn size="sm" variant="primary" onClick={() => setExceptionDrawer(true)} icon={<AlertTriangle className="h-3.5 w-3.5" />}>Report Exception</Btn>
      <div className="relative">
        <Btn size="sm" onClick={() => setMoreOpen((x) => !x)} icon={<MoreHorizontal className="h-3.5 w-3.5" />}>More</Btn>
        {moreOpen && <div className="app-panel absolute right-0 z-30 mt-1 w-48 p-1.5">
          {[["Add internal note", () => setNoteDrawer(true)], ["Upload document", () => notify("Document vault arrives in the Documents phase")], ["Assign vendor", () => nav(`/app/shipments/${s.id}/journey`)], ["Cancel shipment", () => setCancelDrawer(true)]].map(([label, cb]) => (
            <button key={label as string} onClick={() => { setMoreOpen(false); (cb as () => void)(); }} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-steel-300 hover:bg-work-200 hover:text-frost-50">{label as string}</button>
          ))}
        </div>}
      </div>
    </>
  );

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={() => nav("/app/shipments")} className="mb-2 text-[12px] text-steel-500 transition hover:text-frost-50">← Shipments</button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-mono text-[21px] font-medium tracking-[-0.025em] text-frost-50 md:text-[25px]">{s.id}</h1>
            <StageBadge stage={s.stage} />
            <PriorityBadge priority={s.priority} />
            {open.length > 0 && <StatusBadge tone={open.some((e) => e.severity === "Critical") ? "risk" : "warn"} dot={false}>{open.length} open exception{open.length > 1 ? "s" : ""}</StatusBadge>}
          </div>
          <p className="mt-1.5 text-[13px] text-steel-400">{s.customerName} · {s.origin} <span className="text-steel-500">→</span> {s.destination}</p>
          <p className="mt-1 font-mono text-[10.5px] text-steel-500">Booking {s.bookingId} · Quote {s.quoteId} · RFQ {s.rfqId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <Panel title="Overall progress" bodyClass="p-3.5"><JourneyProgress shipment={s} /></Panel>
        <Panel title="On-time status" bodyClass="p-3.5"><div className="mt-1"><StatusBadge tone={shipmentIsDelayed(s) ? "warn" : "ok"}>{shipmentIsDelayed(s) ? "At risk" : "On schedule"}</StatusBadge></div></Panel>
        <Panel title="Journey" bodyClass="p-3.5"><div className="t-num mt-1 text-[19px] font-light text-frost-50">{s.legs.filter((l) => l.status === "Completed").length}<span className="text-steel-500"> / {s.legs.length} legs</span></div></Panel>
        <Panel title="Documents" bodyClass="p-3.5"><div className="t-num mt-1 text-[19px] font-light text-frost-50">{s.documentComplete}<span className="text-steel-500"> / {s.documentTotal}</span></div></Panel>
        <Panel title="Exceptions" bodyClass="p-3.5"><div className={cn("t-num mt-1 text-[19px] font-light", open.length ? "text-risk" : "text-ok")}>{open.length}<span className="ml-1 text-[12px] text-steel-500">open</span></div></Panel>
        <Panel title="Next milestone" bodyClass="p-3.5"><div className="mt-1 truncate text-[12px] font-medium text-frost-50">{next?.name ?? "No upcoming milestone"}</div><div className="mt-0.5 font-mono text-[10px] text-steel-500">ETA {s.eta}</div></Panel>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-steel-400/12 scroll-thin">
        {TABS.map((t) => <button key={t} onClick={() => tabChange(t)} aria-current={tab === t ? "page" : undefined} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition", tab === t ? "bg-work-200 text-frost-50" : "text-steel-400 hover:text-frost-50")}>{t}</button>)}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr] md:gap-5">
          <div className="space-y-4 md:space-y-5">
            <Panel title="Journey snapshot" subtitle={`${s.legs.length} connected transport leg${s.legs.length === 1 ? "" : "s"}`} action={<Btn size="sm" variant="ghost" onClick={() => nav(`/app/shipments/${s.id}/journey`)}>Open Journey</Btn>}>
               {s.legs.length ? <JourneyStrip shipment={s} selectedLegId={current?.id} onLeg={(l) => { setTab("Journey"); nav(`/app/shipments/${s.id}/journey?leg=${l.id}`); }} /> : <EmptyState title="Journey not built yet" body="Add the movement legs under this master shipment." action={<Btn variant="primary" onClick={() => nav(`/app/shipments/${s.id}/journey`)}>Build Journey</Btn>} />}
            </Panel>

            <Panel title="Current leg" subtitle={current ? `Leg ${current.sequence} of ${s.legs.length} · ${modeLabel(current.mode)}` : "No active leg"}>
              {current ? <CurrentLegCard shipment={s} leg={current} onView={() => { setTab("Journey"); nav(`/app/shipments/${s.id}/journey?leg=${current.id}`); }} /> : <p className="text-[12.5px] text-steel-500">Journey execution has not started.</p>}
            </Panel>

            <Panel title="Recent activity" subtitle="Latest operational updates" action={<Btn size="sm" variant="ghost" onClick={() => setTab("Activity")}>View all</Btn>}>
              <EventFeed events={s.activity} limit={5} />
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel title="Shipment summary">
              <dl className="grid gap-x-5 sm:grid-cols-2">
                <Row k="Customer" v={s.customerName} />
                <Row k="Booking" v={s.bookingId} mono />
                <Row k="RFQ" v={s.rfqId} mono />
                <Row k="Accepted quote" v={s.quoteId} mono />
                <Row k="Cargo" v={s.cargo.commodity} />
                <Row k="Service" v={s.service} />
                <Row k="Owner" v={s.owner} />
                <Row k="Team" v={s.team} />
                <Row k="Created" v={s.createdAt} />
                <Row k="Planned completion" v={s.plannedCompletion} />
                <Row k="Current ETA" v={s.eta} />
                <Row k="Customer reference" v={s.customerVisibleRef ?? "—"} mono />
              </dl>
            </Panel>

            <Panel title="Next milestone" subtitle={next ? `Planned ${formatDate(next.plannedAt)}` : "No planned milestone"} action={<Btn size="sm" variant="ghost" onClick={() => nav(`/app/shipments/${s.id}/milestones`)}>Milestones</Btn>}>
              {next ? <div className="flex items-start gap-3 rounded-xl bg-work-100 p-3 ring-1 ring-steel-400/10"><span className="grid h-8 w-8 place-items-center rounded-lg bg-info/10 ring-1 ring-info/20"><CalendarClock className="h-4 w-4 text-info" /></span><div><p className="text-[13px] font-medium text-frost-50">{next.name}</p><p className="mt-0.5 text-[11.5px] text-steel-500">{next.owner} · {formatDate(next.plannedAt)}</p></div></div> : <PositiveState title="No pending milestones" body="Plan milestones for the remaining movement." />}
            </Panel>

            <Panel title="Exceptions" subtitle={`${open.length} active`} action={<Btn size="sm" variant="ghost" onClick={() => nav("/app/control-tower/exceptions")}>Exception Center</Btn>}>
              {open.length ? <ul className="space-y-2">{open.slice(0, 3).map((e) => <li key={e.id} className="rounded-xl bg-risk/[0.045] p-3 ring-1 ring-risk/20"><div className="flex items-center justify-between gap-2"><span className="text-[12.5px] font-medium text-frost-50">{e.type}</span><StatusBadge tone={e.severity === "Critical" || e.severity === "High" ? "risk" : "warn"} dot={false}>{e.severity}</StatusBadge></div><p className="mt-1 text-[11.5px] leading-snug text-steel-400">{e.description}</p><span className="mt-1 block font-mono text-[10px] text-steel-500">{e.id} · {e.owner}</span></li>)}</ul> : <PositiveState title="No active exceptions" body="Everything looks on track." />}
            </Panel>

            <Panel title="Pending actions">
              <PendingActions shipment={s} onJourney={() => nav(`/app/shipments/${s.id}/journey`)} onMilestones={() => nav(`/app/shipments/${s.id}/milestones`)} />
            </Panel>

            <Panel title="Important references">
              <dl className="space-y-0.5">
                <Row k="Internal ref" v={s.internalRef || "—"} mono />
                <Row k="Booking ref" v={s.bookingRef} mono />
                {s.legs.flatMap((l) => l.tracking).slice(0, 3).map((t) => <Row key={t.type + t.value} k={t.type} v={t.value} mono />)}
              </dl>
            </Panel>
          </div>
        </div>
      )}

      {tab === "Journey" && <div className="app-panel p-5"><JourneyStrip shipment={s} /></div>}
      {tab === "Milestones" && <div className="app-panel p-5"><p className="text-[13px] text-steel-400">Milestone workspace is opening…</p></div>}
      {tab === "Activity" && <Panel title="Shipment activity" subtitle={`${s.activity.length} events`}><EventFeed events={s.activity} /></Panel>}
      {["Documents", "Customs", "Warehouse", "Costs", "Invoices", "Profitability"].includes(tab) && <FutureTab tab={tab} shipment={s} />}
      {tab === "Vendors" && <VendorsTab shipment={s} />}

      <LegEditorDrawer open={legDrawer} onClose={() => setLegDrawer(false)} shipment={s} onSave={(l) => addLeg(s.id, l)} />
      <MilestoneEditorDrawer open={milestoneDrawer} onClose={() => setMilestoneDrawer(false)} shipment={s} onSave={(m) => addMilestone(s.id, m)} />
      <ExceptionEditorDrawer open={exceptionDrawer} onClose={() => setExceptionDrawer(false)} shipment={s} onSave={(x) => addException(s.id, x)} />
      <StatusDrawer key={`${s.id}-${statusDrawer}-${s.stage}`} open={statusDrawer} onClose={() => setStatusDrawer(false)} shipment={s} onSave={(stage) => updateStage(s.id, stage)} />
      <CancelDrawer open={cancelDrawer} onClose={() => setCancelDrawer(false)} shipment={s} onCancel={(reason) => cancelShipment(s.id, reason)} />
      <NoteDrawer open={noteDrawer} onClose={() => setNoteDrawer(false)} shipment={s} onSave={(body, legId, customer) => addShipmentNote(s.id, body, legId, customer)} />
    </div>
  );
}

function CurrentLegCard({ shipment, leg, onView }: { shipment: OperationalShipment; leg: OperationalShipment["legs"][number]; onView: () => void }) {
  const { updateLeg, startExecution } = useExecution();
  return (
    <div className="rounded-xl bg-work-100 p-3.5 ring-1 ring-steel-400/12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white ring-1 ring-steel-400/15"><ModeIcon mode={leg.mode} className="h-4 w-4 text-cargo-300" /></span><div><p className="text-[13px] font-medium text-frost-50">{leg.origin} → {leg.destination}</p><p className="text-[11px] text-steel-500">{leg.vendor?.vendorName ?? "Vendor unassigned"} · {modeLabel(leg.mode)}</p></div></div>
        <LegBadge status={leg.status} />
      </div>
      <div className="mt-3 grid gap-x-4 sm:grid-cols-2"><PlannedActual label="Departure" planned={leg.plannedDeparture} actual={leg.actualDeparture} /><PlannedActual label="Arrival" planned={leg.plannedArrival} actual={leg.actualArrival} /></div>
      {leg.tracking.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{leg.tracking.map((r) => <span key={r.type + r.value} className="rounded-md bg-white px-2 py-1 font-mono text-[10.5px] text-steel-400 ring-1 ring-steel-400/12">{r.type}: {r.value}</span>)}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        {!shipment.executionStarted && <Btn size="sm" variant="primary" onClick={() => startExecution(shipment.id)}>Start Execution</Btn>}
        {leg.status !== "Completed" && <Btn size="sm" onClick={() => updateLeg(shipment.id, leg.id, { status: "Completed", actualArrival: leg.actualArrival ?? DEMO_EXEC_NOW })}><Check className="h-3 w-3" /> Mark Leg Complete</Btn>}
        <Btn size="sm" variant="ghost" onClick={onView}>Open leg details <ArrowRight className="h-3 w-3" /></Btn>
      </div>
    </div>
  );
}

function PendingActions({ shipment, onJourney, onMilestones }: { shipment: OperationalShipment; onJourney: () => void; onMilestones: () => void }) {
  const tasks: { label: string; to: () => void; tone: string }[] = [];
  if (shipment.legs.length === 0) tasks.push({ label: "Build the journey legs", to: onJourney, tone: "bg-warn" });
  if (shipment.legs.some((l) => !l.vendor)) tasks.push({ label: "Assign vendor to planned leg", to: onJourney, tone: "bg-warn" });
  if (shipment.milestones.length === 0) tasks.push({ label: "Plan operational milestones", to: onMilestones, tone: "bg-info" });
  if (shipment.documentComplete < shipment.documentTotal) tasks.push({ label: `${shipment.documentTotal - shipment.documentComplete} documents pending`, to: onMilestones, tone: "bg-warn" });
  if (!tasks.length) return <PositiveState title="No blocking actions" body="Shipment setup is complete for its current stage." />;
  return <ul className="space-y-2">{tasks.slice(0, 4).map((t) => <li key={t.label}><button onClick={t.to} className="flex w-full items-center gap-2.5 rounded-lg bg-work-100 p-2.5 text-left ring-1 ring-steel-400/10 transition hover:bg-work-200"><span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.tone)} /><span className="min-w-0 flex-1 text-[12.5px] text-steel-300">{t.label}</span><ChevronRight className="h-3.5 w-3.5 text-steel-500" /></button></li>)}</ul>;
}

function FutureTab({ tab, shipment }: { tab: string; shipment: OperationalShipment }) {
  const title = tab === "Documents" ? "Shipment documents" : tab;
  const message = tab === "Documents" ? "Documents remain linked to this master shipment. Full upload, verification and version history arrive in the Document Vault phase." : `${tab} will be connected to this shipment record in a later CargoOS phase.`;
  return <Panel title={title} subtitle={shipment.id}><div className="py-10 text-center"><p className="text-[13.5px] text-frost-50">{message}</p><p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-steel-500">The shipment ID, customer and journey context are already reserved for this module.</p></div></Panel>;
}

function VendorsTab({ shipment }: { shipment: OperationalShipment }) {
  return <Panel title="Assigned vendors" subtitle="Leg-specific carrier and service assignments" bodyClass="p-0">
    {shipment.legs.length ? <ul className="divide-y divide-steel-400/[0.08]">{shipment.legs.map((l) => <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-work-100 ring-1 ring-steel-400/12"><ModeIcon mode={l.mode} className="h-4 w-4 text-steel-400" /></span><span className="min-w-0 flex-1"><span className="block text-[12.5px] text-frost-50">Leg {l.sequence} · {l.origin} → {l.destination}</span><span className="text-[11px] text-steel-500">{l.vendor?.service ?? "Service not set"}</span></span><span className="text-[12.5px] text-steel-300">{l.vendor?.vendorName ?? "Unassigned"}</span><LegBadge status={l.status} /></li>)}</ul> : <EmptyState title="No journey legs yet" body="Assign vendors after building the journey." />}
  </Panel>;
}

function NoteDrawer({ open, onClose, shipment, onSave }: { open: boolean; onClose: () => void; shipment: OperationalShipment; onSave: (body: string, legId?: string, customer?: boolean) => void }) {
  const [body, setBody] = useState("");
  const [legId, setLegId] = useState("");
  const [customerVisible, setCustomerVisible] = useState(false);
  return <Drawer open={open} onClose={onClose} title="Add shipment note" subtitle={shipment.id} footer={<div className="flex justify-between"><Btn size="sm" onClick={onClose}>Cancel</Btn><Btn size="sm" variant="primary" disabled={!body.trim()} onClick={() => { onSave(body.trim(), legId || undefined, customerVisible); setBody(""); onClose(); }}>Save note</Btn></div>}>
    <div className="space-y-4"><Field id="note-leg" label="Related leg"><Select id="note-leg" value={legId} options={[{ v: "", l: "Shipment-level" }, ...shipment.legs.map((l) => ({ v: l.id, l: `Leg ${l.sequence} · ${l.origin} → ${l.destination}` }))]} onChange={(e) => setLegId(e.target.value)} /></Field><Field id="note-body" label="Note" required><Textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Operational note…" /></Field><label className="flex items-center gap-2 text-[12.5px] text-steel-300"><input type="checkbox" checked={customerVisible} onChange={(e) => setCustomerVisible(e.target.checked)} className="accent-[#1C6FE8]" />Customer-visible remark <span className="text-[11px] text-steel-500">(otherwise internal)</span></label></div>
  </Drawer>;
}

/* =========================================================
   JOURNEY BUILDER / EXECUTION
   ========================================================= */
function ConfirmRemoveLeg({ open, onClose, leg, onConfirm }: { open: boolean; onClose: () => void; leg?: OperationalShipment["legs"][number]; onConfirm: () => void }) {
  if (!leg) return null;
  return <Drawer open={open} onClose={onClose} title={`Remove Leg ${leg.sequence}?`} subtitle={`${leg.origin} → ${leg.destination}`}
    footer={<div className="flex justify-between"><Btn size="sm" onClick={onClose}>Keep leg</Btn><Btn size="sm" variant="danger" onClick={() => { onConfirm(); onClose(); }}>Remove planned leg</Btn></div>}>
    <div className="rounded-xl bg-warn/[0.07] p-3.5 ring-1 ring-warn/25"><p className="text-[13px] font-medium text-frost-50">Only unused planned legs can be removed.</p><p className="mt-1 text-[12px] leading-relaxed text-steel-400">This leg has no completed movement. Related planned milestones will also be removed. Executed legs are locked.</p></div>
  </Drawer>;
}

export function ShipmentJourneyPage() {
  const { shipmentId = "" } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { notify } = useApp();
  const { shipmentById, addLeg, updateLeg, reorderLeg, removeLeg, startExecution, updateStage, addMilestone } = useExecution();
  const s = shipmentById(shipmentId);
  const [selectedId, setSelectedId] = useState(params.get("leg") ?? "");
  const [legFormOpen, setLegFormOpen] = useState(false);
  const [editLeg, setEditLeg] = useState<OperationalShipment["legs"][number] | undefined>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeLegId, setRemoveLegId] = useState<string | undefined>();

  if (!s) return <EmptyState title="Shipment not found" body="This master shipment may have been removed." action={<Btn onClick={() => nav("/app/shipments")}>Back to Shipments</Btn>} />;
  const activeLeg = s.legs.find((l) => l.id === selectedId) ?? s.legs.find((l) => ["In Progress", "Ready", "Delayed", "Exception"].includes(l.status)) ?? s.legs[0];
  const completed = s.legs.filter((l) => l.status === "Completed").length;
  const plannedDurations = s.legs.flatMap((l) => [l.plannedDeparture, l.plannedArrival]).filter(Boolean).sort();
  const continuity = s.legs.slice(1).flatMap((l, i) => {
    const prev = s.legs[i];
    return prev && prev.destination.toLowerCase() !== l.origin.toLowerCase() ? [{ from: prev.destination, to: l.origin, next: l.sequence }] : [];
  });

  const openNewLeg = () => { setEditLeg(undefined); setLegFormOpen(true); };
  const openEditLeg = (l: OperationalShipment["legs"][number]) => { setEditLeg(l); setLegFormOpen(true); };
  const defaultMilestones = () => {
    if (!s.legs.length) { notify("Add at least one leg before planning its milestones."); return; }
    const names = s.legs.flatMap((l) => {
      const departed: ShipmentMilestone["type"] = l.mode === "ocean" ? "Vessel Departed" : l.mode === "air" ? "Flight Departed" : l.mode === "rail" ? "Rail Departed" : "Pickup";
      const idbase = `${s.id.slice(-4)}-${l.sequence}-${Date.now().toString().slice(-3)}`;
      return [
        { id: `MS-${idbase}-D`, legId: l.id, name: l.mode === "truck" ? "Pickup" : `${modeLabel(l.mode)} departed`, type: departed, plannedAt: l.plannedDeparture, status: "Upcoming" as const, owner: s.owner, custom: false, createdAt: "10 Oct, 14:00" },
        { id: `MS-${idbase}-A`, legId: l.id, name: l.mode === "truck" ? "Delivery" : `${l.destination} arrival`, type: l.sequence === s.legs.length ? "Destination Arrival" as const : "Transshipment" as const, plannedAt: l.plannedArrival, status: "Upcoming" as const, owner: s.owner, custom: false, createdAt: "10 Oct, 14:00" },
      ];
    });
    names.forEach((m) => addMilestone(s.id, m));
    notify(`${names.length} milestones planned across ${s.legs.length} legs.`);
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow={`Shipment journey · ${s.id}`} title="Journey Builder" support={`${s.customerName} · ${s.origin} → ${s.destination}`}
        actions={<>
          <Btn onClick={() => nav(`/app/shipments/${s.id}`)}>Shipment 360</Btn>
          <Btn onClick={defaultMilestones} disabled={!s.legs.length}>Plan Milestones</Btn>
          {!s.executionStarted && <Btn variant="primary" onClick={() => { if (startExecution(s.id)) { updateStage(s.id, "Pickup"); notify("Execution started"); } }} disabled={!s.legs.length}>Start Execution</Btn>}
        </>} />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        <Panel title="Total legs" bodyClass="p-3.5"><div className="t-num mt-1 text-[20px] font-light text-frost-50">{s.legs.length}</div></Panel>
        <Panel title="Modes used" bodyClass="p-3.5"><div className="mt-1 flex gap-2">{[...new Set(s.legs.map((l) => l.mode))].map((m) => <ModeIcon key={m} mode={m} className="h-4 w-4 text-cargo-300" />)}{!s.legs.length && <span className="text-[12px] text-steel-500">—</span>}</div></Panel>
        <Panel title="Planned start" bodyClass="p-3.5"><div className="mt-1 text-[12.5px] text-frost-50">{plannedDurations[0] ? formatDate(plannedDurations[0]) : s.plannedStart}</div></Panel>
        <Panel title="Planned end" bodyClass="p-3.5"><div className="mt-1 text-[12.5px] text-frost-50">{plannedDurations.at(-1) ? formatDate(plannedDurations.at(-1)!) : s.plannedCompletion}</div></Panel>
        <Panel title="Completed legs" bodyClass="p-3.5"><div className="t-num mt-1 text-[20px] font-light text-ok">{completed}<span className="text-[13px] text-steel-500"> / {s.legs.length}</span></div></Panel>
      </div>

      {continuity.length > 0 && <div className="space-y-2">{continuity.map((w) => <div key={w.next} className="flex items-start gap-2 rounded-xl bg-warn/[0.07] px-3.5 py-2.5 ring-1 ring-warn/25"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" /><p className="text-[12px] leading-relaxed text-frost-100">Route continuity warning before Leg {w.next}: preceding leg ends at <b>{w.from}</b>, next leg starts at <b>{w.to}</b>.</p></div>)}</div>}

      <Panel title="Connected route" subtitle="The journey is one shipment, made up of ordered movement legs." action={<Btn size="sm" variant="primary" onClick={openNewLeg} icon={<Plus className="h-3.5 w-3.5" />}>Add Leg</Btn>}>
        {s.legs.length ? <JourneyStrip shipment={s} selectedLegId={activeLeg?.id} onLeg={(l) => { setSelectedId(l.id); setDetailOpen(true); }} /> : <EmptyState title="No journey legs created yet" body="Build the first movement leg under this master shipment." action={<Btn variant="primary" onClick={openNewLeg} icon={<Plus className="h-3.5 w-3.5" />}>Build Journey</Btn>} />}
      </Panel>

      {s.legs.length > 0 && (
        <Panel title="Journey legs" subtitle={`${s.legs.length} sequenced movement${s.legs.length === 1 ? "" : "s"}`} bodyClass="p-0">
          <ul className="divide-y divide-steel-400/[0.08]">
            {s.legs.map((l, i) => (
              <li key={l.id} className={cn("px-4 py-3.5 transition-colors", activeLeg?.id === l.id && "bg-cargo-400/[0.035]")}>
                <div className="flex flex-wrap items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-work-100 ring-1 ring-steel-400/12"><ModeIcon mode={l.mode} className="h-4 w-4 text-cargo-300" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] text-steel-500">LEG {String(l.sequence).padStart(2, "0")}</span><span className="text-[13.5px] font-medium text-frost-50">{l.origin} → {l.destination}</span><LegBadge status={l.status} /></div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-steel-500"><span>{modeLabel(l.mode)} · {l.vendor?.vendorName ?? "Vendor unassigned"}</span><span>Dep {formatDate(l.plannedDeparture)}</span><span>Arr {formatDate(l.plannedArrival)}</span><span>{l.tracking.length} references</span></div>
                    <div className="mt-2 grid gap-x-5 sm:grid-cols-2"><PlannedActual label="Departure" planned={l.plannedDeparture} actual={l.actualDeparture} /><PlannedActual label="Arrival" planned={l.plannedArrival} actual={l.actualArrival} /></div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!s.executionStarted && <><button disabled={i === 0} onClick={() => reorderLeg(s.id, l.id, -1)} aria-label={`Move Leg ${l.sequence} up`} className="grid h-7 w-7 place-items-center rounded-md text-steel-500 hover:bg-work-200 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button><button disabled={i === s.legs.length - 1} onClick={() => reorderLeg(s.id, l.id, 1)} aria-label={`Move Leg ${l.sequence} down`} className="grid h-7 w-7 place-items-center rounded-md text-steel-500 hover:bg-work-200 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button></>}
                    <Btn size="sm" onClick={() => { setSelectedId(l.id); setDetailOpen(true); }}>Details</Btn>
                    <Btn size="sm" onClick={() => openEditLeg(l)}>Edit</Btn>
                    {!s.executionStarted && <button onClick={() => { setRemoveLegId(l.id); setRemoveOpen(true); }} aria-label={`Remove leg ${l.sequence}`} className="grid h-7 w-7 place-items-center rounded-md text-steel-500 transition hover:bg-risk/[0.08] hover:text-risk"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] md:gap-5">
        <Panel title="Journey checks" subtitle="Leg dependencies and execution readiness">
          <ul className="space-y-2.5">
            {[
              { label: "At least one movement leg", ok: s.legs.length > 0 },
              { label: "Every leg has a mode, route and planned dates", ok: s.legs.every((l) => l.mode && l.origin && l.destination && l.plannedDeparture && l.plannedArrival) },
              { label: "Vendor / carrier assigned to each leg", ok: s.legs.length > 0 && s.legs.every((l) => !!l.vendor) },
              { label: "Milestones planned", ok: s.milestones.length > 0 },
              { label: "Tracking reference present", ok: s.legs.some((l) => l.tracking.length > 0) },
            ].map((x) => <li key={x.label} className="flex items-center gap-2.5 rounded-lg bg-work-100 px-3 py-2.5 ring-1 ring-steel-400/10"><span className={cn("grid h-4 w-4 place-items-center rounded-full ring-1", x.ok ? "bg-ok/10 ring-ok/30" : "bg-white ring-steel-400/20")}>{x.ok && <Check className="h-2.5 w-2.5 text-ok" strokeWidth={3} />}</span><span className={cn("text-[12.5px]", x.ok ? "text-frost-100" : "text-steel-500")}>{x.label}</span></li>)}
          </ul>
        </Panel>
        <Panel title="Execution activity" subtitle="Journey changes">
          <EventFeed events={s.activity.filter((a) => ["leg", "vendor", "tracking", "status"].includes(a.kind))} limit={5} empty="No journey changes recorded yet." />
        </Panel>
      </div>

      {activeLeg && <LegDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} shipment={s} leg={activeLeg} onEdit={() => { setDetailOpen(false); openEditLeg(activeLeg); }} onException={() => { notify("Use Report Exception from Shipment 360 to attach an exception to this leg."); }} onUpdate={(patch) => updateLeg(s.id, activeLeg.id, patch)} />}
      <LegEditorDrawer open={legFormOpen} onClose={() => setLegFormOpen(false)} shipment={s} leg={editLeg} onSave={(l) => { if (s.legs.some((x) => x.id === l.id)) updateLeg(s.id, l.id, l); else addLeg(s.id, l); setSelectedId(l.id); notify(`Leg ${l.sequence} saved.`); }} />
      <ConfirmRemoveLeg open={removeOpen} onClose={() => setRemoveOpen(false)} leg={s.legs.find((l) => l.id === removeLegId)} onConfirm={() => removeLeg(s.id, removeLegId ?? "")} />
    </div>
  );
}

function LegDetailDrawer({ open, onClose, shipment, leg, onEdit, onException, onUpdate }: { open: boolean; onClose: () => void; shipment: OperationalShipment; leg: OperationalShipment["legs"][number]; onEdit: () => void; onException: () => void; onUpdate: (patch: Partial<OperationalShipment["legs"][number]>) => void }) {
  return <Drawer open={open} onClose={onClose} title={`Leg ${leg.sequence} · ${modeLabel(leg.mode)}`} subtitle={`${shipment.id} · ${leg.origin} → ${leg.destination}`} width="sm:max-w-[500px]"
    footer={<div className="flex flex-wrap justify-between gap-2"><Btn size="sm" onClick={onException}><AlertTriangle className="h-3.5 w-3.5" />Report issue</Btn><div className="flex gap-2"><Btn size="sm" onClick={onEdit}>Edit leg</Btn>{leg.status !== "Completed" && <Btn size="sm" variant="primary" onClick={() => { onUpdate({ status: "Completed", actualArrival: leg.actualArrival ?? DEMO_EXEC_NOW }); onClose(); }}>Mark complete</Btn>}</div></div>}>
    <div className="space-y-4">
      <div className="flex items-center justify-between"><LegBadge status={leg.status} /><span className="text-[11.5px] text-steel-500">Sequence {leg.sequence} of {shipment.legs.length}</span></div>
      <div className="grid gap-2.5 sm:grid-cols-2"><div className="rounded-xl bg-white p-3 ring-1 ring-steel-400/12"><p className="t-meta !text-[9px]">Origin</p><p className="mt-1 text-[13px] text-frost-50">{leg.origin}</p><p className="font-mono text-[10px] text-steel-500">{leg.originCode}</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-steel-400/12"><p className="t-meta !text-[9px]">Destination</p><p className="mt-1 text-[13px] text-frost-50">{leg.destination}</p><p className="font-mono text-[10px] text-steel-500">{leg.destCode}</p></div></div>
      <Panel title="Planned vs actual"><PlannedActual label="Departure" planned={leg.plannedDeparture} actual={leg.actualDeparture} /><PlannedActual label="Arrival" planned={leg.plannedArrival} actual={leg.actualArrival} /></Panel>
      <Panel title="Assignment"><dl><Row k="Vendor" v={leg.vendor?.vendorName ?? "Unassigned"} /><Row k="Service" v={leg.vendor?.service ?? modeLabel(leg.mode)} /><Row k="Contact" v={leg.vendor?.contact ?? "—"} /><Row k="Assigned" v={leg.vendor?.assignedAt ?? "—"} /><Row k="Rate reference" v={leg.vendor?.rateRef ?? "—"} /></dl></Panel>
      <Panel title="Mode details"><dl>{Object.entries(leg.modeData).filter(([, v]) => v).map(([k, v]) => <Row key={k} k={k.replace(/([A-Z])/g, " $1")} v={v} />)}</dl></Panel>
      <Panel title="Tracking references"><ul className="space-y-2">{leg.tracking.length ? leg.tracking.map((x) => <li key={x.type + x.value} className="flex items-center justify-between rounded-lg bg-work-100 px-3 py-2"><span className="text-[11.5px] text-steel-500">{x.type}</span><span className="font-mono text-[11.5px] text-frost-100">{x.value}</span></li>) : <li className="text-[12px] text-steel-500">No references added.</li>}</ul></Panel>
      {leg.notes && <Panel title="Leg notes"><p className="text-[12.5px] leading-relaxed text-steel-300">{leg.notes}</p></Panel>}
    </div>
  </Drawer>;
}

function MilestoneUpdateDrawer({ open, onClose, milestone, onSave }: { open: boolean; onClose: () => void; milestone: ShipmentMilestone; onSave: (patch: Partial<ShipmentMilestone>) => void }) {
  const [actualDate, setActualDate] = useState(milestone.actualAt?.slice(0, 10) ?? "2025-10-10");
  const [actualTime, setActualTime] = useState(milestone.actualAt?.slice(11, 16) ?? "14:00");
  const [status, setStatus] = useState<MilestoneStatus>(milestone.status);
  const [internal, setInternal] = useState(milestone.internalRemark ?? "");
  const [customer, setCustomer] = useState(milestone.customerRemark ?? "");
  return <Drawer open={open} onClose={onClose} title="Update milestone" subtitle={milestone.name} width="sm:max-w-[500px]"
    footer={<div className="flex justify-between gap-2"><Btn size="sm" onClick={onClose}>Cancel</Btn><div className="flex gap-2"><Btn size="sm" onClick={() => { onSave({ status: "Completed", actualAt: `${actualDate}T${actualTime}`, internalRemark: internal || undefined, customerRemark: customer || undefined }); onClose(); }}><Check className="h-3.5 w-3.5" />Complete now</Btn><Btn size="sm" variant="primary" onClick={() => { onSave({ status, actualAt: status === "Completed" ? `${actualDate}T${actualTime}` : undefined, internalRemark: internal || undefined, customerRemark: customer || undefined }); onClose(); }}>Save update</Btn></div></div>}>
    <div className="space-y-4">
      <div className="rounded-xl bg-work-100 p-3 ring-1 ring-steel-400/10"><p className="t-meta !text-[9px]">Planned</p><p className="mt-1 text-[12.5px] text-frost-100">{formatDate(milestone.plannedAt)}</p></div>
      <div className="grid gap-3 sm:grid-cols-2"><Field id="actual-date" label="Actual date"><Input id="actual-date" type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} /></Field><Field id="actual-time" label="Actual time"><Input id="actual-time" type="time" value={actualTime} onChange={(e) => setActualTime(e.target.value)} /></Field></div>
      <Field id="ms-status" label="Milestone state"><Select id="ms-status" options={["Upcoming", "Due Soon", "Completed", "Delayed", "Exception", "Skipped"].map((x) => ({ v: x, l: x }))} value={status} onChange={(e) => setStatus(e.target.value as MilestoneStatus)} /></Field>
      <Field id="ms-internal" label="Internal remark"><Textarea id="ms-internal" value={internal} onChange={(e) => setInternal(e.target.value)} placeholder="Internal operations note…" /></Field>
      <Field id="ms-customer" label="Customer-visible remark" hint="Only this field can later appear in customer tracking."><Textarea id="ms-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Optional update shared with the customer…" /></Field>
    </div>
  </Drawer>;
}

export function ShipmentMilestonesPage() {
  const { shipmentId = "" } = useParams();
  const nav = useNavigate();
  const { notify } = useApp();
  const { shipmentById, addMilestone, updateMilestone } = useExecution();
  const s = shipmentById(shipmentId);
  const [addOpen, setAddOpen] = useState(false);
  const [editMilestone, setEditMilestone] = useState<ShipmentMilestone | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "delayed" | "completed">("all");
  if (!s) return <EmptyState title="Shipment not found" body="This master shipment may have been removed." action={<Btn onClick={() => nav("/app/shipments")}>Back to Shipments</Btn>} />;

  const entries = s.milestones.map((m) => ({ m, state: getMilestoneStatus(m) })).filter(({ state }) => {
    if (filter === "upcoming") return ["Upcoming", "Due Soon"].includes(state);
    if (filter === "delayed") return state === "Delayed" || state === "Exception";
    if (filter === "completed") return state === "Completed" || state === "Skipped";
    return true;
  }).sort((a, b) => a.m.plannedAt.localeCompare(b.m.plannedAt));
  const delayedCount = s.milestones.filter((m) => getMilestoneStatus(m) === "Delayed").length;
  const completeCount = s.milestones.filter((m) => getMilestoneStatus(m) === "Completed").length;

  const standardMilestones = () => {
    if (!s.legs.length) { notify("Build the journey before planning milestones."); return; }
    let count = 0;
    s.legs.forEach((l) => {
      const departType: ShipmentMilestone["type"] = l.mode === "ocean" ? "Vessel Departed" : l.mode === "air" ? "Flight Departed" : l.mode === "rail" ? "Rail Departed" : "Pickup";
      const suffix = `${l.sequence}-${Date.now().toString().slice(-3)}`;
      addMilestone(s.id, { id: `MS-${s.id.slice(-4)}-${suffix}-D`, legId: l.id, name: l.mode === "truck" ? "Pickup" : `${modeLabel(l.mode)} departed`, type: departType, plannedAt: l.plannedDeparture, status: "Upcoming", owner: s.owner, custom: false, createdAt: "10 Oct, 14:00" });
      addMilestone(s.id, { id: `MS-${s.id.slice(-4)}-${suffix}-A`, legId: l.id, name: l.sequence === s.legs.length ? `${l.destination} arrival` : `${l.destination} transfer`, type: l.sequence === s.legs.length ? "Destination Arrival" : "Transshipment", plannedAt: l.plannedArrival, status: "Upcoming", owner: s.owner, custom: false, createdAt: "10 Oct, 14:00" });
      count += 2;
    });
    notify(`${count} standard milestones added across the journey.`);
  };

  const groups = entries.reduce<Record<string, typeof entries>>((acc, x) => {
    const day = x.m.plannedAt.slice(0, 10);
    (acc[day] ??= []).push(x);
    return acc;
  }, {});

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow={`Milestones · ${s.id}`} title="Shipment Milestones" support={`${s.customerName} · ${s.origin} → ${s.destination}`}
        actions={<><Btn onClick={standardMilestones} disabled={!s.legs.length}>Add standard milestones</Btn><Btn variant="primary" onClick={() => setAddOpen(true)} icon={<Plus className="h-3.5 w-3.5" />}>Add Milestone</Btn></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel title="Total milestones" bodyClass="p-3.5"><div className="t-num mt-1 text-[20px] font-light text-frost-50">{s.milestones.length}</div></Panel>
        <Panel title="Completed" bodyClass="p-3.5"><div className="t-num mt-1 text-[20px] font-light text-ok">{completeCount}</div></Panel>
        <Panel title="Delayed" bodyClass="p-3.5"><div className={cn("t-num mt-1 text-[20px] font-light", delayedCount ? "text-risk" : "text-ok")}>{delayedCount}</div></Panel>
        <Panel title="Upcoming" bodyClass="p-3.5"><div className="t-num mt-1 text-[20px] font-light text-info">{s.milestones.length - completeCount - delayedCount}</div></Panel>
      </div>

      <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-steel-400/12 w-fit">
        {(["all", "upcoming", "delayed", "completed"] as const).map((v) => <button key={v} onClick={() => setFilter(v)} aria-pressed={filter === v} className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition", filter === v ? "bg-work-200 text-frost-50" : "text-steel-400 hover:text-frost-50")}>{v}</button>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr] md:gap-5">
        <Panel title="Milestone timeline" subtitle="Planned time vs actual progress" bodyClass="p-4 md:p-5">
          {entries.length === 0 ? <EmptyState title="No milestones planned yet" body="Add milestones to track planned and actual shipment movement." action={<Btn variant="primary" onClick={() => setAddOpen(true)}>Add Milestone</Btn>} /> : (
            <div className="space-y-5">
              {Object.entries(groups).map(([day, group]) => <section key={day}><p className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.15em] text-steel-500">{new Date(day).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}</p><ol className="relative ml-1.5 space-y-1 border-l border-steel-400/18 pl-5">{group.map(({ m }) => <TimelineMilestone key={m.id} milestone={m} onClick={() => setEditMilestone(m)} />)}</ol></section>)}
            </div>
          )}
        </Panel>
        <div className="space-y-4 md:space-y-5">
          <Panel title="Current movement" subtitle={s.legs.length ? `${s.legs.length} legs · ${s.legs.filter((l) => l.status === "Completed").length} complete` : "No journey legs"}>
            {s.legs.length ? <JourneyStrip shipment={s} /> : <EmptyState title="Journey not started" body="Build the journey before attaching milestones." action={<Btn onClick={() => nav(`/app/shipments/${s.id}/journey`)}>Build Journey</Btn>} />}
          </Panel>
          <Panel title="Milestone rules">
            <ul className="space-y-2.5 text-[12px] leading-relaxed text-steel-400">
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-info" />A milestone past its planned time with no actual time is marked Delayed automatically.</li>
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />Completing all movement milestones completes its linked leg.</li>
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cargo-400" />Internal remarks and customer-visible remarks are stored separately.</li>
            </ul>
          </Panel>
          <Panel title="Recent milestone activity"><ActivityTimeline events={s.activity.filter((a) => a.kind === "milestone").slice(0, 5)} empty="No milestone updates recorded." /></Panel>
        </div>
      </div>

      <MilestoneEditorDrawer open={addOpen} onClose={() => setAddOpen(false)} shipment={s} onSave={(m) => { addMilestone(s.id, m); notify("Milestone added."); }} />
      {editMilestone && <MilestoneUpdateDrawer open={!!editMilestone} onClose={() => setEditMilestone(null)} milestone={editMilestone} onSave={(patch) => { updateMilestone(s.id, editMilestone.id, patch); setEditMilestone(null); notify("Milestone updated."); }} />}
    </div>
  );
}

