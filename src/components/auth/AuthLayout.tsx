import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { AuthVisualPanel } from "./AuthVisualPanel";
import { useIsDesktop } from "@/lib/motion";

/** Compact animated route strip for mobile / tablet */
function RouteStrip() {
  const reduce = useReducedMotion();
  const stops = ["Mumbai", "Singapore", "Houston"];
  return (
    <div className="relative mt-6 rounded-2xl border border-steel-400/10 bg-ink-900/60 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] tracking-[0.06em] text-frost-100">SPG-SHP-001284</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] text-cargo-300"><span className="h-1.5 w-1.5 animate-blink rounded-full bg-cargo-300" />IN TRANSIT · ETA 18 OCT</span>
      </div>
      <div className="relative mt-4 h-px bg-steel-400/25">
        <motion.div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#1C6FE8,#18A0D8)]" initial={{ width: "0%" }} animate={{ width: "62%" }} transition={{ duration: reduce ? 0 : 2.4, ease: [0.22, 1, 0.36, 1] }} />
        {!reduce && (
          <motion.span className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-white shadow-[0_0_0_1.5px_#1C6FE8]" initial={{ left: "0%" }} animate={{ left: ["0%", "62%"] }} transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }} />
        )}
        {stops.map((s, i) => (
          <span key={s} className="absolute -top-[4px] h-[9px] w-[9px] -translate-x-1/2 rounded-full border border-cargo-300 bg-ink-900" style={{ left: `${i * 50}%` }} />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-steel-400">
        {stops.map((s) => <span key={s}>{s}</span>)}
      </div>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();
  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-ink-950">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(28,111,232,0.1),transparent_42%),linear-gradient(180deg,#FFFFFF_0%,#F6F8FB_100%)]" />
      <div aria-hidden className="grid-lines absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top_right,#000,transparent_70%)]" />

          <div className="relative grid min-h-[100svh] lg:grid-cols-[58fr_42fr]">
        {isDesktop && (
          <div className="h-[100svh] p-4 lg:sticky lg:top-0">
            <AuthVisualPanel />
          </div>
        )}

        <main className="flex flex-col px-5 pb-10 pt-5 sm:px-8 lg:px-12 lg:py-10 xl:px-20">
          {!isDesktop && (
            <div className="mx-auto w-full max-w-[400px]">
              <div className="flex items-center justify-between">
                <Logo compact />
                <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] text-steel-300 ring-1 ring-steel-400/15 transition-colors hover:text-frost-50">
                  <ArrowLeft className="h-3.5 w-3.5" /> Site
                </Link>
              </div>
              <RouteStrip />
            </div>
          )}
          <div className="flex flex-1 items-center justify-center py-10 lg:py-0">{children}</div>
          <footer className="mx-auto flex w-full max-w-[400px] items-center justify-between text-[11.5px] text-steel-500">
            <span>© {new Date().getFullYear()} SPG Logistics</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Secure connection</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
