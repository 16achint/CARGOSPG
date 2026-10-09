import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Clock, Lock, Mail, RefreshCw, ShieldOff, WifiOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FormField } from "./FormField";
import { PasswordInput } from "./PasswordInput";
import { Logo } from "@/components/ui/Logo";
import { DEMO_ACCOUNTS, getRemembered, mockSignIn, saveSession, setRemembered, type AuthFailure } from "@/lib/mockAuth";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Banner = AuthFailure | "expired" | null;

function validateEmail(v: string) {
  if (!v.trim()) return "Enter your work email.";
  if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address, e.g. name@company.com.";
  return null;
}
const validatePassword = (v: string) => (!v ? "Enter your password." : null);

const BANNERS: Record<Exclude<Banner, null>, { icon: typeof AlertTriangle; title: string; body: string; tone: "risk" | "warn" }> = {
  invalid: { icon: AlertTriangle, title: "Incorrect email or password.", body: "Check your credentials and try again.", tone: "risk" },
  disabled: { icon: ShieldOff, title: "This account has been disabled.", body: "Access to this workspace is suspended. Contact your CargoOS administrator to restore access.", tone: "risk" },
  network: { icon: WifiOff, title: "We couldn't reach CargoOS.", body: "Check your internet connection, then try again. Your details have been kept.", tone: "warn" },
  expired: { icon: Clock, title: "Your session has expired.", body: "Please sign in again to continue.", tone: "warn" },
};

