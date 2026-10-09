import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CONTINENT_PATHS, project, smoothPath, type LonLat } from "@/lib/geo";
import type { Shipment } from "@/data/mockData";
import { useOnScreen } from "@/lib/motion";

const VB = { x: 40, y: 60, w: 900, h: 300 };

const TONE: Record<string, string> = {
  "In Transit": "#18A0D8", Transshipment: "#1C6FE8", Destination: "#1C6FE8",
  Exception: "#C93D3A", Customs: "#C07E14", Delivery: "#0B7A55",
  Completed: "#A6B5C6", Pickup: "#18A0D8", Documentation: "#8496A9",
  Confirmed: "#8496A9", "Gate-in": "#18A0D8",
};

function usePaths(shipments: Shipment[]) {
  return useMemo(() => shipments.map((s) => ({
    s,
    d: smoothPath(s.route),
    pts: s.route.map((p) => project(p as LonLat)),
    color: TONE[s.status] ?? "#8496A9",
  })), [shipments]);
}

export default function ShipmentMap({ shipments, onHover, onOpen, hovered }:
  { shipments: Shipment[]; onHover: (s: Shipment | null) => void; onOpen: (s: Shipment) => void; hovered: string | null }) {
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(wrapRef);
  const paths = usePaths(shipments);
  useMemo(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const animate = visible;

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-xl bg-[linear-gradient(180deg,#F7F9FB_0%,#EEF2F6_100%)] ring-1 ring-steel-400/12" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      <div aria-hidden className="grid-lines absolute inset-0 opacity-70" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_40%,rgba(28,111,232,0.07),transparent_70%)]" />
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full" role="img"
        aria-label={`Network map showing ${shipments.length} shipment routes`}>
        <g>
          {CONTINENT_PATHS.map((d, i) => (
            <path key={i} d={d} fill="rgba(16,44,73,0.04)" stroke="rgba(16,44,73,0.11)" strokeWidth="0.6" />
          ))}
        </g>
        <g fill="none">
          {paths.map(({ s, d, color }) => (
            <motion.path
              key={s.id}
              d={d}
              stroke={color}
              strokeWidth={hovered === s.id ? 2 : 1}
              strokeOpacity={hovered && hovered !== s.id ? 0.22 : 0.55}
              strokeLinecap="round"
              fill="none"
              initial={animate ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              style={{ transition: "stroke-width .25s, stroke-opacity .25s" }}
            />
          ))}
        </g>
        {/* moving markers on the flagship-style in-transit legs */}
        {!window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
          paths.filter((p) => p.s.status === "In Transit").map(({ s, d }, i) => (
            <circle key={`m-${s.id}`} r="2" fill="#18A0D8">
              <animateMotion dur={`${14 + (i % 4) * 4}s`} repeatCount="indefinite" begin={`${-i * 2.4}s`} path={d} />
            </circle>
          ))}
        {paths.map(({ s, pts, color }) =>
          pts.map(([x, y], j) => (
            <g key={`${s.id}-${j}`} style={{ pointerEvents: "none" }}>
              <circle cx={x} cy={y} r={hovered === s.id ? 3.4 : 2.6} fill="#FFFFFF" stroke={color} strokeWidth="1"
                style={{ transition: "r .2s" }} />
              <circle cx={x} cy={y} r="1.1" fill={color} />
            </g>
          ))
        )}
      </svg>

      {/* hover targets */}
      <div className="absolute inset-0">
        {paths.map(({ s, pts }) => {
          const mid = pts[Math.floor(pts.length / 2)];
          const left = `${((mid[0] - VB.x) / VB.w) * 100}%`;
          const top = `${((mid[1] - VB.y) / VB.h) * 100}%`;
          return (
            <button
              key={s.id}
              onMouseEnter={() => onHover(s)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(s)}
              onBlur={() => onHover(null)}
              onClick={() => onOpen(s)}
              aria-label={`${s.id}: ${s.origin} to ${s.destination}, ${s.status}`}
              className="absolute z-10 h-10 w-24 -translate-x-1/2 -translate-y-1/2 rounded-lg outline-none"
              style={{ left, top }}
            />
          );
        })}
      </div>

      {/* legend */}
      <div className="pointer-events-none absolute bottom-2.5 left-3 flex flex-wrap gap-x-3.5 gap-y-1.5">
        {[["In transit", "#18A0D8"], ["At risk", "#C07E14"], ["Exception", "#C93D3A"], ["Arrived / closed", "#A6B5C6"]].map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-steel-400">
            <i className="h-[3px] w-4 rounded-full" style={{ background: c as string }} /> {l}
          </span>
        ))}
      </div>
      <span className="pointer-events-none absolute right-3 top-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-steel-500">
        Live network
      </span>
    </div>
  );
}
