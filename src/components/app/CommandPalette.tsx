import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, CornerDownLeft, FileText, Files, Package, Search, Users, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CUSTOMERS, DOCUMENTS, FLAGSHIP, INVOICES, QUOTES, RFQS, SHIPMENTS, VENDORS } from "@/data/mockData";
import { useCommercial } from "@/context/CommercialContext";
import { useExecution } from "@/context/ExecutionContext";
import { navForRole, quickActionsFor } from "@/lib/roles";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { StatusBadge } from "./ui/primitives";
import { STATUS_TONE } from "@/data/mockData";

interface Hit { id: string; kind: string; title: string; sub: string; to: string; badge?: string; tone?: "ok" | "warn" | "risk" | "info" | "cyan" | "neutral" }

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, role } = useApp();
  const com = useCommercial();
  const execution = useExecution();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (paletteOpen) {
      prevFocus.current = document.activeElement as HTMLElement;
      setQ(""); setIdx(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
    prevFocus.current?.focus?.();
  }, [paletteOpen]);

  const navItems = useMemo(() => navForRole(role).flatMap((g) => g.items), [role]);
  const actions = useMemo(() => quickActionsFor(role), [role]);

  const results = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    const shipHits: Hit[] = SHIPMENTS.filter((s) =>
      !term || s.id.toLowerCase().includes(term) || s.customer.toLowerCase().includes(term) ||
      s.origin.toLowerCase().includes(term) || s.destination.toLowerCase().includes(term))
      .slice(0, term ? 6 : 3)
      .map((s) => ({ id: s.id, kind: "Shipment", title: s.id, sub: `${s.origin} → ${s.destination} · ${s.customer}`, to: "/app/shipments", badge: s.status, tone: STATUS_TONE[s.status] }));
    const rfqHits: Hit[] = term ? RFQS.filter((r) => r.id.toLowerCase().includes(term) || r.customer.toLowerCase().includes(term) || r.lane.toLowerCase().includes(term)).slice(0, 3)
      .map((r) => ({ id: r.id, kind: "RFQ", title: r.id, sub: `${r.lane} · ${r.customer}`, to: "/app/rfqs", badge: r.status, tone: r.status === "New" ? "info" : r.status === "Won" ? "ok" : "neutral" })) : [];
    const quoteHits: Hit[] = term ? QUOTES.filter((x) => x.id.toLowerCase().includes(term) || x.customer.toLowerCase().includes(term)).slice(0, 3)
      .map((x) => ({ id: x.id, kind: "Quote", title: x.id, sub: `${x.lane} · ${x.customer}`, to: "/app/quotes", badge: x.status, tone: x.status === "Accepted" ? "ok" : x.status === "Expired" ? "risk" : "cyan" })) : [];
    const cusHits: Hit[] = term ? CUSTOMERS.filter((c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)).slice(0, 3)
      .map((c) => ({ id: c.id, kind: "Customer", title: c.name, sub: `${c.code} · ${c.country} · ${c.active} active`, to: "/app/customers" })) : [];
    const venHits: Hit[] = term ? VENDORS.filter((v) => v.name.toLowerCase().includes(term)).slice(0, 2)
      .map((v) => ({ id: v.id, kind: "Vendor", title: v.name, sub: `${v.type} · ${v.jobs} jobs`, to: "/app/vendors" })) : [];
    const docHits: Hit[] = term ? DOCUMENTS.filter((d) => d.name.toLowerCase().includes(term) || d.shipment.toLowerCase().includes(term)).slice(0, 3)
      .map((d) => ({ id: d.id, kind: "Document", title: d.name, sub: `${d.shipment} · ${d.updated}`, to: "/app/documents", badge: d.status, tone: d.status === "Verified" ? "ok" : d.status === "Missing" ? "risk" : "warn" })) : [];
    const invHits: Hit[] = term ? INVOICES.filter((i) => i.id.toLowerCase().includes(term) || i.customer.toLowerCase().includes(term)).slice(0, 2)
      .map((i) => ({ id: i.id, kind: "Invoice", title: i.id, sub: `${i.customer} · due ${i.due}`, to: "/app/finance", badge: i.status, tone: i.status === "Paid" ? "ok" : i.status === "Overdue" ? "risk" : "info" })) : [];
    // Phase 2 commercial records
    const comCust: Hit[] = term ? com.customers.filter((c) => c.company.toLowerCase().includes(term) || c.id.toLowerCase().includes(term) ||
      c.contacts.some((x) => x.name.toLowerCase().includes(term) || x.email.toLowerCase().includes(term))).slice(0, 3)
      .map((c) => ({ id: c.id, kind: "Customer", title: c.company, sub: `${c.id} · ${c.address.city} · ${c.contacts[0]?.email ?? ""}`, to: `/app/customers/${c.id}` })) : [];
    const comRfq: Hit[] = com.rfqs.filter((r) => term && (r.id.toLowerCase().includes(term) || r.customerId.toLowerCase().includes(term) ||
      r.origin.toLowerCase().includes(term) || r.destination.toLowerCase().includes(term))).slice(0, 4)
      .map((r) => ({ id: r.id, kind: "RFQ", title: r.id, sub: `${r.origin} → ${r.destination} · ${r.customerId}`, to: `/app/rfqs/${r.id}`, badge: r.status, tone: "cyan" as const }));
    const comQuote: Hit[] = com.quotes.filter((x) => term && (x.id.toLowerCase().includes(term) || x.rfqId.toLowerCase().includes(term) || x.customerId.toLowerCase().includes(term))).slice(0, 4)
      .map((x) => ({ id: `${x.id}-V${x.version}`, kind: "Quote", title: `${x.id}-V${x.version}`, sub: `${x.options.length} options · valid to ${x.validUntil}`, to: `/app/quotes/${x.id}`, badge: x.status, tone: x.status === "Accepted" ? "ok" : x.status === "Rejected" || x.status === "Expired" ? "risk" : "warn" as const }));
    const comBook: Hit[] = com.bookings.filter((b) => term && (b.id.toLowerCase().includes(term) || b.quoteId.toLowerCase().includes(term))).slice(0, 3)
      .map((b) => ({ id: b.id, kind: "Booking", title: b.id, sub: `${b.origin} → ${b.destination} · ${b.quoteId}`, to: `/app/bookings/${b.id}`, badge: b.status, tone: "ok" as const }));
    const execShips: Hit[] = execution.shipments.filter((s) => term && [s.id, s.bookingId, s.quoteId, s.rfqId, s.customerName, s.origin, s.destination, s.internalRef, s.customerVisibleRef ?? "", ...s.legs.flatMap((l) => [l.vendor?.vendorName ?? "", ...l.tracking.map((x) => x.value)])].some((x) => x.toLowerCase().includes(term))).slice(0, 5)
      .map((s) => ({ id: s.id, kind: "Shipment", title: s.id, sub: `${s.origin} → ${s.destination} · ${s.customerName}`, to: `/app/shipments/${s.id}`, badge: s.stage, tone: s.stage === "Completed" ? "ok" : s.exceptions.some((e) => !["Resolved", "Closed"].includes(e.status)) ? "warn" : "cyan" }));
    return [...execShips, ...comBook, ...comQuote, ...comRfq, ...comCust, ...shipHits, ...rfqHits, ...quoteHits, ...cusHits, ...venHits, ...docHits, ...invHits];
  }, [q, com, execution]);

  const navHits = useMemo(() => {
    const term = q.trim().toLowerCase();
    return navItems.filter((n) => !term || n.label.toLowerCase().includes(term)).slice(0, 6);
  }, [q, navItems]);

  const flat = useMemo(() => [
    ...results.map((r) => ({ type: "result" as const, hit: r })),
    ...navHits.map((n) => ({ type: "nav" as const, hit: { id: n.key, kind: "Go to", title: n.label, sub: n.to, to: n.to } })),
  ], [results, navHits]);

  const go = (to: string) => { setPaletteOpen(false); navigate(to); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(flat.length - 1, i + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    if (e.key === "Enter" && flat[idx]) { e.preventDefault(); go(flat[idx].hit.to); }
  };
  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${idx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const recents = [FLAGSHIP.id, "QT-24-0782", "RFQ-24-0411", "SPG-SHP-001302"];

  return (
    <AnimatePresence>
      {paletteOpen && (
        <div className="fixed inset-0 z-[90] px-4 pt-[8vh] sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Global search">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setPaletteOpen(false)} className="absolute inset-0 bg-shell-950/35 backdrop-blur-[3px]" />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative mx-auto flex max-h-[76vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,44,73,0.06),0_40px_80px_-30px_rgba(4,12,20,0.5)] ring-1 ring-steel-400/20"
          >
            <div className="flex items-center gap-3 border-b border-steel-400/12 px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-steel-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search shipments, RFQs, customers, documents…"
                aria-label="Search CargoOS"
                className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-frost-50 outline-none placeholder:text-steel-500"
              />
              <button onClick={() => setPaletteOpen(false)} className="shrink-0 rounded border border-steel-400/20 px-1.5 py-0.5 font-mono text-[10px] text-steel-500">ESC</button>
            </div>

            <div ref={listRef} className="scroll-thin flex-1 overflow-y-auto px-2 py-2">
              {!q && (
                <>
                  <p className="dock-group-label !text-steel-500 px-2.5 py-1.5">Recent</p>
                  <ul className="mb-1.5 flex flex-wrap gap-1.5 px-2">
                    {recents.map((r) => (
                      <li key={r}>
                        <button onClick={() => go(r.startsWith("QT") ? "/app/quotes" : r.startsWith("RFQ") ? "/app/rfqs" : "/app/shipments")}
                          className="inline-flex items-center gap-1.5 rounded-full bg-work-200 px-2.5 py-1 font-mono text-[11px] text-steel-300 ring-1 ring-steel-400/15 transition hover:bg-info/[0.08] hover:text-frost-50">
                          <Clock className="h-3 w-3" /> {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="dock-group-label !text-steel-500 px-2.5 py-1.5">Quick actions</p>
                  <ul className="mb-1.5">
                    {actions.slice(0, 4).map((a) => (
                      <li key={a.key}>
                        <button onClick={() => { setPaletteOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-work-200">
                          <span className="grid h-7 w-7 place-items-center rounded-md bg-work-200 ring-1 ring-steel-400/15"><Package className="h-3.5 w-3.5 text-steel-400" strokeWidth={1.7} /></span>
                          <span className="min-w-0 flex-1"><span className="block text-[13px] text-frost-50">{a.label}</span><span className="block truncate text-[11.5px] text-steel-500">{a.hint}</span></span>
                          <ArrowRight className="h-3.5 w-3.5 text-steel-500" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {results.length > 0 && (
                <>
                  <p className="dock-group-label !text-steel-500 px-2.5 py-1.5">Search results</p>
                  <ul>
                    {results.map((r) => {
                      const i = flat.findIndex((f) => f.type === "result" && f.hit.id === r.id);
                      const Icon = r.kind === "Shipment" ? Package : r.kind === "Customer" || r.kind === "Vendor" ? Users : r.kind === "Document" ? Files : r.kind === "Invoice" ? Wallet : FileText;
                      return (
                        <li key={`${r.kind}-${r.id}`}>
                          <button data-i={i} onMouseEnter={() => setIdx(i)} onClick={() => go(r.to)}
                            className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition", i === idx ? "bg-info/[0.08]" : "hover:bg-work-200")}>
                            <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md ring-1", i === idx ? "bg-info/10 ring-cargo-400/35" : "bg-work-200 ring-steel-400/15")}>
                              <Icon className={cn("h-3.5 w-3.5", i === idx ? "text-cargo-300" : "text-steel-400")} strokeWidth={1.7} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="truncate font-mono text-[12px] text-frost-50">{r.title}</span>
                                <span className="shrink-0 rounded bg-work-200 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-steel-500">{r.kind}</span>
                              </span>
                              <span className="block truncate text-[12px] text-steel-400">{r.sub}</span>
                            </span>
                            {r.badge && <StatusBadge tone={r.tone ?? "neutral"} dot={false} className="hidden sm:inline-flex">{r.badge}</StatusBadge>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {navHits.length > 0 && (
                <>
                  <p className="dock-group-label !text-steel-500 px-2.5 py-1.5">Navigation</p>
                  <ul>
                    {navHits.map((n) => {
                      const i = flat.findIndex((f) => f.type === "nav" && f.hit.id === n.key);
                      return (
                        <li key={n.key}>
                          <button data-i={i} onMouseEnter={() => setIdx(i)} onClick={() => go(n.to)}
                            className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition", i === idx ? "bg-info/[0.08]" : "hover:bg-work-200")}>
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-work-200 ring-1 ring-steel-400/15"><ArrowRight className="h-3.5 w-3.5 text-steel-400" /></span>
                            <span className="min-w-0 flex-1 truncate text-[13px] text-frost-50">{n.label}</span>
                            <span className="shrink-0 font-mono text-[10px] text-steel-500">GO TO</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {results.length === 0 && q && (
                <div className="px-3 py-10 text-center">
                  <p className="text-[13.5px] text-frost-50">No records match “{q}”.</p>
                  <p className="mt-1 text-[12.5px] text-steel-400">Try a shipment ID, customer name or document type.</p>
                </div>
              )}
            </div>

            <footer className="flex items-center gap-4 border-t border-steel-400/12 bg-work-50 px-4 py-2.5 text-[11px] text-steel-500">
              <span className="flex items-center gap-1.5"><kbd className="rounded border border-steel-400/20 bg-white px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1.5"><kbd className="rounded border border-steel-400/20 bg-white px-1.5 py-0.5 font-mono text-[10px]"><CornerDownLeft className="h-2.5 w-2.5" /></kbd> Open</span>
              <span className="ml-auto hidden sm:inline">Prototype index · {SHIPMENTS.length + RFQS.length + QUOTES.length + CUSTOMERS.length + DOCUMENTS.length + INVOICES.length + com.customers.length + com.rfqs.length + com.quotes.length + com.bookings.length} records</span>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
