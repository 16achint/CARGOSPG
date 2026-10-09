import type { Mode } from "@/lib/geo";

/* ==========================================================
   SPG CargoOS — Phase 2 commercial data model + seed
   ========================================================== */

export type ContactType = "Primary" | "Commercial" | "Operations" | "Finance" | "Other";
export interface Contact { id: string; name: string; designation: string; email: string; phone: string; type: ContactType }

export interface CustomerRec {
  id: string; company: string; category: "Key Account" | "Regular" | "Prospect" | "Dormant";
  gstin: string; pan: string; iec: string;
  address: { line: string; city: string; state: string; country: string; postal: string };
  website?: string; industry?: string;
  contacts: Contact[];
  billing: { address: string; creditTerms: string; creditDays: number; currency: string; paymentTerms: string; creditLimit?: number };
  owner: string; status: "Active" | "On Hold" | "Prospect";
  ytd: number; outstanding: number; marginPct: number;
  openRfqs: number; activeQuotes: number; activeShipments: number;
  docs: { name: string; file?: string }[];
}

export interface Hazardous { un: string; hazardClass: string; packingGroup: "I" | "II" | "III" | ""; instructions: string }
export interface TempControl { min: string; max: string; unit: "°C" | "°F"; instructions: string }

export interface Cargo {
  commodity: string; description: string; packages: string; packageType: string;
  weight: string; weightUnit: "kg" | "MT"; volume: string; volumeUnit: "m³" | "ft³" | "cbm";
  dims: string; value: string; currency: string; containerType?: string;
  hazardous: "Yes" | "No" | ""; haz?: Hazardous;
  tempControlled: "Yes" | "No" | ""; temp?: TempControl;
}

export type ServiceType = "P2P" | "D2P" | "P2D" | "D2D";
export type ModeChoice = "recommend" | "ocean" | "air" | "road" | "rail" | "multimodal";

export interface RfqRec {
  id: string; customerId: string; customerRef: string;
  origin: string; originCode: string; destination: string; destCode: string;
  pickupDate: string; deliveryDate: string;
  cargo: Cargo; mode: ModeChoice; service: ServiceType;
  modeDetail: Record<string, string>;
  requirements: { insurance: boolean; customs: boolean; warehouse: boolean; pickup: boolean; delivery: boolean; instructions: string; internalNotes: string };
  status: RfqStage; owner: string; created: string; age: string;
  notes: { at: string; by: string; body: string; visibility: "Internal" | "Customer" }[];
  evaluated: string[]; // selected rate ids
}

export type RfqStage = "New" | "Qualified" | "Rate Sourcing" | "Quote Preparation" | "Quote Sent" | "Awaiting Customer" | "Won" | "Lost";
export const RFQ_STAGES: RfqStage[] = ["New", "Qualified", "Rate Sourcing", "Quote Preparation", "Quote Sent", "Awaiting Customer", "Won", "Lost"];
export const RFQ_STAGE_TONE: Record<RfqStage, "ok" | "warn" | "risk" | "info" | "cyan" | "neutral"> = {
  New: "info", Qualified: "cyan", "Rate Sourcing": "cyan", "Quote Preparation": "warn",
  "Quote Sent": "info", "Awaiting Customer": "warn", Won: "ok", Lost: "risk",
};

export type ChargeComponent =
  | "Freight" | "Origin" | "Transport" | "Customs" | "Documentation" | "Handling"
  | "Port" | "Warehouse" | "Destination" | "Insurance" | "Taxes" | "Other";
export const COMPONENTS: ChargeComponent[] = ["Freight", "Origin", "Transport", "Customs", "Documentation", "Handling", "Port", "Warehouse", "Destination", "Insurance", "Taxes", "Other"];

export interface RateRec {
  id: string; vendor: string; origin: string; destination: string; mode: Mode;
  chargeType: ChargeComponent; currency: "INR" | "USD"; amount: number;
  validFrom: string; validTo: string; transit?: string; notes?: string;
}
export type RateState = "Active" | "Expiring Soon" | "Expired";
export const rateState = (r: RateRec): RateState => {
  const to = new Date(r.validTo).getTime(), now = new Date("2025-10-06").getTime();
  const week = now + 7 * 864e5;
  if (to < now) return "Expired";
  if (to < week) return "Expiring Soon";
  return "Active";
};

export interface ChargeLine { key: string; component: ChargeComponent; vendor: string; cost: number; marginType: "Percent" | "Fixed"; margin: number; currency: "INR" | "USD"; rateId?: string }
export interface QuoteOption { key: string; name: string; mode: ModeChoice; transit: string; charges: ChargeLine[]; summary: string }

export type QuoteStatus = "Draft" | "Awaiting Approval" | "Approved" | "Sent" | "Awaiting Customer" | "Accepted" | "Rejected" | "Changes Requested" | "Expired";
export const QUOTE_TONE: Record<QuoteStatus, "ok" | "warn" | "risk" | "info" | "cyan" | "neutral"> = {
  Draft: "neutral", "Awaiting Approval": "warn", Approved: "ok", Sent: "info",
  "Awaiting Customer": "warn", Accepted: "ok", Rejected: "risk", "Changes Requested": "risk", Expired: "neutral",
};

export interface QuoteRec {
  id: string; version: number; rfqId: string; customerId: string;
  options: QuoteOption[]; validUntil: string; status: QuoteStatus; owner: string; created: string;
  acceptedOption?: string; rejectReason?: string; rejectComment?: string; approvalComment?: string;
  history: { v: number; at: string; by: string; status: string }[];
}

export interface BookingRec {
  id: string; quoteId: string; optionKey: string; rfqId: string; customerId: string;
  origin: string; destination: string; mode: ModeChoice; service: ServiceType; cargoSummary: string;
  sellingPrice: number; marginPct: number;
  ref: string; confirmDate: string; opsOwner: string; carrierRef: string;
  pickup: string; departure: string; arrival: string; notes: string;
  status: "Pending Confirmation" | "Confirmed" | "Ready for Operations" | "Cancelled";
}

export interface TimelineEvent { at: string; label: string; ref?: string; by?: string; tone?: "ok" | "warn" | "risk" | "info" | "cyan" | "neutral" }

