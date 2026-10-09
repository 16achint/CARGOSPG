import { useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CountUp } from "@/components/ui/CountUp";
import { WorldDots, pct } from "@/components/network/RouteNetwork";
import { LANES, HUBS, project, arcPath, type LonLat } from "@/lib/geo";
import { useOnScreen, useTicker } from "@/lib/motion";
import { cn } from "@/utils/cn";

const VB = { x: 20, y: 40, w: 960, h: 330 };
const EXTRA = [
  arcPath([4.5, 51.9], [72.9, 19], 0.18),
  arcPath([4.5, 51.9], [55.3, 25.2], 0.2),
  arcPath([-74, 40.7], [-95.3, 29.4], 0.3),
  arcPath([103.8, 1.3], [-95.3, 29.4], 0.12),
];
const ALL_LANES = [...LANES.map((l) => l.d), ...EXTRA];

type Sev = "risk" | "warn" | "ok";
const MARKERS: { at: LonLat; sev: Sev; label: string; sub: string; pos: "top" | "bottom" }[] = [
  { at: [55.3, 25.2], sev: "risk", label: "Customs hold", sub: "Jebel Ali", pos: "top" },
  { at: [79.9, 6.9], sev: "warn", label: "Vessel +36h", sub: "Colombo", pos: "bottom" },
  { at: [-79.5, 9], sev: "warn", label: "Canal queue", sub: "Panama", pos: "bottom" },
  { at: [-95.3, 29.4], sev: "ok", label: "Arrived", sub: "Houston", pos: "top" },
  { at: [4.5, 51.9], sev: "ok", label: "Discharged", sub: "Rotterdam", pos: "top" },
];
const SEV_C: Record<Sev, string> = { risk: "#C93D3A", warn: "#C07E14", ok: "#0B7A55" };

const EVENTS: { t: string; s: string; sev: Sev | "info" }[] = [
  { t: "Arrived · USHOU", s: "SPG-SHP-001284 · discharged at Houston", sev: "ok" },
  { t: "Customs hold", s: "SPG-SHP-001302 · Jebel Ali", sev: "risk" },
  { t: "Departed · SGSIN", s: "SPG-SHP-001319 · MSC Aurora", sev: "info" },
  { t: "Document pending", s: "Certificate of Origin · SPG-SHP-001291", sev: "warn" },
  { t: "Delivered", s: "SPG-SHP-001307 · POD uploaded", sev: "ok" },
  { t: "ETA revised +36h", s: "SPG-SHP-001291 · Colombo", sev: "warn" },
  { t: "Gate-in · INMUN", s: "SPG-SHP-001311 · Rake 14", sev: "info" },
];
const DOT: Record<string, string> = { ok: "bg-ok", risk: "bg-risk", warn: "bg-warn", info: "bg-cargo-400" };

