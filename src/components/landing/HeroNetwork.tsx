import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { RouteNetwork } from "@/components/network/RouteNetwork";
import { HERO_ROUTE, HERO_VIEWBOX } from "@/lib/geo";
import { DocsCard, MarginCard, ShipmentCard, StatusCard } from "./ShipmentCard";
import { EASE } from "@/lib/motion";

interface Props {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  leg: number;
  onLeg: (l: number) => void;
  layout: "desktop" | "tablet" | "mobile";
  scrollFade: MotionValue<number>;
  focusY: MotionValue<number>;
}

function useDepth(mv: MotionValue<number>, depth: number) {
  const s = useSpring(mv, { stiffness: 60, damping: 18, mass: 0.6 });
  return useTransform(s, (v) => v * depth);
}

const cardIn = (d: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: EASE, delay: d },
});

export function HeroNetwork({ mx, my, leg, onLeg, layout, scrollFade, focusY }: Props) {
  const mapX = useDepth(mx, -6), mapY = useDepth(my, -4);
  const c1x = useDepth(mx, 12), c1y = useDepth(my, 9);
  const c2x = useDepth(mx, 16), c2y = useDepth(my, 12);
  const c3x = useDepth(mx, 9), c3y = useDepth(my, 7);

  if (layout !== "desktop") {
    return (
      <div className="relative">
        <div className="relative -mx-5 md:mx-0 [mask-image:radial-gradient(ellipse_75%_80%_at_50%_50%,#000_55%,transparent_100%)]">
          <RouteNetwork
            route={HERO_ROUTE}
            viewBox={HERO_VIEWBOX}
            lanes={layout === "mobile" ? "none" : "lite"}
            labelSize={layout === "mobile" ? "sm" : "md"}
            onSegment={(s) => onLeg(s)}
            duration={20}
          />
        </div>
        <motion.div {...cardIn(0.6)} className="relative z-10 -mt-2 flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-center">
          <ShipmentCard leg={leg} className="w-full max-w-[340px]" />
          {layout === "tablet" && <MarginCard />}
          {layout === "tablet" && <DocsCard />}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div style={{ x: mapX, y: mapY }} className="[mask-image:radial-gradient(ellipse_70%_75%_at_55%_50%,#000_50%,transparent_100%)]">
        <RouteNetwork route={HERO_ROUTE} viewBox={HERO_VIEWBOX} lanes="full" onSegment={(s) => onLeg(s)} duration={24} />
      </motion.div>

      {/* floating operational cards */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div style={{ x: c1x, y: c1y }} className="absolute left-[45%] top-[50%]">
          <motion.div style={{ y: focusY }}>
            <motion.div {...cardIn(0.9)} className="pointer-events-auto">
              <ShipmentCard leg={leg} />
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div style={{ x: c2x, y: c2y, opacity: scrollFade }} className="absolute left-[21%] top-[76%]">
          <motion.div {...cardIn(1.1)}><DocsCard /></motion.div>
        </motion.div>
        <motion.div style={{ x: c3x, y: c3y, opacity: scrollFade }} className="absolute right-[1%] top-[58%] hidden xl:block">
          <motion.div {...cardIn(1.25)}><MarginCard /></motion.div>
        </motion.div>
        <motion.div style={{ x: c3x, y: c2y, opacity: scrollFade }} className="absolute left-[64%] top-[9%]">
          <motion.div {...cardIn(1.4)}><StatusCard /></motion.div>
        </motion.div>
      </div>
    </div>
  );
}
