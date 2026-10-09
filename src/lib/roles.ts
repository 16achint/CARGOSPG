import type { Role } from "@/data/mockData";

export type IconKey =
  | "overview" | "customers" | "rfqs" | "rates" | "quotes" | "bookings" | "shipments" | "tower"
  | "docs" | "customs" | "warehouse" | "vendors" | "finance" | "reports" | "users" | "master"
  | "audit" | "help" | "settings" | "create" | "bell" | "search" | "chevron" | "menu" | "close"
  | "filter" | "refresh" | "logout" | "user" | "check" | "alert" | "clock" | "arrow" | "external"
  | "truck" | "ship" | "plane" | "train" | "pin" | "eye" | "spark" | "panel" | "sun";

export interface NavItem { key: string; label: string; to: string; icon: IconKey; roles: Role[]; badgeKey?: "rfq" | "docs" | "attention" }
export interface NavGroup { label: string; items: NavItem[] }

const ALL: Role[] = ["admin", "sales", "operations", "documentation", "finance", "management", "customer", "vendor"];
const INTERNAL: Role[] = ["admin", "sales", "operations", "documentation", "finance", "management"];

export const NAV_GROUPS: NavGroup[] = [
  { label: "Primary", items: [{ key: "overview", label: "Overview", to: "/app", icon: "overview", roles: ALL }] },
  {
    label: "Commercial",
    items: [
      { key: "customers", label: "Customers", to: "/app/customers", icon: "customers", roles: INTERNAL },
      { key: "rfqs", label: "RFQs", to: "/app/rfqs", icon: "rfqs", roles: INTERNAL, badgeKey: "rfq" },
      { key: "rates", label: "Rates", to: "/app/rates", icon: "rates", roles: ["admin", "sales", "finance", "management"] },
      { key: "quotes", label: "Quotations", to: "/app/quotes", icon: "quotes", roles: INTERNAL },
      { key: "bookings", label: "Bookings", to: "/app/bookings", icon: "bookings", roles: INTERNAL },
    ],
  },
  {
    label: "Execution",
    items: [
      { key: "shipments", label: "Shipments", to: "/app/shipments", icon: "shipments", roles: INTERNAL },
      { key: "tower", label: "Control Tower", to: "/app/control-tower", icon: "tower", roles: ["admin", "operations", "management", "documentation"] },
      { key: "exceptions", label: "Exceptions", to: "/app/control-tower/exceptions", icon: "alert", roles: ["admin", "operations", "management", "documentation"], badgeKey: "attention" },
      { key: "documents", label: "Documents", to: "/app/documents", icon: "docs", roles: ALL, badgeKey: "docs" },
      { key: "customs", label: "Customs", to: "/app/customs", icon: "customs", roles: ["admin", "operations", "documentation", "management"] },
      { key: "warehouse", label: "Warehouse", to: "/app/warehouse", icon: "warehouse", roles: ["admin", "operations", "management"] },
    ],
  },
  { label: "Network", items: [{ key: "vendors", label: "Vendors", to: "/app/vendors", icon: "vendors", roles: ["admin", "operations", "finance", "management", "vendor"] }] },
  {
    label: "My workspace",
    items: [
      { key: "my-rfqs", label: "My Enquiries", to: "/app/customer/rfqs", icon: "rfqs", roles: ["customer"] },
      { key: "my-quotes", label: "My Quotations", to: "/app/customer/quotes", icon: "quotes", roles: ["customer"] },
    ],
  },
  { label: "Finance", items: [{ key: "finance", label: "Finance", to: "/app/finance", icon: "finance", roles: ["admin", "finance", "management", "customer", "vendor"] }] },
  { label: "Intelligence", items: [{ key: "reports", label: "Reports", to: "/app/reports", icon: "reports", roles: INTERNAL }] },
  {
    label: "Administration",
    items: [
      { key: "admin-users", label: "Users & Roles", to: "/app/admin/users", icon: "users", roles: ["admin"] },
      { key: "admin-master", label: "Master Data", to: "/app/admin/master-data", icon: "master", roles: ["admin"] },
      { key: "admin-audit", label: "Audit Logs", to: "/app/admin/audit", icon: "audit", roles: ["admin"] },
    ],
  },
];

/** Special dashboards — a role's default landing screen. */
export const ROLE_HOME: Record<Role, { to: string; label: string }> = {
  operations: { to: "/app/overview", label: "Operations Overview" },
  management: { to: "/app/management", label: "Management Overview" },
  customer: { to: "/app/customer", label: "Customer Overview" },
  vendor: { to: "/app/vendor", label: "Vendor Overview" },
  sales: { to: "/app/sales", label: "Sales Overview" },
  finance: { to: "/app/finance-overview", label: "Finance Overview" },
  documentation: { to: "/app/overview", label: "Operations Overview" },
  admin: { to: "/app/overview", label: "Operations Overview" },
};

export const ALL_ROLES: { id: Role; label: string; person: string }[] = [
  { id: "operations", label: "Operations", person: "Rhea Kulkarni" },
  { id: "management", label: "Management", person: "Vikram Nair" },
  { id: "sales", label: "Sales", person: "Arjun Sharma" },
  { id: "finance", label: "Finance", person: "Meera Iyer" },
  { id: "customer", label: "Customer", person: "Apex Components" },
  { id: "vendor", label: "Vendor", person: "Deccan Roadways" },
  { id: "documentation", label: "Documentation", person: "Sanjay Patil" },
  { id: "admin", label: "Administrator", person: "System Administrator" },
];

export const navForRole = (role: Role) => NAV_GROUPS
  .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) }))
  .filter((g) => g.items.length > 0);

export const canNav = (role: Role, to: string) =>
  NAV_GROUPS.some((g) => g.items.some((i) => i.to === to && i.roles.includes(role)));

export interface QuickAction { key: string; label: string; hint: string; icon: IconKey; roles: Role[] }
export const QUICK_ACTIONS: QuickAction[] = [
  { key: "rfq", label: "New RFQ", hint: "Log a customer enquiry", icon: "rfqs", roles: INTERNAL },
  { key: "customer", label: "New Customer", hint: "Add a customer account", icon: "customers", roles: ["admin", "sales", "management"] },
  { key: "rate", label: "New Rate", hint: "Record a carrier rate", icon: "rates", roles: ["admin", "sales", "finance"] },
  { key: "quote", label: "New Quote", hint: "Build a customer quotation", icon: "quotes", roles: ["admin", "sales", "management"] },
  { key: "document", label: "Upload Document", hint: "Attach to a shipment", icon: "docs", roles: ALL },
  { key: "vendor", label: "Add Vendor", hint: "Register a service provider", icon: "vendors", roles: ["admin", "operations", "management"] },
  { key: "shipment", label: "New Shipment", hint: "Create a master shipment", icon: "shipments", roles: ["admin", "operations"] },
  { key: "pod", label: "Submit POD", hint: "Upload proof of delivery", icon: "truck", roles: ["vendor", "operations"] },
];
export const quickActionsFor = (role: Role) => QUICK_ACTIONS.filter((a) => a.roles.includes(role));
