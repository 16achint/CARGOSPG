/* ==========================================================
   SPG CargoOS — centralised prototype mock data
   One dataset shared by every dashboard, the map, search,
   notifications and activity feed so records stay consistent.
   ========================================================== */
import type { LonLat, Mode } from "@/lib/geo";

export type Role = "admin" | "sales" | "operations" | "documentation" | "finance" | "management" | "customer" | "vendor";

export type ShipmentStatus =
  | "Confirmed" | "Documentation" | "Pickup" | "Customs" | "Gate-in"
  | "In Transit" | "Transshipment" | "Destination" | "Delivery" | "Completed" | "Exception";

export const STATUS_TONE: Record<ShipmentStatus, "ok" | "warn" | "risk" | "info" | "neutral" | "cyan"> = {
  Confirmed: "info", Documentation: "neutral", Pickup: "cyan", Customs: "warn", "Gate-in": "cyan",
  "In Transit": "cyan", Transshipment: "info", Destination: "info", Delivery: "cyan",
  Completed: "ok", Exception: "risk",
};

/* ---------------- Locations ---------------- */
export const LOC: Record<string, LonLat> = {
  pune: [73.86, 18.52], nhava: [72.95, 18.95], mumbai: [72.88, 19.08], chennai: [80.27, 13.08],
  mundra: [69.72, 22.84], tkd: [77.29, 28.6], delhi: [77.1, 28.7], colombo: [79.86, 6.93],
  singapore: [103.82, 1.35], suez: [32.55, 30.0], jebel: [55.06, 25.01], shanghai: [121.47, 31.23],
  busan: [129.04, 35.1], rotterdam: [4.48, 51.92], antwerp: [4.4, 51.22], hamburg: [9.99, 53.55],
  felixstowe: [1.35, 51.96], frankfurt: [8.68, 50.11], houston: [-95.37, 29.76], memphis: [-90.05, 35.15],
  la: [-118.24, 34.05], newyork: [-74.01, 40.71], chicago: [-87.63, 41.88], panama: [-79.52, 8.98],
  sydney: [151.21, -33.87],
};

export interface Customer { id: string; name: string; code: string; country: string; active: number; ytd: string }
export const CUSTOMERS: Customer[] = [
  { id: "cus-1", name: "Apex Components Pvt Ltd", code: "APEX", country: "India", active: 6, ytd: "₹2.14 Cr" },
  { id: "cus-2", name: "Northwind Machinery", code: "NWIN", country: "Germany", active: 4, ytd: "₹1.68 Cr" },
  { id: "cus-3", name: "Solaris Renewables", code: "SOLR", country: "India", active: 3, ytd: "₹96.4 L" },
  { id: "cus-4", name: "Kestrel Automotive", code: "KEST", country: "USA", active: 4, ytd: "₹1.32 Cr" },
  { id: "cus-5", name: "Meridian Pharma", code: "MERI", country: "Ireland", active: 2, ytd: "₹74.1 L" },
  { id: "cus-6", name: "Highland Textiles", code: "HIGHL", country: "UK", active: 2, ytd: "₹52.8 L" },
  { id: "cus-7", name: "Orbit Electronics", code: "ORBT", country: "Singapore", active: 3, ytd: "₹88.6 L" },
  { id: "cus-8", name: "Cobalt Steel Works", code: "COBL", country: "UAE", active: 4, ytd: "₹1.05 Cr" },
];

export interface Vendor { id: string; name: string; type: string; jobs: number; rating: number; podPending: number }
export const VENDORS: Vendor[] = [
  { id: "ven-1", name: "Deccan Roadways", type: "Road · FTL", jobs: 14, rating: 4.7, podPending: 3 },
  { id: "ven-2", name: "Meridian Line", type: "Ocean · NVOCC", jobs: 22, rating: 4.5, podPending: 1 },
  { id: "ven-3", name: "SkyBridge Air Cargo", type: "Air · GSA", jobs: 9, rating: 4.8, podPending: 0 },
  { id: "ven-4", name: "Gulf Customs House", type: "Customs · Broker", jobs: 31, rating: 4.3, podPending: 0 },
  { id: "ven-5", name: "Inland Rail Logistics", type: "Rail · ICD", jobs: 7, rating: 4.1, podPending: 2 },
  { id: "ven-6", name: "Pacific Container Line", type: "Ocean · Carrier", jobs: 18, rating: 4.4, podPending: 2 },
  { id: "ven-7", name: "Sahyadri Transport", type: "Road · PTL", jobs: 11, rating: 4.2, podPending: 4 },
  { id: "ven-8", name: "Bavaria Trucking GmbH", type: "Road · EU", jobs: 6, rating: 4.6, podPending: 1 },
  { id: "ven-9", name: "Harbour Warehousing Co", type: "Warehouse · CFS", jobs: 16, rating: 4.5, podPending: 0 },
  { id: "ven-10", name: "Atlas Project Cargo", type: "Breakbulk · ODC", jobs: 4, rating: 4.9, podPending: 1 },
];

