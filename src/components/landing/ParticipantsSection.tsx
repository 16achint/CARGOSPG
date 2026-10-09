import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { User, Briefcase, Settings2, FileStack, Landmark, Truck, LineChart, ShieldCheck, Box } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

const P = [
  { k: "Customer", i: User, d: "Self-serve visibility without emails or calls.", items: ["Quotes", "Tracking", "Documents", "Invoices"] },
  { k: "Sales", i: Briefcase, d: "Price faster with live rates and history.", items: ["RFQs", "Rates", "Quotes", "Pipeline"] },
  { k: "Operations", i: Settings2, d: "Execute every movement from one job.", items: ["Legs", "Milestones", "Vendors", "Exceptions"] },
  { k: "Documentation", i: FileStack, d: "Prepare, verify and release paperwork.", items: ["Bill of Lading", "Invoices", "Customs filings", "Verification"] },
  { k: "Finance", i: Landmark, d: "Bill accurately, see margin per job.", items: ["Cost", "Invoice", "Margin", "Receivables"] },
  { k: "Vendor", i: Truck, d: "Confirm assignments and upload proof.", items: ["Assigned legs", "Rate confirmations", "POD", "Vendor bills"] },
  { k: "Management", i: LineChart, d: "Decide with operational and financial truth.", items: ["Profitability", "On-time performance", "Exceptions", "Volumes"] },
  { k: "Admin", i: ShieldCheck, d: "Control access and keep a clean audit trail.", items: ["Users", "Roles", "Workspaces", "Audit trail"] },
];
const C = 300, R = 228;
const pos = P.map((_, i) => {
  const a = ((-90 + i * 45) * Math.PI) / 180;
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
});

export function ParticipantsSection() {
  const [sel, setSel] = useState(0);
  const reduce = useReducedMotion();
  const p = P[sel];

  return (
    <section aria-labelledby="ppl-title" className="relative overflow-hidden py-24 md:py-32">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(99,120,142,0.25),transparent)]" />
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="relative hidden md:block lg:col-span-7">
          <div className="relative mx-auto aspect-square max-w-[600px]">
            <div aria-hidden className="absolute inset-[12%] rounded-full border border-steel-400/12" />
            <div aria-hidden className="absolute inset-[30%] rounded-full border border-dashed border-steel-400/12" />
            <div aria-hidden className="absolute inset-[35%] rounded-full bg-[radial-gradient(circle,rgba(28,111,232,0.12),transparent_70%)] blur-xl" />
            <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full" aria-hidden>
              {pos.map((pt, i) => (
                <line key={i} x1={C} y1={C} x2={pt.x} y2={pt.y} stroke={i === sel ? "#1C6FE8" : "rgba(99,120,142,0.26)"} strokeWidth={i === sel ? 1.4 : 1} style={{ transition: "stroke .4s" }} />
              ))}
              {!reduce && (
                <circle key={sel} r="3.5" fill="#18A0D8">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path={`M${pos[sel].x} ${pos[sel].y} L${C} ${C}`} />
                </circle>
              )}
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="surface-glass edge-light flex flex-col items-center rounded-2xl px-5 py-4 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#2F86FF,#18A0D8)] shadow-[0_8px_20px_-8px_rgba(24,160,216,0.75)]"><Box className="h-5 w-5 text-white" /></span>
                <div className="t-meta mt-3 !text-cargo-300">Master shipment</div>
                <div className="font-mono text-[11px] text-frost-100">SPG-SHP-001284</div>
              </div>
            </div>

            {P.map((x, i) => (
              <button
                key={x.k}
                onMouseEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
                onClick={() => setSel(i)}
                aria-pressed={i === sel}
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[13px] ring-1 transition-all duration-300",
                  i === sel ? "bg-white text-frost-50 ring-cargo-400/60 shadow-[0_1px_2px_rgba(16,44,73,0.05),0_12px_28px_-16px_rgba(24,160,216,0.7)]" : "bg-white/70 text-steel-300 ring-steel-400/20 hover:bg-white hover:ring-steel-400/40"
                )}
                style={{ left: `${(pos[i].x / 600) * 100}%`, top: `${(pos[i].y / 600) * 100}%` }}
              >
                <span className={cn("grid h-7 w-7 place-items-center rounded-full transition-colors", i === sel ? "bg-signal-500/15" : "bg-ink-800")}>
                  <x.i className={cn("h-3.5 w-3.5", i === sel ? "text-cargo-300" : "text-steel-400")} />
                </span>
                {x.k}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <SectionHeading id="ppl-title" eyebrow="Every participant" title={<>Everyone works from the same shipment.</>} description="Customers, teams and vendors see the same truth — each through the lens of what they need to act on." />

          <div className="mt-8 flex flex-wrap gap-2 md:hidden">
            {P.map((x, i) => (
              <button key={x.k} onClick={() => setSel(i)} aria-pressed={i === sel} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] ring-1 transition-colors", i === sel ? "bg-white text-frost-50 ring-cargo-400/60" : "bg-white/60 text-steel-400 ring-steel-400/18")}>
                <x.i className="h-3.5 w-3.5" />{x.k}
              </button>
            ))}
          </div>

          <div className="surface mt-6 min-h-[188px] rounded-2xl p-5" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={p.k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-signal-500/12 ring-1 ring-cargo-400/35"><p.i className="h-4 w-4 text-cargo-300" /></span>
                  <div>
                    <div className="text-[15px] text-frost-50">{p.k}</div>
                    <div className="text-[12.5px] text-steel-400">{p.d}</div>
                  </div>
                </div>
                <div className="t-meta mt-5 !text-[9.5px]">Interacts with</div>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {p.items.map((it, i) => (
                    <motion.li key={it} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i, duration: 0.3 }} className="flex items-center gap-1.5 rounded-lg bg-ink-850 px-2.5 py-1.5 text-[12.5px] text-frost-100 ring-1 ring-steel-400/15">
                      <span className="h-1 w-1 rounded-full bg-cargo-400" />{it}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
