import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { EASE, viewportOnce } from "@/lib/motion";

const IMG = "https://images.pexels.com/photos/4941340/pexels-photo-4941340.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1800";

export function FinalCTA() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="cta-title" className="relative px-3 py-10 md:px-5 md:py-16">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] border border-steel-400/18 bg-white shadow-[0_1px_2px_rgba(16,44,73,0.04),0_40px_80px_-50px_rgba(16,44,73,0.4)]">
        <img src={IMG} alt="" loading="lazy" className="img-graded absolute inset-0 h-full w-full object-cover opacity-40" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(246,248,251,0.7)_45%,rgba(255,255,255,0.9)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_118%,rgba(28,111,232,0.2),transparent_70%)]" />
        <div aria-hidden className="grid-lines absolute inset-0 opacity-80 [mask-image:linear-gradient(180deg,transparent,#000_60%)]" />

        {/* route horizon */}
        <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[45%] w-full" aria-hidden>
          <path d="M-20 300 Q700 40 1420 300" fill="none" stroke="rgba(28,111,232,0.22)" strokeWidth="1" />
          <path d="M-20 300 Q700 110 1420 300" fill="none" stroke="rgba(99,120,142,0.22)" strokeWidth="1" />
          <motion.path
            d="M-20 300 Q700 40 1420 300" fill="none" stroke="#1C6FE8" strokeWidth="1.6"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={viewportOnce}
            transition={{ duration: reduce ? 0 : 2.4, ease: EASE }}
            style={{ filter: "drop-shadow(0 2px 8px rgba(28,111,232,0.3))" }}
          />
          {[220, 480, 700, 920, 1180].map((x, i) => {
            const t = (x + 20) / 1440;
            const y = (1 - t) * (1 - t) * 300 + 2 * (1 - t) * t * 40 + t * t * 300;
            return <circle key={i} cx={x} cy={y} r="3.5" fill="#FFFFFF" stroke="#1C6FE8" strokeWidth="1.2" />;
          })}
        </svg>

        <div className="relative px-6 py-24 text-center md:px-12 md:py-36">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={viewportOnce} transition={{ duration: 0.8 }} className="t-eyebrow">Ready when your cargo is</motion.p>
          <motion.h2
            id="cta-title"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 1, ease: EASE }}
            className="t-display mx-auto mt-6 max-w-4xl !text-[clamp(2.4rem,6vw,5.2rem)]"
          >
            Move cargo with complete visibility.
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 1, ease: EASE, delay: 0.1 }} className="t-lead mx-auto mt-6 max-w-xl !text-steel-300">
            From enquiry to delivery and profitability, operate every shipment through one connected platform.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 1, ease: EASE, delay: 0.2 }} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/login")} iconRight={<ArrowRight className="h-4 w-4" />}>Launch CargoOS</Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>Sign In</Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
