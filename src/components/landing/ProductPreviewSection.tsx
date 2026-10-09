import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  LayoutDashboard, Package, Radar, Inbox, FileText, Files, Wallet, Users, Search, Bell, AlertTriangle, Clock, ShieldAlert, Ship, Plane, Truck, TrainFront,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RouteNetwork } from "@/components/network/RouteNetwork";
import { HERO_ROUTE } from "@/lib/geo";
import { useOnScreen, useTicker } from "@/lib/motion";
import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/utils/cn";

const NAV = [
  { i: LayoutDashboard, l: "Dashboard" }, { i: Package, l: "Shipments" }, { i: Radar, l: "Control Tower" },
  { i: Inbox, l: "RFQs" }, { i: FileText, l: "Quotes" }, { i: Files, l: "Documents" }, { i: Wallet, l: "Finance" }, { i: Users, l: "Vendors" },
];

type Status = "In Transit" | "At Port" | "Customs" | "Delivered" | "Delayed";
export const STATUS_STYLE: Record<Status, string> = {
  "In Transit": "text-cargo-300 bg-cargo-400/10 ring-cargo-400/25",
  "At Port": "text-signal-600 bg-signal-400/10 ring-signal-400/30",
  Customs: "text-warn bg-warn/10 ring-warn/25",
  Delivered: "text-ok bg-ok/10 ring-ok/25",
  Delayed: "text-risk bg-risk/10 ring-risk/25",
};
const SEQ: Status[] = ["At Port", "Customs", "In Transit", "Delivered"];
const MODE_I = { Ocean: Ship, Air: Plane, Road: Truck, Rail: TrainFront };

const ROWS = [
  { id: "SPG-SHP-001284", r: "Pune → Houston", m: "Ocean" as const, s: 2, eta: "18 Oct" },
  { id: "SPG-SHP-001291", r: "Chennai → Hamburg", m: "Ocean" as const, s: 0, eta: "22 Oct" },
  { id: "SPG-SHP-001302", r: "Mumbai → Dubai", m: "Air" as const, s: 1, eta: "09 Oct" },
  { id: "SPG-SHP-001307", r: "Pune → Chennai", m: "Road" as const, s: 3, eta: "06 Oct" },
  { id: "SPG-SHP-001311", r: "ICD TKD → Mundra", m: "Rail" as const, s: 2, eta: "08 Oct" },
];

