import { cn } from "@/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#18A0D8" />
          <stop offset="1" stopColor="#1C6FE8" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#FFFFFF" stroke="rgba(99,120,142,0.28)" />
      {/* container stack */}
      <rect x="7" y="16.5" width="8" height="6" rx="1" fill="none" stroke="#8496A9" strokeWidth="1.3" />
      <rect x="16.5" y="16.5" width="8" height="6" rx="1" fill="none" stroke="#8496A9" strokeWidth="1.3" />
      <rect x="11.75" y="9.5" width="8.5" height="6" rx="1" fill="url(#lm-g)" />
      {/* route arc */}
      <path d="M5 25.5 Q16 29 27 25.5" fill="none" stroke="url(#lm-g)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="27" cy="25.5" r="1.6" fill="#0772A6" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="font-mono text-[10.5px] font-medium tracking-[0.2em] text-steel-400">SPG</span>
        <span className={cn("font-medium tracking-[-0.02em] text-frost-50", compact ? "text-[16px]" : "text-[17px]")}>
          Cargo<span className="text-cargo-300">OS</span>
        </span>
      </span>
    </span>
  );
}
