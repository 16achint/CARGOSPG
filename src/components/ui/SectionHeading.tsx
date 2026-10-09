import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  id?: string;
}

export function SectionHeading({ eyebrow, title, description, align = "left", className, id }: Props) {
  return (
    <motion.div
      variants={stagger(0.09)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}
    >
      <motion.p variants={fadeUp} className={cn("t-eyebrow flex items-center gap-3", align === "center" && "justify-center")}>
        <span className="h-px w-6 bg-cargo-400/60" aria-hidden />
        {eyebrow}
      </motion.p>
      <motion.h2 id={id} variants={fadeUp} className="t-h2 mt-5">
        {title}
      </motion.h2>
      {description && (
        <motion.p variants={fadeUp} className={cn("t-lead mt-5 max-w-xl", align === "center" && "mx-auto")}>
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
