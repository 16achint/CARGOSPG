import { useRef, useState, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Plane, Ship, TrainFront, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { HeroNetwork } from "./HeroNetwork";
import { EASE, scrollToId, useFinePointer, useIsDesktop, useIsMobile } from "@/lib/motion";

const line = {
  hidden: { y: "105%" },
  show: (i: number) => ({ y: "0%", transition: { duration: 1.1, ease: EASE, delay: 0.15 + i * 0.12 } }),
};
const fade = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.45 + i * 0.1 } }),
};

export function HeroSection() {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const [leg, setLeg] = useState(0);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const parallax = isDesktop && fine && !reduce;
  const onMove = (e: PointerEvent) => {
    if (!parallax) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90]);
  const copyO = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const netScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.9]);
  const netO = useTransform(scrollYProgress, [0, 0.9], [1, 0.25]);
  const scrollFade = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const focusY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);

  const layout = isDesktop ? "desktop" : isMobile ? "mobile" : "tablet";

  return (
    <section
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      aria-labelledby="hero-title"
      className="relative isolate min-h-[100svh] overflow-hidden"
    >
      {/* atmosphere — porcelain base with cool ambient light */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#FFFFFF_0%,#F6F8FB_45%,#EEF3F9_100%)]" />
      <div aria-hidden className="grid-lines absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_60%_at_60%_40%,#000_20%,transparent_75%)]" />
      <div aria-hidden className="absolute -right-[10%] -top-[22%] -z-10 h-[75vh] w-[65vw] animate-drift rounded-full bg-[radial-gradient(circle,rgba(28,111,232,0.13),transparent_62%)] blur-2xl" />
      <div aria-hidden className="absolute -left-[15%] bottom-[-28%] -z-10 h-[65vh] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(24,160,216,0.1),transparent_62%)] blur-2xl" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(180deg,transparent,#F6F8FB)]" />

      <div className="container-x relative pt-28 md:pt-36 lg:flex lg:min-h-[100svh] lg:items-center lg:pt-24">
        {/* Copy */}
        <motion.div style={{ y: copyY, opacity: copyO }} className="relative z-20 max-w-[620px] lg:max-w-[460px] xl:max-w-[560px]">
          <motion.p variants={fade} custom={-2} initial="hidden" animate="show" className="t-eyebrow flex items-center gap-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-cargo-400/50" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-cargo-400" />
            </span>
            The operating system for global logistics
          </motion.p>

          <h1 id="hero-title" className="t-display mt-6 !text-[clamp(2.6rem,6.4vw,5.6rem)] lg:!text-[clamp(3rem,5.2vw,5.4rem)]">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span className="block" variants={line} custom={0} initial="hidden" animate="show">One shipment.</motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.1em]">
              <motion.span className="block bg-[linear-gradient(100deg,#0B1F33_15%,#3E5468_60%,#1355C4_115%)] bg-clip-text text-transparent" variants={line} custom={1} initial="hidden" animate="show">
                One operating system.
              </motion.span>
            </span>
          </h1>

          <motion.p variants={fade} custom={0} initial="hidden" animate="show" className="t-lead mt-6 max-w-[500px]">
            Run Road, Sea, Air and Rail logistics from enquiry to delivery, documents, billing and profitability through one connected platform.
          </motion.p>

          <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/login")} iconRight={<ArrowRight className="h-4 w-4" />}>Launch CargoOS</Button>
            <Button size="lg" variant="secondary" onClick={() => scrollToId("platform")}>Explore Platform</Button>
          </motion.div>

          <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-1.5" aria-hidden>
              {[Truck, Ship, Plane, TrainFront].map((I, i) => (
                <span key={i} className="grid h-7 w-7 place-items-center rounded-full bg-white ring-1 ring-steel-400/25 ring-offset-2 ring-offset-ink-950">
                  <I className="h-3.5 w-3.5 text-steel-400" />
                </span>
              ))}
            </div>
            <p className="text-[13px] text-steel-400">Built for modern multimodal logistics operations.</p>
          </motion.div>

          <motion.dl variants={fade} custom={3} initial="hidden" animate="show" className="mt-8 grid max-w-[530px] grid-cols-3 divide-x divide-steel-400/15 border-y border-steel-400/15 py-4">
            {[
              ["Road · Sea · Air · Rail", "One connected shipment"],
              ["Enquiry → delivery", "A single operating flow"],
              ["Docs · costs · margin", "Commercial clarity"],
            ].map(([value, label]) => (
              <div key={label} className="min-w-0 px-3 first:pl-0 last:pr-0">
                <dd className="text-[11px] font-medium leading-snug text-frost-100 sm:text-[12px]">{value}</dd>
                <dt className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.1em] leading-snug text-steel-500 sm:text-[9.5px]">{label}</dt>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Network */}
        <div className="relative z-10 mt-12 pb-16 lg:pointer-events-none lg:absolute lg:inset-y-0 lg:right-[-4%] lg:mt-0 lg:flex lg:w-[68%] lg:items-center lg:pb-0 xl:w-[70%]">
          <motion.div
            style={{ scale: netScale, opacity: netO }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
            className="w-full lg:pointer-events-auto lg:mt-10"
          >
            <HeroNetwork mx={mx} my={my} leg={leg} onLeg={setLeg} layout={layout} scrollFade={scrollFade} focusY={focusY} />
          </motion.div>
        </div>
      </div>

      {/* left wash to protect copy legibility */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[42%] bg-[linear-gradient(90deg,#FFFFFF_30%,rgba(255,255,255,0.72)_62%,transparent)] lg:block" />

      <motion.button
        onClick={() => scrollToId("platform")}
        style={{ opacity: scrollFade }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-7 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-steel-500 transition-colors hover:text-frost-50 lg:flex"
        aria-label="Scroll to platform overview"
      >
        <span className="font-mono text-[10px] tracking-[0.24em]">SCROLL</span>
        <span className="relative h-9 w-px overflow-hidden bg-steel-400/25">
          <motion.span className="absolute inset-x-0 top-0 h-3 bg-cargo-400" animate={reduce ? {} : { y: [-12, 36] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
        </span>
        <ChevronDown className="h-3 w-3" />
      </motion.button>
    </section>
  );
}