/* ---------------- Locations ---------------- */
export const LOCATIONS: { city: string; code: string; country: string }[] = [
  { city: "Pune", code: "INPNQ", country: "India" }, { city: "Mumbai", code: "INBOM", country: "India" },
  { city: "Nhava Sheva", code: "INNSA", country: "India" }, { city: "Chennai", code: "INMAA", country: "India" },
  { city: "Mundra", code: "INMUN", country: "India" }, { city: "Delhi", code: "INDEL", country: "India" },
  { city: "ICD Tughlakabad", code: "INTKD", country: "India" }, { city: "Kolkata", code: "INCCU", country: "India" },
  { city: "Singapore", code: "SGSIN", country: "Singapore" }, { city: "Jebel Ali", code: "AEJEA", country: "UAE" },
  { city: "Shanghai", code: "CNSHA", country: "China" }, { city: "Rotterdam", code: "NLRTM", country: "Netherlands" },
  { city: "Hamburg", code: "DEHAM", country: "Germany" }, { city: "Antwerp", code: "BEANR", country: "Belgium" },
  { city: "Felixstowe", code: "GBFXT", country: "United Kingdom" }, { city: "Frankfurt", code: "DEFRA", country: "Germany" },
  { city: "Houston", code: "USHOU", country: "United States" }, { city: "New York", code: "USNYC", country: "United States" },
  { city: "Chicago", code: "USCHI", country: "United States" }, { city: "Los Angeles", code: "USLAX", country: "United States" },
  { city: "Memphis", code: "USMEM", country: "United States" }, { city: "Sydney", code: "AUSYD", country: "Australia" },
  { city: "Jeddah", code: "SAJED", country: "Saudi Arabia" }, { city: "Colombo", code: "LKCMB", country: "Sri Lanka" },
];
export const loc = (city: string) => LOCATIONS.find((l) => l.city === city);

export const SERVICE_INFO: Record<ServiceType, { label: string; text: string }> = {
  P2P: { label: "Port to Port", text: "Carrier move between two ports. You handle all inland legs." },
  D2P: { label: "Door to Port", text: "We collect at origin and deliver to the destination port." },
  P2D: { label: "Port to Door", text: "Port pickup at origin, delivered to the consignee address." },
  D2D: { label: "Door to Door", text: "End-to-end. Collection at origin and final delivery included." },
};

export const MODE_INFO: { id: ModeChoice; label: string; hint: string }[] = [
  { id: "recommend", label: "Recommend Best", hint: "Let CargoOS pick the optimal mode" },
  { id: "ocean", label: "Ocean", hint: "FCL, LCL, reefer, breakbulk" },
  { id: "air", label: "Air", hint: "Priority or standard air freight" },
  { id: "road", label: "Road", hint: "FTL, PTL, first and last mile" },
  { id: "rail", label: "Rail", hint: "Container, ICD and port movement" },
  { id: "multimodal", label: "Multimodal", hint: "Combined road, sea, air and rail" },
];

/* ---------------- Seed customers ---------------- */
const c = (n: string, d: string, e: string, p: string, t: ContactType): Contact => ({ id: `ct-${n}`, name: n, designation: d, email: e, phone: p, type: t });

