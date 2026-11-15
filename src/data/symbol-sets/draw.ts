export const O = '#1f2937';
export const SKIN = '#f5c9a3';
export const SKIN2 = '#c68642';
export const SKIN3 = '#8d5524';
export const HAIR = '#5b3a29';
export const BLOND = '#e8b84a';
export const BLACKHAIR = '#2b2b2b';
export const GRAYHAIR = '#d1d5db';
export const BLUE = '#3b82f6';
export const SKY = '#93c5fd';
export const NAVY = '#1e3a8a';
export const RED = '#e11d48';
export const GREEN = '#16a34a';
export const LIME = '#22c55e';
export const YEL = '#facc15';
export const ORANGE = '#f97316';
export const PURPLE = '#8b5cf6';
export const PINK = '#ec4899';
export const TEAL = '#14b8a6';
export const GRAY = '#9ca3af';
export const DARK = '#4b5563';
export const LIGHT = '#e5e7eb';
export const WHITE = '#ffffff';
export const BROWN = '#b45309';
export const WOOD = '#d97706';
export const CREAM = '#fef3c7';
export const WATER = '#60a5fa';

export const SW = 3;

export const svg = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const circle = (cx: number, cy: number, r: number, fill: string, w = SW) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${O}" stroke-width="${w}"/>`;
export const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, w = SW) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${O}" stroke-width="${w}"/>`;
export const dot = (cx: number, cy: number, r: number, fill = O) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
export const rect = (x: number, y: number, w: number, h: number, rx: number, fill: string, sw = SW) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${O}" stroke-width="${sw}"/>`;
export const path = (d: string, fill: string, w = SW) => `<path d="${d}" fill="${fill}" stroke="${O}" stroke-width="${w}"/>`;
export const fillPath = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;
export const line = (d: string, color: string, w: number) => `<path d="${d}" stroke="${color}" stroke-width="${w}"/>`;
export const dashed = (d: string, color: string, w: number, dash = '4 6') =>
  `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-dasharray="${dash}"/>`;
export const limb = (d: string, color: string, w = 8) => line(d, O, w + 5) + line(d, color, w);
export const text = (x: number, y: number, t: string, size: number, fill: string, weight = 800) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" stroke="none">${t}</text>`;
export const g = (transform: string, inner: string) => `<g transform="${transform}">${inner}</g>`;
export const flip = (inner: string) => g('translate(100 0) scale(-1 1)', inner);
export const at = (x: number, y: number, s: number, inner: string) => g(`translate(${x} ${y}) scale(${s})`, inner);

export function arrow(x1: number, y1: number, x2: number, y2: number, color = RED, w = 6, head = 11) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - Math.cos(a) * head;
  const by = y2 - Math.sin(a) * head;
  const px = Math.cos(a + Math.PI / 2) * head * 0.62;
  const py = Math.sin(a + Math.PI / 2) * head * 0.62;
  return (
    line(`M ${x1} ${y1} L ${bx} ${by}`, color, w) +
    `<path d="M ${x2} ${y2} L ${bx + px} ${by + py} L ${bx - px} ${by - py} Z" fill="${color}" stroke="${color}" stroke-width="2"/>`
  );
}

export function curvedArrow(d: string, x2: number, y2: number, angle: number, color = RED, w = 6) {
  const head = 10;
  const bx = x2 - Math.cos(angle) * head;
  const by = y2 - Math.sin(angle) * head;
  const px = Math.cos(angle + Math.PI / 2) * head * 0.62;
  const py = Math.sin(angle + Math.PI / 2) * head * 0.62;
  return (
    line(d, color, w) +
    `<path d="M ${x2} ${y2} L ${bx + px} ${by + py} L ${bx - px} ${by - py} Z" fill="${color}" stroke="${color}" stroke-width="2"/>`
  );
}

export const heart = (cx: number, cy: number, s: number, fill = RED) =>
  path(
    `M ${cx} ${cy + s * 0.9} C ${cx - s * 1.5} ${cy - s * 0.1}, ${cx - s * 0.9} ${cy - s * 1.15}, ${cx} ${cy - s * 0.4} C ${cx + s * 0.9} ${cy - s * 1.15}, ${cx + s * 1.5} ${cy - s * 0.1}, ${cx} ${cy + s * 0.9} Z`,
    fill,
  );

