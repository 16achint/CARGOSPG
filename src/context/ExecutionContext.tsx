import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useCommercial } from "@/context/CommercialContext";
import { useApp } from "@/context/AppContext";
import {
  DEMO_EXEC_NOW, SEED_EXECUTION, type LegStatus,
  type OperationalException, type OperationalShipment, type ShipmentActivity, type ShipmentLeg,
  type ShipmentMilestone, type ShipmentPriority, type ShipmentStage, getMilestoneStatus,
} from "@/data/execution";

interface CreateFields {
  owner: string;
  team: string;
  internalRef: string;
  plannedStart: string;
  plannedCompletion: string;
  priority: ShipmentPriority;
  customerVisibleRef: string;
  notes: string;
}

interface Ctx {
  shipments: OperationalShipment[];
  exceptions: OperationalException[];
  shipmentById: (id: string) => OperationalShipment | undefined;
  shipmentForBooking: (bookingId: string) => OperationalShipment | undefined;
  createFromBooking: (bookingId: string, fields: CreateFields) => OperationalShipment;
  nextShipmentId: () => string;
  addLeg: (shipmentId: string, leg: ShipmentLeg) => void;
  updateLeg: (shipmentId: string, legId: string, patch: Partial<ShipmentLeg>) => void;
  reorderLeg: (shipmentId: string, legId: string, direction: -1 | 1) => void;
  removeLeg: (shipmentId: string, legId: string) => void;
  startExecution: (shipmentId: string) => boolean;
  addMilestone: (shipmentId: string, milestone: ShipmentMilestone) => void;
  updateMilestone: (shipmentId: string, milestoneId: string, patch: Partial<ShipmentMilestone>) => void;
  addException: (shipmentId: string, input: Omit<OperationalException, "id" | "shipmentId" | "openedAt" | "status">) => OperationalException;
  updateException: (shipmentId: string, exceptionId: string, patch: Partial<OperationalException>) => void;
  addShipmentNote: (shipmentId: string, body: string, legId?: string, customerVisible?: boolean) => void;
  updateShipment: (shipmentId: string, patch: Partial<OperationalShipment>) => void;
  updateStage: (shipmentId: string, stage: ShipmentStage) => void;
  cancelShipment: (shipmentId: string, reason: string) => void;
  refreshMilestoneStatuses: () => void;
}

const Ctx = createContext<Ctx | null>(null);
const stamp = () => "10 Oct, 14:00";
const isoNow = DEMO_EXEC_NOW;

function event(shipment: OperationalShipment, label: string, kind: ShipmentActivity["kind"], tone: ShipmentActivity["tone"] = "info", ref?: string, legId?: string): ShipmentActivity {
  return { id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: stamp(), label, actor: shipment.owner || "R. Kulkarni", kind, tone, ref, legId };
}