export const SEED_CUSTOMERS: CustomerRec[] = [
  {
    id: "SPG-CUS-000128", company: "Apex Components Pvt Ltd", category: "Key Account",
    gstin: "27AABCA1234F1Z5", pan: "AABCA1234F", iec: "0398012345",
    address: { line: "Plot 42, MIDC Bhosari", city: "Pune", state: "Maharashtra", country: "India", postal: "411026" },
    website: "apexcomponents.com", industry: "Industrial Components",
    contacts: [
      c("Anita Deshpande", "Head of Logistics", "anita@apexcomponents.com", "+91 98200 41122", "Primary"),
      c("Rohit Bakshi", "Purchase Manager", "rohit@apexcomponents.com", "+91 98200 41123", "Commercial"),
      c("Sneha Kale", "Dispatch Coordinator", "sneha@apexcomponents.com", "+91 98200 41124", "Operations"),
    ],
    billing: { address: "Plot 42, MIDC Bhosari, Pune 411026", creditTerms: "Net 30", creditDays: 30, currency: "INR", paymentTerms: "30 days from invoice date", creditLimit: 5000000 },
    owner: "Arjun Sharma", status: "Active", ytd: 21400000, outstanding: 492000, marginPct: 18.8,
    openRfqs: 2, activeQuotes: 2, activeShipments: 6,
    docs: [{ name: "GST Certificate", file: "GST-Apex-2025.pdf" }, { name: "PAN", file: "PAN-AABCA1234F.pdf" }, { name: "IEC", file: "IEC-0398012345.pdf" }],
  },
  {
    id: "SPG-CUS-000131", company: "Northwind Machinery GmbH", category: "Key Account",
    gstin: "—", pan: "—", iec: "—",
    address: { line: "Hafenstraße 118", city: "Hamburg", state: "Hamburg", country: "Germany", postal: "20359" },
    website: "northwind-machinery.de", industry: "Machine Tools",
    contacts: [c("Lars Behrend", "Supply Chain Director", "lars@northwind.de", "+49 40 5588 2210", "Primary"), c("Petra Lang", "Accounts Payable", "petra@northwind.de", "+49 40 5588 2244", "Finance")],
    billing: { address: "Hafenstraße 118, 20359 Hamburg", creditTerms: "Net 45", creditDays: 45, currency: "EUR", paymentTerms: "45 days from invoice date", creditLimit: 8000000 },
    owner: "Rhea Kulkarni", status: "Active", ytd: 16800000, outstanding: 612000, marginPct: 13.7,
    openRfqs: 1, activeQuotes: 1, activeShipments: 4,
    docs: [{ name: "Company Registration", file: "HRB-Northwind.pdf" }],
  },
  {
    id: "SPG-CUS-000134", company: "Solaris Renewables Ltd", category: "Regular",
    gstin: "29AAKCS5678L1ZP", pan: "AAKCS5678L", iec: "0902076543",
    address: { line: "Survey 118, Bommasandra Industrial Area", city: "Bengaluru", state: "Karnataka", country: "India", postal: "560099" },
    industry: "Renewable Energy",
    contacts: [c("Manoj Rao", "VP Procurement", "manoj@solaris.in", "+91 80 4123 8890", "Primary")],
    billing: { address: "Survey 118, Bommasandra, Bengaluru 560099", creditTerms: "Net 30", creditDays: 30, currency: "INR", paymentTerms: "30 days from invoice date" },
    owner: "Arjun Sharma", status: "Active", ytd: 9640000, outstanding: 0, marginPct: 15.6,
    openRfqs: 1, activeQuotes: 1, activeShipments: 3,
    docs: [{ name: "GST Certificate", file: "GST-Solaris.pdf" }],
  },
  {
    id: "SPG-CUS-000137", company: "Kestrel Automotive Inc", category: "Key Account",
    gstin: "—", pan: "—", iec: "—",
    address: { line: "4410 Distribution Way", city: "Memphis", state: "Tennessee", country: "United States", postal: "38118" },
    industry: "Automotive",
    contacts: [c("Dana Whitfield", "Import Manager", "dana@kestrelauto.com", "+1 901 555 4410", "Primary")],
    billing: { address: "4410 Distribution Way, Memphis TN 38118", creditTerms: "Net 30", creditDays: 30, currency: "USD", paymentTerms: "30 days from invoice date", creditLimit: 12000000 },
    owner: "Sanjay Patil", status: "Active", ytd: 13200000, outstanding: 182000, marginPct: 16.2,
    openRfqs: 0, activeQuotes: 1, activeShipments: 4,
    docs: [],
  },
  {
    id: "SPG-CUS-000140", company: "Meridian Pharma plc", category: "Regular",
    gstin: "—", pan: "—", iec: "—",
    address: { line: "12 Ringsend Road", city: "Dublin", state: "Leinster", country: "Ireland", postal: "D04" },
    industry: "Pharmaceuticals",
    contacts: [c("Saoirse Byrne", "Logistics Lead", "saoirse@meridianpharma.ie", "+353 1 555 3390", "Primary")],
    billing: { address: "12 Ringsend Road, Dublin D04", creditTerms: "Net 30", creditDays: 30, currency: "EUR", paymentTerms: "30 days from invoice date" },
    owner: "Rhea Kulkarni", status: "Active", ytd: 7410000, outstanding: 342000, marginPct: 22.4,
    openRfqs: 0, activeQuotes: 0, activeShipments: 2,
    docs: [],
  },
  {
    id: "SPG-CUS-000143", company: "Highland Textiles Ltd", category: "Regular",
    gstin: "—", pan: "—", iec: "—",
    address: { line: "Unit 7, Festival Park", city: "Felixstowe", state: "Suffolk", country: "United Kingdom", postal: "IP11" },
    industry: "Textiles",
    contacts: [c("Gwen Harlow", "Shipping Manager", "gwen@highlandtex.co.uk", "+44 1394 555 118", "Primary")],
    billing: { address: "Unit 7, Festival Park, Felixstowe IP11", creditTerms: "Net 30", creditDays: 30, currency: "GBP", paymentTerms: "30 days from invoice date" },
    owner: "Sanjay Patil", status: "Active", ytd: 5280000, outstanding: 402000, marginPct: 13.2,
    openRfqs: 0, activeQuotes: 1, activeShipments: 2,
    docs: [],
  },
  {
    id: "SPG-CUS-000146", company: "Orbit Electronics Pte Ltd", category: "Regular",
    gstin: "—", pan: "—", iec: "—",
    address: { line: "8 Boon Lay Way", city: "Singapore", state: "Jurong", country: "Singapore", postal: "609964" },
    industry: "Electronics",
    contacts: [c("Wei Lin Tan", "Procurement", "weilin@orbitelectronics.sg", "+65 6555 8842", "Primary")],
    billing: { address: "8 Boon Lay Way, Singapore 609964", creditTerms: "Net 30", creditDays: 30, currency: "USD", paymentTerms: "30 days from invoice date" },
    owner: "Arjun Sharma", status: "Active", ytd: 8860000, outstanding: 0, marginPct: 16.2,
    openRfqs: 0, activeQuotes: 0, activeShipments: 3,
    docs: [],
  },
  {
    id: "SPG-CUS-000149", company: "Cobalt Steel Works LLC", category: "Prospect",
    gstin: "—", pan: "—", iec: "—",
    address: { line: "Warehouse 14, Jebel Ali Free Zone", city: "Dubai", state: "Dubai", country: "UAE", postal: "00000" },
    industry: "Steel Fabrication",
    contacts: [c("Omar Haddad", "Operations Head", "omar@cobaltsteel.ae", "+971 4 555 7712", "Primary")],
    billing: { address: "Warehouse 14, JAFZA, Dubai", creditTerms: "Advance", creditDays: 0, currency: "USD", paymentTerms: "100% advance" },
    owner: "Rhea Kulkarni", status: "Prospect", ytd: 10500000, outstanding: 288000, marginPct: 12.8,
    openRfqs: 0, activeQuotes: 0, activeShipments: 4,
    docs: [],
  },
];

/* ---------------- Seed RFQs ---------------- */
const baseCargo = (over: Partial<Cargo> = {}): Cargo => ({
  commodity: "Industrial components", description: "Machined assemblies, crated",
  packages: "42", packageType: "Wooden crates", weight: "8600", weightUnit: "kg",
  volume: "34", volumeUnit: "cbm", dims: "120×80×110 cm", value: "42,00,000", currency: "INR",
  containerType: "2 × 40HC", hazardous: "No", tempControlled: "No", ...over,
});

