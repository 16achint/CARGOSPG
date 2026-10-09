import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  iconRight?: ReactNode;
  iconLeft?: ReactNode;
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2.5",
};

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-[linear-gradient(180deg,#2F86FF_0%,#1C6FE8_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(19,85,196,0.28),0_10px_24px_-12px_rgba(28,111,232,0.6)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(19,85,196,0.3),0_14px_30px_-12px_rgba(24,160,216,0.65)]",
  secondary:
    "text-frost-50 bg-white shadow-[inset_0_0_0_1px_rgba(99,120,142,0.22),0_1px_2px_rgba(16,44,73,0.04)] hover:shadow-[inset_0_0_0_1px_rgba(99,120,142,0.45),0_6px_18px_-10px_rgba(16,44,73,0.25)]",
  ghost: "text-steel-300 hover:text-frost-50",
};

export function Button({ variant = "primary", size = "md", className, children, iconRight, iconLeft, ...rest }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group relative inline-flex select-none items-center justify-center overflow-hidden rounded-full font-medium tracking-[-0.005em] transition-[background,box-shadow,color] duration-300 disabled:opacity-60",
        sizes[size],
        variants[variant],
        className
      )}
      {...rest}
    >
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent_20%,rgba(255,255,255,0.28)_50%,transparent_80%)] transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
      )}
      {iconLeft}
      <span className="relative">{children}</span>
      {iconRight && (
        <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">{iconRight}</span>
      )}
    </motion.button>
  );
}
