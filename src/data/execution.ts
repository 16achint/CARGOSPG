import type { Mode } from "@/lib/geo";
import type { ServiceType, TimelineEvent } from "@/data/commercial";

/* ==========================================================
   Phase 3 — operational shipment execution model
   ========================================================== */

export type ShipmentStage =
  | "Enquiry" | "Quoted" | "Confirmed" | "Booking" | "Documentation" | "Pickup"
  | "Customs" | "Gate-In" | "In Transit" | "Transshipment" | "Destination" | "Delivery" | "Completed" | "Cancelled";
export type ShipmentPriority = "Low" | "Normal" | "High" | "Critical";
export type LegStatus = "Planned" | "Ready" | "In Progress" | "Completed" | "Delayed" | "Exception" | "Cancelled";
export type MilestoneStatus = "Upcoming" | "Due Soon" | "Completed" | "Delayed" | "Exception" | "Skipped";
export type ExceptionType = "Delay" | "Document Missing" | "Vehicle Breakdown" | "Customs Hold" | "Port Hold" | "Cargo Damage" | "Vendor No-Show" | "Missed Connection" | "Weather" | "Capacity Issue" | "Address Issue" | "Other";
export type ExceptionSeverity = "Low" | "Medium" | "High" | "Critical";
export type ExceptionStatus = "Open" | "Assigned" | "In Progress" | "Resolved" | "Closed";
export type MilestoneType =
  | "Booking" | "Pickup" | "Origin Movement" | "Customs" | "Gate-In" | "Vessel Departed" | "Flight Departed"
  | "Rail Departed" | "Transshipment" | "Destination Arrival" | "Delivery" | "POD" | "Custom";

export interface TrackingRef { type: string; value: string }
export interface VendorAssignment { vendorId: string; vendorName: string; service: string; contact: string; assignedAt: string; rateRef?: string; notes?: string }

export interface ShipmentLeg {
  id: string;
  sequence: number;
  mode: Mode;
  origin: string;
  originCode: string;
  destination: string;
  destCode: string;
  vendor?: VendorAssignment;
  plannedDeparture: string;
  plannedArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  status: LegStatus;
  tracking: TrackingRef[];
  modeData: Record<string, string>;
  expectedCost?: number;
  notes: string;
  createdAt: string;
}

export interface ShipmentMilestone {
  id: string;
  legId?: string;
  name: string;
  type: MilestoneType;
  plannedAt: string;
  actualAt?: string;
  status: MilestoneStatus;
  owner: string;
  internalRemark?: string;
  customerRemark?: string;
  exceptionId?: string;
  custom: boolean;
  createdAt: string;
}

export interface OperationalException {
  id: string;
  shipmentId: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  legId?: string;
  milestoneId?: string;
  description: string;
  owner: string;
  dueAt: string;
  customerVisible: boolean;
  internalNote?: string;
  status: ExceptionStatus;
  openedAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  rootCause?: string;
  preventiveAction?: string;
}

export interface ShipmentActivity extends TimelineEvent {
  id: string;
  actor: string;
  kind: "created" | "leg" | "vendor" | "milestone" | "exception" | "status" | "note" | "tracking" | "cancelled";
  legId?: string;
  internalOnly?: boolean;
}

export interface OperationalShipment {
  id: string;
  bookingId: string;
  quoteId: string;
  rfqId: string;
  customerId: string;
  customerName: string;
  customerRef?: string;
  bookingRef: string;
  origin: string;
  originCode: string;
  destination: string;
  destCode: string;
  service: ServiceType;
  cargoSummary: string;
  cargo: { commodity: string; packages: string; weight: string; weightUnit: string; volume: string; volumeUnit: string; container?: string; hazardous?: boolean; temperatureControlled?: boolean };
  stage: ShipmentStage;
  priority: ShipmentPriority;
  owner: string;
  team: string;
  branch: string;
  internalRef: string;
  plannedStart: string;
  plannedCompletion: string;
  eta: string;
  customerVisibleRef?: string;
  notes: string;
  createdAt: string;
  executionStarted: boolean;
  legs: ShipmentLeg[];
  milestones: ShipmentMilestone[];
  exceptions: OperationalException[];
  activity: ShipmentActivity[];
  documentTotal: number;
  documentComplete: number;
}

export const LEG_STATUSES: LegStatus[] = ["Planned", "Ready", "In Progress", "Completed", "Delayed", "Exception", "Cancelled"];
export const MILESTONE_TYPES: MilestoneType[] = ["Booking", "Pickup", "Origin Movement", "Customs", "Gate-In", "Vessel Departed", "Flight Departed", "Rail Departed", "Transshipment", "Destination Arrival", "Delivery", "POD", "Custom"];
export const EXCEPTION_TYPES: ExceptionType[] = ["Delay", "Document Missing", "Vehicle Breakdown", "Customs Hold", "Port Hold", "Cargo Damage", "Vendor No-Show", "Missed Connection", "Weather", "Capacity Issue", "Address Issue", "Other"];
export const EXCEPTION_SEVERITIES: ExceptionSeverity[] = ["Low", "Medium", "High", "Critical"];
export const EXCEPTION_STATUSES: ExceptionStatus[] = ["Open", "Assigned", "In Progress", "Resolved", "Closed"];
export const PRIORITIES: ShipmentPriority[] = ["Low", "Normal", "High", "Critical"];

export const DEMO_EXEC_NOW = "2025-10-10T14:00:00";

