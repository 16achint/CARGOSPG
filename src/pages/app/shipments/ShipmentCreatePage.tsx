import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { useCommercial } from "@/context/CommercialContext";
import { useExecution } from "@/context/ExecutionContext";
import { Btn, Field, Input, PageHead, Row, RouteSummary, Select, SummaryCard, Textarea } from "@/components/app/commercial/parts";
import { EmptyState, Panel, StatusBadge } from "@/components/app/ui/primitives";
import { PRIORITIES } from "@/data/execution";
import { optionSell } from "@/data/commercial";

const OWNERS = ["R. Kulkarni", "A. Sharma", "D. Menon", "S. Iyer", "P. Joshi", "N. Verma"];
const TEAMS = ["West Operations", "North Operations", "South Operations", "East Operations", "Air Operations", "Project Cargo"];

const formatMoney = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function ShipmentCreatePage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { bookings, quotes, customerById, rfqById } = useCommercial();
  const { createFromBooking, shipmentForBooking, nextShipmentId } = useExecution();
  const initialBooking = params.get("booking") ?? "";
  const [bookingId, setBookingId] = useState(initialBooking);
  const [owner, setOwner] = useState(OWNERS[0]);
  const [team, setTeam] = useState(TEAMS[0]);
  const [internalRef, setInternalRef] = useState("");
  const [plannedStart, setPlannedStart] = useState("2025-10-11");
  const [plannedCompletion, setPlannedCompletion] = useState("2025-10-30");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("Normal");
  const [customerVisibleRef, setCustomerVisibleRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");

  const available = useMemo(() => bookings.filter((b) =>
    (b.status === "Confirmed" || b.status === "Ready for Operations") && !shipmentForBooking(b.id)), [bookings, shipmentForBooking]);
  const booking = bookings.find((b) => b.id === bookingId);
  const quote = booking ? quotes.find((q) => q.id === booking.quoteId) : undefined;
  const customer = booking ? customerById(booking.customerId) : undefined;
  const rfq = booking ? rfqById(booking.rfqId) : undefined;
  const option = quote?.options.find((o) => o.key === booking?.optionKey) ?? quote?.options[0];
  const sell = option ? optionSell(option) : booking?.sellingPrice ?? 0;
  const nextId = nextShipmentId();
  const validDates = !plannedStart || !plannedCompletion || plannedCompletion >= plannedStart;

  // If linked from the booking drawer, select the exact confirmed booking once loaded.
  const selectBooking = (id: string) => {
    setBookingId(id);
    const b = bookings.find((x) => x.id === id);
    const q = b ? quotes.find((x) => x.id === b.quoteId) : undefined;
    if (b) {
      setPlannedStart(b.pickup || "2025-10-11");
      setPlannedCompletion(b.arrival || "2025-10-30");
      setCustomerVisibleRef(b.ref || "");
      const selected = q?.options.find((x) => x.key === b.optionKey);
      setPriority(selected?.transit && parseInt(selected.transit) < 3 ? "High" : "Normal");
    }
  };

  const submit = () => {
    setError("");
    if (!booking) { setError("Choose a confirmed booking to continue."); return; }
    if (!validDates) { setError("Planned completion cannot precede the planned start date."); return; }
    try {
      const s = createFromBooking(booking.id, { owner, team, internalRef, plannedStart, plannedCompletion, priority, customerVisibleRef, notes });
      setCreatedId(s.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create shipment.");
    }
  };

  if (createdId) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="app-panel p-6 text-center md:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/10 ring-1 ring-ok/30 shadow-[0_0_36px_-12px_rgba(11,122,85,0.6)]"><Check className="h-6 w-6 text-ok" strokeWidth={2.2} /></span>
          <p className="t-eyebrow mt-5">Master shipment created</p>
          <h2 className="mt-2 font-mono text-[23px] font-light tracking-[-0.02em] text-frost-50">{createdId}</h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-steel-400">The commercial record is linked. Build the multimodal journey to begin operational planning.</p>
          <dl className="mx-auto mt-6 max-w-sm divide-y divide-steel-400/12 rounded-xl bg-work-100 p-3.5 text-left">
            <Row k="Booking" v={booking?.id ?? "—"} mono />
            <Row k="Customer" v={customer?.company ?? "—"} />
            <Row k="Route" v={booking ? `${booking.origin} → ${booking.destination}` : "—"} />
            <Row k="Shipment owner" v={owner} />
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Btn variant="primary" onClick={() => nav(`/app/shipments/${createdId}/journey`)} icon={<ArrowRight className="h-3.5 w-3.5" />}>Build Journey</Btn>
            <Btn onClick={() => nav(`/app/shipments/${createdId}`)}>View Shipment</Btn>
            <Btn variant="ghost" onClick={() => nav("/app/shipments")}>Return to Shipments</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 md:space-y-5">
      <PageHead eyebrow="Execution · Master shipment" title="Create Shipment" support="Convert a confirmed commercial booking into one operational master record. Customer, cargo, route and selling price are inherited." />

      <Panel bodyClass="p-3.5 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="t-meta !text-[9.5px]">Next shipment ID</span>
          <span className="font-mono text-[12px] text-frost-50">{nextId}</span>
          <span className="ml-auto text-[11.5px] text-steel-500">ID is assigned when created</span>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] md:gap-5">
        <div className="space-y-4">
          <Panel title="Confirmed booking" subtitle="Select a confirmed quote handoff" bodyClass="p-4 md:p-5">
            {available.length === 0 ? (
              <EmptyState title="No confirmed bookings available" body="Confirm an accepted quotation before creating a master shipment."
                action={<Btn variant="primary" onClick={() => nav("/app/bookings")}>Open Bookings</Btn>} />
            ) : (
              <div className="space-y-3">
                <Field id="booking" label="Booking" required error={error && !bookingId ? error : null}>
                  <div className="relative">
                    <select id="booking" value={bookingId} onChange={(e) => selectBooking(e.target.value)}
                      className="h-10 w-full appearance-none rounded-lg border border-steel-400/25 bg-white px-3 pr-9 text-[13px] text-frost-50 outline-none transition hover:border-steel-400/45 focus:border-cargo-400 focus:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]">
                      <option value="">Select confirmed booking…</option>
                      {available.map((b) => {
                        const c = customerById(b.customerId);
                        return <option key={b.id} value={b.id}>{b.id} · {c?.company ?? b.customerId} · {b.origin} → {b.destination}</option>;
                      })}
                    </select>
                    <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-steel-500" />
                  </div>
                </Field>
                {booking && quote && rfq && (
                  <div className="rounded-xl bg-work-100 p-3 ring-1 ring-steel-400/12">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="ok">Confirmed</StatusBadge>
                      <span className="font-mono text-[11px] text-steel-500">{quote.id}-V{quote.version} · Option {booking.optionKey}</span>
                      <span className="ml-auto t-num text-[13px] font-medium text-frost-50">{formatMoney(sell)}</span>
                    </div>
                    <div className="mt-3"><RouteSummary origin={booking.origin} originCode={rfq.originCode} destination={booking.destination} destCode={rfq.destCode} mode={booking.mode} service={booking.service} /></div>
                  </div>
                )}
              </div>
            )}
          </Panel>

          {booking && (
            <Panel title="Operational setup" subtitle="Set ownership, dates and priority" bodyClass="p-4 md:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="owner" label="Shipment owner" required>
                  <Select id="owner" options={OWNERS.map((x) => ({ v: x, l: x }))} value={owner} onChange={(e) => setOwner(e.target.value)} />
                </Field>
                <Field id="team" label="Operations team" required>
                  <Select id="team" options={TEAMS.map((x) => ({ v: x, l: x }))} value={team} onChange={(e) => setTeam(e.target.value)} />
                </Field>
                <Field id="iref" label="Internal shipment reference"><Input id="iref" value={internalRef} onChange={(e) => setInternalRef(e.target.value)} placeholder="e.g. OPS-1285" /></Field>
                <Field id="cref" label="Customer-facing reference"><Input id="cref" value={customerVisibleRef} onChange={(e) => setCustomerVisibleRef(e.target.value)} placeholder={booking.ref} /></Field>
                <Field id="pstart" label="Planned start date" required><Input id="pstart" type="date" value={plannedStart} onChange={(e) => setPlannedStart(e.target.value)} /></Field>
                <Field id="pcomplete" label="Planned completion" required error={!validDates ? "Completion cannot precede start." : null}>
                  <Input id="pcomplete" type="date" value={plannedCompletion} error={!validDates} onChange={(e) => setPlannedCompletion(e.target.value)} />
                </Field>
                <Field id="priority" label="Priority">
                  <Select id="priority" options={PRIORITIES.map((x) => ({ v: x, l: x }))} value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} />
                </Field>
                <Field id="notes" label="Operational notes" className="sm:col-span-2"><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal handoff notes for the operations team…" /></Field>
              </div>
              {error && <p className="mt-3 rounded-lg bg-risk/[0.06] px-3 py-2 text-[12.5px] text-risk ring-1 ring-risk/25">{error}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <Btn onClick={() => nav("/app/bookings")}>Cancel</Btn>
                <Btn variant="primary" disabled={!validDates} onClick={submit} icon={<Check className="h-3.5 w-3.5" />}>Create Master Shipment</Btn>
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <SummaryCard title="Inherited from booking" tone="accent">
            {booking && customer && quote && rfq ? (
              <dl>
                <Row k="Customer" v={customer.company} />
                <Row k="Booking" v={booking.id} mono />
                <Row k="RFQ" v={rfq.id} mono />
                <Row k="Accepted quote" v={`${quote.id}-V${quote.version}`} mono />
                <Row k="Cargo" v={rfq.cargo.commodity} />
                <Row k="Package / weight" v={`${rfq.cargo.packages} ${rfq.cargo.packageType} · ${rfq.cargo.weight} ${rfq.cargo.weightUnit}`} />
                <Row k="Mode / service" v={`${booking.mode} · ${booking.service}`} />
                <Row k="Selected option" v={`Option ${booking.optionKey} · ${formatMoney(sell)}`} />
                <Row k="Pickup" v={booking.pickup || rfq.pickupDate || "—"} />
                <Row k="Arrival" v={booking.arrival || rfq.deliveryDate || "—"} />
              </dl>
            ) : <p className="text-[12px] text-steel-500">Choose a booking to see its inherited commercial context.</p>}
          </SummaryCard>
          <SummaryCard title="Operational handoff" tone="muted">
            <p className="text-[12px] leading-relaxed text-steel-500">The shipment ID links every journey leg, milestone, vendor, reference and exception back to this booking. Build the route after creation.</p>
          </SummaryCard>
        </aside>
      </div>
    </div>
  );
}
