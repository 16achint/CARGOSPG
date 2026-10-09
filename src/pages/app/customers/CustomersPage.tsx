import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2, Check, ChevronRight, Download, FileText, Mail, MoreHorizontal, Package, Phone,
  Plus, Search, Trash2, Upload, Users, Wallet,
} from "lucide-react";
import { useCommercial } from "@/context/CommercialContext";
import { useApp } from "@/context/AppContext";
import {
  ActivityTimeline, Btn, CargoSummary, CheckRow, Combo, Field, Input, PageHead, Row, SectionTitle,
  Select, StickyBar, StepShell, Stepper, SuccessScreen, SummaryCard, Textarea, YesNo,
} from "@/components/app/commercial/parts";
import { EmptyState, KpiCard, Panel, StatusBadge, TableSkeleton, type ToneKey } from "@/components/app/ui/primitives";
import type { Contact, CustomerRec } from "@/data/commercial";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

const CATS = ["Key Account", "Regular", "Prospect", "Dormant"];
const TERMS = ["Advance", "Net 15", "Net 30", "Net 45", "Net 60"];
const OWNERS = ["Arjun Sharma", "Rhea Kulkarni", "Sanjay Patil", "Meera Iyer"];
const KYC_DOCS = ["GST Certificate", "PAN", "IEC", "Company Registration", "Other KYC"];

const blank = (id: string): CustomerRec => ({
  id, company: "", category: "Regular", gstin: "", pan: "", iec: "",
  address: { line: "", city: "", state: "", country: "India", postal: "" },
  contacts: [{ id: "ct-1", name: "", designation: "", email: "", phone: "", type: "Primary" }],
  billing: { address: "", creditTerms: "Net 30", creditDays: 30, currency: "INR", paymentTerms: "30 days from invoice date" },
  owner: OWNERS[0], status: "Prospect", ytd: 0, outstanding: 0, marginPct: 0,
  openRfqs: 0, activeQuotes: 0, activeShipments: 0, docs: [],
});

/* =========================================================
   LIST
   ========================================================= */
