import { BarChart3, CircleCheckBig, FileCheck2, Radar } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EASE, viewportOnce } from "@/lib/motion";

const STEPS = [
  { icon: CircleCheckBig, label: "Commercial ready", title: "Turn enquiries into confident quotes", detail: "Keep rates, routing options and approvals tied to the opportunity before it becomes a job." },
  { icon: Radar, label: "Execution connected", title: "Coordinate every leg and exception", detail: "Bookings, milestones, vendors and customer updates stay aligned as cargo moves." },
  { icon: FileCheck2, label: "Documents controlled", title: "Prepare paperwork with context", detail: "Track requirements, drafts and releases against the shipment—not a separate inbox." },
  { icon: BarChart3, label: "Finance visible", title: "Protect margin while you operate", detail: "Bring expected costs, actuals, billing and profitability into the same operational record." },
];

export function WorkflowSection() {
  return (
    <section aria-labelledby="workflow-title" className="relative overflow-hidden py-24 md:py-32">
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(231,238,246,0.58)_50%,transparent)]" />
      <div className="container-x relative">
        <SectionHeading
          id="workflow-title"
          align="center"
          eyebrow="From first enquiry to final margin"
          title={<>Less handoff. More control<br className="hidden sm:block" /> at every step.</>}
          description="CargoOS gives each team the next action, the latest context and a shared view of the shipment lifecycle."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
              className="surface group rounded-2xl p-6 md:p-7"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal-500/10 ring-1 ring-cargo-400/25 transition-colors group-hover:bg-signal-500/15">
                  <step.icon className="h-4.5 w-4.5 text-cargo-300" strokeWidth={1.7} />
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-steel-500">0{i + 1}</span>
              </div>
              <p className="t-meta mt-8 !text-[9.5px] !text-cargo-300">{step.label}</p>
              <h3 className="mt-2 text-[17px] font-medium leading-snug text-frost-50">{step.title}</h3>
              <p className="t-body mt-3 !text-[14px]">{step.detail}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
