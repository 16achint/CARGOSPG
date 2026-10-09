import { forwardRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { FormField, type FormFieldProps } from "./FormField";

export const PasswordInput = forwardRef<HTMLInputElement, Omit<FormFieldProps, "type" | "rightSlot">>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <FormField
      ref={ref}
      {...props}
      type={visible ? "text" : "password"}
      leftIcon={<KeyRound className="h-4 w-4" />}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={props.id}
          disabled={props.disabled}
          className="grid h-9 w-9 place-items-center rounded-lg text-steel-400 transition-colors hover:bg-ink-800 hover:text-frost-50"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={visible ? "on" : "off"} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }}>
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      }
    />
  );
});