export const SEED_RFQS: RfqRec[] = [
  {
    id: "SPG-RFQ-000128", customerId: "SPG-CUS-000128", customerRef: "APEX/PO-8841",
    origin: "Pune", originCode: "INPNQ", destination: "Houston", destCode: "USHOU",
    pickupDate: "2025-10-14", deliveryDate: "2025-11-18",
    cargo: baseCargo(), mode: "ocean", service: "D2D",
    modeDetail: { loadType: "FCL", container: "2 × 40HC" },
    requirements: { insurance: true, customs: true, warehouse: false, pickup: true, delivery: true, instructions: "Cargo must not be double-stacked.", internalNotes: "Customer pushing for 16% margin minimum on this lane." },
    status: "Quote Preparation", owner: "Arjun Sharma", created: "09 Oct, 10:12", age: "2 d",
    notes: [
      { at: "09 Oct, 10:12", by: "Customer", body: "Enquiry received for 2 containers to Houston, required mid-November delivery.", visibility: "Customer" },
      { at: "09 Oct, 11:40", by: "Arjun Sharma", body: "Requested confirmation on crate dimensions and gross weight.", visibility: "Customer" },
      { at: "09 Oct, 12:05", by: "Customer", body: "Updated dimensions to 120×80×110 cm, gross 8,600 kg.", visibility: "Customer" },
      { at: "09 Oct, 12:20", by: "Arjun Sharma", body: "Rate request circulated to three ocean NVOCCs.", visibility: "Internal" },
    ],
    evaluated: [],
  },
  {
    id: "SPG-RFQ-000129", customerId: "SPG-CUS-000131", customerRef: "NW-2025-4471",
    origin: "Chennai", originCode: "INMAA", destination: "Hamburg", destCode: "DEHAM",
    pickupDate: "2025-10-18", deliveryDate: "2025-11-22",
    cargo: baseCargo({ commodity: "Machine spares", packages: "18", packageType: "Pallets", weight: "5400", volume: "22", value: "61,20,000", containerType: "3 × 40HC" }),
    mode: "ocean", service: "D2P",
    modeDetail: { loadType: "FCL", container: "3 × 40HC" },
    requirements: { insurance: true, customs: true, warehouse: false, pickup: true, delivery: false, instructions: "", internalNotes: "" },
    status: "Rate Sourcing", owner: "Rhea Kulkarni", created: "09 Oct, 14:02", age: "2 d",
    notes: [{ at: "09 Oct, 14:02", by: "Customer", body: "Enquiry received for 3 containers to Hamburg.", visibility: "Customer" }],
    evaluated: [],
  },
  {
    id: "SPG-RFQ-000130", customerId: "SPG-CUS-000134", customerRef: "SOL/ENQ-2290",
    origin: "ICD Tughlakabad", originCode: "INTKD", destination: "Rotterdam", destCode: "NLRTM",
    pickupDate: "2025-10-20", deliveryDate: "2025-11-26",
    cargo: baseCargo({ commodity: "Solar inverters", packages: "26", packageType: "Cartons", weight: "4200", value: "49,60,000", containerType: "2 × 40HC" }),
    mode: "rail", service: "P2D",
    modeDetail: { railType: "Container" },
    requirements: { insurance: false, customs: true, warehouse: false, pickup: false, delivery: true, instructions: "", internalNotes: "" },
    status: "Won", owner: "Arjun Sharma", created: "08 Oct, 09:44", age: "3 d",
    notes: [{ at: "08 Oct, 09:44", by: "Customer", body: "Enquiry received for solar equipment to Rotterdam.", visibility: "Customer" }],
    evaluated: [],
  },
  {
    id: "SPG-RFQ-000131", customerId: "SPG-CUS-000128", customerRef: "APEX/PO-8852",
    origin: "Pune", originCode: "INPNQ", destination: "Mundra", destCode: "INMUN",
    pickupDate: "2025-10-09", deliveryDate: "2025-10-11",
    cargo: baseCargo({ commodity: "Fasteners", packages: "8", packageType: "Drums", weight: "3100", volume: "11", containerType: "FTL · 32ft" }),
    mode: "road", service: "D2P",
    modeDetail: { loadType: "FTL", vehicle: "32 ft MXL" },
    requirements: { insurance: false, customs: false, warehouse: false, pickup: true, delivery: false, instructions: "", internalNotes: "" },
    status: "Won", owner: "Sanjay Patil", created: "05 Oct, 16:30", age: "6 d",
    notes: [], evaluated: [],
  },
  {
    id: "SPG-RFQ-000132", customerId: "SPG-CUS-000137", customerRef: "KES-77120",
    origin: "Frankfurt", originCode: "DEFRA", destination: "Mumbai", destCode: "INBOM",
    pickupDate: "2025-10-16", deliveryDate: "2025-10-19",
    cargo: baseCargo({ commodity: "Pharma cold chain", packages: "12", packageType: "Insulated boxes", weight: "1240", volume: "6", value: "34,20,000", containerType: "1,240 kg chargeable", hazardous: "No", tempControlled: "Yes", temp: { min: "2", max: "8", unit: "°C", instructions: "Maintain 2–8 °C, do not break the cold chain." } }),
    mode: "air", service: "D2D",
    modeDetail: { priority: "Priority" },
    requirements: { insurance: true, customs: true, warehouse: false, pickup: true, delivery: true, instructions: "Temperature data logger required.", internalNotes: "" },
    status: "New", owner: "Unassigned", created: "10 Oct, 08:15", age: "1 d",
    notes: [], evaluated: [],
  },
  {
    id: "SPG-RFQ-000133", customerId: "SPG-CUS-000143", customerRef: "HT-4471",
    origin: "Mumbai", originCode: "INBOM", destination: "Felixstowe", destCode: "GBFXT",
    pickupDate: "2025-10-22", deliveryDate: "2025-11-28",
    cargo: baseCargo({ commodity: "Cotton textiles", packages: "64", packageType: "Bales", weight: "12800", volume: "48", value: "40,20,000", containerType: "2 × 40HC" }),
    mode: "ocean", service: "D2D",
    modeDetail: { loadType: "FCL", container: "2 × 40HC" },
    requirements: { insurance: true, customs: true, warehouse: false, pickup: true, delivery: true, instructions: "", internalNotes: "" },
    status: "Qualified", owner: "Sanjay Patil", created: "07 Oct, 11:20", age: "4 d",
    notes: [], evaluated: [],
  },
  {
    id: "SPG-RFQ-000134", customerId: "SPG-CUS-000149", customerRef: "CS-2201",
    origin: "Mundra", originCode: "INMUN", destination: "Jebel Ali", destCode: "AEJEA",
    pickupDate: "2025-10-11", deliveryDate: "2025-10-18",
    cargo: baseCargo({ commodity: "Steel fabrications", packages: "9", packageType: "Loose", weight: "21000", volume: "26", value: "28,80,000", containerType: "1 × 40OT", hazardous: "No" }),
    mode: "ocean", service: "P2P",
    modeDetail: { loadType: "Breakbulk" },
    requirements: { insurance: false, customs: true, warehouse: false, pickup: false, delivery: false, instructions: "", internalNotes: "" },
    status: "Lost", owner: "Rhea Kulkarni", created: "02 Oct, 10:05", age: "9 d",
    notes: [], evaluated: [],
  },
  {
    id: "SPG-RFQ-000135", customerId: "SPG-CUS-000146", customerRef: "OE-9930",
    origin: "Singapore", originCode: "SGSIN", destination: "Sydney", destCode: "AUSYD",
    pickupDate: "2025-10-13", deliveryDate: "2025-10-24",
    cargo: baseCargo({ commodity: "Electronic assemblies", packages: "15", packageType: "Cartons", weight: "2100", volume: "9", value: "18,20,000", containerType: "1 × 20HC" }),
    mode: "ocean", service: "P2P",
    modeDetail: { loadType: "FCL", container: "1 × 20HC" },
    requirements: { insurance: true, customs: false, warehouse: false, pickup: false, delivery: false, instructions: "", internalNotes: "" },
    status: "Quote Sent", owner: "Arjun Sharma", created: "05 Oct, 13:10", age: "6 d",
    notes: [], evaluated: [],
  },
  {
    id: "SPG-RFQ-000136", customerId: "SPG-CUS-000140", customerRef: "MP-5521",
    origin: "Antwerp", originCode: "BEANR", destination: "Chennai", destCode: "INMAA",
    pickupDate: "2025-10-28", deliveryDate: "2025-12-04",
    cargo: baseCargo({ commodity: "Pharma raw material", packages: "20", packageType: "Drums", weight: "6800", volume: "18", value: "46,80,000", containerType: "1 × 40HC RF", tempControlled: "Yes", temp: { min: "15", max: "25", unit: "°C", instructions: "Keep between 15 and 25 °C." } }),
    mode: "ocean", service: "D2D",
    modeDetail: { loadType: "FCL", container: "1 × 40HC RF", reefer: "Yes" },
    requirements: { insurance: true, customs: true, warehouse: true, pickup: true, delivery: true, instructions: "", internalNotes: "" },
    status: "New", owner: "Unassigned", created: "10 Oct, 09:50", age: "1 d",
    notes: [], evaluated: [],
  },
  {
    id: "SPG-RFQ-000127", customerId: "SPG-CUS-000128", customerRef: "APEX/PO-8802",
    origin: "Pune", originCode: "INPNQ", destination: "Chennai", destCode: "INMAA",
    pickupDate: "2025-10-02", deliveryDate: "2025-10-06",
    cargo: baseCargo({ commodity: "Bearings", packages: "14", packageType: "Crates", weight: "5600", volume: "16", containerType: "PTL" }),
    mode: "road", service: "D2D",
    modeDetail: { loadType: "PTL" },
    requirements: { insurance: false, customs: false, warehouse: false, pickup: true, delivery: true, instructions: "", internalNotes: "" },
    status: "Won", owner: "Sanjay Patil", created: "01 Oct, 10:00", age: "10 d",
    notes: [], evaluated: [],
  },
];

