import { useNavigate, useParams } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { useCommercial } from "@/context/CommercialContext";
import { useApp } from "@/context/AppContext";
import { Btn, PageHead, Row, SummaryCard } from "@/components/app/commercial/parts";
import { EmptyState, KpiCard, Panel, Progress, StatusBadge } from "@/components/app/ui/primitives";
import { SHIPMENTS, STATUS_TONE } from "@/data/mockData";
import { QUOTE_TONE } from "@/data/commercial";

const MY_ID = "SPG-CUS-000128";

/* =========================================================
   CUSTOMER PORTAL — RFQs
   ========================================================= */
export function CustomerRfqsPage() {
  const { rfqs } = useCommercial();
  const { notify } = useApp();
  const mine = rfqs.filter((r) => r.customerId === MY_ID);

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Customer workspace" title="My Enquiries" support="Track the status of every enquiry you have raised with SPG Logistics."
        actions={<Btn variant="primary" onClick={() => notify("Enquiry form arrives with the customer portal phase")} icon={<Plus className="h-3.5 w-3.5" />}>New Enquiry</Btn>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total enquiries" value={mine.length} icon={FileText} tone="info" />
        <KpiCard label="Awaiting response" value={mine.filter((r) => ["New", "Qualified", "Rate Sourcing"].includes(r.status)).length} icon={FileText} tone="cyan" secondary="With SPG" />
        <KpiCard label="With you" value={mine.filter((r) => ["Quote Sent", "Awaiting Customer"].includes(r.status)).length} icon={FileText} tone="warn" secondary="Decision needed" />
        <KpiCard label="Won" value={mine.filter((r) => r.status === "Won").length} icon={FileText} tone="ok" secondary="Booked with us" />
      </div>

      <Panel title="Enquiries" bodyClass="p-0">
        {mine.length === 0 ? <EmptyState title="No enquiries yet" body="Raise an enquiry and it will appear here." /> : (
          <ul className="divide-y divide-steel-400/[0.08]">
            {mine.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-mono text-[12px] text-frost-50">{r.id}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{r.origin} → {r.destination} · {r.cargo.commodity}</span>
                <span className="text-[11.5px] text-steel-500">{r.created}</span>
                <StatusBadge tone={r.status === "Won" ? "ok" : r.status === "Lost" ? "risk" : "cyan"} dot={false}>{r.status}</StatusBadge>
                <Btn size="sm" variant="ghost" onClick={() => notify("Enquiry detail arrives with the customer portal phase")}>View</Btn>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   CUSTOMER PORTAL — Quotes
   ========================================================= */
export function CustomerQuotesPage() {
  const { quotes } = useCommercial();
  const nav = useNavigate();
  const mine = quotes.filter((q) => q.customerId === MY_ID);

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Customer workspace" title="My Quotations" support="Review, accept or decline the quotations we have prepared for you." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total quotations" value={mine.length} icon={FileText} tone="info" />
        <KpiCard label="Awaiting your decision" value={mine.filter((q) => ["Approved", "Sent", "Awaiting Customer"].includes(q.status)).length} icon={FileText} tone="warn" secondary="Action requested" />
        <KpiCard label="Accepted" value={mine.filter((q) => q.status === "Accepted").length} icon={FileText} tone="ok" />
        <KpiCard label="Expired" value={mine.filter((q) => q.status === "Expired").length} icon={FileText} tone="neutral" />
      </div>

      <Panel title="Quotations" bodyClass="p-0">
        {mine.length === 0 ? <EmptyState title="No quotations yet" body="Quotations we prepare for you will appear here." /> : (
          <ul className="divide-y divide-steel-400/[0.08]">
            {mine.map((q) => (
              <li key={q.id + q.version}>
                <button onClick={() => nav(`/app/customer/quotes/${q.id}`)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-left transition hover:bg-work-100">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[12px] text-frost-50">{q.id}-V{q.version}</span>
                      <StatusBadge tone={QUOTE_TONE[q.status]} dot={false}>{q.status}</StatusBadge>
                      {q.status === "Accepted" && <span className="rounded bg-ok/10 px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.1em] text-ok">Option {q.acceptedOption}</span>}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-steel-500">{q.options.length} options · valid until {q.validUntil}</span>
                  </span>
                  <span className="text-[12.5px] font-medium text-cargo-300">Review</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   CUSTOMER PORTAL — Quote detail (customer-facing)
   ========================================================= */
export function CustomerQuoteDetailPage() {
  const { quoteId = "" } = useParams();
  const nav = useNavigate();
  const { quotes } = useCommercial();
  const q = quotes.find((x) => x.id === quoteId);
  if (!q) return <EmptyState title="Quote not found" body="This quotation may have been removed." action={<Btn onClick={() => nav("/app/customer/quotes")}>Back</Btn>} />;

  return (
    <div className="space-y-4">
      <button onClick={() => nav("/app/customer/quotes")} className="text-[12.5px] text-steel-400 transition hover:text-frost-50">← My quotations</button>
      <CustomerQuoteBody quoteId={q.id} />
    </div>
  );
}

/* Re-export the shared customer-facing quote view, with the customer shell */
export { QuotePreviewPage } from "@/pages/app/quotes/QuotePages";

export function CustomerQuoteBody({ quoteId }: { quoteId: string }) {
  const { quotes, customerById, rfqById } = useCommercial();
  const nav = useNavigate();
  const q = quotes.find((x) => x.id === quoteId);
  if (!q) return null;
  const c = customerById(q.customerId);
  const r = rfqById(q.rfqId);
  return (
    <SummaryCard title="Quotation" tone="accent">
      <Row k="Quote" v={`${q.id}-V${q.version}`} mono />
      <Row k="Status" v={q.status} />
      {c && <Row k="Customer" v={c.company} />}
      {r && <Row k="Route" v={`${r.origin} → ${r.destination}`} />}
      {q.status === "Accepted" && (
        <div className="mt-3">
          <Btn size="sm" variant="primary" onClick={() => nav(`/app/bookings/new?quote=${q.id}`)}>Create Booking</Btn>
        </div>
      )}
      {q.status === "Accepted" && <Progress value={100} tone="ok" className="mt-3" />}
    </SummaryCard>
  );
}

export const CustomerPortalShipmentTone = STATUS_TONE;
export const CustomerPortalShipments = SHIPMENTS;
