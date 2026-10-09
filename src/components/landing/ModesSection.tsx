import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plane, Ship, TrainFront, Truck, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

interface ModeDef {
  id: string; name: string; icon: LucideIcon; services: string[]; img: string; alt: string;
  from: [string, string]; to: [string, string]; path: string; dash?: string;
  stats: { k: string; v: string }[]; blurb: string;
}

const px = (id: string, file = `pexels-photo-${id}.jpeg`) =>
  `https://images.pexels.com/photos/${id}/${file}?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1200`;

export const MODES: ModeDef[] = [
  {
    id: "ocean", name: "Ocean", icon: Ship, services: ["FCL", "LCL", "Reefer", "Breakbulk", "ODC"],
    img: px("12530458"), alt: "Aerial view of a loaded container vessel at sea",
    from: ["Nhava Sheva", "INNSA"], to: ["Rotterdam", "NLRTM"],
    path: "M40 170 C 160 175, 220 120, 320 120 S 480 70, 560 60",
    stats: [{ k: "Transit", v: "24 days" }, { k: "Equipment", v: "2 × 40HC" }, { k: "Milestones", v: "14 tracked" }],
    blurb: "Container, reefer and project cargo with vessel schedules, transhipment and port milestones.",
  },
  {
    id: "air", name: "Air", icon: Plane, services: ["Air Freight", "Priority", "Standard"],
    img: px("30030222"), alt: "Cargo aircraft on an illuminated apron at night",
    from: ["Mumbai", "BOM"], to: ["Frankfurt", "FRA"],
    path: "M40 170 Q 300 -40, 560 60", dash: "3 6",
    stats: [{ k: "Transit", v: "2 days" }, { k: "Chargeable", v: "1,240 kg" }, { k: "Milestones", v: "9 tracked" }],
    blurb: "MAWB / HAWB, flight segments, chargeable weight and priority handling in the same job.",
  },
  {
    id: "road", name: "Road", icon: Truck, services: ["FTL", "PTL", "First Mile", "Last Mile"],
    img: px("11053643"), alt: "Cargo truck travelling on a highway at dusk",
    from: ["Pune", "Factory"], to: ["Chennai", "CFS"],
    path: "M40 170 C 110 160, 120 120, 200 128 S 300 170, 360 120 S 470 70, 560 60", dash: "8 5",
    stats: [{ k: "Distance", v: "1,180 km" }, { k: "Transit", v: "38 hrs" }, { k: "Vehicle", v: "32 ft MXL" }],
    blurb: "Vehicle placement, driver details, e-way bills, GPS checkpoints and proof of delivery.",
  },
  {
    id: "rail", name: "Rail", icon: TrainFront, services: ["Container", "ICD", "Port Movement"],
    img: px("30720851"), alt: "Freight trains at a container rail terminal",
    from: ["ICD Tughlakabad", "INTKD"], to: ["Mundra Port", "INMUN"],
    path: "M40 170 L 200 150 L 330 105 L 560 60", dash: "1.5 5",
    stats: [{ k: "Transit", v: "26 hrs" }, { k: "Rake", v: "90 TEU" }, { k: "Milestones", v: "7 tracked" }],
    blurb: "Rake planning, ICD gate-in, port cut-offs and inland container movements.",
  },
];