export function ControlTowerSection() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const visible = useOnScreen(ref, "0px");
  const tick = useTicker(2800, visible && !reduce);
  const feed = Array.from({ length: 4 }, (_, i) => ({ ...EVENTS[(tick + i) % EVENTS.length], k: tick + i }));

  return (
    <section id="control-tower" aria-labelledby="ct-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHeading id="ct-title" className="lg:col-span-6" eyebrow="Control tower" title={<>See movement.<br />See risk.<br /><span className="text-steel-400">Act earlier.</span></>} />
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-steel-400/15 lg:col-span-6">
            {[
              { v: 128, k: "Active shipments", f: (n: number) => Math.round(n).toString(), c: "text-frost-50" },
              { v: 94, k: "On time", f: (n: number) => `${Math.round(n)}%`, c: "text-frost-50" },
              { v: 7, k: "Exceptions", f: (n: number) => Math.round(n).toString(), c: "text-warn" },
              { v: 12, k: "Pending documents", f: (n: number) => Math.round(n).toString(), c: "text-frost-50" },
            ].map((s) => (
              <div key={s.k} className="bg-ink-900 p-5 md:p-6">
                <dd className={cn("t-num text-3xl font-light md:text-[2.6rem]", s.c)}><CountUp to={s.v} format={s.f} /></dd>
                <dt className="t-meta mt-2">{s.k}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div ref={ref} className="surface mt-12 overflow-hidden rounded-3xl">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-steel-400/12 px-5 py-3.5">
            <span className="flex items-center gap-2 text-[13px] text-frost-50"><span className="h-1.5 w-1.5 animate-blink rounded-full bg-ok" /> Global network · Live</span>
            <span className="ml-auto flex flex-wrap gap-4 font-mono text-[10px] tracking-[0.12em] text-steel-400">
              <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-cargo-400" />IN MOTION</span>
              <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-warn" />DELAY</span>
              <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-risk" />HOLD</span>
              <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-ok" />ARRIVED</span>
            </span>
          </div>
          <div className="grid lg:grid-cols-[1fr_320px]">
            <div className="relative p-3 md:p-6">
              <div className="relative w-full" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
                <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full" aria-label="Global control tower map with active shipments and exceptions" role="img">
                  <WorldDots uid={uid} />
                  <g fill="none">
                    {ALL_LANES.map((d, i) => (
                      <path key={i} id={`ct-${uid}-${i}`} d={d} stroke="rgba(28,111,232,0.22)" strokeWidth="0.7" />
                    ))}
                  </g>
                  {!reduce && ALL_LANES.map((_, i) => (
                    <circle key={i} r="1.8" fill="#18A0D8">
                      <animateMotion dur={`${10 + (i % 5) * 2.5}s`} repeatCount="indefinite" begin={`${-i * 2.1}s`}>
                        <mpath href={`#ct-${uid}-${i}`} />
                      </animateMotion>
                    </circle>
                  ))}
                  {HUBS.map((h) => { const [x, y] = project(h.at); return <circle key={h.id} cx={x} cy={y} r="1.5" fill="#A6B5C6" />; })}
                  {MARKERS.map((m, i) => {
                    const [x, y] = project(m.at);
                    return (
                      <g key={i}>
                        {m.sev !== "ok" && !reduce && (
                          <circle cx={x} cy={y} r="5" fill="none" stroke={SEV_C[m.sev]} strokeWidth="0.8" className="animate-node-pulse" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${i * 0.4}s` }} />
                        )}
                        <circle cx={x} cy={y} r="4" fill={SEV_C[m.sev]} fillOpacity="0.16" stroke={SEV_C[m.sev]} strokeWidth="0.9" />
                        <circle cx={x} cy={y} r="1.6" fill={SEV_C[m.sev]} />
                      </g>
                    );
                  })}
                </svg>
                {MARKERS.map((m, i) => {
                  const [x, y] = project(m.at);
                  return (
                    <div key={i} style={pct(VB, x, y)} className={cn("pointer-events-none absolute hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-white/90 px-2 py-1 shadow-[0_1px_2px_rgba(16,44,73,0.06)] ring-1 ring-steel-400/18 backdrop-blur-sm md:block", m.pos === "top" ? "-translate-y-[calc(100%+12px)]" : "translate-y-3")}>
                      <div className="text-[11px] text-frost-50">{m.label}</div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-steel-400">{m.sub}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { k: "Customs", v: "3 in clearance", c: "text-warn" },
                  { k: "Arrivals · 48h", v: "9 vessels", c: "text-frost-100" },
                  { k: "Pending actions", v: "16 tasks", c: "text-frost-100" },
                  { k: "Delayed", v: "4 shipments", c: "text-risk" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl bg-ink-850/80 px-3 py-2.5 ring-1 ring-steel-400/12">
                    <div className="t-meta !text-[9.5px]">{s.k}</div>
                    <div className={cn("mt-1 text-[13px]", s.c)}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-steel-400/12 p-5 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-frost-50">Event stream</h3>
                <span className="font-mono text-[10px] tracking-[0.12em] text-steel-500">REAL-TIME</span>
              </div>
              <ul className="mt-4 space-y-2" aria-live="off">
                <AnimatePresence initial={false} mode="popLayout">
                  {feed.map((e, i) => (
                    <motion.li
                      key={e.k}
                      layout
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: i === 3 ? 0.5 : 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="flex gap-3 rounded-xl bg-ink-850/70 p-3 ring-1 ring-steel-400/10"
                    >
                      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", DOT[e.sev])} />
                      <div className="min-w-0">
                        <div className="text-[12.5px] text-frost-100">{e.t}</div>
                        <div className="truncate font-mono text-[10px] text-steel-500">{e.s}</div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
