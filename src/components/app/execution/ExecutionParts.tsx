import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowRight, Check, Clock3, Plane, Ship, TrainFront, Truck, type LucideIcon } from "lucide-react";
import type { Mode } from "@/lib/geo";
import {
  LEG_TONE, STAGE_TONE, getMilestoneStatus, shipmentProgress, type LegStatus,
  type OperationalShipment, type ShipmentActivity, type ShipmentLeg, type ShipmentMilestone, type ShipmentStage,
} from "@/data/execution";
import { Progress, StatusBadge, type ToneKey } from "@/components/app/ui/primitives";
import { cn } from "@/utils/cn";

const MODES: Record<Mode, { icon: LucideIcon; label: string }> = {
  ocean: { icon: Ship, label: "Sea" }, air: { icon: Plane, label: "Air" }, truck: { icon: Truck, label: "Road" }, rail: { icon: TrainFront, label: "Rail" },
};

export function ModeIcon({ mode, className }: { mode: Mode; className?: string }) {
  const I = MODES[mode].icon;
  return <I className={className} strokeWidth={1.7} aria-hidden />;
}
export const modeLabel = (mode: Mode) => MODES[mode].label;

export function StageBadge({ stage, className }: { stage: ShipmentStage; className?: string }) {
  return <StatusBadge tone={STAGE_TONE[stage]} className={className}>{stage}</StatusBadge>;
}
export function LegBadge({ status, className }: { status: LegStatus; className?: string }) {
  return <StatusBadge tone={LEG_TONE[status]} className={className} dot>{status}</StatusBadge>;
}
export function PriorityBadge({ priority }: { priority: string }) {
  const tone: ToneKey = priority === "Critical" ? "risk" : priority === "High" ? "warn" : priority === "Low" ? "neutral" : "info";
  return <StatusBadge tone={tone} dot={false}>{priority} priority</StatusBadge>;
}

export function JourneyProgress({ shipment }: { shipment: OperationalShipment }) {
  const pct = shipmentProgress(shipment);
  const done = shipment.legs.filter((l) => l.status === "Completed").length;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-num text-[24px] font-light text-frost-50">{pct}%</span>
        <span className="text-[11.5px] text-steel-500">{done} of {shipment.legs.length} legs complete</span>
      </div>
      <Progress value={pct} tone={shipment.exceptions.some((e) => !["Resolved", "Closed"].includes(e.status)) ? "warn" : "cyan"} className="mt-1.5" />
    </div>
  );
}

export function LegStateDot({ status }: { status: LegStatus }) {
  const c = status === "Completed" ? "bg-ok" : status === "In Progress" ? "bg-cargo-400" : status === "Delayed" ? "bg-warn" : status === "Exception" ? "bg-risk" : status === "Ready" ? "bg-info" : "bg-steel-500";
  return <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full ring-[3px] ring-white", c)} />;
}

