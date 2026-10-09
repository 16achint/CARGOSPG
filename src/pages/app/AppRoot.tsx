import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/app/AppHeader";
import { NavDock } from "@/components/app/NavDock";
import { CommandPalette } from "@/components/app/CommandPalette";
import { NotificationDrawer } from "@/components/app/NotificationDrawer";
import { Drawer } from "@/components/app/ui/primitives";
import { ShipmentPreview } from "@/pages/app/OperationsOverview";
import { OperationsOverview } from "@/pages/app/OperationsOverview";
import { CustomerOverview, FinanceOverview, ManagementOverview, SalesOverview, VendorOverview } from "@/pages/app/RoleDashboards";
import { PlaceholderPage } from "@/pages/app/PlaceholderPage";
import { CustomersPage, CustomerCreatePage, CustomerDetailPage } from "@/pages/app/customers/CustomersPage";
import { RfqListPage, RfqCreatePage } from "@/pages/app/rfqs/RfqPages";
import { RfqDetailPage, RateEvalPage } from "@/pages/app/rfqs/RfqDetailPages";
import { RatesPage } from "@/pages/app/rates/RatesPage";
import { QuoteListPage, QuoteBuilderPage, QuoteDetailPage, QuoteApprovalPage, QuotePreviewPage } from "@/pages/app/quotes/QuotePages";
import { BookingListPage, BookingNewPage, BookingDetailPage } from "@/pages/app/bookings/BookingPages";
import { CustomerRfqsPage, CustomerQuotesPage } from "@/pages/app/customer/CustomerPortal";
import { ShipmentCreatePage } from "@/pages/app/shipments/ShipmentCreatePage";
import { Shipment360Page, ShipmentJourneyPage, ShipmentMilestonesPage } from "@/pages/app/shipments/ShipmentDetailPages";
import { ShipmentsPage } from "@/pages/app/shipments/ShipmentsPage";
import { ControlTowerPage, ExceptionCenterPage } from "@/pages/app/controltower/ControlTowerPages";
import { useApp } from "@/context/AppContext";
import type { Role } from "@/data/mockData";
import { CommercialProvider } from "@/context/CommercialContext";
import { ExecutionProvider } from "@/context/ExecutionContext";
import { canNav } from "@/lib/roles";
import { EASE } from "@/lib/motion";

