import {
  O, BLUE, SKY, NAVY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, TEAL, GRAY, DARK, WHITE, BROWN, WOOD, WATER, svg,
  circle, ellipse, dot, rect, path, line, text, g, star, heart, sun, moon, cloud, tree, person,
} from './draw';

const wheel = (cx: number, cy: number, r: number) => circle(cx, cy, r, DARK) + circle(cx, cy, r * 0.42, GRAY, 2);

const van = (body: string, stripe: string, extra = '') =>
  path('M 6 70 L 6 34 Q 6 26 14 26 L 62 26 Q 68 26 72 32 L 84 46 Q 94 48 94 58 L 94 70 Z', body) +
  path('M 64 32 L 80 48 L 64 48 Z', SKY, 2.5) +
  rect(14, 34, 40, 14, 2, SKY, 2.5) +
  line('M 6 58 L 94 58', stripe, 5) +
  extra +
  wheel(26, 72, 10) +
  wheel(74, 72, 10);

const leafShape = (x: number, y: number, rot: number, fill: string) =>
  g(`rotate(${rot} ${x} ${y})`, path(`M ${x} ${y + 22} Q ${x - 18} ${y} ${x} ${y - 22} Q ${x + 18} ${y} ${x} ${y + 22} Z`, fill) + line(`M ${x} ${y + 22} L ${x} ${y - 16}`, O, 2));

const snowflake = (cx: number, cy: number, r: number) =>
  line(`M ${cx} ${cy - r} L ${cx} ${cy + r} M ${cx - r * 0.87} ${cy - r / 2} L ${cx + r * 0.87} ${cy + r / 2} M ${cx - r * 0.87} ${cy + r / 2} L ${cx + r * 0.87} ${cy - r / 2}`, '#60a5fa', 4);

const pumpkin = (cx: number, cy: number, s = 1) =>
  g(
    `translate(${cx} ${cy}) scale(${s})`,
    ellipse(-14, 4, 16, 26, ORANGE) + ellipse(14, 4, 16, 26, ORANGE) + ellipse(0, 4, 16, 28, '#fb923c') + rect(-4, -32, 8, 12, 3, GREEN, 2.5),
  );