const act = (id: string, at: string, label: string, actor: string, kind: ShipmentActivity["kind"], tone: ShipmentActivity["tone"] = "info", ref?: string, legId?: string): ShipmentActivity => ({ id, at, label, actor, kind, tone, ref, legId });
const leg = (p: Partial<ShipmentLeg> & Pick<ShipmentLeg, "id" | "sequence" | "mode" | "origin" | "originCode" | "destination" | "destCode" | "plannedDeparture" | "plannedArrival" | "status">): ShipmentLeg => ({
  tracking: [], modeData: {}, notes: "", createdAt: "09 Oct, 10:30", ...p,
});
const ms = (id: string, legId: string | undefined, name: string, type: MilestoneType, plannedAt: string, status: MilestoneStatus, actualAt?: string, owner = "Rhea Kulkarni"): ShipmentMilestone => ({
  id, legId, name, type, plannedAt, status, actualAt, owner, custom: false, createdAt: "09 Oct, 10:30",
});

export const SEED_EXECUTION: OperationalShipment[] = [
  {
    id: "SPG-SHP-001284", bookingId: "SPG-BKG-000128", quoteId: "SPG-QUO-000128", rfqId: "SPG-RFQ-000128",
    customerId: "SPG-CUS-000128", customerName: "Apex Components Pvt Ltd", customerRef: "APEX/PO-8841", bookingRef: "SPG-BKG-000128",
    origin: "Pune Factory", originCode: "INPNQ", destination: "Houston Customer", destCode: "USHOU", service: "D2D",
    cargoSummary: "Industrial components · 42 crates · 8,600 kg · 2 × 40HC",
    cargo: { commodity: "Industrial components", packages: "42 crates", weight: "8,600", weightUnit: "kg", volume: "34", volumeUnit: "cbm", container: "2 × 40HC" },
    stage: "In Transit", priority: "High", owner: "A. Sharma", team: "West Operations", branch: "West", internalRef: "OPS-1284",
    plannedStart: "2025-10-02", plannedCompletion: "2025-10-18", eta: "2025-10-18", customerVisibleRef: "APEX-8841", notes: "Do not double-stack. Customer requires delivery appointment.",
    createdAt: "02 Oct, 09:14", executionStarted: true,
    legs: [
      leg({ id: "LEG-1284-1", sequence: 1, mode: "truck", origin: "Pune Factory", originCode: "INPNQ", destination: "Nhava Sheva", destCode: "INNSA", plannedDeparture: "2025-10-02T08:00", plannedArrival: "2025-10-03T18:00", actualDeparture: "2025-10-02T08:18", actualArrival: "2025-10-03T16:45", status: "Completed", vendor: { vendorId: "ven-1", vendorName: "Deccan Roadways", service: "Road · FTL", contact: "+91 98220 44550", assignedAt: "01 Oct, 14:40", rateRef: "RT-4408" }, tracking: [{ type: "Vehicle", value: "MH12-AB-4821" }, { type: "LR", value: "DRW-88214" }], modeData: { vehicleType: "32 ft MXL", driver: "Mahesh Jadhav", pickupPoint: "Pune Factory" }, expectedCost: 42000, notes: "Factory gate pass confirmed." }),
      leg({ id: "LEG-1284-2", sequence: 2, mode: "ocean", origin: "Nhava Sheva", originCode: "INNSA", destination: "Singapore", destCode: "SGSIN", plannedDeparture: "2025-10-04T03:00", plannedArrival: "2025-10-10T20:00", actualDeparture: "2025-10-04T05:12", actualArrival: "2025-10-10T18:24", status: "Completed", vendor: { vendorId: "ven-2", vendorName: "Meridian Line", service: "Ocean · NVOCC", contact: "+91 22 6655 1200", assignedAt: "02 Oct, 11:00", rateRef: "RT-4400" }, tracking: [{ type: "Container", value: "MSCU1234567" }, { type: "B/L", value: "MAEU2284117" }], modeData: { loadType: "FCL", containerType: "2 × 40HC", carrier: "Maersk", vessel: "MSC Aurora", voyage: "418W", pol: "Nhava Sheva", pod: "Singapore" }, expectedCost: 205000, notes: "Vessel sailed on schedule." }),
      leg({ id: "LEG-1284-3", sequence: 3, mode: "ocean", origin: "Singapore", originCode: "SGSIN", destination: "Houston Port", destCode: "USHOU", plannedDeparture: "2025-10-11T06:00", plannedArrival: "2025-10-17T18:00", status: "In Progress", vendor: { vendorId: "ven-6", vendorName: "Pacific Container Line", service: "Ocean · Carrier", contact: "+65 6555 2288", assignedAt: "04 Oct, 10:15", rateRef: "RT-4401" }, tracking: [{ type: "Container", value: "MSCU1234567" }, { type: "B/L", value: "MAEU2284117" }], modeData: { loadType: "FCL", containerType: "2 × 40HC", carrier: "Maersk", vessel: "MSC Aurora", voyage: "418W", pol: "Singapore", pod: "Houston" }, expectedCost: 205000, notes: "Trans-pacific leg. Current AIS position 16°N 151°W." }),
      leg({ id: "LEG-1284-4", sequence: 4, mode: "truck", origin: "Houston Port", originCode: "USHOU", destination: "Houston Customer", destCode: "USMEM", plannedDeparture: "2025-10-17T23:00", plannedArrival: "2025-10-18T16:00", status: "Planned", vendor: { vendorId: "ven-1", vendorName: "Deccan Roadways", service: "Road · FTL", contact: "+1 713 555 3080", assignedAt: "06 Oct, 09:30" }, tracking: [], modeData: { vehicleType: "40 ft chassis", pickupPoint: "Houston Port", deliveryPoint: "Customer DC" }, expectedCost: 39000, notes: "Delivery appointment required." }),
    ],
    milestones: [
      ms("MS-1284-1", "LEG-1284-1", "Booking confirmed", "Booking", "2025-10-01T16:00", "Completed", "2025-10-01T15:42"),
      ms("MS-1284-2", "LEG-1284-1", "Pickup at Pune factory", "Pickup", "2025-10-02T08:00", "Completed", "2025-10-02T08:18"),
      ms("MS-1284-3", "LEG-1284-1", "Nhava Sheva gate-in", "Gate-In", "2025-10-03T18:00", "Completed", "2025-10-03T16:45"),
      ms("MS-1284-4", "LEG-1284-2", "Vessel departed Nhava Sheva", "Vessel Departed", "2025-10-04T03:00", "Completed", "2025-10-04T05:12"),
      ms("MS-1284-5", "LEG-1284-2", "Singapore transshipment", "Transshipment", "2025-10-10T20:00", "Completed", "2025-10-10T18:24"),
      ms("MS-1284-6", "LEG-1284-3", "Vessel departed Singapore", "Vessel Departed", "2025-10-11T06:00", "Upcoming"),
      ms("MS-1284-7", "LEG-1284-3", "Houston port arrival", "Destination Arrival", "2025-10-17T18:00", "Upcoming"),
      ms("MS-1284-8", "LEG-1284-4", "Final delivery", "Delivery", "2025-10-18T16:00", "Upcoming"),
      ms("MS-1284-9", "LEG-1284-4", "Proof of delivery", "POD", "2025-10-18T18:00", "Upcoming"),
    ],
    exceptions: [],
    activity: [
      act("ACT-1284-1", "02 Oct, 09:14", "Master shipment created from accepted booking.", "A. Sharma", "created", "info", "SPG-BKG-000128"),
      act("ACT-1284-2", "02 Oct, 11:00", "Meridian Line assigned to Leg 2.", "R. Kulkarni", "vendor", "info", "LEG-1284-2", "LEG-1284-2"),
      act("ACT-1284-3", "02 Oct, 08:18", "Pickup actual time recorded.", "A. Sharma", "milestone", "ok", "MS-1284-2", "LEG-1284-1"),
      act("ACT-1284-4", "04 Oct, 05:12", "Vessel departure confirmed at Nhava Sheva.", "R. Kulkarni", "milestone", "ok", "MS-1284-4", "LEG-1284-2"),
      act("ACT-1284-5", "10 Oct, 18:24", "Container discharged at Singapore transshipment terminal.", "R. Kulkarni", "milestone", "ok", "MS-1284-5", "LEG-1284-2"),
    ],
    documentTotal: 13, documentComplete: 12,
  },
  {
    id: "SPG-SHP-001285", bookingId: "SPG-BKG-000121", quoteId: "SPG-QUO-000121", rfqId: "SPG-RFQ-000124",
    customerId: "SPG-CUS-000137", customerName: "Kestrel Automotive Inc", customerRef: "KES-77120", bookingRef: "SPG-BKG-000121",
    origin: "Chennai", originCode: "INMAA", destination: "New York", destCode: "USNYC", service: "D2P",
    cargoSummary: "Auto spares · 3 × 40HC · 12,400 kg", cargo: { commodity: "Auto spares", packages: "3 × 40HC", weight: "12,400", weightUnit: "kg", volume: "72", volumeUnit: "cbm", container: "3 × 40HC" },
    stage: "In Transit", priority: "Normal", owner: "R. Kulkarni", team: "South Operations", branch: "South", internalRef: "OPS-1285", plannedStart: "2025-10-01", plannedCompletion: "2025-11-02", eta: "2025-11-02", notes: "", createdAt: "01 Oct, 13:42", executionStarted: true,
    legs: [leg({ id: "LEG-1285-1", sequence: 1, mode: "ocean", origin: "Chennai", originCode: "INMAA", destination: "Colombo", destCode: "LKCMB", plannedDeparture: "2025-10-08T04:00", plannedArrival: "2025-10-10T20:00", actualDeparture: "2025-10-08T04:35", status: "Completed", vendor: { vendorId: "ven-6", vendorName: "Pacific Container Line", service: "Ocean · Carrier", contact: "+65 6555 2288", assignedAt: "02 Oct, 11:00" }, tracking: [{ type: "Container", value: "PCLU8894011" }, { type: "B/L", value: "PCL-77410" }], modeData: { vessel: "Pacific Dawn", voyage: "092E", loadType: "FCL" } }), leg({ id: "LEG-1285-2", sequence: 2, mode: "ocean", origin: "Colombo", originCode: "LKCMB", destination: "New York", destCode: "USNYC", plannedDeparture: "2025-10-11T06:00", plannedArrival: "2025-11-02T08:00", status: "In Progress", vendor: { vendorId: "ven-6", vendorName: "Pacific Container Line", service: "Ocean · Carrier", contact: "+1 212 555 7011", assignedAt: "08 Oct, 09:15" }, tracking: [{ type: "Container", value: "PCLU8894011" }], modeData: { vessel: "Pacific Dawn", voyage: "092E" } })],
    milestones: [ms("MS-1285-1", "LEG-1285-1", "Vessel departed Chennai", "Vessel Departed", "2025-10-08T04:00", "Completed", "2025-10-08T04:35"), ms("MS-1285-2", "LEG-1285-1", "Colombo transshipment", "Transshipment", "2025-10-10T20:00", "Completed", "2025-10-10T19:10"), ms("MS-1285-3", "LEG-1285-2", "Vessel departed Colombo", "Vessel Departed", "2025-10-11T06:00", "Upcoming"), ms("MS-1285-4", "LEG-1285-2", "New York arrival", "Destination Arrival", "2025-11-02T08:00", "Upcoming")],
    exceptions: [{ id: "EX-00042", shipmentId: "SPG-SHP-001285", type: "Missed Connection", severity: "High", legId: "LEG-1285-2", milestoneId: "MS-1285-3", description: "Colombo transshipment connection shifted to next vessel window.", owner: "R. Kulkarni", dueAt: "2025-10-11T06:00", customerVisible: true, status: "In Progress", openedAt: "2025-10-10T12:30", internalNote: "Carrier confirmed rollover. Updated ETA shared with customer." }],
    activity: [act("ACT-1285-1", "01 Oct, 13:42", "Master shipment created from booking.", "R. Kulkarni", "created", "info"), act("ACT-1285-2", "10 Oct, 12:30", "Connection risk reported at Colombo.", "R. Kulkarni", "exception", "warn", "EX-00042")],
    documentTotal: 11, documentComplete: 9,
  },
  {
    id: "SPG-SHP-001286", bookingId: "SPG-BKG-000126", quoteId: "SPG-QUO-000126", rfqId: "SPG-RFQ-000131",
    customerId: "SPG-CUS-000128", customerName: "Apex Components Pvt Ltd", bookingRef: "SPG-BKG-000126", origin: "Pune", originCode: "INPNQ", destination: "Chennai", destCode: "INMAA", service: "D2D",
    cargoSummary: "Bearings · 14 crates · 5,600 kg", cargo: { commodity: "Bearings", packages: "14 crates", weight: "5,600", weightUnit: "kg", volume: "16", volumeUnit: "cbm" },
    stage: "Completed", priority: "Normal", owner: "S. Patil", team: "West Operations", branch: "West", internalRef: "OPS-1286", plannedStart: "2025-10-02", plannedCompletion: "2025-10-06", eta: "2025-10-06", notes: "", createdAt: "02 Oct, 08:00", executionStarted: true,
    legs: [leg({ id: "LEG-1286-1", sequence: 1, mode: "truck", origin: "Pune", originCode: "INPNQ", destination: "Chennai", destCode: "INMAA", plannedDeparture: "2025-10-02T08:00", plannedArrival: "2025-10-06T16:00", actualDeparture: "2025-10-02T08:10", actualArrival: "2025-10-06T15:28", status: "Completed", vendor: { vendorId: "ven-1", vendorName: "Deccan Roadways", service: "Road · FTL", contact: "+91 98220 44550", assignedAt: "01 Oct, 16:00", rateRef: "RT-4417" }, tracking: [{ type: "LR", value: "DRW-88214" }, { type: "Vehicle", value: "MH12-AB-4821" }], modeData: { vehicleType: "32 ft MXL" } })],
    milestones: [ms("MS-1286-1", "LEG-1286-1", "Pickup", "Pickup", "2025-10-02T08:00", "Completed", "2025-10-02T08:10"), ms("MS-1286-2", "LEG-1286-1", "Delivery", "Delivery", "2025-10-06T16:00", "Completed", "2025-10-06T15:28"), ms("MS-1286-3", "LEG-1286-1", "POD uploaded", "POD", "2025-10-06T18:00", "Completed", "2025-10-06T16:12")],
    exceptions: [], activity: [act("ACT-1286-1", "02 Oct, 08:00", "Shipment created.", "S. Patil", "created", "info"), act("ACT-1286-2", "06 Oct, 16:12", "Delivery and POD completed.", "S. Patil", "milestone", "ok")], documentTotal: 8, documentComplete: 8,
  },
  {
    id: "SPG-SHP-001287", bookingId: "SPG-BKG-000119", quoteId: "SPG-QUO-000119", rfqId: "SPG-RFQ-000120",
    customerId: "SPG-CUS-000140", customerName: "Meridian Pharma plc", bookingRef: "SPG-BKG-000119", origin: "Frankfurt", originCode: "DEFRA", destination: "Mumbai", destCode: "INBOM", service: "D2D",
    cargoSummary: "Pharma cold chain · 12 insulated boxes · 1,240 kg", cargo: { commodity: "Pharma cold chain", packages: "12 boxes", weight: "1,240", weightUnit: "kg", volume: "6", volumeUnit: "cbm", temperatureControlled: true },
    stage: "Customs", priority: "High", owner: "D. Menon", team: "Air Operations", branch: "West", internalRef: "OPS-1287", plannedStart: "2025-10-10", plannedCompletion: "2025-10-12", eta: "2025-10-12", notes: "Temperature data logger required.", createdAt: "09 Oct, 16:20", executionStarted: true,
    legs: [leg({ id: "LEG-1287-1", sequence: 1, mode: "air", origin: "Frankfurt Airport", originCode: "FRA", destination: "Mumbai Airport", destCode: "BOM", plannedDeparture: "2025-10-10T22:00", plannedArrival: "2025-10-12T02:00", status: "In Progress", vendor: { vendorId: "ven-3", vendorName: "SkyBridge Air Cargo", service: "Air · Priority", contact: "+49 69 555 8181", assignedAt: "09 Oct, 16:30" }, tracking: [{ type: "AWB", value: "074-99284111" }, { type: "Flight", value: "LH756" }], modeData: { airline: "Lufthansa Cargo", flight: "LH756", priority: "Priority" } })],
    milestones: [ms("MS-1287-1", "LEG-1287-1", "Flight departed Frankfurt", "Flight Departed", "2025-10-10T22:00", "Upcoming"), ms("MS-1287-2", "LEG-1287-1", "Customs release", "Customs", "2025-10-12T05:00", "Upcoming")],
    exceptions: [{ id: "EX-00043", shipmentId: "SPG-SHP-001287", type: "Document Missing", severity: "Medium", legId: "LEG-1287-1", description: "Temperature logger certificate must be attached before customs release.", owner: "D. Menon", dueAt: "2025-10-12T05:00", customerVisible: false, status: "Assigned", openedAt: "2025-10-10T10:40" }],
    activity: [act("ACT-1287-1", "09 Oct, 16:20", "Shipment created from accepted booking.", "D. Menon", "created", "info"), act("ACT-1287-2", "10 Oct, 10:40", "Document exception assigned.", "D. Menon", "exception", "warn", "EX-00043")], documentTotal: 9, documentComplete: 7,
  },
  {
    id: "SPG-SHP-001288", bookingId: "SPG-BKG-000118", quoteId: "SPG-QUO-000118", rfqId: "SPG-RFQ-000118",
    customerId: "SPG-CUS-000134", customerName: "Solaris Renewables Ltd", bookingRef: "SPG-BKG-000118", origin: "ICD Tughlakabad", originCode: "INTKD", destination: "Rotterdam", destCode: "NLRTM", service: "P2D",
    cargoSummary: "Solar inverters · 26 cartons · 4,200 kg · 2 × 40HC", cargo: { commodity: "Solar inverters", packages: "26 cartons", weight: "4,200", weightUnit: "kg", volume: "28", volumeUnit: "cbm", container: "2 × 40HC" },
    stage: "Pickup", priority: "Normal", owner: "P. Joshi", team: "North Operations", branch: "North", internalRef: "OPS-1288", plannedStart: "2025-10-10", plannedCompletion: "2025-11-08", eta: "2025-11-08", notes: "", createdAt: "10 Oct, 07:30", executionStarted: false,
    legs: [leg({ id: "LEG-1288-1", sequence: 1, mode: "rail", origin: "ICD Tughlakabad", originCode: "INTKD", destination: "Mundra Port", destCode: "INMUN", plannedDeparture: "2025-10-12T06:00", plannedArrival: "2025-10-13T10:00", status: "Ready", vendor: { vendorId: "ven-5", vendorName: "Inland Rail Logistics", service: "Rail · Container", contact: "+91 11 555 6099", assignedAt: "10 Oct, 08:10" }, tracking: [{ type: "Rail", value: "IRL-RAKE-229" }], modeData: { operator: "Inland Rail Logistics", rake: "Rake 229", icd: "Tughlakabad" } }), leg({ id: "LEG-1288-2", sequence: 2, mode: "ocean", origin: "Mundra Port", originCode: "INMUN", destination: "Rotterdam", destCode: "NLRTM", plannedDeparture: "2025-10-15T12:00", plannedArrival: "2025-11-08T20:00", status: "Planned", vendor: { vendorId: "ven-2", vendorName: "Meridian Line", service: "Ocean · NVOCC", contact: "+91 22 6655 1200", assignedAt: "10 Oct, 08:30" }, tracking: [], modeData: { vessel: "TBN", loadType: "FCL", containerType: "2 × 40HC" } })],
    milestones: [ms("MS-1288-1", "LEG-1288-1", "Rake placement", "Rail Departed", "2025-10-12T06:00", "Upcoming"), ms("MS-1288-2", "LEG-1288-1", "Mundra gate-in", "Gate-In", "2025-10-13T10:00", "Upcoming"), ms("MS-1288-3", "LEG-1288-2", "Vessel departure", "Vessel Departed", "2025-10-15T12:00", "Upcoming")],
    exceptions: [], activity: [act("ACT-1288-1", "10 Oct, 07:30", "Master shipment created.", "P. Joshi", "created", "info")], documentTotal: 10, documentComplete: 8,
  },
  {
    id: "SPG-SHP-001289", bookingId: "SPG-BKG-000115", quoteId: "SPG-QUO-000115", rfqId: "SPG-RFQ-000115",
    customerId: "SPG-CUS-000143", customerName: "Highland Textiles Ltd", bookingRef: "SPG-BKG-000115", origin: "Mumbai", originCode: "INBOM", destination: "Felixstowe", destCode: "GBFXT", service: "D2D",
    cargoSummary: "Cotton textiles · 64 bales · 12,800 kg · 2 × 40HC", cargo: { commodity: "Cotton textiles", packages: "64 bales", weight: "12,800", weightUnit: "kg", volume: "48", volumeUnit: "cbm", container: "2 × 40HC" },
    stage: "In Transit", priority: "Normal", owner: "S. Iyer", team: "West Operations", branch: "West", internalRef: "OPS-1289", plannedStart: "2025-10-04", plannedCompletion: "2025-10-28", eta: "2025-10-28", notes: "", createdAt: "04 Oct, 11:32", executionStarted: true,
    legs: [leg({ id: "LEG-1289-1", sequence: 1, mode: "ocean", origin: "Mumbai Port", originCode: "INBOM", destination: "Felixstowe", destCode: "GBFXT", plannedDeparture: "2025-10-05T08:00", plannedArrival: "2025-10-28T12:00", actualDeparture: "2025-10-05T09:20", status: "In Progress", vendor: { vendorId: "ven-2", vendorName: "Meridian Line", service: "Ocean · NVOCC", contact: "+91 22 6655 1200", assignedAt: "04 Oct, 12:00" }, tracking: [{ type: "Container", value: "MSCU9912044" }, { type: "B/L", value: "MDL-880129" }], modeData: { vessel: "CMA CGM Liberty", voyage: "0FJEW", loadType: "FCL" } })],
    milestones: [ms("MS-1289-1", "LEG-1289-1", "Vessel departed Mumbai", "Vessel Departed", "2025-10-05T08:00", "Completed", "2025-10-05T09:20"), ms("MS-1289-2", "LEG-1289-1", "Felixstowe arrival", "Destination Arrival", "2025-10-28T12:00", "Upcoming")],
    exceptions: [], activity: [act("ACT-1289-1", "04 Oct, 11:32", "Shipment created from booking.", "S. Iyer", "created", "info")], documentTotal: 10, documentComplete: 10,
  },
  {
    id: "SPG-SHP-001290", bookingId: "SPG-BKG-000114", quoteId: "SPG-QUO-000114", rfqId: "SPG-RFQ-000114",
    customerId: "SPG-CUS-000149", customerName: "Cobalt Steel Works LLC", bookingRef: "SPG-BKG-000114", origin: "Mundra", originCode: "INMUN", destination: "Jebel Ali", destCode: "AEJEA", service: "P2P",
    cargoSummary: "Steel fabrications · 9 loose pieces · 21,000 kg", cargo: { commodity: "Steel fabrications", packages: "9 pieces", weight: "21,000", weightUnit: "kg", volume: "26", volumeUnit: "cbm" },
    stage: "Customs", priority: "Critical", owner: "D. Menon", team: "West Operations", branch: "West", internalRef: "OPS-1290", plannedStart: "2025-10-08", plannedCompletion: "2025-10-18", eta: "2025-10-18", notes: "Oversize cargo; port survey required.", createdAt: "08 Oct, 09:15", executionStarted: true,
    legs: [leg({ id: "LEG-1290-1", sequence: 1, mode: "ocean", origin: "Mundra Port", originCode: "INMUN", destination: "Jebel Ali", destCode: "AEJEA", plannedDeparture: "2025-10-09T10:00", plannedArrival: "2025-10-15T08:00", status: "Exception", vendor: { vendorId: "ven-10", vendorName: "Atlas Project Cargo", service: "Ocean · Breakbulk", contact: "+971 4 555 1990", assignedAt: "08 Oct, 11:00" }, tracking: [{ type: "B/L", value: "APC-550114" }], modeData: { vessel: "Atlas Pioneer", voyage: "110E", loadType: "Breakbulk" } })],
    milestones: [ms("MS-1290-1", "LEG-1290-1", "Customs release", "Customs", "2025-10-10T10:00", "Exception", undefined, "D. Menon"), ms("MS-1290-2", "LEG-1290-1", "Vessel departure", "Vessel Departed", "2025-10-09T10:00", "Completed", "2025-10-09T10:35")],
    exceptions: [{ id: "EX-00044", shipmentId: "SPG-SHP-001290", type: "Customs Hold", severity: "Critical", legId: "LEG-1290-1", milestoneId: "MS-1290-1", description: "Port survey documentation does not match oversize cargo manifest.", owner: "D. Menon", dueAt: "2025-10-10T18:00", customerVisible: true, status: "Open", openedAt: "2025-10-10T10:15", internalNote: "Need revised survey report from origin agent." }],
    activity: [act("ACT-1290-1", "08 Oct, 09:15", "Shipment created.", "D. Menon", "created", "info"), act("ACT-1290-2", "10 Oct, 10:15", "Critical customs hold reported.", "D. Menon", "exception", "risk", "EX-00044")], documentTotal: 12, documentComplete: 9,
  },
  {
    id: "SPG-SHP-001291", bookingId: "SPG-BKG-000111", quoteId: "SPG-QUO-000111", rfqId: "SPG-RFQ-000111",
    customerId: "SPG-CUS-000131", customerName: "Northwind Machinery GmbH", bookingRef: "SPG-BKG-000111", origin: "Chennai", originCode: "INMAA", destination: "Hamburg", destCode: "DEHAM", service: "D2D",
    cargoSummary: "Machine spares · 18 pallets · 5,400 kg · 3 × 40HC", cargo: { commodity: "Machine spares", packages: "18 pallets", weight: "5,400", weightUnit: "kg", volume: "22", volumeUnit: "cbm", container: "3 × 40HC" },
    stage: "In Transit", priority: "High", owner: "P. Joshi", team: "South Operations", branch: "South", internalRef: "OPS-1291", plannedStart: "2025-10-03", plannedCompletion: "2025-10-22", eta: "2025-10-23", notes: "", createdAt: "03 Oct, 15:05", executionStarted: true,
    legs: [leg({ id: "LEG-1291-1", sequence: 1, mode: "ocean", origin: "Chennai", originCode: "INMAA", destination: "Colombo", destCode: "LKCMB", plannedDeparture: "2025-10-04T04:00", plannedArrival: "2025-10-06T18:00", actualDeparture: "2025-10-04T05:10", actualArrival: "2025-10-06T20:12", status: "Completed", vendor: { vendorId: "ven-2", vendorName: "Meridian Line", service: "Ocean · NVOCC", contact: "+91 22 6655 1200", assignedAt: "03 Oct, 16:00" }, tracking: [{ type: "Container", value: "MSCU0081291" }], modeData: { vessel: "Meridian Star", voyage: "121W" } }), leg({ id: "LEG-1291-2", sequence: 2, mode: "ocean", origin: "Colombo", originCode: "LKCMB", destination: "Hamburg", destCode: "DEHAM", plannedDeparture: "2025-10-07T06:00", plannedArrival: "2025-10-22T08:00", status: "Delayed", vendor: { vendorId: "ven-6", vendorName: "Pacific Container Line", service: "Ocean · Carrier", contact: "+49 40 555 7011", assignedAt: "06 Oct, 12:00" }, tracking: [{ type: "B/L", value: "PCL-HAM-9021" }], modeData: { vessel: "Pacific Horizon", voyage: "18N" }, notes: "Missed connection; next available sailing." })],
    milestones: [ms("MS-1291-1", "LEG-1291-1", "Vessel departed Chennai", "Vessel Departed", "2025-10-04T04:00", "Completed", "2025-10-04T05:10"), ms("MS-1291-2", "LEG-1291-1", "Colombo arrival", "Transshipment", "2025-10-06T18:00", "Completed", "2025-10-06T20:12"), ms("MS-1291-3", "LEG-1291-2", "Connecting vessel departure", "Vessel Departed", "2025-10-07T06:00", "Delayed"), ms("MS-1291-4", "LEG-1291-2", "Hamburg arrival", "Destination Arrival", "2025-10-22T08:00", "Upcoming")],
    exceptions: [{ id: "EX-00045", shipmentId: "SPG-SHP-001291", type: "Missed Connection", severity: "High", legId: "LEG-1291-2", milestoneId: "MS-1291-3", description: "Vessel connection missed at Colombo; next sailing adds 24h to ETA.", owner: "P. Joshi", dueAt: "2025-10-11T10:00", customerVisible: true, status: "In Progress", openedAt: "2025-10-09T16:00", internalNote: "Customer informed of revised ETA." }],
    activity: [act("ACT-1291-1", "03 Oct, 15:05", "Shipment created.", "P. Joshi", "created", "info"), act("ACT-1291-2", "09 Oct, 16:00", "Missed connection exception opened.", "P. Joshi", "exception", "warn", "EX-00045")], documentTotal: 13, documentComplete: 11,
  },
  {
    id: "SPG-SHP-001292", bookingId: "SPG-BKG-000108", quoteId: "SPG-QUO-000108", rfqId: "SPG-RFQ-000108",
    customerId: "SPG-CUS-000146", customerName: "Orbit Electronics Pte Ltd", bookingRef: "SPG-BKG-000108", origin: "Singapore", originCode: "SGSIN", destination: "Sydney", destCode: "AUSYD", service: "P2P",
    cargoSummary: "Electronic assemblies · 15 cartons · 2,100 kg · 1 × 20HC", cargo: { commodity: "Electronic assemblies", packages: "15 cartons", weight: "2,100", weightUnit: "kg", volume: "9", volumeUnit: "cbm", container: "1 × 20HC" },
    stage: "Destination", priority: "Normal", owner: "N. Verma", team: "East Operations", branch: "East", internalRef: "OPS-1292", plannedStart: "2025-10-02", plannedCompletion: "2025-10-11", eta: "2025-10-11", notes: "", createdAt: "02 Oct, 11:32", executionStarted: true,
    legs: [leg({ id: "LEG-1292-1", sequence: 1, mode: "ocean", origin: "Singapore", originCode: "SGSIN", destination: "Sydney", destCode: "AUSYD", plannedDeparture: "2025-10-03T09:00", plannedArrival: "2025-10-11T16:00", actualDeparture: "2025-10-03T09:15", status: "In Progress", vendor: { vendorId: "ven-6", vendorName: "Pacific Container Line", service: "Ocean · Carrier", contact: "+65 6555 2288", assignedAt: "02 Oct, 13:00" }, tracking: [{ type: "Container", value: "PCLU7722092" }, { type: "B/L", value: "PCL-SYD-7722" }], modeData: { vessel: "Pacific Sun", voyage: "551S" } })],
    milestones: [ms("MS-1292-1", "LEG-1292-1", "Vessel departed Singapore", "Vessel Departed", "2025-10-03T09:00", "Completed", "2025-10-03T09:15"), ms("MS-1292-2", "LEG-1292-1", "Sydney arrival", "Destination Arrival", "2025-10-11T16:00", "Upcoming")],
    exceptions: [], activity: [act("ACT-1292-1", "02 Oct, 11:32", "Shipment created.", "N. Verma", "created", "info")], documentTotal: 8, documentComplete: 8,
  },
  {
    id: "SPG-SHP-001293", bookingId: "SPG-BKG-000103", quoteId: "SPG-QUO-000103", rfqId: "SPG-RFQ-000103",
    customerId: "SPG-CUS-000143", customerName: "Highland Textiles Ltd", bookingRef: "SPG-BKG-000103", origin: "Pune", originCode: "INPNQ", destination: "Mumbai", destCode: "INBOM", service: "D2D",
    cargoSummary: "Cotton textiles · PTL · 2,300 kg", cargo: { commodity: "Cotton textiles", packages: "22 bales", weight: "2,300", weightUnit: "kg", volume: "8", volumeUnit: "cbm" },
    stage: "Pickup", priority: "Critical", owner: "S. Iyer", team: "West Operations", branch: "West", internalRef: "OPS-1293", plannedStart: "2025-10-10", plannedCompletion: "2025-10-11", eta: "2025-10-11", notes: "Dock 4 collection.", createdAt: "10 Oct, 08:10", executionStarted: true,
    legs: [leg({ id: "LEG-1293-1", sequence: 1, mode: "truck", origin: "Pune Factory", originCode: "INPNQ", destination: "Mumbai CFS", destCode: "INBOM", plannedDeparture: "2025-10-10T12:00", plannedArrival: "2025-10-11T06:00", status: "Exception", vendor: { vendorId: "ven-7", vendorName: "Sahyadri Transport", service: "Road · PTL", contact: "+91 98220 44200", assignedAt: "10 Oct, 08:30" }, tracking: [{ type: "Vehicle", value: "MH14-JK-4412" }], modeData: { vehicleType: "20 ft", driver: "Suresh Pawar" } })],
    milestones: [ms("MS-1293-1", "LEG-1293-1", "Vehicle pickup", "Pickup", "2025-10-10T12:00", "Delayed", undefined, "S. Iyer")],
    exceptions: [{ id: "EX-00046", shipmentId: "SPG-SHP-001293", type: "Vehicle Breakdown", severity: "Critical", legId: "LEG-1293-1", milestoneId: "MS-1293-1", description: "Assigned vehicle reported engine issue 18 km from origin; replacement requested.", owner: "S. Iyer", dueAt: "2025-10-10T15:00", customerVisible: true, status: "Open", openedAt: "2025-10-10T10:20" }],
    activity: [act("ACT-1293-1", "10 Oct, 08:10", "Shipment created for same-day pickup.", "S. Iyer", "created", "info"), act("ACT-1293-2", "10 Oct, 10:20", "Vehicle breakdown exception reported.", "S. Iyer", "exception", "risk", "EX-00046")], documentTotal: 6, documentComplete: 4,
  },
];

