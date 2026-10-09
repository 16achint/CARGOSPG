import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plane, Save, Ship, TrainFront, Truck } from "lucide-react";
import { Drawer } from "@/components/app/ui/primitives";
import { Btn, Field, Input, Select, Textarea } from "@/components/app/commercial/parts";
import {
  EXCEPTION_SEVERITIES, EXCEPTION_TYPES, EXEC_VENDORS, LEG_STATUSES, MILESTONE_TYPES,
  type ExceptionSeverity, type ExceptionType, type LegStatus, type MilestoneType, type OperationalException,
  type OperationalShipment, type ShipmentLeg, type ShipmentMilestone,
} from "@/data/execution";
import { LOCATIONS } from "@/data/commercial";
import type { Mode } from "@/lib/geo";
import { cn } from "@/utils/cn";

const MODE_OPTIONS: { v: Mode; l: string }[] = [
  { v: "truck", l: "Road" }, { v: "ocean", l: "Sea" }, { v: "air", l: "Air" }, { v: "rail", l: "Rail" },
];
const dateOnly = (s: string) => s ? s.slice(0, 10) : "";
const timeOnly = (s: string) => s ? s.slice(11, 16) : "09:00";
const combine = (date: string, time: string) => date ? `${date}T${time || "09:00"}` : "";

