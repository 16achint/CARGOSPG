import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import AppRoot from "@/pages/app/AppRoot";
import { AppProvider } from "@/context/AppContext";
import type { Role } from "@/data/mockData";
import { getStoredRole } from "@/lib/mockAuth";
import type { ReactNode } from "react";

function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  // Keep the authenticated workspace mounted while navigating between modules.
  // Individual module transitions are handled inside AppRoot.
  const routeKey = location.pathname.startsWith("/app") ? "/app" : location.pathname;
  return (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
      <Routes location={location} key={routeKey}>
        <Route path="/" element={<Page><LandingPage /></Page>} />
        <Route path="/login" element={<Page><LoginPage /></Page>} />
        <Route path="/app/*" element={<Page><AppRoot /></Page>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  // role is seeded from the mock sign-in, defaulting to Operations
  const [role] = useState<Role>(() => getStoredRole() ?? "operations");
  return (
    <MotionConfig reducedMotion="user">
      <div className="grain min-h-screen bg-work-100 text-frost-100">
        <HashRouter>
          <AppProvider initialRole={role}>
            <AnimatedRoutes />
          </AppProvider>
        </HashRouter>
      </div>
    </MotionConfig>
  );
}