export function ExecutionProvider({ children }: { children: ReactNode }) {
  const { bookings, quotes, rfqById, customerById } = useCommercial();
  const { notify, addNotification } = useApp();
  const [shipments, setShipments] = useState<OperationalShipment[]>(SEED_EXECUTION);
  const [seq, setSeq] = useState(1294);

  const shipmentById = useCallback((id: string) => shipments.find((s) => s.id === id), [shipments]);
  const shipmentForBooking = useCallback((bookingId: string) => shipments.find((s) => s.bookingId === bookingId), [shipments]);
  const nextShipmentId = useCallback(() => `SPG-SHP-${String(seq).padStart(6, "0")}`, [seq]);

  const createFromBooking = useCallback((bookingId: string, fields: CreateFields) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Confirmed booking not found.");
    if (booking.status !== "Confirmed" && booking.status !== "Ready for Operations") throw new Error("Only a confirmed booking can create a shipment.");
    const existing = shipments.find((s) => s.bookingId === bookingId);
    if (existing) throw new Error(`Shipment ${existing.id} already exists for this booking.`);
    const rfq = rfqById(booking.rfqId);
    const customer = customerById(booking.customerId);
    const id = `SPG-SHP-${String(seq).padStart(6, "0")}`;
    setSeq((n) => n + 1);
    const s: OperationalShipment = {
      id, bookingId: booking.id, quoteId: booking.quoteId, rfqId: booking.rfqId,
      customerId: booking.customerId, customerName: customer?.company ?? booking.customerId,
      customerRef: rfq?.customerRef, bookingRef: booking.ref || booking.id,
      origin: booking.origin, originCode: rfq?.originCode ?? "", destination: booking.destination, destCode: rfq?.destCode ?? "",
      service: booking.service,
      cargoSummary: booking.cargoSummary,
      cargo: {
        commodity: rfq?.cargo.commodity ?? booking.cargoSummary.split("·")[0].trim(),
        packages: rfq?.cargo.packages ?? "", weight: rfq?.cargo.weight ?? "", weightUnit: rfq?.cargo.weightUnit ?? "kg",
        volume: rfq?.cargo.volume ?? "", volumeUnit: rfq?.cargo.volumeUnit ?? "cbm", container: rfq?.cargo.containerType,
        hazardous: rfq?.cargo.hazardous === "Yes", temperatureControlled: rfq?.cargo.tempControlled === "Yes",
      },
      stage: "Confirmed", priority: fields.priority, owner: fields.owner, team: fields.team,
      branch: ["Pune", "Mumbai", "Nhava Sheva", "Mundra"].some((x) => booking.origin.includes(x)) ? "West" : "South",
      internalRef: fields.internalRef || id.replace("SPG-SHP-", "OPS-"),
      plannedStart: fields.plannedStart || booking.pickup || DEMO_EXEC_NOW.slice(0, 10),
      plannedCompletion: fields.plannedCompletion || booking.arrival || "2025-10-30",
      eta: fields.plannedCompletion || booking.arrival || "2025-10-30",
      customerVisibleRef: fields.customerVisibleRef || undefined,
      notes: fields.notes, createdAt: stamp(), executionStarted: false,
      legs: [], milestones: [], exceptions: [],
      activity: [{ ...event({} as OperationalShipment, `Master shipment created from confirmed booking ${booking.id}.`, "created", "info", booking.id), actor: fields.owner }],
      documentTotal: 0, documentComplete: 0,
    };
    setShipments((p) => [s, ...p]);
    notify(`${id} created from ${booking.id}`);
    return s;
  }, [bookings, shipments, quotes, rfqById, customerById, seq, notify]);

  const addLeg = useCallback((shipmentId: string, input: ShipmentLeg) => {
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      const legs = [...s.legs, { ...input, sequence: s.legs.length + 1 }];
      return { ...s, legs, activity: [event(s, `Leg ${legs.length} added: ${input.origin} → ${input.destination} (${input.mode}).`, "leg", "info", input.id, input.id), ...s.activity] };
    }));
  }, []);

  const updateLeg = useCallback((shipmentId: string, legId: string, patch: Partial<ShipmentLeg>) => {
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      const target = s.legs.find((l) => l.id === legId);
      const legs = s.legs.map((l) => l.id === legId ? { ...l, ...patch } : l);
      const allClosed = legs.length > 0 && legs.every((l) => l.status === "Completed" || l.status === "Cancelled");
      const podComplete = s.milestones.some((m) => m.type === "POD" && (m.actualAt || m.status === "Completed"));
      const stage: ShipmentStage = allClosed && podComplete ? "Completed" : patch.status === "In Progress" ? "In Transit" : patch.status === "Completed" ? "Delivery" : s.stage;
      const label = patch.vendor ? `${patch.vendor.vendorName} assigned to Leg ${target?.sequence ?? ""}.`
        : patch.status ? `Leg ${target?.sequence ?? ""} status updated to ${patch.status}.`
        : patch.tracking ? `Tracking references updated for Leg ${target?.sequence ?? ""}.`
        : `Leg ${target?.sequence ?? ""} updated.`;
      return { ...s, legs, stage, activity: [event(s, label, patch.vendor ? "vendor" : patch.tracking ? "tracking" : "leg", patch.status === "Completed" ? "ok" : "info", legId, legId), ...s.activity] };
    }));
  }, []);

  const reorderLeg = useCallback((shipmentId: string, legId: string, direction: -1 | 1) => {
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      if (s.executionStarted || s.legs.some((l) => l.status === "Completed" || l.status === "In Progress")) {
        notify("Journey order is locked after execution has started.");
        return s;
      }
      const i = s.legs.findIndex((l) => l.id === legId), j = i + direction;
      if (i < 0 || j < 0 || j >= s.legs.length) return s;
      const legs = [...s.legs];
      [legs[i], legs[j]] = [legs[j], legs[i]];
      const sorted = legs.map((l, k) => ({ ...l, sequence: k + 1 }));
      return { ...s, legs: sorted, activity: [event(s, `Leg ${legId} moved to sequence ${j + 1}.`, "leg", "info", legId), ...s.activity] };
    }));
  }, [notify]);

  const removeLeg = useCallback((shipmentId: string, legId: string) => {
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      const target = s.legs.find((l) => l.id === legId);
      if (s.executionStarted || (target && ["Completed", "In Progress", "Delayed", "Exception"].includes(target.status))) {
        notify("An active, completed or started leg cannot be removed.");
        return s;
      }
      const legs = s.legs.filter((l) => l.id !== legId).map((l, i) => ({ ...l, sequence: i + 1 }));
      const milestones = s.milestones.filter((m) => m.legId !== legId);
      return { ...s, legs, milestones, activity: [event(s, `Planned Leg ${target?.sequence ?? ""} removed.`, "leg", "warn", legId), ...s.activity] };
    }));
  }, [notify]);

  const startExecution = useCallback((shipmentId: string) => {
    const current = shipments.find((s) => s.id === shipmentId);
    if (!current) return false;
    if (current.legs.length === 0) { notify("Add at least one journey leg before starting execution."); return false; }
    const idx = current.legs.findIndex((l) => !["Completed", "Cancelled"].includes(l.status));
    if (idx < 0) { notify("There are no planned legs to start."); return false; }
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      const legs = s.legs.map((l, i) => i === idx && ["Planned", "Ready"].includes(l.status) ? { ...l, status: "In Progress" as LegStatus } : l);
      return { ...s, executionStarted: true, stage: "Pickup", legs, activity: [event(s, "Journey execution started.", "status", "cyan"), ...s.activity] };
    }));
    notify("Journey execution started.");
    return true;
  }, [shipments, notify]);

  const addMilestone = useCallback((shipmentId: string, milestone: ShipmentMilestone) => {
    setShipments((p) => p.map((s) => s.id === shipmentId
      ? { ...s, milestones: [...s.milestones, milestone].sort((a, b) => a.plannedAt.localeCompare(b.plannedAt)), activity: [event(s, `Milestone added: ${milestone.name}.`, "milestone", "info", milestone.id, milestone.legId), ...s.activity] }
      : s));
  }, []);

  const updateMilestone = useCallback((shipmentId: string, milestoneId: string, patch: Partial<ShipmentMilestone>) => {
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      const target = s.milestones.find((m) => m.id === milestoneId);
      const milestones = s.milestones.map((m) => m.id === milestoneId ? { ...m, ...patch } : m);
      let legs = s.legs;
      if (target?.legId && patch.status === "Completed") {
        const lm = milestones.filter((m) => m.legId === target.legId);
        const completesLeg = lm.filter((m) => ["Completed", "Skipped"].includes(m.status)).length >= Math.max(1, lm.length - 1);
        if (completesLeg) legs = legs.map((l) => l.id === target.legId ? { ...l, status: "Completed", actualArrival: patch.actualAt ?? l.actualArrival } : l);
      }
      const allLegsComplete = legs.length > 0 && legs.every((l) => l.status === "Completed" || l.status === "Cancelled");
      const allMovementMilestonesDone = milestones.filter((m) => m.type !== "POD").every((m) => ["Completed", "Skipped"].includes(m.status));
      const hasPod = milestones.some((m) => m.type === "POD" && ["Completed", "Skipped"].includes(m.status));
      let stage = s.stage;
      if (target?.type === "Pickup" && patch.status === "Completed") stage = "In Transit";
      if (target?.type === "Customs" && patch.status === "Completed") stage = "Gate-In";
      if (target?.type === "Destination Arrival" && patch.status === "Completed") stage = "Destination";
      if (target?.type === "Delivery" && patch.status === "Completed") stage = "Delivery";
      if (allLegsComplete && allMovementMilestonesDone && hasPod) stage = "Completed";
      const label = patch.status === "Completed" ? `Milestone completed: ${target?.name ?? "milestone"}.` : `Milestone updated: ${target?.name ?? "milestone"}.`;
      return { ...s, milestones, legs, stage, activity: [event(s, label, "milestone", patch.status === "Completed" ? "ok" : "info", milestoneId, target?.legId), ...s.activity] };
    }));
  }, []);

  const addException = useCallback((shipmentId: string, input: Omit<OperationalException, "id" | "shipmentId" | "openedAt" | "status">) => {
    const id = `EX-${String(Date.now()).slice(-5)}`;
    const created: OperationalException = { ...input, id, shipmentId, openedAt: isoNow, status: "Open" };
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      return {
        ...s,
        exceptions: [created, ...s.exceptions],
        legs: s.legs.map((l) => l.id === input.legId && ["High", "Critical"].includes(input.severity) ? { ...l, status: "Exception" as LegStatus } : l),
        milestones: s.milestones.map((m) => m.id === input.milestoneId ? { ...m, status: "Exception", exceptionId: id } : m),
        activity: [event(s, `${input.severity} ${input.type.toLowerCase()} exception reported.`, "exception", input.severity === "Critical" || input.severity === "High" ? "risk" : "warn", id, input.legId), ...s.activity],
      };
    }));
    notify(`${created.severity} exception ${id} reported.`);
    addNotification({ type: created.type === "Customs Hold" ? "customs" : created.type === "Document Missing" ? "document" : "delay", title: `${created.severity} exception · ${created.type}`, record: shipmentId, body: created.description, time: "Just now" });
    return created;
  }, [notify, addNotification]);

  const updateException = useCallback((shipmentId: string, exceptionId: string, patch: Partial<OperationalException>) => {
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      const target = s.exceptions.find((x) => x.id === exceptionId);
      const exceptions = s.exceptions.map((x) => x.id === exceptionId ? { ...x, ...patch } : x);
      const resolved = patch.status === "Resolved" || patch.status === "Closed";
      const stillOpenOnLeg = target?.legId && exceptions.some((x) => x.legId === target.legId && !["Resolved", "Closed"].includes(x.status));
      const legs = resolved && target?.legId && !stillOpenOnLeg
        ? s.legs.map((l) => l.id === target.legId && l.status === "Exception" ? { ...l, status: "In Progress" as LegStatus } : l)
        : s.legs;
      const milestones = resolved && target?.milestoneId
        ? s.milestones.map((m) => m.id === target.milestoneId && m.status === "Exception" ? { ...m, status: getMilestoneStatus({ ...m, status: "Upcoming" }) } : m)
        : s.milestones;
      const label = resolved ? `Exception ${exceptionId} resolved.` : patch.owner ? `Exception ${exceptionId} assigned to ${patch.owner}.` : `Exception ${exceptionId} updated.`;
      return { ...s, exceptions, legs, milestones, activity: [event(s, label, "exception", resolved ? "ok" : "warn", exceptionId, target?.legId), ...s.activity] };
    }));
    if (patch.status === "Resolved" || patch.status === "Closed") notify(`Exception ${exceptionId} resolved.`);
  }, [notify]);

  const addShipmentNote = useCallback((shipmentId: string, body: string, legId?: string, customerVisible = false) => {
    setShipments((p) => p.map((s) => s.id === shipmentId
      ? { ...s, activity: [ { ...event(s, body, "note", customerVisible ? "cyan" : "neutral", legId, legId), internalOnly: !customerVisible }, ...s.activity ] }
      : s));
  }, []);

  const updateShipment = useCallback((shipmentId: string, patch: Partial<OperationalShipment>) => {
    setShipments((p) => p.map((s) => s.id === shipmentId ? { ...s, ...patch } : s));
  }, []);

  const updateStage = useCallback((shipmentId: string, stage: ShipmentStage) => {
    setShipments((p) => p.map((s) => {
      if (s.id !== shipmentId) return s;
      if (stage === "Completed") {
        const legsDone = s.legs.length > 0 && s.legs.every((l) => ["Completed", "Cancelled"].includes(l.status));
        const movementDone = s.milestones.filter((m) => m.type !== "POD").every((m) => ["Completed", "Skipped"].includes(m.status));
        const podDone = s.milestones.some((m) => m.type === "POD" && ["Completed", "Skipped"].includes(m.status));
        if (!legsDone || !movementDone || !podDone) { notify("Shipment closure requires all legs, movement milestones and POD to be complete."); return s; }
      }
      return { ...s, stage, activity: [event(s, `Shipment stage changed to ${stage}.`, "status", stage === "Completed" ? "ok" : "info"), ...s.activity] };
    }));
  }, [notify]);

  const cancelShipment = useCallback((shipmentId: string, reason: string) => {
    setShipments((p) => p.map((s) => s.id === shipmentId
      ? { ...s, stage: "Cancelled", notes: [s.notes, `Cancelled: ${reason}`].filter(Boolean).join("\n"), legs: s.legs.map((l) => l.status === "Completed" ? l : { ...l, status: "Cancelled" }), activity: [event(s, `Shipment cancelled. Reason: ${reason}`, "cancelled", "risk"), ...s.activity] }
      : s));
  }, []);

  const refreshMilestoneStatuses = useCallback(() => {
    setShipments((p) => p.map((s) => ({ ...s, milestones: s.milestones.map((m) => ({ ...m, status: getMilestoneStatus(m) })) })));
  }, []);

  const exceptions = useMemo(() => shipments.flatMap((s) => s.exceptions.map((e) => ({ ...e, shipmentCustomer: s.customerName, route: `${s.origin} → ${s.destination}`, stage: s.stage }))), [shipments]);
  const value = useMemo<Ctx>(() => ({
    shipments, exceptions, shipmentById, shipmentForBooking, createFromBooking, nextShipmentId,
    addLeg, updateLeg, reorderLeg, removeLeg, startExecution, addMilestone, updateMilestone,
    addException, updateException, addShipmentNote, updateShipment, updateStage, cancelShipment, refreshMilestoneStatuses,
  }), [shipments, exceptions, shipmentById, shipmentForBooking, createFromBooking, nextShipmentId,
    addLeg, updateLeg, reorderLeg, removeLeg, startExecution, addMilestone, updateMilestone,
    addException, updateException, addShipmentNote, updateShipment, updateStage, cancelShipment, refreshMilestoneStatuses]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExecution() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useExecution must be used within ExecutionProvider");
  return c;
}