export function LegEditorDrawer({ open, onClose, shipment, leg, onSave }:
  { open: boolean; onClose: () => void; shipment: OperationalShipment; leg?: ShipmentLeg; onSave: (leg: ShipmentLeg) => void }) {
  const isEdit = !!leg;
  const seq = leg?.sequence ?? shipment.legs.length + 1;
  const [mode, setMode] = useState<Mode>(leg?.mode ?? "truck");
  const [origin, setOrigin] = useState(leg?.origin ?? (shipment.legs.at(-1)?.destination ?? shipment.origin));
  const [originCode, setOriginCode] = useState(leg?.originCode ?? (shipment.legs.at(-1)?.destCode ?? shipment.originCode));
  const [destination, setDestination] = useState(leg?.destination ?? "");
  const [destCode, setDestCode] = useState(leg?.destCode ?? "");
  const [departureDate, setDepartureDate] = useState(dateOnly(leg?.plannedDeparture ?? "2025-10-11"));
  const [departureTime, setDepartureTime] = useState(timeOnly(leg?.plannedDeparture ?? "2025-10-11T09:00"));
  const [arrivalDate, setArrivalDate] = useState(dateOnly(leg?.plannedArrival ?? "2025-10-12"));
  const [arrivalTime, setArrivalTime] = useState(timeOnly(leg?.plannedArrival ?? "2025-10-12T17:00"));
  const [vendorId, setVendorId] = useState(leg?.vendor?.vendorId ?? "");
  const [tracking, setTracking] = useState(leg?.tracking.map((x) => `${x.type}: ${x.value}`).join("\n") ?? "");
  const [modeData, setModeData] = useState<Record<string, string>>(leg?.modeData ?? {});
  const [status, setStatus] = useState<LegStatus>(leg?.status ?? "Planned");
  const [notes, setNotes] = useState(leg?.notes ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(leg?.mode ?? "truck");
    setOrigin(leg?.origin ?? (shipment.legs.at(-1)?.destination ?? shipment.origin));
    setOriginCode(leg?.originCode ?? (shipment.legs.at(-1)?.destCode ?? shipment.originCode));
    setDestination(leg?.destination ?? ""); setDestCode(leg?.destCode ?? "");
    setDepartureDate(dateOnly(leg?.plannedDeparture ?? "2025-10-11")); setDepartureTime(timeOnly(leg?.plannedDeparture ?? "2025-10-11T09:00"));
    setArrivalDate(dateOnly(leg?.plannedArrival ?? "2025-10-12")); setArrivalTime(timeOnly(leg?.plannedArrival ?? "2025-10-12T17:00"));
    setVendorId(leg?.vendor?.vendorId ?? ""); setTracking(leg?.tracking.map((x) => `${x.type}: ${x.value}`).join("\n") ?? "");
    setModeData(leg?.modeData ?? {}); setStatus(leg?.status ?? "Planned"); setNotes(leg?.notes ?? ""); setError("");
  }, [open, leg, shipment]);

  const selectedVendor = EXEC_VENDORS.find((v) => v.id === vendorId);
  const departure = combine(departureDate, departureTime), arrival = combine(arrivalDate, arrivalTime);
  const dateError = !!departure && !!arrival && arrival < departure;
  const previousLeg = leg ? shipment.legs.find((l) => l.sequence === leg.sequence - 1) : shipment.legs.at(-1);
  const continuityWarning = !!previousLeg && previousLeg.destination.toLowerCase() !== origin.toLowerCase();

  const locOpts = LOCATIONS.map((l) => ({ v: l.city, l: `${l.city} · ${l.code}` }));
  const setLoc = (which: "origin" | "destination", value: string) => {
    const found = LOCATIONS.find((x) => x.city === value);
    if (which === "origin") { setOrigin(value); setOriginCode(found?.code ?? ""); }
    else { setDestination(value); setDestCode(found?.code ?? ""); }
  };

  const fields = useMemo(() => {
    if (mode === "ocean") return [
      { k: "loadType", l: "FCL / LCL", opts: ["FCL", "LCL", "Breakbulk", "ODC"] },
      { k: "containerType", l: "Container type", opts: ["1 × 20HC", "1 × 40HC", "2 × 40HC", "3 × 40HC", "1 × 40HC RF", "1 × 40OT"] },
      { k: "carrier", l: "Carrier" }, { k: "vessel", l: "Vessel" }, { k: "voyage", l: "Voyage" },
      { k: "pol", l: "Port of loading" }, { k: "pod", l: "Port of discharge" }, { k: "bookingNumber", l: "Carrier booking number" },
    ];
    if (mode === "air") return [{ k: "airline", l: "Airline" }, { k: "flight", l: "Flight" }, { k: "departureAirport", l: "Airport of departure" }, { k: "arrivalAirport", l: "Airport of arrival" }];
    if (mode === "truck") return [{ k: "vehicleType", l: "Vehicle type", opts: ["FTL · 32 ft MXL", "20 ft", "40 ft trailer", "Flatbed", "Reefer truck"] }, { k: "vehicleNumber", l: "Vehicle number" }, { k: "driver", l: "Driver" }, { k: "pickupPoint", l: "Pickup point" }, { k: "deliveryPoint", l: "Delivery point" }];
    return [{ k: "operator", l: "Rail operator" }, { k: "trainService", l: "Train / service reference" }, { k: "icd", l: "ICD" }, { k: "terminal", l: "Port / terminal" }, { k: "container", l: "Container number" }];
  }, [mode]);

  const save = () => {
    setError("");
    if (!mode || !origin || !destination || !departure || !arrival) { setError("Mode, origin, destination, planned departure and planned arrival are required."); return; }
    if (dateError) { setError("Planned arrival cannot precede planned departure."); return; }
    const trackingRefs = tracking.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [type, ...value] = line.split(":");
      return { type: type?.trim() || "Reference", value: value.join(":").trim() || line };
    });
    const saved: ShipmentLeg = {
      id: leg?.id ?? `LEG-${shipment.id.slice(-4)}-${String(seq).padStart(2, "0")}`,
      sequence: leg?.sequence ?? seq, mode, origin, originCode, destination, destCode,
      plannedDeparture: departure, plannedArrival: arrival,
      actualDeparture: leg?.actualDeparture, actualArrival: leg?.actualArrival,
      status, tracking: trackingRefs, modeData,
      vendor: selectedVendor ? { vendorId: selectedVendor.id, vendorName: selectedVendor.name, service: selectedVendor.service, contact: selectedVendor.contact, assignedAt: leg?.vendor?.assignedAt ?? "10 Oct, 14:00", rateRef: leg?.vendor?.rateRef, notes: leg?.vendor?.notes } : undefined,
      expectedCost: leg?.expectedCost, notes, createdAt: leg?.createdAt ?? "10 Oct, 14:00",
    };
    onSave(saved);
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title={isEdit ? `Edit Leg ${seq}` : `Add Leg ${seq}`} subtitle={`${shipment.id} · ${shipment.customerName}`} width="sm:max-w-[620px]"
      footer={<div className="flex items-center justify-between gap-3"><Btn size="sm" onClick={onClose}>Cancel</Btn><Btn size="sm" variant="primary" onClick={save} icon={<Save className="h-3.5 w-3.5" />}>{isEdit ? "Save leg" : "Add leg"}</Btn></div>}>
      <div className="space-y-5">
        <div>
          <p className="t-meta mb-2">Transport mode <span className="text-cargo-400">*</span></p>
          <div className="grid grid-cols-4 gap-2">
            {MODE_OPTIONS.map((m) => {
              const I = m.v === "truck" ? Truck : m.v === "ocean" ? Ship : m.v === "air" ? Plane : TrainFront;
              return <button key={m.v} onClick={() => { setMode(m.v); setModeData({}); }} aria-pressed={mode === m.v}
                className={cn("flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[12.5px] transition", mode === m.v ? "border-cargo-400/55 bg-cargo-400/[0.08] text-frost-50" : "border-steel-400/18 bg-white text-steel-400 hover:border-steel-400/35")}><I className="h-3.5 w-3.5" />{m.l}</button>;
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="leg-origin" label="Origin" required><Select id="leg-origin" options={locOpts} value={origin} onChange={(e) => setLoc("origin", e.target.value)} /></Field>
          <Field id="leg-dest" label="Destination" required><Select id="leg-dest" options={locOpts} value={destination} onChange={(e) => setLoc("destination", e.target.value)} /></Field>
          <Field id="leg-departure" label="Planned departure" required>
            <div className="grid grid-cols-[1fr_88px] gap-2"><Input id="leg-departure" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} /><Input id="leg-departure-time" type="time" aria-label="Planned departure time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} /></div>
          </Field>
          <Field id="leg-arrival" label="Planned arrival" required error={dateError ? "Arrival cannot precede departure." : null}>
            <div className="grid grid-cols-[1fr_88px] gap-2"><Input id="leg-arrival" type="date" error={dateError} value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} /><Input id="leg-arrival-time" type="time" aria-label="Planned arrival time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} /></div>
          </Field>
        </div>

        {continuityWarning && <div className="flex items-start gap-2 rounded-lg bg-warn/[0.07] p-2.5 ring-1 ring-warn/25"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" /><p className="text-[11.5px] leading-relaxed text-frost-100">Continuity warning: the previous leg ends at {previousLeg?.destination}, but this leg starts at {origin}. You can still save and reconcile the route.</p></div>}

        <div>
          <p className="t-meta mb-2">Vendor / carrier assignment</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="leg-vendor" label="Vendor"><Select id="leg-vendor" options={[{ v: "", l: "Unassigned" }, ...EXEC_VENDORS.map((v) => ({ v: v.id, l: v.name }))]} value={vendorId} onChange={(e) => setVendorId(e.target.value)} /></Field>
            {selectedVendor && <div className="flex items-center rounded-lg bg-work-100 px-3 text-[11.5px] text-steel-400 ring-1 ring-steel-400/10">{selectedVendor.service} · {selectedVendor.contact}</div>}
          </div>
        </div>

        <div>
          <p className="t-meta mb-2">{mode === "ocean" ? "Ocean details" : mode === "air" ? "Air details" : mode === "truck" ? "Road details" : "Rail details"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.k} id={`md-${f.k}`} label={f.l}>
                {"opts" in f && f.opts ? (
                  <Select id={`md-${f.k}`} options={[{ v: "", l: "Select" }, ...f.opts.map((x: string) => ({ v: x, l: x }))]} value={modeData[f.k] ?? ""} onChange={(e) => setModeData({ ...modeData, [f.k]: e.target.value })} />
                ) : <Input id={`md-${f.k}`} value={modeData[f.k] ?? ""} onChange={(e) => setModeData({ ...modeData, [f.k]: e.target.value })} />}
              </Field>
            ))}
            <Field id="tracking" label="Tracking references" hint="One reference per line, formatted as Type: value" className="sm:col-span-2">
              <Textarea id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder={mode === "ocean" ? "Container: MSCU1234567\nB/L: MAEU2284117" : mode === "air" ? "AWB: 074-99284111\nFlight: LH756" : mode === "truck" ? "Vehicle: MH12-AB-4821\nLR: DRW-88214" : "Rail: IRL-RAKE-229"} />
            </Field>
            <Field id="leg-status" label="Leg status">
              <Select id="leg-status" options={LEG_STATUSES.map((x) => ({ v: x, l: x }))} value={status} onChange={(e) => setStatus(e.target.value as LegStatus)} />
            </Field>
            <Field id="leg-notes" label="Leg notes"><Input id="leg-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Operational details…" /></Field>
          </div>
        </div>
        {error && <p className="rounded-lg bg-risk/[0.06] px-3 py-2 text-[12px] text-risk ring-1 ring-risk/20">{error}</p>}
      </div>
    </Drawer>
  );
}

