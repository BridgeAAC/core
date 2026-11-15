import {
  O, BLUE, SKY, NAVY, RED, GREEN, LIME, YEL, PURPLE, PINK, TEAL, GRAY, DARK, LIGHT, WHITE, BROWN, WOOD, CREAM, WATER,
  svg, circle, ellipse, dot, rect, path, fillPath, line, text, g, star, drop, clockFace, cup, steam,
} from './draw';

const bottle = (x: number, y: number, w: number, h: number, fill: string, cap = BLUE) =>
  rect(x + w * 0.3, y, w * 0.4, h * 0.14, 2, cap, 2.5) +
  path(`M ${x + w * 0.3} ${y + h * 0.14} L ${x + w * 0.7} ${y + h * 0.14} Q ${x + w} ${y + h * 0.24} ${x + w} ${y + h * 0.38} L ${x + w} ${y + h - 6} Q ${x + w} ${y + h} ${x + w - 6} ${y + h} L ${x + 6} ${y + h} Q ${x} ${y + h} ${x} ${y + h - 6} L ${x} ${y + h * 0.38} Q ${x} ${y + h * 0.24} ${x + w * 0.3} ${y + h * 0.14} Z`, fill);

const fruitLeaf = (x: number, y: number, rot = -30) => g(`rotate(${rot} ${x} ${y})`, path(`M ${x} ${y} Q ${x + 8} ${y - 9} ${x + 16} ${y - 3} Q ${x + 8} ${y + 4} ${x} ${y} Z`, LIME, 2.5));