/* ---------------- Shipments ---------------- */
export interface Shipment {
  id: string; customerId: string; customer: string; origin: string; originCode: string;
  destination: string; destCode: string; modes: Mode[]; mode: Mode; stage: ShipmentStatus;
  nextMilestone: string; nextMilestoneIn: string; eta: string; status: ShipmentStatus;
  owner: string; progress: number; route: LonLat[]; teu: string; revenue: number; cost: number;
  branch: "West" | "North" | "South" | "East"; docsMissing?: string; exception?: string;
}

const OWNER = ["A. Sharma", "R. Kulkarni", "D. Menon", "S. Iyer", "P. Joshi", "N. Verma"];
const o = (i: number) => OWNER[i % OWNER.length];

export const SHIPMENTS: Shipment[] = [
  {
    id: "SPG-SHP-001284", customerId: "cus-1", customer: "Apex Components", origin: "Pune", originCode: "INPNQ",
    destination: "Houston", destCode: "USHOU", modes: ["truck", "ocean", "ocean", "truck"], mode: "ocean",
    stage: "In Transit", nextMilestone: "Houston Arrival", nextMilestoneIn: "6d 4h", eta: "18 Oct",
    status: "In Transit", owner: o(0), progress: 62, route: [LOC.pune, LOC.nhava, LOC.singapore, LOC.panama, LOC.houston],
    teu: "2 × 40HC", revenue: 420000, cost: 341000, branch: "West",
  },
  {
    id: "SPG-SHP-001291", customerId: "cus-2", customer: "Northwind Machinery", origin: "Chennai", originCode: "INMAA",
    destination: "Hamburg", destCode: "DEHAM", modes: ["truck", "ocean"], mode: "ocean", stage: "Transshipment",
    nextMilestone: "Vessel departure", nextMilestoneIn: "9h", eta: "22 Oct", status: "In Transit", owner: o(1),
    progress: 34, route: [LOC.chennai, LOC.colombo, LOC.suez, LOC.hamburg], teu: "3 × 40HC", revenue: 612000, cost: 528400, branch: "South",
    exception: "Vessel delayed 36h at Colombo",
  },
  {
    id: "SPG-SHP-001302", customerId: "cus-8", customer: "Cobalt Steel Works", origin: "Mundra", originCode: "INMUN",
    destination: "Jebel Ali", destCode: "AEJEA", modes: ["ocean"], mode: "ocean", stage: "Customs",
    nextMilestone: "Customs assessment", nextMilestoneIn: "3h", eta: "09 Oct", status: "Exception", owner: o(2),
    progress: 78, route: [LOC.mundra, LOC.jebel], teu: "1 × 40OT", revenue: 288000, cost: 251000, branch: "West",
    docsMissing: "Certificate of Origin", exception: "Customs hold — document mismatch",
  },
  {
    id: "SPG-SHP-001296", customerId: "cus-3", customer: "Solaris Renewables", origin: "Delhi", originCode: "INTKD",
    destination: "Rotterdam", destCode: "NLRTM", modes: ["rail", "ocean"], mode: "rail", stage: "Pickup",
    nextMilestone: "Customs filing", nextMilestoneIn: "2h 15m", eta: "26 Oct", status: "Documentation", owner: o(3),
    progress: 12, route: [LOC.tkd, LOC.mundra, LOC.suez, LOC.rotterdam], teu: "2 × 40HC", revenue: 496000, cost: 418000, branch: "North",
    docsMissing: "Shipping Bill",
  },
  {
    id: "SPG-SHP-001301", customerId: "cus-4", customer: "Kestrel Automotive", origin: "Pune", originCode: "INPNQ",
    destination: "Mundra", destCode: "INMUN", modes: ["truck"], mode: "truck", stage: "Pickup",
    nextMilestone: "Pickup at factory", nextMilestoneIn: "1h 30m", eta: "07 Oct", status: "Pickup", owner: o(4),
    progress: 8, route: [LOC.pune, LOC.mundra], teu: "FTL · 32ft", revenue: 96000, cost: 74000, branch: "West",
  },
  {
    id: "SPG-SHP-001307", customerId: "cus-1", customer: "Apex Components", origin: "Pune", originCode: "INPNQ",
    destination: "Chennai", destCode: "INMAA", modes: ["truck"], mode: "truck", stage: "Delivery",
    nextMilestone: "POD capture", nextMilestoneIn: "Today", eta: "06 Oct", status: "Delivery", owner: o(5),
    progress: 92, route: [LOC.pune, LOC.chennai], teu: "PTL", revenue: 74000, cost: 61000, branch: "West",
  },
  {
    id: "SPG-SHP-001278", customerId: "cus-7", customer: "Orbit Electronics", origin: "Singapore", originCode: "SGSIN",
    destination: "Sydney", destCode: "AUSYD", modes: ["ocean"], mode: "ocean", stage: "Destination",
    nextMilestone: "Destination arrival", nextMilestoneIn: "14h", eta: "07 Oct", status: "In Transit", owner: o(0),
    progress: 86, route: [LOC.singapore, LOC.sydney], teu: "1 × 20HC", revenue: 182000, cost: 149000, branch: "East",
  },
  {
    id: "SPG-SHP-001287", customerId: "cus-5", customer: "Meridian Pharma", origin: "Frankfurt", originCode: "DEFRA",
    destination: "Mumbai", destCode: "INBOM", modes: ["air"], mode: "air", stage: "Customs",
    nextMilestone: "Customs release", nextMilestoneIn: "5h", eta: "06 Oct", status: "In Transit", owner: o(1),
    progress: 74, route: [LOC.frankfurt, LOC.mumbai], teu: "1,240 kg", revenue: 342000, cost: 279000, branch: "West",
  },
  {
    id: "SPG-SHP-001310", customerId: "cus-2", customer: "Northwind Machinery", origin: "Shanghai", originCode: "CNSHA",
    destination: "Los Angeles", destCode: "USLAX", modes: ["ocean"], mode: "ocean", stage: "In Transit",
    nextMilestone: "Mid-ocean checkpoint", nextMilestoneIn: "2d", eta: "24 Oct", status: "In Transit", owner: o(2),
    progress: 41, route: [LOC.shanghai, LOC.la], teu: "4 × 40HC", revenue: 784000, cost: 672000, branch: "East",
  },
  {
    id: "SPG-SHP-001315", customerId: "cus-6", customer: "Highland Textiles", origin: "Mumbai", originCode: "INBOM",
    destination: "Felixstowe", destCode: "GBFXT", modes: ["truck", "ocean"], mode: "ocean", stage: "Gate-in",
    nextMilestone: "Port gate-in", nextMilestoneIn: "Tomorrow", eta: "28 Oct", status: "Confirmed", owner: o(3),
    progress: 6, route: [LOC.mumbai, LOC.suez, LOC.felixstowe], teu: "2 × 40HC", revenue: 402000, cost: 349000, branch: "West",
    docsMissing: "Packing List",
  },
  {
    id: "SPG-SHP-001319", customerId: "cus-4", customer: "Kestrel Automotive", origin: "Chennai", originCode: "INMAA",
    destination: "New York", destCode: "USNYC", modes: ["ocean"], mode: "ocean", stage: "In Transit",
    nextMilestone: "Vessel departure", nextMilestoneIn: "4h", eta: "02 Nov", status: "In Transit", owner: o(4),
    progress: 18, route: [LOC.chennai, LOC.colombo, LOC.suez, LOC.newyork], teu: "3 × 40HC", revenue: 688000, cost: 596000, branch: "South",
  },
  {
    id: "SPG-SHP-001240", customerId: "cus-3", customer: "Solaris Renewables", origin: "Mundra", originCode: "INMUN",
    destination: "Hamburg", destCode: "DEHAM", modes: ["rail", "ocean"], mode: "ocean", stage: "Completed",
    nextMilestone: "Closed", nextMilestoneIn: "—", eta: "01 Oct", status: "Completed", owner: o(5),
    progress: 100, route: [LOC.mundra, LOC.suez, LOC.hamburg], teu: "2 × 40HC", revenue: 518000, cost: 441000, branch: "West",
  },
  {
    id: "SPG-SHP-001322", customerId: "cus-8", customer: "Cobalt Steel Works", origin: "Busan", originCode: "KRPUS",
    destination: "Jebel Ali", destCode: "AEJEA", modes: ["ocean"], mode: "ocean", stage: "In Transit",
    nextMilestone: "Waypoint check", nextMilestoneIn: "3d", eta: "30 Oct", status: "In Transit", owner: o(0),
    progress: 52, route: [LOC.busan, LOC.jebel], teu: "5 × 40HC", revenue: 842000, cost: 719000, branch: "East",
  },
  {
    id: "SPG-SHP-001326", customerId: "cus-7", customer: "Orbit Electronics", origin: "Delhi", originCode: "INTKD",
    destination: "Mumbai", destCode: "INBOM", modes: ["rail"], mode: "rail", stage: "Pickup",
    nextMilestone: "Rake placement", nextMilestoneIn: "Tomorrow", eta: "11 Oct", status: "Pickup", owner: o(1),
    progress: 10, route: [LOC.tkd, LOC.mumbai], teu: "90 TEU rake", revenue: 156000, cost: 121000, branch: "North",
  },
  {
    id: "SPG-SHP-001330", customerId: "cus-5", customer: "Meridian Pharma", origin: "Antwerp", originCode: "BEANR",
    destination: "Chennai", destCode: "INMAA", modes: ["ocean"], mode: "ocean", stage: "Documentation",
    nextMilestone: "B/L draft approval", nextMilestoneIn: "Today", eta: "04 Nov", status: "Documentation", owner: o(2),
    progress: 4, route: [LOC.antwerp, LOC.suez, LOC.chennai], teu: "1 × 40HC RF", revenue: 468000, cost: 392000, branch: "South",
    docsMissing: "Temperature log sheet",
  },
  {
    id: "SPG-SHP-001334", customerId: "cus-1", customer: "Apex Components", origin: "Chennai", originCode: "INMAA",
    destination: "Chicago", destCode: "USCHI", modes: ["ocean", "truck"], mode: "ocean", stage: "Confirmed",
    nextMilestone: "Cargo readiness", nextMilestoneIn: "2d", eta: "09 Nov", status: "Confirmed", owner: o(3),
    progress: 2, route: [LOC.chennai, LOC.suez, LOC.newyork, LOC.chicago], teu: "2 × 40HC", revenue: 594000, cost: 501000, branch: "South",
  },
  {
    id: "SPG-SHP-001338", customerId: "cus-6", customer: "Highland Textiles", origin: "Pune", originCode: "INPNQ",
    destination: "Mumbai", destCode: "INBOM", modes: ["truck"], mode: "truck", stage: "Exception",
    nextMilestone: "Vehicle reassignment", nextMilestoneIn: "Overdue 4h", eta: "08 Oct", status: "Exception", owner: o(4),
    progress: 22, route: [LOC.pune, LOC.mumbai], teu: "FTL", revenue: 68000, cost: 59000, branch: "West",
    exception: "Vehicle breakdown — replacement pending",
  },
  {
    id: "SPG-SHP-001341", customerId: "cus-2", customer: "Northwind Machinery", origin: "Hamburg", originCode: "DEHAM",
    destination: "Antwerp", destCode: "BEANR", modes: ["truck"], mode: "truck", stage: "Delivery",
    nextMilestone: "Delivery slot", nextMilestoneIn: "Today 16:00", eta: "06 Oct", status: "Delivery", owner: o(5),
    progress: 88, route: [LOC.hamburg, LOC.antwerp], teu: "PTL", revenue: 84000, cost: 66000, branch: "East",
  },
  {
    id: "SPG-SHP-001345", customerId: "cus-3", customer: "Solaris Renewables", origin: "Chennai", originCode: "INMAA",
    destination: "Singapore", destCode: "SGSIN", modes: ["ocean"], mode: "ocean", stage: "In Transit",
    nextMilestone: "Singapore arrival", nextMilestoneIn: "4d", eta: "10 Oct", status: "In Transit", owner: o(0),
    progress: 58, route: [LOC.chennai, LOC.singapore], teu: "2 × 40HC", revenue: 296000, cost: 241000, branch: "South",
  },
  {
    id: "SPG-SHP-001348", customerId: "cus-8", customer: "Cobalt Steel Works", origin: "Jebel Ali", originCode: "AEJEA",
    destination: "Mumbai", destCode: "INBOM", modes: ["ocean"], mode: "ocean", stage: "Customs",
    nextMilestone: "Clearance filing", nextMilestoneIn: "8h", eta: "12 Oct", status: "Customs", owner: o(1),
    progress: 70, route: [LOC.jebel, LOC.mumbai], teu: "3 × 40HC", revenue: 372000, cost: 316000, branch: "West",
  },
];