export const OUTDOORS: Record<string, () => string> = {
  truck: () =>
    svg(rect(6, 26, 56, 42, 4, BLUE) + path('M 62 38 L 80 38 Q 86 38 88 44 L 94 56 L 94 68 L 62 68 Z', RED) + path('M 66 42 L 80 42 L 86 54 L 66 54 Z', SKY, 2.5) + wheel(22, 72, 10) + wheel(46, 72, 10) + wheel(80, 72, 10)),
  boat: () =>
    svg(path('M 8 62 L 92 62 L 80 84 L 20 84 Z', RED) + line('M 50 62 L 50 10', O, 4) + path('M 52 12 L 84 54 L 52 54 Z', WHITE) + path('M 48 20 L 22 54 L 48 54 Z', '#fde68a') + line('M 2 90 Q 14 84 26 90 T 50 90 T 74 90 T 98 90', WATER, 4)),
  motorcycle: () =>
    svg(circle(22, 70, 15, 'none', 5) + circle(78, 70, 15, 'none', 5) + path('M 22 70 L 40 48 L 64 48 L 78 70', RED, 0) + path('M 30 54 L 66 46 L 70 58 L 40 64 Z', RED) + line('M 66 46 L 74 30 L 84 30', O, 4) + rect(38, 40, 22, 8, 4, DARK, 2.5)),
  helicopter: () =>
    svg(line('M 10 16 L 90 16 M 50 16 L 50 28', O, 5) + ellipse(44, 46, 28, 20, '#f59e0b') + path('M 24 42 Q 26 30 40 30 L 44 46 L 22 46 Z', SKY, 2.5) + line('M 70 44 L 94 36', O, 6) + line('M 94 28 L 94 44', O, 4) + line('M 26 74 L 68 74 M 34 64 L 30 74 M 58 64 L 62 74', O, 4)),
  rocket: () =>
    svg(g('rotate(35 50 50)', path('M 50 6 Q 68 22 68 52 L 68 72 L 32 72 L 32 52 Q 32 22 50 6 Z', WHITE) + circle(50, 38, 8, SKY, 2.5) + path('M 32 56 L 18 74 L 32 72 Z', RED) + path('M 68 56 L 82 74 L 68 72 Z', RED) + path('M 38 72 L 62 72 L 56 90 L 50 82 L 44 90 Z', ORANGE, 2.5))),
  tractor: () =>
    svg(rect(14, 46, 50, 20, 3, GREEN) + rect(42, 22, 24, 26, 3, GREEN) + rect(46, 26, 16, 14, 2, SKY, 2.5) + line('M 24 46 L 24 32', O, 4) + circle(56, 70, 20, DARK) + circle(56, 70, 8, YEL, 2.5) + circle(20, 76, 12, DARK) + circle(20, 76, 5, YEL, 2)),
  ambulance: () => svg(van(WHITE, RED, rect(26, 20, 12, 8, 2, RED, 2) + `<rect x="12" y="32" width="44" height="18" fill="${WHITE}"/>` + line('M 34 34 L 34 48 M 27 41 L 41 41', RED, 5))),
  'fire truck': () =>
    svg(rect(4, 34, 64, 34, 3, RED) + path('M 68 40 L 84 40 Q 90 40 92 46 L 96 58 L 96 68 L 68 68 Z', RED) + path('M 72 44 L 84 44 L 88 56 L 72 56 Z', SKY, 2.5) + line('M 8 28 L 60 18', GRAY, 5) + line('M 12 26 L 14 32 M 24 24 L 26 30 M 36 22 L 38 28 M 48 20 L 50 26', GRAY, 3) + rect(76, 30, 8, 8, 2, BLUE, 2) + wheel(20, 72, 10) + wheel(48, 72, 10) + wheel(82, 72, 10)),
  'police car': () =>
    svg(path('M 8 66 L 8 52 Q 8 46 14 45 L 24 44 L 34 30 Q 36 26 42 26 L 66 26 Q 72 26 76 32 L 84 44 Q 92 46 92 54 L 92 66 Z', WHITE) + path('M 8 52 L 92 52 L 92 62 L 8 62 Z', NAVY, 0) + path('M 38 32 L 48 32 L 48 44 L 30 44 Z', SKY, 2.5) + path('M 54 32 L 66 32 Q 70 32 72 36 L 78 44 L 54 44 Z', SKY, 2.5) + rect(40, 16, 10, 10, 2, RED, 2) + rect(50, 16, 10, 10, 2, BLUE, 2) + wheel(28, 68, 10) + wheel(72, 68, 10) + path('M 8 66 L 8 52 Q 8 46 14 45 L 24 44 L 34 30 Q 36 26 42 26 L 66 26 Q 72 26 76 32 L 84 44 Q 92 46 92 54 L 92 66 Z', 'none')),
  scooter: () => svg(line('M 20 76 L 72 76 L 64 18 M 56 18 L 74 16', O, 6) + line('M 20 76 L 72 76 L 64 18', TEAL, 3) + circle(18, 80, 9, DARK) + circle(74, 80, 9, DARK)),
  skateboard: () => svg(path('M 6 52 Q 6 44 16 44 L 84 44 Q 94 44 94 52 Q 94 58 86 58 L 14 58 Q 6 58 6 52 Z', ORANGE) + line('M 24 58 L 24 66 M 76 58 L 76 66', O, 4) + circle(18, 72, 7, YEL) + circle(32, 72, 7, YEL) + circle(68, 72, 7, YEL) + circle(82, 72, 7, YEL)),
  garden: () => svg(rect(6, 70, 88, 24, 4, '#a16207') + [20, 40, 60, 80].map((x, i) => line(`M ${x} 70 L ${x} 44`, GREEN, 4) + circle(x, 38, 9, [PINK, YEL, PURPLE, RED][i], 2.5) + circle(x, 38, 3.5, YEL, 1.5)).join('') + sun(84, 14, 7)),
  mountain: () => svg(path('M 4 90 L 38 26 L 58 60 L 70 42 L 96 90 Z', '#94a3b8') + path('M 30 41 L 38 26 L 46 41 L 42 38 L 38 44 L 34 38 Z', WHITE, 2) + sun(80, 18, 7)),
  forest: () => svg(tree(26, 56, 1) + tree(72, 54, 1.05) + path('M 50 22 L 66 52 L 58 52 L 70 74 L 30 74 L 42 52 L 34 52 Z', GREEN) + rect(46, 74, 8, 16, 2, BROWN, 2.5)),
  river: () => svg(path('M 30 4 Q 10 30 40 50 Q 70 70 50 96 L 80 96 Q 100 68 70 48 Q 44 30 60 4 Z', WATER) + line('M 40 24 Q 46 20 50 24 M 60 62 Q 66 58 70 62', WHITE, 3) + tree(16, 70, 0.6) + tree(86, 30, 0.6)),
  lake: () => svg(ellipse(50, 64, 44, 24, WATER) + line('M 26 60 Q 32 56 38 60 M 58 70 Q 64 66 70 70', WHITE, 3) + tree(18, 30, 0.6) + tree(80, 28, 0.7) + sun(50, 18, 7)),
  camping: () => svg(path('M 8 86 L 50 14 L 92 86 Z', ORANGE) + path('M 40 86 L 50 54 L 60 86 Z', '#7c2d12') + line('M 50 14 L 50 4', O, 3) + line('M 4 88 L 96 88', GREEN, 4) + star(16, 20, 5, YEL, 2) + star(84, 26, 4, YEL, 2)),
  tent: () => svg(path('M 8 86 L 50 14 L 92 86 Z', ORANGE) + path('M 40 86 L 50 54 L 60 86 Z', '#7c2d12') + line('M 4 88 L 96 88', GREEN, 4)),
  'gas station': () => svg(rect(20, 18, 40, 74, 5, RED) + rect(28, 26, 24, 18, 3, WHITE, 2.5) + line('M 60 34 L 74 34 Q 80 34 80 42 L 80 70 Q 80 76 74 76', O, 4) + rect(16, 88, 48, 6, 2, DARK, 2)),
  bank: () => svg(path('M 8 34 L 50 10 L 92 34 Z', '#e5e7eb') + rect(12, 34, 76, 8, 2, '#cbd5e1') + [20, 38, 56, 74].map((x) => rect(x, 44, 8, 36, 2, '#f1f5f9', 2.5)).join('') + rect(8, 80, 84, 10, 2, '#cbd5e1') + text(50, 30, '$', 14, '#166534')),
  'post office': () => svg(rect(10, 26, 80, 54, 5, WHITE) + path('M 10 30 L 50 58 L 90 30', 'none', 3) + rect(68, 32, 14, 14, 2, RED, 2) + line('M 18 68 L 42 68 M 18 74 L 36 74', GRAY, 3)),
  'hair salon': () => svg(circle(30, 72, 10, RED) + circle(30, 72, 4, WHITE, 2) + circle(56, 80, 10, RED) + circle(56, 80, 4, WHITE, 2) + path('M 36 64 L 70 22 L 74 26 L 44 70 Z', GRAY, 2.5) + path('M 50 74 L 84 38 L 88 44 L 58 78 Z', GRAY, 2.5) + path('M 70 8 Q 92 10 88 30', '#92400e', 4) + path('M 64 10 Q 84 14 82 34', '#92400e', 4)),
  museum: () => svg(path('M 6 34 L 50 8 L 94 34 Z', '#fde68a') + rect(10, 34, 80, 6, 2, '#fcd34d') + [18, 34, 50, 66, 82].map((x) => rect(x - 4, 40, 8, 40, 2, '#fef3c7', 2.5)).join('') + rect(6, 80, 88, 10, 2, '#fcd34d') + circle(50, 24, 5, WHITE, 2)),
  theater: () =>
    svg(path('M 10 18 Q 30 12 46 18 L 46 44 Q 46 64 28 64 Q 10 64 10 44 Z', YEL) + dot(22, 32, 3) + dot(36, 32, 3) + line('M 20 46 Q 28 54 38 46', O, 3) + path('M 54 38 Q 72 32 90 38 L 90 62 Q 90 84 72 84 Q 54 84 54 62 Z', SKY) + dot(64, 52, 3) + dot(80, 52, 3) + line('M 62 72 Q 72 64 82 72', O, 3)),
  'bus stop': () => svg(line('M 26 94 L 26 14', GRAY, 6) + rect(10, 8, 34, 26, 5, BLUE) + text(27, 27, 'BUS', 11, WHITE) + rect(44, 48, 50, 34, 5, YEL) + rect(50, 54, 12, 10, 2, SKY, 2) + rect(66, 54, 12, 10, 2, SKY, 2) + circle(54, 84, 5, DARK, 2) + circle(84, 84, 5, DARK, 2)),
  castle: () => svg(rect(14, 40, 72, 52, 2, '#cbd5e1') + [14, 30, 46, 62, 78].map((x) => rect(x, 32, 8, 10, 1, '#cbd5e1', 2.5)).join('') + rect(40, 14, 20, 26, 2, '#94a3b8') + path('M 38 14 L 50 2 L 62 14 Z', RED) + path('M 40 92 L 40 72 Q 50 60 60 72 L 60 92', WOOD, 2.5)),
  rainbow: () => svg([RED, ORANGE, YEL, LIME, BLUE, PURPLE].map((c, i) => `<path d="M ${8 + i * 6} 80 A ${42 - i * 6} ${42 - i * 6} 0 0 1 ${92 - i * 6} 80" fill="none" stroke="${c}" stroke-width="6"/>`).join('') + cloud(16, 82, 0.4) + cloud(84, 82, 0.4)),
  windy: () => svg(line('M 8 34 L 62 34 Q 76 34 76 22 Q 76 12 66 12 Q 58 12 58 20 M 8 52 L 80 52 Q 94 52 94 64 Q 94 76 82 76 Q 72 76 72 68 M 18 70 L 50 70', '#64748b', 6)),
  storm: () => svg(cloud(50, 34, 1.3, '#94a3b8') + path('M 52 46 L 38 70 L 52 70 L 44 94 L 68 62 L 54 62 L 62 46 Z', YEL)),
  stars: () => svg(rect(6, 6, 88, 88, 14, NAVY, 4) + star(30, 32, 10, YEL, 2) + star(68, 26, 7, YEL, 2) + star(56, 64, 12, YEL, 2) + star(24, 72, 6, YEL, 2) + star(80, 74, 5, YEL, 2)),
  moon: () => svg(rect(6, 6, 88, 88, 14, NAVY, 4) + moon(46, 50, 30)),
  leaf: () => svg(g('translate(50 50) scale(1.9) translate(-50 -50)', leafShape(50, 50, 30, LIME))),
  grass: () => svg(path('M 4 92 L 10 50 L 18 92 L 24 40 L 32 92 L 40 54 L 48 92 L 54 36 L 62 92 L 70 50 L 78 92 L 86 44 L 94 92 Z', LIME) + line('M 4 92 L 96 92', GREEN, 4)),
  rock: () => svg(path('M 10 80 Q 6 56 26 44 Q 40 26 62 32 Q 86 38 90 62 Q 94 82 74 86 L 24 86 Q 12 86 10 80 Z', '#9ca3af') + line('M 34 52 Q 40 48 46 52 M 58 66 Q 66 62 72 66', '#6b7280', 3)),
  fire: () => svg(path('M 50 8 Q 74 32 72 56 Q 84 48 82 36 Q 96 60 84 78 Q 72 94 50 94 Q 28 94 16 78 Q 6 60 20 42 Q 22 56 30 58 Q 26 30 50 8 Z', ORANGE) + path('M 50 44 Q 66 60 62 76 Q 58 88 50 88 Q 40 88 38 76 Q 36 62 50 44 Z', YEL, 2.5)),
  spring: () => svg(rect(6, 6, 88, 88, 14, '#dcfce7', 4) + [24, 50, 76].map((x, i) => line(`M ${x} 84 L ${x} 56`, GREEN, 4) + circle(x, 48, 10, [PINK, YEL, PURPLE][i], 2.5) + circle(x, 48, 4, YEL, 1.5)).join('') + cloud(30, 22, 0.4) + sun(76, 22, 6)),
  summer: () => svg(rect(6, 6, 88, 88, 14, '#bae6fd', 4) + sun(50, 34, 13) + path('M 10 72 Q 30 64 50 72 T 90 72 L 90 82 Q 90 90 82 90 L 18 90 Q 10 90 10 82 Z', '#fde68a', 3)),
  autumn: () => svg(rect(6, 6, 88, 88, 14, '#ffedd5', 4) + leafShape(32, 40, -30, ORANGE) + leafShape(66, 34, 20, RED) + leafShape(52, 70, 60, '#ca8a04')),
  winter: () => svg(rect(6, 6, 88, 88, 14, '#e0f2fe', 4) + snowflake(30, 30, 12) + snowflake(70, 28, 9) + circle(56, 74, 14, WHITE) + circle(56, 52, 10, WHITE) + dot(53, 50, 1.6) + dot(59, 50, 1.6) + path('M 56 54 L 64 56 L 56 57 Z', ORANGE, 1)),
  christmas: () =>
    svg(path('M 50 10 L 72 40 L 62 40 L 80 64 L 66 64 L 86 86 L 14 86 L 34 64 L 20 64 L 38 40 L 28 40 Z', GREEN) + rect(44, 86, 12, 10, 2, BROWN, 2.5) + star(50, 12, 9, YEL, 2.5) + circle(44, 48, 4, RED, 2) + circle(58, 64, 4, BLUE, 2) + circle(38, 72, 4, YEL, 2) + circle(64, 78, 4, RED, 2)),
  halloween: () => svg(pumpkin(50, 58, 1.3) + path('M 34 52 L 42 46 L 44 56 Z', DARK, 1.5) + path('M 66 52 L 58 46 L 56 56 Z', DARK, 1.5) + path('M 34 68 L 40 64 L 46 70 L 52 64 L 58 70 L 64 64 L 68 68 Q 60 78 50 78 Q 40 78 34 68 Z', DARK, 1.5)),
  pumpkin: () => svg(pumpkin(50, 58, 1.3)),
  easter: () => svg(ellipse(50, 54, 30, 38, '#fbcfe8') + line('M 22 46 Q 36 38 50 46 T 78 46', PURPLE, 4) + line('M 21 62 Q 36 70 50 62 T 79 62', TEAL, 4) + dot(38, 30, 3, YEL) + dot(60, 28, 3, YEL) + dot(50, 80, 3, YEL)),
  thanksgiving: () =>
    svg([RED, ORANGE, YEL, '#92400e', ORANGE, RED].map((c, i) => g(`rotate(${-70 + i * 28} 50 64)`, ellipse(50, 34, 8, 24, c))).join('') + circle(50, 64, 22, '#92400e') + circle(50, 40, 12, '#b45309') + dot(46, 38, 2) + dot(54, 38, 2) + path('M 48 44 L 52 44 L 50 50 Z', ORANGE, 1.5)),
  "valentine's day": () => svg(heart(44, 56, 26) + heart(72, 32, 12, PINK) + line('M 6 86 L 84 20', '#92400e', 3) + path('M 84 20 L 76 22 L 82 28 Z', '#92400e', 2)),
  soccer: () =>
    svg(circle(50, 50, 38, WHITE, 4) + path('M 50 34 L 64 44 L 58 60 L 42 60 L 36 44 Z', O, 0) + line('M 50 34 L 50 14 M 64 44 L 84 38 M 58 60 L 70 78 M 42 60 L 30 78 M 36 44 L 16 38', O, 3)),
  basketball: () => svg(circle(50, 50, 38, ORANGE, 4) + line('M 12 50 L 88 50 M 50 12 L 50 88', O, 3) + line('M 22 22 Q 40 50 22 78 M 78 22 Q 60 50 78 78', O, 3)),
  baseball: () => svg(circle(50, 50, 38, WHITE, 4) + line('M 28 20 Q 42 50 28 80 M 72 20 Q 58 50 72 80', RED, 3) + line('M 30 30 L 36 28 M 33 42 L 39 41 M 33 56 L 39 57 M 30 70 L 36 72 M 70 30 L 64 28 M 67 42 L 61 41 M 67 56 L 61 57 M 70 70 L 64 72', RED, 2)),
  football: () => svg(g('rotate(-35 50 50)', ellipse(50, 50, 40, 24, '#92400e') + line('M 36 50 L 64 50', WHITE, 3) + line('M 42 45 L 42 55 M 50 45 L 50 55 M 58 45 L 58 55', WHITE, 3) + line('M 16 44 Q 20 50 16 56 M 84 44 Q 80 50 84 56', WHITE, 3))),
  swing: () => svg(line('M 10 92 L 22 10 L 78 10 L 90 92', BROWN, 6) + line('M 40 10 L 40 64 M 60 10 L 60 64', GRAY, 3) + rect(34, 62, 32, 8, 3, RED) + person({ x: 50, y: 52, s: 0.55, shirt: YEL, pose: 'up', sit: true })),
  trampoline: () => svg(ellipse(50, 70, 42, 12, '#1e293b') + ellipse(50, 70, 36, 8, '#475569', 2) + line('M 16 74 L 12 92 M 84 74 L 88 92 M 50 82 L 50 94', O, 4) + person({ x: 50, y: 36, s: 0.6, shirt: PINK, pose: 'up', face: 'grin' }) + line('M 36 56 L 32 62 M 64 56 L 68 62', GRAY, 3)),
  kite: () => svg(path('M 60 6 L 86 34 L 62 66 L 36 32 Z', RED) + line('M 60 6 L 62 66 M 36 32 L 86 34', O, 2.5) + path('M 62 66 Q 50 80 40 74 Q 30 68 20 82 Q 12 92 4 90', 'none', 2.5) + path('M 44 74 L 38 70 L 40 80 Z', YEL, 1.5) + path('M 24 80 L 18 76 L 20 86 Z', BLUE, 1.5)),
  picnic: () => svg(path('M 4 70 L 28 50 L 96 50 L 76 70 Z', '#fecaca') + line('M 14 62 L 86 62 M 40 50 L 30 70 M 62 50 L 52 70', RED, 3) + rect(40, 30, 28, 20, 4, WOOD) + path('M 46 30 Q 54 18 62 30', 'none', 3) + sun(84, 16, 6)),
};