/* ---------- page transition wrapper ---------- */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.32, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function Toast() {
  const { toast } = useApp();
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[95] w-full max-w-[420px] -translate-x-1/2 px-4">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.3, ease: EASE }}
            className="pointer-events-auto rounded-xl bg-shell-800 px-4 py-3 text-[13px] text-frost-100 shadow-[0_20px_40px_-16px_rgba(4,12,20,0.7)] ring-1 ring-shell-hair">
            <span className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cargo-400" />
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShipmentPreviewDrawer() {
  const { preview, setPreview } = useApp();
  return (
    <Drawer open={!!preview} onClose={() => setPreview(null)} width="sm:max-w-[420px]"
      title={preview ? preview.id : ""}
      subtitle={preview ? `${preview.origin} → ${preview.destination} · ${preview.customer}` : ""}>
      {preview && <ShipmentPreview s={preview} />}
    </Drawer>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { role } = useApp();
  const { pathname } = useLocation();
  // match on the first segment after /app so nested routes (/app/customers/new) inherit access
  const seg = "/" + pathname.replace(/^\/app\/?/, "").split("/")[0];
  const target = seg === "/" ? "/app" : `/app${seg}`;
  if (!canNav(role, target)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function PersonaGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { role, home } = useApp();
  if (!roles.includes(role)) return <Navigate to={home} replace />;
  return <>{children}</>;
}

export default function AppRoot() {
  const { home, loading } = useApp();
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => { document.title = "CargoOS — SPG Logistics"; }, []);
  useEffect(() => {
    const main = document.getElementById("app-main");
    main?.scrollTo({ top: 0 });
  }, [pathname]);

  const ph = (k: string) => <PlaceholderPage specKey={k} />;

  return (
    <CommercialProvider>
    <ExecutionProvider>
    <div className="min-h-[100svh] bg-[linear-gradient(180deg,#081522_0%,#050E18_60%,#040C14_100%)] md:p-2 lg:p-2.5">
      <div className="flex min-h-[100svh] md:min-h-[calc(100svh-1rem)] lg:min-h-[calc(100svh-1.25rem)] md:rounded-[18px] md:ring-1 md:ring-shell-hair md:overflow-hidden">
        <NavDock />
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* workspace surface layered above the dark shell */}
          <div className="flex min-h-[100svh] flex-col bg-work-100 md:min-h-0 md:flex-1 md:m-1 md:ml-0 md:rounded-[14px] md:shadow-[-1px_0_0_rgba(139,165,191,0.06),0_20px_50px_-30px_rgba(4,12,20,0.8)] md:overflow-hidden">
            <AppHeader />
            <main id="app-main" className="scroll-thin relative flex-1 overflow-y-auto px-3.5 pb-8 pt-4 md:px-5 md:pb-10 md:pt-5">
              <AnimatePresence mode="wait">
                <Routes location={location} key={pathname}>
                  <Route path="/" element={<Navigate to={home} replace />} />
                  <Route path="/overview" element={<Page><OperationsOverview /></Page>} />
                  <Route path="/management" element={<Guard><Page><ManagementOverview /></Page></Guard>} />
                  <Route path="/customer" element={<Page><CustomerOverview /></Page>} />
                  <Route path="/vendor" element={<Page><VendorOverview /></Page>} />
                  <Route path="/sales" element={<Page><SalesOverview /></Page>} />
                  <Route path="/finance-overview" element={<Page><FinanceOverview /></Page>} />

                  <Route path="/customers" element={<Guard><Page><CustomersPage /></Page></Guard>} />
                  <Route path="/customers/new" element={<Guard><Page><CustomerCreatePage /></Page></Guard>} />
                  <Route path="/customers/:customerId" element={<Guard><Page><CustomerDetailPage /></Page></Guard>} />
                  <Route path="/rfqs" element={<Guard><Page><RfqListPage /></Page></Guard>} />
                  <Route path="/rfqs/new" element={<Guard><Page><RfqCreatePage /></Page></Guard>} />
                  <Route path="/rfqs/:rfqId" element={<Guard><Page><RfqDetailPage /></Page></Guard>} />
                  <Route path="/rfqs/:rfqId/rates" element={<Guard><Page><RateEvalPage /></Page></Guard>} />
                  <Route path="/rfqs/:rfqId/quote" element={<Guard><Page><QuoteBuilderPage /></Page></Guard>} />
                  <Route path="/rates" element={<Guard><Page><RatesPage /></Page></Guard>} />
                  <Route path="/quotes" element={<Guard><Page><QuoteListPage /></Page></Guard>} />
                  <Route path="/quotes/new" element={<Guard><Page><QuoteBuilderPage /></Page></Guard>} />
                  <Route path="/quotes/:quoteId" element={<Guard><Page><QuoteDetailPage /></Page></Guard>} />
                  <Route path="/quotes/:quoteId/approval" element={<Guard><Page><QuoteApprovalPage /></Page></Guard>} />
                  <Route path="/quotes/:quoteId/preview" element={<Guard><Page><QuotePreviewPage /></Page></Guard>} />
                  <Route path="/bookings" element={<Guard><Page><BookingListPage /></Page></Guard>} />
                  <Route path="/bookings/new" element={<Guard><Page><BookingNewPage /></Page></Guard>} />
                  <Route path="/bookings/:bookingId" element={<Guard><Page><BookingDetailPage /></Page></Guard>} />
                  <Route path="/customer/rfqs" element={<PersonaGuard roles={["customer"]}><Page><CustomerRfqsPage /></Page></PersonaGuard>} />
                  <Route path="/customer/quotes" element={<PersonaGuard roles={["customer"]}><Page><CustomerQuotesPage /></Page></PersonaGuard>} />
                  <Route path="/customer/quotes/:quoteId" element={<PersonaGuard roles={["customer"]}><Page><QuotePreviewPage portal /></Page></PersonaGuard>} />
                  <Route path="/shipments" element={<Guard><Page><ShipmentsPage /></Page></Guard>} />
                  <Route path="/shipments/new" element={<PersonaGuard roles={["admin", "operations"]}><Page><ShipmentCreatePage /></Page></PersonaGuard>} />
                  <Route path="/shipments/:shipmentId" element={<Guard><Page><Shipment360Page /></Page></Guard>} />
                  <Route path="/shipments/:shipmentId/journey" element={<Guard><Page><ShipmentJourneyPage /></Page></Guard>} />
                  <Route path="/shipments/:shipmentId/milestones" element={<Guard><Page><ShipmentMilestonesPage /></Page></Guard>} />
                  <Route path="/control-tower" element={<Guard><Page><ControlTowerPage /></Page></Guard>} />
                  <Route path="/control-tower/exceptions" element={<Guard><Page><ExceptionCenterPage /></Page></Guard>} />
                  <Route path="/documents" element={<Page>{ph("documents")}</Page>} />
                  <Route path="/customs" element={<Guard><Page>{ph("customs")}</Page></Guard>} />
                  <Route path="/warehouse" element={<Guard><Page>{ph("warehouse")}</Page></Guard>} />
                  <Route path="/vendors" element={<Guard><Page>{ph("vendors")}</Page></Guard>} />
                  <Route path="/finance" element={<Page>{ph("finance")}</Page>} />
                  <Route path="/reports" element={<Guard><Page>{ph("reports")}</Page></Guard>} />
                  <Route path="/settings" element={<Page>{ph("settings")}</Page>} />
                  <Route path="/admin/users" element={<Guard><Page>{ph("users")}</Page></Guard>} />
                  <Route path="/admin/roles" element={<Guard><Page>{ph("roles")}</Page></Guard>} />
                  <Route path="/admin/master-data" element={<Guard><Page>{ph("master-data")}</Page></Guard>} />
                  <Route path="/admin/audit" element={<Guard><Page>{ph("audit")}</Page></Guard>} />
                  <Route path="*" element={<Navigate to={home} replace />} />
                </Routes>
              </AnimatePresence>

              {loading && (
                <div className="pointer-events-none fixed bottom-4 right-4 z-[60] hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11.5px] text-steel-400 shadow-[0_8px_20px_-12px_rgba(16,44,73,0.4)] ring-1 ring-steel-400/15 md:inline-flex">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-steel-400/25 border-t-cargo-400" />
                  Loading workspace…
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <CommandPalette />
      <NotificationDrawer />
      <ShipmentPreviewDrawer />
      <Toast />
    </div>
    </ExecutionProvider>
    </CommercialProvider>
  );
}