export const FLAGSHIP = SHIPMENTS[0];

/* ---------------- Documents ---------------- */
export type DocStatus = "Verified" | "Pending Review" | "Missing";
export interface Doc { id: string; name: string; shipment: string; status: DocStatus; size: string; updated: string }
const DOC_NAMES = [
  "Commercial Invoice", "Packing List", "Bill of Lading", "Certificate of Origin", "Shipping Bill",
  "Insurance Certificate", "Fumigation Certificate", "Delivery Order", "Proof of Delivery",
];
export const DOCUMENTS: Doc[] = Array.from({ length: 34 }, (_, i) => {
  const s = SHIPMENTS[i % SHIPMENTS.length];
  const name = DOC_NAMES[i % DOC_NAMES.length];
  const status: DocStatus = i % 11 === 0 ? "Missing" : i % 4 === 0 ? "Pending Review" : "Verified";
  return {
    id: `DOC-${1200 + i}`, name, shipment: s.id, status,
    size: `${80 + ((i * 37) % 400)} KB`, updated: `${1 + (i % 9)} Oct`,
  };
});

/* ---------------- Invoices ---------------- */
export interface Invoice { id: string; customer: string; shipment: string; amount: number; due: string; status: "Paid" | "Open" | "Overdue" }
export const INVOICES: Invoice[] = [
  { id: "INV-24-0913", customer: "Apex Components", shipment: "SPG-SHP-001284", amount: 420000, due: "18 Oct", status: "Open" },
  { id: "INV-24-0908", customer: "Northwind Machinery", shipment: "SPG-SHP-001291", amount: 612000, due: "02 Oct", status: "Overdue" },
  { id: "INV-24-0901", customer: "Cobalt Steel Works", shipment: "SPG-SHP-001302", amount: 288000, due: "14 Oct", status: "Open" },
  { id: "INV-24-0896", customer: "Solaris Renewables", shipment: "SPG-SHP-001240", amount: 518000, due: "28 Sep", status: "Paid" },
  { id: "INV-24-0919", customer: "Kestrel Automotive", shipment: "SPG-SHP-001301", amount: 96000, due: "21 Oct", status: "Open" },
  { id: "INV-24-0922", customer: "Orbit Electronics", shipment: "SPG-SHP-001278", amount: 182000, due: "30 Sep", status: "Overdue" },
  { id: "INV-24-0925", customer: "Meridian Pharma", shipment: "SPG-SHP-001287", amount: 342000, due: "26 Oct", status: "Open" },
  { id: "INV-24-0931", customer: "Highland Textiles", shipment: "SPG-SHP-001315", amount: 402000, due: "02 Nov", status: "Open" },
  { id: "INV-24-0884", customer: "Apex Components", shipment: "SPG-SHP-001307", amount: 74000, due: "25 Sep", status: "Paid" },
  { id: "INV-24-0934", customer: "Cobalt Steel Works", shipment: "SPG-SHP-001322", amount: 842000, due: "08 Nov", status: "Open" },
];

