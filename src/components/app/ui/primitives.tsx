import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Inbox, RefreshCw, X, type LucideIcon } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/utils/cn";
import { EASE } from "@/lib/motion";

export const ICONS = {
  ship: (c: string) => <path className={c} d="M3 17c1.5 1.2 2.6 1.8 4 1.8S9.5 18.2 11 17s2.6-1.8 4-1.8 2.5.6 4 1.8M4 13l1.2-4.4A2 2 0 0 1 7.1 7h9.8a2 2 0 0 1 1.9 1.6L20 13M12 7V4M8 11h8" />,
  truck: () => <><path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11h2" /><path d="M14 9h4l3 3.5V17h-2" /><circle cx="7.5" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></>,
  plane: () => <path d="M10.5 20.5 12 15l8-2.5a1.2 1.2 0 0 0 0-2.3L4.5 4.5 6 10l6 1.5" />,
  train: () => <><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 10h14M9 20l1.5-4M15 20l-1.5-4M8 20h8" /></>,
  anchor: () => <><circle cx="12" cy="5" r="2.2" /><path d="M12 7.2V20M5 12H2a10 10 0 0 0 20 0h-3" /></>,
  box: () => <><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  file: () => <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  clock: () => <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  shield: () => <path d="M12 3 5 6v6c0 4.4 3 8 7 9 4-1 7-4.6 7-9V6Z" />,
  trend: () => <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  wallet: () => <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14.5h2" /></>,
  alert: () => <><path d="M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16.5h.01" /></>,
  check: () => <path d="M4 12.5 9 17.5 20 6.5" />,
  spark: () => <><path d="M12 3v3M12 18v3M4.2 7.2l2.1 2.1M17.7 14.7l2.1 2.1M3 12h3M18 12h3M4.2 16.8l2.1-2.1M17.7 9.3l2.1-2.1" /><circle cx="12" cy="12" r="3" /></>,
};

export const Tone = {
  ok: "text-ok bg-ok/10 ring-ok/25",
  warn: "text-warn bg-warn/10 ring-warn/25",
  risk: "text-risk bg-risk/[0.08] ring-risk/30",
  info: "text-info bg-info/[0.09] ring-info/25",
  cyan: "text-cargo-300 bg-cargo-400/10 ring-cargo-400/30",
  neutral: "text-steel-400 bg-steel-400/10 ring-steel-400/25",
} as const;
export type ToneKey = keyof typeof Tone;

export function StatusBadge({ children, tone = "neutral", dot = true, className }: { children: ReactNode; tone?: ToneKey; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-medium ring-1", Tone[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export function Panel({
  title, subtitle, action, children, className, bodyClass, delay = 0,
}: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={cn("app-panel flex flex-col", className)}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-steel-400/12 px-4 py-3.5 md:px-5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-[14px] font-medium tracking-[-0.01em] text-frost-50">{title}</h2>}
            {subtitle && <p className="mt-0.5 truncate text-[12.5px] text-steel-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("flex-1 p-4 md:p-5", bodyClass)}>{children}</div>
    </motion.section>
  );
}

/* ---------------- Sparkline ---------------- */
export function Sparkline({ values, color = "#1C6FE8", className }: { values: number[]; color?: string; className?: string }) {
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 26 - ((v - min) / span) * 22]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const id = useId().replace(/[^a-z0-9]/gi, "");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L100 28 L0 28 Z`} fill={`url(#sp-${id})`} />
      <motion.path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE }} />
    </svg>
  );
}

/* ---------------- KPI card ---------------- */
export interface KpiProps {
  label: string; value: number; suffix?: string;
  secondary?: string; icon: LucideIcon; tone?: ToneKey; spark?: number[];
  onClick?: () => void; decimals?: number; delay?: number;
}
const TONE_HEX: Record<ToneKey, string> = { ok: "#0B7A55", warn: "#A86E0F", risk: "#C93D3A", info: "#1C6FE8", cyan: "#18A0D8", neutral: "#5A6F85" };

