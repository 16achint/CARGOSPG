import { Logo } from "@/components/ui/Logo";
import { scrollToId } from "@/lib/motion";

const GROUPS: { t: string; links: { l: string; id: string }[] }[] = [
  { t: "Platform", links: [{ l: "Master Shipment", id: "platform" }, { l: "Workspace", id: "capabilities" }, { l: "Control Tower", id: "control-tower" }] },
  { t: "Capabilities", links: [{ l: "Documents", id: "capabilities" }, { l: "Financials", id: "capabilities" }, { l: "Participants", id: "why" }] },
  { t: "Modes", links: [{ l: "Ocean", id: "modes" }, { l: "Air", id: "modes" }, { l: "Road", id: "modes" }, { l: "Rail", id: "modes" }] },
  { t: "Company", links: [{ l: "About SPG", id: "why" }, { l: "Why CargoOS", id: "why" }, { l: "Contact", id: "why" }] },
  { t: "Support", links: [{ l: "Help Centre", id: "platform" }, { l: "System Status", id: "platform" }, { l: "Security", id: "why" }] },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-steel-400/10 pt-16 md:pt-20">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-steel-400">One shipment. One connected logistics operating system.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-900 px-3 py-1.5 ring-1 ring-steel-400/10">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-ok" />
              <span className="font-mono text-[10px] tracking-[0.14em] text-steel-400">ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5 lg:col-span-8">
            {GROUPS.map((g) => (
              <div key={g.t}>
                <h3 className="t-meta !text-steel-400">{g.t}</h3>
                <ul className="mt-4 space-y-2.5">
                  {g.links.map((l) => (
                    <li key={l.l}>
                      <button onClick={() => scrollToId(l.id)} className="group relative text-[13.5px] text-steel-500 transition-colors duration-300 hover:text-frost-50">
                        {l.l}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-cargo-300/70 transition-all duration-300 group-hover:w-full" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-steel-400/10 py-6 text-[12.5px] text-steel-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} SPG Logistics. All rights reserved.</span>
          <div className="flex gap-6">
            <button className="transition-colors hover:text-frost-50">Privacy</button>
            <button className="transition-colors hover:text-frost-50">Terms</button>
            <button className="transition-colors hover:text-frost-50">Security</button>
          </div>
        </div>
      </div>
      {/* oversized wordmark */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <div className="container-x">
          <div className="translate-y-[18%] bg-[linear-gradient(180deg,rgba(16,44,73,0.16),transparent_85%)] bg-clip-text text-center text-[22vw] font-medium leading-none tracking-[-0.06em] text-transparent lg:text-[260px]">
            CargoOS
          </div>
        </div>
      </div>
    </footer>
  );
}