/* ---------------- RFQs & Quotes ---------------- */
export interface Rfq { id: string; customer: string; lane: string; mode: Mode; received: string; status: "New" | "Pricing" | "Quoted" | "Won" | "Lost"; owner: string; value: string }
export const RFQS: Rfq[] = [
  { id: "RFQ-24-0411", customer: "Apex Components", lane: "Pune → Houston", mode: "ocean", received: "05 Oct", status: "Pricing", owner: "A. Sharma", value: "₹4.1 L" },
  { id: "RFQ-24-0412", customer: "Northwind Machinery", lane: "Chennai → Hamburg", mode: "ocean", received: "05 Oct", status: "New", owner: "R. Kulkarni", value: "₹6.2 L" },
  { id: "RFQ-24-0413", customer: "Solaris Renewables", lane: "Delhi → Rotterdam", mode: "rail", received: "04 Oct", status: "Quoted", owner: "D. Menon", value: "₹5.0 L" },
  { id: "RFQ-24-0414", customer: "Kestrel Automotive", lane: "Pune → Mundra", mode: "truck", received: "04 Oct", status: "Won", owner: "S. Iyer", value: "₹0.96 L" },
  { id: "RFQ-24-0415", customer: "Meridian Pharma", lane: "Frankfurt → Mumbai", mode: "air", received: "03 Oct", status: "Pricing", owner: "P. Joshi", value: "₹3.4 L" },
  { id: "RFQ-24-0416", customer: "Highland Textiles", lane: "Mumbai → Felixstowe", mode: "ocean", received: "03 Oct", status: "New", owner: "N. Verma", value: "₹4.0 L" },
  { id: "RFQ-24-0417", customer: "Orbit Electronics", lane: "Singapore → Sydney", mode: "ocean", received: "02 Oct", status: "Quoted", owner: "A. Sharma", value: "₹1.8 L" },
  { id: "RFQ-24-0418", customer: "Cobalt Steel Works", lane: "Mundra → Jebel Ali", mode: "ocean", received: "02 Oct", status: "Won", owner: "R. Kulkarni", value: "₹2.9 L" },
  { id: "RFQ-24-0419", customer: "Orbit Electronics", lane: "Delhi → Mumbai", mode: "rail", received: "01 Oct", status: "Pricing", owner: "D. Menon", value: "₹1.5 L" },
  { id: "RFQ-24-0420", customer: "Meridian Pharma", lane: "Antwerp → Chennai", mode: "ocean", received: "01 Oct", status: "Quoted", owner: "S. Iyer", value: "₹4.7 L" },
  { id: "RFQ-24-0421", customer: "Apex Components", lane: "Chennai → Chicago", mode: "ocean", received: "30 Sep", status: "New", owner: "P. Joshi", value: "₹5.9 L" },
  { id: "RFQ-24-0422", customer: "Kestrel Automotive", lane: "Chennai → New York", mode: "ocean", received: "30 Sep", status: "Lost", owner: "N. Verma", value: "₹6.9 L" },
];