export function CustomersPage() {
  const { customers, rfqs } = useCommercial();
  const { notify } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState({ status: "all", category: "all", owner: "all", terms: "all", country: "all" });
  const [sort, setSort] = useState<{ k: keyof CustomerRec; d: 1 | -1 }>({ k: "company", d: 1 });
  const [menu, setMenu] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = customers.filter((c) =>
      (!term || c.company.toLowerCase().includes(term) || c.id.toLowerCase().includes(term) ||
        c.gstin.toLowerCase().includes(term) || c.contacts.some((x) => x.email.toLowerCase().includes(term))) &&
      (f.status === "all" || c.status === f.status) &&
      (f.category === "all" || c.category === f.category) &&
      (f.owner === "all" || c.owner === f.owner) &&
      (f.terms === "all" || c.billing.creditTerms === f.terms) &&
      (f.country === "all" || c.address.country === f.country));
    return out.sort((a, b) => {
      const av = a[sort.k], bv = b[sort.k];
      const r = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return r * sort.d;
    });
  }, [customers, q, f, sort]);

  const countries = useMemo(() => [...new Set(customers.map((c) => c.address.country))], [customers]);
  const active = (c: CustomerRec) => (c.status === "Active" ? "ok" : c.status === "Prospect" ? "cyan" : "neutral") as ToneKey;
  const th = (k: keyof CustomerRec, l: string) => (
    <th>
      <button onClick={() => setSort((s) => ({ k, d: s.k === k && s.d === 1 ? -1 : 1 }))}
        className="inline-flex items-center gap-1 transition hover:text-frost-50">
        {l}<ChevronRight className={cn("h-3 w-3 transition-transform", sort.k === k ? (sort.d === 1 ? "rotate-90 -rotate-45" : "rotate-90") : "opacity-30 rotate-90")} />
      </button>
    </th>
  );

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Commercial · Customer directory" title="Customers"
        support="Manage customer profiles, contacts, commercial terms and activity."
        actions={<>
          <Btn onClick={() => notify("Bulk import arrives in the Administration phase")} icon={<Upload className="h-3.5 w-3.5" />}>Import</Btn>
          <Btn onClick={() => notify("Export prepared · customers.csv")} icon={<Download className="h-3.5 w-3.5" />}>Export</Btn>
          <Btn variant="primary" onClick={() => nav("/app/customers/new")} icon={<Plus className="h-3.5 w-3.5" />}>New Customer</Btn>
        </>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Total customers" value={customers.length} icon={Users} tone="info" secondary="All workspaces" />
        <KpiCard label="Active" value={customers.filter((c) => c.status === "Active").length} icon={Check} tone="ok" secondary="Trading accounts" />
        <KpiCard label="Open RFQs" value={rfqs.filter((r) => !["Won", "Lost"].includes(r.status)).length} icon={FileText} tone="cyan" secondary="In the pipeline" />
        <KpiCard label="Active shipments" value={customers.reduce((a, c) => a + c.activeShipments, 0)} icon={Package} tone="cyan" secondary="Across the network" />
        <KpiCard label="Outstanding" value={customers.reduce((a, c) => a + c.outstanding, 0) / 100000} decimals={1} suffix="L" icon={Wallet} tone="warn" secondary="Receivables" />
      </div>

      <Panel bodyClass="p-3 md:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, ID, GSTIN or contact…" aria-label="Search customers"
                className="h-9 w-full rounded-lg border border-steel-400/22 bg-white pl-9 pr-3 text-[13px] text-frost-50 outline-none transition placeholder:text-steel-500/90 focus:border-cargo-400 focus:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]" />
            </div>
            {([["status", ["all", ...["Active", "On Hold", "Prospect"]]], ["category", ["all", ...CATS]], ["owner", ["all", ...OWNERS]], ["terms", ["all", ...TERMS]], ["country", ["all", ...countries]]] as [keyof typeof f, string[]][])
              .map(([k, opts]) => (
                <div key={k} className="relative">
                  <select value={f[k]} onChange={(e) => setF((p) => ({ ...p, [k]: e.target.value }))}
                    aria-label={`Filter by ${k}`}
                    className={cn("h-8 appearance-none rounded-lg border pl-2.5 pr-7 text-[12.5px] outline-none transition",
                      f[k] !== "all" ? "border-cargo-400/60 bg-cargo-400/[0.09] text-frost-50" : "border-steel-400/20 bg-white text-steel-300 hover:border-steel-400/40")}>
                    {opts.map((o) => <option key={o} value={o}>{o === "all" ? `All ${k}` : o}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 text-steel-500" />
                </div>
              ))}
            {(Object.values(f).some((v) => v !== "all") || q) && (
              <Btn size="sm" variant="ghost" onClick={() => { setQ(""); setF({ status: "all", category: "all", owner: "all", terms: "all", country: "all" }); }}>Clear</Btn>
            )}
          </div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-steel-500">{rows.length} of {customers.length} accounts</p>
        </div>
      </Panel>

      <Panel bodyClass="p-0">
        {rows.length === 0 ? (
          <EmptyState title="No customers match your filters" body="Adjust the filters or search term, or create a new customer account."
            action={<Btn variant="primary" onClick={() => nav("/app/customers/new")} icon={<Plus className="h-3.5 w-3.5" />}>Create Customer</Btn>} />
        ) : (
          <>
            <div className="hidden overflow-x-auto scroll-thin xl:block">
              <table className="w-full text-left text-[12.5px]">
                <caption className="sr-only">Customer directory</caption>
                <thead className="border-b border-steel-400/12 bg-work-50/70">
                  <tr className="[&>th]:whitespace-nowrap [&>th]:px-3.5 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500">
                    {th("id", "Customer ID")}{th("company", "Company")}{th("category", "Category")}
                    <th>GSTIN</th><th>Primary contact</th><th>Credit terms</th><th>RFQs</th><th>Shipments</th>
                    {th("outstanding", "Outstanding")}{th("status", "Status")}{th("owner", "Owner")}<th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} onClick={() => nav(`/app/customers/${c.id}`)}
                      className="cursor-pointer border-b border-steel-400/[0.07] transition-colors last:border-0 hover:bg-work-100 [&>td]:whitespace-nowrap [&>td]:px-3.5 [&>td]:py-2.5">
                      <td className="font-mono text-[11.5px] text-frost-50">{c.id}</td>
                      <td className="max-w-[190px] truncate text-frost-50">{c.company}</td>
                      <td className="text-steel-300">{c.category}</td>
                      <td className="font-mono text-[11px] text-steel-400">{c.gstin}</td>
                      <td className="max-w-[180px] truncate text-steel-300">
                        {c.contacts.find((x) => x.type === "Primary")?.name ?? "—"}
                        <span className="ml-1.5 hidden text-steel-500 lg:inline">{c.contacts.find((x) => x.type === "Primary")?.email}</span>
                      </td>
                      <td className="text-steel-300">{c.billing.creditTerms}</td>
                      <td className="t-num text-steel-300">{c.openRfqs}</td>
                      <td className="t-num text-steel-300">{c.activeShipments}</td>
                      <td className="t-num text-frost-100">₹{(c.outstanding / 1e5).toFixed(1)} L</td>
                      <td><StatusBadge tone={active(c)} dot={false}>{c.status}</StatusBadge></td>
                      <td className="text-steel-400">{c.owner}</td>
                      <td className="relative text-right">
                        <button onClick={(e) => { e.stopPropagation(); setMenu(menu === c.id ? null : c.id); }}
                          aria-label={`Actions for ${c.company}`} aria-expanded={menu === c.id}
                          className="inline-grid h-7 w-7 place-items-center rounded-md text-steel-400 transition hover:bg-work-200 hover:text-frost-50"><MoreHorizontal className="h-4 w-4" /></button>
                        {menu === c.id && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="app-panel absolute right-0 z-30 mt-1 w-[168px] p-1.5 text-left">
                            {[["View customer", ""], ["Edit customer", ""], ["Create RFQ", "rfq"], ["View shipments", ""], ["View documents", ""], ["View finance", ""]].map(([l, to]) => (
                              <button key={l} onClick={(e) => { e.stopPropagation(); setMenu(null); to ? nav(`/app/rfqs/new?customer=${c.id}`) : notify(`${l} arrives in a later phase`); }}
                                className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-steel-300 transition hover:bg-work-200 hover:text-frost-50">{l}</button>
                            ))}
                          </motion.div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-steel-400/[0.08] xl:hidden">
              {rows.map((c) => (
                <li key={c.id}>
                  <button onClick={() => nav(`/app/customers/${c.id}`)} className="w-full px-4 py-3 text-left transition hover:bg-work-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] text-frost-50">{c.company}</div>
                        <div className="mt-0.5 font-mono text-[10.5px] text-steel-500">{c.id} · {c.category}</div>
                      </div>
                      <StatusBadge tone={active(c)} dot={false}>{c.status}</StatusBadge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-steel-500">
                      <span>{c.billing.creditTerms}</span><span>{c.activeShipments} shipments</span>
                      <span>₹{(c.outstanding / 1e5).toFixed(1)} L due</span><span>{c.owner}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   CREATE
   ========================================================= */
const STEPS = [
  { id: "company", label: "Company" }, { id: "compliance", label: "Compliance" }, { id: "contacts", label: "Contacts" },
  { id: "commercial", label: "Commercial" }, { id: "kyc", label: "KYC" }, { id: "review", label: "Review" },
];

export function CustomerCreatePage() {
  const { addCustomer, nextCustomerId, customers } = useCommercial();
  const nav = useNavigate();
  const { notify } = useApp();
  const id = useMemo(() => nextCustomerId(), [nextCustomerId]);
  const [step, setStep] = useState(0);
  const [d, setD] = useState<CustomerRec>(() => blank(id));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<CustomerRec | null>(null);

  const set = <K extends keyof CustomerRec>(k: K, v: CustomerRec[K]) => setD((p) => ({ ...p, [k]: v }));
  const t = (k: string) => !!touched[k];
  const err = (k: string, bad: boolean) => (t(k) || step === 5 ? (bad ? "This field is required." : null) : null);

  const dupId = customers.some((c) => c.id === d.id);
  const primary = d.contacts.find((x) => x.type === "Primary");
  const emailOk = !primary?.email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(primary.email);
  const phoneOk = !primary?.phone || primary.phone.replace(/\D/g, "").length >= 8;

  const companyOk = d.company.trim().length > 1 && d.address.city.trim() && d.address.country.trim();
  const complianceOk = d.id.trim().length > 3 && !dupId;
  const contactsOk = !!primary?.name?.trim() && !!primary?.email?.trim() && emailOk && phoneOk;
  const commercialOk = d.billing.creditTerms !== "" && d.billing.address.trim().length > 2;
  const ok = [companyOk, complianceOk, contactsOk, commercialOk, true, true];
  const canContinue = ok[step];

  if (saved) {
    return (
      <SuccessScreen badge="Customer created" title="Customer Created" body="The account is live and ready for enquiries, quotations and bookings."
        rows={[["Customer ID", saved.id], ["Company", saved.company], ["Primary contact", saved.contacts[0]?.name ?? "—"], ["Credit terms", saved.billing.creditTerms]]}
        actions={<>
          <Btn variant="primary" onClick={() => nav(`/app/customers/${saved.id}`)}>View Customer</Btn>
          <Btn onClick={() => nav(`/app/rfqs/new?customer=${saved.id}`)}>Create RFQ</Btn>
          <Btn variant="ghost" onClick={() => nav("/app/customers")}>Return to Customers</Btn>
        </>} />
    );
  }

  const save = () => {
    const rec: CustomerRec = { ...d, contacts: d.contacts.map((c, i) => ({ ...c, id: `ct-${i + 1}` })) };
    addCustomer(rec);
    setSaved(rec);
    notify(`${rec.id} created`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHead eyebrow={`New customer · ${id}`} title="Create Customer" support="Six short steps. Everything you capture here flows into RFQs, quotes and bookings." />
      <div className="app-panel px-3 py-3 md:px-4"><Stepper steps={STEPS} current={step} onJump={setStep} /></div>

      <StepShell footer={
        <StickyBar onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
          onNext={step < 5
            ? () => { setTouched({}); setStep((s) => s + 1); }
            : (companyOk && complianceOk && contactsOk && commercialOk) ? save : undefined}
          nextLabel={step < 5 ? "Continue" : "Save Customer"}
          disabled={step === 5 ? !(companyOk && complianceOk && contactsOk && commercialOk) : !canContinue}
          extra={step === 5 ? <Btn onClick={() => nav("/app/customers")}>Cancel</Btn> : undefined} />
      }>
        <AnimatePresence mode="wait">
          <motion.div key={STEPS[step].id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: EASE }} className="space-y-5">
            {step === 0 && (<>
              <SectionTitle>Company details</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="company" label="Company name" required error={err("company", !d.company.trim())} className="sm:col-span-2">
                  <Input id="company" value={d.company} error={!d.company.trim() && t("company")} onBlur={() => setTouched((p) => ({ ...p, company: true }))}
                    onChange={(e) => set("company", e.target.value)} placeholder="e.g. Apex Components Pvt Ltd" />
                </Field>
                <Field id="category" label="Customer category" required>
                  <Select id="category" options={CATS.map((v) => ({ v, l: v }))} value={d.category} onChange={(e) => set("category", e.target.value as CustomerRec["category"])} />
                </Field>
                <Field id="industry" label="Industry"><Input id="industry" value={d.industry ?? ""} onChange={(e) => set("industry", e.target.value)} placeholder="e.g. Industrial components" /></Field>
                <Field id="line" label="Registered address" required error={err("line", !d.address.line.trim())} className="sm:col-span-2">
                  <Input id="line" value={d.address.line} onBlur={() => setTouched((p) => ({ ...p, line: true }))} onChange={(e) => set("address", { ...d.address, line: e.target.value })} placeholder="Street, area, plot" />
                </Field>
                <Field id="city" label="City" required error={err("city", !d.address.city.trim())}>
                  <Input id="city" value={d.address.city} onBlur={() => setTouched((p) => ({ ...p, city: true }))} onChange={(e) => set("address", { ...d.address, city: e.target.value })} />
                </Field>
                <Field id="state" label="State / region"><Input id="state" value={d.address.state} onChange={(e) => set("address", { ...d.address, state: e.target.value })} /></Field>
                <Field id="country" label="Country" required error={err("country", !d.address.country.trim())}>
                  <Input id="country" value={d.address.country} onBlur={() => setTouched((p) => ({ ...p, country: true }))} onChange={(e) => set("address", { ...d.address, country: e.target.value })} />
                </Field>
                <Field id="postal" label="Postal code"><Input id="postal" value={d.address.postal} onChange={(e) => set("address", { ...d.address, postal: e.target.value })} /></Field>
                <Field id="website" label="Website" hint="Optional"><Input id="website" value={d.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="company.com" /></Field>
              </div>
            </>)}

            {step === 1 && (<>
              <SectionTitle>Compliance identifiers</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="cid" label="Customer ID" required error={dupId ? "This Customer ID already exists." : err("cid", d.id.trim().length < 4)}
                  hint="Must be unique across CargoOS.">
                  <Input id="cid" value={d.id} error={dupId} onChange={(e) => set("id", e.target.value)} className="font-mono" />
                </Field>
                <Field id="gstin" label="GSTIN" hint="Leave blank for non-Indian accounts.">
                  <Input id="gstin" value={d.gstin} onChange={(e) => set("gstin", e.target.value)} placeholder="27AABCA1234F1Z5" className="font-mono" />
                </Field>
                <Field id="pan" label="PAN"><Input id="pan" value={d.pan} onChange={(e) => set("pan", e.target.value)} className="font-mono" /></Field>
                <Field id="iec" label="IEC"><Input id="iec" value={d.iec} onChange={(e) => set("iec", e.target.value)} className="font-mono" /></Field>
              </div>
              {dupId && (
                <div className="rounded-xl bg-risk/[0.06] p-3.5 ring-1 ring-risk/25">
                  <p className="text-[12.5px] text-frost-100">Duplicate Customer ID — <span className="font-mono">{d.id}</span> is already assigned.</p>
                </div>
              )}
            </>)}

            {step === 2 && (<>
              <SectionTitle aside={
                <Btn size="sm" onClick={() => set("contacts", [...d.contacts, { id: `ct-${d.contacts.length + 1}`, name: "", designation: "", email: "", phone: "", type: "Other" }])}
                  icon={<Plus className="h-3.5 w-3.5" />}>Add contact</Btn>
              }>Contacts</SectionTitle>
              <ul className="space-y-3">
                {d.contacts.map((c, i) => {
                  const setContact = (patch: Partial<Contact>) => set("contacts", d.contacts.map((x, k) => (k === i ? { ...x, ...patch } : x)));
                  const isP = c.type === "Primary";
                  return (
                    <li key={i} className={cn("rounded-xl p-3.5 ring-1", isP ? "bg-cargo-400/[0.06] ring-cargo-400/30" : "bg-white ring-steel-400/12")}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="t-meta">{c.type} contact</span>
                          {isP && <StatusBadge tone="cyan" dot={false}>Primary</StatusBadge>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!isP && <Btn size="sm" variant="ghost" onClick={() => set("contacts", d.contacts.map((x) => ({ ...x, type: x === c ? "Primary" : x.type === "Primary" ? "Other" : x.type })))}>Set primary</Btn>}
                          {d.contacts.length > 1 && (
                            <button onClick={() => set("contacts", d.contacts.filter((_, k) => k !== i))} aria-label="Remove contact"
                              className="grid h-7 w-7 place-items-center rounded-md text-steel-500 transition hover:bg-work-200 hover:text-risk"><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field id={`cn-${i}`} label="Name" required error={isP ? err("cname", !c.name.trim()) : undefined}>
                          <Input id={`cn-${i}`} value={c.name} error={isP && !c.name.trim()} onBlur={() => setTouched((p) => ({ ...p, cname: true }))} onChange={(e) => setContact({ name: e.target.value })} />
                        </Field>
                        <Field id={`cd-${i}`} label="Designation"><Input id={`cd-${i}`} value={c.designation} onChange={(e) => setContact({ designation: e.target.value })} /></Field>
                        <Field id={`ce-${i}`} label="Email" required error={isP ? (!c.email.trim() ? "Enter the primary contact email." : !emailOk ? "Enter a valid email address." : null) : undefined}>
                          <Input id={`ce-${i}`} type="email" value={c.email} error={isP && (!c.email.trim() || !emailOk)} onBlur={() => setTouched((p) => ({ ...p, cname: true }))} onChange={(e) => setContact({ email: e.target.value })} placeholder="name@company.com" />
                        </Field>
                        <Field id={`cp-${i}`} label="Phone" error={isP && c.phone && !phoneOk ? "Enter a valid phone number." : undefined}>
                          <Input id={`cp-${i}`} value={c.phone} onChange={(e) => setContact({ phone: e.target.value })} placeholder="+91 98200 41122" />
                        </Field>
                        <Field id={`ct-${i}`} label="Contact type">
                          <Select id={`ct-${i}`} value={c.type} options={["Primary", "Commercial", "Operations", "Finance", "Other"].map((v) => ({ v, l: v }))}
                            onChange={(e) => set("contacts", d.contacts.map((x, k) => (k === i ? { ...x, type: e.target.value as Contact["type"] } : x)))} />
                        </Field>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>)}

            {step === 3 && (<>
              <SectionTitle>Commercial terms</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="baddr" label="Billing address" required error={err("baddr", d.billing.address.trim().length < 3)} className="sm:col-span-2">
                  <Textarea id="baddr" value={d.billing.address} onBlur={() => setTouched((p) => ({ ...p, baddr: true }))} onChange={(e) => set("billing", { ...d.billing, address: e.target.value })} placeholder="Where invoices are sent" />
                </Field>
                <Field id="terms" label="Credit terms" required>
                  <Select id="terms" options={TERMS.map((v) => ({ v, l: v }))} value={d.billing.creditTerms}
                    onChange={(e) => set("billing", { ...d.billing, creditTerms: e.target.value, creditDays: e.target.value === "Advance" ? 0 : parseInt(e.target.value.replace(/\D/g, "")) || 30 })} />
                </Field>
                <Field id="days" label="Credit days"><Input id="days" type="number" min={0} value={d.billing.creditDays} onChange={(e) => set("billing", { ...d.billing, creditDays: Number(e.target.value) })} /></Field>
                <Field id="cur" label="Preferred currency">
                  <Select id="cur" options={["INR", "USD", "EUR", "GBP"].map((v) => ({ v, l: v }))} value={d.billing.currency} onChange={(e) => set("billing", { ...d.billing, currency: e.target.value })} />
                </Field>
                <Field id="pt" label="Payment terms"><Input id="pt" value={d.billing.paymentTerms} onChange={(e) => set("billing", { ...d.billing, paymentTerms: e.target.value })} /></Field>
                <Field id="limit" label="Credit limit" hint="Optional — blocks bookings above the ceiling when set.">
                  <Input id="limit" type="number" min={0} value={d.billing.creditLimit ?? ""} onChange={(e) => set("billing", { ...d.billing, creditLimit: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g. 5000000" />
                </Field>
                <Field id="owner" label="Sales owner">
                  <Select id="owner" options={OWNERS.map((v) => ({ v, l: v }))} value={d.owner} onChange={(e) => set("owner", e.target.value)} />
                </Field>
              </div>
            </>)}

            {step === 4 && (<>
              <SectionTitle>KYC documents</SectionTitle>
              <p className="-mt-2 text-[12.5px] leading-relaxed text-steel-400">
                Upload behaviour is prototype-level here — the full document vault with verification workflow arrives in a later phase.
              </p>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {KYC_DOCS.map((doc) => {
                  const found = d.docs.find((x) => x.name === doc);
                  return (
                    <li key={doc} className={cn("rounded-xl p-3.5 ring-1", found ? "bg-white ring-cargo-400/35" : "bg-work-100 ring-steel-400/12")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] text-frost-50">{doc}</p>
                          {found?.file ? <p className="mt-0.5 truncate font-mono text-[11px] text-cargo-300">{found.file}</p> : <p className="mt-0.5 text-[11.5px] text-steel-500">Not uploaded</p>}
                        </div>
                        {found ? <StatusBadge tone="ok" dot={false}>Ready</StatusBadge> : <StatusBadge tone="neutral" dot={false}>Pending</StatusBadge>}
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        {!found ? (
                          <Btn size="sm" onClick={() => set("docs", [...d.docs, { name: doc, file: `${doc.replace(/\s/g, "-").toLowerCase()}.pdf` }])} icon={<Upload className="h-3.5 w-3.5" />}>Upload</Btn>
                        ) : (<>
                          <Btn size="sm" onClick={() => notify(`${found.file} preview opens in the document vault`)}>Preview</Btn>
                          <Btn size="sm" onClick={() => set("docs", d.docs.map((x) => (x.name === doc ? { ...x, file: `${doc.replace(/\s/g, "-").toLowerCase()}-v2.pdf` } : x)))}>Replace</Btn>
                          <Btn size="sm" variant="danger" onClick={() => set("docs", d.docs.filter((x) => x.name !== doc))} icon={<Trash2 className="h-3.5 w-3.5" />} />
                        </>)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>)}

            {step === 5 && (<>
              <SectionTitle>Review before saving</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryCard title="Company">
                  <Row k="Company" v={d.company || "—"} />
                  <Row k="Category" v={d.category} /><Row k="Industry" v={d.industry || "—"} />
                  <Row k="Address" v={[d.address.line, d.address.city, d.address.country].filter(Boolean).join(", ") || "—"} />
                </SummaryCard>
                <SummaryCard title="Compliance">
                  <Row k="Customer ID" v={d.id} mono />
                  <Row k="GSTIN" v={d.gstin || "—"} mono /><Row k="PAN" v={d.pan || "—"} mono /><Row k="IEC" v={d.iec || "—"} mono />
                </SummaryCard>
                <SummaryCard title="Contacts">
                  {d.contacts.map((c) => (<div key={c.id} className="mb-2 last:mb-0">
                    <Row k={`${c.name || "Unnamed"} · ${c.type}`} v={c.email || "—"} />
                  </div>))}
                </SummaryCard>
                <SummaryCard title="Commercial">
                  <Row k="Credit terms" v={d.billing.creditTerms} /><Row k="Credit days" v={String(d.billing.creditDays)} />
                  <Row k="Currency" v={d.billing.currency} /><Row k="Credit limit" v={d.billing.creditLimit ? `₹${d.billing.creditLimit.toLocaleString("en-IN")}` : "Not set"} />
                  <Row k="Sales owner" v={d.owner} />
                </SummaryCard>
                <SummaryCard title="KYC documents" tone={d.docs.length ? "default" : "muted"}>
                  {d.docs.length ? d.docs.map((x) => <Row key={x.name} k={x.name} v={x.file ?? ""} mono />) : <p className="text-[12.5px] text-steel-500">No documents uploaded.</p>}
                </SummaryCard>
                <SummaryCard title="Ready" tone="accent">
                  <p className="text-[12.5px] leading-relaxed text-steel-300">
                    Once saved, this account can receive RFQs, quotations and bookings without re-entering any of the details above.
                  </p>
                </SummaryCard>
              </div>
              {(!companyOk || !complianceOk || !contactsOk) && (
                <div className="rounded-xl bg-warn/[0.07] p-3.5 ring-1 ring-warn/25">
                  <p className="text-[12.5px] text-frost-100">Some required details are still missing. Use Back to review the highlighted steps.</p>
                </div>
              )}
            </>)}
          </motion.div>
        </AnimatePresence>
      </StepShell>
    </div>
  );
}

/* =========================================================
   360
   ========================================================= */
const TABS = ["Overview", "Contacts", "RFQs", "Quotes", "Shipments", "Documents", "Finance", "Activity"] as const;

export function CustomerDetailPage() {
  const { customerId = "" } = useParams();
  const nav = useNavigate();
  const { notify } = useApp();
  const { customerById, rfqs, quotes } = useCommercial();
  const c = customerById(customerId);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  if (!c) return <EmptyState title="Customer not found" body="This account may have been removed." action={<Btn onClick={() => nav("/app/customers")}>Back to Customers</Btn>} />;

  const myRfqs = rfqs.filter((r) => r.customerId === c.id);
  const myQuotes = quotes.filter((q) => q.customerId === c.id);
  const primary = c.contacts.find((x) => x.type === "Primary") ?? c.contacts[0];
  const events = [
    { at: "10 Oct, 09:15", label: "RFQ created", ref: "SPG-RFQ-000128", tone: "info" as const },
    { at: "09 Oct, 14:15", label: "Quotation V1 created", ref: "SPG-QUO-000128", tone: "cyan" as const },
    { at: "09 Oct, 12:20", label: "Rate request sent internally", ref: "SPG-RFQ-000128", tone: "neutral" as const },
    { at: "08 Oct, 16:40", label: "Quote sent to customer", ref: "SPG-QUO-000130", tone: "info" as const },
    { at: "06 Oct, 10:15", label: "Quote accepted", ref: "SPG-QUO-000126", tone: "ok" as const },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="app-panel p-4 md:p-5">
        <button onClick={() => nav("/app/customers")} className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-steel-400 transition hover:text-frost-50">
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Customers
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#2F86FF,#18A0D8)] text-[15px] font-medium text-white">
              {c.company.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[21px] font-light tracking-[-0.025em] text-frost-50 md:text-[25px]">{c.company}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="font-mono text-[11.5px] text-steel-400">{c.id}</span>
                <StatusBadge tone={c.status === "Active" ? "ok" : "cyan"} dot={false}>{c.status}</StatusBadge>
                <StatusBadge tone="neutral" dot={false}>{c.category}</StatusBadge>
                <span className="text-[12px] text-steel-500">{c.address.city}, {c.address.country}</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-steel-400">
                <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-steel-500" />Owner · {c.owner}</span>
                <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-steel-500" />{c.billing.creditTerms} · {c.billing.currency}</span>
                {primary && <><span className="hidden items-center gap-1.5 sm:flex"><Mail className="h-3.5 w-3.5 text-steel-500" />{primary.email}</span>
                  <span className="hidden items-center gap-1.5 lg:flex"><Phone className="h-3.5 w-3.5 text-steel-500" />{primary.phone}</span></>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => notify("Customer edit arrives in the Administration phase")}>Edit</Btn>
            <Btn onClick={() => notify("Upload opens the document vault")}>Upload Document</Btn>
            <Btn onClick={() => notify("More actions arrive in later phases")} icon={<MoreHorizontal className="h-3.5 w-3.5" />} />
            <Btn variant="primary" onClick={() => nav(`/app/rfqs/new?customer=${c.id}`)} icon={<Plus className="h-3.5 w-3.5" />}>Create RFQ</Btn>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Open RFQs" value={c.openRfqs} icon={FileText} tone="cyan" secondary="In the pipeline" />
        <KpiCard label="Active quotes" value={myQuotes.filter((q) => !["Accepted", "Rejected", "Expired"].includes(q.status)).length} icon={FileText} tone="info" secondary="With customer or internal" />
        <KpiCard label="Active shipments" value={c.activeShipments} icon={Package} tone="cyan" secondary="Moving now" />
        <KpiCard label="YTD revenue" value={c.ytd / 1e7} decimals={2} suffix="Cr" icon={Wallet} tone="info" secondary="This financial year" />
        <KpiCard label="Outstanding" value={c.outstanding / 1e5} decimals={1} suffix="L" icon={Wallet} tone={c.outstanding > 400000 ? "warn" : "neutral"} secondary="Receivables" />
        <KpiCard label="Gross margin" value={c.marginPct} decimals={1} suffix="%" icon={Check} tone={c.marginPct < 14 ? "warn" : "ok"} secondary="Blended" />
      </div>

      <div role="tablist" aria-label="Customer sections" className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-steel-400/12 scroll-thin">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition",
              tab === t ? "bg-work-200 text-frost-50" : "text-steel-400 hover:text-frost-50")}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
          <div className="space-y-4 md:space-y-5">
            <Panel title="Company information">
              <dl>
                <Row k="Registered address" v={[c.address.line, c.address.city, c.address.state, c.address.postal, c.address.country].filter(Boolean).join(", ")} />
                <Row k="Industry" v={c.industry || "—"} /><Row k="Website" v={c.website || "—"} />
                <Row k="Sales owner" v={c.owner} /><Row k="Status" v={c.status} />
              </dl>
            </Panel>
            <Panel title="Compliance details">
              <dl><Row k="Customer ID" v={c.id} mono /><Row k="GSTIN" v={c.gstin || "—"} mono /><Row k="PAN" v={c.pan || "—"} mono /><Row k="IEC" v={c.iec || "—"} mono /></dl>
            </Panel>
            <Panel title="Commercial terms">
              <dl>
                <Row k="Billing address" v={c.billing.address} /><Row k="Credit terms" v={c.billing.creditTerms} />
                <Row k="Credit days" v={String(c.billing.creditDays)} /><Row k="Preferred currency" v={c.billing.currency} />
                <Row k="Payment terms" v={c.billing.paymentTerms} />
                <Row k="Credit limit" v={c.billing.creditLimit ? `₹${c.billing.creditLimit.toLocaleString("en-IN")}` : "Not set"} />
              </dl>
            </Panel>
          </div>
          <div className="space-y-4 md:space-y-5">
            <Panel title="Primary contact">
              {primary ? (<dl>
                <Row k="Name" v={primary.name} /><Row k="Designation" v={primary.designation || "—"} />
                <Row k="Email" v={primary.email} /><Row k="Phone" v={primary.phone || "—"} /><Row k="Type" v={primary.type} />
              </dl>) : <p className="text-[12.5px] text-steel-500">No contact recorded.</p>}
            </Panel>
            <Panel title="Recent RFQs" bodyClass="p-0"
              action={<Btn size="sm" variant="ghost" onClick={() => setTab("RFQs")}>View all</Btn>}>
              {myRfqs.length === 0 ? <p className="px-4 py-6 text-center text-[12.5px] text-steel-500">No enquiries yet.</p> : (
                <ul className="divide-y divide-steel-400/[0.08]">
                  {myRfqs.slice(0, 4).map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="font-mono text-[11.5px] text-frost-50">{r.id}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{r.origin} → {r.destination}</span>
                      <StatusBadge tone="cyan" dot={false}>{r.status}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Recent quotations" bodyClass="p-0" action={<Btn size="sm" variant="ghost" onClick={() => setTab("Quotes")}>View all</Btn>}>
              {myQuotes.length === 0 ? <p className="px-4 py-6 text-center text-[12.5px] text-steel-500">No quotations yet.</p> : (
                <ul className="divide-y divide-steel-400/[0.08]">
                  {myQuotes.slice(0, 4).map((q) => (
                    <li key={q.id + q.version} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="font-mono text-[11.5px] text-frost-50">{q.id}-V{q.version}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{q.options.length} options</span>
                      <StatusBadge tone={q.status === "Accepted" ? "ok" : q.status === "Rejected" ? "risk" : "warn"} dot={false}>{q.status}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}

      {tab === "Contacts" && (
        <Panel title="Contacts" subtitle={`${c.contacts.length} recorded`} bodyClass="p-0">
          <ul className="divide-y divide-steel-400/[0.08]">
            {c.contacts.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-work-200 text-[11px] font-medium text-frost-50">{x.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="truncate text-[13px] text-frost-50">{x.name}</span>{x.type === "Primary" && <StatusBadge tone="cyan" dot={false}>Primary</StatusBadge>}</span>
                  <span className="text-[11.5px] text-steel-500">{x.designation || "—"} · {x.email}</span>
                </span>
                <span className="shrink-0 font-mono text-[11.5px] text-steel-400">{x.phone || "—"}</span>
                <span className="shrink-0 text-[11.5px] text-steel-500">{x.type}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {(tab === "RFQs" || tab === "Quotes") && (
        <Panel title={tab} bodyClass="p-0">
          {(tab === "RFQs" ? myRfqs : []).length === 0 && tab === "RFQs" && <EmptyState title="No enquiries yet" body="Create an RFQ to start the commercial flow."
            action={<Btn variant="primary" onClick={() => nav(`/app/rfqs/new?customer=${c.id}`)}>Create RFQ</Btn>} />}
          {tab === "RFQs" && myRfqs.length > 0 && (
            <ul className="divide-y divide-steel-400/[0.08]">
              {myRfqs.map((r) => (
                <li key={r.id}>
                  <button onClick={() => nav(`/app/rfqs/${r.id}`)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition hover:bg-work-100">
                    <span className="font-mono text-[12px] text-frost-50">{r.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{r.origin} → {r.destination} · {r.cargo.commodity}</span>
                    <span className="text-[11.5px] text-steel-500">{r.age}</span>
                    <StatusBadge tone="cyan" dot={false}>{r.status}</StatusBadge>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tab === "Quotes" && (myQuotes.length === 0
            ? <EmptyState title="No quotations yet" body="Build a quote from an evaluated RFQ." />
            : <ul className="divide-y divide-steel-400/[0.08]">
                {myQuotes.map((q) => (
                  <li key={q.id + q.version}>
                    <button onClick={() => nav(`/app/quotes/${q.id}/preview`)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition hover:bg-work-100">
                      <span className="font-mono text-[12px] text-frost-50">{q.id}-V{q.version}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-steel-400">{q.options.length} options · valid to {q.validUntil}</span>
                      <StatusBadge tone={q.status === "Accepted" ? "ok" : q.status === "Rejected" ? "risk" : q.status === "Expired" ? "neutral" : "warn"} dot={false}>{q.status}</StatusBadge>
                    </button>
                  </li>
                ))}
              </ul>)}
        </Panel>
      )}

      {["Shipments", "Documents", "Finance"].includes(tab) && (
        <Panel title={tab} subtitle={`Planned for a later phase`}>
          <div className="py-10 text-center">
            <p className="text-[13.5px] text-frost-50">{tab} for {c.company} will open here.</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-steel-400">This section is part of a later delivery phase. Commercial data you have already captured will carry across automatically.</p>
          </div>
        </Panel>
      )}

      {tab === "Activity" && (
        <Panel title="Commercial activity"><ActivityTimeline events={events} /></Panel>
      )}
    </div>
  );
}

export const CUSTOMER_OPTION_ITEMS = { CATS, TERMS, OWNERS };
export const CargoPreview = CargoSummary;
export const CheckRowExport = CheckRow;
export const ComboExport = Combo;
export const YesNoExport = YesNo;
export const TableSkeletonExport = TableSkeleton;