/* ---------------- Seed rates ---------------- */
interface RateSeed { v: string; ct: ChargeComponent; amt: number; from: string; to: string; transit?: string; mode?: Mode; cur?: "INR" | "USD" }
const LANE_RATES: Record<string, RateSeed[]> = {
  "Pune|Houston": [
    { v: "Meridian Line", ct: "Freight", amt: 205000, from: "2025-09-01", to: "2025-12-31", transit: "24 days" },
    { v: "Pacific Container Line", ct: "Freight", amt: 232000, from: "2025-09-01", to: "2025-12-31", transit: "11 days" },
    { v: "Atlas Project Cargo", ct: "Freight", amt: 188000, from: "2025-09-01", to: "2025-10-12", transit: "18 days" },
    { v: "Deccan Roadways", ct: "Transport", amt: 42000, from: "2025-09-15", to: "2025-12-15", transit: "1 day" },
    { v: "Sahyadri Transport", ct: "Transport", amt: 36000, from: "2025-09-15", to: "2025-12-15", transit: "2 days" },
    { v: "Gulf Customs House", ct: "Customs", amt: 34000, from: "2025-08-01", to: "2026-01-31" },
    { v: "Gulf Customs House", ct: "Documentation", amt: 14000, from: "2025-08-01", to: "2026-01-31" },
    { v: "Harbour Warehousing Co", ct: "Origin", amt: 18000, from: "2025-09-01", to: "2025-11-30" },
    { v: "Harbour Warehousing Co", ct: "Port", amt: 22000, from: "2025-09-01", to: "2025-11-30" },
    { v: "Pacific Container Line", ct: "Destination", amt: 48000, from: "2025-09-01", to: "2025-12-31", transit: "2 days" },
    { v: "Deccan Roadways", ct: "Destination", amt: 39000, from: "2025-09-01", to: "2025-12-31", transit: "3 days" },
    { v: "Meridian Line", ct: "Handling", amt: 12500, from: "2025-09-01", to: "2025-12-31" },
    { v: "SPG In-house", ct: "Insurance", amt: 16800, from: "2025-01-01", to: "2026-12-31" },
    { v: "SPG In-house", ct: "Taxes", amt: 9400, from: "2025-01-01", to: "2026-12-31" },
  ],
  "Chennai|Hamburg": [
    { v: "Meridian Line", ct: "Freight", amt: 268000, from: "2025-09-01", to: "2025-12-31", transit: "28 days" },
    { v: "Pacific Container Line", ct: "Freight", amt: 289000, from: "2025-09-01", to: "2025-12-31", transit: "22 days" },
    { v: "Deccan Roadways", ct: "Transport", amt: 38000, from: "2025-09-15", to: "2025-12-15", transit: "2 days" },
    { v: "Gulf Customs House", ct: "Customs", amt: 41000, from: "2025-08-01", to: "2026-01-31" },
    { v: "Gulf Customs House", ct: "Documentation", amt: 16000, from: "2025-08-01", to: "2026-01-31" },
    { v: "Bavaria Trucking GmbH", ct: "Destination", amt: 44000, from: "2025-09-01", to: "2025-12-31", transit: "2 days" },
    { v: "Harbour Warehousing Co", ct: "Origin", amt: 19000, from: "2025-09-01", to: "2025-11-30" },
  ],
  "ICD Tughlakabad|Rotterdam": [
    { v: "Inland Rail Logistics", ct: "Transport", amt: 88000, from: "2025-09-01", to: "2025-12-31", transit: "26 hrs" },
    { v: "Meridian Line", ct: "Freight", amt: 296000, from: "2025-09-01", to: "2025-12-31", transit: "26 days" },
    { v: "Gulf Customs House", ct: "Customs", amt: 39000, from: "2025-08-01", to: "2026-01-31" },
    { v: "Gulf Customs House", ct: "Documentation", amt: 15000, from: "2025-08-01", to: "2026-01-31" },
  ],
  "Pune|Mundra": [
    { v: "Deccan Roadways", ct: "Transport", amt: 42000, from: "2025-09-01", to: "2025-12-31", transit: "38 hrs" },
    { v: "Sahyadri Transport", ct: "Transport", amt: 35500, from: "2025-09-01", to: "2025-10-09", transit: "44 hrs" },
    { v: "Harbour Warehousing Co", ct: "Origin", amt: 12000, from: "2025-09-01", to: "2025-12-31" },
  ],
  "Frankfurt|Mumbai": [
    { v: "SkyBridge Air Cargo", ct: "Freight", amt: 268000, from: "2025-09-01", to: "2025-12-31", transit: "2 days", mode: "air" },
    { v: "SkyBridge Air Cargo", ct: "Freight", amt: 322000, from: "2025-09-01", to: "2025-12-31", transit: "1 day", mode: "air" },
    { v: "Bavaria Trucking GmbH", ct: "Origin", amt: 24000, from: "2025-09-01", to: "2025-12-31", transit: "4 hrs", mode: "truck" },
    { v: "Deccan Roadways", ct: "Destination", amt: 21000, from: "2025-09-01", to: "2025-12-31", transit: "6 hrs", mode: "truck" },
    { v: "Gulf Customs House", ct: "Customs", amt: 28000, from: "2025-08-01", to: "2026-01-31", mode: "air" },
    { v: "Gulf Customs House", ct: "Documentation", amt: 9500, from: "2025-08-01", to: "2026-01-31", mode: "air" },
    { v: "SPG In-house", ct: "Insurance", amt: 13600, from: "2025-01-01", to: "2026-12-31", mode: "air" },
  ],
  "Mumbai|Felixstowe": [
    { v: "Meridian Line", ct: "Freight", amt: 246000, from: "2025-09-01", to: "2025-12-31", transit: "26 days" },
    { v: "Pacific Container Line", ct: "Freight", amt: 259000, from: "2025-09-01", to: "2025-12-31", transit: "21 days" },
    { v: "Deccan Roadways", ct: "Transport", amt: 34000, from: "2025-09-15", to: "2025-12-15", transit: "1 day" },
    { v: "Gulf Customs House", ct: "Customs", amt: 36000, from: "2025-08-01", to: "2026-01-31" },
    { v: "Gulf Customs House", ct: "Documentation", amt: 15000, from: "2025-08-01", to: "2026-01-31" },
  ],
  "Singapore|Sydney": [
    { v: "Pacific Container Line", ct: "Freight", amt: 118000, from: "2025-09-01", to: "2025-12-31", transit: "9 days" },
    { v: "Meridian Line", ct: "Freight", amt: 132000, from: "2025-09-01", to: "2025-12-31", transit: "7 days" },
    { v: "Gulf Customs House", ct: "Documentation", amt: 8800, from: "2025-08-01", to: "2026-01-31" },
  ],
  "Antwerp|Chennai": [
    { v: "Meridian Line", ct: "Freight", amt: 312000, from: "2025-09-01", to: "2025-12-31", transit: "28 days" },
    { v: "Bavaria Trucking GmbH", ct: "Origin", amt: 28000, from: "2025-09-01", to: "2025-12-31", transit: "5 hrs", mode: "truck" },
    { v: "Gulf Customs House", ct: "Customs", amt: 44000, from: "2025-08-01", to: "2026-01-31" },
    { v: "Harbour Warehousing Co", ct: "Warehouse", amt: 22000, from: "2025-09-01", to: "2025-11-30" },
    { v: "Deccan Roadways", ct: "Destination", amt: 26000, from: "2025-09-01", to: "2025-12-31", transit: "2 days", mode: "truck" },
  ],
  "Mundra|Jebel Ali": [
    { v: "Pacific Container Line", ct: "Freight", amt: 158000, from: "2025-09-01", to: "2025-12-31", transit: "6 days" },
    { v: "Atlas Project Cargo", ct: "Freight", amt: 142000, from: "2025-08-01", to: "2025-10-05", transit: "8 days" },
    { v: "Gulf Customs House", ct: "Customs", amt: 24000, from: "2025-08-01", to: "2026-01-31" },
  ],
  "Pune|Chennai": [
    { v: "Deccan Roadways", ct: "Transport", amt: 48000, from: "2025-09-01", to: "2025-12-31", transit: "2 days" },
    { v: "Sahyadri Transport", ct: "Transport", amt: 41000, from: "2025-09-01", to: "2025-12-31", transit: "3 days" },
  ],
};

