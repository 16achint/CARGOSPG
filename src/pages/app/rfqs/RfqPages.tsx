import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight, Check, ChevronRight, Clock, Info, LayoutGrid, Package, Plus, Rows3, Search, Ship, Sparkles, Trash2,
} from "lucide-react";
import { useCommercial } from "@/context/CommercialContext";
import { useApp } from "@/context/AppContext";
import {
  Btn, CargoSummary, CheckRow, ChoiceCard, Combo, Field, Input, ModeServiceLabels, PageHead, RouteSummary,
  Row, SectionTitle, Select, StickyBar, StepShell, Stepper, SuccessScreen, SummaryCard, Textarea, YesNo,
} from "@/components/app/commercial/parts";
import { EmptyState, KpiCard, Panel, StatusBadge, type ToneKey } from "@/components/app/ui/primitives";
import {
  LOCATIONS, MODE_INFO, RFQ_STAGES, RFQ_STAGE_TONE, SERVICE_INFO,
  type Cargo, type Hazardous, type ModeChoice, type RfqRec, type ServiceType, type TempControl,
} from "@/data/commercial";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

const MODE_ICON = { ocean: Ship, air: ArrowRight, road: Package, rail: Package, multimodal: Package, recommend: Sparkles } as const;

/* =========================================================
   LIST — pipeline + table
   ========================================================= */