export interface Quote { id: string; rfq: string; customer: string; lane: string; amount: number; margin: number; validUntil: string; status: "Draft" | "Internal Review" | "Sent" | "Awaiting Customer" | "Accepted" | "Expired" }
export const QUOTES: Quote[] = [
  { id: "QT-24-0781", rfq: "RFQ-24-0413", customer: "Solaris Renewables", lane: "Delhi → Rotterdam", amount: 496000, margin: 15.7, validUntil: "19 Oct", status: "Awaiting Customer" },
  { id: "QT-24-0782", rfq: "RFQ-24-0411", customer: "Apex Components", lane: "Pune → Houston", amount: 420000, margin: 18.8, validUntil: "15 Oct", status: "Internal Review" },
  { id: "QT-24-0783", rfq: "RFQ-24-0417", customer: "Orbit Electronics", lane: "Singapore → Sydney", amount: 182000, margin: 16.2, validUntil: "16 Oct", status: "Sent" },
  { id: "QT-24-0784", rfq: "RFQ-24-0420", customer: "Meridian Pharma", lane: "Antwerp → Chennai", amount: 468000, margin: 14.1, validUntil: "12 Oct", status: "Awaiting Customer" },
  { id: "QT-24-0785", rfq: "RFQ-24-0415", customer: "Meridian Pharma", lane: "Frankfurt → Mumbai", amount: 342000, margin: 22.4, validUntil: "09 Oct", status: "Draft" },
  { id: "QT-24-0786", rfq: "RFQ-24-0418", customer: "Cobalt Steel Works", lane: "Mundra → Jebel Ali", amount: 288000, margin: 12.8, validUntil: "08 Oct", status: "Accepted" },
  { id: "QT-24-0787", rfq: "RFQ-24-0414", customer: "Kestrel Automotive", lane: "Pune → Mundra", amount: 96000, margin: 23.1, validUntil: "20 Oct", status: "Accepted" },
  { id: "QT-24-0788", rfq: "RFQ-24-0416", customer: "Highland Textiles", lane: "Mumbai → Felixstowe", amount: 402000, margin: 13.2, validUntil: "07 Oct", status: "Sent" },
  { id: "QT-24-0789", rfq: "RFQ-24-0421", customer: "Apex Components", lane: "Chennai → Chicago", amount: 594000, margin: 15.6, validUntil: "28 Oct", status: "Draft" },
  { id: "QT-24-0776", rfq: "RFQ-24-0402", customer: "Northwind Machinery", lane: "Chennai → Hamburg", amount: 612000, margin: 13.7, validUntil: "05 Oct", status: "Expired" },
];

