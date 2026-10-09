import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Ship } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { RouteNetwork } from "@/components/network/RouteNetwork";
import { LOGIN_ROUTE } from "@/lib/geo";
import { EASE } from "@/lib/motion";

const IMG = "https://images.pexels.com/photos/21728446/pexels-photo-21728446.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1400";
const VB = { x: 250, y: 120, w: 600, h: 230 };

export function AuthVisualPanel() {
  const [seg, setSeg] = useState(0);
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-steel-400/18 bg-[linear-gradient(180deg,#FFFFFF_0%,#F1F5FA_55%,#E9F0F8_100%)] shadow-[0_1px_2px_rgba(16,44,73,0.04),0_30px_60px_-40px_rgba(16,44,73,0.35)]">
      <img src={IMG} alt="" className="img-graded absolute inset-0 h-full w-full object-cover opacity-25" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(28,111,232,0.16),transparent_48%)]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0.15)_45%,rgba(255,255,255,0.85)_100%)]" />
      <div aria-hidden className="grid-lines absolute inset-0 opacity-80" />

      <div className="relative flex items-center justify-between p-8 xl:p-10">
        <Logo />
        <Link to="/" className="group inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[13px] text-steel-300 shadow-[inset_0_0_0_1px_rgba(99,120,142,0.22)] transition-colors hover:text-frost-50 hover:shadow-[inset_0_0_0_1px_rgba(99,120,142,0.4)]">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to site
        </Link>
      </div>

      <div className="relative flex flex-1 items-center px-4 xl:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: EASE }} className="relative w-full [mask-image:radial-gradient(ellipse_75%_80%_at_50%_50%,#000_55%,transparent_100%)]">
          <RouteNetwork route={LOGIN_ROUTE} viewBox={VB} lanes="lite" duration={30} hold={3} onSegment={(s) => setSeg(s)} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
          className="surface-glass edge-light absolute bottom-0 left-[44%] w-[240px] rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.06em] text-frost-100">SPG-SHP-001284</span>
            <Ship className="h-3.5 w-3.5 text-cargo-300" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-cargo-300">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-cargo-400" /> IN TRANSIT
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-steel-400">ETA 18 OCT</span>
          </div>
          <div className="mt-3 text-[12px] text-steel-400">{seg === 0 ? "Mumbai → Singapore" : "Singapore → Houston"}</div>
        </motion.div>
      </div>

      <div className="relative p-8 xl:p-10">
        <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.3 }} className="text-[clamp(2rem,3.2vw,3rem)] font-light leading-[1.05] tracking-[-0.035em] text-frost-50">
          Every shipment.<br />Every movement.<br /><span className="text-steel-400">One operating system.</span>
        </motion.h2>
        <div className="mt-8 flex gap-8 border-t border-steel-400/18 pt-5">
          {[["128", "Active shipments"], ["4", "Transport modes"], ["94%", "On-time"]].map(([v, k]) => (
            <div key={k}>
              <div className="t-num text-xl font-light text-frost-50">{v}</div>
              <div className="t-meta mt-1 !text-[9.5px]">{k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