export const HOME: Record<string, () => string> = {
  door: () => svg(rect(24, 8, 52, 86, 4, WOOD) + rect(32, 18, 36, 28, 3, '#f59e0b', 2.5) + rect(32, 54, 36, 30, 3, '#f59e0b', 2.5) + circle(64, 52, 4, YEL, 2)),
  window: () => svg(rect(12, 14, 76, 72, 4, '#bae6fd', 4) + line('M 50 14 L 50 86 M 12 50 L 88 50', O, 4) + path('M 20 22 L 30 22 L 20 32 Z', WHITE, 0) + rect(6, 84, 88, 8, 3, WOOD)),
  pillow: () => svg(path('M 10 34 Q 10 22 22 24 Q 50 30 78 24 Q 90 22 90 34 L 90 66 Q 90 78 78 76 Q 50 70 22 76 Q 10 78 10 66 Z', '#c7d2fe') + line('M 26 40 Q 50 46 74 40', '#a5b4fc', 3)),
  blanket: () => svg(path('M 8 24 L 92 24 L 92 74 Q 78 84 64 74 Q 50 84 36 74 Q 22 84 8 74 Z', '#f9a8d4') + line('M 8 40 L 92 40 M 8 56 L 92 56', '#f472b6', 3) + line('M 30 24 L 30 76 M 54 24 L 54 78 M 76 24 L 76 76', '#fbcfe8', 3)),
  towel: () => svg(rect(10, 16, 80, 8, 4, GRAY) + path('M 18 24 L 82 24 L 82 88 L 18 88 Z', TEAL) + line('M 18 74 L 82 74 M 18 80 L 82 80', WHITE, 3)),
  soap: () => svg(rect(16, 46, 68, 36, 14, '#fbcfe8') + circle(30, 34, 7, '#e0f2fe', 2) + circle(46, 26, 9, '#e0f2fe', 2) + circle(64, 32, 6, '#e0f2fe', 2) + ellipse(40, 58, 12, 4, '#fce7f3', 0)),
  toothpaste: () =>
    svg(g('rotate(-20 50 50)', path('M 14 38 L 70 34 L 82 50 L 70 66 L 14 62 Z', WHITE) + rect(80, 44, 12, 12, 2, BLUE) + line('M 22 44 L 60 42 M 22 56 L 60 58', BLUE, 3) + path('M 6 40 L 14 38 L 14 62 L 6 60 Z', BLUE, 2.5))),
  shampoo: () => svg(bottle(30, 10, 40, 82, '#a7f3d0', TEAL) + rect(38, 46, 24, 24, 4, WHITE, 2.5) + circle(50, 58, 5, '#e0f2fe', 2)),
  sink: () => svg(path('M 8 50 L 92 50 Q 88 82 50 84 Q 12 82 8 50 Z', WHITE) + rect(4, 44, 92, 8, 4, LIGHT) + line('M 50 44 L 50 22 Q 50 14 60 14 L 66 14', GRAY, 7) + rect(30, 34, 12, 8, 3, GRAY, 2) + rect(58, 34, 12, 8, 3, GRAY, 2) + drop(66, 28, 0.4)),
  fridge: () => svg(rect(24, 6, 52, 88, 6, '#e5e7eb') + line('M 24 38 L 76 38', O, 3) + rect(30, 16, 5, 14, 2, GRAY, 2) + rect(30, 46, 5, 18, 2, GRAY, 2) + circle(60, 22, 4, RED, 1.5) + rect(52, 52, 16, 12, 2, YEL, 1.5)),
  microwave: () => svg(rect(6, 22, 88, 58, 6, LIGHT) + rect(14, 30, 54, 42, 3, DARK) + rect(74, 32, 14, 8, 2, '#86efac', 2) + [0, 1, 2].map((r) => [0, 1].map((c) => circle(77 + c * 8, 50 + r * 8, 2.6, WHITE, 1.5)).join('')).join('') + path('M 20 40 L 30 40 L 20 50 Z', '#475569', 0)),
  clock: () => svg(clockFace(50, 52, 38, 10, 10)),
  key: () => svg(circle(30, 50, 18, YEL) + circle(30, 50, 7, WHITE, 2.5) + rect(46, 45, 46, 10, 3, YEL) + rect(74, 55, 7, 12, 2, YEL, 2.5) + rect(84, 55, 7, 9, 2, YEL, 2.5)),
  trash: () =>
    svg(rect(14, 18, 72, 10, 4, GRAY) + rect(40, 10, 20, 8, 3, GRAY, 2.5) + path('M 20 28 L 80 28 L 74 92 L 26 92 Z', '#94a3b8') + line('M 38 38 L 40 84 M 50 38 L 50 84 M 62 38 L 60 84', O, 2.5)),
  bottle: () => svg(bottle(32, 8, 36, 86, '#bae6fd') + fillPath('M 34 50 L 66 50 L 66 86 Q 66 90 62 90 L 38 90 Q 34 90 34 86 Z', WATER) + bottle(32, 8, 36, 86, 'none')),
  'washing machine': () => svg(rect(14, 8, 72, 86, 6, WHITE) + line('M 14 26 L 86 26', O, 3) + circle(28, 17, 4, RED, 1.5) + rect(56, 13, 22, 8, 2, SKY, 1.5) + circle(50, 60, 24, '#e5e7eb') + circle(50, 60, 16, '#93c5fd', 2.5) + path('M 36 62 Q 44 54 52 62 Q 58 68 64 60', WHITE, 0)),
  stairs: () => svg(path('M 10 90 L 10 72 L 30 72 L 30 54 L 50 54 L 50 36 L 70 36 L 70 18 L 90 18 L 90 90 Z', '#fcd34d') + line('M 18 70 L 82 14', BROWN, 4)),
  couch: () => svg(rect(14, 30, 72, 32, 8, '#a78bfa') + rect(6, 46, 18, 34, 6, '#8b5cf6') + rect(76, 46, 18, 34, 6, '#8b5cf6') + rect(22, 56, 56, 22, 4, '#c4b5fd') + line('M 50 56 L 50 78', O, 2.5) + line('M 14 80 L 14 88 M 86 80 L 86 88', O, 4)),
  dress: () => svg(path('M 38 8 L 46 8 Q 50 16 54 8 L 62 8 L 64 30 L 56 36 L 82 90 L 18 90 L 44 36 L 36 30 Z', PINK) + line('M 40 36 L 60 36', '#be185d', 4) + circle(38, 66, 3, WHITE, 0) + circle(60, 74, 3, WHITE, 0) + circle(50, 56, 3, WHITE, 0)),
  skirt: () => svg(rect(28, 16, 44, 12, 3, PURPLE) + path('M 28 28 L 72 28 L 88 84 L 12 84 Z', '#a78bfa') + line('M 38 30 L 30 84 M 50 30 L 50 84 M 62 30 L 70 84', PURPLE, 2.5)),
  shorts: () => svg(path('M 18 18 L 82 18 L 88 74 L 58 74 L 50 44 L 42 74 L 12 74 Z', '#60a5fa') + line('M 18 28 L 82 28', O, 2.5)),
  pajamas: () => svg(path('M 34 12 L 18 20 L 8 40 L 20 46 L 26 38 L 26 84 L 74 84 L 74 38 L 80 46 L 92 40 L 82 20 L 66 12 Q 58 22 50 22 Q 42 22 34 12 Z', '#c7d2fe') + star(40, 46, 6, YEL, 2) + star(62, 64, 6, YEL, 2) + text(64, 44, 'z', 14, NAVY) + text(36, 72, 'z', 12, NAVY)),
  boots: () => svg(path('M 18 10 L 46 10 L 46 62 L 70 70 Q 82 74 82 84 L 82 90 L 18 90 Z', '#92400e') + rect(14, 86, 72, 8, 3, DARK) + line('M 18 22 L 46 22', '#78350f', 3)),
  gloves: () => svg(g('rotate(-12 34 56)', path('M 18 90 L 18 54 L 10 46 Q 6 40 12 38 L 20 44 L 20 24 Q 20 18 25 18 Q 30 18 30 24 L 30 14 Q 30 8 35 8 Q 40 8 40 14 L 40 20 Q 40 14 45 14 Q 50 14 50 20 L 50 90 Z', RED)) + g('rotate(12 66 56)', path('M 82 90 L 82 54 L 90 46 Q 94 40 88 38 L 80 44 L 80 24 Q 80 18 75 18 Q 70 18 70 24 L 70 14 Q 70 8 65 8 Q 60 8 60 14 L 60 20 Q 60 14 55 14 Q 50 14 50 20 L 50 90 Z', RED))),
  scarf: () => svg(path('M 22 24 Q 50 40 78 24 L 82 38 Q 50 56 18 38 Z', RED) + path('M 60 44 L 74 44 L 78 90 L 62 90 Z', RED) + line('M 62 82 L 78 82 M 62 74 L 77 74', WHITE, 3) + line('M 64 90 L 64 96 M 70 90 L 70 96 M 76 90 L 76 96', RED, 3)),
  swimsuit: () => svg(path('M 32 10 L 38 10 L 40 34 Q 50 40 60 34 L 62 10 L 68 10 L 70 40 Q 74 56 72 66 Q 62 90 50 90 Q 38 90 28 66 Q 26 56 30 40 Z', TEAL) + path('M 34 66 Q 50 74 66 66', 'none', 2.5) + circle(44, 50, 3, WHITE, 0) + circle(56, 56, 3, WHITE, 0)),
  diaper: () => svg(path('M 10 26 L 90 26 L 84 46 Q 72 52 66 76 Q 50 88 34 76 Q 28 52 16 46 Z', WHITE) + rect(10, 22, 18, 12, 3, SKY, 2.5) + rect(72, 22, 18, 12, 3, SKY, 2.5) + star(50, 52, 6, YEL, 2)),
  sunglasses: () => svg(path('M 8 40 L 92 40 L 88 48 Q 86 66 70 66 Q 56 66 54 50 L 46 50 Q 44 66 30 66 Q 14 66 12 48 Z', DARK) + line('M 18 46 L 26 54 M 60 46 L 68 54', '#64748b', 3)),
  umbrella: () => svg(path('M 8 50 Q 10 12 50 10 Q 90 12 92 50 Q 82 42 72 50 Q 62 42 50 50 Q 38 42 28 50 Q 18 42 8 50 Z', PURPLE) + line('M 50 50 L 50 82 Q 50 92 40 90 Q 34 88 36 82', O, 5) + line('M 50 12 L 50 8', O, 4)),
  'toilet paper': () => svg(ellipse(36, 28, 22, 14, WHITE) + path('M 14 28 L 14 76 Q 14 90 36 90 Q 58 90 58 76 L 58 28', WHITE) + ellipse(36, 28, 8, 5, '#e5e7eb', 2.5) + path('M 58 76 L 92 76 L 92 90 L 36 90', WHITE)),
  tissue: () => svg(rect(14, 46, 72, 44, 6, '#bfdbfe') + path('M 36 46 Q 30 22 42 14 Q 54 22 50 30 Q 62 22 66 30 Q 70 40 64 46 Z', WHITE) + line('M 24 70 L 76 70', '#93c5fd', 3)),
  potato: () => svg(path('M 18 50 Q 14 28 38 24 Q 62 18 78 32 Q 92 46 82 66 Q 70 84 44 80 Q 20 76 18 50 Z', '#d6a26a') + dot(36, 42, 2.5, '#92400e') + dot(60, 36, 2.5, '#92400e') + dot(66, 60, 2.5, '#92400e') + dot(42, 64, 2.5, '#92400e')),
  corn: () =>
    svg(g('rotate(-25 50 50)', ellipse(50, 46, 16, 36, YEL) + [26, 36, 46, 56, 66].map((y) => line(`M 38 ${y} L 62 ${y}`, '#ca8a04', 2)).join('') + line('M 44 14 L 44 78 M 56 14 L 56 78', '#ca8a04', 2) + path('M 50 84 Q 24 72 26 40 Q 40 60 50 64 Z', LIME) + path('M 50 84 Q 76 72 74 40 Q 60 60 50 64 Z', GREEN))),
  tomato: () => svg(path('M 50 26 Q 86 24 88 56 Q 86 88 50 88 Q 14 88 12 56 Q 14 24 50 26 Z', RED) + path('M 50 26 L 38 18 L 46 28 L 34 32 L 48 32 L 50 40 L 54 32 L 66 32 L 56 28 L 62 18 Z', GREEN, 2) + ellipse(34, 50, 5, 8, 'rgba(255,255,255,0.45)', 0)),
  lemon: () => svg(path('M 10 52 Q 18 26 50 24 Q 82 26 90 52 Q 82 78 50 80 Q 18 78 10 52 Z', '#fde047') + fruitLeaf(60, 24) + ellipse(36, 44, 8, 4, 'rgba(255,255,255,0.5)', 0)),
  pineapple: () =>
    svg(path('M 50 34 L 36 6 L 48 18 L 50 2 L 54 18 L 66 6 Z', GREEN, 2.5) + ellipse(50, 64, 26, 32, '#f59e0b') + line('M 30 46 L 66 88 M 30 66 L 52 92 M 40 34 L 74 74 M 70 46 L 34 88 M 70 66 L 48 92 M 60 34 L 26 74', '#b45309', 2.5) + ellipse(50, 64, 26, 32, 'none')),
  cherries: () => svg(line('M 34 66 Q 40 30 62 12 M 66 70 Q 64 36 62 12', '#15803d', 3.5) + circle(32, 72, 16, '#be123c') + circle(68, 74, 16, '#be123c') + fruitLeaf(62, 12, -10) + ellipse(26, 66, 4, 5, 'rgba(255,255,255,0.5)', 0) + ellipse(62, 68, 4, 5, 'rgba(255,255,255,0.5)', 0)),
  blueberries: () => svg([[30, 40], [52, 34], [72, 46], [38, 64], [62, 68], [48, 86], [24, 82]].map(([x, y]) => circle(x, y, 13, '#4f46e5') + `<path d="M ${x - 3} ${y - 6} l 3 3 l 3 -3" stroke="#1e1b4b" stroke-width="2"/>`).join('')),
  avocado: () => svg(path('M 50 8 Q 64 8 68 30 Q 86 52 80 72 Q 72 94 50 94 Q 28 94 20 72 Q 14 52 32 30 Q 36 8 50 8 Z', '#166534') + path('M 50 16 Q 60 16 62 34 Q 76 54 72 70 Q 66 86 50 86 Q 34 86 28 70 Q 24 54 38 34 Q 40 16 50 16 Z', '#bef264', 2) + circle(50, 64, 13, '#92400e')),
  bacon: () => svg([0, 1].map((i) => path(`M 8 ${30 + i * 32} Q 28 ${18 + i * 32} 50 ${30 + i * 32} Q 72 ${42 + i * 32} 92 ${30 + i * 32} L 92 ${46 + i * 32} Q 72 ${58 + i * 32} 50 ${46 + i * 32} Q 28 ${34 + i * 32} 8 ${46 + i * 32} Z`, '#b91c1c') + line(`M 10 ${38 + i * 32} Q 30 ${26 + i * 32} 50 ${38 + i * 32} Q 70 ${50 + i * 32} 90 ${38 + i * 32}`, '#fecaca', 3)).join('')),
  sausage: () => svg(g('rotate(-20 50 50)', rect(8, 36, 84, 28, 14, '#b45309') + line('M 24 44 Q 30 40 36 44 M 52 44 Q 58 40 64 44', '#fcd34d', 2.5)) + line('M 10 60 L 4 66 M 90 40 L 96 34', O, 3)),
  sushi: () => svg(ellipse(50, 66, 34, 18, WHITE) + path('M 16 52 Q 16 30 50 30 Q 84 30 84 52 Q 84 62 50 62 Q 16 62 16 52 Z', '#fb923c') + line('M 30 36 L 36 58 M 46 32 L 50 60 M 62 33 L 64 59', '#fed7aa', 3) + rect(44, 50, 12, 30, 2, DARK, 2)),
  ketchup: () => svg(path('M 42 4 L 58 4 L 56 20 L 44 20 Z', WHITE) + bottle(26, 18, 48, 76, RED, RED) + rect(36, 52, 28, 20, 4, WHITE, 2.5) + text(50, 67, '★', 13, RED)),
  butter: () => svg(path('M 10 64 L 30 40 L 90 40 L 90 72 L 70 84 L 10 84 Z', WHITE) + path('M 30 40 L 90 40 L 70 54 L 10 54 Z', '#fef08a') + path('M 10 54 L 70 54 L 70 84 L 10 84 Z', '#fde047') + path('M 70 54 L 90 40 L 90 72 L 70 84 Z', '#facc15')),
  honey: () => svg(path('M 22 34 L 78 34 L 82 82 Q 82 92 72 92 L 28 92 Q 18 92 18 82 Z', '#f59e0b') + rect(18, 22, 64, 14, 4, '#92400e') + path('M 30 36 Q 34 50 40 44 Q 46 56 52 46 Q 58 54 64 44 L 70 36 Z', '#fbbf24', 0) + text(50, 76, 'HONEY', 12, '#78350f') + path('M 76 30 Q 92 30 92 46', 'none', 3)),
  'hot chocolate': () => svg(path('M 18 40 L 70 40 L 66 84 Q 64 90 58 90 L 30 90 Q 24 90 22 84 Z', '#dc2626') + path('M 70 50 Q 88 50 86 64 Q 84 76 68 74', 'none', 5) + ellipse(44, 42, 24, 5, '#78350f', 2.5) + circle(36, 38, 5, WHITE, 2) + circle(48, 36, 5, WHITE, 2) + steam(40, 26) + steam(56, 24)),
  lemonade: () => svg(cup(24, 22, 52, 70, '#fef9c3', '#fde047') + circle(72, 28, 12, '#fde047') + line('M 72 18 L 72 38 M 62 28 L 82 28', '#ca8a04', 2) + line('M 40 22 L 30 4', PINK, 4)),
  muffin: () => svg(path('M 22 50 L 78 50 L 70 90 L 30 90 Z', SKY) + line('M 34 52 L 38 90 M 50 52 L 50 90 M 66 52 L 62 90', '#60a5fa', 2.5) + path('M 16 52 Q 12 26 34 24 Q 40 12 54 16 Q 70 12 76 26 Q 90 32 84 52 Z', '#b45309') + dot(36, 34, 3, '#4f46e5') + dot(56, 28, 3, '#4f46e5') + dot(66, 42, 3, '#4f46e5') + dot(46, 44, 3, '#4f46e5')),
  donut: () => svg(circle(50, 52, 38, '#f59e0b') + path('M 16 46 Q 18 16 50 14 Q 82 16 84 46 Q 86 60 74 66 Q 64 60 58 68 Q 48 62 40 70 Q 30 62 22 66 Q 12 60 16 46 Z', PINK, 3) + circle(50, 52, 12, WHITE) + line('M 30 32 L 34 28 M 62 26 L 68 30 M 72 46 L 76 42 M 28 50 L 32 46', '#facc15', 3) + line('M 44 26 L 48 22', '#22d3ee', 3)),
  cupcake: () => svg(path('M 24 54 L 76 54 L 68 92 L 32 92 Z', '#fda4af') + line('M 36 56 L 40 92 M 50 56 L 50 92 M 64 56 L 60 92', '#f43f5e', 2.5) + path('M 18 56 Q 14 40 30 38 Q 30 22 50 22 Q 70 22 70 38 Q 86 40 82 56 Z', '#fef3c7') + circle(50, 16, 7, RED, 2.5) + line('M 34 44 L 38 42 M 58 34 L 62 36 M 64 48 L 68 46', BLUE, 3)),
  pretzel: () => svg(`<path d="M 50 58 C 20 90 4 60 18 36 C 32 12 60 30 50 58 C 40 30 68 12 82 36 C 96 60 80 90 50 58 Z" fill="none" stroke="${O}" stroke-width="17"/><path d="M 50 58 C 20 90 4 60 18 36 C 32 12 60 30 50 58 C 40 30 68 12 82 36 C 96 60 80 90 50 58 Z" fill="none" stroke="#b45309" stroke-width="11"/>` + dot(26, 40, 2, WHITE) + dot(72, 34, 2, WHITE) + dot(60, 74, 2, WHITE)),
  peas: () => svg(path('M 8 58 Q 30 28 70 32 Q 92 34 92 46 Q 70 74 30 72 Q 14 70 8 58 Z', LIME) + [28, 44, 60, 76].map((x, i) => circle(x, 50 - (i === 3 ? 4 : 0), 8, GREEN, 2.5)).join('') + line('M 92 40 Q 96 30 90 24', GREEN, 3)),
  mushroom: () => svg(path('M 8 52 Q 10 14 50 12 Q 90 14 92 52 Z', RED) + circle(30, 34, 6, WHITE, 0) + circle(54, 24, 7, WHITE, 0) + circle(72, 40, 5, WHITE, 0) + path('M 36 52 L 64 52 Q 66 80 60 90 L 40 90 Q 34 80 36 52 Z', CREAM)),
  nuts: () => svg([[30, 40, -20], [62, 36, 20], [44, 70, 0], [76, 70, -10]].map(([x, y, r]) => g(`rotate(${r} ${x} ${y})`, ellipse(x, y, 16, 12, '#d6a26a') + line(`M ${x - 10} ${y} Q ${x} ${y - 4} ${x + 10} ${y}`, '#92400e', 2))).join('')),
};