/** Responsive journey: horizontal desktop route; vertical mobile sequence. */
export function JourneyStrip({ shipment, onLeg, selectedLegId }: { shipment: OperationalShipment; onLeg?: (leg: ShipmentLeg) => void; selectedLegId?: string }) {
  if (!shipment.legs.length) return null;
  return (
    <div className="relative">
      <ol className="relative space-y-0 md:flex md:min-w-max md:items-start md:gap-0 md:space-y-0">
        {shipment.legs.map((leg) => {
          const active = leg.id === selectedLegId || (!selectedLegId && ["In Progress", "Delayed", "Exception", "Ready"].includes(leg.status));
          return (
            <li key={leg.id} className="relative flex gap-3 pb-4 last:pb-0 md:w-[230px] md:flex-col md:gap-2 md:pb-0 md:pr-4">
              {/* continuous rail */}
              <span aria-hidden className="absolute bottom-0 left-[5px] top-3 w-px bg-steel-400/25 md:bottom-auto md:left-3 md:right-0 md:top-[13px] md:h-px md:w-auto" />
              <span className="relative z-10 mt-1 grid h-3 w-3 shrink-0 place-items-center md:ml-2">
                <LegStateDot status={leg.status} />
              </span>
              <button onClick={() => onLeg?.(leg)} className={cn("min-w-0 flex-1 rounded-xl px-3 py-2 text-left transition md:mt-2 md:min-h-[120px] md:w-full",
                active ? "bg-cargo-400/[0.07] ring-1 ring-cargo-400/35" : "bg-white/70 ring-1 ring-steel-400/10 hover:bg-white hover:ring-steel-400/25")}>
                <span className="flex items-center gap-2">
                  <ModeIcon mode={leg.mode} className={cn("h-3.5 w-3.5", active ? "text-cargo-300" : "text-steel-400")} />
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-steel-500">Leg {leg.sequence} · {modeLabel(leg.mode)}</span>
                  {leg.status === "Exception" && <AlertTriangle className="ml-auto h-3.5 w-3.5 text-risk" />}
                </span>
                <span className="mt-1 block truncate text-[12.5px] font-medium text-frost-50">{leg.origin}</span>
                <span className="flex items-center gap-1 text-[11px] text-steel-500"><ArrowRight className="h-3 w-3" />{leg.destination}</span>
                <span className="mt-2 flex items-center justify-between gap-2">
                  <LegBadge status={leg.status} />
                  <span className="truncate text-[10.5px] text-steel-500">{leg.vendor?.vendorName ?? "Vendor unassigned"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function PlannedActual({ label, planned, actual, status }: { label: string; planned: string; actual?: string; status?: string }) {
  const p = formatDate(planned), a = actual ? formatDate(actual) : "—";
  const late = !!actual && new Date(actual).getTime() > new Date(planned).getTime();
  return (
    <div className="grid grid-cols-[100px_1fr_1fr] items-center gap-2 border-b border-steel-400/[0.07] py-2 last:border-0">
      <span className="text-[11.5px] text-steel-500">{label}</span>
      <span className="text-[11.5px] text-steel-400"><span className="mr-1 font-mono text-[9px] uppercase tracking-[0.1em] text-steel-500">Plan</span>{p}</span>
      <span className={cn("text-[11.5px]", actual ? late ? "text-warn" : "text-ok" : "text-steel-500")}>
        <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.1em] text-steel-500">Actual</span>{a}{status && <span className="ml-1 text-[10px]">· {status}</span>}
      </span>
    </div>
  );
}

export function TimelineMilestone({ milestone, now, onClick }: { milestone: ShipmentMilestone; now?: Date; onClick?: () => void }) {
  const st = getMilestoneStatus(milestone, now);
  const tone: ToneKey = st === "Completed" ? "ok" : st === "Delayed" ? "risk" : st === "Due Soon" ? "warn" : st === "Exception" ? "risk" : st === "Skipped" ? "neutral" : "info";
  const Icon = st === "Completed" ? Check : st === "Delayed" || st === "Exception" ? AlertTriangle : st === "Due Soon" ? Clock3 : Activity;
  return (
    <li className="relative pl-7">
      <span className={cn("absolute left-0 top-0.5 grid h-5 w-5 place-items-center rounded-full ring-1", tone === "ok" ? "bg-ok/10 ring-ok/25" : tone === "risk" ? "bg-risk/10 ring-risk/25" : tone === "warn" ? "bg-warn/10 ring-warn/25" : tone === "info" ? "bg-info/10 ring-info/25" : "bg-work-200 ring-steel-400/20")}>
        <Icon className={cn("h-3 w-3", tone === "ok" ? "text-ok" : tone === "risk" ? "text-risk" : tone === "warn" ? "text-warn" : tone === "info" ? "text-info" : "text-steel-400")} />
      </span>
      <button onClick={onClick} className={cn("w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-work-100", onClick && "cursor-pointer")}>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-frost-50">{milestone.name}</span>
          <StatusBadge tone={tone} dot={false}>{st}</StatusBadge>
        </span>
        <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-steel-500">
          <span>Planned {formatDate(milestone.plannedAt)}</span>
          {milestone.actualAt && <span className="text-ok">Actual {formatDate(milestone.actualAt)}</span>}
          <span>{milestone.owner}</span>
        </span>
        {milestone.internalRemark && <span className="mt-1 block text-[11.5px] text-steel-400">Internal: {milestone.internalRemark}</span>}
        {milestone.customerRemark && <span className="mt-1 block text-[11.5px] text-cargo-300">Customer update: {milestone.customerRemark}</span>}
      </button>
    </li>
  );
}

export function formatDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function relativeAge(value: string, now = new Date("2025-10-10T14:00:00")) {
  const delta = Math.max(0, now.getTime() - new Date(value).getTime());
  const mins = Math.floor(delta / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getStageCurrent(s: OperationalShipment) {
  const active = s.legs.find((l) => ["In Progress", "Delayed", "Exception", "Ready"].includes(l.status));
  if (!active) return s.stage;
  const m = s.milestones.find((x) => x.legId === active.id && !["Completed", "Skipped"].includes(getMilestoneStatus(x)));
  return m?.name ?? s.stage;
}

export function SmallMetric({ label, value, tone = "default", icon }: { label: string; value: ReactNode; tone?: "default" | "warn" | "risk" | "ok" | "info"; icon?: ReactNode }) {
  const t = tone === "risk" ? "text-risk" : tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : tone === "info" ? "text-info" : "text-frost-50";
  return <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-steel-400/12"><div className="flex items-center justify-between gap-2"><span className="t-meta !text-[9px]">{label}</span>{icon}</div><div className={cn("t-num mt-1.5 text-[20px] font-light", t)}>{value}</div></div>;
}

export function EventFeed({ events, limit, empty }: { events: ShipmentActivity[]; limit?: number; empty?: string }) {
  const rows = limit ? events.slice(0, limit) : events;
  if (!rows.length) return <p className="py-6 text-center text-[12.5px] text-steel-500">{empty ?? "No activity recorded yet."}</p>;
  const c: Record<string, string> = { ok: "bg-ok", warn: "bg-warn", risk: "bg-risk", info: "bg-info", cyan: "bg-cargo-400", neutral: "bg-steel-500" };
  return (
    <ol className="space-y-0">
      {rows.map((a, i) => (
        <motion.li key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.025 }} className="relative flex gap-3 py-2.5">
          <span className="relative mt-1.5 flex w-3 shrink-0 justify-center">
            <span className={cn("relative z-10 h-2 w-2 rounded-full ring-[3px] ring-white", c[a.tone ?? "info"])} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-[10.5px] text-steel-500">{a.at}</span>
              <span className="text-[11.5px] text-steel-400">{a.actor}</span>
              {a.internalOnly && <span className="rounded bg-warn/10 px-1.5 py-px font-mono text-[9px] uppercase text-warn">Internal</span>}
            </div>
            <p className="mt-0.5 text-[12.5px] leading-snug text-frost-100">{a.label}</p>
            {a.ref && <span className="mt-0.5 block truncate font-mono text-[10.5px] text-cargo-300">{a.ref}</span>}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