let rateSeq = 4400;
export const SEED_RATES: RateRec[] = Object.entries(LANE_RATES).flatMap(([lane, arr]) => {
  const [origin, destination] = lane.split("|");
  return arr.map((r) => ({
    id: `RT-${++rateSeq}`, vendor: r.v, origin, destination, mode: r.mode ?? "ocean",
    chargeType: r.ct, currency: r.cur ?? "INR", amount: r.amt,
    validFrom: r.from, validTo: r.to, transit: r.transit,
  }));
});

/* ---------------- Seed quotes ---------------- */
const mkCharges = (rows: [ChargeComponent, string, number, number][]): ChargeLine[] =>
  rows.map(([component, vendor, cost, margin], i) => ({ key: `cl-${i}`, component, vendor, cost, marginType: "Percent", margin, currency: "INR" as const }));

export const SEED_QUOTES: QuoteRec[] = [
  {
    id: "SPG-QUO-000128", version: 2, rfqId: "SPG-RFQ-000128", customerId: "SPG-CUS-000128",
    validUntil: "2025-10-24", status: "Awaiting Approval", owner: "Arjun Sharma", created: "10 Oct, 11:05",
    options: [
      { key: "A", name: "Fastest", mode: "ocean", transit: "11 days", summary: "Priority vessel via Singapore", charges: mkCharges([["Freight", "Pacific Container Line", 232000, 16], ["Transport", "Deccan Roadways", 42000, 14], ["Origin", "Harbour Warehousing Co", 18000, 18], ["Port", "Harbour Warehousing Co", 22000, 15], ["Customs", "Gulf Customs House", 34000, 20], ["Documentation", "Gulf Customs House", 14000, 22], ["Handling", "Meridian Line", 12500, 18], ["Destination", "Pacific Container Line", 48000, 16]]) },
      { key: "B", name: "Balanced", mode: "ocean", transit: "14 days", summary: "Standard service, good margin", charges: mkCharges([["Freight", "Meridian Line", 205000, 19], ["Transport", "Deccan Roadways", 42000, 15], ["Origin", "Harbour Warehousing Co", 18000, 18], ["Port", "Harbour Warehousing Co", 22000, 15], ["Customs", "Gulf Customs House", 34000, 20], ["Documentation", "Gulf Customs House", 14000, 22], ["Handling", "Meridian Line", 12500, 18], ["Destination", "Deccan Roadways", 39000, 15], ["Insurance", "SPG In-house", 16800, 25]]) },
      { key: "C", name: "Economical", mode: "ocean", transit: "18 days", summary: "Lowest landed cost", charges: mkCharges([["Freight", "Atlas Project Cargo", 188000, 21], ["Transport", "Sahyadri Transport", 36000, 15], ["Origin", "Harbour Warehousing Co", 18000, 18], ["Port", "Harbour Warehousing Co", 22000, 15], ["Customs", "Gulf Customs House", 34000, 20], ["Documentation", "Gulf Customs House", 14000, 22], ["Destination", "Deccan Roadways", 39000, 15]]) },
    ],
    history: [
      { v: 1, at: "09 Oct, 14:15", by: "Arjun Sharma", status: "Draft" },
      { v: 1, at: "09 Oct, 15:02", by: "Arjun Sharma", status: "Awaiting Approval" },
      { v: 1, at: "10 Oct, 09:20", by: "Vikram Nair", status: "Changes Requested" },
      { v: 2, at: "10 Oct, 11:05", by: "Arjun Sharma", status: "Awaiting Approval" },
    ],
  },
  {
    id: "SPG-QUO-000130", version: 1, rfqId: "SPG-RFQ-000130", customerId: "SPG-CUS-000134",
    validUntil: "2025-10-22", status: "Accepted", owner: "Arjun Sharma", created: "09 Oct, 16:40", acceptedOption: "A",
    options: [
      { key: "A", name: "Rail + Ocean", mode: "multimodal", transit: "28 days", summary: "ICD rail to Mundra then ocean", charges: mkCharges([["Freight", "Meridian Line", 296000, 17], ["Transport", "Inland Rail Logistics", 88000, 15], ["Customs", "Gulf Customs House", 39000, 20], ["Documentation", "Gulf Customs House", 15000, 22]]) },
      { key: "B", name: "Road + Ocean", mode: "multimodal", transit: "31 days", summary: "Road to Mundra then ocean", charges: mkCharges([["Freight", "Meridian Line", 296000, 17], ["Transport", "Deccan Roadways", 118000, 15], ["Customs", "Gulf Customs House", 39000, 20], ["Documentation", "Gulf Customs House", 15000, 22]]) },
    ],
    history: [{ v: 1, at: "09 Oct, 16:40", by: "Arjun Sharma", status: "Sent" }, { v: 1, at: "10 Oct, 08:20", by: "Solaris Renewables", status: "Accepted" }],
  },
  {
    id: "SPG-QUO-000127", version: 1, rfqId: "SPG-RFQ-000135", customerId: "SPG-CUS-000146",
    validUntil: "2025-10-05", status: "Expired", owner: "Arjun Sharma", created: "05 Oct, 13:10",
    options: [{ key: "A", name: "Standard", mode: "ocean", transit: "9 days", summary: "Direct service", charges: mkCharges([["Freight", "Pacific Container Line", 118000, 16], ["Documentation", "Gulf Customs House", 8800, 22]]) }],
    history: [{ v: 1, at: "05 Oct, 13:10", by: "Arjun Sharma", status: "Sent" }],
  },
  {
    id: "SPG-QUO-000126", version: 1, rfqId: "SPG-RFQ-000131", customerId: "SPG-CUS-000128",
    validUntil: "2025-10-20", status: "Accepted", owner: "Sanjay Patil", created: "06 Oct, 10:15",
    acceptedOption: "A",
    options: [{ key: "A", name: "Standard FTL", mode: "road", transit: "38 hrs", summary: "Direct 32 ft MXL", charges: mkCharges([["Transport", "Deccan Roadways", 42000, 24], ["Origin", "Harbour Warehousing Co", 12000, 18]]) }],
    history: [{ v: 1, at: "06 Oct, 10:15", by: "Sanjay Patil", status: "Accepted" }],
  },
  {
    id: "SPG-QUO-000124", version: 1, rfqId: "SPG-RFQ-000134", customerId: "SPG-CUS-000149",
    validUntil: "2025-10-04", status: "Rejected", owner: "Rhea Kulkarni", created: "03 Oct, 09:30",
    rejectReason: "Price", rejectComment: "Competitor was 11% below our landed cost.",
    options: [{ key: "A", name: "Breakbulk", mode: "ocean", transit: "8 days", summary: "Direct service", charges: mkCharges([["Freight", "Atlas Project Cargo", 142000, 14], ["Customs", "Gulf Customs House", 24000, 18]]) }],
    history: [{ v: 1, at: "03 Oct, 09:30", by: "Rhea Kulkarni", status: "Rejected" }],
  },
  {
    id: "SPG-QUO-000122", version: 1, rfqId: "SPG-RFQ-000133", customerId: "SPG-CUS-000143",
    validUntil: "2025-10-26", status: "Draft", owner: "Sanjay Patil", created: "10 Oct, 08:50",
    options: [{ key: "A", name: "Standard", mode: "ocean", transit: "26 days", summary: "Direct Felixstowe service", charges: mkCharges([["Freight", "Meridian Line", 246000, 16], ["Transport", "Deccan Roadways", 34000, 15], ["Customs", "Gulf Customs House", 36000, 20], ["Documentation", "Gulf Customs House", 15000, 22]]) }],
    history: [{ v: 1, at: "10 Oct, 08:50", by: "Sanjay Patil", status: "Draft" }],
  },
];