export const star = (cx: number, cy: number, r: number, fill = YEL, w = SW) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${O}" stroke-width="${w}"/>`;
};

export const box = (x: number, y: number, s: number, fill = WOOD) =>
  path(`M ${x} ${y + s * 0.25} L ${x + s * 0.5} ${y} L ${x + s} ${y + s * 0.25} L ${x + s} ${y + s} L ${x} ${y + s} Z`, fill) +
  line(`M ${x} ${y + s * 0.25} L ${x + s} ${y + s * 0.25}`, O, SW) +
  line(`M ${x + s * 0.5} ${y} L ${x + s * 0.5} ${y + s * 0.25}`, O, 2);

export const ball = (cx: number, cy: number, r: number, fill = RED) =>
  circle(cx, cy, r, fill) +
  line(`M ${cx - r} ${cy} Q ${cx} ${cy + r * 0.55} ${cx + r} ${cy}`, WHITE, Math.max(2, r * 0.18)) +
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${O}" stroke-width="${SW}"/>`;

export const sun = (cx: number, cy: number, r: number) => {
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    rays += line(
      `M ${(cx + Math.cos(a) * (r + 4)).toFixed(1)} ${(cy + Math.sin(a) * (r + 4)).toFixed(1)} L ${(cx + Math.cos(a) * (r + 11)).toFixed(1)} ${(cy + Math.sin(a) * (r + 11)).toFixed(1)}`,
      ORANGE,
      4,
    );
  }
  return rays + circle(cx, cy, r, YEL);
};

export const moon = (cx: number, cy: number, r: number, fill = YEL) =>
  path(`M ${cx + r * 0.3} ${cy - r} A ${r} ${r} 0 1 0 ${cx + r} ${cy + r * 0.45} A ${r * 0.8} ${r * 0.8} 0 1 1 ${cx + r * 0.3} ${cy - r} Z`, fill);

export const cloud = (cx: number, cy: number, s: number, fill = WHITE) =>
  path(
    `M ${cx - 24 * s} ${cy + 10 * s} Q ${cx - 34 * s} ${cy + 10 * s} ${cx - 32 * s} ${cy} Q ${cx - 30 * s} ${cy - 10 * s} ${cx - 18 * s} ${cy - 8 * s} Q ${cx - 14 * s} ${cy - 22 * s} ${cx} ${cy - 20 * s} Q ${cx + 14 * s} ${cy - 20 * s} ${cx + 16 * s} ${cy - 8 * s} Q ${cx + 32 * s} ${cy - 10 * s} ${cx + 32 * s} ${cy + 2 * s} Q ${cx + 32 * s} ${cy + 10 * s} ${cx + 22 * s} ${cy + 10 * s} Z`,
    fill,
  );

export const drop = (cx: number, cy: number, s: number, fill = WATER) =>
  path(`M ${cx} ${cy - 12 * s} Q ${cx + 10 * s} ${cy + 1 * s} ${cx + 8 * s} ${cy + 6 * s} Q ${cx + 5 * s} ${cy + 12 * s} ${cx} ${cy + 12 * s} Q ${cx - 5 * s} ${cy + 12 * s} ${cx - 8 * s} ${cy + 6 * s} Q ${cx - 10 * s} ${cy + 1 * s} ${cx} ${cy - 12 * s} Z`, fill, 2.5);

export const clockFace = (cx: number, cy: number, r: number, h: number, m: number, fill = WHITE) => {
  const ha = ((h % 12) / 12 + m / 720) * Math.PI * 2 - Math.PI / 2;
  const ma = (m / 60) * Math.PI * 2 - Math.PI / 2;
  let ticks = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ticks += dot(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8, r * 0.05);
  }
  return (
    circle(cx, cy, r, fill, 4) +
    ticks +
    line(`M ${cx} ${cy} L ${(cx + Math.cos(ha) * r * 0.48).toFixed(1)} ${(cy + Math.sin(ha) * r * 0.48).toFixed(1)}`, O, 5) +
    line(`M ${cx} ${cy} L ${(cx + Math.cos(ma) * r * 0.7).toFixed(1)} ${(cy + Math.sin(ma) * r * 0.7).toFixed(1)}`, O, 3.5) +
    dot(cx, cy, 3.5)
  );
};

