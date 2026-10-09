import type { Shipment } from "@/data/mockData";

export function NetworkInsights({ shipments }: { shipments: Shipment[] }) {
  const lanes = Object.values(
    shipments.reduce<Record<string, { route: string; count: number; progress: number }>>((all, shipment) => {
      const route = `${shipment.origin} → ${shipment.destination}`;
      const current = all[route] ?? { route, count: 0, progress: 0 };
      current.count += 1;
      current.progress += shipment.progress;
      all[route] = current;
      return all;
    }, {}),
  )
    .map((lane) => ({ ...lane, progress: Math.round(lane.progress / lane.count) }))
    .sort((a, b) => b.count - a.count || b.progress - a.progress)
    .slice(0, 3);
  const nextMilestones = [...shipments].sort((a, b) => a.progress - b.progress).slice(0, 4);

  return (
    <div className="mt-3 grid min-h-[250px] flex-1 gap-3 md:grid-cols-2">
      <section className="rounded-xl border border-steel-400/15 bg-work-50/70 p-3.5" aria-label="Top lanes by volume">
        <div className="flex items-start justify-between">
          <div><p className="text-[12px] font-medium text-frost-50">Top lanes by volume</p><p className="mt-0.5 text-[10.5px] text-steel-500">Current filtered network</p></div>
          <span className="rounded-full bg-cargo-400/10 px-2 py-1 text-[10px] font-medium text-cargo-300">{lanes.length} lanes</span>
        </div>
        <ol className="mt-4 space-y-3">
          {lanes.map((lane, index) => (
            <li key={lane.route}>
              <div className="flex items-center justify-between gap-3 text-[11.5px]"><span className="truncate font-medium text-frost-50"><span className="mr-2 font-mono text-steel-500">0{index + 1}</span>{lane.route}</span><span className="shrink-0 text-steel-400">{lane.count} jobs</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-work-200"><div className="h-full rounded-full bg-cargo-400" style={{ width: `${Math.max(18, (lane.count / Math.max(...lanes.map((x) => x.count), 1)) * 100)}%` }} /></div>
              <p className="mt-1 text-[10px] text-steel-500">Average journey progress {lane.progress}%</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-steel-400/15 bg-white p-3.5" aria-label="Next shipment milestones">
        <div><p className="text-[12px] font-medium text-frost-50">Milestones due next</p><p className="mt-0.5 text-[10.5px] text-steel-500">Prioritised by journey progress</p></div>
        <ol className="mt-4 space-y-3 border-l border-steel-400/20 pl-3.5">
          {nextMilestones.map((shipment) => (
            <li key={shipment.id} className="relative">
              <span className="absolute -left-[18px] top-1 h-2 w-2 rounded-full bg-signal-500 ring-4 ring-white" />
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[11.5px] font-medium text-frost-50">{shipment.nextMilestone}</p><p className="mt-0.5 font-mono text-[10px] text-cargo-300">{shipment.id}</p></div><span className="shrink-0 text-[10.5px] text-steel-500">{shipment.nextMilestoneIn}</span></div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
