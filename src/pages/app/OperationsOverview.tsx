import { lazy, Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Box, ChevronRight, Clock, FileWarning, MapPin, Package, Plane,
  Radar, Ship, TrainFront, Truck, Users,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useExecution } from "@/context/ExecutionContext";
import { FilterBar } from "@/components/app/FilterBar";
import {
  EmptyState, ErrorState, KpiCard, KpiSkeleton, Panel, PositiveState, Progress, Skeleton, StatusBadge, TableSkeleton,
} from "@/components/app/ui/primitives";
import {
  ACTIVITY, ATTENTION, DOCUMENTS, FLAGSHIP, MILESTONES, STATUS_TONE, byMode, byStatus, opsKpis,
  type Shipment,
} from "@/data/mockData";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { NetworkPulse } from "@/components/app/NetworkPulse";
import { ShipmentHealthChart } from "@/components/app/ShipmentHealthChart";
import { NetworkInsights } from "@/components/app/NetworkInsights";

const ShipmentMap = lazy(() => import("@/components/app/ShipmentMap"));

const MODE_ICON = { ocean: Ship, air: Plane, truck: Truck, rail: TrainFront } as const;
const MSTATE_TONE = { "On schedule": "ok", "Due soon": "cyan", Delayed: "risk", Completed: "info" } as const;
const SEV_TONE = { Critical: "risk", Warning: "warn", Info: "info" } as const;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ---------- shipment preview drawer content ---------- */
export function ShipmentPreview({ s }: { s: Shipment }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-4 ring-1 ring-steel-400/12">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[13px] text-frost-50">{s.id}</div>
            <div className="mt-0.5 text-[12.5px] text-steel-400">{s.customer}</div>
          </div>
          <StatusBadge tone={STATUS_TONE[s.status]}>{s.status}</StatusBadge>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] text-frost-50">{s.origin} <span className="text-steel-500">→</span> {s.destination}</div>
            <div className="mt-0.5 font-mono text-[10.5px] tracking-[0.1em] text-steel-500">{s.originCode} · {s.destCode} · {s.teu}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[11.5px]"><span className="text-steel-500">Journey progress</span><span className="t-num text-frost-100">{s.progress}%</span></div>
          <Progress value={s.progress} tone={s.status === "Exception" ? "risk" : "cyan"} className="mt-1.5" />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-y-3 border-t border-steel-400/12 pt-4 text-[12.5px]">
          {[["Next milestone", s.nextMilestone], ["Due in", s.nextMilestoneIn], ["ETA", s.eta], ["Owner", s.owner]].map(([k, v]) => (
            <div key={k}><dt className="text-steel-500">{k}</dt><dd className="mt-0.5 text-frost-100">{v}</dd></div>
          ))}
        </dl>
      </div>
      {s.exception && (
        <div className="flex gap-3 rounded-xl bg-risk/[0.05] p-3.5 ring-1 ring-risk/25">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk" />
          <div><div className="text-[13px] font-medium text-frost-50">Active exception</div><div className="mt-0.5 text-[12.5px] text-steel-400">{s.exception}</div></div>
        </div>
      )}
      {s.docsMissing && (
        <div className="flex gap-3 rounded-xl bg-warn/[0.06] p-3.5 ring-1 ring-warn/25">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
          <div><div className="text-[13px] font-medium text-frost-50">Document pending</div><div className="mt-0.5 text-[12.5px] text-steel-400">{s.docsMissing} is required before the next milestone.</div></div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {[["View Shipment", "Full 360 record"], ["Open Tracking", "Customer-facing view"], ["View Documents", `${DOCUMENTS.filter((d) => d.shipment === s.id).length || 4} in vault`], ["Milestones", "Leg timeline"]].map(([t, d]) => (
          <button key={t} className="rounded-xl bg-white p-3 text-left ring-1 ring-steel-400/15 transition hover:ring-cargo-400/45">
            <div className="text-[12.5px] font-medium text-frost-50">{t}</div>
            <div className="mt-0.5 text-[11.5px] text-steel-500">{d}</div>
          </button>
        ))}
      </div>
      <p className="text-[12px] leading-relaxed text-steel-500">
        The complete shipment 360 workspace — legs, vendors, cost and documents — arrives in the Shipment Execution phase.
      </p>
    </div>
  );
}

