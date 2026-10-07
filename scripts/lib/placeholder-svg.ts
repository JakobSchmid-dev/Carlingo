/**
 * Builds placeholder SVG images: a coloured card with a simple car outline, the vehicle ID and
 * the view. Lets the app run without any image rights. Real photos replace these files later.
 */

export const VIEW_LABELS: Record<string, string> = {
  front: 'Front',
  rear: 'Heck',
  side: 'Seite',
  'front-three-quarter': 'Front schräg',
  'rear-three-quarter': 'Heck schräg',
  interior: 'Innenraum',
};

/** Deterministic hue from the vehicle id, so each vehicle keeps its colour. */
export function hueFor(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

const HEIGHTS: Record<string, number> = {
  suv: 1.25,
  'suv-coupe': 1.15,
  van: 1.35,
  roadster: 0.8,
  cabriolet: 0.85,
  coupe: 0.9,
};

function sideOutline(bodyStyle: string): string {
  const k = HEIGHTS[bodyStyle] ?? 1;
  const roof = 300 - 90 * k;
  const belt = 330 - 30 * k;
  const longRoof = bodyStyle === 'estate' || bodyStyle === 'suv' || bodyStyle === 'van';
  const roofEnd = longRoof ? 590 : 520;
  const cabin =
    bodyStyle === 'roadster' || bodyStyle === 'cabriolet'
      ? `<path d="M330 ${belt} L380 ${roof + 20} L400 ${roof + 20} L380 ${belt} Z" />`
      : `<path d="M300 ${belt} L370 ${roof} L${roofEnd} ${roof} L${roofEnd + 50} ${belt} Z" />`;
  return `
    <path d="M150 ${belt} Q160 ${belt - 20} 220 ${belt - 15} L650 ${belt - 10} Q690 ${belt} 680 420 L130 420 Q120 ${belt + 20} 150 ${belt} Z" />
    ${cabin}
    <circle cx="245" cy="420" r="48" /><circle cx="560" cy="420" r="48" />`;
}

function frontRearOutline(bodyStyle: string, rear: boolean): string {
  const k = HEIGHTS[bodyStyle] ?? 1;
  const top = 290 - 80 * k;
  return `
    <path d="M230 ${top} L570 ${top} L620 330 L180 330 Z" opacity="0.75" />
    <rect x="160" y="320" width="480" height="110" rx="30" />
    <rect x="190" y="430" width="70" height="40" rx="8" /><rect x="540" y="430" width="70" height="40" rx="8" />
    <rect x="190" y="350" width="110" height="${rear ? 26 : 34}" rx="10" fill="white" opacity="0.8" />
    <rect x="500" y="350" width="110" height="${rear ? 26 : 34}" rx="10" fill="white" opacity="0.8" />`;
}

function detailOutline(view: string): string {
  if (view === 'front' || view === 'front-three-quarter') {
    return `
      <rect x="220" y="200" width="360" height="200" rx="40" />
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${250 + i * 36}" y="225" width="14" height="150" rx="6" fill="white" opacity="0.6" />`).join('')}`;
  }
  return `
    <rect x="120" y="240" width="560" height="120" rx="60" />
    <rect x="160" y="275" width="200" height="50" rx="25" fill="white" opacity="0.7" />
    <rect x="440" y="275" width="200" height="50" rx="25" fill="white" opacity="0.7" />`;
}

function interiorOutline(): string {
  return `
    <rect x="120" y="180" width="560" height="90" rx="20" opacity="0.7" />
    <circle cx="300" cy="360" r="90" fill="none" stroke-width="22" />
    <circle cx="300" cy="360" r="20" />`;
}

export interface PlaceholderInput {
  vehicleId: string;
  bodyStyle: string;
  view: string;
  detail: boolean;
}

export function placeholderSvg({ vehicleId, bodyStyle, view, detail }: PlaceholderInput): string {
  const hue = hueFor(vehicleId);
  const shape = detail
    ? detailOutline(view)
    : view === 'interior'
      ? interiorOutline()
      : view === 'front' || view === 'rear'
        ? frontRearOutline(bodyStyle, view === 'rear')
        : sideOutline(bodyStyle);
  const mirrored = view === 'rear-three-quarter' && !detail;
  const label = `${VIEW_LABELS[view] ?? view}${detail ? ' · Detail' : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="hsl(${hue} 45% 88%)" />
  <g fill="hsl(${hue} 40% 35%)" stroke="hsl(${hue} 40% 35%)"${mirrored ? ' transform="translate(800 0) scale(-1 1)"' : ''}>${shape}
  </g>
  <text x="400" y="530" text-anchor="middle" font-family="system-ui, sans-serif" font-size="30" fill="hsl(${hue} 40% 22%)">${vehicleId}</text>
  <text x="400" y="568" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="hsl(${hue} 30% 30%)">${label} · Platzhalter</text>
</svg>
`;
}
