import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { CONTINENT_PATHS, HUBS, LANES, project, segmentPaths, type RouteDef, type Mode } from "@/lib/geo";
import { useOnScreen } from "@/lib/motion";
import { cn } from "@/utils/cn";

export interface ViewBox { x: number; y: number; w: number; h: number }

/** Dotted continents — reusable map base */
export function WorldDots({ uid, opacity = 1 }: { uid: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <defs>
        <pattern id={`dots-${uid}`} width="5.2" height="5.2" patternUnits="userSpaceOnUse">
          <circle cx="2.6" cy="2.6" r="0.95" fill="#63788E" opacity="0.42" />
        </pattern>
      </defs>
      {CONTINENT_PATHS.map((d, i) => (
        <path key={i} d={d} fill="rgba(16,44,73,0.035)" stroke="rgba(16,44,73,0.1)" strokeWidth="0.6" />
      ))}
      {CONTINENT_PATHS.map((d, i) => (
        <path key={`p${i}`} d={d} fill={`url(#dots-${uid})`} />
      ))}
    </g>
  );
}

export const pct = (vb: ViewBox, x: number, y: number) => ({
  left: `${((x - vb.x) / vb.w) * 100}%`,
  top: `${((y - vb.y) / vb.h) * 100}%`,
});

interface Props {
  route: RouteDef;
  viewBox: ViewBox;
  duration?: number;
  hold?: number;
  lanes?: "full" | "lite" | "none";
  showLabels?: boolean;
  labelSize?: "sm" | "md";
  className?: string;
  children?: ReactNode;
  onSegment?: (seg: number, mode: Mode) => void;
  /** where the marker rests when reduced motion is on (0..1) */
  staticAt?: number;
}

