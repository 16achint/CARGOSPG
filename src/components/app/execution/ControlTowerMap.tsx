import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CONTINENT_PATHS, project, smoothPath, type LonLat } from "@/lib/geo";
import { type OperationalShipment, openExceptions, shipmentIsDelayed } from "@/data/execution";
import { useOnScreen } from "@/lib/motion";

const VB = { x: 0, y: 20, w: 1000, h: 460 };
const POINTS: Record<string, LonLat> = {
  Pune: [73.85, 18.52], "Pune Factory": [73.85, 18.52], "Nhava Sheva": [72.95, 18.95], "Mumbai Port": [72.88, 19.08], Mumbai: [72.88, 19.08],
  Chennai: [80.27, 13.08], "Chennai Airport": [80.17, 12.99], Mundra: [69.72, 22.84], "Mundra Port": [69.72, 22.84],
  "ICD Tughlakabad": [77.29, 28.6], Delhi: [77.1, 28.7], Colombo: [79.86, 6.93], Singapore: [103.82, 1.35],
  "Jebel Ali": [55.06, 25.01], Shanghai: [121.47, 31.23], Rotterdam: [4.48, 51.92], Hamburg: [9.99, 53.55],
  Antwerp: [4.4, 51.22], Felixstowe: [1.35, 51.96], Frankfurt: [8.68, 50.11], Houston: [-95.37, 29.76], "Houston Port": [-95.37, 29.76],
  "Houston Customer": [-90.05, 35.15], "New York": [-74.01, 40.71], Chicago: [-87.63, 41.88], "Los Angeles": [-118.24, 34.05], Sydney: [151.21, -33.87],
};
const colorFor = (s: OperationalShipment) => openExceptions(s).some((e) => e.severity === "Critical") ? "#C93D3A" : shipmentIsDelayed(s) ? "#C07E14" : s.stage === "Completed" ? "#0B7A55" : "#1C6FE8";

interface Route { id: string; shipment: OperationalShipment; d: string; color: string; marker: [number, number]; moving: boolean }

export default function ControlTowerMap({ shipments, onSelect, selectedId, onLocation }:
  { shipments: OperationalShipment[]; onSelect: (s: OperationalShipment) => void; selectedId?: string; onLocation?: (name: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(ref, "20px");

  const routes = useMemo<Route[]>(() => shipments.flatMap((s) => {
    const legs = s.legs.filter((l) => l.status !== "Cancelled");
    return legs.map((l) => {
      const from = POINTS[l.origin] ?? POINTS[s.origin] ?? [73.85, 18.52];
      const to = POINTS[l.destination] ?? POINTS[s.destination] ?? [103.82, 1.35];
      const d = smoothPath([from, to]);
      const a = project(from), b = project(to);
      const marker: [number, number] = l.status === "Completed" ? b : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      return { id: `${s.id}-${l.id}`, shipment: s, d, color: colorFor(s), marker, moving: ["In Progress", "Delayed", "Exception"].includes(l.status) };
    });
  }), [shipments]);

  const nodes = useMemo(() => {
    const map = new Map<string, { x: number; y: number; shipments: OperationalShipment[] }>();
    shipments.forEach((s) => {
      const names = new Set([s.origin, s.destination, ...s.legs.flatMap((l) => [l.origin, l.destination])]);
      names.forEach((n) => {
        const at = POINTS[n];
        if (!at) return;
        const [x, y] = project(at);
        const item = map.get(n) ?? { x, y, shipments: [] };
        if (!item.shipments.some((x) => x.id === s.id)) item.shipments.push(s);
        map.set(n, item);
      });
    });
    return [...map.entries()].map(([name, value]) => ({ name, ...value }));
  }, [shipments]);

  const routeOpacity = (id: string) => hover && hover !== id ? 0.13 : selectedId && selectedId !== id ? 0.25 : 0.76;

  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-xl bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF3F8_100%)] ring-1 ring-steel-400/12" style={{ aspectRatio: "1000 / 460" }}>
      <div aria-hidden className="grid-lines absolute inset-0 opacity-60" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_55%_44%,rgba(28,111,232,0.08),transparent_72%)]" />
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`Global shipment network with ${shipments.length} shipments`}>
        <g>
          {CONTINENT_PATHS.map((d, i) => <path key={i} d={d} fill="rgba(16,44,73,0.035)" stroke="rgba(16,44,73,0.11)" strokeWidth="0.65" />)}
        </g>
        <g fill="none">
          {routes.map(({ id, shipment, d, color }) => (
            <motion.path key={id} id={`tower-route-${id}`} d={d} stroke={color} strokeWidth={selectedId === shipment.id || hover === shipment.id ? 2.2 : 1.15}
              strokeLinecap="round" strokeOpacity={routeOpacity(shipment.id)} fill="none" onMouseEnter={() => setHover(shipment.id)} onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(shipment)} role="button" aria-label={`Open ${shipment.id}`} className="cursor-pointer"
              initial={visible ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
          ))}
        </g>
        {routes.filter((r) => r.moving).map(({ id, color }, i) => (
          <circle key={`moving-${id}`} r="2.2" fill={color} opacity="0.95">
            <animateMotion dur={`${12 + (i % 4) * 2}s`} repeatCount="indefinite" begin={`${-i * 1.4}s`}><mpath href={`#tower-route-${id}`} /></animateMotion>
          </circle>
        ))}
        {routes.filter((r) => r.shipment.stage !== "Completed").map(({ id, shipment, marker: [x, y], color }) => (
          <g key={`mk-${id}`} className="cursor-pointer" onClick={() => onSelect(shipment)} onMouseEnter={() => setHover(shipment.id)} onMouseLeave={() => setHover(null)}>
            <circle cx={x} cy={y} r={hover === shipment.id ? 7 : 5.5} fill={color} fillOpacity="0.14" stroke={color} strokeWidth="0.9" />
            <circle cx={x} cy={y} r="2" fill={color} />
          </g>
        ))}
        {nodes.map((n) => (
          <g key={n.name} className="cursor-pointer" onClick={() => onLocation?.(n.name)} onMouseEnter={() => setShowLabels(true)} onMouseLeave={() => setShowLabels(false)}>
            <circle cx={n.x} cy={n.y} r="5.5" fill="transparent" />
            <circle cx={n.x} cy={n.y} r="2.5" fill="#FFFFFF" stroke="#8496A9" strokeWidth="0.8" />
          </g>
        ))}
      </svg>

      {showLabels && nodes.map((n) => <button key={n.name} onClick={() => onLocation?.(n.name)} className="absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+7px)] rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-[9px] text-steel-400 shadow-sm ring-1 ring-steel-400/15" style={{ left: `${(n.x / 1000) * 100}%`, top: `${(n.y / 460) * 100}%` }}>{n.name}</button>)}

      <div className="pointer-events-none absolute bottom-2.5 left-3 flex flex-wrap gap-x-3.5 gap-y-1.5">
        {[["Normal", "#1C6FE8"], ["At risk", "#C07E14"], ["Critical", "#C93D3A"], ["Completed", "#0B7A55"]].map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.11em] text-steel-400"><i className="h-[3px] w-4 rounded-full" style={{ background: c }} />{l}</span>)}
      </div>
      <span className="pointer-events-none absolute right-3 top-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-steel-500">Global network · {routes.length} legs</span>
    </div>
  );
}