export const EXEC_VENDORS = [
  { id: "ven-1", name: "Deccan Roadways", service: "Road · FTL/PTL", contact: "+91 98220 44550" },
  { id: "ven-2", name: "Meridian Line", service: "Ocean · NVOCC", contact: "+91 22 6655 1200" },
  { id: "ven-3", name: "SkyBridge Air Cargo", service: "Air · GSA", contact: "+91 22 555 1820" },
  { id: "ven-5", name: "Inland Rail Logistics", service: "Rail · ICD", contact: "+91 11 555 6099" },
  { id: "ven-6", name: "Pacific Container Line", service: "Ocean · Carrier", contact: "+65 6555 2288" },
  { id: "ven-7", name: "Sahyadri Transport", service: "Road · PTL", contact: "+91 98220 44200" },
  { id: "ven-9", name: "Harbour Warehousing Co", service: "Warehouse · CFS", contact: "+91 22 4411 2070" },
  { id: "ven-10", name: "Atlas Project Cargo", service: "Ocean · Breakbulk / ODC", contact: "+971 4 555 1990" },
];

export const SEVERITY_TONE: Record<ExceptionSeverity, "neutral" | "warn" | "risk"> = {
  Low: "neutral", Medium: "warn", High: "risk", Critical: "risk",
};
export const LEG_TONE: Record<LegStatus, "neutral" | "info" | "cyan" | "ok" | "warn" | "risk"> = {
  Planned: "neutral", Ready: "info", "In Progress": "cyan", Completed: "ok", Delayed: "warn", Exception: "risk", Cancelled: "neutral",
};
export const STAGE_TONE: Record<ShipmentStage, "neutral" | "info" | "cyan" | "ok" | "warn" | "risk"> = {
  Enquiry: "neutral", Quoted: "info", Confirmed: "info", Booking: "info", Documentation: "warn", Pickup: "cyan",
  Customs: "warn", "Gate-In": "cyan", "In Transit": "cyan", Transshipment: "info", Destination: "info", Delivery: "cyan", Completed: "ok", Cancelled: "neutral",
};