const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export function RouteNetwork({
  route, viewBox: vb, duration = 22, hold = 2.4, lanes = "full", showLabels = true, labelSize = "md",
  className, children, onSegment, staticAt = 0.62,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const visible = useOnScreen(wrapRef);

  const segs = useMemo(() => segmentPaths(route), [route]);
  const fullD = useMemo(() => segs.join(" "), [segs]);
  const nodesXY = useMemo(() => route.nodes.map((n) => project(n.at)), [route]);

  const fullRef = useRef<SVGPathElement>(null);
  const progRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const segRefs = useRef<(SVGPathElement | null)[]>([]);
  const elapsed = useRef(0);
  const lastNode = useRef(-1);
  const onSegRef = useRef(onSegment);
  onSegRef.current = onSegment;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const full = fullRef.current;
    const prog = progRef.current;
    const glow = glowRef.current;
    if (!full || !prog || !glow) return;
    const total = full.getTotalLength();
    const lens = segRefs.current.map((p) => p?.getTotalLength() ?? 0);
    const cum = [0];
    lens.forEach((l) => cum.push(cum[cum.length - 1] + l));
    // time weights: short truck legs still get readable time
    const weights = lens.map((l) => Math.max(l, total * 0.13));
    const wTotal = weights.reduce((a, b) => a + b, 0);
    const tCum = [0];
    weights.forEach((w) => tCum.push(tCum[tCum.length - 1] + w / wTotal));

    [prog, glow].forEach((p) => (p.style.strokeDasharray = `${total} ${total}`));

    const apply = (tp: number, fade = 1) => {
      // map time progress → length via weighted segments
      let i = 0;
      while (i < lens.length - 1 && tp > tCum[i + 1]) i++;
      const local = (tp - tCum[i]) / (tCum[i + 1] - tCum[i] || 1);
      const L = Math.min(total, cum[i] + easeInOut(Math.min(1, Math.max(0, local))) * lens[i]);
      const off = String(total - L);
      prog.style.strokeDashoffset = off;
      glow.style.strokeDashoffset = off;
      prog.style.opacity = String(fade);
      glow.style.opacity = String(fade * 0.35);
      const pt = full.getPointAtLength(Math.max(0.01, L));
      if (markerRef.current) {
        markerRef.current.setAttribute("transform", `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
        markerRef.current.style.opacity = String(fade);
      }
      let n = 0;
      for (let k = 0; k < cum.length; k++) if (L >= cum[k] - 0.6) n = k;
      if (n !== lastNode.current) {
        lastNode.current = n;
        setActive(n);
        const seg = Math.min(n, lens.length - 1);
        onSegRef.current?.(seg, route.segments[seg].mode);
      }
    };

    if (reduce) { apply(staticAt); return; }
    if (!visible) { svgRef.current?.pauseAnimations?.(); return; }
    svgRef.current?.unpauseAnimations?.();

    const cycle = duration + hold;
    let raf = 0;
    const start = performance.now() - elapsed.current * 1000;
    const loop = (now: number) => {
      const e = ((now - start) / 1000) % cycle;
      elapsed.current = e;
      const tp = Math.min(1, e / duration);
      let fade = 1;
      if (e > cycle - 0.6) fade = Math.max(0, (cycle - e) / 0.6);
      else if (e < 0.4) fade = e / 0.4;
      apply(tp, fade);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [segs, reduce, visible, duration, hold, staticAt, route]);

  const laneList = lanes === "full" ? LANES : lanes === "lite" ? LANES.slice(0, 5) : [];
  const hubList = lanes === "full" ? HUBS : lanes === "lite" ? HUBS.slice(0, 6) : [];

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)} style={{ aspectRatio: `${vb.w} / ${vb.h}` }}>
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        role="img"
        aria-label={`Live shipment route: ${route.nodes.map((n) => n.label).join(" to ")}`}
      >
        <defs>
          <linearGradient id={`rg-${uid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#1355C4" />
            <stop offset="0.5" stopColor="#1C6FE8" />
            <stop offset="1" stopColor="#18A0D8" />
          </linearGradient>
          <radialGradient id={`mk-${uid}`}>
            <stop offset="0" stopColor="#18A0D8" stopOpacity="0.4" />
            <stop offset="1" stopColor="#18A0D8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <WorldDots uid={uid} />

        {/* faint global lanes */}
        <g fill="none">
          {laneList.map((l, i) => (
            <path
              key={i}
              id={`lane-${uid}-${i}`}
              d={l.d}
              stroke={l.kind === "air" ? "rgba(99,120,142,0.45)" : "rgba(28,111,232,0.26)"}
              strokeWidth="0.6"
              strokeDasharray={l.kind === "air" ? "1.5 4" : "0"}
            />
          ))}
          {lanes === "full" && !reduce &&
            laneList.map((_, i) => (
              <circle key={`pt${i}`} r="1.1" fill={i % 3 === 0 ? "#8496A9" : "#18A0D8"} opacity="0.8">
                <animateMotion dur={`${9 + (i % 4) * 3}s`} repeatCount="indefinite" begin={`${-i * 1.7}s`}>
                  <mpath href={`#lane-${uid}-${i}`} />
                </animateMotion>
              </circle>
            ))}
        </g>

        {hubList.map((h) => {
          const [x, y] = project(h.at);
          return <circle key={h.id} cx={x} cy={y} r="1.3" fill="#A6B5C6" stroke="rgba(99,120,142,0.45)" strokeWidth="0.4" />;
        })}

        {/* base route */}
        <g fill="none" strokeLinecap="round">
          {segs.map((d, i) => (
            <path
              key={i}
              ref={(el) => { segRefs.current[i] = el; }}
              d={d}
              stroke="rgba(99,120,142,0.4)"
              strokeWidth="0.8"
              strokeDasharray={route.segments[i].mode === "truck" ? "2 2.5" : route.segments[i].mode === "air" ? "1 3" : undefined}
            />
          ))}
          <path ref={fullRef} d={fullD} stroke="none" />
          <path ref={glowRef} d={fullD} stroke="#18A0D8" strokeWidth="6" opacity="0.18" />
          <path ref={progRef} d={fullD} stroke={`url(#rg-${uid})`} strokeWidth="1.5" />
        </g>

        {/* nodes */}
        {nodesXY.map(([x, y], i) => {
          const on = i <= active;
          return (
            <g key={route.nodes[i].id}>
              {on && !reduce && (
                <circle
                  cx={x} cy={y} r="3.2" fill="none" stroke="#18A0D8" strokeWidth="0.7"
                  className="animate-node-pulse"
                  style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${i * 0.3}s` }}
                />
              )}
              <circle cx={x} cy={y} r="3.4" fill="#FFFFFF" stroke={on ? "#1C6FE8" : "rgba(99,120,142,0.55)"} strokeWidth="0.9" style={{ transition: "stroke .5s" }} />
              <circle cx={x} cy={y} r="1.5" fill={on ? "#18A0D8" : "#A6B5C6"} style={{ transition: "fill .5s" }} />
            </g>
          );
        })}

        {/* moving cargo marker */}
        <g ref={markerRef} style={{ opacity: 0 }}>
          <circle r="10" fill={`url(#mk-${uid})`} />
          <circle r="3.6" fill="#FFFFFF" stroke="#1C6FE8" strokeWidth="1.1" />
          <circle r="1.6" fill="#0B1F33" />
        </g>
      </svg>

      {showLabels &&
        nodesXY.map(([x, y], i) => {
          const n = route.nodes[i];
          const on = i <= active;
          const pos = n.labelPos ?? "bottom";
          const shift =
            pos === "top" ? "-translate-x-1/2 -translate-y-[calc(100%+10px)]"
            : pos === "bottom" ? "-translate-x-1/2 translate-y-[10px]"
            : pos === "left" ? "-translate-x-[calc(100%+10px)] -translate-y-1/2"
            : "translate-x-[10px] -translate-y-1/2";
          return (
            <div
              key={n.id}
              className={cn("pointer-events-none absolute whitespace-nowrap text-center transition-opacity duration-500", shift, on ? "opacity-100" : "opacity-55")}
              style={pct(vb, x, y)}
            >
              <div className={cn("font-medium tracking-[-0.01em] text-frost-50", labelSize === "md" ? "text-[11.5px]" : "text-[9.5px]")}>{n.label}</div>
              <div className={cn("font-mono uppercase tracking-[0.12em]", on ? "text-cargo-300/90" : "text-steel-500", labelSize === "md" ? "text-[9px]" : "text-[8px]")}>{n.sub}</div>
            </div>
          );
        })}
      {children}
    </div>
  );
}
