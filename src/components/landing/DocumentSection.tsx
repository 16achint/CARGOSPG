import { motion, useReducedMotion } from "framer-motion";
import { FileText, Lock, CheckCircle2, AlertCircle, Clock3, Link2 } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EASE, viewportOnce } from "@/lib/motion";
import { cn } from "@/utils/cn";

type St = "Verified" | "Pending Review" | "Missing";
const DOCS: { n: string; meta: string; st: St; link: string }[] = [
  { n: "Commercial Invoice", meta: "INV-24-0913 · 284 KB", st: "Verified", link: "Booking" },
  { n: "Packing List", meta: "PL-24-0913 · 156 KB", st: "Verified", link: "Leg 1 · Road" },
  { n: "Bill of Lading", meta: "Draft v2 · MAEU 2284117", st: "Pending Review", link: "Leg 2 · Ocean" },
  { n: "Certificate of Origin", meta: "Required by consignee", st: "Missing", link: "Customs" },
  { n: "Shipping Bill", meta: "SB 7741029 · ICEGATE", st: "Verified", link: "Customs" },
  { n: "Proof of Delivery", meta: "Captured at Customer DC", st: "Pending Review", link: "Leg 4 · Road" },
];
const ST: Record<St, { c: string; i: typeof CheckCircle2 }> = {
  Verified: { c: "text-ok bg-ok/10 ring-ok/25", i: CheckCircle2 },
  "Pending Review": { c: "text-warn bg-warn/10 ring-warn/25", i: Clock3 },
  Missing: { c: "text-risk bg-risk/[0.06] ring-risk/40", i: AlertCircle },
};

export function DocumentSection() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="docs-title" className="relative py-24 md:py-32">
      <div aria-hidden className="absolute right-0 top-1/4 h-[50%] w-[50%] rounded-full bg-[radial-gradient(circle,rgba(28,111,232,0.08),transparent_65%)] blur-2xl" />
      <div className="container-x relative grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <SectionHeading
            id="docs-title"
            eyebrow="Document control"
            title={<>Every document.<br />Connected to the shipment.</>}
            description="Invoices, packing lists, bills of lading and customs filings live inside the shipment they belong to — versioned, verified and visible to the right people."
          />
          <motion.ul initial="hidden" whileInView="show" viewport={viewportOnce} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }} className="mt-8 space-y-3">
            {[
              ["Verification workflow", "Review, approve or reject with a full audit trail."],
              ["Linked to legs & milestones", "Each document knows which movement it supports."],
              ["Missing-document alerts", "Gaps surface before they become customs delays."],
            ].map(([t, d]) => (
              <motion.li key={t} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex gap-3">
                <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-cargo-400/80" />
                <div><div className="text-[14px] text-frost-50">{t}</div><div className="t-body !text-[13.5px]">{d}</div></div>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <div className="lg:col-span-7">
          <div className="surface edge-light relative overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-steel-400/12 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-800 ring-1 ring-cargo-400/35"><Lock className="h-4 w-4 text-cargo-300" /></span>
                <div>
                  <div className="text-[14px] text-frost-50">Shipment vault</div>
                  <div className="font-mono text-[10px] tracking-[0.1em] text-steel-500">SPG-SHP-001284 · ENCRYPTED</div>
                </div>
              </div>
              <div className="text-right">
                <div className="t-num text-lg font-light text-frost-50">12<span className="text-steel-500">/13</span></div>
                <div className="t-meta !text-[9px]">Complete</div>
              </div>
            </div>

            <div className="relative p-3 md:p-4">
              {!reduce && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[9%] animate-scan bg-[linear-gradient(180deg,transparent,rgba(24,160,216,0.16),transparent)]" />}
              <ul className="space-y-2">
                {DOCS.map((d, i) => {
                  const S = ST[d.st];
                  return (
                    <motion.li
                      key={d.n}
                      initial={{ opacity: 0, x: 48 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={viewportOnce}
                      transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.09 }}
                      className={cn("group flex items-center gap-3 rounded-2xl p-3 ring-1 transition-colors duration-300 md:gap-4 md:p-3.5", d.st === "Missing" ? "bg-risk/[0.04] ring-risk/25 hover:ring-risk/45" : "bg-white ring-steel-400/12 shadow-[0_1px_2px_rgba(16,44,73,0.03)] hover:ring-steel-400/30")}
                    >
                      <span className={cn("grid h-10 w-9 shrink-0 place-items-center rounded-lg ring-1", d.st === "Missing" ? "border border-dashed border-risk/45 bg-white ring-transparent" : "bg-ink-800 ring-steel-400/15")}>
                        <FileText className={cn("h-4 w-4", d.st === "Missing" ? "text-risk" : "text-steel-300")} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] text-frost-50">{d.n}</div>
                        <div className="truncate font-mono text-[10px] text-steel-500">{d.meta}</div>
                      </div>
                      <span className="hidden items-center gap-1 font-mono text-[10px] text-steel-500 md:flex"><Link2 className="h-3 w-3" />{d.link}</span>
                      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10.5px] ring-1", S.c)}>
                        <S.i className="h-3 w-3" /><span className="hidden sm:inline">{d.st}</span>
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
            <div className="border-t border-steel-400/12 px-5 py-3.5">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-steel-400">Vault completeness</span>
                <span className="text-warn">1 action required</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-steel-400/15">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "92.3%" }} viewport={viewportOnce} transition={{ duration: 1.4, ease: EASE, delay: 0.6 }} className="h-full rounded-full bg-[linear-gradient(90deg,#1C6FE8,#18A0D8)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
