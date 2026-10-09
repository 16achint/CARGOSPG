import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Inbox, BadgePercent, FileText, CalendarCheck, Route, Files, ShieldCheck, Warehouse, Users, Receipt, TrendingUp, Box,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EASE } from "@/lib/motion";

const MODULES = [
  { label: "RFQ", icon: Inbox, meta: "Enquiry" },
  { label: "Rates", icon: BadgePercent, meta: "Contracts" },
  { label: "Quote", icon: FileText, meta: "Commercial" },
  { label: "Booking", icon: CalendarCheck, meta: "Carrier" },
  { label: "Legs", icon: Route, meta: "4 movements" },
  { label: "Documents", icon: Files, meta: "12 / 13" },
  { label: "Customs", icon: ShieldCheck, meta: "Cleared" },
  { label: "Warehouse", icon: Warehouse, meta: "CFS" },
  { label: "Vendors", icon: Users, meta: "6 assigned" },
  { label: "Billing", icon: Receipt, meta: "Invoiced" },
  { label: "Profitability", icon: TrendingUp, meta: "18.8%" },
];

const CX = 500, CY = 300, RX = 410, RY = 235;
const pts = MODULES.map((_, i) => {
  const a = ((-90 + (i * 360) / MODULES.length) * Math.PI) / 180;
  return { x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) };
});
const paths = pts.map(({ x, y }) => {
  const mx = (CX + x) / 2, my = (CY + y) / 2;
  const dx = x - CX, dy = y - CY;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * 28, cy = my + (dx / len) * 28;
  return `M${CX} ${CY} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
});

function MasterCard({ glow = true }: { glow?: boolean }) {
  return (
    <div className="surface-glass edge-light relative w-[250px] rounded-2xl p-5 text-left">
      {glow && <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle,rgba(28,111,232,0.14),transparent_65%)] blur-xl" />}
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(135deg,#2F86FF,#18A0D8)] shadow-[0_6px_18px_-6px_rgba(24,160,216,0.7)]">
          <Box className="h-4 w-4 text-white" />
        </span>
        <div>
          <div className="t-meta !text-cargo-300">Master shipment</div>
          <div className="font-mono text-[12px] text-frost-50">SPG-SHP-001284</div>
        </div>
      </div>
      <div className="divider-glow my-4" />
      <dl className="grid grid-cols-2 gap-y-2.5 text-[12px]">
        <dt className="text-steel-500">Customer</dt><dd className="text-right text-frost-100">Apex Industrial</dd>
        <dt className="text-steel-500">Route</dt><dd className="text-right text-frost-100">INPNQ → USHOU</dd>
        <dt className="text-steel-500">Modules</dt><dd className="text-right text-frost-100">11 linked</dd>
      </dl>
    </div>
  );
}

export function ShipmentCoreSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const show = inView || !!reduce;

  return (
    <section id="platform" aria-labelledby="platform-title" className="relative py-24 md:py-36">
      {/* continuity thread from hero */}
      <div aria-hidden className="absolute left-1/2 top-0 h-28 w-px bg-[linear-gradient(180deg,transparent,rgba(24,160,216,0.55))]" />
      <div className="container-x">
        <SectionHeading
          id="platform-title"
          align="center"
          eyebrow="One shipment · One platform"
          title={<>Everything moves<br className="hidden sm:block" /> with the shipment.</>}
          description="One master record connects commercial, operational, documentation and financial workflows from enquiry to completion."
        />

        {/* Desktop / tablet radial */}
        <div ref={ref} className="relative mx-auto mt-16 hidden aspect-[1000/600] max-w-[1100px] md:block">
          <div aria-hidden className="absolute inset-[18%] rounded-[50%] border border-steel-400/12" />
          <div aria-hidden className="absolute inset-[4%] rounded-[50%] border border-dashed border-steel-400/10" />
          <svg viewBox="0 0 1000 600" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="core-l" x1="0" x2="1">
                <stop offset="0" stopColor="#18A0D8" stopOpacity="0.65" />
                <stop offset="1" stopColor="#1C6FE8" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {paths.map((d, i) => (
              <motion.path
                key={i}
                id={`core-p-${i}`}
                d={d}
                fill="none"
                stroke="url(#core-l)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={show ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.1, ease: EASE, delay: 0.45 + i * 0.06 }}
              />
            ))}
            {show && !reduce && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 0.6 }}>
                {paths.map((_, i) => (
                  <circle key={i} r="2.4" fill="#18A0D8">
                    <animateMotion dur={`${2.8 + (i % 3) * 0.7}s`} repeatCount="indefinite" begin={`${(i * 0.37) % 2.5}s`} keyPoints={i % 2 ? "1;0" : "0;1"} keyTimes="0;1" calcMode="linear">
                      <mpath href={`#core-p-${i}`} />
                    </animateMotion>
                  </circle>
                ))}
              </motion.g>
            )}
          </svg>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={show ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, ease: EASE }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <MasterCard />
          </motion.div>

          {MODULES.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={show ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: EASE, delay: 0.9 + i * 0.06 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pts[i].x / 10}%`, top: `${pts[i].y / 6}%` }}
            >
              <div className="group surface flex items-center gap-2.5 rounded-xl py-2 pl-2 pr-3.5 transition-colors duration-300 hover:border-cargo-400/50">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-800 ring-1 ring-steel-400/15 transition-colors group-hover:bg-signal-500/15">
                  <m.icon className="h-3.5 w-3.5 text-steel-300 transition-colors group-hover:text-cargo-300" />
                </span>
                <div className="leading-tight">
                  <div className="text-[13px] font-medium text-frost-50">{m.label}</div>
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-steel-500">{m.meta}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile composition */}
        <div className="mt-12 md:hidden">
          <div className="flex justify-center"><MasterCard /></div>
          <div aria-hidden className="mx-auto h-8 w-px bg-[linear-gradient(180deg,rgba(24,160,216,0.6),rgba(24,160,216,0.08))]" />
          <motion.ul
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10%" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 gap-2"
          >
            {MODULES.map((m) => (
              <motion.li key={m.label} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="surface flex items-center gap-2.5 rounded-xl p-2.5">
                <m.icon className="h-4 w-4 shrink-0 text-cargo-300" />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[13px] text-frost-50">{m.label}</div>
                  <div className="truncate font-mono text-[9.5px] uppercase tracking-[0.1em] text-steel-500">{m.meta}</div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
