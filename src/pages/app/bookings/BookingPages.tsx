import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ChevronRight, Package, Plus } from "lucide-react";
import { useCommercial } from "@/context/CommercialContext";
import { useApp } from "@/context/AppContext";
import {
  Btn, Field, Input, PageHead, Row, RouteSummary, SectionTitle, SummaryCard, Textarea,
} from "@/components/app/commercial/parts";
import { EmptyState, KpiCard, Panel, StatusBadge, type ToneKey } from "@/components/app/ui/primitives";
import { inr, optionMargin, optionSell, optionTotals, type BookingRec } from "@/data/commercial";
import { cn } from "@/utils/cn";

const OPS = ["Rhea Kulkarni", "Sanjay Patil", "D. Menon", "S. Iyer", "P. Joshi"];
const BTONE: Record<BookingRec["status"], ToneKey> = {
  "Pending Confirmation": "warn", Confirmed: "ok", "Ready for Operations": "cyan", Cancelled: "risk",
};

/* =========================================================
   LIST
   ========================================================= */
export function BookingListPage() {
  const { bookings, customers, quotes } = useCommercial();
  const nav = useNavigate();
  const cust = (id: string) => customers.find((c) => c.id === id)?.company ?? id;

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Commercial · Bookings" title="Bookings" support="Confirmed quotations handed over to operations for shipment creation."
        actions={<Btn variant="primary" onClick={() => nav("/app/quotes")} icon={<Plus className="h-3.5 w-3.5" />}>New Booking</Btn>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(["Pending Confirmation", "Confirmed", "Ready for Operations", "Cancelled"] as const).map((s) => (
          <KpiCard key={s} label={s} value={bookings.filter((b) => b.status === s).length} icon={Package} tone={BTONE[s]} />
        ))}
      </div>

      <Panel bodyClass="p-0">
        {bookings.length === 0 ? (
          <EmptyState title="No bookings available" body="Accept a quotation to create the first booking."
            action={<Btn variant="primary" onClick={() => nav("/app/quotes")}>Go to Quotations</Btn>} />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[820px] text-left text-[12.5px]">
              <caption className="sr-only">Booking list</caption>
              <thead className="border-b border-steel-400/12 bg-work-50/70">
                <tr className="[&>th]:whitespace-nowrap [&>th]:px-3.5 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500">
                  <th>Booking ID</th><th>Quote</th><th>Customer</th><th>Route</th><th>Mode</th>
                  <th>Confirmation date</th><th>Status</th><th>Ops owner</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} onClick={() => nav(`/app/bookings/${b.id}`)}
                    className="cursor-pointer border-b border-steel-400/[0.07] transition-colors last:border-0 hover:bg-work-100 [&>td]:whitespace-nowrap [&>td]:px-3.5 [&>td]:py-2.5">
                    <td className="font-mono text-[11.5px] text-frost-50">{b.id}</td>
                    <td className="font-mono text-[11px] text-steel-400">{b.quoteId}</td>
                    <td className="max-w-[150px] truncate text-steel-300">{cust(b.customerId)}</td>
                    <td className="text-steel-300">{b.origin} → {b.destination}</td>
                    <td className="capitalize text-steel-300">{b.mode}</td>
                    <td className="text-steel-400">{b.confirmDate}</td>
                    <td><StatusBadge tone={BTONE[b.status]} dot={false}>{b.status}</StatusBadge></td>
                    <td className="text-steel-400">{b.opsOwner}</td>
                    <td className="text-right"><ChevronRight className="ml-auto h-4 w-4 text-steel-500" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Quotes ready to book" subtitle="Accepted and awaiting handover" bodyClass="p-0">
        {quotes.filter((q) => q.status === "Accepted").length === 0 ? (
          <p className="px-4 py-8 text-center text-[12.5px] text-steel-500">No accepted quotations awaiting booking.</p>
        ) : (
          <ul className="divide-y divide-steel-400/[0.08]">
            {quotes.filter((q) => q.status === "Accepted" && !bookings.some((b) => b.quoteId === q.id)).map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-mono text-[12px] text-frost-50">{q.id}-V{q.version}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{cust(q.customerId)} · Option {q.acceptedOption}</span>
                <Btn size="sm" variant="primary" onClick={() => nav(`/app/bookings/new?quote=${q.id}`)}>Create Booking</Btn>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   NEW — inherits the accepted quote
   ========================================================= */
export function BookingNewPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { notify } = useApp();
  const { quotes, customerById, rfqById, addBooking, nextBookingId, bookings } = useCommercial();
  const quoteId = params.get("quote") ?? quotes.find((q) => q.status === "Accepted" && !bookings.some((b) => b.quoteId === q.id))?.id ?? "";
  const q = quotes.find((x) => x.id === quoteId);

  const [form, setForm] = useState({ ref: "", confirmDate: "2025-10-06", opsOwner: OPS[0], carrierRef: "", pickup: "", departure: "", arrival: "", notes: "" });
  const [created, setCreated] = useState<BookingRec | null>(null);

  if (!q) return <EmptyState title="No accepted quotation" body="Bookings are created from an accepted quotation. Accept a quote first."
    action={<Btn variant="primary" onClick={() => nav("/app/quotes")}>Go to Quotations</Btn>} />;

  const c = customerById(q.customerId);
  const r = rfqById(q.rfqId);
  const optKey = q.acceptedOption ?? q.options[0].key;
  const opt = q.options.find((o) => o.key === optKey) ?? q.options[0];
  const totals = optionTotals(opt.charges);
  const bookingId = useMemo(() => nextBookingId(q.rfqId), [nextBookingId, q.rfqId]);

  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="app-panel p-6 text-center md:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/10 ring-1 ring-ok/30 shadow-[0_0_36px_-12px_rgba(11,122,85,0.6)]"><Check className="h-6 w-6 text-ok" strokeWidth={2.2} /></span>
          <p className="t-eyebrow mt-5">Booking confirmed</p>
          <h2 className="mt-2 text-[24px] font-light tracking-[-0.025em] text-frost-50">{created.id}</h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-steel-400">Commercial handoff is ready for shipment setup.</p>
          <dl className="mx-auto mt-6 max-w-sm divide-y divide-steel-400/12 rounded-xl bg-work-100 p-3.5 text-left">
            <Row k="Booking" v={created.id} mono />
            <Row k="Quote" v={`${created.quoteId} · Option ${created.optionKey}`} mono />
            <Row k="Customer" v={c?.company ?? ""} />
            <Row k="Route" v={`${created.origin} → ${created.destination}`} />
            <Row k="Selling price" v={inr(created.sellingPrice)} />
            <Row k="Ops owner" v={created.opsOwner} />
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Btn variant="primary" onClick={() => nav(`/app/bookings/${created.id}`)}>View Booking</Btn>
            <Btn onClick={() => notify("Master shipment creation arrives in the Shipment Execution phase")}>Create Master Shipment</Btn>
            <Btn variant="ghost" onClick={() => nav("/app/bookings")}>All bookings</Btn>
          </div>
        </motion.div>
      </div>
    );
  }

  const confirm = () => {
    const rec: BookingRec = {
      id: bookingId, quoteId: q.id, optionKey: optKey, rfqId: q.rfqId, customerId: q.customerId,
      origin: r?.origin ?? "", destination: r?.destination ?? "", mode: r?.mode ?? opt.mode,
      service: r?.service ?? "D2D", cargoSummary: r ? `${r.cargo.commodity} · ${r.cargo.packages} ${r.cargo.packageType.toLowerCase()} · ${r.cargo.weight} ${r.cargo.weightUnit}` : "",
      sellingPrice: totals.sellingPrice, marginPct: totals.marginPct,
      ref: form.ref || bookingId, confirmDate: form.confirmDate, opsOwner: form.opsOwner, carrierRef: form.carrierRef,
      pickup: form.pickup, departure: form.departure, arrival: form.arrival, notes: form.notes,
      status: "Confirmed",
    };
    addBooking(rec);
    setCreated(rec);
    notify(`${rec.id} confirmed`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHead eyebrow={`New booking · ${bookingId}`} title="Confirm Booking" support="Everything below is inherited from the accepted quotation. Only operational fields need to be entered." />

      <div className="app-panel p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge tone="ok">Accepted</StatusBadge>
          <span className="font-mono text-[12px] text-frost-50">{q.id}-V{q.version}</span>
          <span className="text-[12.5px] text-steel-400">Selected option · <span className="text-frost-50">Option {optKey} — {opt.name}</span></span>
          <span className="ml-auto t-num text-[13.5px] text-frost-50">{inr(optionSell(opt))}</span>
        </div>
        {r && <div className="mt-4"><RouteSummary origin={r.origin} originCode={r.originCode} destination={r.destination} destCode={r.destCode} mode={r.mode} service={r.service} /></div>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px] md:gap-5">
        <div className="space-y-4">
          <Panel title="Inherited from accepted quote" subtitle="Read-only" bodyClass="p-4 md:p-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-cargo-400/[0.08] px-2.5 py-1.5 ring-1 ring-cargo-400/25">
              <span className="h-1.5 w-1.5 rounded-full bg-cargo-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cargo-300">Inherited from accepted quote</span>
            </div>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <Row k="Customer" v={c?.company ?? "—"} />
              <Row k="Customer ID" v={q.customerId} mono />
              <Row k="Origin" v={r?.origin ?? "—"} />
              <Row k="Destination" v={r?.destination ?? "—"} />
              <Row k="Cargo" v={r?.cargo.commodity ?? "—"} />
              <Row k="Packages" v={r ? `${r.cargo.packages} × ${r.cargo.packageType}` : "—"} />
              <Row k="Gross weight" v={r ? `${r.cargo.weight} ${r.cargo.weightUnit}` : "—"} />
              <Row k="Volume" v={r ? `${r.cargo.volume} ${r.cargo.volumeUnit}` : "—"} />
              <Row k="Equipment" v={r?.cargo.containerType ?? "—"} />
              <Row k="Mode" v={r?.mode ?? "—"} />
              <Row k="Service" v={r?.service ?? "—"} />
              <Row k="Quote option" v={`Option ${optKey} — ${opt.name}`} />
            </dl>
            <div className="mt-5 border-t border-steel-400/12 pt-4">
              <SectionTitle>Commercial summary</SectionTitle>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <Row k="Selling price" v={inr(totals.sellingPrice)} />
                <Row k="Gross profit" v={inr(totals.grossProfit)} tone="text-ok" />
                <Row k="Gross margin" v={`${totals.marginPct.toFixed(2)}%`} tone="text-ok" />
                <Row k="Transit time" v={opt.transit} />
                <Row k="Credit terms" v={c?.billing.creditTerms ?? "—"} />
                <Row k="Currency" v={c?.billing.currency ?? "INR"} />
              </dl>
            </div>
          </Panel>

          <Panel title="Operational details" subtitle="The only fields you need to enter" bodyClass="p-4 md:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="bref" label="Booking reference" hint="Leave blank to use the booking ID."><Input id="bref" value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder={bookingId} /></Field>
              <Field id="bdate" label="Confirmation date" required><Input id="bdate" type="date" value={form.confirmDate} onChange={(e) => setForm({ ...form, confirmDate: e.target.value })} /></Field>
              <Field id="bops" label="Assigned operations owner" required>
                <div className="relative">
                  <select id="bops" value={form.opsOwner} onChange={(e) => setForm({ ...form, opsOwner: e.target.value })}
                    className="h-10 w-full appearance-none rounded-lg border border-steel-400/25 bg-white px-3 pr-9 text-[13.5px] text-frost-50 outline-none transition hover:border-steel-400/45 focus:border-cargo-400">
                    {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-steel-500" />
                </div>
              </Field>
              <Field id="bcar" label="Carrier reference" hint="If already issued."><Input id="bcar" value={form.carrierRef} onChange={(e) => setForm({ ...form, carrierRef: e.target.value })} placeholder="e.g. MAEU2284117" /></Field>
              <Field id="bpick" label="Planned pickup date"><Input id="bpick" type="date" value={form.pickup || r?.pickupDate || ""} onChange={(e) => setForm({ ...form, pickup: e.target.value })} /></Field>
              <Field id="bdep" label="Planned departure"><Input id="bdep" type="date" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} /></Field>
              <Field id="barr" label="Planned arrival"><Input id="barr" type="date" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} /></Field>
              <Field id="bnotes" label="Notes" className="sm:col-span-2"><Textarea id="bnotes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Handover instructions for operations…" /></Field>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <Btn onClick={() => nav(`/app/quotes/${q.id}/preview`)} icon={<ChevronRight className="h-3.5 w-3.5 rotate-180" />}>Back to quote</Btn>
            <Btn variant="primary" onClick={confirm} icon={<Check className="h-3.5 w-3.5" />}>Confirm Booking</Btn>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <SummaryCard title="Handoff checklist" tone="accent">
            <ul className="space-y-2">
              {[
                ["Quote accepted", true], ["Option selected", true], ["Commercial inherited", true],
                ["Ops owner assigned", !!form.opsOwner], ["Carrier reference", !!form.carrierRef],
                ["Planned dates", !!form.departure],
              ].map(([l, ok]) => (
                <li key={l as string} className="flex items-center gap-2 text-[12.5px]">
                  <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1", ok ? "bg-ok/12 ring-ok/35" : "bg-work-200 ring-steel-400/25")}>
                    {ok ? <Check className="h-2.5 w-2.5 text-ok" strokeWidth={3} /> : null}
                  </span>
                  <span className={ok ? "text-frost-100" : "text-steel-500"}>{l as string}</span>
                </li>
              ))}
            </ul>
          </SummaryCard>
          <SummaryCard title="What happens next" tone="muted">
            <p className="text-[12px] leading-relaxed text-steel-500">Once confirmed, this booking becomes the source record for master shipment creation in the Shipment Execution phase. No commercial data will need to be re-entered.</p>
          </SummaryCard>
        </aside>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL
   ========================================================= */
export function BookingDetailPage() {
  const { bookingId = "" } = useParams();
  const nav = useNavigate();
  const { bookingById, customerById } = useCommercial();
  const { notify } = useApp();
  const b = bookingById(bookingId);
  if (!b) return <EmptyState title="Booking not found" body="This booking may have been removed." action={<Btn onClick={() => nav("/app/bookings")}>Back to Bookings</Btn>} />;
  const c = customerById(b.customerId);

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow={`Booking · ${b.id}`} title={c?.company ?? "Booking"} support={`${b.origin} → ${b.destination} · ${b.cargoSummary}`}
        actions={<>
          <Btn onClick={() => notify("Booking edit arrives with Shipment Execution")}>Edit</Btn>
          <Btn variant="primary" onClick={() => notify("Master shipment creation arrives in the Shipment Execution phase")} icon={<Package className="h-3.5 w-3.5" />}>Create Master Shipment</Btn>
        </>} />

      <div className="app-panel p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge tone={BTONE[b.status]}>{b.status}</StatusBadge>
          <span className="font-mono text-[12px] text-frost-50">{b.id}</span>
          <span className="font-mono text-[11px] text-steel-500">Quote {b.quoteId} · Option {b.optionKey}</span>
          <span className="ml-auto t-num text-[13.5px] text-frost-50">{inr(b.sellingPrice)}</span>
        </div>
        <div className="mt-4"><RouteSummary origin={b.origin} destination={b.destination} mode={b.mode} service={b.service} /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
        <Panel title="Inherited commercial data">
          <dl className="grid gap-x-8 sm:grid-cols-2">
            <Row k="Customer" v={c?.company ?? "—"} />
            <Row k="Quote" v={b.quoteId} mono />
            <Row k="RFQ" v={b.rfqId} mono />
            <Row k="Option" v={`Option ${b.optionKey}`} />
            <Row k="Cargo" v={b.cargoSummary} />
            <Row k="Mode" v={b.mode} />
            <Row k="Service" v={b.service} />
            <Row k="Selling price" v={inr(b.sellingPrice)} />
            <Row k="Gross margin" v={`${b.marginPct.toFixed(1)}%`} tone="text-ok" />
            <Row k="Credit terms" v={c?.billing.creditTerms ?? "—"} />
          </dl>
        </Panel>
        <Panel title="Operational details">
          <dl className="grid gap-x-8 sm:grid-cols-2">
            <Row k="Booking reference" v={b.ref} mono />
            <Row k="Confirmation date" v={b.confirmDate} />
            <Row k="Ops owner" v={b.opsOwner} />
            <Row k="Carrier reference" v={b.carrierRef || "Not issued"} mono />
            <Row k="Planned pickup" v={b.pickup || "—"} />
            <Row k="Planned departure" v={b.departure || "—"} />
            <Row k="Planned arrival" v={b.arrival || "—"} />
            <Row k="Notes" v={b.notes || "—"} />
          </dl>
          <div className="mt-4">
            <Link to={`/app/quotes/${b.quoteId}/preview`} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-cargo-300 hover:text-cargo-400">
              View accepted quote <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export const BookingHelpers = { optionMargin, BookingTone: BTONE };