/* ---------------- Seed bookings ---------------- */
export const SEED_BOOKINGS: BookingRec[] = [
  {
    id: "SPG-BKG-000126", quoteId: "SPG-QUO-000126", optionKey: "A", rfqId: "SPG-RFQ-000131", customerId: "SPG-CUS-000128",
    origin: "Pune", destination: "Chennai", mode: "road", service: "D2D", cargoSummary: "Bearings · 14 crates · 5,600 kg",
    sellingPrice: 64800, marginPct: 23.1, ref: "SPG-BKG-000126", confirmDate: "2025-10-06",
    opsOwner: "Sanjay Patil", carrierRef: "DRW-88214", pickup: "2025-10-02", departure: "2025-10-02", arrival: "2025-10-06",
    notes: "Delivered, POD uploaded.", status: "Confirmed",
  },
  {
    id: "SPG-BKG-000121", quoteId: "SPG-QUO-000118", optionKey: "A", rfqId: "SPG-RFQ-000124", customerId: "SPG-CUS-000137",
    origin: "Chennai", destination: "New York", mode: "ocean", service: "D2P", cargoSummary: "Auto spares · 3 × 40HC · 12,400 kg",
    sellingPrice: 688000, marginPct: 13.3, ref: "SPG-BKG-000121", confirmDate: "2025-10-01",
    opsOwner: "Rhea Kulkarni", carrierRef: "PCL-77410", pickup: "2025-10-03", departure: "2025-10-08", arrival: "2025-11-02",
    notes: "", status: "Ready for Operations",
  },
  {
    id: "SPG-BKG-000130", quoteId: "SPG-QUO-000130", optionKey: "A", rfqId: "SPG-RFQ-000130", customerId: "SPG-CUS-000134",
    origin: "Delhi", destination: "Rotterdam", mode: "rail", service: "P2D", cargoSummary: "Solar inverters · 26 cartons · 4,200 kg · 2 × 40HC",
    sellingPrice: 496000, marginPct: 15.7, ref: "SOL/ENQ-2290", confirmDate: "2025-10-10",
    opsOwner: "P. Joshi", carrierRef: "IRL-RAKE-229", pickup: "2025-10-20", departure: "2025-10-22", arrival: "2025-11-08",
    notes: "Customer accepted Rail + Ocean option.", status: "Ready for Operations",
  },
];

