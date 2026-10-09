import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Skeleton, StatusBadge } from "@/components/app/ui/primitives";
import { EASE } from "@/lib/motion";

export interface PlaceholderSpec {
  title: string;
  support: string;
  phase: string;
  preview?: "table" | "cards" | "list" | "chart";
  bullets?: string[];
}

const DEFAULTS: Record<string, PlaceholderSpec> = {
  customers: { title: "Customers", support: "Manage customer accounts, contacts, credit terms and shipping history.", phase: "Coming in the Commercial phase", preview: "table", bullets: ["Account hierarchy and branches", "Contacts and notification preferences", "Credit limits and payment terms"] },
  rfqs: { title: "RFQs", support: "Capture enquiries, assign pricing owners and track response timelines.", phase: "Coming in the Commercial phase", preview: "table", bullets: ["Enquiry intake and triage", "Rate request distribution", "Response SLA tracking"] },
  rates: { title: "Rates", support: "Maintain carrier contracts, spot rates and surcharge libraries by lane and mode.", phase: "Coming in the Commercial phase", preview: "table", bullets: ["Contract and spot rates", "Surcharges and validity windows", "Lane-level margin guidance"] },
  quotes: { title: "Quotations", support: "Build, approve and send customer quotations with live margin visibility.", phase: "Coming in the Commercial phase", preview: "table", bullets: ["Multi-option quotations", "Approval thresholds", "Validity and revision control"] },
  bookings: { title: "Bookings", support: "Confirm sales orders into executable shipments with carrier allocations.", phase: "Coming in the Execution phase", preview: "table", bullets: ["Carrier booking confirmation", "Equipment allocation", "Cargo readiness tracking"] },
  shipments: { title: "Shipments", support: "Manage multimodal shipments, journey legs, milestones and exceptions.", phase: "Coming in the Shipment Execution phase", preview: "table", bullets: ["Master shipment and legs", "Milestone and ETA management", "Vendor and cost assignment"] },
  "control-tower": { title: "Control Tower", support: "Monitor every movement, risk and pending action across the global network.", phase: "Coming in the Execution phase", preview: "chart", bullets: ["Live network monitoring", "Exception triage queues", "Predictive delay alerts"] },
  documents: { title: "Documents", support: "A secure shipment vault for every commercial, customs and delivery document.", phase: "Coming in the Execution phase", preview: "list", bullets: ["Verification workflow", "Version and audit history", "Missing-document alerts"] },
  customs: { title: "Customs", support: "Track filings, assessments and clearance across every regime and broker.", phase: "Coming in the Execution phase", preview: "table", bullets: ["Filing status per regime", "Broker assignment", "Assessment and duty tracking"] },
  warehouse: { title: "Warehouse", support: "Manage CFS and warehouse activity, inventory and service orders.", phase: "Coming in the Execution phase", preview: "cards", bullets: ["Inbound and outbound orders", "Inventory and bin status", "Service and handling charges"] },
  vendors: { title: "Vendors", support: "Maintain the carrier, broker and warehouse network with performance data.", phase: "Coming in the Network phase", preview: "table", bullets: ["Vendor profiles and services", "Rate agreements", "Performance and POD compliance"] },
  finance: { title: "Finance", support: "Customer invoicing, vendor bills, payables and shipment profitability.", phase: "Coming in the Finance phase", preview: "table", bullets: ["Invoice and bill management", "Receivables and payables ageing", "Job-level profitability"] },
  reports: { title: "Reports", support: "Operational and financial reporting across modes, lanes, teams and customers.", phase: "Coming in the Intelligence phase", preview: "chart", bullets: ["Saved report definitions", "Scheduled distribution", "Export and API access"] },
  users: { title: "Users & Roles", support: "Manage workspace users, role assignment and access boundaries.", phase: "Coming in the Administration phase", preview: "table", bullets: ["User provisioning", "Role templates", "Branch and data scoping"] },
  roles: { title: "Roles", support: "Define permission sets for each operational role in the workspace.", phase: "Coming in the Administration phase", preview: "list", bullets: ["Module-level permissions", "Field-level restrictions", "Approval authority"] },
  "master-data": { title: "Master Data", support: "Central reference data for ports, locations, equipment, charges and currencies.", phase: "Coming in the Administration phase", preview: "cards", bullets: ["Ports and locations", "Charge and surcharge codes", "Equipment catalogue"] },
  audit: { title: "Audit Logs", support: "A complete, immutable trail of changes across every CargoOS record.", phase: "Coming in the Administration phase", preview: "list", bullets: ["Field-level change history", "Actor and timestamp capture", "Export for compliance"] },
  settings: { title: "Settings", support: "Workspace preferences, notifications and personal configuration.", phase: "Coming in a later phase", preview: "list", bullets: ["Notification preferences", "Display and units", "Language and timezone"] },
};