export function ProductPreviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const visible = useOnScreen(ref, "0px");
  const tick = useTicker(3200, visible && !reduce);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.93, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 1]);

  const hl = tick % ROWS.length;
  const rowStatus = (i: number): Status => {
    const bumps = Math.floor((tick + (ROWS.length - 1 - i)) / ROWS.length);
    return SEQ[(ROWS[i].s + bumps) % SEQ.length];
  };
  const active = 128 + (tick % 4 === 1 ? 1 : 0) + (tick % 4 === 2 ? 2 : 0) - (tick % 4 === 3 ? 1 : 0);
  const ontime = (94.2 + ((tick % 3) - 1) * 0.1).toFixed(1);

  return (
    <section id="capabilities" aria-labelledby="preview-title" className="relative overflow-hidden py-24 md:py-32">
      <div aria-hidden className="absolute left-1/2 top-[30%] h-[60%] w-[80%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(28,111,232,0.09),transparent_65%)] blur-2xl" />
      <div className="container-x relative">
        <SectionHeading
          id="preview-title"
          align="center"
          eyebrow="The CargoOS experience"
          title={<>Command every shipment<br className="hidden sm:block" /> from one workspace.</>}
          description="Live shipments, routes, milestones, exceptions and margins — in one operational view your whole team shares."
        />

        <div ref={ref} className="mt-14 [perspective:1600px] md:mt-20">
          <motion.div style={{ rotateX, scale, opacity, transformOrigin: "50% 0%" }} className="surface edge-light overflow-hidden rounded-2xl md:rounded-3xl" role="img" aria-label="Preview of the CargoOS operations dashboard">
            {/* top bar */}
            <div className="flex h-12 items-center gap-3 border-b border-steel-400/10 bg-ink-950/50 px-4">
              <LogoMark className="h-6 w-6" />
              <span className="hidden text-[12px] text-steel-500 sm:inline">Operations <span className="mx-1">/</span> <span className="text-frost-100">Dashboard</span></span>
              <div className="ml-auto flex h-8 w-full max-w-[320px] items-center gap-2 rounded-lg bg-ink-850 px-3 text-[12px] text-steel-500 ring-1 ring-steel-400/10">
                <Search className="h-3.5 w-3.5" /> <span className="truncate">Search shipments, B/L, containers…</span>
              </div>
              <Bell className="hidden h-4 w-4 text-steel-400 sm:block" />
              <span className="hidden h-7 w-7 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#2F86FF,#18A0D8)] text-[10px] font-medium text-white sm:grid">RK</span>
            </div>

            <div className="flex">
              {/* sidebar */}
              <aside className="hidden w-48 shrink-0 border-r border-steel-400/10 bg-ink-950/30 p-3 md:block">
                <ul className="space-y-0.5">
                  {NAV.map((n, i) => (
                    <li key={n.l} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px]", i === 0 ? "bg-signal-500/12 text-frost-50 ring-1 ring-signal-400/20" : "text-steel-400")}>
                      <n.i className={cn("h-3.5 w-3.5", i === 0 && "text-cargo-300")} /> {n.l}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-xl bg-ink-850/80 p-3 ring-1 ring-steel-400/10">
                  <div className="t-meta !text-[9px]">Workspace</div>
                  <div className="mt-1 text-[12px] text-frost-100">SPG Logistics · West</div>
                </div>
              </aside>

              {/* main */}
              <div className="min-w-0 flex-1 space-y-3 p-3 md:p-5">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { k: "Active shipments", v: String(active), d: "+12 this week", c: "text-cargo-300" },
                    { k: "On-time", v: `${ontime}%`, d: "Last 30 days", c: "text-ok" },
                    { k: "Exceptions", v: "7", d: "2 critical", c: "text-warn" },
                    { k: "Revenue MTD", v: "₹3.84 Cr", d: "Margin 17.9%", c: "text-steel-400" },
                  ].map((k) => (
                    <div key={k.k} className="rounded-xl bg-ink-850/70 p-3.5 ring-1 ring-steel-400/10">
                      <div className="t-meta !text-[9.5px]">{k.k}</div>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={k.v} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="t-num mt-1.5 text-xl font-light text-frost-50 md:text-2xl">
                          {k.v}
                        </motion.div>
                      </AnimatePresence>
                      <div className={cn("mt-1 text-[11px]", k.c)}>{k.d}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="relative overflow-hidden rounded-xl bg-ink-900/80 p-3 ring-1 ring-steel-400/10 lg:col-span-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] text-frost-100">Live routes</span>
                      <span className="font-mono text-[9.5px] tracking-[0.12em] text-steel-500">128 ACTIVE</span>
                    </div>
                    <RouteNetwork route={HERO_ROUTE} viewBox={{ x: 230, y: 90, w: 640, h: 230 }} lanes="lite" labelSize="sm" duration={18} />
                  </div>
                  <div className="rounded-xl bg-ink-900/80 p-3 ring-1 ring-steel-400/10">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[12px] text-frost-100">Exceptions</span>
                      <span className="rounded-full bg-warn/10 px-2 py-0.5 font-mono text-[9.5px] text-warn">7 OPEN</span>
                    </div>
                    <ul className="space-y-2">
                      {[
                        { i: ShieldAlert, t: "Customs hold", s: "SPG-SHP-001302 · DXB", c: "text-risk" },
                        { i: Clock, t: "Vessel delay +36h", s: "SPG-SHP-001291 · Colombo", c: "text-warn" },
                        { i: AlertTriangle, t: "B/L draft pending", s: "SPG-SHP-001284 · INNSA", c: "text-warn" },
                      ].map((e) => (
                        <li key={e.t} className="flex items-start gap-2.5 rounded-lg bg-ink-850/80 p-2.5 ring-1 ring-steel-400/[0.08]">
                          <e.i className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", e.c)} />
                          <div className="min-w-0">
                            <div className="text-[12px] text-frost-100">{e.t}</div>
                            <div className="truncate font-mono text-[9.5px] text-steel-500">{e.s}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl bg-ink-900/80 ring-1 ring-steel-400/10">
                  <table className="w-full text-left text-[12px]">
                    <thead className="border-b border-steel-400/10 text-steel-500">
                      <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9.5px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em]">
                        <th>Shipment</th><th className="hidden sm:table-cell">Route</th><th className="hidden md:table-cell">Mode</th><th>Status</th><th className="hidden sm:table-cell text-right">ETA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map((r, i) => {
                        const st = rowStatus(i);
                        const MI = MODE_I[r.m];
                        return (
                          <tr key={r.id} className={cn("border-b border-steel-400/[0.06] transition-colors duration-700 last:border-0 [&>td]:px-3 [&>td]:py-2.5", hl === i && !reduce ? "bg-signal-500/[0.08]" : "")}>
                            <td className="font-mono text-[11px] text-frost-100">{r.id}</td>
                            <td className="hidden text-steel-300 sm:table-cell">{r.r}</td>
                            <td className="hidden md:table-cell"><span className="inline-flex items-center gap-1.5 text-steel-300"><MI className="h-3.5 w-3.5 text-steel-400" />{r.m}</span></td>
                            <td>
                              <AnimatePresence mode="wait" initial={false}>
                                <motion.span key={st} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 4 }} transition={{ duration: 0.3 }} className={cn("inline-flex rounded-full px-2 py-0.5 text-[10.5px] ring-1", STATUS_STYLE[st])}>
                                  {st}
                                </motion.span>
                              </AnimatePresence>
                            </td>
                            <td className="t-num hidden text-right text-steel-300 sm:table-cell">{r.eta}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