export function KpiCard({ label, value, suffix, secondary, icon: Icon, tone = "neutral", spark, onClick, decimals = 0, delay = 0 }: KpiProps) {
  const hex = TONE_HEX[tone];
  const interactive = !!onClick;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      whileHover={interactive ? { y: -2 } : undefined}
      className={cn(
        "kpi-card group flex w-full flex-col rounded-2xl p-4 text-left transition-shadow duration-300 md:p-4.5",
        interactive ? "cursor-pointer hover:shadow-[0_1px_2px_rgba(16,44,73,0.05),0_16px_32px_-24px_rgba(16,44,73,0.45)]" : "cursor-default"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="t-meta !text-[9.5px] !leading-tight">{label}</span>
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1", Tone[tone])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-2.5 flex items-baseline gap-1">
        <span className="t-num text-[26px] font-light leading-none text-frost-50 md:text-[30px]">
          <CountUp to={value} duration={1.1} format={(n) => decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-IN")} />
        </span>
        {suffix && <span className="text-[15px] font-light text-steel-400">{suffix}</span>}
      </div>
      {spark && <Sparkline values={spark} color={hex} className="mt-2.5 opacity-80" />}
      {secondary && <div className={cn("mt-2 text-[11.5px] leading-snug", tone === "risk" ? "text-risk" : tone === "warn" ? "text-warn" : "text-steel-500")}>{secondary}</div>}
    </motion.button>
  );
}

/* ---------------- Bar breakdown ---------------- */
export function BarBreakdown({ data, className }: { data: { k: string; n: number; color: string }[]; className?: string }) {
  const total = data.reduce((a, d) => a + d.n, 0) || 1;
  return (
    <div className={className}>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-steel-400/12">
        {data.map((d) => (
          <motion.span key={d.k} title={`${d.k}: ${d.n}`}
            initial={{ width: 0 }} whileInView={{ width: `${(d.n / total) * 100}%` }}
            viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE }}
            style={{ background: d.color }} className="h-full border-r border-white/70 last:border-0" />
        ))}
      </div>
      <ul className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {data.map((d) => (
          <li key={d.k} className="flex items-center gap-2 text-[12px]">
            <span className="h-2 w-2 shrink-0 rounded-sm ring-1 ring-steel-400/20" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate text-steel-400">{d.k}</span>
            <span className="t-num text-frost-100">{d.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- States ---------------- */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("skeleton", className)} style={style} aria-hidden />;
}
export function KpiSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="kpi-card rounded-2xl p-4">
          <div className="flex justify-between"><Skeleton className="h-2.5 w-16" /><Skeleton className="h-7 w-7 rounded-lg" /></div>
          <Skeleton className="mt-3 h-7 w-20" /><Skeleton className="mt-3 h-2 w-full" /><Skeleton className="mt-2 h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
}
export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-4 border-b border-steel-400/12 pb-2.5">
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-2.5" style={{ width: i === 0 ? 120 : undefined }} />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-1.5">
          {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className="h-3" style={{ width: `${[16, 14, 18, 10, 12, 10][c % 6]}%` }} />)}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action, icon: Icon = Inbox }: { title: string; body: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-work-200 ring-1 ring-steel-400/20">
        <Icon className="h-5 w-5 text-steel-400" strokeWidth={1.6} />
      </span>
      <h3 className="mt-4 text-[14.5px] font-medium text-frost-50">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-steel-400">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-risk/[0.08] ring-1 ring-risk/25">
        <AlertTriangle className="h-5 w-5 text-risk" strokeWidth={1.7} />
      </span>
      <h3 className="mt-4 text-[14.5px] font-medium text-frost-50">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-steel-400">{body}</p>
      <button onClick={onRetry} className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-frost-50 shadow-[inset_0_0_0_1px_rgba(99,120,142,0.25)] transition hover:shadow-[inset_0_0_0_1px_rgba(99,120,142,0.5)]">
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

export function PositiveState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl bg-ok/[0.05] p-4 ring-1 ring-ok/20">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ok/10 ring-1 ring-ok/25"><svg viewBox="0 0 24 24" className="h-4 w-4 text-ok" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 12.5 9 17.5 20 6.5" /></svg></span>
      <div><div className="text-[13.5px] font-medium text-frost-50">{title}</div><div className="mt-0.5 text-[12.5px] text-steel-400">{body}</div></div>
    </div>
  );
}

/* ---------------- Drawer ---------------- */
export function Drawer({ open, onClose, title, subtitle, children, footer, width = "sm:max-w-[440px]" }:
  { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; width?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const labelId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const f = ref.current?.querySelector<HTMLElement>("[data-autofocus],button,[href],input");
      f?.focus({ preventScroll: true });
    }, 60);
    return () => { document.body.style.overflow = prev; window.clearTimeout(t); };
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={labelId}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={onClose} className="absolute inset-0 bg-shell-950/25 backdrop-blur-[2px]" />
          <motion.div
            ref={ref}
            role="document"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: EASE }}
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              const items = ref.current?.querySelectorAll<HTMLElement>("button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])");
              if (!items?.length) return;
              const first = items[0], last = items[items.length - 1];
              if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
              else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }}
            className={cn("absolute inset-y-0 right-0 flex w-full flex-col bg-work-50 shadow-[-24px_0_60px_-30px_rgba(4,12,20,0.5)]", width)}
          >
            <header className="flex items-start justify-between gap-3 border-b border-steel-400/12 bg-white px-5 py-4">
              <div className="min-w-0">
                <h2 id={labelId} className="truncate text-[15px] font-medium tracking-[-0.01em] text-frost-50">{title}</h2>
                {subtitle && <p className="mt-0.5 truncate text-[12.5px] text-steel-400">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close panel" data-autofocus
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-steel-400 transition hover:bg-work-200 hover:text-frost-50">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="scroll-thin flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <footer className="border-t border-steel-400/12 bg-white px-5 py-3.5">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Progress bar ---------------- */
export function Progress({ value, tone = "cyan", className }: { value: number; tone?: ToneKey; className?: string }) {
  const bg = tone === "risk" ? "bg-risk" : tone === "warn" ? "bg-warn" : tone === "ok" ? "bg-ok" : "bg-[linear-gradient(90deg,#1C6FE8,#18A0D8)]";
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-steel-400/15", className)}>
      <motion.div className={cn("h-full rounded-full", bg)} initial={{ width: 0 }} whileInView={{ width: `${value}%` }}
        viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE }} />
    </div>
  );
}

export function useDidUpdate(fn: () => void, deps: unknown[]) {
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } fn(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