export function LoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(() => getRemembered());
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => !!getRemembered());
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [banner, setBanner] = useState<Banner>(params.get("reason") === "expired" ? "expired" : null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [resetNote, setResetNote] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const busy = status !== "idle";

  useEffect(() => { (email ? passRef : emailRef).current?.focus({ preventScroll: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emailErr = touched.email || submitted ? validateEmail(email) : null;
  const passErr = touched.password || submitted ? validatePassword(password) : null;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setSubmitted(true);
    const eErr = validateEmail(email), pErr = validatePassword(password);
    if (eErr) return emailRef.current?.focus();
    if (pErr) return passRef.current?.focus();
    setBanner(null);
    setStatus("loading");
    const res = await mockSignIn(email, password);
    if (res.ok) {
      setRemembered(remember ? res.email : null);
      saveSession(res.name, res.email, res.role);
      setStatus("success");
      setTimeout(() => navigate("/app"), 850);
    } else {
      setStatus("idle");
      setBanner(res.error);
      if (res.error === "invalid") { setPassword(""); passRef.current?.focus(); }
    }
  };

  const fillDemo = (i: number) => {
    setEmail(DEMO_ACCOUNTS[i].email);
    setPassword(DEMO_ACCOUNTS[i].password);
    setBanner(null);
    setDemoOpen(false);
  };

  const b = banner ? BANNERS[banner] : null;

  return (
    <div className="w-full max-w-[400px]">
      <div className="hidden lg:block"><Logo /></div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }} className="lg:mt-14">
        <p className="t-eyebrow">Welcome back</p>
        <h1 className="mt-4 text-[2rem] font-light leading-[1.1] tracking-[-0.03em] text-frost-50 md:text-[2.4rem]">Sign in to CargoOS</h1>
        <p className="mt-3 text-[15px] text-steel-400">Access your logistics workspace.</p>
      </motion.div>

      <AnimatePresence initial={false}>
        {b && (
          <motion.div
            key={banner}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className={cn("mt-7 flex gap-3 rounded-xl border p-3.5", b.tone === "risk" ? "border-risk/30 bg-risk/[0.07]" : "border-warn/30 bg-warn/[0.07]")}>
              <b.icon className={cn("mt-0.5 h-4 w-4 shrink-0", b.tone === "risk" ? "text-risk" : "text-warn")} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-frost-50">{b.title}</div>
                <div className="mt-0.5 text-[12.5px] leading-relaxed text-steel-300">{b.body}</div>
                {banner === "network" && (
                  <button type="button" onClick={() => submit()} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-cargo-300 hover:text-cargo-400">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry now
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        noValidate
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
        className="mt-8 space-y-5"
        aria-busy={status === "loading"}
      >
        <FormField
          ref={emailRef}
          id="email"
          label="Work email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="name@company.com"
          leftIcon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (banner && banner !== "expired") setBanner(null); }}
          onBlur={() => email && setTouched((t) => ({ ...t, email: true }))}
          error={emailErr}
          disabled={busy}
        />
        <PasswordInput
          ref={passRef}
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (banner === "invalid") setBanner(null); }}
          onBlur={() => setTouched((t) => ({ ...t, password: t.password || submitted }))}
          error={passErr}
          disabled={busy}
          labelAside={
            <button type="button" aria-expanded={resetNote} className="rounded text-[12.5px] text-steel-400 transition-colors hover:text-cargo-300" onClick={() => setResetNote((v) => !v)}>
              Forgot password?
            </button>
          }
        />
        <AnimatePresence initial={false}>
          {resetNote && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="-mt-2 overflow-hidden text-[12.5px] leading-relaxed text-steel-400" role="status">
              Password resets are handled by your workspace administrator. A reset link will be sent to your work email once requested.
            </motion.p>
          )}
        </AnimatePresence>

        <label className="group flex w-fit cursor-pointer items-center gap-2.5 select-none">
          <input type="checkbox" className="peer sr-only" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={busy} />
          <span className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border border-steel-400/35 bg-white transition-all duration-200 group-hover:border-steel-400/60 peer-checked:border-signal-500 peer-checked:bg-signal-500 peer-focus-visible:ring-2 peer-focus-visible:ring-signal-600 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white">
            <Check className={cn("h-3 w-3 text-white transition-all duration-200", remember ? "scale-100 opacity-100" : "scale-50 opacity-0")} strokeWidth={3} />
          </span>
          <span className="text-[13.5px] text-steel-300">Remember me</span>
        </label>

        <motion.button
          type="submit"
          disabled={busy}
          whileTap={busy ? undefined : { scale: 0.985 }}
          className={cn(
            "group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-[15px] font-medium text-white transition-all duration-500",
            status === "success"
              ? "bg-ok shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_24px_-12px_rgba(11,122,85,0.7)]"
              : "bg-[linear-gradient(180deg,#2F86FF_0%,#1C6FE8_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(19,85,196,0.28),0_12px_26px_-14px_rgba(28,111,232,0.7)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(19,85,196,0.3),0_16px_34px_-14px_rgba(24,160,216,0.75)]",
            status === "loading" && "cursor-progress"
          )}
        >
          {status === "idle" && <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent_20%,rgba(255,255,255,0.2)_50%,transparent_80%)] transition-transform duration-700 group-hover:translate-x-full" />}
          <AnimatePresence mode="wait" initial={false}>
            {status === "idle" && (
              <motion.span key="i" className="relative flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </motion.span>
            )}
            {status === "loading" && (
              <motion.span key="l" className="flex items-center gap-2.5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" fill="none" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" /></svg>
                Signing in…
              </motion.span>
            )}
            {status === "success" && (
              <motion.span key="s" className="flex items-center gap-2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                <Check className="h-4 w-4" strokeWidth={2.5} /> Signed in
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <span className="sr-only" aria-live="polite">{status === "loading" ? "Signing in" : status === "success" ? "Signed in successfully" : ""}</span>
      </motion.form>

      <div className="mt-8 border-t border-steel-400/10 pt-6">
        <p className="text-[13.5px] text-steel-400">
          Need access? <span className="text-steel-300">Contact your CargoOS administrator.</span>
        </p>

        <div className="mt-5 rounded-xl border border-steel-400/10 bg-ink-900/40">
          <button
            type="button"
            onClick={() => setDemoOpen((o) => !o)}
            aria-expanded={demoOpen}
            aria-controls="demo-access"
            className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-[12.5px] text-steel-300"><Lock className="h-3.5 w-3.5 text-steel-500" /> Prototype access</span>
            <ChevronDown className={cn("h-4 w-4 text-steel-500 transition-transform duration-300", demoOpen && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {demoOpen && (
              <motion.div id="demo-access" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                <ul className="space-y-1 px-2 pb-2">
                  {DEMO_ACCOUNTS.map((a, i) => (
                    <li key={a.email}>
                      <button type="button" onClick={() => fillDemo(i)} disabled={busy} className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04]">
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[11.5px] text-frost-100">{a.email}</span>
                          <span className="block text-[11.5px] text-steel-500">{a.label}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] tracking-[0.08em] text-steel-500">{a.outcome}</span>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button type="button" onClick={() => { setBanner("expired"); setDemoOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[11.5px] text-steel-500 transition-colors hover:bg-white hover:text-steel-300">
                      Preview session-expired state <span className="font-mono text-[10px]">STATE</span>
                    </button>
                  </li>
                </ul>
                <p className="px-4 pb-3 font-mono text-[10px] text-steel-500">Password for all: CargoOS@2026</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
