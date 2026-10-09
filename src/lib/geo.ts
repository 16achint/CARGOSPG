/* Pacific-centred equirectangular projection so India → Singapore → Houston
   reads left-to-right across the Pacific and through Panama. */
export type LonLat = [number, number];
export type Pt = [number, number];

const LON0 = -30;
export const MAP_W = 1000;
export const MAP_H = 500;

export function project([lon, lat]: LonLat): Pt {
  let l = lon - LON0;
  if (l < 0) l += 360;
  if (l >= 360) l -= 360;
  return [(l / 360) * MAP_W, ((90 - lat) / 180) * MAP_H];
}

const f = (n: number) => Math.round(n * 10) / 10;

export function polygonPath(pts: LonLat[]) {
  return pts.map((p, i) => {
    const [x, y] = project(p);
    return `${i ? "L" : "M"}${f(x)} ${f(y)}`;
  }).join(" ") + " Z";
}

/** Catmull-Rom → cubic bezier smoothing through projected points */
export function smoothPath(pts: LonLat[]) {
  const p = pts.map(project);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Simple arc between two points (used for faint trade lanes) */
export function arcPath(a: LonLat, b: LonLat, lift = 0.22) {
  const [x1, y1] = project(a);
  const [x2, y2] = project(b);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  return `M${f(x1)} ${f(y1)} Q${f(mx)} ${f(my - dist * lift)} ${f(x2)} ${f(y2)}`;
}

/* ---------------- Continents (coarse, stylised) ---------------- */
export const CONTINENTS: LonLat[][] = [
  // North America
  [[-165, 65], [-140, 70], [-100, 72], [-80, 65], [-62, 58], [-55, 48], [-70, 42], [-76, 35], [-81, 26], [-90, 30], [-97, 27], [-97, 20], [-88, 15], [-78, 8], [-84, 10], [-92, 15], [-106, 22], [-112, 29], [-117, 32], [-124, 40], [-125, 48], [-135, 58], [-150, 60], [-165, 60]],
  // Greenland (clipped at seam)
  [[-55, 82], [-33, 83], [-33, 70], [-45, 60], [-55, 70]],
  // South America
  [[-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -38], [-65, -55], [-72, -50], [-72, -30], [-70, -18], [-80, -5]],
  // Europe
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [5, 52], [8, 57], [5, 62], [15, 69], [28, 71], [40, 67], [40, 45], [28, 41], [20, 40], [12, 44], [15, 38], [5, 43], [-5, 36]],
  // Africa
  [[-17, 21], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [40, -5], [40, -15], [35, -25], [20, -35], [17, -28], [12, -15], [9, 0], [-8, 5], [-17, 14]],
  // Asia
  [[40, 67], [60, 70], [80, 74], [100, 78], [130, 72], [160, 70], [179, 67], [175, 62], [160, 58], [142, 52], [140, 45], [130, 42], [122, 40], [122, 30], [118, 23], [108, 20], [105, 10], [100, 13], [98, 8], [103, 1], [100, 6], [97, 17], [92, 22], [88, 22], [80, 15], [77, 8], [73, 20], [67, 25], [57, 25], [52, 28], [48, 30], [56, 24], [59, 22], [52, 16], [43, 12], [35, 28], [36, 36], [28, 41], [40, 45]],
  // Australia
  [[114, -22], [114, -34], [130, -32], [140, -38], [150, -37], [153, -27], [145, -15], [142, -11], [136, -12], [130, -12], [122, -17]],
  // Indonesia
  [[95, 5], [105, -6], [120, -9], [140, -8], [150, -6], [140, -2], [120, 2], [108, 3]],
  // Japan
  [[130, 32], [141, 45], [142, 38], [135, 33]],
  // UK
  [[-5, 50], [-3, 58], [1, 52]],
];

export const CONTINENT_PATHS = CONTINENTS.map(polygonPath);

/* ---------------- Routes ---------------- */
export type Mode = "truck" | "ocean" | "air" | "rail";

export interface RouteNode {
  id: string;
  label: string;
  sub: string;
  at: LonLat;
  labelPos?: "top" | "bottom" | "left" | "right";
}
export interface RouteDef {
  nodes: RouteNode[];
  /** segment i connects node i → node i+1 through waypoints */
  segments: { mode: Mode; via: LonLat[] }[];
}