export function MilestoneEditorDrawer({ open, onClose, shipment, milestone, legId, onSave }:
  { open: boolean; onClose: () => void; shipment: OperationalShipment; milestone?: ShipmentMilestone; legId?: string; onSave: (m: ShipmentMilestone) => void }) {
  const [name, setName] = useState(milestone?.name ?? "");
  const [type, setType] = useState<MilestoneType>(milestone?.type ?? "Custom");
  const [leg, setLeg] = useState(milestone?.legId ?? legId ?? "");
  const [plannedDate, setPlannedDate] = useState(dateOnly(milestone?.plannedAt ?? "2025-10-11"));
  const [plannedTime, setPlannedTime] = useState(timeOnly(milestone?.plannedAt ?? "2025-10-11T09:00"));
  const [owner, setOwner] = useState(milestone?.owner ?? shipment.owner);
  const [customerVisible, setCustomerVisible] = useState(!!milestone?.customerRemark);
  const [note, setNote] = useState(milestone?.internalRemark ?? "");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setName(milestone?.name ?? ""); setType(milestone?.type ?? "Custom"); setLeg(milestone?.legId ?? legId ?? "");
    setPlannedDate(dateOnly(milestone?.plannedAt ?? "2025-10-11")); setPlannedTime(timeOnly(milestone?.plannedAt ?? "2025-10-11T09:00"));
    setOwner(milestone?.owner ?? shipment.owner); setCustomerVisible(!!milestone?.customerRemark); setNote(milestone?.internalRemark ?? ""); setError("");
  }, [open, milestone, legId, shipment.owner]);
  const save = () => {
    if (!name.trim() || !plannedDate) { setError("Milestone name and planned date are required."); return; }
    onSave({
      id: milestone?.id ?? `MS-${shipment.id.slice(-4)}-${String(Date.now()).slice(-4)}`,
      legId: leg || undefined, name: name.trim(), type, plannedAt: combine(plannedDate, plannedTime),
      actualAt: milestone?.actualAt, status: milestone?.status ?? "Upcoming", owner,
      internalRemark: note || undefined, customerRemark: customerVisible ? (milestone?.customerRemark ?? "Customer-visible update pending") : undefined,
      custom: type === "Custom", createdAt: milestone?.createdAt ?? "10 Oct, 14:00",
    });
    onClose();
  };
  return (
    <Drawer open={open} onClose={onClose} title={milestone ? "Edit milestone" : "Add milestone"} subtitle={shipment.id}
      footer={<div className="flex justify-between"><Btn size="sm" onClick={onClose}>Cancel</Btn><Btn size="sm" variant="primary" onClick={save} icon={<Save className="h-3.5 w-3.5" />}>Save milestone</Btn></div>}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ms-type" label="Milestone type" required><Select id="ms-type" options={MILESTONE_TYPES.map((x) => ({ v: x, l: x }))} value={type} onChange={(e) => { setType(e.target.value as MilestoneType); if (e.target.value !== "Custom") setName(e.target.value); }} /></Field>
          <Field id="ms-name" label="Milestone name" required><Input id="ms-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cargo stuffing" /></Field>
          <Field id="ms-leg" label="Linked leg"><Select id="ms-leg" options={[{ v: "", l: "Shipment-level" }, ...shipment.legs.map((l) => ({ v: l.id, l: `Leg ${l.sequence} · ${l.origin} → ${l.destination}` }))]} value={leg} onChange={(e) => setLeg(e.target.value)} /></Field>
          <Field id="ms-owner" label="Owner"><Select id="ms-owner" options={[shipment.owner, "R. Kulkarni", "A. Sharma", "D. Menon", "S. Iyer", "P. Joshi"].filter((x, i, a) => a.indexOf(x) === i).map((x) => ({ v: x, l: x }))} value={owner} onChange={(e) => setOwner(e.target.value)} /></Field>
          <Field id="ms-date" label="Planned date" required><div className="grid grid-cols-[1fr_90px] gap-2"><Input id="ms-date" type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} /><Input id="ms-time" type="time" value={plannedTime} aria-label="Planned time" onChange={(e) => setPlannedTime(e.target.value)} /></div></Field>
          <Field id="ms-customer-visible" label="Visibility"><Select id="ms-customer-visible" options={[{ v: "no", l: "Internal only" }, { v: "yes", l: "Customer-visible" }]} value={customerVisible ? "yes" : "no"} onChange={(e) => setCustomerVisible(e.target.value === "yes")} /></Field>
          <Field id="ms-note" label="Internal remark" className="sm:col-span-2"><Textarea id="ms-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Operational context…" /></Field>
        </div>
        {error && <p className="text-[12px] text-risk">{error}</p>}
      </div>
    </Drawer>
  );
}

