import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, Info, Lock, Search, X } from "lucide-react";
import { StatusBadge, Tone } from "@/components/app/ui/primitives";
import {
  MODE_INFO, SERVICE_INFO, inr, lineSell, type Cargo, type ChargeComponent, type ChargeLine,
  type ModeChoice, type QuoteOption, type ServiceType, type TimelineEvent,
} from "@/data/commercial";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

/* ---------------- Page header ---------------- */
export function PageHead({ eyebrow, title, support, actions }: { eyebrow?: string; title: string; support?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="t-eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-[22px] font-light tracking-[-0.025em] text-frost-50 md:text-[27px]">{title}</h1>
        {support && <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-steel-400">{support}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Btn({ children, onClick, variant = "secondary", size = "md", disabled, icon, className, type = "button" }:
  { children?: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; disabled?: boolean; icon?: ReactNode; className?: string; type?: "button" | "submit" }) {
  const s = size === "sm" ? "h-8 px-2.5 text-[12.5px]" : "h-9 px-3.5 text-[13px]";
  const v = {
    primary: "bg-[linear-gradient(180deg,#2F86FF,#1C6FE8)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_1px_2px_rgba(19,85,196,0.25)] hover:shadow-[0_6px_16px_-8px_rgba(28,111,232,0.7)]",
    secondary: "bg-white text-frost-50 ring-1 ring-steel-400/22 hover:ring-steel-400/50",
    ghost: "text-cargo-300 hover:bg-cargo-400/10",
    danger: "bg-white text-risk ring-1 ring-risk/30 hover:ring-risk/60",
  }[variant];
  return (
    <motion.button type={type} whileTap={disabled ? undefined : { scale: 0.98 }} onClick={onClick} disabled={disabled}
      className={cn("inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-45 disabled:cursor-not-allowed", s, v, className)}>
      {icon}{children}
    </motion.button>
  );
}

/* ---------------- Stepper ---------------- */
export interface StepDef { id: string; label: string }
export function Stepper({ steps, current, onJump, className }: { steps: StepDef[]; current: number; onJump?: (i: number) => void; className?: string }) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-center gap-1.5 overflow-x-auto scroll-thin pb-1">
        {steps.map((s, i) => {
          const done = i < current, active = i === current;
          return (
            <li key={s.id} className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => (done && onJump ? onJump(i) : undefined)}
                disabled={!done}
                aria-current={active ? "step" : undefined}
                className={cn("group flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors",
                  active ? "bg-info/[0.09] ring-1 ring-cargo-400/30" : done ? "hover:bg-work-200" : "cursor-default")}>
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-medium ring-1 transition-colors",
                  done ? "bg-ok/12 text-ok ring-ok/35" : active ? "bg-info text-white ring-info" : "bg-work-200 text-steel-500 ring-steel-400/25")}>
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("whitespace-nowrap text-[12.5px]", active ? "font-medium text-frost-50" : done ? "text-steel-300" : "text-steel-500")}>{s.label}</span>
              </button>
              {i < steps.length - 1 && <span className="h-px w-3 shrink-0 bg-steel-400/25 md:w-5" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StepShell({ children, footer, sidebar }: { children: ReactNode; footer?: ReactNode; sidebar?: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px] md:gap-5">
      <div className="min-w-0">
        <div className="app-panel p-4 md:p-6">{children}</div>
        {footer && <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">{footer}</div>}
      </div>
      {sidebar && <aside className="lg:sticky lg:top-24 lg:self-start">{sidebar}</aside>}
    </div>
  );
}

export function StickyBar({ onBack, onNext, nextLabel, disabled, extra }: { onBack?: () => void; onNext?: () => void; nextLabel?: string; disabled?: boolean; extra?: ReactNode }) {
  return (
    <>
      {onBack && (
        <Btn onClick={onBack} icon={<ArrowLeft className="h-3.5 w-3.5" />}>Back</Btn>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {extra}
        {onNext && (
          <Btn variant="primary" onClick={onNext} disabled={disabled} icon={nextLabel ? undefined : <ArrowRight className="h-3.5 w-3.5" />}>
            {nextLabel ?? "Continue"} <ArrowRight className="h-3.5 w-3.5" />
          </Btn>
        )}
      </div>
    </>
  );
}

/* ---------------- Form fields ---------------- */
export function Field({ id, label, required, error, hint, children, className, aside }:
  { id: string; label: string; required?: boolean; error?: string | null; hint?: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={cn("text-[12.5px] font-medium", error ? "text-risk" : "text-steel-300")}>
          {label}{required && <span className="ml-0.5 text-cargo-400">*</span>}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-risk" role="alert"><AlertTriangle className="h-3 w-3" />{error}</p>
      ) : hint ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-snug text-steel-500"><Info className="mt-[1px] h-3 w-3 shrink-0" />{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase = "h-10 w-full rounded-lg border bg-white px-3 text-[13.5px] text-frost-50 outline-none transition placeholder:text-steel-500/90 disabled:bg-work-100 disabled:text-steel-400";

export function Input({ id, error, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; error?: boolean }) {
  return (
    <input id={id} aria-invalid={!!error} {...rest}
      className={cn(inputBase, error ? "border-risk/60 focus:border-risk focus:shadow-[0_0_0_4px_rgba(201,61,58,0.12)]" : "border-steel-400/25 hover:border-steel-400/45 focus:border-cargo-400 focus:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]", className)} />
  );
}

export function Textarea({ id, error, className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; error?: boolean }) {
  return (
    <textarea id={id} aria-invalid={!!error} rows={3} {...rest}
      className={cn("w-full rounded-lg border bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-frost-50 outline-none transition placeholder:text-steel-500/90",
        error ? "border-risk/60" : "border-steel-400/25 hover:border-steel-400/45 focus:border-cargo-400 focus:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]", className)} />
  );
}

export function Select({ id, options, error, className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { id: string; options: { v: string; l: string }[]; error?: boolean }) {
  return (
    <div className="relative">
      <select id={id} {...rest}
        className={cn(inputBase, "appearance-none pr-9", error ? "border-risk/60" : "border-steel-400/25 hover:border-steel-400/45 focus:border-cargo-400", className)}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
    </div>
  );
}

/** Combobox-style autocomplete used for customer + location picking */
export function Combo<T extends { label: string; sub?: string }>({
  id, placeholder, items, value, onChange, error, emptyText, footer,
}: { id: string; placeholder?: string; items: T[]; value: string; onChange: (v: T | null) => void; error?: boolean; emptyText?: string; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const filtered = items.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase()) || i.sub?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <div className={cn("relative flex h-10 items-center rounded-lg border bg-white transition",
        error ? "border-risk/60" : open ? "border-cargo-400 shadow-[0_0_0_4px_rgba(24,160,216,0.13)]" : "border-steel-400/25 hover:border-steel-400/45")}>
        <Search className="pointer-events-none ml-3 h-3.5 w-3.5 shrink-0 text-steel-500" />
        <input id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-list`} autoComplete="off"
          value={open ? q : value} placeholder={placeholder}
          onFocus={() => { setOpen(true); setQ(""); }}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => setQ("")}
          className="h-full w-full min-w-0 bg-transparent px-2.5 text-[13.5px] text-frost-50 outline-none placeholder:text-steel-500/90" />
        {value && !open && (
          <button type="button" onClick={() => onChange(null)} aria-label="Clear selection"
            className="mr-2 grid h-6 w-6 shrink-0 place-items-center rounded text-steel-500 hover:bg-work-200 hover:text-frost-50"><X className="h-3.5 w-3.5" /></button>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul id={`${id}-list`} role="listbox" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="app-panel absolute z-50 mt-1.5 max-h-[268px] w-full origin-top overflow-y-auto p-1.5 scroll-thin">
            {filtered.length === 0 && <li className="px-2.5 py-3 text-center text-[12.5px] text-steel-500">{emptyText ?? "No matches"}</li>}
            {filtered.map((i) => (
              <li key={i.label}>
                <button type="button" role="option" aria-selected={i.label === value}
                  onClick={() => { onChange(i); setOpen(false); setQ(""); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-work-200">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-frost-50">{i.label}</span>
                    {i.sub && <span className="block truncate text-[11.5px] text-steel-500">{i.sub}</span>}
                  </span>
                  {i.label === value && <Check className="h-3.5 w-3.5 shrink-0 text-cargo-300" />}
                </button>
              </li>
            ))}
            {footer && <li className="mt-1 border-t border-steel-400/12 pt-1.5">{footer}</li>}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Toggle + choice ---------------- */
export function YesNo({ name, value, onChange, error }: { name: string; value: string; onChange: (v: "Yes" | "No") => void; error?: boolean }) {
  return (
    <div className={cn("inline-flex rounded-lg p-0.5 ring-1", error ? "ring-risk/50" : "ring-steel-400/22")} role="radiogroup" aria-label={name}>
      {(["No", "Yes"] as const).map((v) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn("rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium transition",
            value === v ? (v === "Yes" ? "bg-warn/12 text-warn ring-1 ring-warn/30" : "bg-white text-frost-50 shadow-[0_1px_2px_rgba(16,44,73,0.06)] ring-1 ring-steel-400/20") : "text-steel-400 hover:text-frost-50")}>
          {v}
        </button>
      ))}
    </div>
  );
}

export function CheckRow({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 ring-1 transition select-none",
      checked ? "bg-cargo-400/[0.07] ring-cargo-400/35" : "bg-white ring-steel-400/15 hover:ring-steel-400/35")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={cn("mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border bg-white transition",
        checked ? "border-signal-500 bg-signal-500" : "border-steel-400/40 peer-focus-visible:ring-2 peer-focus-visible:ring-signal-600")}>
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] text-frost-50">{label}</span>
        {hint && <span className="mt-0.5 block text-[11.5px] leading-snug text-steel-500">{hint}</span>}
      </span>
    </label>
  );
}

/* ---------------- Choice cards (mode / service) ---------------- */
export function ChoiceCard({ active, onClick, label, hint, badge, icon }: { active: boolean; onClick: () => void; label: string; hint?: string; badge?: ReactNode; icon?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn("group relative flex w-full flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all duration-300",
        active ? "border-cargo-400/60 bg-[linear-gradient(180deg,#FFFFFF,#F2F8FC)] shadow-[0_1px_2px_rgba(16,44,73,0.04),0_12px_28px_-22px_rgba(24,160,216,0.8)]"
               : "border-steel-400/15 bg-white hover:border-steel-400/35")}>
      {active && <motion.span layoutId={undefined} className="absolute inset-x-3 top-0 h-px bg-[linear-gradient(90deg,#18A0D8,transparent)]" />}
      <span className="flex w-full items-start justify-between gap-2">
        <span className="text-[13.5px] font-medium text-frost-50">{label}</span>
        {badge}
      </span>
      {hint && <span className="text-[11.5px] leading-snug text-steel-500">{hint}</span>}
      {icon}
    </button>
  );
}

/* ---------------- Summaries ---------------- */
export function Row({ k, v, mono, tone }: { k: string; v: ReactNode; mono?: boolean; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-[12.5px] text-steel-400">{k}</dt>
      <dd className={cn("min-w-0 truncate text-right text-[12.5px]", mono && "font-mono text-[11.5px]", tone ?? "text-frost-100")}>{v}</dd>
    </div>
  );
}

export function SummaryCard({ title, children, action, tone = "default" }: { title: string; children: ReactNode; action?: ReactNode; tone?: "default" | "accent" | "muted" }) {
  return (
    <div className={cn("rounded-xl p-3.5", tone === "accent" ? "bg-cargo-400/[0.06] ring-1 ring-cargo-400/22" : tone === "muted" ? "bg-work-100 ring-1 ring-steel-400/10" : "bg-white ring-1 ring-steel-400/12")}>
      {action ? <div className="mb-2 flex items-center justify-between gap-2"><p className="t-meta !text-[9.5px]">{title}</p>{action}</div> : <p className="t-meta mb-2 !text-[9.5px]">{title}</p>}
      {children}
    </div>
  );
}

export function RouteSummary({ origin, originCode, destination, destCode, service, mode, dates }: {
  origin: string; originCode?: string; destination: string; destCode?: string; service?: ServiceType | string; mode?: ModeChoice | string; dates?: [string, string];
}) {
  return (
    <div className="rounded-xl bg-white p-3.5 ring-1 ring-steel-400/12">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] text-frost-50">{origin}</div>
          {originCode && <div className="font-mono text-[10.5px] tracking-[0.1em] text-steel-500">{originCode}</div>}
        </div>
        <div className="flex shrink-0 flex-1 flex-col items-center px-1">
          <svg viewBox="0 0 120 12" className="h-3 w-full max-w-[150px]" aria-hidden>
            <path d="M0 6 H108" stroke="rgba(99,120,142,0.3)" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M104 2 L111 6 L104 10" fill="none" stroke="#1C6FE8" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="0" cy="6" r="2.4" fill="#fff" stroke="#1C6FE8" strokeWidth="1.2" />
          </svg>
          {(mode || service) && (
            <div className="mt-1 flex items-center gap-1.5">
              {mode && <span className="rounded bg-work-200 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-steel-400">{mode}</span>}
              {service && <span className="rounded bg-cargo-400/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-cargo-300">{service}</span>}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-right">
          <div className="truncate text-[13.5px] text-frost-50">{destination}</div>
          {destCode && <div className="font-mono text-[10.5px] tracking-[0.1em] text-steel-500">{destCode}</div>}
        </div>
      </div>
      {dates && (
        <div className="mt-3 flex items-center justify-between border-t border-steel-400/12 pt-2.5 text-[11.5px] text-steel-500">
          <span>Pickup {dates[0]}</span><span>Delivery {dates[1]}</span>
        </div>
      )}
    </div>
  );
}

export function CargoSummary({ cargo }: { cargo: Cargo }) {
  const rows: [string, string][] = [
    ["Commodity", cargo.commodity],
    ["Packages", `${cargo.packages} × ${cargo.packageType}`],
    ["Gross weight", `${cargo.weight} ${cargo.weightUnit}`],
    ["Volume", `${cargo.volume} ${cargo.volumeUnit}`],
    ["Dimensions", cargo.dims],
    ["Cargo value", `${cargo.currency} ${cargo.value}`],
  ];
  return (
    <div className="space-y-2.5">
      <dl>{rows.filter(([, v]) => v).map(([k, v]) => <Row key={k} k={k} v={v} />)}</dl>
      <div className="flex flex-wrap gap-1.5">
        {cargo.containerType && <StatusBadge tone="cyan" dot={false}>{cargo.containerType}</StatusBadge>}
        {cargo.hazardous === "Yes" && <StatusBadge tone="risk">Hazardous · {cargo.haz?.un ?? "UN"} {cargo.haz?.hazardClass ?? ""}</StatusBadge>}
        {cargo.tempControlled === "Yes" && <StatusBadge tone="warn">Temp {cargo.temp?.min}–{cargo.temp?.max} {cargo.temp?.unit}</StatusBadge>}
      </div>
    </div>
  );
}

export function ModeServiceLabels({ mode, service, detail }: { mode: ModeChoice; service: ServiceType; detail?: Record<string, string> }) {
  const m = MODE_INFO.find((x) => x.id === mode);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="flex items-center gap-2">
        <span className="t-meta !text-[9.5px]">Mode</span>
        <span className="text-[13px] text-frost-50">{m?.label ?? mode}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="t-meta !text-[9.5px]">Service</span>
        <span className="text-[13px] text-frost-50">{service} · {SERVICE_INFO[service].label}</span>
      </span>
      {detail && Object.entries(detail).filter(([, v]) => v).map(([k, v]) => (
        <span key={k} className="flex items-center gap-2">
          <span className="t-meta !text-[9.5px]">{k}</span>
          <span className="text-[13px] text-frost-50">{v}</span>
        </span>
      ))}
    </div>
  );
}

/* ---------------- Timeline ---------------- */
const TONE_DOT: Record<string, string> = { ok: "bg-ok", warn: "bg-warn", risk: "bg-risk", info: "bg-info", cyan: "bg-cargo-400", neutral: "bg-steel-500" };

export function ActivityTimeline({ events, empty }: { events: TimelineEvent[]; empty?: string }) {
  if (events.length === 0) return <p className="py-6 text-center text-[12.5px] text-steel-500">{empty ?? "No activity recorded yet."}</p>;
  return (
    <ol className="relative ml-1.5 space-y-4 border-l border-steel-400/18 pl-5">
      {events.map((e, i) => (
        <motion.li key={`${e.at}-${e.label}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: EASE, delay: i * 0.04 }} className="relative">
          <span className={cn("absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-[3px] ring-white", TONE_DOT[e.tone ?? "info"])} />
          <div className="font-mono text-[10.5px] tracking-[0.08em] text-steel-500">{e.at}{e.by && ` · ${e.by}`}</div>
          <div className="mt-0.5 text-[13px] text-frost-100">{e.label}</div>
          {e.ref && <div className="mt-0.5 font-mono text-[11px] text-cargo-300">{e.ref}</div>}
        </motion.li>
      ))}
    </ol>
  );
}

/* ---------------- Charge table ---------------- */
export function ChargeTable({ charges, editable, onChange }: {
  charges: ChargeLine[];
  editable?: boolean;
  onChange?: (next: ChargeLine[]) => void;
}) {
  const upd = (i: number, patch: Partial<ChargeLine>) => {
    if (!onChange) return;
    const next = charges.map((c, k) => (k === i ? { ...c, ...patch } : c));
    onChange(next);
  };
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[620px] text-left text-[12.5px]">
        <caption className="sr-only">Charge components</caption>
        <thead>
          <tr className="border-b border-steel-400/12 [&>th]:pb-2 [&>th]:font-mono [&>th]:text-[9px] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.12em] [&>th]:text-steel-500">
            <th>Component</th><th>Vendor</th><th className="text-right">Cost</th>
            <th>Margin type</th><th className="text-right">Margin</th><th className="text-right">Selling price</th>
            {editable && <th />}
          </tr>
        </thead>
        <tbody>
          {charges.map((c, i) => (
            <tr key={c.key} className="border-b border-steel-400/[0.07] last:border-0 [&>td]:py-2">
              <td className="whitespace-nowrap text-frost-50">{c.component}</td>
              <td className="max-w-[150px] truncate text-steel-400">{c.vendor}</td>
              <td className="t-num whitespace-nowrap text-right text-steel-300">{inr(c.cost)}</td>
              <td>
                {editable ? (
                  <select value={c.marginType} onChange={(e) => upd(i, { marginType: e.target.value as "Percent" | "Fixed" })}
                    aria-label={`Margin type for ${c.component}`} className="rounded-md border border-steel-400/25 bg-white px-1.5 py-1 text-[12px] text-frost-50 outline-none focus:border-cargo-400">
                    <option value="Percent">%</option><option value="Fixed">₹</option>
                  </select>
                ) : <span className="text-steel-400">{c.marginType === "Percent" ? "%" : "₹"}</span>}
              </td>
              <td className="text-right">
                {editable ? (
                  <input type="number" value={c.margin} min={0} step={c.marginType === "Percent" ? 0.5 : 100}
                    onChange={(e) => upd(i, { margin: Number(e.target.value) })}
                    aria-label={`Margin for ${c.component}`}
                    className="t-num w-[68px] rounded-md border border-steel-400/25 bg-white px-1.5 py-1 text-right text-[12px] text-frost-50 outline-none focus:border-cargo-400" />
                ) : <span className="t-num text-steel-300">{c.marginType === "Percent" ? `${c.margin}%` : inr(c.margin)}</span>}
              </td>
              <td className="t-num whitespace-nowrap text-right font-medium text-frost-50">{inr(lineSell(c))}</td>
              {editable && (
                <td className="pl-2 text-right">
                  <button onClick={() => onChange?.(charges.filter((_, k) => k !== i))} aria-label={`Remove ${c.component}`}
                    className="grid h-6 w-6 place-items-center rounded-md text-steel-500 transition hover:bg-work-200 hover:text-risk"><X className="h-3.5 w-3.5" /></button>
                </td>
              )}
            </tr>
          ))}
          {charges.length === 0 && <tr><td colSpan={editable ? 7 : 6} className="py-8 text-center text-[12.5px] text-steel-500">No charge components yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Option card ---------------- */
export function OptionCard({ option, index, active, selected, onSelect, compact, showInternal }: {
  option: QuoteOption; index: number; active?: boolean; selected?: boolean;
  onSelect?: () => void; compact?: boolean; showInternal?: boolean;
}) {
  const sell = option.charges.reduce((a, c) => a + (c.marginType === "Percent" ? c.cost * (1 + c.margin / 100) : c.cost + c.margin), 0);
  const cost = option.charges.reduce((a, c) => a + c.cost, 0);
  const margin = sell ? ((sell - cost) / sell) * 100 : 0;
  const includes = [...new Set(option.charges.map((c) => c.component))].slice(0, compact ? 4 : 8);
  return (
    <motion.div layout onClick={onSelect}
      className={cn("relative flex flex-col rounded-2xl border p-4 transition-all duration-300",
        selected ? "border-cargo-400/60 bg-[linear-gradient(180deg,#FFFFFF,#F2F8FC)] shadow-[0_1px_2px_rgba(16,44,73,0.04),0_16px_36px_-24px_rgba(24,160,216,0.8)]"
                 : "border-steel-400/15 bg-white hover:border-steel-400/35",
        onSelect && "cursor-pointer")}>
      {selected && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-cargo-400/12 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-cargo-300 ring-1 ring-cargo-400/35">Selected</span>}
      <p className="t-meta">Option {String.fromCharCode(65 + index)}</p>
      <h3 className="mt-1 text-[16px] font-light tracking-[-0.015em] text-frost-50">{option.name}</h3>
      {option.summary && <p className="mt-1 text-[12px] leading-snug text-steel-500">{option.summary}</p>}
      <div className="mt-3.5 flex items-baseline gap-2">
        <span className="t-num text-[24px] font-light leading-none text-frost-50">{inr(sell)}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className="flex items-center gap-1.5 text-steel-300"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>{option.transit}</span>
        {showInternal && <><span className="text-steel-500">Cost {inr(cost)}</span><span className={cn("font-medium", margin < 14 ? "text-warn" : "text-ok")}>Margin {margin.toFixed(1)}%</span></>}
      </div>
      <div className="mt-3.5 border-t border-steel-400/12 pt-3">
        <p className="t-meta !text-[9px]">Includes</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {includes.map((i) => <li key={i} className="rounded bg-work-100 px-1.5 py-0.5 text-[11px] text-steel-400">{i}</li>)}
        </ul>
      </div>
      {active && <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-ok/10 px-2 py-0.5 text-[11px] font-medium text-ok ring-1 ring-ok/25"><Lock className="h-3 w-3" />Accepted</p>}
    </motion.div>
  );
}

/* ---------------- Misc ---------------- */
export function LockedBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-ok/[0.06] px-3.5 py-2.5 ring-1 ring-ok/25">
      <Lock className="h-4 w-4 shrink-0 text-ok" />
      <p className="text-[12.5px] text-frost-100">Accepted — Locked. This version can no longer be edited.</p>
    </div>
  );
}

export function WarnBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-warn/[0.07] px-3.5 py-2.5 ring-1 ring-warn/25">
      <AlertTriangle className="mt-[1px] h-4 w-4 shrink-0 text-warn" />
      <p className="text-[12.5px] leading-relaxed text-frost-100">{children}</p>
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel-400">{children}</h3>
      {aside}
    </div>
  );
}

export function SuccessScreen({ badge, title, body, rows, actions }: { badge: string; title: string; body: string; rows: [string, string][]; actions: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }}
      className="app-panel mx-auto max-w-xl p-6 text-center md:p-8">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/10 ring-1 ring-ok/30 shadow-[0_0_36px_-12px_rgba(11,122,85,0.6)]">
        <Check className="h-6 w-6 text-ok" strokeWidth={2.2} />
      </span>
      <p className="t-eyebrow mt-5">{badge}</p>
      <h2 className="mt-2 text-[24px] font-light tracking-[-0.025em] text-frost-50">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-steel-400">{body}</p>
      <dl className="mx-auto mt-6 max-w-sm divide-y divide-steel-400/12 rounded-xl bg-work-100 p-3.5 text-left">
        {rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}
      </dl>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">{actions}</div>
    </motion.div>
  );
}

export const toneClass = (t: keyof typeof Tone) => Tone[t];

export const COMPONENT_LABELS: ChargeComponent[] = ["Freight", "Origin", "Transport", "Customs", "Documentation", "Handling", "Port", "Warehouse", "Destination", "Insurance", "Taxes", "Other"];