export const calendar = (label: string, color = RED, big = false) =>
  rect(14, 18, 72, 70, 8, WHITE, 4) +
  path('M 14 26 Q 14 18 22 18 L 78 18 Q 86 18 86 26 L 86 40 L 14 40 Z', color, 4) +
  rect(28, 10, 7, 16, 3, GRAY, 2.5) +
  rect(65, 10, 7, 16, 3, GRAY, 2.5) +
  text(50, big ? 77 : 74, label, big ? 34 : label.length > 3 ? 18 : 24, O);

export const bubble = (fill = WHITE) =>
  path('M 16 22 Q 16 12 26 12 L 74 12 Q 84 12 84 22 L 84 56 Q 84 66 74 66 L 44 66 L 28 82 L 30 66 L 26 66 Q 16 66 16 56 Z', fill);

export const groundLine = (y = 90) => line(`M 12 ${y} L 88 ${y}`, GRAY, 4);

export const badge = (cx: number, cy: number, r: number, fill: string, mark: 'check' | 'x' | 'plus' | 'q' | '!' | 'minus') => {
  const m =
    mark === 'check'
      ? line(`M ${cx - r * 0.5} ${cy} L ${cx - r * 0.12} ${cy + r * 0.4} L ${cx + r * 0.55} ${cy - r * 0.4}`, WHITE, r * 0.3)
      : mark === 'x'
        ? line(`M ${cx - r * 0.4} ${cy - r * 0.4} L ${cx + r * 0.4} ${cy + r * 0.4} M ${cx + r * 0.4} ${cy - r * 0.4} L ${cx - r * 0.4} ${cy + r * 0.4}`, WHITE, r * 0.3)
        : mark === 'plus'
          ? line(`M ${cx - r * 0.5} ${cy} L ${cx + r * 0.5} ${cy} M ${cx} ${cy - r * 0.5} L ${cx} ${cy + r * 0.5}`, WHITE, r * 0.3)
          : mark === 'minus'
            ? line(`M ${cx - r * 0.5} ${cy} L ${cx + r * 0.5} ${cy}`, WHITE, r * 0.3)
            : text(cx, cy + r * 0.5, mark === 'q' ? '?' : '!', r * 1.4, WHITE);
  return circle(cx, cy, r, fill) + m;
};

export const qmark = (cx: number, cy: number, size = 30, fill = PURPLE) =>
  text(cx + 1.5, cy + 1.5, '?', size, O) + text(cx, cy, '?', size, fill);

export type Face =
  | 'smile'
  | 'grin'
  | 'neutral'
  | 'sad'
  | 'open'
  | 'frown'
  | 'flat'
  | 'wavy'
  | 'o'
  | 'tongue';
export type Pose =
  | 'down'
  | 'chest'
  | 'point'
  | 'reach'
  | 'up'
  | 'hold'
  | 'give'
  | 'wave'
  | 'run'
  | 'down-point'
  | 'hips'
  | 'stop'
  | 'mouth'
  | 'ear'
  | 'head'
  | 'belly'
  | 'shrug'
  | 'hug'
  | 'think'
  | 'phone';

export interface PersonOpts {
  x?: number;
  y?: number;
  s?: number;
  shirt?: string;
  pants?: string;
  skin?: string;
  hair?: 'short' | 'long' | 'none' | 'bun' | 'pony' | 'curly' | 'bald';
  hairColor?: string;
  pose?: Pose;
  walk?: boolean;
  sit?: boolean;
  face?: Face;
  glasses?: boolean;
  beard?: boolean;
  skirt?: boolean;
  hat?: 'cap' | 'nurse' | 'none';
  extra?: string;
}