export function getMilestoneStatus(m: ShipmentMilestone, now = new Date(DEMO_EXEC_NOW)): MilestoneStatus {
  if (m.status === "Completed" || m.actualAt) return "Completed";
  if (m.status === "Skipped" || m.status === "Exception") return m.status;
  const planned = new Date(m.plannedAt).getTime();
  if (Number.isNaN(planned)) return m.status;
  const delta = planned - now.getTime();
  if (delta < 0) return "Delayed";
  if (delta < 4 * 60 * 60 * 1000) return "Due Soon";
  return "Upcoming";
}

export const durationLabel = (from: string, to: string) => {
  const ms = Math.abs(new Date(to).getTime() - new Date(from).getTime());
  if (!Number.isFinite(ms)) return "—";
  const h = Math.floor(ms / 36e5), d = Math.floor(h / 24);
  return d ? `${d}d ${h % 24}h` : `${h}h`;
};

export const delayLabel = (planned: string, now = new Date(DEMO_EXEC_NOW)) => {
  const ms = now.getTime() - new Date(planned).getTime();
  if (ms <= 0) return "";
  const h = Math.floor(ms / 36e5), d = Math.floor(h / 24);
  return d ? `${d}d ${h % 24}h` : `${h}h ${Math.floor((ms % 36e5) / 6e4)}m`;
};

