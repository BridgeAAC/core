import {
  O, SKIN, BLUE, SKY, NAVY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, TEAL, GRAY, DARK, LIGHT, WHITE, BROWN, WOOD,
  WATER, svg, circle, ellipse, dot, rect, path, line, dashed, text, g, flip, arrow, curvedArrow, heart, star, box, ball,
  person, face, openHand, pointingHand, drop, steam, silhouette,
} from './draw';

const shapeTile = (inner: string) => svg(inner);
const tableTop = (y = 56) => rect(10, y, 80, 8, 3, WOOD) + line(`M 18 ${y + 8} L 18 92 M 82 ${y + 8} L 82 92`, BROWN, 5);
const target = (cx: number, cy: number, s = 1) => ball(cx, cy, 11 * s, RED);
const refBox = (x = 34, y = 40, size = 32) => box(x, y, size, WOOD);

const fist = (x: number, y: number, s = 1) =>
  g(
    `translate(${x} ${y}) scale(${s})`,
    silhouette(
      [
        { x: -16, y: -14, w: 32, h: 28, r: 10 },
        ...[-14, -6, 2].map((yy) => ({ x: -26, y: yy, w: 18, h: 9, r: 4.5 })),
      ],
      SKIN,
    ) + line('M -24 -5 L -12 -5 M -24 3 L -12 3', O, 2),
  );

const badgeFace = (fill: string, opts: Parameters<typeof face>[0]) => face({ ...opts, fill });

