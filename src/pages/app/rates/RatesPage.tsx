import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Download, Plus, Upload } from "lucide-react";
import { useCommercial } from "@/context/CommercialContext";
import { useApp } from "@/context/AppContext";
import { Btn, Field, Input, PageHead, Select, SummaryCard, Textarea } from "@/components/app/commercial/parts";
import { Drawer, EmptyState, Panel, StatusBadge, type ToneKey } from "@/components/app/ui/primitives";
import type { Mode } from "@/lib/geo";
import { COMPONENTS, LOCATIONS, inr, rateState, type ChargeComponent, type RateRec } from "@/data/commercial";
import { cn } from "@/utils/cn";

const VENDORS = ["Meridian Line", "Pacific Container Line", "Atlas Project Cargo", "SkyBridge Air Cargo", "Deccan Roadways", "Sahyadri Transport", "Inland Rail Logistics", "Gulf Customs House", "Harbour Warehousing Co", "Bavaria Trucking GmbH", "SPG In-house"];
const MODES: { v: Mode; l: string }[] = [
  { v: "ocean", l: "Ocean" }, { v: "air", l: "Air" }, { v: "truck", l: "Road" }, { v: "rail", l: "Rail" },
];

const tone = (s: string): ToneKey => (s === "Active" ? "ok" : s === "Expiring Soon" ? "warn" : "risk");