export const shipmentProgress = (s: OperationalShipment) => {
  if (!s.legs.length) return 0;
  const completed = s.legs.filter((l) => l.status === "Completed").length;
  const active = s.legs.some((l) => l.status === "In Progress") ? 0.55 : 0;
  return Math.min(100, Math.round(((completed + active) / s.legs.length) * 100));
};

export const currentLeg = (s: OperationalShipment) =>
  s.legs.find((l) => ["In Progress", "Delayed", "Exception", "Ready"].includes(l.status)) ?? s.legs.find((l) => l.status !== "Completed" && l.status !== "Cancelled") ?? s.legs[s.legs.length - 1];

export const nextMilestone = (s: OperationalShipment) =>
  s.milestones.map((m) => ({ m, state: getMilestoneStatus(m) })).find((x) => !["Completed", "Skipped"].includes(x.state))?.m;

export const openExceptions = (s: OperationalShipment) => s.exceptions.filter((x) => !["Resolved", "Closed"].includes(x.status));

export const shipmentIsDelayed = (s: OperationalShipment) =>
  s.legs.some((l) => l.status === "Delayed") || s.milestones.some((m) => getMilestoneStatus(m) === "Delayed") || openExceptions(s).some((e) => ["High", "Critical"].includes(e.severity));

export function deriveShipmentStage(s: OperationalShipment): ShipmentStage {
  if (s.stage === "Cancelled") return "Cancelled";
  if (s.legs.length && s.legs.every((l) => l.status === "Completed" || l.status === "Cancelled")) return "Completed";
  const legNow = currentLeg(s);
  if (legNow?.status === "In Progress" || legNow?.status === "Delayed" || legNow?.status === "Exception") return "In Transit";
  const nm = nextMilestone(s);
  if (nm?.type === "Customs") return "Customs";
  if (nm?.type === "Pickup") return "Pickup";
  if (legNow?.status === "Ready") return "Confirmed";
  if (!s.executionStarted) return s.stage === "Booking" ? "Booking" : "Confirmed";
  return s.stage;
}
