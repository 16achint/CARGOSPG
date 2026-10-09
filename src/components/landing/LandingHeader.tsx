import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { EASE, scrollToId } from "@/lib/motion";
import { cn } from "@/utils/cn";

export const NAV = [
  { label: "Platform", id: "platform" },
  { label: "Capabilities", id: "capabilities" },
  { label: "Modes", id: "modes" },
  { label: "Control Tower", id: "control-tower" },
  { label: "Why CargoOS", id: "why" },
];

export function LandingHeader() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const go = (id: string) => { setOpen(false); setTimeout(() => scrollToId(id), open ? 220 : 0); };

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-4"
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1320px] items-center justify-between rounded-2xl border px-4 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] md:px-5",
            scrolled
              ? "h-14 border-steel-400/18 bg-white/80 shadow-[0_1px_2px_rgba(16,44,73,0.04),0_16px_36px_-26px_rgba(16,44,73,0.35)] backdrop-blur-xl"
              : "h-16 border-transparent bg-transparent"
          )}
        >
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="SPG CargoOS — back to top" className="rounded-lg">
            <Logo />
          </button>

          <nav aria-label="Primary" className="hidden lg:block" onMouseLeave={() => setHover(null)}>
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => go(n.id)}
                    onMouseEnter={() => setHover(n.id)}
                    onFocus={() => setHover(n.id)}
                    className="relative rounded-full px-3.5 py-2 text-[13.5px] text-steel-300 transition-colors duration-300 hover:text-frost-50"
                  >
                    {n.label}
                    {hover === n.id && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute bottom-0.5 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-cargo-400 shadow-[0_0_8px_rgba(24,160,216,0.8)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="hidden rounded-full px-4 py-2 text-[13.5px] text-steel-300 transition-colors hover:text-frost-50 sm:block"
            >
              Sign In
            </button>
            <Button size="sm" onClick={() => navigate("/login")} iconRight={<ArrowRight className="h-3.5 w-3.5" />} className="hidden sm:inline-flex">
              Launch CargoOS
            </Button>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-full text-frost-50 shadow-[inset_0_0_0_1px_rgba(99,120,142,0.26)] transition hover:bg-ink-800 lg:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={open ? "x" : "m"} initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-ink-950/95 backdrop-blur-md lg:hidden"
          >
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-50" />
            <div className="container-x relative flex h-full flex-col pb-8 pt-28">
              <ul className="flex flex-col">
                {NAV.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease: EASE }}
                    className="border-b border-steel-400/10"
                  >
                    <button onClick={() => go(n.id)} className="flex w-full items-center justify-between py-5 text-left text-2xl font-light tracking-[-0.02em] text-frost-50">
                      {n.label}
                      <span className="font-mono text-[11px] text-steel-500">0{i + 1}</span>
                    </button>
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: EASE }} className="mt-auto grid gap-3">
                <Button size="lg" onClick={() => navigate("/login")} iconRight={<ArrowRight className="h-4 w-4" />}>Launch CargoOS</Button>
                <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>Sign In</Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