/* ---------------- Notifications ---------------- */
export type NotifType = "delay" | "document" | "quote" | "pickup" | "customs" | "arrival" | "pod" | "invoice";
export interface Notif { id: string; type: NotifType; title: string; record: string; body: string; time: string; read: boolean }
export const NOTIFS: Notif[] = [
  { id: "n1", type: "customs", title: "Customs hold at Jebel Ali", record: "SPG-SHP-001302", body: "Certificate of Origin mismatch — broker request raised.", time: "12 min ago", read: false },
  { id: "n2", type: "delay", title: "Vessel delayed by 36 hours", record: "SPG-SHP-001291", body: "Transshipment window missed at Colombo. ETA revised.", time: "38 min ago", read: false },
  { id: "n3", type: "document", title: "Shipping Bill missing", record: "SPG-SHP-001296", body: "Blocking customs filing for 2 × 40HC.", time: "1 h ago", read: false },
  { id: "n4", type: "pickup", title: "Pickup due in 90 minutes", record: "SPG-SHP-001301", body: "Deccan Roadways vehicle assigned · Pune factory.", time: "1 h ago", read: false },
  { id: "n5", type: "quote", title: "Quote awaiting your approval", record: "QT-24-0782", body: "Margin 18.8% · Apex Components · Pune → Houston.", time: "2 h ago", read: false },
  { id: "n6", type: "arrival", title: "Destination arrival tomorrow", record: "SPG-SHP-001278", body: "Orbit Electronics · Singapore → Sydney.", time: "3 h ago", read: true },
  { id: "n7", type: "pod", title: "POD overdue", record: "SPG-SHP-001307", body: "Delivery completed but POD not uploaded.", time: "4 h ago", read: false },
  { id: "n8", type: "invoice", title: "Invoice overdue by 4 days", record: "INV-24-0908", body: "Northwind Machinery · ₹6,12,000.", time: "6 h ago", read: true },
  { id: "n9", type: "delay", title: "Vehicle breakdown", record: "SPG-SHP-001338", body: "Replacement vehicle being arranged from Pune hub.", time: "7 h ago", read: true },
  { id: "n10", type: "document", title: "B/L draft ready for review", record: "SPG-SHP-001284", body: "Draft v2 uploaded by Meridian Line.", time: "8 h ago", read: true },
  { id: "n11", type: "customs", title: "Clearance completed", record: "SPG-SHP-001287", body: "Meridian Pharma air shipment released at Mumbai.", time: "9 h ago", read: true },
  { id: "n12", type: "arrival", title: "Departed Singapore", record: "SPG-SHP-001284", body: "MSC Aurora · Voyage 418W.", time: "Yesterday", read: true },
  { id: "n13", type: "pod", title: "POD pending from vendor", record: "SPG-SHP-001341", body: "Bavaria Trucking GmbH · 1 document.", time: "Yesterday", read: true },
  { id: "n14", type: "invoice", title: "Invoice due in 5 days", record: "INV-24-0931", body: "Highland Textiles · ₹4,02,000.", time: "Yesterday", read: true },
  { id: "n15", type: "quote", title: "Quote expired", record: "QT-24-0776", body: "Northwind Machinery · validity ended 05 Oct.", time: "2 days ago", read: true },
  { id: "n16", type: "pickup", title: "Rake placement confirmed", record: "SPG-SHP-001326", body: "Inland Rail Logistics · ICD Tughlakabad.", time: "2 days ago", read: true },
  { id: "n17", type: "document", title: "Temperature log sheet required", record: "SPG-SHP-001330", body: "Reefer 40HC · Meridian Pharma.", time: "2 days ago", read: true },
  { id: "n18", type: "arrival", title: "Delivered · POD uploaded", record: "SPG-SHP-001240", body: "Solaris Renewables · Hamburg.", time: "3 days ago", read: true },
  { id: "n19", type: "delay", title: "Canal queue delay", record: "SPG-SHP-001310", body: "Convoy slot moved by 18 hours.", time: "3 days ago", read: true },
  { id: "n20", type: "customs", title: "Assessment pending", record: "SPG-SHP-001348", body: "Cobalt Steel Works · Jebel Ali → Mumbai.", time: "3 days ago", read: true },
  { id: "n21", type: "document", title: "Packing List missing", record: "SPG-SHP-001315", body: "Required before port gate-in.", time: "4 days ago", read: true },
  { id: "n22", type: "invoice", title: "Payment received", record: "INV-24-0896", body: "Solaris Renewables · ₹5,18,000.", time: "4 days ago", read: true },
];
export const NOTIF_ICON: Record<NotifType, { icon: string; tone: "ok" | "warn" | "risk" | "info" | "cyan" }> = {
  delay: { icon: "delay", tone: "warn" }, document: { icon: "doc", tone: "info" }, quote: { icon: "quote", tone: "cyan" },
  pickup: { icon: "truck", tone: "cyan" }, customs: { icon: "customs", tone: "risk" }, arrival: { icon: "anchor", tone: "ok" },
  pod: { icon: "pod", tone: "warn" }, invoice: { icon: "invoice", tone: "info" },
};

