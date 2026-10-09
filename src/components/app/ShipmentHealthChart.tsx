import type { Shipment } from "@/data/mockData";

type Stage = { label: string; detail: string; value: number; tone: string };

export function ShipmentHealthChart({ shipments }: { shipments: Shipment[] }) {
  const stages: Stage[] = [
    {
      label: "Moving",
      detail: "In transit or transfer",
      value: shipments.filter((s) => s.status === "In Transit" || s.stage === "Transshipment").length,
      tone: "bg-cargo-400",
    },
    {
      label: "Attention",
      detail: "Exceptions or customs",
      value: shipments.filter((s) => s.status === "Exception" || s.stage === "Customs").length,
      tone: "bg-risk",
    },
    {
      label: "Documentation",
      detail: "Docs and gate-in",
      value: shipments.filter((s) => s.stage === "Documentation" || s.stage === "Gate-in").length,
      tone: "bg-warn",
    },
    {
      label: "Planned",
      detail: "Pickup to delivery",
      value: shipments.filter((s) => ["Confirmed", "Pickup", "Destination", "Delivery", "Completed"].includes(s.stage)).length,
      tone: "bg-signal-500",
    },
  ];
  const max = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <section className="mt-3 rounded-xl border border-steel-400/15 bg-white p-3" aria-label="Shipment health by stage">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-medium text-frost-50">Shipment health by stage</p>
          <p className="mt-0.5 text-[10.5px] text-steel-500">Current filtered shipment distribution</p>
        </div>
        <span className="rounded-full bg-ok/10 px-2 py-1 text-[10px] font-medium text-ok">{shipments.length} total</span>
      </div>
      <div className="mt-4 space-y-3">
        {stages.map((stage) => (
          <div key={stage.label} className="grid grid-cols-[92px_1fr_24px] items-center gap-2">
            <div>
              <p className="text-[10.5px] font-medium text-frost-50">{stage.label}</p>
              <p className="text-[9.5px] text-steel-500">{stage.detail}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-work-200">
              <div className={"h-full rounded-full transition-all duration-500 " + stage.tone} style={{ width: `${(stage.value / max) * 100}%` }} />
            </div>
            <span className="text-right text-[11px] font-medium text-frost-50">{stage.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
