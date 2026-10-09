import { Ship, Truck, Plane, TrainFront, FileCheck2, TrendingUp, Activity } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Mode } from "@/lib/geo";
import { cn } from "@/utils/cn";

export const MODE_ICON = { truck: Truck, ocean: Ship, air: Plane, rail: TrainFront } as const;
const MODE_LABEL: Record<Mode, string> = { truck: "Road", ocean: "Ocean", air: "Air", rail: "Rail" };
const LEGS: { mode: Mode; label: string }[] = [
  { mode: "truck", label: "Pune → Nhava Sheva" },
  { mode: "ocean", label: "Nhava Sheva → Singapore" },
  { mode: "ocean", label: "Singapore → Houston" },
  { mode: "truck", label: "Houston → Customer DC" },
];

export function ShipmentCard({ leg = 1, className }: { leg?: number; className?: string }) {
  const current = LEGS[Math.min(leg, LEGS.length - 1)];
  const Icon = MODE_ICON[current.mode];
  return (
    <div className={cn("surface-glass edge-light w-[290px] rounded-2xl p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.08em] text-frost-100">SPG-SHP-001284</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cargo-400/10 px-2 py-0.5 font-mono text-[9.5px] tracking-[0.14em] text-cargo-300 ring-1 ring-cargo-400/25">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-cargo-300" />
          IN TRANSIT
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[19px] font-light tracking-[-0.02em] text-frost-50">Pune <span className="text-steel-500">→</span> Houston</div>
          <div className="t-meta mt-1">FCL · 2×40HC · 4 legs</div>
        </div>
        <div className="text-right">
          <div className="t-meta">ETA</div>
          <div className="t-num text-[15px] font-medium text-frost-50">18 OCT</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-1" aria-hidden>
        {LEGS.map((_, i) => (
          <div key={i} className="h-[3px] overflow-hidden rounded-full bg-steel-400/15">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#1C6FE8,#18A0D8)]"
              initial={false}
              animate={{ width: i < leg ? "100%" : i === leg ? "55%" : "0%" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[12px] text-steel-300">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-ink-800 ring-1 ring-steel-400/15">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={current.mode} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.25 }}>
              <Icon className="h-3.5 w-3.5 text-cargo-300" />
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="truncate">
          Leg {Math.min(leg, 3) + 1}/4 · {MODE_LABEL[current.mode]} · <span className="text-frost-100">{current.label}</span>
        </span>
      </div>
    </div>
  );
}

export function DocsCard({ className }: { className?: string }) {
  return (
    <div className={cn("surface-glass w-[210px] rounded-2xl p-4", className)}>
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-3.5 w-3.5 text-steel-400" />
        <span className="t-meta">Documents</span>
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="t-num text-2xl font-light text-frost-50">12</span>
        <span className="text-sm text-steel-500">/ 13 complete</span>
      </div>
      <div className="mt-2.5 flex gap-[3px]" aria-hidden>
        {Array.from({ length: 13 }).map((_, i) => (
          <span key={i} className={cn("h-3 flex-1 rounded-[2px]", i < 12 ? "bg-ok/70" : "bg-warn/80")} />
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-warn">
        <span className="h-1.5 w-1.5 rounded-full bg-warn" /> 1 action required
      </div>
    </div>
  );
}

export function MarginCard({ className }: { className?: string }) {
  return (
    <div className={cn("surface-glass w-[190px] rounded-2xl p-4", className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-steel-400" />
        <span className="t-meta">Gross margin</span>
      </div>
      <div className="t-num mt-2 text-[28px] font-light leading-none text-frost-50">18.8<span className="text-lg text-steel-400">%</span></div>
      <svg viewBox="0 0 120 28" className="mt-2 h-7 w-full" aria-hidden>
        <path d="M0 22 L15 20 L30 21 L45 15 L60 16 L75 11 L90 12 L105 7 L120 5" fill="none" stroke="#0B7A55" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M0 22 L15 20 L30 21 L45 15 L60 16 L75 11 L90 12 L105 7 L120 5 L120 28 L0 28Z" fill="rgba(11,122,85,0.1)" />
      </svg>
      <div className="mt-1 text-[11.5px] text-ok">Healthy</div>
    </div>
  );
}

export function StatusCard({ className }: { className?: string }) {
  return (
    <div className={cn("surface-glass flex items-center gap-3 rounded-xl px-3.5 py-2.5", className)}>
      <span className="relative grid h-7 w-7 place-items-center rounded-full bg-ok/10 ring-1 ring-ok/30">
        <Activity className="h-3.5 w-3.5 text-ok" />
      </span>
      <div>
        <div className="t-meta !text-[9.5px]">Current status</div>
        <div className="text-[13px] font-medium text-frost-50">On Schedule</div>
      </div>
    </div>
  );
}
