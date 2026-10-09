import type { Shipment } from "@/data/mockData";

function chartPoints(values: number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((value, index) => {
    const x = 8 + (index / (values.length - 1)) * (width - 16);
    const y = height - 7 - ((value - min) / range) * (height - 14);
    return `${x},${y}`;
  }).join(" ");
}

export function NetworkPulse({ shipments }: { shipments: Shipment[] }) {
  const active = shipments.length;
  const inTransit = shipments.filter((s) => s.status === "In Transit" || s.status === "Transshipment").length;
  const exceptions = shipments.filter((s) => s.status === "Exception").length;
  const activeTrend = [Math.max(0, active - 5), Math.max(0, active - 3), Math.max(0, active - 4), Math.max(0, active - 2), Math.max(0, active - 1), Math.max(0, active - 2), active];
  const transitTrend = [Math.max(0, inTransit - 2), Math.max(0, inTransit - 1), Math.max(0, inTransit - 2), Math.max(0, inTransit - 1), inTransit, Math.max(0, inTransit - 1), inTransit];
  const width = 560;
  const height = 72;
  const activePoints = chartPoints(activeTrend, width, height);
  const transitPoints = chartPoints(transitTrend, width, height);
  const [lastX, lastY] = activePoints.split(" ").at(-1)?.split(",") ?? ["0", "0"];

  return (
    <section className="mt-3 rounded-xl border border-steel-400/15 bg-work-50/70 px-3 py-2.5" aria-label="Network pulse for the last seven days">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-medium text-frost-50">Network pulse</p>
          <p className="mt-0.5 text-[10.5px] text-steel-500">Active shipment movement · last 7 days</p>
        </div>
        <div className="flex gap-3 text-[10.5px] text-steel-400">
          <span><b className="font-medium text-cargo-300">{inTransit}</b> in transit</span>
          <span><b className="font-medium text-risk">{exceptions}</b> exceptions</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-[66px] w-full" role="img" aria-label={`${active} active shipments over seven days`}>
        {[18, 36, 54].map((y) => <line key={y} x1="0" x2={width} y1={y} y2={y} stroke="rgba(90,111,133,0.12)" />)}
        <polyline points={transitPoints} fill="none" stroke="#18A0D8" strokeWidth="1.5" strokeDasharray="4 4" />
        <polyline points={activePoints} fill="none" stroke="#1C6FE8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r="3.4" fill="#fff" stroke="#1C6FE8" strokeWidth="2" />
      </svg>
      <div className="mt-0.5 flex justify-between text-[9.5px] text-steel-500">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day) => <span key={day}>{day}</span>)}
      </div>
    </section>
  );
}