export function RatesPage() {
  const { rates, addRate } = useCommercial();
  const { notify } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState({ mode: "all", vendor: "all", validity: "all", currency: "all", charge: "all", origin: "all" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vendor: VENDORS[0], origin: "Pune", destination: "Houston", mode: "ocean" as Mode, chargeType: "Freight" as ChargeComponent, currency: "INR" as "INR" | "USD", amount: "", validFrom: "2025-10-06", validTo: "2026-01-31", notes: "" });
  const [touched, setTouched] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rates.filter((r) =>
      (!term || r.vendor.toLowerCase().includes(term) || r.origin.toLowerCase().includes(term) || r.destination.toLowerCase().includes(term)) &&
      (f.mode === "all" || r.mode === f.mode) && (f.vendor === "all" || r.vendor === f.vendor) &&
      (f.currency === "all" || r.currency === f.currency) && (f.charge === "all" || r.chargeType === f.charge) &&
      (f.origin === "all" || r.origin === f.origin) &&
      (f.validity === "all" || rateState(r) === f.validity));
  }, [rates, q, f]);

  const amountOk = Number(form.amount) > 0;
  const datesOk = form.validTo >= form.validFrom;
  const canSave = amountOk && datesOk;

  const save = () => {
    const rec: RateRec = {
      id: `RT-${Math.floor(Math.random() * 9000) + 1000}`, vendor: form.vendor, origin: form.origin, destination: form.destination,
      mode: form.mode, chargeType: form.chargeType, currency: form.currency, amount: Number(form.amount),
      validFrom: form.validFrom, validTo: form.validTo, notes: form.notes || undefined,
    };
    addRate(rec);
    setOpen(false);
    setTouched(false);
    setForm((p) => ({ ...p, amount: "", notes: "" }));
    notify(`${rec.vendor} rate added for ${rec.origin} → ${rec.destination}`);
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHead eyebrow="Commercial · Rate library" title="Rates" support="Carrier, transport and service rates by lane, mode and charge component."
        actions={<>
          <Btn onClick={() => notify("Bulk rate import arrives in the Administration phase")} icon={<Upload className="h-3.5 w-3.5" />}>Import Rates</Btn>
          <Btn onClick={() => notify("Export prepared · rates.csv")} icon={<Download className="h-3.5 w-3.5" />}>Export</Btn>
          <Btn variant="primary" onClick={() => setOpen(true)} icon={<Plus className="h-3.5 w-3.5" />}>Add Rate</Btn>
        </>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(["Active", "Expiring Soon", "Expired"] as const).map((s) => (
          <SummaryCard key={s} title={s} tone={s === "Active" ? "default" : s === "Expiring Soon" ? "accent" : "muted"}>
            <p className={cn("t-num text-[22px] font-light", s === "Active" ? "text-ok" : s === "Expiring Soon" ? "text-warn" : "text-risk")}>{rates.filter((r) => rateState(r) === s).length}</p>
            <p className="mt-0.5 text-[11.5px] text-steel-500">of {rates.length} rates</p>
          </SummaryCard>
        ))}
        <SummaryCard title="Distinct lanes"><p className="t-num text-[22px] font-light text-frost-50">{new Set(rates.map((r) => `${r.origin}|${r.destination}`)).size}</p><p className="mt-0.5 text-[11.5px] text-steel-500">Origin–destination pairs</p></SummaryCard>
      </div>

      <Panel bodyClass="p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendor or lane…" aria-label="Search rates"
            className="h-9 min-w-[200px] flex-1 rounded-lg border border-steel-400/22 bg-white px-3 text-[13px] text-frost-50 outline-none transition placeholder:text-steel-500/90 focus:border-cargo-400 focus:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]" />
            {([["mode", ["all", ...MODES.map((m) => String(m.v))]], ["charge", ["all", ...COMPONENTS]], ["vendor", ["all", ...VENDORS]],
            ["validity", ["all", "Active", "Expiring Soon", "Expired"]], ["currency", ["all", "INR", "USD"]],
            ["origin", ["all", ...Array.from(new Set(LOCATIONS.map((l) => l.city))).slice(0, 10)]]] as [keyof typeof f, string[]][])
            .map(([k, opts]) => (
              <div key={k} className="relative">
                <select value={f[k]} onChange={(e) => setF((p) => ({ ...p, [k]: e.target.value }))} aria-label={`Filter by ${k}`}
                  className={cn("h-8 appearance-none rounded-lg border pl-2.5 pr-7 text-[12.5px] outline-none transition",
                    f[k] !== "all" ? "border-cargo-400/60 bg-cargo-400/[0.09] text-frost-50" : "border-steel-400/20 bg-white text-steel-300 hover:border-steel-400/40")}>
                  {opts.map((o) => <option key={o} value={o}>{o === "all" ? `All ${k}` : o}</option>)}
                </select>
                <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 text-steel-500" />
              </div>
            ))}
          {(Object.values(f).some((v) => v !== "all") || q) && <Btn size="sm" variant="ghost" onClick={() => { setQ(""); setF({ mode: "all", vendor: "all", validity: "all", currency: "all", charge: "all", origin: "all" }); }}>Clear filters</Btn>}
        </div>
      </Panel>

      <Panel bodyClass="p-0">
        {rows.length === 0 ? (
          <EmptyState title="No valid rates found for this route" body="Adjust the filters, or add a rate for this lane so it can be used in rate evaluation."
            action={<Btn variant="primary" onClick={() => setOpen(true)} icon={<Plus className="h-3.5 w-3.5" />}>Add Rate</Btn>} />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[840px] text-left text-[12.5px]">
              <caption className="sr-only">Rate library</caption>
              <thead className="border-b border-steel-400/12 bg-work-50/70">
                <tr className="[&>th]:whitespace-nowrap [&>th]:px-3.5 [&>th]:py-2.5 [&>th]:font-mono [&>th]:text-[9px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500">
                  <th>Vendor</th><th>Origin</th><th>Destination</th><th>Mode</th><th>Charge type</th>
                  <th>Currency</th><th className="text-right">Amount</th><th>Valid from</th><th>Valid to</th><th>Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-steel-400/[0.07] transition-colors last:border-0 hover:bg-work-100 [&>td]:whitespace-nowrap [&>td]:px-3.5 [&>td]:py-2.5">
                    <td className="text-frost-50">{r.vendor}</td>
                    <td className="text-steel-300">{r.origin}</td>
                    <td className="text-steel-300">{r.destination}</td>
                    <td className="capitalize text-steel-300">{r.mode}</td>
                    <td className="text-steel-300">{r.chargeType}</td>
                    <td className="text-steel-400">{r.currency}</td>
                    <td className="t-num text-right text-frost-50">{inr(r.amount)}</td>
                    <td className="text-steel-400">{new Date(r.validFrom).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                    <td className="text-steel-400">{new Date(r.validTo).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</td>
                    <td><StatusBadge tone={tone(rateState(r))} dot={false}>{rateState(r)}</StatusBadge></td>
                    <td className="text-right">
                      <button onClick={() => nav(`/app/rfqs?lane=${r.origin}`)} aria-label={`RFQs using ${r.vendor}`}
                        className="inline-grid h-7 w-7 place-items-center rounded-md text-steel-400 transition hover:bg-work-200 hover:text-frost-50"><ChevronRight className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Drawer open={open} onClose={() => setOpen(false)} title="Add rate" subtitle="New contract or spot rate for a lane"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Btn size="sm" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn size="sm" variant="primary" disabled={!canSave} onClick={() => { setTouched(true); if (canSave) save(); }}>Save rate</Btn>
          </div>
        }>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="rv" label="Vendor" required><Select id="rv" options={VENDORS.map((v) => ({ v, l: v }))} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
            <Field id="rm" label="Mode" required><Select id="rm" options={MODES.map((m) => ({ v: m.v, l: m.l }))} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as Mode })} /></Field>
            <Field id="ro" label="Origin" required><Select id="ro" options={LOCATIONS.map((l) => ({ v: l.city, l: `${l.city} (${l.code})` }))} value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} /></Field>
            <Field id="rd" label="Destination" required><Select id="rd" options={LOCATIONS.map((l) => ({ v: l.city, l: `${l.city} (${l.code})` }))} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
            <Field id="rc" label="Charge type" required><Select id="rc" options={COMPONENTS.map((v) => ({ v, l: v }))} value={form.chargeType} onChange={(e) => setForm({ ...form, chargeType: e.target.value as ChargeComponent })} /></Field>
            <Field id="rcur" label="Currency" required><Select id="rcur" options={["INR", "USD"].map((v) => ({ v, l: v }))} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as "INR" | "USD" })} /></Field>
            <Field id="ra" label="Amount" required error={touched && !amountOk ? "Amount must be greater than zero." : null}>
              <Input id="ra" type="number" min={0} value={form.amount} error={touched && !amountOk} onBlur={() => setTouched(true)} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 205000" />
            </Field>
            <div />
            <Field id="rvf" label="Valid from" required><Input id="rvf" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></Field>
            <Field id="rvt" label="Valid to" required error={touched && !datesOk ? "Valid to must not precede valid from." : null}>
              <Input id="rvt" type="date" value={form.validTo} error={touched && !datesOk} onBlur={() => setTouched(true)} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
            </Field>
            <Field id="rn" label="Notes" className="sm:col-span-2"><Textarea id="rn" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Transit time, surcharge inclusions, contract reference…" /></Field>
          </div>
        </div>
      </Drawer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-steel-400/12 bg-white/95 p-3 backdrop-blur-xl lg:hidden">
        <Btn variant="primary" className="w-full" onClick={() => setOpen(true)} icon={<Plus className="h-3.5 w-3.5" />}>Add Rate</Btn>
      </div>
    </div>
  );
}