/* ---------- needs attention ---------- */
function AttentionPanel() {
  const { notify } = useApp();
  const [done, setDone] = useState<string[]>([]);
  const list = ATTENTION.filter((a) => !done.includes(a.entity + a.title));
  return (
    <Panel
      title="Needs attention"
      subtitle={`${list.length} items · ${list.filter((a) => a.sev === "Critical").length} critical`}
      action={<button onClick={() => notify("Attention queue rules arrive in Control Tower phase")} className="shrink-0 text-[12.5px] font-medium text-cargo-300 hover:text-cargo-400">View all</button>}
      bodyClass="p-3 md:p-3.5"
    >
      {list.length === 0 ? (
        <PositiveState title="Everything looks on track" body="No open exceptions or blocking actions in this view." />
      ) : (
        <ul className="space-y-2">
          {list.map((a, i) => (
            <motion.li key={a.entity + a.title}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
              className="group rounded-xl bg-white p-3 ring-1 ring-steel-400/12 transition hover:ring-steel-400/30">
              <div className="flex items-start gap-2.5">
                <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1",
                  a.sev === "Critical" ? "bg-risk/[0.08] ring-risk/25" : a.sev === "Warning" ? "bg-warn/10 ring-warn/25" : "bg-info/[0.09] ring-info/25")}>
                  {a.sev === "Info" ? <Radar className="h-3 w-3 text-info" /> : <AlertTriangle className={cn("h-3 w-3", a.sev === "Critical" ? "text-risk" : "text-warn")} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[13px] font-medium text-frost-50">{a.title}</h3>
                    <StatusBadge tone={SEV_TONE[a.sev]} dot={false}>{a.sev}</StatusBadge>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-steel-400">{a.reason}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
                    <button className="rounded font-mono text-[11px] text-cargo-300 hover:text-cargo-400">{a.entity}</button>
                    <span className="flex items-center gap-1 text-steel-500"><Clock className="h-3 w-3" />{a.age}</span>
                    <span className="flex items-center gap-1 text-steel-500"><Users className="h-3 w-3" />{a.owner}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex gap-1.5 pl-[34px]">
                <button onClick={() => setDone((d) => [...d, a.entity + a.title])}
                  className="rounded-md bg-work-200 px-2 py-1 text-[11.5px] font-medium text-steel-300 transition hover:bg-ok/10 hover:text-ok">Acknowledge</button>
                <button className="rounded-md bg-work-200 px-2 py-1 text-[11.5px] font-medium text-steel-300 transition hover:bg-info/[0.1] hover:text-frost-50">Open</button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------- main ---------- */
export function OperationsOverview() {
  const { user, shipments, filters, setFilter, clearFilters, filtersActive, loading, error, retry, setPreview, notify } = useApp();
  const execution = useExecution();
  const [hovered, setHovered] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "risk">("all");

  const k = useMemo(() => opsKpis(shipments), [shipments]);
  const modeMix = useMemo(() => byMode(shipments), [shipments]);
  const statusMix = useMemo(() => byStatus(shipments), [shipments]);
  const tableRows = useMemo(
    () => (tab === "risk" ? shipments.filter((s) => s.status === "Exception" || s.docsMissing) : shipments),
    [shipments, tab]
  );
  const docsPending = DOCUMENTS.filter((d) => d.status !== "Verified");
  const activeExecutionExceptions = execution.exceptions.filter((e) => !["Resolved", "Closed"].includes(e.status));
  const health = useMemo(() => [
    { k: "Complete", n: DOCUMENTS.filter((d) => d.status === "Verified").length, color: "#0B7A55" },
    { k: "Pending review", n: DOCUMENTS.filter((d) => d.status === "Pending Review").length, color: "#C07E14" },
    { k: "Missing", n: DOCUMENTS.filter((d) => d.status === "Missing").length, color: "#C93D3A" },
  ], []);

  return (
    <div className="space-y-4 md:space-y-5">
      {/* ---------- header ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-steel-400">{greeting()}, {user.name.split(" ")[0]}</p>
          <h1 className="mt-0.5 text-[22px] font-light tracking-[-0.025em] text-frost-50 md:text-[27px]">Operations Overview</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-steel-400">
            Monitor active shipments, milestones and exceptions across your network.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => notify("Saved views arrive with Control Tower phase")}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-steel-400/20 bg-white px-2.5 text-[12.5px] text-steel-300 transition hover:border-steel-400/40 hover:text-frost-50">
            <Box className="h-3.5 w-3.5" /> Saved view
          </button>
          <button onClick={retry}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-steel-400/20 bg-white px-2.5 text-[12.5px] text-steel-300 transition hover:border-steel-400/40 hover:text-frost-50">
            Refresh
          </button>
          <Link to="/app/control-tower"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[linear-gradient(180deg,#2F86FF,#1C6FE8)] px-3 text-[12.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:shadow-[0_6px_16px_-8px_rgba(28,111,232,0.7)]">
            Control Tower <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="app-panel p-3 md:px-4"><FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} active={filtersActive} resultCount={shipments.length} /></div>

      {/* ---------- KPIs ---------- */}
      {error ? (
        <div className="app-panel"><ErrorState title="Unable to load shipment overview" body="We couldn't reach the CargoOS operations service. Your filters and view are unchanged." onRetry={retry} /></div>
      ) : loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Active shipments" value={k.active} icon={Package} tone="info" secondary="+8 this week" spark={[96, 104, 112, 118, 121, 126, 128]} delay={0} onClick={() => setTab("all")} />
          <KpiCard label="In transit" value={k.inTransit} icon={Ship} tone="cyan" secondary={`${k.inTransitPct}% of active`} spark={[52, 58, 61, 66, 69, 72, 74]} delay={0.04} />
          <KpiCard label="Delayed" value={k.delayed} icon={AlertTriangle} tone="warn" secondary="2 critical" spark={[4, 6, 5, 8, 7, 9, 9]} delay={0.08} />
          <KpiCard label="Exceptions" value={activeExecutionExceptions.length} icon={Radar} tone="risk" secondary={`${activeExecutionExceptions.filter((e) => e.severity === "Critical").length} critical · execution`} spark={[2, 3, 5, 4, 6, 7, activeExecutionExceptions.length]} delay={0.12} onClick={() => setTab("risk")} />
          <KpiCard label="Pickups due" value={k.pickups} icon={Truck} tone="cyan" secondary="Next 24 hours" spark={[6, 8, 9, 10, 11, 12, 12]} delay={0.16} />
          <KpiCard label="Documents pending" value={docsPending.length} icon={FileWarning} tone="warn" secondary={`${health[2].n} blocking`} spark={[9, 12, 14, 16, 17, 18, 18]} delay={0.2} onClick={() => setTab("risk")} />
        </div>
      )}

      {/* ---------- map + attention ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr] md:gap-5">
        <Panel title="Shipment network" subtitle="Movement across road, sea, air and rail — click a route for detail" bodyClass="p-3 md:p-3.5">
          <div className="flex h-full flex-col">
          {loading ? (
            <Skeleton className="aspect-[900/300] w-full rounded-xl" />
          ) : shipments.length === 0 ? (
            <EmptyState title="No active shipments match these filters" body="Widen the date range or clear a filter to see network movement." action={
              <button onClick={clearFilters} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-medium text-frost-50 ring-1 ring-steel-400/25 transition hover:ring-steel-400/50">Clear filters</button>
            } />
          ) : (
            <Suspense fallback={<Skeleton className="aspect-[900/300] w-full rounded-xl" />}>
              <ShipmentMap shipments={shipments} hovered={hovered} onHover={(s) => setHovered(s ? s.id : null)} onOpen={(s) => setPreview(s)} />
            </Suspense>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {shipments.slice(0, 4).map((s) => (
              <button key={s.id} onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)}
                onClick={() => setPreview(s)}
                className={cn("inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition",
                  hovered === s.id ? "border-cargo-400/60 bg-cargo-400/[0.08]" : "border-steel-400/15 bg-white hover:border-steel-400/35")}>
                <span className="font-mono text-[11px] text-frost-100">{s.id.replace("SPG-SHP-", "")}</span>
                <span className="hidden text-[11.5px] text-steel-400 sm:inline">{s.origin} → {s.destination}</span>
                <StatusBadge tone={STATUS_TONE[s.status]} dot={false}>{s.status}</StatusBadge>
              </button>
            ))}
          </div>
          <NetworkPulse shipments={shipments} />
          <ShipmentHealthChart shipments={shipments} />
          <NetworkInsights shipments={shipments} />
          </div>
        </Panel>

        <div className="min-w-0"><AttentionPanel /></div>
      </div>

      {/* ---------- table ---------- */}
      <Panel
        title="Active shipments"
        subtitle={`${tableRows.length} records · ${tab === "risk" ? "needing action" : "across all stages"}`}
        bodyClass="p-0"
        action={
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-work-200 p-0.5">
            {(["all", "risk"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}
                className={cn("rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition", tab === t ? "bg-white text-frost-50 shadow-[0_1px_2px_rgba(16,44,73,0.06)]" : "text-steel-400 hover:text-frost-50")}>
                {t === "all" ? "All" : "Needs action"}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="p-4"><TableSkeleton rows={6} cols={6} /></div>
        ) : tableRows.length === 0 ? (
          <EmptyState title={tab === "risk" ? "Nothing needs action" : "No active shipments match these filters"}
            body={tab === "risk" ? "All exceptions are acknowledged and no documents are blocking." : "Adjust the filters above to widen this view."}
            action={tab === "all" ? <button onClick={clearFilters} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-medium text-frost-50 ring-1 ring-steel-400/25 transition hover:ring-steel-400/50">Clear filters</button> : undefined} />
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden overflow-x-auto lg:block scroll-thin">
              <table className="w-full text-left text-[13px]">
                <caption className="sr-only">Active shipments</caption>
                <thead className="border-b border-steel-400/12 bg-work-50/70">
                  <tr className="[&>th]:whitespace-nowrap [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9.5px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.13em] [&>th]:text-steel-500">
                    <th>Shipment</th><th>Customer</th><th>Route</th><th>Mode</th><th>Stage</th>
                    <th>Next milestone</th><th>ETA</th><th>Status</th><th>Owner</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.slice(0, 9).map((s, i) => {
                    const MI = MODE_ICON[s.mode];
                    return (
                      <tr key={s.id}
                        onClick={() => setPreview(s)}
                        className="cursor-pointer border-b border-steel-400/[0.08] transition-colors last:border-0 hover:bg-work-100 [&>td]:whitespace-nowrap [&>td]:px-4 [&>td]:py-2.5">
                        <td>
                          <span className="flex items-center gap-2">
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="font-mono text-[12px] text-frost-50">{s.id}</motion.span>
                            {s.exception && <AlertTriangle className="h-3.5 w-3.5 text-risk" />}
                            {s.docsMissing && !s.exception && <FileWarning className="h-3.5 w-3.5 text-warn" />}
                          </span>
                        </td>
                        <td className="max-w-[160px] truncate text-steel-300">{s.customer}</td>
                        <td className="text-steel-300">{s.origin} <span className="text-steel-500">→</span> {s.destination}</td>
                        <td><span className="inline-flex items-center gap-1.5 text-steel-300"><MI className="h-3.5 w-3.5 text-steel-400" />{s.modes.length > 1 ? `${s.modes.length} modes` : s.mode}</span></td>
                        <td className="text-steel-300">{s.stage}</td>
                        <td className="text-steel-300">{s.nextMilestone}</td>
                        <td className="t-num text-steel-300">{s.eta}</td>
                        <td><StatusBadge tone={STATUS_TONE[s.status]}>{s.status}</StatusBadge></td>
                        <td className="text-steel-400">{s.owner}</td>
                        <td className="text-right">
                          <button onClick={(e) => { e.stopPropagation(); setPreview(s); }} aria-label={`Open ${s.id}`}
                            className="inline-grid h-7 w-7 place-items-center rounded-md text-steel-400 transition hover:bg-work-200 hover:text-frost-50">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* mobile / tablet cards */}
            <ul className="divide-y divide-steel-400/[0.08] lg:hidden">
              {tableRows.slice(0, 8).map((s) => {
                const MI = MODE_ICON[s.mode];
                return (
                  <li key={s.id}>
                    <button onClick={() => setPreview(s)} className="w-full px-4 py-3 text-left transition hover:bg-work-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[12px] text-frost-50">{s.id}</span>
                        <StatusBadge tone={STATUS_TONE[s.status]}>{s.status}</StatusBadge>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[13px] text-frost-100">
                        <MI className="h-3.5 w-3.5 shrink-0 text-steel-400" />
                        <span className="min-w-0 truncate">{s.origin} <span className="text-steel-500">→</span> {s.destination}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-steel-500">
                        <span>{s.customer}</span><span>{s.stage}</span><span>ETA {s.eta}</span><span>{s.owner}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {!loading && tableRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-steel-400/12 px-4 py-3 text-[12.5px]">
            <span className="text-steel-500">Showing {Math.min(9, tableRows.length)} of {tableRows.length}</span>
            <Link to="/app/shipments" className="inline-flex items-center gap-1 font-medium text-cargo-300 hover:text-cargo-400">All shipments <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        )}
      </Panel>

      {/* ---------- milestones + activity + summary ---------- */}
      <div className="grid gap-4 lg:grid-cols-3 md:gap-5">
        <Panel title="Upcoming milestones" subtitle="Next 48 hours" bodyClass="p-0">
          <ul className="divide-y divide-steel-400/[0.08]">
            {MILESTONES.map((m) => (
              <li key={m.record + m.time} className="flex items-start gap-3 px-4 py-2.5">
                <span className="mt-0.5 w-[62px] shrink-0 font-mono text-[11.5px] tabular-nums text-steel-400">{m.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-frost-100">{m.label}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="truncate font-mono text-[11px] text-cargo-300">{m.record}</span>
                    <span className="shrink-0 text-[11px] text-steel-500">{m.day}</span>
                  </span>
                </span>
                <StatusBadge tone={MSTATE_TONE[m.state]} dot={false} className="mt-0.5 shrink-0">{m.state}</StatusBadge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent activity" subtitle="Operational event stream" bodyClass="p-0"
          action={<button onClick={() => notify("Full audit timeline arrives in a later phase")} className="shrink-0 text-[12.5px] font-medium text-cargo-300 hover:text-cargo-400">View all</button>}>
          <ul className="divide-y divide-steel-400/[0.08]">
            {ACTIVITY.slice(0, 7).map((a) => (
              <li key={a.time + a.record} className="flex gap-3 px-4 py-2.5">
                <span className="mt-0.5 w-[42px] shrink-0 font-mono text-[11.5px] tabular-nums text-steel-400">{a.time}</span>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ring-4 ring-transparent"
                  style={{ background: a.tone === "risk" ? "#C93D3A" : a.tone === "warn" ? "#C07E14" : a.tone === "ok" ? "#0B7A55" : a.tone === "cyan" ? "#18A0D8" : "#1C6FE8" }} />
                <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-steel-300">
                  {a.text} <button className="font-mono text-[11.5px] text-cargo-300 hover:text-cargo-400">{a.record}</button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4 md:space-y-5">
          <Panel title="Operational summary" bodyClass="p-4 md:p-5">
            <p className="t-meta !text-[9.5px]">Shipments by mode</p>
            <ul className="mt-2.5 grid grid-cols-2 gap-2">
              {(Object.keys(modeMix) as (keyof typeof modeMix)[]).map((m) => {
                const MI = MODE_ICON[m];
                return (
                  <li key={m} className="flex items-center gap-2 rounded-lg bg-work-100 px-2.5 py-2 ring-1 ring-steel-400/10">
                    <MI className="h-3.5 w-3.5 text-steel-400" />
                    <span className="min-w-0 flex-1 truncate text-[12px] capitalize text-steel-400">{m}</span>
                    <span className="t-num text-[13px] text-frost-50">{modeMix[m]}</span>
                  </li>
                );
              })}
            </ul>
            <p className="t-meta !text-[9.5px] mt-5">Document health</p>
            <ul className="mt-2.5 space-y-2">
              {health.map((h) => (
                <li key={h.k}>
                  <div className="flex justify-between text-[12px]"><span className="text-steel-400">{h.k}</span><span className="t-num text-frost-100">{h.n}</span></div>
                  <Progress value={(h.n / DOCUMENTS.length) * 100} tone={h.k === "Missing" ? "risk" : h.k === "Complete" ? "ok" : "warn"} className="mt-1" />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Status distribution" bodyClass="p-4 md:p-5">
            <ul className="space-y-2">
              {statusMix.map((s) => (
                <li key={s.k} className="flex items-center gap-2.5">
                  <MapPin className="h-3 w-3 shrink-0 text-steel-500" />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{s.k}</span>
                  <span className="t-num text-[13px] text-frost-50">{s.n}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg bg-cargo-400/[0.06] p-3 ring-1 ring-cargo-400/20">
              <p className="text-[12px] leading-relaxed text-steel-300">
                Flagship <button onClick={() => setPreview(FLAGSHIP)} className="font-mono text-[11.5px] text-cargo-300 hover:text-cargo-400">{FLAGSHIP.id}</button> is {FLAGSHIP.progress}% through its journey, {FLAGSHIP.status.toLowerCase()} with ETA {FLAGSHIP.eta}.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
