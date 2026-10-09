import { motion } from "framer-motion";
import { Database, Layers3, ScanEye, Scale } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EASE, viewportOnce } from "@/lib/motion";

const V = [
  { i: Database, t: "One source of truth", d: "No repeated shipment data across disconnected systems, spreadsheets and inboxes." },
  { i: Layers3, t: "Multimodal by design", d: "Road, Sea, Air and Rail legs work together inside one shipment model." },
  { i: ScanEye, t: "Operational visibility", d: "Milestones, documents, vendors and exceptions in one place — for every team." },
  { i: Scale, t: "Financial control", d: "Revenue, expected cost, actual cost and margin stay connected to the job." },
];

export function ValueSection() {
  return (
    <section id="why" aria-labelledby="why-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <SectionHeading id="why-title" eyebrow="Why CargoOS" title={<>Built for the way cargo<br className="hidden sm:block" /> actually moves.</>} />
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-steel-400/10 sm:grid-cols-2 lg:grid-cols-4">
          {V.map((v, i) => (
            <motion.article
              key={v.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
              className="group relative bg-ink-900 p-6 transition-colors duration-500 hover:bg-ink-850 md:p-8"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,#18A0D8,transparent)] transition-transform duration-700 ease-out group-hover:scale-x-100" />
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-800 ring-1 ring-steel-400/15 transition-colors duration-500 group-hover:ring-cargo-400/35">
                  <v.i className="h-5 w-5 text-steel-300 transition-colors duration-500 group-hover:text-cargo-300" strokeWidth={1.5} />
                </span>
                <span className="font-mono text-[11px] text-steel-500">0{i + 1}</span>
              </div>
              <h3 className="mt-10 font-mono text-[12px] uppercase tracking-[0.16em] text-frost-50">{v.t}</h3>
              <p className="t-body mt-3 !text-[14px]">{v.d}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
