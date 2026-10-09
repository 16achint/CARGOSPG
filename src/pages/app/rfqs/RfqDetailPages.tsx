import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight, Check, ChevronRight, Clock, FileWarning, Info, Plus, Search, Trophy, Zap,
} from "lucide-react";
import { useCommercial } from "@/context/CommercialContext";
import { useApp } from "@/context/AppContext";
import {
  ActivityTimeline, Btn, CargoSummary, ModeServiceLabels, PageHead, Row, RouteSummary,
  SectionTitle, Select, Textarea, WarnBanner,
} from "@/components/app/commercial/parts";
import { EmptyState, Panel, StatusBadge, type ToneKey } from "@/components/app/ui/primitives";
import {
  COMPONENTS, RFQ_STAGE_TONE, inr, isExpired, optionTotals, rateState, ratesExpiringBefore,
  type ChargeLine, type RateRec, type RfqStage,
} from "@/data/commercial";
import { cn } from "@/utils/cn";

/* =========================================================
   RFQ DETAIL
   ========================================================= */
const DTABS = ["Overview", "Rates", "Quotes", "Documents", "Communication", "Activity"] as const;

export function RfqDetailPage() {
  const { rfqId = "" } = useParams();
  const nav = useNavigate();
  const { notify } = useApp();
  const { rfqById, customerById, quotes, rates, setRfqStage, addRfqNote } = useCommercial();
  const r = rfqById(rfqId);
  const [tab, setTab] = useState<(typeof DTABS)[number]>("Overview");
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<"Internal" | "Customer">("Internal");

  if (!r) return <EmptyState title="RFQ not found" body="This enquiry may have been removed." action={<Btn onClick={() => nav("/app/rfqs")}>Back to RFQs</Btn>} />;
  const c = customerById(r.customerId);
  const myQuotes = quotes.filter((q) => q.rfqId === r.id);
  const laneRates = rates.filter((x) => x.origin === r.origin && x.destination === r.destination);

  const events = [
    { at: r.created, label: "RFQ created", ref: r.id, by: "Customer", tone: "info" as const },
    ...r.notes.map((n) => ({ at: n.at, label: n.body, ref: n.visibility === "Internal" ? "Internal note" : "Customer communication", by: n.by, tone: (n.visibility === "Internal" ? "neutral" : "cyan") as "neutral" | "cyan" })),
    ...(r.evaluated.length ? [{ at: "Today", label: `${r.evaluated.length} rate components selected`, ref: "Rate evaluation", tone: "cyan" as const }] : []),
    ...myQuotes.map((q) => ({ at: q.created, label: `Quotation V${q.version} ${q.status.toLowerCase()}`, ref: `${q.id}-V${q.version}`, tone: (q.status === "Accepted" ? "ok" : q.status === "Rejected" ? "risk" : "info") as "ok" | "risk" | "info" })),
  ];

  const cta = myQuotes.length
    ? { label: "Open Quote", to: `/app/quotes/${myQuotes[0].id}` }
    : { label: "Evaluate Rates", to: `/app/rfqs/${r.id}/rates` };

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow={`Enquiry · ${r.id}`} title={c?.company ?? "Customer"}
        support={`${r.origin} → ${r.destination} · ${r.cargo.commodity}`}
        actions={<>
          <Btn onClick={() => notify("RFQ edit arrives with the commercial phase")}>Edit</Btn>
          <Btn variant="primary" onClick={() => nav(cta.to)} icon={<ArrowRight className="h-3.5 w-3.5" />}>{cta.label}</Btn>
        </>} />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] md:gap-5">
        <div className="min-w-0 space-y-4 md:space-y-5">
          <div className="app-panel p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge tone={RFQ_STAGE_TONE[r.status]}>{r.status}</StatusBadge>
              <span className="font-mono text-[11.5px] text-steel-400">{r.id}</span>
              {r.customerRef && <span className="font-mono text-[11px] text-steel-500">Ref {r.customerRef}</span>}
              <span className="ml-auto flex items-center gap-1.5 text-[12px] text-steel-500"><Clock className="h-3.5 w-3.5" />{r.age} · created {r.created}</span>
            </div>
            <div className="mt-4"><RouteSummary origin={r.origin} originCode={r.originCode} destination={r.destination} destCode={r.destCode} mode={r.mode} service={r.service} /></div>
            <div className="mt-4 border-t border-steel-400/12 pt-3.5"><ModeServiceLabels mode={r.mode} service={r.service} detail={r.modeDetail} /></div>
          </div>

          <div role="tablist" aria-label="RFQ sections" className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-steel-400/12 scroll-thin">
            {DTABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition", tab === t ? "bg-work-200 text-frost-50" : "text-steel-400 hover:text-frost-50")}>{t}</button>
            ))}
          </div>

          {tab === "Overview" && (
            <div className="grid gap-4 sm:grid-cols-2 md:gap-5">
              <Panel title="Cargo"><CargoSummary cargo={r.cargo} /></Panel>
              <Panel title="Requirements">
                <dl>
                  <Row k="Pickup" v={r.requirements.pickup ? "Required" : "Not required"} />
                  <Row k="Delivery" v={r.requirements.delivery ? "Required" : "Not required"} />
                  <Row k="Customs" v={r.requirements.customs ? "Required" : "Not required"} />
                  <Row k="Warehousing" v={r.requirements.warehouse ? "Required" : "Not required"} />
                  <Row k="Insurance" v={r.requirements.insurance ? "Required" : "Not required"} />
                </dl>
                {r.requirements.instructions && <div className="mt-3 rounded-lg bg-work-100 p-3"><p className="t-meta mb-1.5 !text-[9px]">Special instructions</p><p className="text-[12.5px] leading-relaxed text-steel-300">{r.requirements.instructions}</p></div>}
                {r.requirements.internalNotes && (
                  <div className="mt-3 rounded-lg bg-warn/[0.06] p-3 ring-1 ring-warn/20">
                    <p className="t-meta mb-1.5 !text-[9px] !text-warn">Internal notes — not shared</p>
                    <p className="text-[12.5px] leading-relaxed text-steel-300">{r.requirements.internalNotes}</p>
                  </div>
                )}
              </Panel>
            </div>
          )}

          {tab === "Rates" && (
            <Panel title="Rate evaluation" subtitle={`${laneRates.length} rates found for this lane`}
              action={<Btn size="sm" variant="primary" onClick={() => nav(`/app/rfqs/${r.id}/rates`)}>Open workspace</Btn>} bodyClass="p-0">
              {laneRates.length === 0 ? (
                <EmptyState title="No valid rates found for this route" body="Add a rate for this lane or open the evaluation workspace to widen the search."
                  action={<Btn variant="primary" onClick={() => nav("/app/rates")} icon={<Plus className="h-3.5 w-3.5" />}>Add Rate</Btn>} />
              ) : (
                <ul className="divide-y divide-steel-400/[0.08]">
                  {laneRates.slice(0, 8).map((x) => (
                    <li key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <span className="w-[150px] shrink-0 truncate text-[12.5px] text-frost-50">{x.vendor}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{x.chargeType}</span>
                      {x.transit && <span className="shrink-0 text-[11.5px] text-steel-500">{x.transit}</span>}
                      <span className="t-num shrink-0 text-[12.5px] text-frost-100">{inr(x.amount)}</span>
                      <StatusBadge tone={rateState(x) === "Active" ? "ok" : rateState(x) === "Expiring Soon" ? "warn" : "risk"} dot={false}>{rateState(x)}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          {tab === "Quotes" && (
            <Panel title="Quotations" bodyClass="p-0">
              {myQuotes.length === 0 ? <EmptyState title="No quotations yet" body="Evaluate rates and build a quote for this enquiry."
                action={<Btn variant="primary" onClick={() => nav(`/app/rfqs/${r.id}/rates`)}>Evaluate Rates</Btn>} /> : (
                <ul className="divide-y divide-steel-400/[0.08]">
                  {myQuotes.map((q) => (
                    <li key={q.id + q.version}>
                      <button onClick={() => nav(`/app/quotes/${q.id}/preview`)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition hover:bg-work-100">
                        <span className="font-mono text-[12px] text-frost-50">{q.id}-V{q.version}</span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{q.options.length} options · valid to {q.validUntil}</span>
                        <StatusBadge tone={q.status === "Accepted" ? "ok" : q.status === "Rejected" || q.status === "Expired" ? "risk" : "warn"} dot={false}>{q.status}</StatusBadge>
                        <ChevronRight className="h-4 w-4 shrink-0 text-steel-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          {tab === "Documents" && (
            <Panel title="Documents" subtitle="Document vault preview">
              <div className="py-10 text-center">
                <p className="text-[13.5px] text-frost-50">Enquiry documents open here.</p>
                <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-steel-400">The full document vault with verification workflow arrives in a later phase.</p>
              </div>
            </Panel>
          )}

          {tab === "Communication" && (
            <Panel title="Communication history" subtitle="Customer and internal messages" bodyClass="p-4 md:p-5">
              <ol className="space-y-4">
                {r.notes.map((n, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.visibility === "Internal" ? "bg-warn" : "bg-cargo-400")} />
                    <div className="min-w-0 flex-1 rounded-xl bg-work-100 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] font-medium text-frost-50">{n.by}</span>
                        <span className="font-mono text-[10.5px] text-steel-500">{n.at}</span>
                        <span className={cn("rounded px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em]",
                          n.visibility === "Internal" ? "bg-warn/12 text-warn" : "bg-cargo-400/12 text-cargo-300")}>{n.visibility}</span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-steel-300">{n.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-5 border-t border-steel-400/12 pt-4">
                <p className="t-meta mb-2 !text-[9.5px]">Add note</p>
                <div className="mb-2.5 inline-flex rounded-lg bg-work-200 p-0.5">
                  {(["Internal", "Customer"] as const).map((v) => (
                    <button key={v} onClick={() => setVisibility(v)} aria-pressed={visibility === v}
                      className={cn("rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition", visibility === v ? "bg-white text-frost-50 shadow-[0_1px_2px_rgba(16,44,73,0.06)]" : "text-steel-400")}>{v}</button>
                  ))}
                </div>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={visibility === "Internal" ? "Internal note — not shared with the customer…" : "Message visible to the customer…"} />
                <div className="mt-2.5 flex justify-end">
                  <Btn variant="primary" size="sm" disabled={!note.trim()} onClick={() => { addRfqNote(r.id, note.trim(), visibility); setNote(""); notify("Note added"); }}>Add note</Btn>
                </div>
              </div>
            </Panel>
          )}

          {tab === "Activity" && <Panel title="Enquiry timeline"><ActivityTimeline events={events} /></Panel>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start md:space-y-5">
          <Panel title="Status"><StatusBadge tone={RFQ_STAGE_TONE[r.status]}>{r.status}</StatusBadge>
            <div className="mt-3">
              <p className="t-meta mb-1.5 !text-[9px]">Move stage</p>
              <Select id="stage" options={(["New", "Qualified", "Rate Sourcing", "Quote Preparation", "Quote Sent", "Awaiting Customer", "Won", "Lost"] as RfqStage[]).map((v) => ({ v, l: v }))}
                value={r.status} onChange={(e) => setRfqStage(r.id, e.target.value as RfqStage)} />
            </div>
          </Panel>
          <Panel title="Ownership & dates">
            <dl><Row k="Owner" v={r.owner} /><Row k="Created" v={r.created} /><Row k="Age" v={r.age} />
              <Row k="Pickup" v={r.pickupDate || "—"} /><Row k="Delivery" v={r.deliveryDate || "—"} /></dl>
          </Panel>
          <Panel title="Pending actions">
            <ul className="space-y-2">
              {[
                r.evaluated.length === 0 && "Evaluate supplier rates",
                myQuotes.length === 0 && "Build quotation",
                !r.customerRef && "Capture customer reference",
              ].filter(Boolean).map((x) => (
                <li key={x as string} className="flex items-start gap-2.5 rounded-lg bg-work-100 p-2.5 ring-1 ring-steel-400/10">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                  <span className="text-[12.5px] leading-snug text-steel-300">{x as string}</span>
                </li>
              ))}
              {r.evaluated.length > 0 && myQuotes.length > 0 && r.customerRef && (
                <li className="flex items-start gap-2.5 rounded-lg bg-ok/[0.05] p-2.5 ring-1 ring-ok/20">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" /><span className="text-[12.5px] text-steel-300">No pending actions.</span>
                </li>
              )}
            </ul>
          </Panel>
          <Panel title="Documents preview">
            <ul className="space-y-2">
              {["Commercial Invoice", "Packing List", "Certificate of Origin"].map((x) => (
                <li key={x} className="flex items-center gap-2.5 text-[12.5px]">
                  <FileWarning className="h-3.5 w-3.5 shrink-0 text-steel-500" /><span className="min-w-0 flex-1 truncate text-steel-400">{x}</span>
                  <StatusBadge tone="neutral" dot={false}>Later</StatusBadge>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

/* =========================================================
   RATE EVALUATION WORKSPACE
   ========================================================= */
const GROUPS: { label: string; comps: string[] }[] = [
  { label: "Freight", comps: ["Freight"] },
  { label: "Origin", comps: ["Origin", "Transport", "Port"] },
  { label: "Destination", comps: ["Destination", "Warehouse", "Handling"] },
  { label: "Compliance", comps: ["Customs", "Documentation", "Insurance"] },
  { label: "Other", comps: ["Taxes", "Other"] },
];

export function RateEvalPage() {
  const { rfqId = "" } = useParams();
  const nav = useNavigate();
  const { notify } = useApp();
  const { rfqById, customerById, rates, setEvaluated } = useCommercial();
  const r = rfqById(rfqId);
  const [selected, setSelected] = useState<string[]>(() => r?.evaluated ?? []);
  const [q, setQ] = useState("");

  const laneRates = useMemo(() => (r ? rates.filter((x) => x.origin === r.origin && x.destination === r.destination) : []), [r, rates]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return laneRates.filter((x) => !term || x.vendor.toLowerCase().includes(term) || x.chargeType.toLowerCase().includes(term));
  }, [laneRates, q]);

  if (!r) return <EmptyState title="RFQ not found" body="This enquiry may have been removed." action={<Btn onClick={() => nav("/app/rfqs")}>Back to RFQs</Btn>} />;
  const c = customerById(r.customerId);
  const sel = laneRates.filter((x) => selected.includes(x.id));

  const totalBy = (comps: string[]) => sel.filter((s) => comps.includes(s.chargeType)).reduce((a, s) => a + s.amount, 0);
  const total = sel.reduce((a, s) => a + s.amount, 0);
  const expired = sel.filter((x) => rateState(x) === "Expired");
  const expiring = sel.filter((x) => rateState(x) === "Expiring Soon");

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const groupBlock = (g: { label: string; comps: string[] }) => {
    const items = filtered.filter((x) => g.comps.includes(x.chargeType));
    if (items.length === 0) return null;
    // comparison metadata
    const cheapest = Math.min(...items.map((i) => i.amount));
    const fastestTransit = items.filter((i) => i.transit).map((i) => i.transit!);
    return (
      <section key={g.label}>
        <SectionTitle aside={<span className="font-mono text-[10px] text-steel-500">{items.length} rate{items.length > 1 ? "s" : ""}</span>}>{g.label}</SectionTitle>
        <ul className="space-y-2">
          {items.map((x) => {
            const on = selected.includes(x.id);
            const st = rateState(x);
            const fastest = x.transit && fastestTransit.length > 1 && x.transit === [...fastestTransit].sort((a, b) => parseFloat(a) - parseFloat(b))[0];
            return (
              <li key={x.id}>
                <button onClick={() => st !== "Expired" && toggle(x.id)} disabled={st === "Expired"}
                  className={cn("flex w-full flex-wrap items-center gap-3 rounded-xl p-3 text-left ring-1 transition",
                    on ? "bg-cargo-400/[0.07] ring-cargo-400/45" : st === "Expired" ? "bg-work-100 ring-steel-400/10 opacity-60" : "bg-white ring-steel-400/12 hover:ring-steel-400/30")}>
                  <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-[5px] ring-1 transition",
                    on ? "bg-info ring-info" : st === "Expired" ? "ring-steel-400/25" : "ring-steel-400/40")}>
                    {on && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13px] text-frost-50">{x.vendor}</span>
                      {x.amount === cheapest && items.length > 1 && <span className="inline-flex items-center gap-1 rounded-full bg-ok/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-ok ring-1 ring-ok/25"><Trophy className="h-2.5 w-2.5" />Lowest</span>}
                      {fastest && <span className="inline-flex items-center gap-1 rounded-full bg-cargo-400/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-cargo-300 ring-1 ring-cargo-400/25"><Zap className="h-2.5 w-2.5" />Fastest</span>}
                      {x.vendor === "Meridian Line" && <span className="rounded-full bg-info/[0.09] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-info ring-1 ring-info/25">Preferred</span>}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-steel-500">
                      <span>{x.chargeType}</span>
                      {x.transit && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{x.transit}</span>}
                      <span>Valid to {new Date(x.validTo).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                    </span>
                  </span>
                  <span className="t-num shrink-0 text-[13.5px] text-frost-50">{inr(x.amount)}</span>
                  {st !== "Active" && <StatusBadge tone={st === "Expired" ? "risk" : "warn"} dot={false}>{st}</StatusBadge>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  const selCharges: ChargeLine[] = sel.map((x, i) => ({ key: `cl-${i}`, component: x.chargeType, vendor: x.vendor, cost: x.amount, marginType: "Percent", margin: 18, currency: x.currency, rateId: x.id }));
  const preview = optionTotals(selCharges);

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow={`Rate evaluation · ${r.id}`} title="Rate Evaluation" support={`${c?.company} · ${r.origin} → ${r.destination} · ${r.cargo.commodity} · ${r.cargo.weight} ${r.cargo.weightUnit}`}
        actions={<>
          <Btn onClick={() => { setEvaluated(r.id, selected); notify("Rate evaluation saved"); }}>Save Evaluation</Btn>
          <Btn variant="primary" disabled={sel.length === 0} onClick={() => { setEvaluated(r.id, selected); nav(`/app/rfqs/${r.id}/quote?rates=${selected.join(",")}`); }} icon={<ArrowRight className="h-3.5 w-3.5" />}>Create Quote Option</Btn>
        </>} />

      <div className="grid gap-4 lg:grid-cols-[1fr_324px] md:gap-5">
        <div className="min-w-0 space-y-4 md:space-y-5">
          <div className="app-panel p-3.5 md:p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by vendor or charge…" aria-label="Filter rates"
                  className="h-9 w-full rounded-lg border border-steel-400/22 bg-white pl-9 pr-3 text-[13px] text-frost-50 outline-none transition placeholder:text-steel-500/90 focus:border-cargo-400 focus:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]" />
              </div>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-steel-500">{filtered.length} rates · {sel.length} selected</span>
              {selected.length > 0 && <Btn size="sm" variant="ghost" onClick={() => setSelected([])}>Clear selection</Btn>}
            </div>
          </div>

          {filtered.length === 0 ? (
            <Panel>
              <EmptyState title="No valid rates found for this route" body="There are no seeded carrier rates for this lane yet. Add one to continue building the quotation."
                action={<Btn variant="primary" onClick={() => nav("/app/rates")} icon={<Plus className="h-3.5 w-3.5" />}>Add Rate</Btn>} />
            </Panel>
          ) : (
            <div className="app-panel space-y-5 p-4 md:p-5">
              {GROUPS.map(groupBlock)}
              {expired.length > 0 && <WarnBanner>{expired.length} selected rate{expired.length > 1 ? "s have" : " has"} expired and cannot be used in a quotation.</WarnBanner>}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start md:space-y-5">
          <Panel title="Live cost summary" subtitle="Updates as you select">
            <dl className="space-y-0.5">
              {GROUPS.map((g) => {
                const v = totalBy(g.comps);
                return <Row key={g.label} k={g.label} v={v ? inr(v) : "—"} tone={v ? "text-frost-100" : "text-steel-500"} />;
              })}
            </dl>
            <div className="mt-3 border-t border-steel-400/12 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[12.5px] font-medium text-frost-50">Total expected cost</span>
                <motion.span key={total} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className="t-num text-[19px] font-light text-frost-50">{inr(total)}</motion.span>
              </div>
              <p className="mt-1 text-right text-[11px] text-steel-500">{sel.length} components · INR</p>
            </div>
          </Panel>

          {sel.length > 0 && (
            <Panel title="Selected components" bodyClass="p-0">
              <ul className="divide-y divide-steel-400/[0.08]">
                {sel.map((x) => (
                  <li key={x.id} className="flex items-center gap-2.5 px-4 py-2.5">
                    <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-frost-50">{x.chargeType}</span><span className="block truncate text-[11px] text-steel-500">{x.vendor}</span></span>
                    <span className="t-num text-[12px] text-steel-300">{inr(x.amount)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {expiring.length > 0 && <WarnBanner>{expiring.length} selected rate{expiring.length > 1 ? "s" : ""} expire within 7 days. Consider a shorter quotation validity.</WarnBanner>}

          <Panel title="Margin preview" subtitle="At the default 18% markup">
            <dl>
              <Row k="Expected cost" v={inr(preview.expectedCost)} />
              <Row k="Selling price" v={inr(preview.sellingPrice)} />
              <Row k="Gross profit" v={inr(preview.grossProfit)} tone="text-ok" />
              <Row k="Gross margin" v={`${preview.marginPct.toFixed(1)}%`} tone="text-ok" />
            </dl>
            <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-steel-500"><Info className="mt-0.5 h-3 w-3 shrink-0" />Margins are set per option in the quote builder.</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

export function RateValidityNote({ rates, charges, validUntil }: { rates: RateRec[]; charges: ChargeLine[]; validUntil: string }) {
  const bad = ratesExpiringBefore(rates, charges, validUntil);
  if (bad.length === 0) return null;
  return <WarnBanner>{bad.length} selected rate component{bad.length > 1 ? "s expire" : " expires"} before this quotation.</WarnBanner>;
}

export const EvalToneCheck = (v: string): ToneKey => (v === "Active" ? "ok" : v === "Expiring Soon" ? "warn" : "risk");
export const ExpiredCheck = isExpired;
export const ComponentsList = COMPONENTS;
export const RateEvalLink = Link;