export function faceMarks(face: Face, cy: number) {
  const eyes = `<circle cx="-4" cy="${cy - 1}" r="1.8" fill="${O}"/><circle cx="4" cy="${cy - 1}" r="1.8" fill="${O}"/>`;
  const mouths: Record<Face, string> = {
    smile: line(`M -4.5 ${cy + 4} Q 0 ${cy + 8} 4.5 ${cy + 4}`, O, 2.2),
    grin: path(`M -5 ${cy + 3.5} Q 0 ${cy + 10} 5 ${cy + 3.5} Z`, WHITE, 2),
    neutral: line(`M -3.5 ${cy + 5} L 3.5 ${cy + 5}`, O, 2.2),
    flat: line(`M -3.5 ${cy + 5} L 3.5 ${cy + 5}`, O, 2.2),
    sad: line(`M -4.5 ${cy + 7} Q 0 ${cy + 3} 4.5 ${cy + 7}`, O, 2.2),
    frown: line(`M -4.5 ${cy + 7} Q 0 ${cy + 3} 4.5 ${cy + 7}`, O, 2.2),
    open: `<ellipse cx="0" cy="${cy + 5}" rx="3" ry="3.4" fill="${O}"/>`,
    o: `<ellipse cx="0" cy="${cy + 5}" rx="2.2" ry="2.6" fill="${O}"/>`,
    wavy: line(`M -5 ${cy + 5} Q -2.5 ${cy + 3} 0 ${cy + 5} Q 2.5 ${cy + 7} 5 ${cy + 5}`, O, 2),
    tongue: line(`M -4.5 ${cy + 4} Q 0 ${cy + 8} 4.5 ${cy + 4}`, O, 2.2) + `<ellipse cx="1.5" cy="${cy + 7.5}" rx="2.2" ry="2.4" fill="${PINK}"/>`,
  };
  return eyes + mouths[face];
}

