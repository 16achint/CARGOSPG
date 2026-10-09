import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, CheckCheck, Clock, FileText, Mail, Package, Ship, Truck, Wallet, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NOTIF_ICON } from "@/data/mockData";
import { cn } from "@/utils/cn";
import { EASE } from "@/lib/motion";

const ICONS = {
  delay: Clock, doc: FileText, quote: FileText, truck: Truck, customs: Package,
  anchor: Ship, pod: Check, invoice: Wallet,
} as const;
const TONE: Record<string, string> = {
  warn: "text-warn bg-warn/10 ring-warn/25", risk: "text-risk bg-risk/[0.08] ring-risk/25",
  ok: "text-ok bg-ok/10 ring-ok/25", info: "text-info bg-info/[0.09] ring-info/25",
  cyan: "text-cargo-300 bg-cargo-400/10 ring-cargo-400/30",
};

export function NotificationDrawer() {
  const { notifOpen, setNotifOpen, notifs, markRead, markAllRead, unread, notify } = useApp();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!notifOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => ref.current?.querySelector<HTMLElement>("button")?.focus(), 60);
    return () => { document.body.style.overflow = prev; window.clearTimeout(t); };
  }, [notifOpen]);

  const list = tab === "unread" ? notifs.filter((n) => !n.read) : notifs;

  const openTarget = (record: string) => {
    setNotifOpen(false);
    if (record.startsWith("INV")) navigate("/app/finance");
    else if (record.startsWith("SPG-QUO")) navigate(`/app/quotes/${record}`);
    else if (record.startsWith("SPG-RFQ")) navigate(`/app/rfqs/${record}`);
    else if (record.startsWith("SPG-BKG")) navigate(`/app/bookings/${record}`);
    else if (record.startsWith("SPG-CUS")) navigate(`/app/customers/${record}`);
    else if (record.startsWith("SPG-SHP")) navigate(`/app/shipments/${record}`);
    else if (record.startsWith("QT")) navigate("/app/quotes");
    else if (record.startsWith("RFQ")) navigate("/app/rfqs");
    else if (record.startsWith("RT-")) navigate("/app/rates");
    else navigate("/app/shipments");
  };

  return (
    <AnimatePresence>
      {notifOpen && (
        <div className="fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-label="Notifications">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={() => setNotifOpen(false)} className="absolute inset-0 bg-shell-950/25 backdrop-blur-[2px]" />
          <motion.aside
            ref={ref}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.42, ease: EASE }}
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              const items = ref.current?.querySelectorAll<HTMLElement>("button");
              if (!items?.length) return;
              const f = items[0], l = items[items.length - 1];
              if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
              else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
            }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-work-50 shadow-[-24px_0_60px_-30px_rgba(4,12,20,0.5)]"
          >
            <header className="border-b border-steel-400/12 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-medium tracking-[-0.01em] text-frost-50">Notifications</h2>
                  <p className="mt-0.5 text-[12.5px] text-steel-400">{unread} unread · {notifs.length} total</p>
                </div>
                <button onClick={() => setNotifOpen(false)} aria-label="Close notifications"
                  className="grid h-8 w-8 place-items-center rounded-lg text-steel-400 transition hover:bg-work-200 hover:text-frost-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3.5 flex items-center gap-1 rounded-lg bg-work-200 p-0.5" role="tablist" aria-label="Filter notifications">
                {(["all", "unread"] as const).map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                    className={cn("flex-1 rounded-[6px] py-1.5 text-[12.5px] font-medium capitalize transition",
                      tab === t ? "bg-white text-frost-50 shadow-[0_1px_2px_rgba(16,44,73,0.06)]" : "text-steel-400 hover:text-frost-50")}>
                    {t}{t === "unread" && unread > 0 ? ` · ${unread}` : ""}
                  </button>
                ))}
              </div>
            </header>

            <div className="scroll-thin flex-1 overflow-y-auto p-3">
              {list.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ok/[0.08] ring-1 ring-ok/25"><CheckCheck className="h-5 w-5 text-ok" strokeWidth={1.7} /></span>
                  <h3 className="mt-4 text-[14px] font-medium text-frost-50">You're all caught up</h3>
                  <p className="mt-1.5 max-w-[240px] text-[13px] text-steel-400">No unread notifications right now.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {list.map((n, i) => {
                    const meta = NOTIF_ICON[n.type];
                    const Icon = ICONS[meta.icon as keyof typeof ICONS] ?? Mail;
                    return (
                      <motion.li key={n.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: Math.min(i * 0.03, 0.25) }}
                        className={cn("group relative rounded-xl p-3 ring-1 transition-colors",
                          n.read ? "bg-white ring-steel-400/12" : "bg-white ring-cargo-400/30 shadow-[0_1px_2px_rgba(16,44,73,0.04)]")}>
                        {!n.read && <span aria-hidden className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-cargo-400" />}
                        <div className="flex gap-3">
                          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1", TONE[meta.tone])}>
                            <Icon className="h-4 w-4" strokeWidth={1.7} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2 pr-4">
                              <h3 className={cn("min-w-0 flex-1 text-[13px] leading-snug", n.read ? "text-steel-300" : "font-medium text-frost-50")}>{n.title}</h3>
                            </div>
                            <p className="mt-1 text-[12.5px] leading-relaxed text-steel-400">{n.body}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              <button onClick={() => openTarget(n.record)} className="rounded font-mono text-[11px] text-cargo-300 hover:text-cargo-400">{n.record}</button>
                              <span className="text-[11.5px] text-steel-500">{n.time}</span>
                            </div>
                            <div className="mt-2.5 flex gap-1.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                              <button onClick={() => openTarget(n.record)}
                                className="rounded-md bg-work-200 px-2 py-1 text-[11.5px] font-medium text-steel-300 transition hover:bg-info/[0.1] hover:text-frost-50">
                                Open
                              </button>
                              <button onClick={() => markRead(n.id, !n.read)} aria-label={n.read ? "Mark as unread" : "Mark as read"}
                                className="rounded-md bg-work-200 px-2 py-1 text-[11.5px] font-medium text-steel-300 transition hover:bg-work-300 hover:text-frost-50">
                                {n.read ? "Mark unread" : "Mark read"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="flex items-center gap-2 border-t border-steel-400/12 bg-white px-4 py-3">
              <button onClick={markAllRead} disabled={unread === 0}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-white text-[13px] font-medium text-frost-50 ring-1 ring-steel-400/20 transition hover:ring-steel-400/45 disabled:opacity-45">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
              <button onClick={() => { setNotifOpen(false); notify("Full activity log arrives in a later phase"); }}
                className="inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium text-cargo-300 transition hover:bg-cargo-400/10">
                View all
              </button>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
