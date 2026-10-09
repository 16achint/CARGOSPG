import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  SEED_BOOKINGS, SEED_CUSTOMERS, SEED_QUOTES, SEED_RATES, SEED_RFQS,
  type BookingRec, type CustomerRec, type QuoteRec, type QuoteStatus, type RateRec, type RfqRec, type RfqStage,
} from "@/data/commercial";

export interface Flash { title: string; body?: string }

interface Ctx {
  customers: CustomerRec[];
  rfqs: RfqRec[];
  rates: RateRec[];
  quotes: QuoteRec[];
  bookings: BookingRec[];
  addCustomer: (c: CustomerRec) => void;
  addRfq: (r: RfqRec) => void;
  setRfqStage: (id: string, s: RfqStage) => void;
  addRfqNote: (id: string, body: string, visibility: "Internal" | "Customer") => void;
  setEvaluated: (id: string, rateIds: string[]) => void;
  addRate: (r: RateRec) => void;
  saveQuote: (q: QuoteRec) => void;
  setQuoteStatus: (id: string, s: QuoteStatus, comment?: string) => void;
  acceptQuote: (id: string, optionKey: string) => void;
  rejectQuote: (id: string, reason: string, comment?: string) => void;
  addBooking: (b: BookingRec) => void;
  customerById: (id: string) => CustomerRec | undefined;
  rfqById: (id: string) => RfqRec | undefined;
  quoteById: (id: string) => QuoteRec | undefined;
  bookingById: (id: string) => BookingRec | undefined;
  nextCustomerId: () => string;
  nextRfqId: () => string;
  nextBookingId: (rfqId: string) => string;
}

const Ctx = createContext<Ctx | null>(null);

const nowStamp = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en-US", { month: "short" })}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function CommercialProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<CustomerRec[]>(SEED_CUSTOMERS);
  const [rfqs, setRfqs] = useState<RfqRec[]>(SEED_RFQS);
  const [rates, setRates] = useState<RateRec[]>(SEED_RATES);
  const [quotes, setQuotes] = useState<QuoteRec[]>(SEED_QUOTES);
  const [bookings, setBookings] = useState<BookingRec[]>(SEED_BOOKINGS);

  const addCustomer = useCallback((c: CustomerRec) => setCustomers((p) => [c, ...p]), []);
  const addRfq = useCallback((r: RfqRec) => setRfqs((p) => [r, ...p]), []);
  const addRate = useCallback((r: RateRec) => setRates((p) => [r, ...p]), []);
  const addBooking = useCallback((b: BookingRec) => setBookings((p) => [b, ...p]), []);

  const setRfqStage = useCallback((id: string, s: RfqStage) => {
    setRfqs((p) => p.map((r) => (r.id === id ? { ...r, status: s } : r)));
  }, []);
  const addRfqNote = useCallback((id: string, body: string, visibility: "Internal" | "Customer") => {
    setRfqs((p) => p.map((r) => r.id === id
      ? { ...r, notes: [...r.notes, { at: nowStamp(), by: "You", body, visibility }] } : r));
  }, []);
  const setEvaluated = useCallback((id: string, rateIds: string[]) => {
    setRfqs((p) => p.map((r) => (r.id === id ? { ...r, evaluated: rateIds } : r)));
  }, []);

  const saveQuote = useCallback((q: QuoteRec) => {
    setQuotes((p) => (p.some((x) => x.id === q.id && x.version === q.version)
      ? p.map((x) => (x.id === q.id ? q : x))
      : [q, ...p]));
  }, []);

  const setQuoteStatus = useCallback((id: string, s: QuoteStatus, comment?: string) => {
    setQuotes((p) => p.map((q) => q.id === id
      ? { ...q, status: s, approvalComment: comment ?? q.approvalComment, history: [...q.history, { v: q.version, at: nowStamp(), by: "You", status: s }] }
      : q));
  }, []);

  const acceptQuote = useCallback((id: string, optionKey: string) => {
    setQuotes((p) => p.map((q) => q.id === id
      ? { ...q, status: "Accepted", acceptedOption: optionKey, history: [...q.history, { v: q.version, at: nowStamp(), by: "Customer", status: "Accepted" }] }
      : q));
    const q = quotes.find((x) => x.id === id);
    if (q) setRfqs((p) => p.map((r) => (r.id === q.rfqId ? { ...r, status: "Won" } : r)));
  }, [quotes]);

  const rejectQuote = useCallback((id: string, reason: string, comment?: string) => {
    setQuotes((p) => p.map((q) => q.id === id
      ? { ...q, status: "Rejected", rejectReason: reason, rejectComment: comment, history: [...q.history, { v: q.version, at: nowStamp(), by: "Customer", status: "Rejected" }] }
      : q));
    const q = quotes.find((x) => x.id === id);
    if (q) setRfqs((p) => p.map((r) => (r.id === q.rfqId ? { ...r, status: "Lost" } : r)));
  }, [quotes]);

  const customerById = useCallback((id: string) => customers.find((c) => c.id === id), [customers]);
  const rfqById = useCallback((id: string) => rfqs.find((r) => r.id === id), [rfqs]);
  const quoteById = useCallback((id: string) => quotes.find((q) => q.id === id), [quotes]);
  const bookingById = useCallback((id: string) => bookings.find((b) => b.id === id), [bookings]);

  const nextCustomerId = useCallback(() => {
    const n = customers.reduce((m, c) => Math.max(m, parseInt(c.id.slice(-6), 10) || 0), 0) + 1;
    return `SPG-CUS-${String(n).padStart(6, "0")}`;
  }, [customers]);
  const nextRfqId = useCallback(() => {
    const n = rfqs.reduce((m, r) => Math.max(m, parseInt(r.id.slice(-6), 10) || 0), 0) + 1;
    return `SPG-RFQ-${String(n).padStart(6, "0")}`;
  }, [rfqs]);
  const nextBookingId = useCallback((rfqId: string) => {
    const seq = rfqId.slice(-6);
    return `SPG-BKG-${seq}`;
  }, []);

  const value = useMemo<Ctx>(() => ({
    customers, rfqs, rates, quotes, bookings,
    addCustomer, addRfq, setRfqStage, addRfqNote, setEvaluated, addRate,
    saveQuote, setQuoteStatus, acceptQuote, rejectQuote, addBooking,
    customerById, rfqById, quoteById, bookingById, nextCustomerId, nextRfqId, nextBookingId,
  }), [customers, rfqs, rates, quotes, bookings, addCustomer, addRfq, setRfqStage, addRfqNote,
    setEvaluated, addRate, saveQuote, setQuoteStatus, acceptQuote, rejectQuote, addBooking,
    customerById, rfqById, quoteById, bookingById, nextCustomerId, nextRfqId, nextBookingId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommercial() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCommercial must be used inside CommercialProvider");
  return c;
}