export const CONCEPTS: Record<string, () => string> = {
  circle: () => shapeTile(circle(50, 50, 36, '#60a5fa', 4)),
  square: () => shapeTile(rect(16, 16, 68, 68, 4, '#f87171', 4)),
  triangle: () => shapeTile(path('M 50 12 L 90 84 L 10 84 Z', YEL, 4)),
  rectangle: () => shapeTile(rect(8, 28, 84, 44, 4, LIME, 4)),
  star: () => shapeTile(star(50, 52, 40, YEL, 4)),
  heart: () => shapeTile(heart(50, 54, 34, '#f43f5e')),
  diamond: () => shapeTile(path('M 50 8 L 86 50 L 50 92 L 14 50 Z', PURPLE, 4)),
  oval: () => shapeTile(ellipse(50, 50, 40, 26, ORANGE, 4)),
  shapes: () => shapeTile(circle(30, 32, 18, '#60a5fa') + rect(56, 14, 34, 34, 3, '#f87171') + path('M 30 58 L 50 92 L 10 92 Z', YEL) + star(72, 74, 18, LIME)),

  under: () => svg(tableTop(36) + target(50, 78)),
  over: () => svg(refBox(34, 58) + target(50, 18) + curvedArrow('M 12 70 Q 50 -4 88 70', 88, 70, 1.1, RED, 4)),
  behind: () => svg(target(64, 44, 1.2) + refBox(18, 40, 40)),
  'in front': () => svg(refBox(48, 22, 40) + target(40, 76, 1.2)),
  between: () => svg(refBox(4, 46, 28) + refBox(68, 46, 28) + target(50, 66) + arrow(50, 30, 50, 50, RED, 4, 9)),
  'next to': () => svg(refBox(16, 40, 36) + target(74, 64, 1.2)),
  near: () => svg(refBox(20, 42, 34) + target(66, 66)),
  far: () => svg(refBox(8, 50, 28) + ball(86, 80, 6, RED) + dashed('M 40 80 L 76 80', GRAY, 3)),
  top: () => svg(rect(22, 8, 56, 84, 6, LIGHT) + rect(22, 8, 56, 26, 6, '#86efac') + arrow(50, 54, 50, 24, GREEN, 6, 12)),
  bottom: () => svg(rect(22, 8, 56, 84, 6, LIGHT) + rect(22, 66, 56, 26, 6, '#fca5a5') + arrow(50, 44, 50, 76, RED, 6, 12)),
  left: () => svg(arrow(88, 50, 12, 50, BLUE, 12, 26)),
  right: () => svg(arrow(12, 50, 88, 50, BLUE, 12, 26)),
  around: () => svg(refBox(34, 36, 32) + curvedArrow('M 82 56 A 34 30 0 1 1 72 26', 74, 24, -1.2, RED, 5)),
  through: () => svg(path('M 30 20 Q 50 10 70 20 L 70 84 L 30 84 Z', '#a8a29e') + ellipse(50, 52, 14, 18, '#1f2937', 2.5) + arrow(4, 52, 96, 52, RED, 5, 10)),
  this: () => svg(pointingHand(30, 46, 0.9) + ball(72, 76, 14, RED)),
  that: () => svg(g('rotate(70 34 52)', pointingHand(34, 52, 0.75)) + ball(84, 62, 9, RED) + dashed('M 50 52 L 70 58', GRAY, 3)),
  there: () => svg(person({ x: 26, s: 0.8, pose: 'point', shirt: TEAL }) + path('M 74 62 Q 74 40 84 40 Q 94 40 94 62 Q 94 74 84 86 Q 74 74 74 62 Z', RED, 2.5) + circle(84, 58, 4, WHITE, 2)),

  embarrassed: () => svg(face({ eyes: 'closed', brow: 'worried', mouth: 'wavy', blush: true, fill: '#fecdd3' }) + path('M 80 26 Q 76 34 80 36 Q 84 34 80 26 Z', SKY, 2)),
  disappointed: () => svg(face({ eyes: 'half', brow: 'worried', mouth: 'sad', fill: '#cbd5e1' })),
  jealous: () => svg(face({ eyes: 'dot', brow: 'angry', mouth: 'side', fill: '#86efac' })),
  brave: () => svg(person({ x: 46, shirt: RED, pose: 'hips', face: 'grin' }) + path('M 32 38 L 20 74 L 34 70 Z', RED, 2) + star(82, 22, 9)),
  curious: () => svg(face({ eyes: 'wide', brow: 'raised', mouth: 'small' }) + text(84, 30, '?', 26, PURPLE)),
  overwhelmed: () => svg(badgeFace('#fde68a', { eyes: 'spiral', brow: 'worried', mouth: 'wavy' }) + line('M 6 16 L 14 22 M 6 48 L 14 48 M 94 16 L 86 22 M 94 48 L 86 48 M 50 2 L 50 10', RED, 3.5)),
  safe: () => svg(path('M 50 8 L 84 20 L 84 46 Q 84 76 50 92 Q 16 76 16 46 L 16 20 Z', '#86efac', 4) + line('M 34 50 L 46 62 L 68 38', WHITE, 8)),
  kind: () => svg(person({ x: 32, s: 0.85, pose: 'give', shirt: TEAL }) + heart(62, 46, 9) + flip(person({ x: 20, s: 0.7, y: 60, shirt: YEL }))),
  grateful: () => svg(person({ x: 50, pose: 'chest', face: 'grin', shirt: PINK, hair: 'long', pants: PURPLE }) + heart(20, 22, 8) + heart(80, 22, 8)),

  thermometer: () => svg(g('rotate(-35 50 50)', rect(42, 6, 16, 70, 8, WHITE) + circle(50, 80, 12, RED) + line('M 50 76 L 50 30', RED, 6) + line('M 58 24 L 64 24 M 58 36 L 64 36 M 58 48 L 64 48 M 58 60 L 64 60', O, 2))),
  wheelchair: () =>
    svg(circle(42, 70, 22, 'none', 6) + circle(42, 70, 4, O, 1) + circle(78, 86, 6, 'none', 4) + line('M 30 34 L 36 62 L 70 62 L 78 82 M 36 62 L 30 24', O, 6) + person({ x: 46, y: 36, s: 0.62, shirt: BLUE, sit: true, pose: 'hold' })),
  bandaid: () => svg(g('rotate(-30 50 50)', rect(8, 36, 84, 28, 14, '#fcd5b4') + rect(36, 36, 28, 28, 4, '#fde7d4', 2.5) + dot(44, 44, 1.8, '#d4a27f') + dot(56, 44, 1.8, '#d4a27f') + dot(44, 56, 1.8, '#d4a27f') + dot(56, 56, 1.8, '#d4a27f'))),
  cough: () => svg(g('translate(-8 0)', face({ eyes: 'closed', brow: 'worried', mouth: 'o', fill: '#fde68a' })) + circle(72, 66, 4, LIGHT, 2) + circle(82, 60, 5, LIGHT, 2) + circle(86, 72, 4, LIGHT, 2) + line('M 74 54 L 84 50 M 76 78 L 86 82', GRAY, 3)),
  itchy: () => svg(person({ x: 46, shirt: '#fda4af', pose: 'chest', face: 'wavy' }) + line('M 62 40 L 70 36 M 64 48 L 74 48 M 62 56 L 70 60', RED, 3) + dot(36, 42, 2.5, RED) + dot(40, 52, 2.5, RED)),
  'throw up': () => svg(face({ eyes: 'closed', brow: 'worried', mouth: 'o', fill: '#bef264' }) + path('M 44 74 Q 40 92 30 96 L 70 96 Q 60 92 56 74 Z', '#a3e635', 2.5)),
  dentist: () => svg(person({ x: 40, shirt: WHITE, pants: TEAL, pose: 'give', hair: 'pony' }) + path('M 66 30 Q 66 20 74 20 Q 79 20 82 24 Q 85 20 90 20 Q 98 20 98 30 Q 98 40 94 48 L 90 62 Q 88 66 86 62 L 84 50 Q 82 46 80 50 L 78 62 Q 76 66 74 62 L 70 48 Q 66 40 66 30 Z', WHITE, 2.5)),
  police: () => svg(person({ x: 50, shirt: NAVY, pants: NAVY, hat: 'cap', pose: 'down', extra: star(-7, -6, 4, YEL, 1.5) })),
  firefighter: () =>
    svg(person({ x: 50, shirt: '#b91c1c', pants: '#b91c1c', hair: 'none', extra: path('M -14 -30 Q -14 -42 0 -42 Q 14 -42 14 -30 L 20 -28 L -20 -28 Z', YEL, 2.5) + line('M -12 4 L 12 4', YEL, 3) })),
  chef: () => svg(person({ x: 46, shirt: WHITE, pants: DARK, hair: 'none', pose: 'give', extra: path('M -10 -34 Q -16 -48 -6 -48 Q 0 -56 6 -48 Q 16 -48 10 -34 Z', WHITE, 2.5) }) + path('M 70 30 L 96 30 L 92 48 L 74 48 Z', GRAY) + steam(84, 26)),
  farmer: () => svg(person({ x: 46, shirt: '#ef4444', pants: '#1d4ed8', pose: 'hold', extra: ellipse(0, -36, 18, 4, '#fde68a', 2.5) + path('M -9 -36 Q -9 -48 0 -48 Q 9 -48 9 -36 Z', '#fde68a', 2.5) }) + line('M 84 20 L 84 94', BROWN, 4) + path('M 76 20 L 92 20 L 92 30 L 76 30 Z', GRAY, 2.5)),
  'mail carrier': () => svg(person({ x: 40, shirt: '#60a5fa', pants: NAVY, hat: 'cap', pose: 'give' }) + rect(66, 28, 26, 18, 2, WHITE, 2.5) + path('M 66 28 L 79 38 L 92 28', 'none', 2)),

  'turn on': () => svg(rect(28, 12, 44, 76, 10, WHITE) + rect(40, 26, 20, 48, 6, LIGHT) + rect(42, 28, 16, 22, 4, LIME, 2.5) + line('M 82 14 L 88 8 M 86 26 L 94 24', YEL, 3)),
  'turn off': () => svg(rect(28, 12, 44, 76, 10, WHITE) + rect(40, 26, 20, 48, 6, LIGHT) + rect(42, 50, 16, 22, 4, '#94a3b8', 2.5)),
  pour: () => svg(g('rotate(-40 40 40)', rect(20, 18, 34, 46, 6, '#e0f2fe') + rect(54, 30, 12, 6, 2, '#e0f2fe', 2.5)) + line('M 60 52 Q 66 66 64 76', WATER, 5) + path('M 44 74 L 84 74 L 80 94 L 48 94 Z', WHITE) + path('M 46 82 L 82 82 L 80 92 L 48 92 Z', WATER, 0)),
  mix: () => svg(path('M 10 48 L 90 48 Q 88 86 50 88 Q 12 86 10 48 Z', '#fde68a') + ellipse(50, 48, 40, 8, '#fef3c7') + line('M 56 50 L 80 8', WOOD, 6) + curvedArrow('M 30 56 Q 50 70 70 56', 70, 56, -0.6, RED, 4)),
  bake: () => svg(rect(10, 20, 80, 72, 6, DARK) + rect(18, 40, 64, 44, 4, '#fb923c') + path('M 28 70 Q 30 52 50 52 Q 70 52 72 70 Z', '#b45309') + circle(24, 30, 4, LIGHT, 2) + circle(38, 30, 4, LIGHT, 2) + rect(54, 26, 28, 8, 2, '#86efac', 2)),
  wipe: () => svg(rect(8, 68, 84, 10, 3, WOOD) + g('rotate(-10 50 50)', rect(32, 46, 38, 18, 5, YEL)) + line('M 12 60 Q 24 54 30 60 M 74 58 Q 82 52 90 58', SKY, 3) + star(86, 40, 6, YEL, 2)),
  spill: () => svg(g('rotate(80 38 46)', rect(24, 26, 28, 40, 4, '#e0f2fe')) + path('M 54 54 Q 70 52 80 62 Q 94 70 84 80 Q 64 88 44 82 Q 30 78 40 66 Z', WATER) + drop(76, 36, 0.4)),
  hit: () => svg(fist(46, 50, 1.1) + star(80, 48, 16, YEL, 3) + line('M 64 30 L 70 36 M 64 68 L 70 62', RED, 3)),
  bite: () => svg(face({ eyes: 'dot', brow: 'angry', mouth: 'teeth', fill: '#fdba74' }) + text(86, 26, '!', 24, RED)),
  scratch: () => svg(openHand(36, 52, 0.9) + line('M 62 30 L 86 54 M 66 24 L 92 50 M 58 38 L 80 60', RED, 3.5)),
  blow: () => svg(g('translate(-6 6) scale(0.86)', face({ eyes: 'dot', mouth: 'o', fill: SKIN })) + circle(80, 40, 12, '#e0f2fe', 2.5) + circle(88, 66, 8, '#ede9fe', 2.5) + line('M 62 64 L 72 64 M 62 72 L 70 76', GRAY, 3)),
  'high five': () => svg(g('rotate(18 32 50)', openHand(34, 56, 0.95)) + g('rotate(-18 68 50)', flip(openHand(34, 56, 0.95))) + line('M 50 6 L 50 16 M 34 10 L 38 18 M 66 10 L 62 18', YEL, 4)),
  'fist bump': () => svg(fist(32, 54, 0.85) + flip(fist(32, 54, 0.85)) + line('M 50 26 L 50 34 M 40 30 L 44 36 M 60 30 L 56 36', YEL, 4)),
  'take a break': () => svg(rect(14, 52, 72, 10, 4, WOOD) + line('M 22 62 L 22 90 M 78 62 L 78 90', BROWN, 5) + person({ x: 50, y: 40, s: 0.8, shirt: SKY, sit: true, pose: 'belly', face: 'smile' }) + text(80, 26, 'z', 18, BLUE)),
};
