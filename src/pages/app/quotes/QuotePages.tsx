import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight, Check, ChevronRight, Copy, Eye, FileText, Lock, Plus, Send, Trash2, X,
} from "lucide-react";
import { useCommercial } from "@/context/CommercialContext";
import { useApp } from "@/context/AppContext";
import {
  ActivityTimeline, Btn, ChargeTable, Field, Input, LockedBanner, OptionCard, PageHead, Row, RouteSummary,
  SectionTitle, SummaryCard, Textarea, WarnBanner,
} from "@/components/app/commercial/parts";
import { EmptyState, Panel, StatusBadge, type ToneKey } from "@/components/app/ui/primitives";
import {
  QUOTE_TONE, inr, isExpired, optionMargin, optionSell, optionTotals,
  ratesExpiringBefore, type QuoteOption, type QuoteStatus, type RateRec,
} from "@/data/commercial";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

const qtone = (s: QuoteStatus): ToneKey => QUOTE_TONE[s];

/* =========================================================
   LIST
   ========================================================= */
export function QuoteListPage() {
  const { quotes, customers, rfqs } = useCommercial();
  const nav = useNavigate();
  const [f, setF] = useState("all");
  const cust = (id: string) => customers.find((c) => c.id === id)?.company ?? id;
  const rfq = (id: string) => rfqs.find((r) => r.id === id);

  const rows = quotes.filter((q) => f === "all" || q.status === f);
  const counts = (s: QuoteStatus) => quotes.filter((q) => q.status === s).length;

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Commercial · Quotations" title="Quotations" support="Build, approve and track customer quotations across every version."
        actions={<Btn variant="primary" onClick={() => nav("/app/rfqs")} icon={<Plus className="h-3.5 w-3.5" />}>New Quote</Btn>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {(["Draft", "Awaiting Approval", "Approved", "Sent", "Awaiting Customer", "Accepted", "Rejected"] as QuoteStatus[]).map((s) => (
          <button key={s} onClick={() => setF(s)} className={cn("kpi-card rounded-2xl p-3.5 text-left transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(16,44,73,0.05),0_16px_32px_-24px_rgba(16,44,73,0.45)]", f === s && "ring-1 ring-cargo-400/45")}>
            <span className="t-meta !text-[9px]">{s}</span>
            <span className={cn("t-num mt-2 block text-[24px] font-light", s === "Accepted" ? "text-ok" : s === "Rejected" ? "text-risk" : "text-frost-50")}>{counts(s)}</span>
          </button>
        ))}
      </div>
      {f !== "all" && <Btn size="sm" variant="ghost" onClick={() => setF("all")}>Show all {quotes.length} quotations</Btn>}

      <Panel bodyClass="p-0">
        {rows.length === 0 ? (
          <EmptyState title="No quotations yet" body="Evaluate rates on an RFQ to build the first quotation."
            action={<Btn variant="primary" onClick={() => nav("/app/rfqs")}>Go to RFQs</Btn>} />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[880px] text-left text-[12.5px]">
              <caption className="sr-only">Quotation list</caption>
              <thead className="border-b border-steel-400/12 bg-work-50/70">
                <tr className="[&>th]:whitespace-nowrap [&>th]:px-3.5 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500">
                  <th>Quote ID</th><th>RFQ</th><th>Customer</th><th>Route</th><th>Version</th><th>Options</th>
                  <th className="text-right">Selling price</th><th className="text-right">Margin</th><th>Valid until</th><th>Status</th><th>Owner</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => {
                  const best = [...q.options].sort((a, b) => optionMargin(b) - optionMargin(a))[0] ?? null;
                  const r = rfq(q.rfqId);
                  return (
                    <tr key={q.id + q.version} onClick={() => nav(`/app/quotes/${q.id}`)}
                      className="cursor-pointer border-b border-steel-400/[0.07] transition-colors last:border-0 hover:bg-work-100 [&>td]:whitespace-nowrap [&>td]:px-3.5 [&>td]:py-2.5">
                      <td className="font-mono text-[11.5px] text-frost-50">{q.id}-V{q.version}</td>
                      <td className="font-mono text-[11px] text-steel-400">{q.rfqId}</td>
                      <td className="max-w-[150px] truncate text-steel-300">{cust(q.customerId)}</td>
                      <td className="text-steel-300">{r ? `${r.origin} → ${r.destination}` : "—"}</td>
                      <td className="text-steel-400">V{q.version}</td>
                      <td className="t-num text-steel-300">{q.options.length}</td>
                      <td className="t-num text-right text-frost-50">{inr(best ? optionSell(best) : 0)}</td>
                      <td className={cn("t-num text-right", best && optionMargin(best) < 14 ? "text-warn" : "text-steel-300")}>{best ? `${optionMargin(best).toFixed(1)}%` : "—"}</td>
                      <td className="text-steel-400">{q.validUntil}</td>
                      <td><StatusBadge tone={qtone(q.status)} dot={false}>{q.status}</StatusBadge></td>
                      <td className="text-steel-400">{q.owner}</td>
                      <td className="text-right"><ChevronRight className="ml-auto h-4 w-4 text-steel-500" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   BUILDER
   ========================================================= */
const NAMES = ["Fastest", "Balanced", "Economical"];

export function QuoteBuilderPage() {
  const { rfqId = "" } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { notify } = useApp();
  const { rfqById, customerById, rates, quotes, saveQuote } = useCommercial();
  const r = rfqById(rfqId);
  const preselect = (params.get("rates") ?? "").split(",").filter(Boolean);
  const existing = quotes.find((q) => q.rfqId === rfqId);

  const [options, setOptions] = useState<QuoteOption[]>(() => {
    const seed = preselect.length
      ? preselect.map((id) => rates.find((x) => x.id === id)).filter(Boolean)
      : rates.filter((x) => x.origin === r?.origin && x.destination === r?.destination && x.chargeType === "Freight").slice(0, 0);
    const list: RateRec[] = seed as RateRec[];
    if (list.length === 0) {
      return [{ key: "A", name: "Balanced", mode: r?.mode ?? "ocean", transit: "14 days", summary: "Standard service", charges: [] }];
    }
    const byMode: Record<string, RateRec[]> = {};
    list.forEach((x) => { (byMode[x.vendor] ??= []).push(x); });
    const groups = Object.values(byMode);
    return groups.slice(0, 3).map((g, i) => ({
      key: String.fromCharCode(65 + i), name: NAMES[i] ?? `Option ${i + 1}`, mode: r?.mode ?? "ocean",
      transit: `${10 + i * 3} days`, summary: g.map((x) => x.vendor).join(" · "),
      charges: g.map((x, k) => ({ key: `cl-${k}`, component: x.chargeType, vendor: x.vendor, cost: x.amount, marginType: "Percent" as const, margin: 18, currency: x.currency, rateId: x.id })),
    }));
  });
  const [validUntil, setValidUntil] = useState("2025-11-05");
  const [activeOpt, setActiveOpt] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);

  if (!r) return <EmptyState title="RFQ not found" body="This enquiry may have been removed." action={<Btn onClick={() => nav("/app/rfqs")}>Back to RFQs</Btn>} />;
  const c = customerById(r.customerId);
  const version = (existing?.version ?? 0) + 1;
  const quoteId = existing?.id ?? `SPG-QUO-${r.id.slice(-6)}`;
  const opt = options[activeOpt];
  const totals = optionTotals(opt?.charges ?? []);

  const expiring = useMemo(() => ratesExpiringBefore(rates, options.flatMap((o) => o.charges), validUntil), [rates, options, validUntil]);

  const setOpt = (patch: Partial<QuoteOption>) => setOptions((p) => p.map((o, i) => (i === activeOpt ? { ...o, ...patch } : o)));
  const addOption = () => {
    const key = String.fromCharCode(65 + options.length);
    setOptions((p) => [...p, { key, name: NAMES[options.length] ?? `Option ${options.length + 1}`, mode: r.mode, transit: "14 days", summary: "New option", charges: [...(p[0]?.charges ?? [])] }]);
    setActiveOpt(options.length);
  };

  const persist = (status: QuoteStatus) => {
    saveQuote({
      id: quoteId, version, rfqId: r.id, customerId: r.customerId, options, validUntil, status,
      owner: "Arjun Sharma", created: "Just now",
      history: [...(existing?.history ?? []), { v: version, at: "Just now", by: "You", status }],
    });
    setSavedId(quoteId);
    notify(`${quoteId}-V${version} ${status.toLowerCase()}`);
  };

  if (savedId) {
    return (
      <div className="mx-auto max-w-xl">
        <SummaryCard title="Quotation saved" tone="accent">
          <Row k="Quote" v={`${savedId}-V${version}`} mono />
          <Row k="Customer" v={c?.company ?? ""} />
          <Row k="Options" v={String(options.length)} />
          <Row k="Valid until" v={validUntil} />
        </SummaryCard>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Btn variant="primary" onClick={() => nav(`/app/quotes/${savedId}/preview`)}>Preview Customer Quote</Btn>
          <Btn onClick={() => nav(`/app/quotes/${savedId}/approval`)}>Open Approval</Btn>
          <Btn variant="ghost" onClick={() => nav("/app/quotes")}>All quotations</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow={`Quote builder · ${quoteId}-V${version}`} title="Build Quotation"
        support={`${c?.company} · ${r.origin} → ${r.destination} · ${r.cargo.commodity} · ${r.cargo.weight} ${r.cargo.weightUnit}`}
        actions={<>
          <Btn onClick={() => persist("Draft")}>Save Draft</Btn>
          <Btn onClick={() => nav(`/app/quotes/${quoteId}/preview`)} icon={<Eye className="h-3.5 w-3.5" />}>Preview</Btn>
          <Btn variant="primary" disabled={options.every((o) => o.charges.length === 0)} onClick={() => persist("Awaiting Approval")} icon={<Send className="h-3.5 w-3.5" />}>Request Approval</Btn>
        </>} />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] md:gap-5">
        <div className="min-w-0 space-y-4 md:space-y-5">
          <Panel bodyClass="p-3 md:p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-[12px] text-frost-50">{quoteId}-V{version}</span>
              <span className="font-mono text-[11px] text-steel-500">RFQ {r.id}</span>
              <StatusBadge tone="neutral" dot={false}>{options.length} options</StatusBadge>
              <div className="ml-auto flex items-center gap-2">
                <label htmlFor="vu" className="text-[12px] text-steel-400">Valid until</label>
                <input id="vu" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                  className="h-8 rounded-lg border border-steel-400/25 bg-white px-2.5 text-[12.5px] text-frost-50 outline-none focus:border-cargo-400" />
              </div>
            </div>
            <div className="mt-3"><RouteSummary origin={r.origin} originCode={r.originCode} destination={r.destination} destCode={r.destCode} mode={r.mode} service={r.service} /></div>
          </Panel>

          <Panel bodyClass="p-3 md:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-1 flex-wrap gap-1.5">
                {options.map((o, i) => (
                  <button key={o.key} onClick={() => setActiveOpt(i)} aria-pressed={i === activeOpt}
                    className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] transition",
                      i === activeOpt ? "bg-info/[0.09] text-frost-50 ring-1 ring-cargo-400/40" : "bg-white text-steel-400 ring-1 ring-steel-400/15 hover:text-frost-50")}>
                    <span className="font-mono text-[10px] text-steel-500">{o.key}</span>{o.name}
                    <span className="t-num text-[11px] text-steel-500">{inr(optionSell(o))}</span>
                  </button>
                ))}
              </div>
              <Btn size="sm" onClick={addOption} icon={<Plus className="h-3.5 w-3.5" />}>Add Option</Btn>
            </div>
          </Panel>

          {opt && (
            <Panel title={`Option ${opt.key} — ${opt.name}`} bodyClass="p-4 md:p-5"
              action={<div className="flex gap-1.5">
                <Btn size="sm" onClick={() => { setOptions((p) => [...p, { ...opt, key: String.fromCharCode(65 + p.length), name: `${opt.name} copy` }]); setActiveOpt(options.length); }} icon={<Copy className="h-3.5 w-3.5" />}>Duplicate</Btn>
                {options.length > 1 && <Btn size="sm" variant="danger" onClick={() => { setOptions((p) => p.filter((_, i) => i !== activeOpt)); setActiveOpt(0); }} icon={<Trash2 className="h-3.5 w-3.5" />} />}
              </div>}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="oname" label="Option name"><Input id="oname" value={opt.name} onChange={(e) => setOpt({ name: e.target.value })} /></Field>
                <Field id="otransit" label="Transit time"><Input id="otransit" value={opt.transit} onChange={(e) => setOpt({ transit: e.target.value })} placeholder="14 days" /></Field>
                <Field id="osum" label="Summary"><Input id="osum" value={opt.summary} onChange={(e) => setOpt({ summary: e.target.value })} /></Field>
              </div>
              <div className="mt-5">
                <SectionTitle aside={<span className="font-mono text-[10px] text-steel-500">{opt.charges.length} components</span>}>Charge table</SectionTitle>
                <ChargeTable charges={opt.charges} editable onChange={(next) => setOpt({ charges: next })} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {rates.filter((x) => x.origin === r.origin && x.destination === r.destination && !opt.charges.some((ch) => ch.rateId === x.id)).slice(0, 8).map((x) => (
                    <button key={x.id} onClick={() => setOpt({ charges: [...opt.charges, { key: `cl-${Date.now()}`, component: x.chargeType, vendor: x.vendor, cost: x.amount, marginType: "Percent", margin: 18, currency: x.currency, rateId: x.id }] })}
                      className="rounded-lg bg-work-200 px-2 py-1 text-[11.5px] text-steel-300 transition hover:bg-cargo-400/10 hover:text-frost-50">
                      + {x.chargeType} · {x.vendor} · {inr(x.amount)}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          <Panel title="Option comparison" bodyClass="p-4 md:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {options.map((o, i) => (
                <button key={o.key} onClick={() => setActiveOpt(i)} className="text-left">
                  <OptionCard option={o} index={i} compact showInternal selected={i === activeOpt} />
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start md:space-y-5">
          <Panel title="Live commercial summary" subtitle={`Option ${opt?.key ?? "—"}`}>
            <dl>
              <Row k="Supplier cost" v={inr(totals.supplierCost)} />
              <Row k="Additional cost" v={inr(totals.additionalCost)} />
              <Row k="Expected cost" v={inr(totals.expectedCost)} />
              <Row k="Markup" v={inr(totals.markup)} />
            </dl>
            <div className="mt-3 space-y-2.5 border-t border-steel-400/12 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[12.5px] font-medium text-frost-50">Selling price</span>
                <motion.span key={Math.round(totals.sellingPrice)} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className="t-num text-[19px] font-light text-frost-50">{inr(totals.sellingPrice)}</motion.span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[12.5px] text-steel-400">Gross profit</span>
                <span className="t-num text-[13px] text-ok">{inr(totals.grossProfit)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[12.5px] text-steel-400">Gross margin</span>
                <span className={cn("t-num text-[13px] font-medium", totals.marginPct < 14 ? "text-warn" : "text-ok")}>{totals.marginPct.toFixed(2)}%</span>
              </div>
            </div>
            {totals.expectedCost === 0 && <p className="mt-3 text-[11.5px] text-steel-500">Add charge components to see the calculation.</p>}
          </Panel>

          <Panel title="Validity">
            <Row k="Quote valid until" v={validUntil} />
            <Row k="Selected rates" v={String(new Set(options.flatMap((o) => o.charges.map((x) => x.rateId)).filter(Boolean)).size)} />
            {expiring.length > 0 && <div className="mt-3"><WarnBanner>{expiring.length} selected rate component{expiring.length > 1 ? "s expire" : " expires"} before this quotation.</WarnBanner></div>}
          </Panel>

          <Panel title="Customer context">
            <Row k="Customer" v={c?.company ?? "—"} />
            <Row k="Credit terms" v={c?.billing.creditTerms ?? "—"} />
            <Row k="Currency" v={c?.billing.currency ?? "INR"} />
            <Row k="Sales owner" v={c?.owner ?? "—"} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}

/* =========================================================
   QUOTE RECORD VIEW
   ========================================================= */
export function QuoteDetailPage() {
  const { quoteId = "" } = useParams();
  const nav = useNavigate();
  const { quoteById, customerById, rfqById, setQuoteStatus } = useCommercial();
  const { notify, role } = useApp();
  const q = quoteById(quoteId);
  const [tab, setTab] = useState<"Options" | "Approval" | "Versions">("Options");
  if (!q) return <EmptyState title="Quote not found" body="This quotation may have been removed." action={<Btn onClick={() => nav("/app/quotes")}>Back to Quotations</Btn>} />;
  const c = customerById(q.customerId);
  const r = rfqById(q.rfqId);
  const locked = q.status === "Accepted";
  const canApprove = ["admin", "management"].includes(role);

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow={`Quotation · ${q.id}-V${q.version}`} title={c?.company ?? "Quotation"}
        support={r ? `${r.origin} → ${r.destination} · ${r.cargo.commodity}` : ""}
        actions={<>
          <Btn onClick={() => nav(`/app/quotes/${q.id}/preview`)} icon={<Eye className="h-3.5 w-3.5" />}>Preview</Btn>
          {q.status === "Draft" && <Btn onClick={() => { setQuoteStatus(q.id, "Awaiting Approval"); notify("Sent for approval"); }} icon={<Send className="h-3.5 w-3.5" />}>Request Approval</Btn>}
          {q.status === "Approved" && <Btn variant="primary" onClick={() => { setQuoteStatus(q.id, "Awaiting Customer"); notify("Quote sent to customer"); }}>Send to Customer</Btn>}
          {canApprove && q.status === "Awaiting Approval" && <Btn variant="primary" onClick={() => nav(`/app/quotes/${q.id}/approval`)}>Approve</Btn>}
        </>} />

      {locked && <LockedBanner />}

      <div className="app-panel p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge tone={qtone(q.status)}>{q.status}</StatusBadge>
          <span className="font-mono text-[11.5px] text-steel-400">{q.id}-V{q.version}</span>
          <span className="font-mono text-[11px] text-steel-500">RFQ {q.rfqId}</span>
          <span className="ml-auto text-[12px] text-steel-500">Valid until {q.validUntil}{isExpired(q.validUntil) ? " · expired" : ""}</span>
        </div>
        {r && <div className="mt-4"><RouteSummary origin={r.origin} originCode={r.originCode} destination={r.destination} destCode={r.destCode} mode={r.mode} service={r.service} /></div>}
      </div>

      <div role="tablist" aria-label="Quote sections" className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-steel-400/12">
        {(["Options", "Approval", "Versions"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition", tab === t ? "bg-work-200 text-frost-50" : "text-steel-400 hover:text-frost-50")}>{t}</button>
        ))}
      </div>

      {tab === "Options" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.options.map((o, i) => <OptionCard key={o.key} option={o} index={i} active={q.acceptedOption === o.key} selected={q.acceptedOption === o.key} showInternal />)}
        </div>
      )}

      {tab === "Approval" && <ApprovalBody quoteId={q.id} inline />}

      {tab === "Versions" && (
        <Panel title="Version history" bodyClass="p-0">
          <ul className="divide-y divide-steel-400/[0.08]">
            {[...q.history].reverse().map((h, hi) => (
              <li key={hi} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-mono text-[12px] text-frost-50">V{h.v}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{h.status}</span>
                <span className="text-[11.5px] text-steel-500">{h.at}</span>
                <span className="text-[12px] text-steel-400">{h.by}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/* =========================================================
   APPROVAL
   ========================================================= */
export function ApprovalBody({ quoteId, inline }: { quoteId: string; inline?: boolean }) {
  const { quoteById, customerById, rfqById, rates, setQuoteStatus } = useCommercial();
  const { notify, role } = useApp();
  const nav = useNavigate();
  const q = quoteById(quoteId);
  const [decision, setDecision] = useState<"approve" | "reject" | "changes" | null>(null);
  const [comment, setComment] = useState("");
  if (!q) return null;
  const c = customerById(q.customerId);
  const r = rfqById(q.rfqId);
  const canApprove = ["admin", "management"].includes(role);
  const needsComment = decision === "reject" || decision === "changes";
  const expiring = ratesExpiringBefore(rates, q.options.flatMap((o) => o.charges), q.validUntil);

  const submit = () => {
    if (!decision) return;
    if (needsComment && !comment.trim()) return;
    const status: QuoteStatus = decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Changes Requested";
    setQuoteStatus(q!.id, status, comment);
    notify(`${q!.id}-V${q!.version} ${status.toLowerCase()}`);
    setDecision(null); setComment("");
    if (!inline) nav(`/app/quotes/${q!.id}`);
  };

  const body = (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Panel title="Options under review" bodyClass="p-4 md:p-5">
            <ul className="space-y-2.5">
              {q.options.map((o) => {
                const t = optionTotals(o.charges);
                return (
                  <li key={o.key} className="rounded-xl bg-white p-3.5 ring-1 ring-steel-400/12">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-steel-500">{o.key}</span>
                        <span className="text-[13.5px] font-medium text-frost-50">{o.name}</span>
                        <span className="text-[11.5px] text-steel-500">{o.transit}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-steel-400">Cost {inr(t.expectedCost)}</span>
                        <span className="t-num text-[13px] text-frost-50">{inr(t.sellingPrice)}</span>
                        <span className={cn("t-num text-[12.5px] font-medium", t.marginPct < 14 ? "text-warn" : "text-ok")}>{t.marginPct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title="Charge detail" bodyClass="p-4 md:p-5">
            {q.options.map((o) => (
              <div key={o.key} className="mb-5 last:mb-0">
                <SectionTitle>Option {o.key} — {o.name}</SectionTitle>
                <ChargeTable charges={o.charges} />
              </div>
            ))}
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel title="Commercial risk">
            <dl>
              <Row k="Customer" v={c?.company ?? "—"} />
              <Row k="RFQ" v={q.rfqId} mono />
              <Row k="Version" v={`V${q.version}`} />
              <Row k="Options" v={String(q.options.length)} />
              <Row k="Valid until" v={q.validUntil} />
              <Row k="Owner" v={q.owner} />
            </dl>
          </Panel>
          <Panel title="Warnings">
            {expiring.length === 0 && !isExpired(q.validUntil)
              ? <p className="flex items-center gap-2 text-[12.5px] text-steel-300"><Check className="h-3.5 w-3.5 text-ok" />No commercial risk detected.</p>
              : <div className="space-y-2.5">
                  {isExpired(q.validUntil) && <WarnBanner>Quotation validity date has already passed.</WarnBanner>}
                  {expiring.length > 0 && <WarnBanner>{expiring.length} rate component{expiring.length > 1 ? "s expire" : " expires"} before quotation validity.</WarnBanner>}
                </div>}
          </Panel>
        </aside>
      </div>

      <Panel title="Decision" subtitle={canApprove ? "Approve, reject or request changes" : "Your role cannot approve quotations"}>
        {!canApprove ? (
          <p className="py-6 text-center text-[12.5px] text-steel-500">Switch to the Management or Administrator demo role to approve this quotation.</p>
        ) : (<>
          <div className="flex flex-wrap gap-2">
            {([["approve", "Approve", "primary"], ["changes", "Request Changes", "secondary"], ["reject", "Reject", "danger"]] as const).map(([v, l, variant]) => (
              <Btn key={v} variant={decision === v ? (v === "approve" ? "primary" : variant) : variant === "primary" ? "secondary" : variant}
                onClick={() => setDecision(v)}>{l}</Btn>
            ))}
          </div>
          {decision && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: EASE }} className="mt-4">
              <Field id="acomment" label={needsComment ? "Comment (required)" : "Comment (optional)"}
                error={needsComment && !comment.trim() ? "A comment is required for this decision." : null}>
                <Textarea id="acomment" value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder={decision === "reject" ? "Explain why this quotation is being rejected…" : decision === "changes" ? "Describe the changes required before approval…" : "Optional note for the record…"} />
              </Field>
              <div className="mt-3 flex justify-end gap-2">
                <Btn size="sm" onClick={() => { setDecision(null); setComment(""); }}>Cancel</Btn>
                <Btn size="sm" variant="primary" disabled={needsComment && !comment.trim()} onClick={submit}>
                  {decision === "approve" ? "Approve quote" : decision === "reject" ? "Reject quote" : "Request changes"}
                </Btn>
              </div>
            </motion.div>
          )}
        </>)}
      </Panel>
    </>
  );

  if (inline) return <div className="space-y-4 md:space-y-5">{body}</div>;
  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow={`Approval · ${q.id}-V${q.version}`} title="Quote Approval" support={c?.company} />
      {r && <div className="app-panel p-4"><RouteSummary origin={r.origin} originCode={r.originCode} destination={r.destination} destCode={r.destCode} mode={r.mode} service={r.service} /></div>}
      {body}
    </div>
  );
}

export function QuoteApprovalPage() {
  const { quoteId = "" } = useParams();
  return <ApprovalBody quoteId={quoteId} />;
}

/* =========================================================
   CUSTOMER-FACING PREVIEW
   ========================================================= */
const REJECT_REASONS = ["Price", "Transit Time", "Service Scope", "Changed Requirement", "Competitor", "Other"];

export function QuotePreviewPage({ portal }: { portal?: boolean }) {
  const { quoteId = "" } = useParams();
  const nav = useNavigate();
  const { quoteById, customerById, rfqById, acceptQuote, rejectQuote } = useCommercial();
  const { notify } = useApp();
  const q = quoteById(quoteId);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  if (!q) return <EmptyState title="Quote not found" body="This quotation may have been removed." action={<Btn onClick={() => nav("/app/quotes")}>Back</Btn>} />;
  const c = customerById(q.customerId);
  const r = rfqById(q.rfqId);
  const expired = isExpired(q.validUntil);
  const accepted = q.status === "Accepted";
  const actionable = !expired && !accepted && ["Approved", "Sent", "Awaiting Customer"].includes(q.status);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {!portal && (
        <div className="app-panel flex flex-wrap items-center justify-between gap-3 p-3.5">
          <p className="text-[12.5px] text-steel-400">This is exactly what the customer sees. Internal cost, margin and vendor rates are hidden.</p>
          <div className="flex gap-2">
            <Btn size="sm" onClick={() => nav(`/app/quotes/${q.id}`)}>Internal view</Btn>
            <Btn size="sm" variant="ghost" onClick={() => { notify("PDF export arrives in a later phase"); }}>Export PDF</Btn>
          </div>
        </div>
      )}

      {expired && (
        <div className="app-panel flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-risk p-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-risk">Quote expired</p>
            <p className="mt-1 text-[13.5px] text-frost-50">This quotation expired on {q.validUntil} and can no longer be accepted.</p>
          </div>
          <Btn size="sm" onClick={() => nav(`/app/rfqs/${q.rfqId}/quote`)}>Request New Quote</Btn>
        </div>
      )}

      <div className="app-panel overflow-hidden">
        <header className="border-b border-steel-400/12 bg-[linear-gradient(180deg,#FFFFFF,#F5F9FC)] p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel-500">SPG CargoOS</p>
              <h1 className="mt-2 text-[22px] font-light tracking-[-0.025em] text-frost-50 md:text-[26px]">Freight Quotation</h1>
              <p className="mt-1 text-[13px] text-steel-400">Prepared for {c?.company}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[13px] text-frost-50">{q.id}-V{q.version}</p>
              <p className="mt-1 text-[12px] text-steel-500">Issued {q.created}</p>
              <p className={cn("text-[12px]", expired ? "text-risk" : "text-steel-500")}>Valid until {q.validUntil}</p>
            </div>
          </div>
          {r && <div className="mt-5"><RouteSummary origin={r.origin} originCode={r.originCode} destination={r.destination} destCode={r.destCode} mode={r.mode} service={r.service} /></div>}
        </header>

        <div className="space-y-6 p-5 md:p-7">
          {r && (
            <section>
              <SectionTitle>Cargo summary</SectionTitle>
              <dl className="grid gap-x-6 sm:grid-cols-2">
                <Row k="Commodity" v={r.cargo.commodity} />
                <Row k="Packages" v={`${r.cargo.packages} × ${r.cargo.packageType}`} />
                <Row k="Gross weight" v={`${r.cargo.weight} ${r.cargo.weightUnit}`} />
                <Row k="Volume" v={`${r.cargo.volume} ${r.cargo.volumeUnit}`} />
                {r.cargo.containerType && <Row k="Equipment" v={r.cargo.containerType} />}
                <Row k="Service" v={`${r.service} · ${r.requirements.pickup ? "pickup included" : "port pickup"}`} />
              </dl>
            </section>
          )}

          <section>
            <SectionTitle>Your options</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {q.options.map((o, i) => (
                <OptionCard key={o.key} option={o} index={i} active={q.acceptedOption === o.key} selected={q.acceptedOption === o.key}
                  onSelect={actionable ? () => setConfirm(o.key) : undefined} />
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-steel-500">{actionable ? "Select an option to accept this quotation." : expired ? "This quotation has expired." : accepted ? `You accepted Option ${q.acceptedOption}.` : "This quotation is not yet open for acceptance."}</p>
          </section>

          <section>
            <SectionTitle>Terms</SectionTitle>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <Row k="Validity" v={`Until ${q.validUntil}`} />
              <Row k="Payment terms" v={c?.billing.paymentTerms ?? "30 days from invoice date"} />
              <Row k="Currency" v={c?.billing.currency ?? "INR"} />
              <Row k="Quotation reference" v={`${q.id}-V${q.version}`} mono />
            </dl>
            <div className="mt-4 space-y-2.5 rounded-xl bg-work-100 p-4">
              <div><p className="t-meta mb-1 !text-[9px]">Exclusions</p><p className="text-[12.5px] leading-relaxed text-steel-400">Duties and taxes unless stated, demurrage and detention, storage beyond free time, customs inspection charges, and any consular or legalisation fees.</p></div>
              <div><p className="t-meta mb-1 !text-[9px]">Notes</p><p className="text-[12.5px] leading-relaxed text-steel-400">Rates are based on the cargo description provided. Any change in weight, volume or commodity may require re-quotation. Transit times are indicative and commence from vessel departure.</p></div>
            </div>
          </section>
        </div>

        {actionable && (
          <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-steel-400/12 bg-white/95 p-4 backdrop-blur-xl">
            <p className="text-[12.5px] text-steel-400">Need clarification before deciding?</p>
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" onClick={() => notify("Question sent to your account manager")}>Ask a Question</Btn>
              <Btn size="sm" variant="danger" onClick={() => setRejecting(true)}>Reject Quote</Btn>
              <Btn size="sm" variant="primary" onClick={() => setConfirm(q.options[0].key)}>Accept Option</Btn>
            </div>
          </footer>
        )}
        {accepted && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-steel-400/12 bg-ok/[0.05] p-4">
            <p className="flex items-center gap-2 text-[12.5px] text-frost-100"><Lock className="h-3.5 w-3.5 text-ok" />Accepted — Locked · Option {q.acceptedOption}</p>
            <Btn size="sm" variant="primary" onClick={() => nav(`/app/bookings/new?quote=${q.id}`)}>Create Booking</Btn>
          </footer>
        )}
      </div>

      {/* accept confirm */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Accept quotation">
            <div className="absolute inset-0 bg-shell-950/40 backdrop-blur-[3px]" onClick={() => setConfirm(null)} />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }} className="app-panel relative w-full max-w-md p-5">
              <p className="t-eyebrow">Confirm acceptance</p>
              <h2 className="mt-2 text-[19px] font-light tracking-[-0.02em] text-frost-50">Accept Option {confirm}?</h2>
              {(() => {
                const o = q.options.find((x) => x.key === confirm)!;
                return (
                  <dl className="mt-4 rounded-xl bg-work-100 p-3.5">
                    <Row k="Option" v={`${confirm} — ${o.name}`} />
                    <Row k="Price" v={inr(optionSell(o))} />
                    <Row k="Transit time" v={o.transit} />
                    <Row k="Validity" v={`Until ${q.validUntil}`} />
                  </dl>
                );
              })()}
              <p className="mt-3.5 text-[12px] leading-relaxed text-steel-500">Accepting locks this quotation version and creates the basis for your booking. It cannot be edited afterwards.</p>
              <div className="mt-5 flex justify-end gap-2">
                <Btn size="sm" onClick={() => setConfirm(null)} icon={<X className="h-3.5 w-3.5" />}>Cancel</Btn>
                <Btn size="sm" variant="primary" onClick={() => { acceptQuote(q.id, confirm); setConfirm(null); notify(`Option ${confirm} accepted — quote locked`); }} icon={<Check className="h-3.5 w-3.5" />}>Accept Quote</Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* reject */}
      <AnimatePresence>
        {rejecting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Reject quotation">
            <div className="absolute inset-0 bg-shell-950/40 backdrop-blur-[3px]" onClick={() => setRejecting(false)} />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }} className="app-panel relative w-full max-w-md p-5">
              <p className="t-eyebrow">Decline quotation</p>
              <h2 className="mt-2 text-[19px] font-light tracking-[-0.02em] text-frost-50">Reject this quotation?</h2>
              <Field id="rr" label="Reason" required className="mt-4">
                <div className="flex flex-wrap gap-1.5">
                  {REJECT_REASONS.map((x) => (
                    <button key={x} onClick={() => setReason(x)} aria-pressed={reason === x}
                      className={cn("rounded-lg px-2.5 py-1.5 text-[12.5px] transition",
                        reason === x ? "bg-risk/[0.09] text-risk ring-1 ring-risk/35" : "bg-white text-steel-400 ring-1 ring-steel-400/18 hover:text-frost-50")}>{x}</button>
                  ))}
                </div>
              </Field>
              <Field id="rc" label="Comment (optional)" className="mt-4">
                <Textarea id="rc" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Anything that would change your decision…" />
              </Field>
              <div className="mt-5 flex justify-end gap-2">
                <Btn size="sm" onClick={() => setRejecting(false)}>Cancel</Btn>
                <Btn size="sm" variant="danger" disabled={!reason} onClick={() => { rejectQuote(q.id, reason, comment || undefined); setRejecting(false); notify("Quotation declined"); }}>Reject Quote</Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const QuoteHelpers = { optionSell, optionMargin, FileText, ArrowRight, ActivityTimeline };