export function ExceptionEditorDrawer({ open, onClose, shipment, prefill, onSave }:
  { open: boolean; onClose: () => void; shipment: OperationalShipment; prefill?: { legId?: string; milestoneId?: string }; onSave: (value: Omit<OperationalException, "id" | "shipmentId" | "openedAt" | "status">) => void }) {
  const [type, setType] = useState<ExceptionType>("Delay");
  const [severity, setSeverity] = useState<ExceptionSeverity>("Medium");
  const [legId, setLegId] = useState(prefill?.legId ?? "");
  const [milestoneId, setMilestoneId] = useState(prefill?.milestoneId ?? "");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState(shipment.owner);
  const [dueAt, setDueAt] = useState("2025-10-11T14:00");
  const [customerVisible, setCustomerVisible] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setType("Delay"); setSeverity("Medium"); setLegId(prefill?.legId ?? ""); setMilestoneId(prefill?.milestoneId ?? "");
    setDescription(""); setOwner(shipment.owner); setDueAt("2025-10-11T14:00"); setCustomerVisible(false); setInternalNote(""); setError("");
  }, [open, shipment.owner, prefill?.legId, prefill?.milestoneId]);
  const save = () => {
    if (!description.trim()) { setError("Describe the operational issue before saving."); return; }
    onSave({ type, severity, legId: legId || undefined, milestoneId: milestoneId || undefined, description: description.trim(), owner, dueAt, customerVisible, internalNote: internalNote || undefined });
    onClose();
  };
  return (
    <Drawer open={open} onClose={onClose} title="Report exception" subtitle={shipment.id} width="sm:max-w-[520px]"
      footer={<div className="flex justify-between"><Btn size="sm" onClick={onClose}>Cancel</Btn><Btn size="sm" variant="primary" onClick={save} icon={<AlertTriangle className="h-3.5 w-3.5" />}>Create exception</Btn></div>}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ex-type" label="Exception type" required><Select id="ex-type" options={EXCEPTION_TYPES.map((x) => ({ v: x, l: x }))} value={type} onChange={(e) => setType(e.target.value as ExceptionType)} /></Field>
          <Field id="ex-severity" label="Severity" required><Select id="ex-severity" options={EXCEPTION_SEVERITIES.map((x) => ({ v: x, l: x }))} value={severity} onChange={(e) => setSeverity(e.target.value as ExceptionSeverity)} /></Field>
          <Field id="ex-leg" label="Related leg"><Select id="ex-leg" options={[{ v: "", l: "Shipment-level" }, ...shipment.legs.map((l) => ({ v: l.id, l: `Leg ${l.sequence} · ${l.origin} → ${l.destination}` }))]} value={legId} onChange={(e) => setLegId(e.target.value)} /></Field>
          <Field id="ex-ms" label="Related milestone"><Select id="ex-ms" options={[{ v: "", l: "No milestone" }, ...shipment.milestones.map((m) => ({ v: m.id, l: m.name }))]} value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} /></Field>
          <Field id="ex-owner" label="Owner"><Select id="ex-owner" options={[shipment.owner, "R. Kulkarni", "A. Sharma", "D. Menon", "S. Iyer", "P. Joshi"].filter((x, i, a) => a.indexOf(x) === i).map((x) => ({ v: x, l: x }))} value={owner} onChange={(e) => setOwner(e.target.value)} /></Field>
          <Field id="ex-due" label="Expected resolution"><Input id="ex-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></Field>
          <Field id="ex-desc" label="Description" required className="sm:col-span-2"><Textarea id="ex-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened, what is the operational impact, and what is being done?" /></Field>
          <Field id="ex-int" label="Internal note" className="sm:col-span-2"><Textarea id="ex-int" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Internal-only context…" /></Field>
        </div>
        <label className="flex items-center gap-2 text-[12.5px] text-steel-300"><input type="checkbox" checked={customerVisible} onChange={(e) => setCustomerVisible(e.target.checked)} className="accent-[#1C6FE8]" />Customer-visible update</label>
        {error && <p className="text-[12px] text-risk">{error}</p>}
      </div>
    </Drawer>
  );
}
