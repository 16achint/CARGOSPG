import { BellRing, Cable, ChartNoAxesCombined, Handshake, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EASE, viewportOnce } from "@/lib/motion";

const CAPABILITIES = [
  { icon: MonitorSmartphone, title: "Customer visibility", description: "Share live milestones, documents and updates through a branded experience that reduces status-chasing.", tags: ["Live tracking", "Document access", "Proactive updates"] },
  { icon: Handshake, title: "Vendor coordination", description: "Assign work, collect confirmations and keep partner activity attached to the shipment record.", tags: ["Leg assignments", "Rate confirmations", "Proof of delivery"] },
  { icon: BellRing, title: "Exception management", description: "Surface delays, missing documents and critical holds early so your team can act before customers ask.", tags: ["Risk alerts", "Action queues", "Owner visibility"] },
  { icon: ChartNoAxesCombined, title: "Operational intelligence", description: "Turn day-to-day activity into clearer decisions with performance, volume and margin reporting.", tags: ["On-time performance", "Profitability", "Workload trends"] },
  { icon: Cable, title: "Connected workflows", description: "Bring rates, documents, finance and operations into one reliable flow instead of stitching together spreadsheets.", tags: ["Shared records", "Role-based workspaces", "Audit trail"] },
  { icon: ShieldCheck, title: "Governed access", description: "Give every participant only the information and actions relevant to their role, with a clear history of change.", tags: ["Roles & permissions", "Activity history", "Workspace controls"] },
];

export function OperationsCapabilitiesSection() {
  return (
    <section id="solutions" aria-labelledby="solutions-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            id="solutions-title"
            className="lg:col-span-7"
            eyebrow="Built for logistics teams"
            title={<>The detail your operation<br className="hidden sm:block" /> needs to move faster.</>}
            description="A connected workspace for the decisions, handoffs and proof that keep global logistics running smoothly."
          />
          <p className="t-body max-w-[390px] lg:col-span-5 lg:justify-self-end">From the first quote to final billing, every team works from current information—without losing the accountability that complex movements demand.</p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-steel-400/15 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability, i) => (
            <motion.article
              key={capability.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
              className="group bg-ink-900 p-6 transition-colors duration-500 hover:bg-ink-850 md:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-800 ring-1 ring-steel-400/15 transition-colors group-hover:bg-signal-500/12 group-hover:ring-cargo-400/30">
                  <capability.icon className="h-5 w-5 text-steel-300 transition-colors group-hover:text-cargo-300" strokeWidth={1.55} />
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-steel-500">0{i + 1}</span>
              </div>
              <h3 className="mt-8 text-[18px] font-medium text-frost-50">{capability.title}</h3>
              <p className="t-body mt-3 !text-[14px]">{capability.description}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {capability.tags.map((tag) => (
                  <li key={tag} className="rounded-md bg-ink-800 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-steel-400 ring-1 ring-steel-400/10">{tag}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