export function ModesSection() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const m = MODES[active];

  return (
    <section id="modes" aria-labelledby="modes-title" className="relative py-24 md:py-32">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(99,120,142,0.25),transparent)]" />
      <div className="container-x">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading id="modes-title" eyebrow="Multimodal by design" title={<>Every mode.<br />One operational model.</>} />
          <p className="t-body max-w-sm lg:pb-2">Ocean, air, road and rail legs share the same shipment, milestones, documents and costs — so a multimodal move is managed as one job.</p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <div role="tablist" aria-label="Transport modes" aria-orientation="vertical" className="grid grid-cols-2 gap-2.5 lg:col-span-5 lg:grid-cols-1">
            {MODES.map((mode, i) => {
              const on = i === active;
              return (
                <button
                  key={mode.id}
                  role="tab"
                  id={`mode-tab-${mode.id}`}
                  aria-selected={on}
                  aria-controls="mode-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (["ArrowDown", "ArrowRight"].includes(e.key)) { e.preventDefault(); setActive((active + 1) % 4); document.getElementById(`mode-tab-${MODES[(active + 1) % 4].id}`)?.focus(); }
                    if (["ArrowUp", "ArrowLeft"].includes(e.key)) { e.preventDefault(); setActive((active + 3) % 4); document.getElementById(`mode-tab-${MODES[(active + 3) % 4].id}`)?.focus(); }
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-500 md:p-5",
                    on ? "border-cargo-400/40 bg-[linear-gradient(180deg,#FFFFFF,#F4F8FC)] shadow-[0_1px_2px_rgba(16,44,73,0.04),0_16px_34px_-26px_rgba(16,44,73,0.35)]" : "border-steel-400/12 bg-white/60 hover:border-steel-400/30"
                  )}
                >
                  {on && <motion.span layoutId="mode-bar" className="absolute inset-y-4 left-0 w-[2px] rounded-full bg-[linear-gradient(180deg,#18A0D8,#1C6FE8)]" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={cn("grid h-9 w-9 place-items-center rounded-xl ring-1 transition-colors duration-500", on ? "bg-signal-500/12 ring-cargo-400/40" : "bg-ink-800 ring-steel-400/15")}>
                        <mode.icon className={cn("h-4 w-4 transition-colors", on ? "text-cargo-300" : "text-steel-400")} />
                      </span>
                      <span className={cn("text-lg font-light tracking-[-0.02em] transition-colors md:text-xl", on ? "text-frost-50" : "text-steel-300")}>{mode.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-steel-500">0{i + 1}</span>
                  </div>
                  <ul className="mt-3.5 hidden flex-wrap gap-1.5 sm:flex">
                    {mode.services.map((s) => (
                      <li key={s} className={cn("rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] ring-1 transition-colors", on ? "bg-white text-frost-100 ring-steel-400/25" : "text-steel-500 ring-steel-400/12")}>{s}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div id="mode-panel" role="tabpanel" aria-labelledby={`mode-tab-${m.id}`} className="surface relative min-h-[440px] overflow-hidden rounded-3xl lg:col-span-7">
            <AnimatePresence mode="sync">
              <motion.img
                key={m.img}
                src={m.img}
                alt={m.alt}
                loading="lazy"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: EASE }}
                className="img-graded absolute inset-0 h-full w-full object-cover opacity-40"
              />
            </AnimatePresence>
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(246,248,251,0.88)_0%,rgba(246,248,251,0.5)_40%,rgba(246,248,251,0.95)_100%)]" />
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_72%_18%,rgba(28,111,232,0.12),transparent_70%)]" />
            <div aria-hidden className="grid-lines absolute inset-0 opacity-70" />

            <div className="relative flex h-full min-h-[440px] flex-col p-5 md:p-8">
              <div className="flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-[0_1px_2px_rgba(16,44,73,0.05),0_8px_20px_-14px_rgba(16,44,73,0.4)] ring-1 ring-cargo-400/30"><m.icon className="h-5 w-5 text-cargo-300" /></span>
                    <div>
                      <div className="t-meta">Mode profile</div>
                      <div className="text-lg font-light text-frost-50">{m.name} freight</div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <span className="hidden rounded-full bg-white px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-ok ring-1 ring-ok/25 sm:inline-flex">● LIVE LEG</span>
              </div>

              {/* route */}
              <div className="relative my-6 flex-1">
                <svg viewBox="0 0 600 220" className="h-full max-h-[220px] w-full overflow-visible" aria-hidden>
                  <AnimatePresence mode="wait">
                    <motion.g key={m.id} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                      <path d={m.path} fill="none" stroke="rgba(99,120,142,0.35)" strokeWidth="1.2" strokeDasharray={m.dash} />
                      <motion.path
                        id={`mode-route-${m.id}`}
                        d={m.path} fill="none" stroke="#1C6FE8" strokeWidth="2" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 1.4, ease: EASE }}
                        style={{ filter: "drop-shadow(0 2px 6px rgba(28,111,232,0.35))" }}
                      />
                      {!reduce && (
                        <circle r="5" fill="#FFFFFF" stroke="#1C6FE8" strokeWidth="2">
                          <animateMotion dur="5s" repeatCount="indefinite" path={m.path} />
                        </circle>
                      )}
                      <circle cx="40" cy="170" r="5" fill="#FFFFFF" stroke="#1C6FE8" strokeWidth="1.5" />
                      <circle cx="560" cy="60" r="5" fill="#FFFFFF" stroke="#1C6FE8" strokeWidth="1.5" />
                    </motion.g>
                  </AnimatePresence>
                </svg>
                <AnimatePresence mode="wait">
                  <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="absolute bottom-0 left-0 sm:bottom-2">
                      <div className="text-[13px] text-frost-50">{m.from[0]}</div>
                      <div className="font-mono text-[10px] tracking-[0.12em] text-steel-400">{m.from[1]}</div>
                    </div>
                    <div className="absolute right-0 top-0 text-right">
                      <div className="text-[13px] text-frost-50">{m.to[0]}</div>
                      <div className="font-mono text-[10px] tracking-[0.12em] text-steel-400">{m.to[1]}</div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                  <p className="max-w-md text-[14px] leading-relaxed text-steel-300">{m.blurb}</p>
                  <dl className="mt-5 grid grid-cols-3 divide-x divide-steel-400/18 border-t border-steel-400/18 pt-4">
                    {m.stats.map((s) => (
                      <div key={s.k} className="px-3 first:pl-0">
                        <dt className="t-meta">{s.k}</dt>
                        <dd className="t-num mt-1 text-[15px] text-frost-50 md:text-lg md:font-light">{s.v}</dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