function PreviewSkeleton({ kind }: { kind: PlaceholderSpec["preview"] }) {
  if (kind === "cards")
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white p-4 ring-1 ring-steel-400/12">
            <Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-2.5 w-full" /><Skeleton className="mt-2 h-2.5 w-2/3" /><Skeleton className="mt-4 h-7 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  if (kind === "list")
    return (
      <ul className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-steel-400/12">
            <Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-3 flex-1" /><Skeleton className="h-5 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    );
  if (kind === "chart")
    return (
      <div className="rounded-xl bg-white p-5 ring-1 ring-steel-400/12">
        <div className="flex h-40 items-end gap-2.5">
          {[42, 58, 36, 71, 52, 80, 64, 47, 68, 55, 74, 61].map((h, i) => (
            <motion.div key={i} className="flex-1 rounded-t-md bg-[linear-gradient(180deg,#1C6FE8,#18A0D8)] opacity-80"
              initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.7, ease: EASE, delay: i * 0.04 }} />
          ))}
        </div>
        <div className="mt-3 flex gap-3"><Skeleton className="h-2.5 flex-1" /><Skeleton className="h-2.5 flex-1" /><Skeleton className="h-2.5 flex-1" /></div>
      </div>
    );
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-steel-400/12">
      <div className="flex gap-5 border-b border-steel-400/12 bg-work-50 px-4 py-2.5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-2.5" style={{ width: `${[14, 18, 22, 12, 16][i]}%` }} />)}
      </div>
      <div className="divide-y divide-steel-400/[0.08]">
        {Array.from({ length: 7 }).map((_, r) => (
          <div key={r} className="flex items-center gap-5 px-4 py-3">
            {Array.from({ length: 5 }).map((_, c) => <Skeleton key={c} className="h-3" style={{ width: `${[13, 17, 21, 11, 15][c]}%` }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlaceholderPage({ specKey, override }: { specKey: string; override?: Partial<PlaceholderSpec> }) {
  const base = DEFAULTS[specKey] ?? { title: "Module", support: "This workspace is planned for a later phase.", phase: "Coming soon", preview: "table" as const };
  const spec: PlaceholderSpec = { ...base, ...override };
  const { home } = useApp();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}>
        <StatusBadge tone="cyan" dot>{spec.phase}</StatusBadge>
        <h1 className="mt-3 text-[24px] font-light tracking-[-0.025em] text-frost-50 md:text-[30px]">{spec.title}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-steel-400">{spec.support}</p>
      </motion.div>

      {spec.bullets && (
        <motion.ul initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
          className="grid gap-2.5 sm:grid-cols-3">
          {spec.bullets.map((b) => (
            <motion.li key={b} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              className="rounded-xl bg-white p-3.5 ring-1 ring-steel-400/12">
              <span className="mb-2 block h-1 w-6 rounded-full bg-cargo-400/70" />
              <span className="text-[12.5px] leading-snug text-steel-300">{b}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }}>
        <p className="t-meta mb-2.5">Planned layout preview</p>
        <PreviewSkeleton kind={spec.preview} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.35 }}
        className="app-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="max-w-md text-[12.5px] leading-relaxed text-steel-400">
          This module is intentionally not part of the current phase. The dashboard, shell, search and navigation you are using are live.
        </p>
        <Link to={home} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-frost-50 ring-1 ring-steel-400/25 transition hover:ring-steel-400/50">
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Overview
        </Link>
      </motion.div>

      <p className="flex items-center gap-1.5 text-[12px] text-steel-500">
        <ArrowRight className="h-3 w-3" /> You reached <span className="font-mono text-steel-400">/app/{specKey}</span>
      </p>
    </div>
  );
}