/* ---------------- Activity feed ---------------- */
export interface Activity { time: string; text: string; record: string; tone: "ok" | "warn" | "risk" | "info" | "cyan" }
export const ACTIVITY: Activity[] = [
  { time: "12:42", text: "Shipment departed Singapore on vessel MSC Aurora.", record: "SPG-SHP-001284", tone: "cyan" },
  { time: "12:36", text: "POD uploaded for delivery leg at Customer DC.", record: "SPG-SHP-001240", tone: "ok" },
  { time: "12:31", text: "Shipment marked delayed — vessel schedule change.", record: "SPG-SHP-001291", tone: "warn" },
  { time: "12:12", text: "Customs clearance completed at Mumbai air cargo.", record: "SPG-SHP-001287", tone: "ok" },
  { time: "11:58", text: "Vendor accepted pickup request for factory collection.", record: "SPG-SHP-001301", tone: "info" },
  { time: "11:40", text: "Customs hold raised — document mismatch at Jebel Ali.", record: "SPG-SHP-001302", tone: "risk" },
  { time: "11:22", text: "Bill of Lading draft v2 uploaded for review.", record: "SPG-SHP-001284", tone: "info" },
  { time: "10:55", text: "Vehicle breakdown reported — replacement in progress.", record: "SPG-SHP-001338", tone: "risk" },
  { time: "10:31", text: "Gate-in completed at Mundra port terminal.", record: "SPG-SHP-001296", tone: "cyan" },
  { time: "10:04", text: "Invoice raised for ocean freight and destination charges.", record: "INV-24-0931", tone: "info" },
  { time: "09:48", text: "Quote sent to customer with 30-day validity.", record: "QT-24-0783", tone: "cyan" },
  { time: "09:15", text: "Delivery slot confirmed for 16:00 today.", record: "SPG-SHP-001341", tone: "ok" },
];

/* ---------------- Milestones ---------------- */
export interface Milestone { day: "Today" | "Tomorrow" | "Wed 08 Oct"; time: string; label: string; record: string; state: "On schedule" | "Due soon" | "Delayed" | "Completed" }
export const MILESTONES: Milestone[] = [
  { day: "Today", time: "10:30", label: "Pickup", record: "SPG-SHP-001301", state: "Due soon" },
  { day: "Today", time: "12:45", label: "Customs Filing", record: "SPG-SHP-001296", state: "Delayed" },
  { day: "Today", time: "15:10", label: "Vessel Departure", record: "SPG-SHP-001284", state: "Completed" },
  { day: "Today", time: "16:00", label: "Delivery Slot", record: "SPG-SHP-001341", state: "On schedule" },
  { day: "Today", time: "18:20", label: "Customs Release", record: "SPG-SHP-001287", state: "On schedule" },
  { day: "Tomorrow", time: "09:00", label: "Destination Arrival", record: "SPG-SHP-001278", state: "On schedule" },
  { day: "Tomorrow", time: "11:30", label: "Rake Placement", record: "SPG-SHP-001326", state: "On schedule" },
  { day: "Tomorrow", time: "14:00", label: "Gate-in", record: "SPG-SHP-001315", state: "Due soon" },
  { day: "Wed 08 Oct", time: "08:15", label: "Vehicle Reassignment", record: "SPG-SHP-001338", state: "Delayed" },
  { day: "Wed 08 Oct", time: "13:45", label: "B/L Approval", record: "SPG-SHP-001330", state: "On schedule" },
];