const ARMS: Record<Pose, { l: string; lh: [number, number] | null; r: string; rh: [number, number] | null }> = {
  down: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 20 0 18 11', rh: [18, 12] },
  chest: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 17 4 3 -3', rh: [2, -3] },
  point: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 24 -12 33 -12', rh: [34, -12] },
  reach: { l: 'M -13 -10 Q -6 -18 16 -24', lh: [17, -25], r: 'M 13 -10 Q 22 -16 31 -24', rh: [32, -25] },
  up: { l: 'M -13 -10 Q -24 -20 -21 -36', lh: [-21, -37], r: 'M 13 -10 Q 24 -20 21 -36', rh: [21, -37] },
  hold: { l: 'M -13 -10 Q -18 2 -6 2', lh: [-5, 2], r: 'M 13 -10 Q 18 2 6 2', rh: [5, 2] },
  give: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 22 -4 32 -4', rh: [33, -4] },
  wave: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 26 -14 24 -30', rh: [24, -31] },
  run: { l: 'M -13 -10 Q -22 -2 -24 -12', lh: [-24, -13], r: 'M 13 -10 Q 20 2 26 6', rh: [27, 6] },
  'down-point': { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 24 2 28 14', rh: [28, 15] },
  hips: { l: 'M -13 -10 Q -26 -2 -13 6', lh: [-12, 6], r: 'M 13 -10 Q 26 -2 13 6', rh: [12, 6] },
  stop: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 26 -10 27 -24', rh: [27, -26] },
  mouth: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 20 -8 8 -20', rh: [7, -21] },
  ear: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 22 -16 14 -27', rh: [14, -28] },
  head: { l: 'M -13 -10 Q -24 -18 -12 -34', lh: [-11, -35], r: 'M 13 -10 Q 24 -18 12 -34', rh: [11, -35] },
  belly: { l: 'M -13 -10 Q -20 4 -4 4', lh: [-3, 4], r: 'M 13 -10 Q 20 4 4 6', rh: [4, 6] },
  shrug: { l: 'M -13 -10 Q -26 -4 -26 -16', lh: [-27, -17], r: 'M 13 -10 Q 26 -4 26 -16', rh: [27, -17] },
  hug: { l: 'M -13 -10 Q -6 2 8 -2', lh: [9, -2], r: 'M 13 -10 Q 6 4 -8 0', rh: [-9, 0] },
  think: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 18 -6 6 -16', rh: [5, -17] },
  phone: { l: 'M -13 -10 Q -20 0 -18 11', lh: [-18, 12], r: 'M 13 -10 Q 22 -14 13 -24', rh: [12, -25] },
};

export function person(o: PersonOpts = {}) {
  const {
    x = 50,
    y = 52,
    s = 1,
    shirt = BLUE,
    pants = NAVY,
    skin = SKIN,
    hair = 'short',
    hairColor = HAIR,
    pose = 'down',
    walk = false,
    sit = false,
    face = 'smile',
    glasses = false,
    beard = false,
    skirt = false,
    hat = 'none',
    extra = '',
  } = o;
  const legs = sit
    ? limb('M -6 10 L 16 12 L 16 36', pants, 9) + limb('M 4 10 L 24 12 L 24 36', pants, 9)
    : walk
      ? limb('M -5 12 L -15 38', pants, 9) + limb('M 5 12 L 13 37', pants, 9)
      : limb('M -6 12 L -7 38', pants, 9) + limb('M 6 12 L 7 38', pants, 9);
  const skirtShape = skirt ? path('M -12 8 L 12 8 L 17 24 L -17 24 Z', pants) : '';
  const torso = path('M -14 -9 Q -14 -15 -8 -15 L 8 -15 Q 14 -15 14 -9 L 12 13 L -12 13 Z', shirt);
  const a = ARMS[pose];
  const arms = limb(a.l, shirt, 7) + limb(a.r, shirt, 7);
  const hands = (a.lh ? circle(a.lh[0], a.lh[1], 4.2, skin, 2.5) : '') + (a.rh ? circle(a.rh[0], a.rh[1], 4.2, skin, 2.5) : '');
  const backHair =
    hair === 'long'
      ? path('M -12 -28 Q -15 -12 -10 -12 L 10 -12 Q 15 -12 12 -28 Z', hairColor, 2.5)
      : hair === 'pony'
        ? path('M 9 -34 Q 22 -30 18 -16 Q 14 -22 9 -26 Z', hairColor, 2.5)
        : hair === 'bun'
          ? circle(0, -41, 6, hairColor, 2.5)
          : '';
  const head = circle(0, -27, 11, skin);
  const topHair =
    hair === 'short'
      ? path('M -11.5 -27 Q -12 -40 0 -40 Q 12 -40 11.5 -27 Q 7 -33 0 -33 Q -7 -33 -11.5 -27 Z', hairColor, 2.5)
      : hair === 'long' || hair === 'pony' || hair === 'bun'
        ? path('M -12 -25 Q -13 -41 0 -41 Q 13 -41 12 -25 Q 9 -34 0 -34 Q -9 -34 -12 -25 Z', hairColor, 2.5)
        : hair === 'curly'
          ? path('M -12 -26 Q -16 -32 -11 -36 Q -10 -43 -3 -41 Q 2 -45 7 -41 Q 14 -42 13 -35 Q 17 -31 12 -26 Q 8 -33 0 -33 Q -8 -33 -12 -26 Z', hairColor, 2.5)
          : hair === 'bald'
            ? path('M -11.5 -24 Q -13 -30 -10 -30 L -9 -24 Z M 11.5 -24 Q 13 -30 10 -30 L 9 -24 Z', hairColor, 2)
            : '';
  const glassesMarks = glasses
    ? `<circle cx="-4.5" cy="-28" r="3.6" fill="none" stroke="${O}" stroke-width="1.8"/><circle cx="4.5" cy="-28" r="3.6" fill="none" stroke="${O}" stroke-width="1.8"/>` +
      line('M -0.9 -28 L 0.9 -28', O, 1.6)
    : '';
  const beardShape = beard ? path('M -10 -24 Q -9 -12 0 -12 Q 9 -12 10 -24 Q 6 -20 0 -20 Q -6 -20 -10 -24 Z', hairColor, 2) : '';
  const hatShape =
    hat === 'cap'
      ? path('M -12 -30 Q -12 -42 0 -42 Q 12 -42 12 -30 Z', shirt, 2.5) + path('M 8 -31 L 22 -30 L 12 -28 Z', shirt, 2)
      : hat === 'nurse'
        ? path('M -9 -36 L -8 -44 L 8 -44 L 9 -36 Z', WHITE, 2.5) + line('M 0 -42 L 0 -38 M -2 -40 L 2 -40', RED, 1.8)
        : '';
  return `<g transform="translate(${x} ${y}) scale(${s})">${legs}${skirtShape}${torso}${arms}${backHair}${head}${topHair}${beardShape}${faceMarks(face, -27)}${glassesMarks}${hatShape}${extra}${hands}</g>`;
}

export type Brow = 'none' | 'angry' | 'worried' | 'raised';
export type Eyes = 'dot' | 'closed' | 'wide' | 'happy' | 'x' | 'spiral' | 'half' | 'wink' | 'stars' | 'hearts';
export type Mouth = 'happy' | 'grin' | 'sad' | 'neutral' | 'o' | 'wavy' | 'teeth' | 'tongue' | 'small' | 'yawn' | 'side';

export function face(opts: { eyes?: Eyes; brow?: Brow; mouth?: Mouth; fill?: string; extra?: string; blush?: boolean } = {}) {
  const { eyes = 'dot', brow = 'none', mouth = 'happy', fill = YEL, extra = '', blush = false } = opts;
  const eyeMarks: Record<Eyes, string> = {
    dot: dot(38, 42, 4.4) + dot(62, 42, 4.4),
    wide: circle(38, 42, 7, WHITE, 2.5) + dot(38, 43, 3.4) + circle(62, 42, 7, WHITE, 2.5) + dot(62, 43, 3.4),
    closed: line('M 31 44 Q 38 49 45 44 M 55 44 Q 62 49 69 44', O, 3.5),
    happy: line('M 31 45 Q 38 37 45 45 M 55 45 Q 62 37 69 45', O, 3.5),
    half: line('M 31 42 L 45 42 M 55 42 L 69 42', O, 3.5) + fillPath('M 32 43 Q 38 49 44 43 Z M 56 43 Q 62 49 68 43 Z', O),
    x: line('M 33 37 L 43 47 M 43 37 L 33 47 M 57 37 L 67 47 M 67 37 L 57 47', O, 3.5),
    spiral: line('M 38 42 m -1 0 a 1 1 0 1 1 2 0 a 3 3 0 1 1 -5 0 a 5 5 0 1 1 9 0 M 62 42 m -1 0 a 1 1 0 1 1 2 0 a 3 3 0 1 1 -5 0 a 5 5 0 1 1 9 0', O, 2.4),
    wink: dot(38, 42, 4.4) + line('M 55 43 Q 62 38 69 43', O, 3.5),
    stars: star(38, 42, 8, ORANGE, 2) + star(62, 42, 8, ORANGE, 2),
    hearts: heart(38, 43, 6) + heart(62, 43, 6),
  };
  const brows: Record<Brow, string> = {
    none: '',
    angry: line('M 29 30 L 45 36 M 71 30 L 55 36', O, 4.5),
    worried: line('M 30 34 L 44 29 M 70 34 L 56 29', O, 4),
    raised: line('M 30 30 Q 38 24 46 30 M 54 30 Q 62 24 70 30', O, 3.5),
  };
  const mouths: Record<Mouth, string> = {
    happy: line('M 32 58 Q 50 76 68 58', O, 4.5),
    grin: path('M 30 57 Q 50 82 70 57 Z', WHITE, 4),
    sad: line('M 33 70 Q 50 56 67 70', O, 4.5),
    neutral: line('M 35 64 L 65 64', O, 4.5),
    o: ellipse(50, 66, 7, 9, O, 2),
    wavy: line('M 32 64 Q 38 58 44 64 Q 50 70 56 64 Q 62 58 68 64', O, 4),
    teeth: rect(32, 58, 36, 14, 5, WHITE, 3.5) + line('M 32 65 L 68 65 M 41 58 L 41 72 M 50 58 L 50 72 M 59 58 L 59 72', O, 2),
    tongue: line('M 32 58 Q 50 76 68 58', O, 4.5) + path('M 50 66 Q 50 80 58 78 Q 64 74 60 63', PINK, 3),
    small: line('M 43 63 Q 50 67 57 63', O, 4),
    yawn: ellipse(50, 66, 10, 13, '#7f1d1d', 3),
    side: line('M 40 66 Q 54 66 64 58', O, 4.5),
  };
  const cheeks = blush ? `<ellipse cx="29" cy="56" rx="6" ry="3.5" fill="#fb7185" opacity="0.6"/><ellipse cx="71" cy="56" rx="6" ry="3.5" fill="#fb7185" opacity="0.6"/>` : '';
  return circle(50, 50, 36, fill, 4) + cheeks + brows[brow] + eyeMarks[eyes] + mouths[mouth] + extra;
}

export const hand = (thumb: 'up' | 'down') => {
  const gr =
    rect(30, 46, 34, 30, 9, SKIN) +
    rect(40, 20, 13, 32, 6.5, SKIN) +
    line('M 30 55 L 50 55 M 30 64 L 50 64', O, 2.5) +
    rect(62, 44, 14, 34, 4, BLUE);
  return thumb === 'up' ? gr : g('rotate(180 52 50)', gr);
};

export const openHand = (x: number, y: number, s = 1, fill = SKIN) =>
  at(
    x,
    y,
    s,
    path(
      'M -14 6 L -14 -14 Q -14 -19 -10 -19 Q -6 -19 -6 -14 L -6 -24 Q -6 -29 -2 -29 Q 2 -29 2 -24 L 2 -22 Q 2 -27 6 -27 Q 10 -27 10 -22 L 10 -12 Q 10 -17 14 -17 Q 18 -17 18 -12 L 18 8 Q 18 24 2 24 L -2 24 Q -12 24 -18 14 L -26 2 Q -28 -2 -24 -4 Q -20 -5 -17 0 Z',
      fill,
    ),
  );

export const building = (x: number, y: number, w: number, h: number, fill: string, roof = RED) =>
  rect(x, y, w, h, 2, fill) + path(`M ${x - 4} ${y + 2} L ${x + w / 2} ${y - h * 0.35} L ${x + w + 4} ${y + 2} Z`, roof);

export const house = (fill = '#fde68a', roof = RED) =>
  path('M 16 50 L 50 20 L 84 50', 'none', 0) +
  rect(22, 46, 56, 44, 2, fill) +
  path('M 12 50 L 50 16 L 88 50 Z', roof) +
  rect(42, 64, 16, 26, 2, WOOD) +
  rect(28, 56, 10, 10, 1, SKY, 2.5) +
  rect(62, 56, 10, 10, 1, SKY, 2.5);

export const plate = (cx = 50, cy = 64, rx = 40, ry = 18) => ellipse(cx, cy, rx, ry, WHITE) + ellipse(cx, cy - 1, rx * 0.68, ry * 0.6, '#f3f4f6', 2);

export const cup = (x: number, y: number, w: number, h: number, fill: string, liquid?: string) =>
  path(`M ${x} ${y} L ${x + w} ${y} L ${x + w - w * 0.12} ${y + h} L ${x + w * 0.12} ${y + h} Z`, fill) +
  (liquid ? fillPath(`M ${x + w * 0.05} ${y + h * 0.3} L ${x + w * 0.95} ${y + h * 0.3} L ${x + w - w * 0.14} ${y + h - 2} L ${x + w * 0.14} ${y + h - 2} Z`, liquid) : '') +
  path(`M ${x} ${y} L ${x + w} ${y} L ${x + w - w * 0.12} ${y + h} L ${x + w * 0.12} ${y + h} Z`, 'none');

export const steam = (x: number, y: number) => line(`M ${x} ${y} Q ${x - 5} ${y - 6} ${x} ${y - 12} Q ${x + 5} ${y - 18} ${x} ${y - 24}`, GRAY, 3.5);

export const tree = (x: number, y: number, s = 1) =>
  at(x, y, s, rect(-4, 0, 8, 26, 2, BROWN) + path('M -6 4 Q -24 4 -22 -10 Q -26 -26 -10 -28 Q -4 -40 8 -34 Q 24 -32 22 -16 Q 26 2 6 4 Z', LIME));

export const book = (x: number, y: number, w: number, h: number, fill = BLUE) =>
  rect(x, y, w, h, 3, fill) + rect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.25, 2, WHITE, 2) + line(`M ${x + 4} ${y + h - 6} L ${x + w - 4} ${y + h - 6}`, WHITE, 2.5);

export const tinyPerson = (x: number, y: number, s: number, shirt: string, hair: PersonOpts['hair'] = 'short', extra: Partial<PersonOpts> = {}) =>
  person({ x, y, s, shirt, hair, ...extra });

export const toilet = (x = 0, y = 0) =>
  g(
    `translate(${x} ${y})`,
    rect(54, 16, 26, 34, 4, WHITE) +
      path('M 20 50 L 80 50 Q 80 70 60 72 L 58 88 L 34 88 L 32 72 Q 20 70 20 50 Z', WHITE) +
      ellipse(48, 50, 28, 6, LIGHT, 2.5),
  );
