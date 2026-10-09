import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, FileText, Package, Percent, TrendingUp, Truck, Users, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FilterBar } from "@/components/app/FilterBar";
import { BarBreakdown, EmptyState, ErrorState, KpiCard, KpiSkeleton, Panel, Progress, Skeleton, StatusBadge } from "@/components/app/ui/primitives";
import { CUSTOMERS, DOCUMENTS, INVOICES, QUOTES, RFQS, SHIPMENTS, STATUS_TONE, byMode, byStatus, fmtCr, fmtINR } from "@/data/mockData";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

/* =========================================================
   MANAGEMENT — read-heavy strategic overview
   ========================================================= */
export function ManagementOverview() {
  const { user, filters, setFilter, clearFilters, filtersActive, loading, error, retry, notify } = useApp();
  const modeMix = useMemo(() => byMode(SHIPMENTS), []);
  const statusMix = useMemo(() => byStatus(SHIPMENTS), []);
  const revenue = SHIPMENTS.reduce((a, s) => a + s.revenue, 0);
  const cost = SHIPMENTS.reduce((a, s) => a + s.cost, 0);
  const profit = revenue - cost;
  const margin = (profit / revenue) * 100;
  const won = RFQS.filter((r) => r.status === "Won").length;
  const conversion = Math.round((won / RFQS.length) * 100);
  const funnel = [
    { k: "Enquiries", n: RFQS.length, c: "#A6B5C6" },
    { k: "Quoted", n: RFQS.filter((r) => r.status === "Quoted" || r.status === "Won").length, c: "#1C6FE8" },
    { k: "Booked", n: SHIPMENTS.filter((s) => s.status !== "Completed").length, c: "#18A0D8" },
    { k: "Completed", n: SHIPMENTS.filter((s) => s.status === "Completed").length, c: "#0B7A55" },
  ];
  const topRoutes = useMemo(() => {
    const m = new Map<string, { lane: string; n: number; rev: number }>();
    SHIPMENTS.forEach((s) => {
      const key = `${s.origin} → ${s.destination}`;
      const cur = m.get(key) ?? { lane: key, n: 0, rev: 0 };
      m.set(key, { ...cur, n: cur.n + 1, rev: cur.rev + s.revenue });
    });
    return [...m.values()].sort((a, b) => b.rev - a.rev).slice(0, 5);
  }, []);

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-steel-400">Executive view · {user.branch}</p>
          <h1 className="mt-0.5 text-[22px] font-light tracking-[-0.025em] text-frost-50 md:text-[27px]">Management Overview</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-steel-400">Commercial performance, margin health and network distribution across the book of business.</p>
        </div>
        <button onClick={() => notify("Report builder arrives in the Intelligence phase")}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[linear-gradient(180deg,#2F86FF,#1C6FE8)] px-3 text-[12.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
          Build report <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="app-panel p-3 md:px-4">
        <FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} active={filtersActive} resultCount={SHIPMENTS.length} />
      </div>

      {error ? <div className="app-panel"><ErrorState title="Unable to load business overview" body="The analytics service did not respond. Nothing has changed in your view." onRetry={retry} /></div>
        : loading ? <KpiSkeleton n={4} />
          : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard label="Enquiries" value={RFQS.length} icon={Users} tone="neutral" secondary={`${RFQS.filter((r) => r.status === "New").length} new this week`} spark={[6, 8, 7, 9, 10, 11, 12]} />
              <KpiCard label="Quotes" value={QUOTES.length} icon={FileText} tone="info" secondary={`${QUOTES.filter((q) => q.status === "Awaiting Customer").length} awaiting customer`} spark={[4, 6, 7, 8, 9, 9, 10]} />
              <KpiCard label="Confirmed shipments" value={SHIPMENTS.filter((s) => s.status === "Confirmed").length} icon={Percent} tone="cyan" secondary="Awaiting execution" />
              <KpiCard label="Active shipments" value={SHIPMENTS.filter((s) => s.status !== "Completed").length} icon={Package} tone="cyan" secondary={`${SHIPMENTS.length} in period`} spark={[12, 15, 16, 18, 18, 19, 20]} />
              <KpiCard label="Revenue" value={revenue / 10000000} decimals={2} suffix="Cr" icon={Wallet} tone="info" secondary="All modes · period" spark={[1.2, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5]} />
              <KpiCard label="Gross profit" value={profit / 100000} decimals={1} suffix="L" icon={TrendingUp} tone="ok" secondary={`${((profit / revenue) * 100).toFixed(1)}% blended margin`} spark={[52, 61, 68, 72, 78, 84, 91]} />
              <KpiCard label="Gross margin" value={margin} decimals={1} suffix="%" icon={Percent} tone="ok" secondary="Target 16.0%" />
              <KpiCard label="Conversion" value={conversion} suffix="%" icon={Boxes} tone="neutral" secondary={`${won} of ${RFQS.length} RFQs won`} />
            </div>
          )}

      <div className="grid gap-4 lg:grid-cols-3 md:gap-5">
        <Panel title="RFQ → Quote → Booking funnel" subtitle="Current period" bodyClass="p-4 md:p-5">
          <ul className="space-y-3">
            {funnel.map((f, i) => (
              <li key={f.k}>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="text-steel-400">{f.k}</span>
                  <span className="t-num text-[15px] text-frost-50">{f.n}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-steel-400/12">
                  <motion.div className="h-full rounded-full" style={{ background: f.c }}
                    initial={{ width: 0 }} whileInView={{ width: `${(f.n / funnel[0].n) * 100}%` }}
                    viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE, delay: i * 0.1 }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-steel-400/12 pt-3 text-[12px] leading-relaxed text-steel-500">
            Enquiry-to-booking conversion of {conversion}% is ahead of the quarterly target.
          </p>
        </Panel>

        <Panel title="Shipment mode mix" bodyClass="p-4 md:p-5">
          <BarBreakdown data={[
            { k: "Ocean", n: modeMix.ocean, color: "#1C6FE8" },
            { k: "Road", n: modeMix.truck, color: "#18A0D8" },
            { k: "Rail", n: modeMix.rail, color: "#63788E" },
            { k: "Air", n: modeMix.air, color: "#0B7A55" },
          ]} />
          <div className="mt-5 border-t border-steel-400/12 pt-4">
            <p className="t-meta !text-[9.5px]">Status distribution</p>
            <ul className="mt-2.5 space-y-1.5">
              {statusMix.slice(0, 6).map((s) => (
                <li key={s.k} className="flex items-center gap-2.5">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{s.k}</span>
                  <span className="t-num text-[13px] text-frost-50">{s.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Revenue and cost" subtitle="Period comparison" bodyClass="p-4 md:p-5">
          <div className="space-y-3.5">
            {[{ k: "Revenue", v: revenue, c: "#1C6FE8" }, { k: "Cost", v: cost, c: "#A6B5C6" }, { k: "Gross profit", v: profit, c: "#0B7A55" }].map((r) => (
              <div key={r.k}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] text-steel-400">{r.k}</span>
                  <span className="t-num text-[15px] text-frost-50">{fmtCr(r.v)}</span>
                </div>
                <Progress value={(r.v / revenue) * 100} tone={r.k === "Gross profit" ? "ok" : "cyan"} className="mt-1.5" />
              </div>
            ))}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-y-3 border-t border-steel-400/12 pt-4 text-[12.5px]">
            <dt className="text-steel-500">Invoices raised</dt><dd className="text-right text-frost-100">{INVOICES.length}</dd>
            <dt className="text-steel-500">Receivables</dt><dd className="text-right text-frost-100">{fmtINR(INVOICES.filter((i) => i.status !== "Paid").reduce((a, i) => a + i.amount, 0))}</dd>
            <dt className="text-steel-500">Overdue</dt><dd className="text-right text-risk">{INVOICES.filter((i) => i.status === "Overdue").length} invoices</dd>
            <dt className="text-steel-500">Docs missing</dt><dd className="text-right text-warn">{DOCUMENTS.filter((d) => d.status === "Missing").length}</dd>
          </dl>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
        <Panel title="Top customers" subtitle="By active shipments" bodyClass="p-0">
          <ul className="divide-y divide-steel-400/[0.08]">
            {[...CUSTOMERS].sort((a, b) => b.active - a.active).slice(0, 5).map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-4 shrink-0 font-mono text-[11px] text-steel-500">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-frost-50">{c.name}</span>
                  <span className="text-[11.5px] text-steel-500">{c.code} · {c.country}</span>
                </span>
                <span className="hidden w-24 sm:block"><Progress value={(c.active / 6) * 100} /></span>
                <span className="w-16 text-right t-num text-[13px] text-frost-100">{c.active}</span>
                <span className="hidden w-24 text-right text-[12.5px] text-steel-400 md:block">{c.ytd}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Top routes" subtitle="By revenue contribution" bodyClass="p-0">
          <ul className="divide-y divide-steel-400/[0.08]">
            {topRoutes.map((r, i) => (
              <li key={r.lane} className="flex items-center gap-3 px-4 py-3">
                <span className="w-4 shrink-0 font-mono text-[11px] text-steel-500">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-frost-50">{r.lane}</span>
                <span className="shrink-0 text-[11.5px] text-steel-500">{r.n} shipments</span>
                <span className="w-20 shrink-0 text-right t-num text-[13px] text-frost-100">{fmtCr(r.rev)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Exception trend" subtitle="Open exceptions requiring management visibility" bodyClass="p-0">
        <ul className="divide-y divide-steel-400/[0.08]">
          {SHIPMENTS.filter((s) => s.exception).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="font-mono text-[12px] text-frost-100">{s.id}</span>
              <StatusBadge tone={STATUS_TONE[s.status]}>{s.status}</StatusBadge>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{s.exception}</span>
              <span className="shrink-0 text-[12px] text-steel-500">{s.owner}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* =========================================================
   CUSTOMER — simplified external view
   ========================================================= */
export function CustomerOverview() {
  const { user, loading, error, retry, notify } = useApp();
  const mine = useMemo(() => SHIPMENTS.filter((s) => s.customerId === "cus-1" || s.customer === "Apex Components"), []);
  const openQuotes = QUOTES.filter((q) => q.customer === "Apex Components" && (q.status === "Awaiting Customer" || q.status === "Sent"));
  const myDocs = DOCUMENTS.filter((d) => d.shipment === "SPG-SHP-001284" || d.shipment === "SPG-SHP-001307" || d.shipment === "SPG-SHP-001334");
  const invoices = INVOICES.filter((i) => i.customer === "Apex Components");

  if (error) return <div className="app-panel"><ErrorState title="Unable to load your shipments" body="We couldn't reach your customer workspace. Please try again." onRetry={retry} /></div>;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-steel-400">Welcome back, {user.name.split(" ")[0]}</p>
          <h1 className="mt-0.5 text-[22px] font-light tracking-[-0.025em] text-frost-50 md:text-[27px]">Customer Overview</h1>
          <p className="mt-1 text-[13px] text-steel-400">Apex Components Pvt Ltd · your shipments, documents and invoices.</p>
        </div>
        <button onClick={() => notify("New enquiry form arrives in the RFQ phase")}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[linear-gradient(180deg,#2F86FF,#1C6FE8)] px-3 text-[12.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
          Request a quote <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? <KpiSkeleton n={6} /> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Active shipments" value={mine.filter((s) => s.status !== "Completed").length} icon={Package} tone="info" secondary="Across all modes" />
          <KpiCard label="In transit" value={mine.filter((s) => s.stage === "In Transit").length} icon={Boxes} tone="cyan" secondary="Cargo moving" />
          <KpiCard label="Arriving soon" value={mine.filter((s) => s.stage === "Destination" || s.stage === "Delivery").length} icon={Boxes} tone="ok" secondary="Next 48 hours" />
          <KpiCard label="Open RFQs" value={RFQS.filter((r) => r.customer === "Apex Components").length} icon={FileText} tone="neutral" secondary="Being priced" />
          <KpiCard label="Quotes awaiting decision" value={openQuotes.length} icon={FileText} tone="warn" secondary="Response requested" />
          <KpiCard label="Invoices due" value={invoices.filter((i) => i.status !== "Paid").length} icon={Wallet} tone="neutral" secondary={invoices.filter((i) => i.status === "Overdue").length ? "1 overdue" : "Within terms"} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] md:gap-5">
        <Panel title="Recent shipments" subtitle="Your cargo and where it is right now" bodyClass="p-0">
          {loading ? <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            : mine.length === 0 ? <EmptyState title="No shipments yet" body="Once a booking is confirmed your shipments appear here." />
              : (
                <ul className="divide-y divide-steel-400/[0.08]">
                  {mine.map((s) => (
                    <li key={s.id} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[12px] text-frost-50">{s.id}</span>
                        <StatusBadge tone={STATUS_TONE[s.status]}>{s.status}</StatusBadge>
                      </div>
                      <div className="mt-1.5 text-[13.5px] text-frost-100">{s.origin} <span className="text-steel-500">→</span> {s.destination}</div>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={s.progress} tone={s.status === "Exception" ? "risk" : "cyan"} className="flex-1" />
                        <span className="t-num text-[11.5px] text-steel-400">{s.progress}%</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-steel-500">
                        <span>Next: {s.nextMilestone}</span><span>ETA {s.eta}</span><span>{s.teu}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
        </Panel>

        <div className="space-y-4 md:space-y-5">
          <Panel title="Quotes awaiting your decision" bodyClass="p-0">
            {openQuotes.length === 0 ? <EmptyState title="No quotes pending" body="New quotations will appear here when your account manager sends one." />
              : (
                <ul className="divide-y divide-steel-400/[0.08]">
                  {openQuotes.map((q) => (
                    <li key={q.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[12px] text-frost-50">{q.id}</span>
                        <StatusBadge tone={q.status === "Awaiting Customer" ? "warn" : "cyan"} dot={false}>{q.status}</StatusBadge>
                      </div>
                      <div className="mt-1 text-[12.5px] text-steel-300">{q.lane}</div>
                      <div className="mt-1.5 flex items-center justify-between text-[12px]">
                        <span className="t-num text-frost-100">{fmtINR(q.amount)}</span>
                        <span className="text-steel-500">Valid until {q.validUntil}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </Panel>

          <Panel title="Recent documents" bodyClass="p-0">
            <ul className="divide-y divide-steel-400/[0.08]">
              {myDocs.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-steel-400" strokeWidth={1.6} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-frost-100">{d.name}</span>
                    <span className="text-[11px] text-steel-500">{d.shipment} · {d.updated}</span>
                  </span>
                  <StatusBadge tone={d.status === "Verified" ? "ok" : d.status === "Missing" ? "risk" : "warn"} dot={false}>{d.status}</StatusBadge>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Pending actions" bodyClass="p-4 md:p-5">
            <ul className="space-y-2.5">
              {[
                "Approve quotation QT-24-0782 for the Houston lane",
                "Upload Certificate of Origin for SPG-SHP-001284",
                "Confirm delivery appointment for SPG-SHP-001307",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 rounded-lg bg-work-100 p-2.5 ring-1 ring-steel-400/10">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                  <span className="text-[12.5px] leading-snug text-steel-300">{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11.5px] leading-relaxed text-steel-500">Internal costs, vendor rates and operational notes are never shared on customer views.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   VENDOR — mobile-first job board
   ========================================================= */
export function VendorOverview() {
  const { loading, error, retry, notify } = useApp();
  const jobs = useMemo(() => SHIPMENTS.filter((s) => s.mode === "truck" || s.mode === "rail"), []);
  const requests = jobs.slice(0, 2);

  if (error) return <div className="app-panel"><ErrorState title="Unable to load your jobs" body="We couldn't reach the vendor workspace. Please try again." onRetry={retry} /></div>;

  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <p className="text-[13px] text-steel-400">Partner workspace</p>
        <h1 className="mt-0.5 text-[22px] font-light tracking-[-0.025em] text-frost-50 md:text-[27px]">Vendor Overview</h1>
        <p className="mt-1 text-[13px] text-steel-400">Deccan Roadways · jobs assigned to your fleet.</p>
      </div>

      {loading ? <KpiSkeleton n={5} /> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard label="New job requests" value={requests.length} icon={Truck} tone="info" secondary="Awaiting response" />
          <KpiCard label="Active jobs" value={jobs.filter((s) => s.status !== "Completed").length} icon={Package} tone="cyan" secondary="In execution" />
          <KpiCard label="Pickup due" value={jobs.filter((s) => s.stage === "Pickup").length} icon={Truck} tone="warn" secondary="Next 24 hours" />
          <KpiCard label="POD pending" value={3} icon={FileText} tone="warn" secondary="Upload required" />
          <KpiCard label="Invoices pending" value={2} icon={Wallet} tone="neutral" secondary="₹1.4 L total" />
        </div>
      )}

      <Panel title="New job requests" subtitle="Respond to keep the pickup window" bodyClass="p-3 md:p-4">
        {loading ? <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div> : (
          <ul className="space-y-3">
            {requests.map((s) => (
              <li key={s.id} className="rounded-xl bg-white p-3.5 ring-1 ring-steel-400/15">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[12px] text-frost-50">{s.id}</span>
                  <StatusBadge tone={STATUS_TONE[s.status]} dot={false}>{s.status}</StatusBadge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-[12.5px] sm:grid-cols-4">
                  {[["Pickup", s.origin], ["Destination", s.destination], ["Date", s.eta], ["Cargo", s.teu]].map(([k, v]) => (
                    <div key={k}><div className="text-steel-500">{k}</div><div className="mt-0.5 truncate text-frost-100">{v}</div></div>
                  ))}
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <button onClick={() => notify("Job acceptance flow arrives in the Vendor phase")}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[linear-gradient(180deg,#2F86FF,#1C6FE8)] px-3 text-[12.5px] font-medium text-white">Accept</button>
                  <button onClick={() => notify("Request declined in prototype")}
                    className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-[12.5px] font-medium text-steel-300 ring-1 ring-steel-400/25 transition hover:ring-steel-400/50">Reject</button>
                  <button onClick={() => notify("Job detail arrives in the Vendor phase")}
                    className="inline-flex h-8 items-center rounded-lg px-3 text-[12.5px] font-medium text-cargo-300 hover:bg-cargo-400/10">View job</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
        <Panel title="Active jobs" bodyClass="p-0">
          <ul className="divide-y divide-steel-400/[0.08]">
            {jobs.map((s) => (
              <li key={s.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] text-frost-50">{s.id}</span>
                  <StatusBadge tone={STATUS_TONE[s.status]} dot={false}>{s.status}</StatusBadge>
                </div>
                <div className="mt-1 text-[13px] text-frost-100">{s.origin} → {s.destination}</div>
                <div className="mt-1 flex items-center gap-3">
                  <Progress value={s.progress} tone={s.status === "Exception" ? "risk" : "cyan"} className="flex-1" />
                  <span className="t-num text-[11.5px] text-steel-400">{s.progress}%</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4 md:space-y-5">
          <Panel title="Documents pending" bodyClass="p-0">
            <ul className="divide-y divide-steel-400/[0.08]">
              {[["Proof of Delivery", "SPG-SHP-001307"], ["E-way Bill", "SPG-SHP-001301"], ["Vehicle photograph", "SPG-SHP-001338"]].map(([n, r]) => (
                <li key={n} className="flex items-center gap-3 px-4 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-warn" strokeWidth={1.6} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-frost-100">{n}</span><span className="font-mono text-[11px] text-steel-500">{r}</span></span>
                  <button onClick={() => notify("Upload flow arrives in the Vendor phase")} className="shrink-0 rounded-md bg-work-200 px-2 py-1 text-[11.5px] font-medium text-steel-300 hover:bg-cargo-400/10 hover:text-frost-50">Upload</button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Invoice summary" bodyClass="p-4 md:p-5">
            <dl className="space-y-3">
              {[["Submitted this month", "₹4.2 L"], ["Awaiting approval", "₹1.4 L"], ["Paid", "₹8.9 L"]].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between"><dt className="text-[12.5px] text-steel-400">{k}</dt><dd className="t-num text-[15px] text-frost-50">{v}</dd></div>
              ))}
            </dl>
            <button onClick={() => notify("Vendor invoicing arrives in the Finance phase")}
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white text-[13px] font-medium text-frost-50 ring-1 ring-steel-400/20 transition hover:ring-steel-400/45">
              Submit new invoice
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SALES
   ========================================================= */
export function SalesOverview() {
  const { loading, error, retry, notify } = useApp();
  const inProgress = QUOTES.filter((q) => q.status === "Draft" || q.status === "Internal Review");
  const awaiting = QUOTES.filter((q) => q.status === "Awaiting Customer" || q.status === "Sent");
  const expiring = QUOTES.filter((q) => q.status !== "Accepted" && q.status !== "Expired").slice(0, 4);
  const won = RFQS.filter((r) => r.status === "Won").length;
  if (error) return <div className="app-panel"><ErrorState title="Unable to load your pipeline" body="The commercial service did not respond. Please retry." onRetry={retry} /></div>;
  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <p className="text-[13px] text-steel-400">Commercial workspace</p>
        <h1 className="mt-0.5 text-[22px] font-light tracking-[-0.025em] text-frost-50 md:text-[27px]">Sales Overview</h1>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-steel-400">Enquiries, pricing progress and quotes waiting on a customer decision.</p>
      </div>
      {loading ? <KpiSkeleton n={6} /> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="New enquiries" value={RFQS.filter((r) => r.status === "New").length} icon={Users} tone="info" secondary="Unassigned" />
          <KpiCard label="Open RFQs" value={RFQS.filter((r) => r.status !== "Lost").length} icon={FileText} tone="neutral" secondary={`${RFQS.length} in period`} />
          <KpiCard label="Quotes in progress" value={inProgress.length} icon={FileText} tone="cyan" secondary="Draft or internal review" />
          <KpiCard label="Awaiting customer" value={awaiting.length} icon={FileText} tone="warn" secondary="Follow up" />
          <KpiCard label="Expiring quotes" value={expiring.length} icon={Percent} tone="risk" secondary="Within 7 days" />
          <KpiCard label="Conversion" value={Math.round((won / RFQS.length) * 100)} suffix="%" icon={TrendingUp} tone="ok" secondary={`${won} won`} />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
        <Panel title="Follow-ups due" subtitle="Quotes awaiting a customer decision" bodyClass="p-0">
          {loading ? <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            : awaiting.length === 0 ? <EmptyState title="No follow-ups due" body="Every open quote has been actioned." />
              : (
                <ul className="divide-y divide-steel-400/[0.08]">
                  {awaiting.map((q) => (
                    <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="font-mono text-[12px] text-frost-100">{q.id}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{q.customer} · {q.lane}</span>
                      <span className="t-num text-[12.5px] text-frost-100">{fmtINR(q.amount)}</span>
                      <StatusBadge tone="warn" dot={false}>{q.validUntil}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
        </Panel>
        <Panel title="RFQ queue" subtitle="Newest enquiries first" bodyClass="p-0"
          action={<button onClick={() => notify("RFQ workspace arrives in the Commercial phase")} className="shrink-0 text-[12.5px] font-medium text-cargo-300 hover:text-cargo-400">Open RFQs</button>}>
          <ul className="divide-y divide-steel-400/[0.08]">
            {RFQS.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-mono text-[12px] text-frost-100">{r.id}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{r.customer} · {r.lane}</span>
                <StatusBadge tone={r.status === "New" ? "info" : r.status === "Won" ? "ok" : r.status === "Lost" ? "risk" : "neutral"} dot={false}>{r.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Expiring quotations" subtitle="Validity ending within 7 days" bodyClass="p-0">
        <ul className="divide-y divide-steel-400/[0.08]">
          {expiring.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="font-mono text-[12px] text-frost-100">{q.id}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{q.customer} · {q.lane}</span>
              <span className="hidden text-[12px] text-steel-500 sm:inline">Margin {q.margin}%</span>
              <StatusBadge tone="risk" dot={false}>Expires {q.validUntil}</StatusBadge>
              <Link to="/app/quotes" className="text-[12.5px] font-medium text-cargo-300 hover:text-cargo-400">Open</Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* =========================================================
   FINANCE
   ========================================================= */
export function FinanceOverview() {
  const { loading, error, retry, notify } = useApp();
  const rev = SHIPMENTS.reduce((a, s) => a + s.revenue, 0);
  const cost = SHIPMENTS.reduce((a, s) => a + s.cost, 0);
  const receivable = INVOICES.filter((i) => i.status !== "Paid").reduce((a, i) => a + i.amount, 0);
  const overdue = INVOICES.filter((i) => i.status === "Overdue");
  if (error) return <div className="app-panel"><ErrorState title="Unable to load finance summary" body="The finance service did not respond. Please retry." onRetry={retry} /></div>;
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-steel-400">Finance workspace</p>
          <h1 className="mt-0.5 text-[22px] font-light tracking-[-0.025em] text-frost-50 md:text-[27px]">Finance Overview</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-steel-400">Receivables, payables and shipment-level margin health.</p>
        </div>
        <button onClick={() => notify("Invoice workspace arrives in the Finance phase")}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[linear-gradient(180deg,#2F86FF,#1C6FE8)] px-3 text-[12.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
          Open invoices <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {loading ? <KpiSkeleton n={4} /> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Customer invoices" value={INVOICES.length} icon={FileText} tone="info" secondary={`${INVOICES.filter((i) => i.status === "Paid").length} settled`} />
          <KpiCard label="Receivables" value={receivable / 100000} decimals={1} suffix="L" icon={Wallet} tone="cyan" secondary={`${INVOICES.filter((i) => i.status !== "Paid").length} open`} />
          <KpiCard label="Overdue invoices" value={overdue.length} icon={FileText} tone="risk" secondary={fmtINR(overdue.reduce((a, i) => a + i.amount, 0))} />
          <KpiCard label="Gross profit preview" value={(rev - cost) / 100000} decimals={1} suffix="L" icon={TrendingUp} tone="ok" secondary={`${(((rev - cost) / rev) * 100).toFixed(1)}% margin`} />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] md:gap-5">
        <Panel title="Receivables" subtitle="Customer invoices by status" bodyClass="p-0">
          {loading ? <div className="p-4 space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
            <ul className="divide-y divide-steel-400/[0.08]">
              {INVOICES.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-[12px] text-frost-100">{i.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{i.customer}</span>
                  <span className="hidden font-mono text-[11px] text-steel-500 sm:inline">{i.shipment}</span>
                  <span className="t-num text-[12.5px] text-frost-100">{fmtINR(i.amount)}</span>
                  <StatusBadge tone={i.status === "Paid" ? "ok" : i.status === "Overdue" ? "risk" : "info"} dot={false}>{i.status}</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-4 md:space-y-5">
          <Panel title="Cost summary" bodyClass="p-4 md:p-5">
            <dl className="space-y-3">
              {[["Expected cost", fmtCr(cost)], ["Actual cost", fmtCr(cost)], ["Revenue", fmtCr(rev)], ["Variance", "0.4% favourable"]].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between"><dt className="text-[12.5px] text-steel-400">{k}</dt><dd className="t-num text-[14px] text-frost-50">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-4 border-t border-steel-400/12 pt-3 text-[12px] leading-relaxed text-steel-500">Vendor bills and payables ageing arrive with the Finance phase.</p>
          </Panel>
          <Panel title="Margin outliers" bodyClass="p-0">
            <ul className="divide-y divide-steel-400/[0.08]">
              {SHIPMENTS.map((s) => ({ s, m: ((s.revenue - s.cost) / s.revenue) * 100 }))
                .sort((a, b) => a.m - b.m).slice(0, 4)
                .map(({ s, m }) => (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="font-mono text-[11.5px] text-frost-100">{s.id.replace("SPG-SHP-", "")}</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-steel-400">{s.customer}</span>
                    <span className={cn("t-num text-[12.5px]", m < 13 ? "text-warn" : "text-frost-100")}>{m.toFixed(1)}%</span>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