/* ---------------- Needs attention ---------------- */
export interface Attention { sev: "Critical" | "Warning" | "Info"; title: string; entity: string; reason: string; age: string; owner: string }
export const ATTENTION: Attention[] = [
  { sev: "Critical", title: "Customs clearance pending", entity: "SPG-SHP-001302", reason: "Certificate of Origin mismatch flagged by broker", age: "4 h", owner: "D. Menon" },
  { sev: "Critical", title: "Shipment delayed by 8 hours", entity: "SPG-SHP-001291", reason: "Transshipment window missed at Colombo", age: "8 h", owner: "R. Kulkarni" },
  { sev: "Critical", title: "Pickup due within 90 minutes", entity: "SPG-SHP-001301", reason: "Vehicle dispatched, factory gate pass pending", age: "Due 10:30", owner: "S. Iyer" },
  { sev: "Warning", title: "Commercial invoice missing", entity: "SPG-SHP-001296", reason: "Blocking customs filing for 2 × 40HC", age: "1 d", owner: "P. Joshi" },
  { sev: "Warning", title: "POD overdue", entity: "SPG-SHP-001307", reason: "Delivered 06 Oct but proof not captured", age: "1 d", owner: "N. Verma" },
  { sev: "Warning", title: "Quote approval pending", entity: "QT-24-0782", reason: "Margin above threshold, needs manager sign-off", age: "5 h", owner: "A. Sharma" },
  { sev: "Info", title: "B/L draft awaiting review", entity: "SPG-SHP-001284", reason: "Draft v2 uploaded by Meridian Line", age: "9 h", owner: "D. Menon" },
  { sev: "Info", title: "Delivery slot to confirm", entity: "SPG-SHP-001341", reason: "Consignee window closes 17:00 today", age: "2 h", owner: "S. Iyer" },
];

/* ---------------- Users ---------------- */
export interface User { name: string; role: Role; roleLabel: string; email: string; branch: string; initials: string }
export const USERS: User[] = [
  { name: "Rhea Kulkarni", role: "operations", roleLabel: "Operations", email: "ops@spgcargo.com", branch: "West · Mumbai", initials: "RK" },
  { name: "Arjun Sharma", role: "sales", roleLabel: "Sales", email: "sales@spgcargo.com", branch: "West · Pune", initials: "AS" },
  { name: "Meera Iyer", role: "finance", roleLabel: "Finance", email: "finance@spgcargo.com", branch: "HQ · Mumbai", initials: "MI" },
  { name: "Vikram Nair", role: "management", roleLabel: "Management", email: "mgmt@spgcargo.com", branch: "HQ · Mumbai", initials: "VN" },
  { name: "Apex Components", role: "customer", roleLabel: "Customer", email: "logistics@apexcomponents.com", branch: "Apex Components Pvt Ltd", initials: "AC" },
  { name: "Deccan Roadways", role: "vendor", roleLabel: "Vendor", email: "ops@deccanroadways.com", branch: "Deccan Roadways", initials: "DR" },
  { name: "Sanjay Patil", role: "documentation", roleLabel: "Documentation", email: "docs@spgcargo.com", branch: "West · Mumbai", initials: "SP" },
  { name: "System Administrator", role: "admin", roleLabel: "Administrator", email: "admin@spgcargo.com", branch: "HQ · Mumbai", initials: "SA" },
];
export const userForRole = (r: Role) => USERS.find((u) => u.role === r) ?? USERS[0];

/* ---------------- Derived helpers ---------------- */
export const fmtINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const fmtCr = (n: number) => `₹${(n / 10000000).toFixed(2)} Cr`;
export const fmtL = (n: number) => `₹${(n / 100000).toFixed(1)} L`;

export const opsKpis = (s: Shipment[]) => {
  const active = s.filter((x) => x.status !== "Completed");
  const inTransit = active.filter((x) => x.stage === "In Transit" || x.stage === "Transshipment");
  const delayed = active.filter((x) => x.status === "Exception" || x.stage === "Exception");
  const exceptions = active.filter((x) => x.status === "Exception");
  const pickups = active.filter((x) => x.stage === "Pickup");
  const docsPending = DOCUMENTS.filter((d) => d.status !== "Verified").length;
  return {
    active: active.length, inTransit: inTransit.length, delayed: delayed.length,
    exceptions: exceptions.length, pickups: pickups.length, docsPending,
    inTransitPct: active.length ? Math.round((inTransit.length / active.length) * 100) : 0,
  };
};

export const byMode = (s: Shipment[]) => {
  const m: Record<Mode, number> = { ocean: 0, air: 0, truck: 0, rail: 0 };
  s.forEach((x) => { m[x.mode] += 1; });
  return m;
};

export const byStatus = (s: Shipment[]) => {
  const order: ShipmentStatus[] = ["Confirmed", "Documentation", "Pickup", "Customs", "Gate-in", "In Transit", "Transshipment", "Destination", "Delivery", "Completed", "Exception"];
  return order.map((k) => ({ k, n: s.filter((x) => x.stage === k).length })).filter((x) => x.n > 0);
};

export const topCustomers = (n = 5) =>
  [...CUSTOMERS].sort((a, b) => b.active - a.active).slice(0, n);