/* ---------------- Commercial notifications ---------------- */
export const COMM_NOTIFS = [
  { id: "cn1", type: "quote", title: "New RFQ assigned to you", record: "SPG-RFQ-000136", body: "Meridian Pharma · Antwerp → Chennai · reefer.", time: "22 min ago", read: false },
  { id: "cn2", type: "quote", title: "Quote awaiting approval", record: "SPG-QUO-000128", body: "V2 · Apex Components · 3 options · best margin 19.4%.", time: "48 min ago", read: false },
  { id: "cn3", type: "quote", title: "Quote awaiting customer", record: "SPG-QUO-000130", body: "Solaris Renewables · Rail + Ocean option.", time: "2 h ago", read: false },
  { id: "cn4", type: "quote", title: "Quote expired", record: "SPG-QUO-000127", body: "Orbit Electronics · validity ended 05 Oct.", time: "5 h ago", read: true },
  { id: "cn5", type: "quote", title: "Quote accepted", record: "SPG-QUO-000126", body: "Apex Components accepted Option A — Standard FTL.", time: "Yesterday", read: true },
  { id: "cn6", type: "invoice", title: "Booking confirmed", record: "SPG-BKG-000126", body: "Commercial handoff ready for shipment setup.", time: "Yesterday", read: true },
  { id: "cn7", type: "delay", title: "Rate expiring in 6 days", record: "RT-4402", body: "Atlas Project Cargo · Pune → Houston freight.", time: "2 days ago", read: true },
] as const;

/* ---------------- Calculations ---------------- */
export const lineSell = (l: ChargeLine) => l.marginType === "Percent" ? l.cost * (1 + l.margin / 100) : l.cost + l.margin;

export interface Commercial {
  supplierCost: number; additionalCost: number; expectedCost: number;
  markup: number; sellingPrice: number; grossProfit: number; marginPct: number;
}
export function optionTotals(charges: ChargeLine[]): Commercial {
  const supplierCost = charges.filter((c) => c.component === "Freight").reduce((a, c) => a + c.cost, 0);
  const additionalCost = charges.filter((c) => c.component !== "Freight").reduce((a, c) => a + c.cost, 0);
  const expectedCost = supplierCost + additionalCost;
  const sellingPrice = charges.reduce((a, c) => a + lineSell(c), 0);
  const grossProfit = sellingPrice - expectedCost;
  return {
    supplierCost, additionalCost, expectedCost,
    markup: sellingPrice - expectedCost, sellingPrice, grossProfit,
    marginPct: expectedCost ? (grossProfit / sellingPrice) * 100 : 0,
  };
}
export const optionCost = (o: QuoteOption) => optionTotals(o.charges).expectedCost;
export const optionSell = (o: QuoteOption) => optionTotals(o.charges).sellingPrice;
export const optionMargin = (o: QuoteOption) => optionTotals(o.charges).marginPct;

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const shortMoney = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : "₹" + Math.round(n).toLocaleString("en-IN"));

export const isExpired = (validUntil: string) => new Date(validUntil).getTime() < new Date("2025-10-06").getTime();

export const ratesForLane = (rates: RateRec[], rfq: RfqRec) =>
  rates.filter((r) => r.origin === rfq.origin && r.destination === rfq.destination);

export const ratesExpiringBefore = (rates: RateRec[], charges: ChargeLine[], validUntil: string) => {
  const ids = new Set(charges.map((c) => c.rateId).filter(Boolean) as string[]);
  const selected = rates.filter((r) => ids.has(r.id));
  const until = new Date(validUntil).getTime();
  return selected.filter((r) => new Date(r.validTo).getTime() < until);
};

export const DEMO_TODAY = "2025-10-06";