export function RfqListPage() {
  const { rfqs, customers } = useCommercial();
  const nav = useNavigate();
  const [view, setView] = useState<"pipeline" | "table">(() => (localStorage.getItem("cargoos.rfqview") as "pipeline" | "table") ?? "pipeline");
  const [q, setQ] = useState("");
  const [f, setF] = useState({ mode: "all", owner: "all", status: "all" });

  const setViewMem = (v: "pipeline" | "table") => { setView(v); try { localStorage.setItem("cargoos.rfqview", v); } catch { /* noop */ } };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rfqs.filter((r) =>
      (!term || r.id.toLowerCase().includes(term) || r.customerId.toLowerCase().includes(term) ||
        customers.find((c) => c.id === r.customerId)?.company.toLowerCase().includes(term) ||
        r.origin.toLowerCase().includes(term) || r.destination.toLowerCase().includes(term)) &&
      (f.mode === "all" || r.mode === f.mode) &&
      (f.owner === "all" || r.owner === f.owner) &&
      (f.status === "all" || r.status === f.status));
  }, [rfqs, q, f, customers]);

  const cust = (id: string) => customers.find((c) => c.id === id)?.company ?? id;
  const conv = Math.round((rfqs.filter((r) => r.status === "Won").length / Math.max(rfqs.length, 1)) * 100);
  const owners = useMemo(() => [...new Set(rfqs.map((r) => r.owner))], [rfqs]);
  const card = (r: RfqRec) => {
    const I = MODE_ICON[r.mode] ?? Package;
    return (
      <motion.button layout layoutId={`rfq-${r.id}`} key={r.id} onClick={() => nav(`/app/rfqs/${r.id}`)}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}
        className="w-full rounded-xl bg-white p-3 text-left ring-1 ring-steel-400/12 transition hover:ring-cargo-400/45">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[11.5px] text-frost-50">{r.id}</span>
          <I className="h-3.5 w-3.5 shrink-0 text-steel-400" />
        </div>
        <div className="mt-1.5 truncate text-[12.5px] font-medium text-frost-50">{cust(r.customerId)}</div>
        <div className="mt-1 truncate text-[11.5px] text-steel-400">{r.origin} → {r.destination}</div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-steel-500">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.age}</span>
          <span className="truncate">{r.owner}</span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Commercial · Enquiry pipeline" title="RFQs & Enquiries" support="Track every customer enquiry from intake through quotation and decision."
        actions={<Btn variant="primary" onClick={() => nav("/app/rfqs/new")} icon={<Plus className="h-3.5 w-3.5" />}>New RFQ</Btn>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        {RFQ_STAGES.map((s, i) => (
          <KpiCard key={s} label={s} value={rfqs.filter((r) => r.status === s).length}
            icon={i === 6 ? Check : i === 7 ? Trash2 : Package}
            tone={RFQ_STAGE_TONE[s] as ToneKey} delay={i * 0.03} />
        ))}
        <KpiCard label="Conversion" value={conv} suffix="%" icon={Sparkles} tone="ok" secondary="Won vs total" delay={0.24} />
      </div>

      <Panel bodyClass="p-3 md:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search RFQ, customer, lane…" aria-label="Search RFQs"
                className="h-9 w-full rounded-lg border border-steel-400/22 bg-white pl-9 pr-3 text-[13px] text-frost-50 outline-none transition placeholder:text-steel-500/90 focus:border-cargo-400 focus:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]" />
            </div>
            {([["mode", ["all", "ocean", "air", "road", "rail", "multimodal"]], ["owner", ["all", ...owners]], ["status", ["all", ...RFQ_STAGES]]] as [keyof typeof f, string[]][]).map(([k, opts]) => (
              <div key={k} className="relative">
                <select value={f[k]} onChange={(e) => setF((p) => ({ ...p, [k]: e.target.value }))} aria-label={`Filter by ${k}`}
                  className={cn("h-8 appearance-none rounded-lg border pl-2.5 pr-7 text-[12.5px] outline-none transition",
                    f[k] !== "all" ? "border-cargo-400/60 bg-cargo-400/[0.09] text-frost-50" : "border-steel-400/20 bg-white text-steel-300 hover:border-steel-400/40")}>
                  {opts.map((o) => <option key={o} value={o}>{o === "all" ? `All ${k}` : o}</option>)}
                </select>
                <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 text-steel-500" />
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1 rounded-lg bg-work-200 p-0.5">
              {([["pipeline", LayoutGrid, "Pipeline view"], ["table", Rows3, "Table view"]] as const).map(([v, I, label]) => (
                <button key={v} onClick={() => setViewMem(v)} aria-pressed={view === v} aria-label={label}
                  className={cn("grid h-7 w-8 place-items-center rounded-[6px] transition", view === v ? "bg-white text-frost-50 shadow-[0_1px_2px_rgba(16,44,73,0.06)]" : "text-steel-400 hover:text-frost-50")}>
                  <I className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
          {(Object.values(f).some((v) => v !== "all") || q) && <Btn size="sm" variant="ghost" onClick={() => { setQ(""); setF({ mode: "all", owner: "all", status: "all" }); }}>Clear filters</Btn>}
        </div>
      </Panel>

      {rows.length === 0 ? (
        <Panel><EmptyState title="No RFQs match your filters" body="Adjust the filters, or capture a new customer enquiry."
          action={<Btn variant="primary" onClick={() => nav("/app/rfqs/new")} icon={<Plus className="h-3.5 w-3.5" />}>New RFQ</Btn>} /></Panel>
      ) : view === "pipeline" ? (
        <div className="-mx-3.5 overflow-x-auto px-3.5 pb-2 scroll-thin md:-mx-5 md:px-5">
          <div className="flex min-w-max gap-3">
            {RFQ_STAGES.map((s) => {
              const items = rows.filter((r) => r.status === s);
              return (
                <section key={s} className="w-[228px] shrink-0">
                  <header className="mb-2 flex items-center justify-between px-1">
                    <h2 className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-steel-400">{s}</h2>
                    <span className={cn("rounded-full px-1.5 py-px font-mono text-[9.5px] tabular-nums ring-1",
                      items.length ? "bg-white text-steel-300 ring-steel-400/20" : "bg-transparent text-steel-500 ring-steel-400/10")}>{items.length}</span>
                  </header>
                  <div className="space-y-2.5 rounded-xl bg-work-200/50 p-2 ring-1 ring-steel-400/[0.08]">
                    {items.length === 0 ? <p className="py-6 text-center text-[11.5px] text-steel-500">Empty</p> : items.map(card)}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <Panel bodyClass="p-0">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[880px] text-left text-[12.5px]">
              <caption className="sr-only">RFQ list</caption>
              <thead className="border-b border-steel-400/12 bg-work-50/70">
                <tr className="[&>th]:whitespace-nowrap [&>th]:px-3.5 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500">
                  <th>RFQ no.</th><th>Customer</th><th>Origin</th><th>Destination</th><th>Mode</th>
                  <th>Service</th><th>Cargo</th><th>Date</th><th>Status</th><th>Owner</th><th>Age</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => nav(`/app/rfqs/${r.id}`)}
                    className="cursor-pointer border-b border-steel-400/[0.07] transition-colors last:border-0 hover:bg-work-100 [&>td]:whitespace-nowrap [&>td]:px-3.5 [&>td]:py-2.5">
                    <td className="font-mono text-[11.5px] text-frost-50">{r.id}</td>
                    <td className="max-w-[160px] truncate text-steel-300">{cust(r.customerId)}</td>
                    <td className="text-steel-300">{r.origin}</td>
                    <td className="text-steel-300">{r.destination}</td>
                    <td className="capitalize text-steel-300">{r.mode}</td>
                    <td className="text-steel-300">{r.service}</td>
                    <td className="max-w-[150px] truncate text-steel-400">{r.cargo.commodity}</td>
                    <td className="text-steel-400">{r.created}</td>
                    <td><StatusBadge tone={RFQ_STAGE_TONE[r.status]} dot={false}>{r.status}</StatusBadge></td>
                    <td className="text-steel-400">{r.owner}</td>
                    <td className="text-steel-500">{r.age}</td>
                    <td className="text-right"><ChevronRight className="ml-auto h-4 w-4 text-steel-500" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* =========================================================
   CREATE
   ========================================================= */
const STEPS = [
  { id: "route", label: "Customer & route" }, { id: "cargo", label: "Cargo" },
  { id: "mode", label: "Mode & service" }, { id: "req", label: "Requirements" }, { id: "review", label: "Review" },
];

const blankCargo = (): Cargo => ({
  commodity: "", description: "", packages: "", packageType: "Crates", weight: "", weightUnit: "kg",
  volume: "", volumeUnit: "cbm", dims: "", value: "", currency: "INR", containerType: "",
  hazardous: "", tempControlled: "",
});

export function RfqCreatePage() {
  const { customers, addRfq, nextRfqId } = useCommercial();
  const nav = useNavigate();
  const { notify } = useApp();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [created, setCreated] = useState<RfqRec | null>(null);

  const [customerId, setCustomerId] = useState(params.get("customer") ?? "");
  const [customerRef, setCustomerRef] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [cargo, setCargo] = useState<Cargo>(blankCargo);
  const [mode, setMode] = useState<ModeChoice | "">("");
  const [service, setService] = useState<ServiceType | "">("");
  const [detail, setDetail] = useState<Record<string, string>>({});
  const [req, setReq] = useState({ insurance: false, customs: true, warehouse: false, pickup: true, delivery: true, instructions: "", internalNotes: "" });

  const cust = customers.find((c) => c.id === customerId);
  const o = LOCATIONS.find((l) => l.city === origin);
  const dst = LOCATIONS.find((l) => l.city === destination);
  const newId = useMemo(() => nextRfqId(), [nextRfqId]);

  const e = (bad: boolean, msg = "This field is required.") => (touched && bad ? msg : null);
  const stepOk = [
    !!cust && !!origin && !!destination,
    cargo.commodity.trim() !== "" && cargo.packages !== "" && cargo.weight !== "" && cargo.hazardous !== "" && cargo.tempControlled !== "",
    mode !== "" && service !== "",
    true,
    true,
  ];
  const cargoMissing = cargo.hazardous === "" || cargo.tempControlled === "";

  if (created) {
    return (
      <SuccessScreen badge="RFQ created" title={`RFQ ${created.id}`} body="The enquiry is in the pipeline. Next step is evaluating supplier rates for this lane."
        rows={[["RFQ number", created.id], ["Customer", customers.find((c) => c.id === created.customerId)?.company ?? ""],
          ["Route", `${created.origin} → ${created.destination}`], ["Mode & service", `${created.mode} · ${created.service}`]]}
        actions={<>
          <Btn variant="primary" onClick={() => nav(`/app/rfqs/${created.id}/rates`)}>Evaluate Rates</Btn>
          <Btn onClick={() => nav(`/app/rfqs/${created.id}`)}>View RFQ</Btn>
          <Btn variant="ghost" onClick={() => nav("/app/rfqs/new")}>Create Another</Btn>
        </>} />
    );
  }

  const submit = () => {
    const rec: RfqRec = {
      id: newId, customerId, customerRef, origin, originCode: o?.code ?? "", destination, destCode: dst?.code ?? "",
      pickupDate, deliveryDate, cargo, mode: (mode || "recommend") as ModeChoice, service: (service || "D2D") as ServiceType,
      modeDetail: detail, requirements: req, status: "New", owner: "Arjun Sharma",
      created: "Just now", age: "New", notes: [{ at: "Just now", by: "You", body: "Enquiry captured from customer.", visibility: "Customer" }],
      evaluated: [],
    };
    addRfq(rec);
    setCreated(rec);
    notify(`${rec.id} created`);
  };

  const sel = (
    <>
      <SectionTitle>Mode</SectionTitle>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {MODE_INFO.map((m) => (
          <ChoiceCard key={m.id} active={mode === m.id} onClick={() => { setMode(m.id); setDetail({}); }} label={m.label} hint={m.hint} />
        ))}
      </div>
      <SectionTitle>Service type</SectionTitle>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(SERVICE_INFO) as ServiceType[]).map((s) => (
          <ChoiceCard key={s} active={service === s} onClick={() => setService(s)} label={s} hint={SERVICE_INFO[s].label} badge={null} />
        ))}
      </div>
      {service && <p className="flex items-start gap-2 rounded-xl bg-work-100 p-3 text-[12px] leading-relaxed text-steel-400"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{SERVICE_INFO[service].text}</p>}
    </>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHead eyebrow={`New enquiry · ${newId}`} title="Create RFQ" support="Capture the enquiry once. Route, cargo, mode and service flow directly into rate evaluation and quotation." />
      <div className="app-panel px-3 py-3 md:px-4"><Stepper steps={STEPS} current={step} onJump={setStep} /></div>

      <StepShell sidebar={
        <div className="space-y-3">
          <SummaryCard title="Enquiry summary" tone="accent">
            <Row k="RFQ" v={newId} mono />
            <Row k="Customer" v={cust?.company ?? "Not selected"} />
            <Row k="Route" v={origin && destination ? `${origin} → ${destination}` : "Not set"} />
            <Row k="Mode" v={mode ? (MODE_INFO.find((m) => m.id === mode)?.label ?? mode) : "Not set"} />
            <Row k="Service" v={service ?? "Not set"} />
            <Row k="Cargo" v={cargo.commodity || "Not set"} />
            <Row k="Weight" v={cargo.weight ? `${cargo.weight} ${cargo.weightUnit}` : "—"} />
          </SummaryCard>
          {origin && destination && <RouteSummary origin={origin} originCode={o?.code} destination={destination} destCode={dst?.code} mode={mode} service={service} />}
          <SummaryCard title="Prototype note" tone="muted">
            <p className="text-[11.5px] leading-relaxed text-steel-500">Rate evaluation will use seeded carrier rates for this lane. Lanes without rates show an empty state with an Add Rate action.</p>
          </SummaryCard>
        </div>
      } footer={
        <StickyBar onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
          onNext={step < 4 ? () => { setTouched(true); if (stepOk[step]) setStep((s) => s + 1); } : submit}
          nextLabel={step < 4 ? "Continue" : "Create RFQ"}
          disabled={step === 4 ? false : !stepOk[step]} />
      }>
        <AnimatePresence mode="wait">
          <motion.div key={STEPS[step].id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: EASE }} className="space-y-5">
            {step === 0 && (<>
              <SectionTitle>Customer & route</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="cust" label="Customer" required error={e(!cust, "Select a customer.")}
                  className="sm:col-span-2"
                  aside={<button type="button" onClick={() => nav("/app/customers/new")} className="text-[11.5px] text-cargo-300 hover:text-cargo-400">+ Create customer</button>}>
                  <Combo id="cust" placeholder="Search customers by name or ID…"
                    items={customers.map((c) => ({ label: c.company, sub: `${c.id} · ${c.address.city} · ${c.category}` }))}
                    value={cust?.company ?? ""} onChange={(v) => setCustomerId(v ? customers.find((c) => c.company === v.label)?.id ?? "" : "")}
                    error={!cust} />
                </Field>
                <Field id="cref" label="Customer reference" hint="Their PO or enquiry number.">
                  <Input id="cref" value={customerRef} onChange={(e) => setCustomerRef(e.target.value)} placeholder="e.g. APEX/PO-8841" />
                </Field>
                <Field id="pickup" label="Pickup date"><Input id="pickup" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} /></Field>
                <Field id="origin" label="Origin" required error={e(!origin, "Select an origin location.")}>
                  <Combo id="origin" placeholder="Search city or port code…"
                    items={LOCATIONS.map((l) => ({ label: l.city, sub: `${l.code} · ${l.country}` }))}
                    value={origin} onChange={(v) => setOrigin(v?.label ?? "")} error={!origin} />
                </Field>
                <Field id="dest" label="Destination" required error={e(!destination, "Select a destination location.")}>
                  <Combo id="dest" placeholder="Search city or port code…"
                    items={LOCATIONS.map((l) => ({ label: l.city, sub: `${l.code} · ${l.country}` }))}
                    value={destination} onChange={(v) => setDestination(v?.label ?? "")} error={!destination} />
                </Field>
                <Field id="deldate" label="Requested delivery date" className="sm:col-span-2">
                  <Input id="deldate" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                </Field>
              </div>
              {origin && destination && (
                <div>
                  <SectionTitle>Route preview</SectionTitle>
                  <RouteSummary origin={origin} originCode={o?.code} destination={destination} destCode={dst?.code} mode={mode} service={service}
                    dates={pickupDate && deliveryDate ? [pickupDate, deliveryDate] : undefined} />
                </div>
              )}
            </>)}

            {step === 1 && (<>
              <SectionTitle>Cargo details</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="commodity" label="Commodity" required error={e(!cargo.commodity.trim())}><Input id="commodity" value={cargo.commodity} error={!cargo.commodity.trim()} onChange={(e) => setCargo({ ...cargo, commodity: e.target.value })} placeholder="e.g. Industrial components" /></Field>
                <Field id="pkg" label="Number of packages" required error={e(!cargo.packages)}><Input id="pkg" type="number" min={1} value={cargo.packages} error={!cargo.packages} onChange={(e) => setCargo({ ...cargo, packages: e.target.value })} /></Field>
                <Field id="pkgtype" label="Package type">
                  <Select id="pkgtype" options={["Crates", "Pallets", "Cartons", "Drums", "Bales", "Loose"].map((v) => ({ v, l: v }))} value={cargo.packageType} onChange={(e) => setCargo({ ...cargo, packageType: e.target.value })} />
                </Field>
                <Field id="wt" label="Gross weight" required error={e(!cargo.weight)}>
                  <div className="flex gap-2">
                    <Input id="wt" type="number" min={0} value={cargo.weight} error={!cargo.weight} onChange={(e) => setCargo({ ...cargo, weight: e.target.value })} />
                    <Select id="wtu" className="!w-[92px]" options={["kg", "MT"].map((v) => ({ v, l: v }))} value={cargo.weightUnit} onChange={(e) => setCargo({ ...cargo, weightUnit: e.target.value as Cargo["weightUnit"] })} />
                  </div>
                </Field>
                <Field id="vol" label="Volume">
                  <div className="flex gap-2">
                    <Input id="vol" type="number" min={0} value={cargo.volume} onChange={(e) => setCargo({ ...cargo, volume: e.target.value })} />
                    <Select id="volu" className="!w-[92px]" options={["cbm", "m³", "ft³"].map((v) => ({ v, l: v }))} value={cargo.volumeUnit} onChange={(e) => setCargo({ ...cargo, volumeUnit: e.target.value as Cargo["volumeUnit"] })} />
                  </div>
                </Field>
                <Field id="dims" label="Dimensions" hint="Per package or overall."><Input id="dims" value={cargo.dims} onChange={(e) => setCargo({ ...cargo, dims: e.target.value })} placeholder="120×80×110 cm" /></Field>
                <Field id="cval" label="Cargo value"><Input id="cval" value={cargo.value} onChange={(e) => setCargo({ ...cargo, value: e.target.value })} placeholder="42,00,000" /></Field>
                <Field id="cur" label="Currency">
                  <Select id="cur" options={["INR", "USD", "EUR", "GBP"].map((v) => ({ v, l: v }))} value={cargo.currency} onChange={(e) => setCargo({ ...cargo, currency: e.target.value })} />
                </Field>
                <Field id="desc" label="Cargo description" className="sm:col-span-2">
                  <Textarea id="desc" value={cargo.description} onChange={(e) => setCargo({ ...cargo, description: e.target.value })} placeholder="Packing, handling notes, stackability…" />
                </Field>
              </div>

              <SectionTitle>Mandatory declarations</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={cn("rounded-xl p-3.5 ring-1", cargo.hazardous === "Yes" ? "bg-risk/[0.04] ring-risk/25" : "bg-white ring-steel-400/12")}>
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-[13px] text-frost-50">Hazardous cargo<span className="ml-0.5 text-cargo-400">*</span></p><p className="mt-0.5 text-[11.5px] text-steel-500">Must be answered explicitly.</p></div>
                    <YesNo name="Hazardous cargo" value={cargo.hazardous} error={cargo.hazardous === ""} onChange={(v) => setCargo({ ...cargo, hazardous: v })} />
                  </div>
                  {cargo.hazardous === "" && touched && <p className="mt-2 text-[11.5px] text-risk">Select Yes or No to continue.</p>}
                </div>
                <div className={cn("rounded-xl p-3.5 ring-1", cargo.tempControlled === "Yes" ? "bg-warn/[0.05] ring-warn/25" : "bg-white ring-steel-400/12")}>
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-[13px] text-frost-50">Temperature controlled<span className="ml-0.5 text-cargo-400">*</span></p><p className="mt-0.5 text-[11.5px] text-steel-500">Reefer or cold-chain cargo.</p></div>
                    <YesNo name="Temperature controlled" value={cargo.tempControlled} error={cargo.tempControlled === ""} onChange={(v) => setCargo({ ...cargo, tempControlled: v })} />
                  </div>
                  {cargo.tempControlled === "" && touched && <p className="mt-2 text-[11.5px] text-risk">Select Yes or No to continue.</p>}
                </div>
              </div>

              {cargo.hazardous === "Yes" && (
                <div className="rounded-xl bg-risk/[0.04] p-4 ring-1 ring-risk/20">
                  <SectionTitle>Hazardous details</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field id="un" label="UN number" required error={e(!cargo.haz?.un)}><Input id="un" value={cargo.haz?.un ?? ""} onChange={(e) => setCargo({ ...cargo, haz: { ...(cargo.haz ?? { un: "", hazardClass: "", packingGroup: "", instructions: "" }), un: e.target.value } })} placeholder="UN1263" /></Field>
                    <Field id="hc" label="Hazard class" required error={e(!cargo.haz?.hazardClass)}><Input id="hc" value={cargo.haz?.hazardClass ?? ""} onChange={(e) => setCargo({ ...cargo, haz: { ...(cargo.haz ?? { un: "", hazardClass: "", packingGroup: "", instructions: "" }), hazardClass: e.target.value } })} placeholder="3" /></Field>
                    <Field id="pg" label="Packing group">
                      <Select id="pg" options={["", "I", "II", "III"].map((v) => ({ v, l: v || "Select" }))}
                        value={cargo.haz?.packingGroup ?? ""} onChange={(e) => setCargo({ ...cargo, haz: { ...(cargo.haz ?? { un: "", hazardClass: "", packingGroup: "", instructions: "" }), packingGroup: e.target.value as Hazardous["packingGroup"] } })} />
                    </Field>
                    <Field id="hinst" label="Special handling instructions" className="sm:col-span-3">
                      <Textarea id="hinst" value={cargo.haz?.instructions ?? ""} onChange={(e) => setCargo({ ...cargo, haz: { ...(cargo.haz ?? { un: "", hazardClass: "", packingGroup: "", instructions: "" }), instructions: e.target.value } })} />
                    </Field>
                  </div>
                </div>
              )}

              {cargo.tempControlled === "Yes" && (
                <div className="rounded-xl bg-warn/[0.05] p-4 ring-1 ring-warn/20">
                  <SectionTitle>Temperature control</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field id="tmin" label="Minimum temperature" required><Input id="tmin" value={cargo.temp?.min ?? ""} onChange={(e) => setCargo({ ...cargo, temp: { ...(cargo.temp ?? { min: "", max: "", unit: "°C", instructions: "" }), min: e.target.value } })} placeholder="2" /></Field>
                    <Field id="tmax" label="Maximum temperature" required><Input id="tmax" value={cargo.temp?.max ?? ""} onChange={(e) => setCargo({ ...cargo, temp: { ...(cargo.temp ?? { min: "", max: "", unit: "°C", instructions: "" }), max: e.target.value } })} placeholder="8" /></Field>
                    <Field id="tu" label="Unit">
                      <Select id="tu" options={["°C", "°F"].map((v) => ({ v, l: v }))} value={cargo.temp?.unit ?? "°C"}
                        onChange={(e) => setCargo({ ...cargo, temp: { ...(cargo.temp ?? { min: "", max: "", unit: "°C", instructions: "" }), unit: e.target.value as TempControl["unit"] } })} />
                    </Field>
                    <Field id="tinst" label="Special instructions" className="sm:col-span-3">
                      <Textarea id="tinst" value={cargo.temp?.instructions ?? ""} onChange={(e) => setCargo({ ...cargo, temp: { ...(cargo.temp ?? { min: "", max: "", unit: "°C", instructions: "" }), instructions: e.target.value } })} />
                    </Field>
                  </div>
                </div>
              )}
              {cargo.hazardous === "No" && cargo.tempControlled === "No" && (
                <p className="flex items-center gap-2 rounded-xl bg-ok/[0.05] px-3.5 py-2.5 text-[12.5px] text-steel-300 ring-1 ring-ok/20"><Check className="h-3.5 w-3.5 text-ok" />General cargo — no special handling declarations required.</p>
              )}
            </>)}

            {step === 2 && (<>
              {sel}
              {mode && (
                <div className="rounded-xl bg-work-100 p-4 ring-1 ring-steel-400/10">
                  <SectionTitle>{MODE_INFO.find((m) => m.id === mode)?.label} specifics</SectionTitle>
                  {mode === "ocean" && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field id="load" label="Load type">
                        <Select id="load" options={["FCL", "LCL", "Breakbulk", "ODC"].map((v) => ({ v, l: v }))} value={detail.loadType ?? "FCL"} onChange={(e) => setDetail({ ...detail, loadType: e.target.value })} />
                      </Field>
                      <Field id="cont" label="Container type">
                        <Select id="cont" options={["1 × 20HC", "1 × 40HC", "2 × 40HC", "3 × 40HC", "1 × 40HC RF", "1 × 40OT"].map((v) => ({ v, l: v }))} value={detail.container ?? ""} onChange={(e) => setDetail({ ...detail, container: e.target.value, reefer: e.target.value.includes("RF") ? "Yes" : "" })} />
                      </Field>
                      <Field id="reef" label="Reefer"><Select id="reef" options={["", "Yes", "No"].map((v) => ({ v, l: v || "Select" }))} value={detail.reefer ?? ""} onChange={(e) => setDetail({ ...detail, reefer: e.target.value })} /></Field>
                    </div>
                  )}
                  {mode === "air" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id="chg" label="Chargeable weight" hint="If already known from the customer."><Input id="chg" value={detail.chargeable ?? ""} onChange={(e) => setDetail({ ...detail, chargeable: e.target.value })} placeholder="1,240 kg" /></Field>
                      <Field id="prio" label="Priority"><Select id="prio" options={["Priority", "Standard"].map((v) => ({ v, l: v }))} value={detail.priority ?? "Standard"} onChange={(e) => setDetail({ ...detail, priority: e.target.value })} /></Field>
                      <Field id="airh" label="Special handling" className="sm:col-span-2"><Input id="airh" value={detail.handling ?? ""} onChange={(e) => setDetail({ ...detail, handling: e.target.value })} placeholder="e.g. Cargo aircraft only" /></Field>
                    </div>
                  )}
                  {mode === "road" && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field id="rl" label="Load type"><Select id="rl" options={["FTL", "PTL"].map((v) => ({ v, l: v }))} value={detail.loadType ?? "FTL"} onChange={(e) => setDetail({ ...detail, loadType: e.target.value })} /></Field>
                      <Field id="rm" label="Mile"><Select id="rm" options={["First Mile", "Last Mile", "Both"].map((v) => ({ v, l: v }))} value={detail.mile ?? ""} onChange={(e) => setDetail({ ...detail, mile: e.target.value })} /></Field>
                      <Field id="rv" label="Vehicle type" hint="If known."><Select id="rv" options={["", "32 ft MXL", "20 ft", "40 ft trailer", "Flatbed"].map((v) => ({ v, l: v || "Select" }))} value={detail.vehicle ?? ""} onChange={(e) => setDetail({ ...detail, vehicle: e.target.value })} /></Field>
                    </div>
                  )}
                  {mode === "rail" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id="rr" label="Rail service"><Select id="rr" options={["Container", "ICD", "Port movement"].map((v) => ({ v, l: v }))} value={detail.railType ?? "Container"} onChange={(e) => setDetail({ ...detail, railType: e.target.value })} /></Field>
                      <Field id="rr2" label="Rake / train reference" hint="If known."><Input id="rr2" value={detail.rake ?? ""} onChange={(e) => setDetail({ ...detail, rake: e.target.value })} /></Field>
                    </div>
                  )}
                  {(mode === "multimodal" || mode === "recommend") && (
                    <p className="text-[12.5px] leading-relaxed text-steel-400">
                      {mode === "recommend" ? "CargoOS will propose the optimal mode combination during rate evaluation based on cost, transit and cargo profile."
                        : "Capture the expected leg combination during rate evaluation. No additional fields are required here."}
                    </p>
                  )}
                </div>
              )}
              {cargoMissing && touched && <p className="text-[12px] text-warn">Cargo declarations on step 2 are still incomplete.</p>}
            </>)}

            {step === 3 && (<>
              <SectionTitle>Service requirements</SectionTitle>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <CheckRow checked={req.pickup} onChange={(v) => setReq({ ...req, pickup: v })} label="Pickup required" hint="Collect from the customer's origin address" />
                <CheckRow checked={req.delivery} onChange={(v) => setReq({ ...req, delivery: v })} label="Delivery required" hint="Final delivery to the consignee" />
                <CheckRow checked={req.customs} onChange={(v) => setReq({ ...req, customs: v })} label="Customs clearance required" hint="Export and/or import filing" />
                <CheckRow checked={req.warehouse} onChange={(v) => setReq({ ...req, warehouse: v })} label="Warehousing required" hint="CFS or bonded storage" />
                <CheckRow checked={req.insurance} onChange={(v) => setReq({ ...req, insurance: v })} label="Insurance required" hint="Cargo insurance through SPG" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="inst" label="Special instructions" hint="Shared with the customer.">
                  <Textarea id="inst" value={req.instructions} onChange={(e) => setReq({ ...req, instructions: e.target.value })} placeholder="Stacking limits, appointment windows, packaging…" />
                </Field>
                <Field id="inotes" label="Internal notes" hint="Never shown to the customer.">
                  <div className="rounded-xl border border-steel-400/25 bg-work-100 focus-within:border-cargo-400">
                    <div className="flex items-center gap-1.5 border-b border-steel-400/15 px-2.5 py-1.5">
                      <span className="rounded bg-warn/12 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-warn">Internal only</span>
                      <span className="text-[11px] text-steel-500">Not visible to the customer</span>
                    </div>
                    <textarea id="inotes" rows={2} value={req.internalNotes} onChange={(e) => setReq({ ...req, internalNotes: e.target.value })}
                      className="w-full bg-transparent px-3 py-2.5 text-[13.5px] leading-relaxed text-frost-50 outline-none placeholder:text-steel-500/90"
                      placeholder="Margin expectations, competitor intel, pricing guidance…" />
                  </div>
                </Field>
              </div>
            </>)}

            {step === 4 && (<>
              <SectionTitle>Review enquiry</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryCard title="Customer & route">
                  <Row k="Customer" v={cust?.company ?? "—"} /><Row k="Customer ID" v={customerId} mono />
                  <Row k="Reference" v={customerRef || "—"} mono />
                  <Row k="Route" v={`${origin} → ${destination}`} />
                  <Row k="Pickup" v={pickupDate || "—"} /><Row k="Delivery" v={deliveryDate || "—"} />
                </SummaryCard>
                <SummaryCard title="Mode & service"><ModeServiceLabels mode={(mode || "recommend") as ModeChoice} service={(service || "D2D") as ServiceType} detail={detail} /></SummaryCard>
                <SummaryCard title="Cargo"><CargoSummary cargo={cargo} /></SummaryCard>
                <SummaryCard title="Requirements">
                  <Row k="Pickup" v={req.pickup ? "Required" : "Not required"} />
                  <Row k="Delivery" v={req.delivery ? "Required" : "Not required"} />
                  <Row k="Customs" v={req.customs ? "Required" : "Not required"} />
                  <Row k="Warehousing" v={req.warehouse ? "Required" : "Not required"} />
                  <Row k="Insurance" v={req.insurance ? "Required" : "Not required"} />
                  {req.instructions && <Row k="Instructions" v={req.instructions.slice(0, 40) + (req.instructions.length > 40 ? "…" : "")} />}
                </SummaryCard>
                {req.internalNotes && (
                  <div className="sm:col-span-2">
                    <div className="rounded-xl bg-warn/[0.06] p-3.5 ring-1 ring-warn/25">
                      <p className="t-meta mb-2 !text-warn">Internal notes — not shared</p>
                      <p className="text-[12.5px] leading-relaxed text-steel-300">{req.internalNotes}</p>
                    </div>
                  </div>
                )}
              </div>
              {(cargoMissing || !stepOk[0] || !stepOk[1] || !stepOk[2]) && (
                <div className="rounded-xl bg-warn/[0.07] p-3.5 ring-1 ring-warn/25">
                  <p className="text-[12.5px] text-frost-100">Some required information is still missing. Use Back to complete the highlighted steps.</p>
                </div>
              )}
            </>)}
          </motion.div>
        </AnimatePresence>
      </StepShell>
    </div>
  );
}
