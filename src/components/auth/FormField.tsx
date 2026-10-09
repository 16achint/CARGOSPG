import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null;
  rightSlot?: ReactNode;
  labelAside?: ReactNode;
  leftIcon?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { id, label, error, rightSlot, labelAside, leftIcon, className, value, disabled, ...rest },
  ref
) {
  const filled = typeof value === "string" ? value.length > 0 : false;
  const errId = `${id}-error`;
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className={cn("text-[13px] font-medium transition-colors", error ? "text-risk" : "text-steel-300")}>{label}</label>
        {labelAside}
      </div>
      <div
        className={cn(
          "group relative flex h-12 items-center rounded-xl border transition-all duration-300",
          "bg-ink-950/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
          error
            ? "border-risk/60 focus-within:border-risk focus-within:shadow-[0_0_0_4px_rgba(239,100,97,0.12)]"
            : "border-steel-400/25 hover:border-steel-400/45 focus-within:border-cargo-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(24,160,216,0.13)]",
          filled && !error && "border-steel-400/30 bg-ink-900/60",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {leftIcon && <span className={cn("pointer-events-none pl-3.5 transition-colors", error ? "text-risk/80" : "text-steel-500 group-focus-within:text-cargo-300")}>{leftIcon}</span>}
        <input
          ref={ref}
          id={id}
          value={value}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={cn(
            "h-full w-full min-w-0 rounded-xl bg-transparent px-3.5 text-[14.5px] text-frost-50 caret-cargo-400 outline-none placeholder:text-steel-500/90 [&:-webkit-autofill]:[-webkit-text-fill-color:#0B1F33] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#FFFFFF_inset] [&:-webkit-autofill]:[transition:background-color_9999s]",
            leftIcon && "pl-2.5"
          )}
          {...rest}
        />
        {rightSlot && <span className="flex shrink-0 items-center pr-1.5">{rightSlot}</span>}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={errId}
            role="alert"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5 overflow-hidden pt-2 text-[12.5px] text-risk"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});
