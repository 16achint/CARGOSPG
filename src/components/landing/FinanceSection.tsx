import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CountUp } from "@/components/ui/CountUp";
import { EASE, inr, viewportOnce } from "@/lib/motion";
import { cn } from "@/utils/cn";

const REVENUE = 420000;
const COSTS = [
  { k: "Ocean Freight", exp: 205000, act: 210000, c: "#1C6FE8" },
  { k: "Transport", exp: 60000, act: 58000, c: "#18A0D8" },
  { k: "Customs", exp: 32000, act: 34000, c: "#63788E" },
  { k: "Documentation", exp: 14000, act: 14000, c: "#8496A9" },
  { k: "Warehouse", exp: 25000, act: 25000, c: "#C0CCDA" },
];
const ACTUAL = COSTS.reduce((a, c) => a + c.act, 0);
const PROFIT = REVENUE - ACTUAL;

export function FinanceSection() {
  return (
    <section aria-labelledby="fin-title" className="relative py-24 md:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:order-2 lg:col-span-5 lg:pl-6">
          <SectionHeading
            id="fin-title"
            eyebrow="Financial visibility"
            title={<>Know the shipment.<br />Know the margin.</>}
            description="Revenue, expected cost, actual vendor cost and gross margin stay attached to the job — so profitability is visible while the cargo is still moving."
          />
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              ["Expected vs actual", "Variance flagged per cost head"],
              ["Vendor invoices", "Matched to legs and services"],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-steel-400/10 bg-ink-900/50 p-4">
                <div className="text-[13.5px] text-frost-50">{t}</div>
                <div className="mt-1 text-[12.5px] leading-relaxed text-steel-500">{d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:order-1 lg:col-span-7">
          <div className="surface edge-light overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-steel-400/10 px-5 py-4">
              <div>
                <div className="text-[14px] text-frost-50">Job profitability</div>
                <div className="font-mono text-[10px] tracking-[0.1em] text-steel-500">SPG-SHP-001284 · INR</div>
              </div>
              <span className="rounded-full bg-ok/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-ok ring-1 ring-ok/25">HEALTHY</span>
            </div>

            <dl className="grid grid-cols-2 gap-px bg-steel-400/10 md:grid-cols-4">
              {[
                { k: "Revenue", v: REVENUE, f: inr, c: "text-frost-50" },
                { k: "Actual cost", v: ACTUAL, f: inr, c: "text-frost-50" },
                { k: "Gross profit", v: PROFIT, f: inr, c: "text-ok" },
                { k: "Gross margin", v: (PROFIT / REVENUE) * 100, f: (n: number) => `${n.toFixed(2)}%`, c: "text-cargo-300" },
              ].map((m) => (
                <div key={m.k} className="bg-ink-900 p-4 md:p-5">
                  <dt className="t-meta !text-[9.5px]">{m.k}</dt>
                  <dd className={cn("t-num mt-2 text-xl font-light md:text-[1.6rem]", m.c)}><CountUp to={m.v} format={m.f} duration={1.8} /></dd>
                </div>
              ))}
            </dl>

            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between text-[11px] text-steel-500">
                <span className="t-meta !text-[9.5px]">Revenue allocation</span>
                <span className="font-mono">{((ACTUAL / REVENUE) * 100).toFixed(1)}% cost · {((PROFIT / REVENUE) * 100).toFixed(1)}% margin</span>
              </div>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-steel-400/10" aria-hidden>
                {COSTS.map((c, i) => (
                  <motion.div key={c.k} initial={{ width: 0 }} whileInView={{ width: `${(c.act / REVENUE) * 100}%` }} viewport={viewportOnce} transition={{ duration: 1.1, ease: EASE, delay: 0.2 + i * 0.1 }} style={{ background: c.c }} className="h-full border-r border-ink-900" />
                ))}
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${(PROFIT / REVENUE) * 100}%` }} viewport={viewportOnce} transition={{ duration: 1.1, ease: EASE, delay: 0.8 }} className="h-full bg-ok" />
              </div>

              <table className="mt-6 w-full text-[13px]">
                <caption className="sr-only">Cost breakdown expected versus actual</caption>
                <thead>
                  <tr className="text-left [&>th]:pb-2 [&>th]:font-mono [&>th]:text-[9.5px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500">
                    <th>Cost head</th><th className="text-right">Expected</th><th className="text-right">Actual</th><th className="hidden text-right sm:table-cell">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {COSTS.map((c) => {
                    const v = c.act - c.exp;
                    return (
                      <tr key={c.k} className="border-t border-steel-400/[0.08] [&>td]:py-2.5">
                        <td><span className="flex items-center gap-2.5 text-frost-100"><i className="h-2 w-2 rounded-sm" style={{ background: c.c }} />{c.k}</span></td>
                        <td className="t-num text-right text-steel-400">{inr(c.exp)}</td>
                        <td className="t-num text-right text-frost-100">{inr(c.act)}</td>
                        <td className={cn("t-num hidden text-right sm:table-cell", v > 0 ? "text-warn" : v < 0 ? "text-ok" : "text-steel-500")}>{v === 0 ? "—" : `${v > 0 ? "+" : "−"}${inr(Math.abs(v))}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