export const HERO_ROUTE: RouteDef = {
  nodes: [
    { id: "pune", label: "Pune Factory", sub: "Origin", at: [79, 15], labelPos: "bottom" },
    { id: "nhava", label: "Nhava Sheva", sub: "INNSA", at: [72.9, 19.2], labelPos: "top" },
    { id: "sin", label: "Singapore", sub: "SGSIN · T/S", at: [103.8, 1.3], labelPos: "bottom" },
    { id: "hou", label: "Houston Port", sub: "USHOU", at: [-95.3, 29.4], labelPos: "bottom" },
    { id: "cust", label: "Customer DC", sub: "Memphis", at: [-90, 35.5], labelPos: "top" },
  ],
  segments: [
    { mode: "truck", via: [[76, 17.6]] },
    { mode: "ocean", via: [[71.5, 12], [76, 6], [82, 5.2], [95, 6.4], [100, 3.4]] },
    { mode: "ocean", via: [[110, 6], [118, 14], [130, 20], [155, 24], [180, 24], [-150, 20], [-120, 13], [-95, 9], [-82, 7.4], [-79.6, 9.5], [-81, 15.5], [-86, 21.5], [-90, 26.5]] },
    { mode: "truck", via: [[-92.5, 32.5]] },
  ],
};

export const LOGIN_ROUTE: RouteDef = {
  nodes: [
    { id: "bom", label: "Mumbai", sub: "INBOM", at: [72.9, 19.0], labelPos: "top" },
    { id: "sin", label: "Singapore", sub: "SGSIN", at: [103.8, 1.3], labelPos: "bottom" },
    { id: "hou", label: "Houston", sub: "USHOU", at: [-95.3, 29.4], labelPos: "top" },
  ],
  segments: [
    { mode: "ocean", via: [[71.5, 12], [76, 6], [82, 5.2], [95, 6.4], [100, 3.4]] },
    { mode: "ocean", via: [[110, 6], [118, 14], [130, 20], [155, 24], [180, 24], [-150, 20], [-120, 13], [-95, 9], [-82, 7.4], [-79.6, 9.5], [-81, 15.5], [-86, 21.5], [-90, 26.5]] },
  ],
};

export function segmentPaths(route: RouteDef) {
  return route.segments.map((s, i) =>
    smoothPath([route.nodes[i].at, ...s.via, route.nodes[i + 1].at])
  );
}

/* Faint global trade lanes */
export const HUBS: { id: string; at: LonLat }[] = [
  { id: "Shanghai", at: [121.5, 31.2] },
  { id: "Busan", at: [129, 35.1] },
  { id: "Tokyo", at: [139.7, 35.6] },
  { id: "Hong Kong", at: [114.2, 22.3] },
  { id: "Dubai", at: [55.3, 25.2] },
  { id: "Colombo", at: [79.9, 6.9] },
  { id: "Sydney", at: [151.2, -33.9] },
  { id: "Los Angeles", at: [-118.2, 33.9] },
  { id: "Seattle", at: [-122.3, 47.6] },
  { id: "Anchorage", at: [-149.9, 61.2] },
  { id: "Chicago", at: [-87.6, 41.9] },
  { id: "Panama", at: [-79.5, 9] },
  { id: "New York", at: [-74, 40.7] },
];

export const LANES: { d: string; kind: "air" | "sea" }[] = [
  { d: arcPath([121.5, 31.2], [-118.2, 33.9], 0.18), kind: "sea" },
  { d: arcPath([129, 35.1], [-122.3, 47.6], 0.2), kind: "sea" },
  { d: arcPath([139.7, 35.6], [-149.9, 61.2], 0.25), kind: "air" },
  { d: arcPath([-149.9, 61.2], [-87.6, 41.9], 0.18), kind: "air" },
  { d: arcPath([55.3, 25.2], [72.9, 19], 0.3), kind: "sea" },
  { d: arcPath([114.2, 22.3], [103.8, 1.3], 0.25), kind: "sea" },
  { d: arcPath([151.2, -33.9], [103.8, 1.3], 0.2), kind: "sea" },
  { d: arcPath([72.9, 19], [139.7, 35.6], 0.22), kind: "air" },
  { d: arcPath([-118.2, 33.9], [-79.5, 9], 0.15), kind: "sea" },
  { d: arcPath([-87.6, 41.9], [-74, 40.7], 0.4), kind: "air" },
  { d: arcPath([55.3, 25.2], [114.2, 22.3], 0.2), kind: "air" },
];

export const HERO_VIEWBOX = { x: 160, y: 50, w: 740, h: 320 };
