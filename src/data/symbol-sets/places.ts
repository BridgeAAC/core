import {
  O, BLUE, SKY, NAVY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, TEAL, GRAY, DARK, LIGHT, WHITE, BROWN, WOOD, CREAM,
  WATER, svg, circle, ellipse, rect, path, line, g, at, heart, star, sun, cloud, tree, house, toilet, plate,
} from './draw';

const wheel = (cx: number, cy: number, r: number) => circle(cx, cy, r, DARK) + circle(cx, cy, r * 0.42, GRAY, 2);

const car = (fill = RED) =>
  path('M 8 66 L 8 52 Q 8 46 14 45 L 24 44 L 34 28 Q 36 24 42 24 L 66 24 Q 72 24 76 30 L 84 44 Q 92 46 92 54 L 92 66 Z', fill) +
  path('M 38 30 L 48 30 L 48 44 L 30 44 Z', SKY, 2.5) +
  path('M 54 30 L 66 30 Q 70 30 72 34 L 78 44 L 54 44 Z', SKY, 2.5) +
  wheel(28, 68, 10) +
  wheel(72, 68, 10) +
  rect(84, 52, 8, 5, 2, YEL, 2);

const bus = () =>
  rect(8, 18, 84, 58, 8, YEL) +
  [0, 1, 2, 3].map((i) => rect(14 + i * 19, 26, 15, 18, 2, SKY, 2.5)).join('') +
  line('M 8 54 L 92 54', O, 2.5) +
  rect(78, 48, 10, 6, 2, WHITE, 2) +
  wheel(26, 78, 9) +
  wheel(74, 78, 9);

const bed = () =>
  rect(10, 30, 10, 60, 3, WOOD) +
  rect(80, 50, 10, 40, 3, WOOD) +
  rect(14, 58, 72, 18, 4, '#bfdbfe') +
  path('M 36 58 Q 36 50 44 50 L 84 50 L 84 76 L 36 76 Z', BLUE) +
  ellipse(28, 52, 10, 7, WHITE) +
  line('M 10 82 L 90 82', O, 3);

const stove = () =>
  rect(14, 28, 72, 64, 6, LIGHT) +
  rect(24, 54, 52, 30, 4, DARK, 2.5) +
  rect(30, 60, 40, 12, 2, '#fb923c', 2) +
  circle(30, 40, 6, DARK, 2.5) +
  circle(50, 40, 6, DARK, 2.5) +
  circle(70, 40, 6, DARK, 2.5) +
  path('M 42 6 L 62 6 L 64 20 Q 64 26 58 26 L 46 26 Q 40 26 40 20 Z', GRAY) +
  line('M 64 12 L 78 10', O, 4);

const sofa = () =>
  rect(14, 30, 72, 32, 8, '#a78bfa') +
  rect(6, 46, 18, 34, 6, '#8b5cf6') +
  rect(76, 46, 18, 34, 6, '#8b5cf6') +
  rect(22, 56, 56, 22, 4, '#c4b5fd') +
  line('M 50 56 L 50 78', O, 2.5) +
  line('M 14 80 L 14 88 M 86 80 L 86 88', O, 4);

const slide = () =>
  line('M 20 90 L 20 26 M 34 90 L 34 26', O, 4) +
  line('M 20 40 L 34 40 M 20 56 L 34 56 M 20 72 L 34 72', O, 3) +
  path('M 34 26 Q 54 30 66 62 Q 74 82 92 84 L 92 90 Q 70 90 60 66 Q 50 38 34 34 Z', RED) +
  rect(16, 20, 22, 8, 2, YEL, 2.5);

const shopFront = () =>
  rect(14, 40, 72, 50, 2, WHITE) +
  path('M 10 26 L 90 26 L 90 42 L 10 42 Z', RED) +
  [0, 1, 2, 3].map((i) => path(`M ${10 + i * 20} 42 Q ${20 + i * 20} 54 ${30 + i * 20} 42`, i % 2 ? WHITE : RED, 2.5)).join('') +
  rect(24, 58, 22, 18, 2, SKY, 2.5) +
  rect(56, 58, 18, 32, 2, WOOD, 2.5) +
  rect(30, 12, 40, 14, 3, YEL, 2.5);

const hospital = () =>
  rect(16, 26, 68, 64, 3, WHITE) +
  rect(38, 34, 24, 24, 4, RED) +
  line('M 50 39 L 50 53 M 43 46 L 57 46', WHITE, 5) +
  rect(42, 70, 16, 20, 2, SKY, 2.5) +
  rect(22, 64, 12, 10, 1, SKY, 2) +
  rect(66, 64, 12, 10, 1, SKY, 2);

const school = () =>
  rect(14, 44, 72, 46, 2, '#fca5a5') +
  path('M 8 46 L 50 22 L 92 46 Z', '#b91c1c') +
  line('M 50 22 L 50 6', O, 3) +
  path('M 50 6 L 66 10 L 50 14 Z', BLUE, 2) +
  circle(50, 36, 6, WHITE, 2.5) +
  rect(42, 66, 16, 24, 2, WOOD, 2.5) +
  rect(20, 56, 14, 12, 1, SKY, 2.5) +
  rect(66, 56, 14, 12, 1, SKY, 2.5);

const church = () =>
  rect(22, 50, 56, 40, 2, CREAM) +
  path('M 16 52 L 50 30 L 84 52 Z', '#a16207') +
  rect(40, 18, 20, 32, 2, CREAM) +
  path('M 36 20 L 50 6 L 64 20 Z', '#a16207') +
  path('M 42 90 L 42 72 Q 50 62 58 72 L 58 90', WOOD, 2.5) +
  circle(50, 30, 5, SKY, 2);

const library = () =>
  [BLUE, RED, GREEN, YEL, PURPLE, ORANGE].map((c, i) => rect(10 + i * 13, 20 + (i % 2) * 6, 11, 62 - (i % 2) * 6, 2, c, 2.5)).join('') +
  g('rotate(18 88 52)', rect(82, 22, 11, 60, 2, TEAL, 2.5)) +
  line('M 6 84 L 96 84', BROWN, 6);

const beach = () =>
  rect(4, 64, 92, 32, 0, '#fde68a', 0) +
  path('M 4 60 Q 20 54 36 60 T 68 60 T 100 60 L 100 66 L 4 66 Z', WATER, 0) +
  sun(80, 20, 9) +
  line('M 38 84 L 50 24', O, 3.5) +
  path('M 18 34 Q 46 4 78 28 Q 64 24 54 32 Q 46 22 36 32 Q 28 26 18 34 Z', RED) +
  line('M 4 66 L 96 66', O, 0);

const pool = () =>
  rect(8, 40, 84, 50, 6, WATER) +
  path('M 8 52 Q 20 46 32 52 T 56 52 T 80 52 T 92 52', 'none', 2.5).replace(`stroke="${O}"`, `stroke="${WHITE}"`) +
  path('M 8 70 Q 20 64 32 70 T 56 70 T 80 70 T 92 70', 'none', 2.5).replace(`stroke="${O}"`, `stroke="${WHITE}"`) +
  line('M 66 10 L 66 56 M 82 10 L 82 56', GRAY, 5) +
  line('M 66 24 L 82 24 M 66 38 L 82 38', GRAY, 4) +
  path('M 66 10 Q 66 2 74 2 M 82 10 Q 82 2 90 2', 'none', 0);

const lion = () =>
  circle(50, 52, 40, '#b45309') +
  [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const a = (i * Math.PI) / 4;
    return circle(50 + Math.cos(a) * 34, 52 + Math.sin(a) * 34, 10, '#c2410c', 2.5);
  }).join('') +
  circle(50, 52, 28, YEL) +
  circle(38, 46, 3.5, O, 0) +
  circle(62, 46, 3.5, O, 0) +
  path('M 44 56 L 56 56 L 50 63 Z', '#7c2d12', 2) +
  line('M 50 63 L 50 67 M 50 67 Q 44 72 40 68 M 50 67 Q 56 72 60 68', O, 2.5);

const clapper = () =>
  rect(12, 40, 76, 50, 4, DARK) +
  g('rotate(-14 12 38)', rect(12, 24, 76, 14, 2, WHITE) + [0, 1, 2, 3].map((i) => path(`M ${18 + i * 18} 24 L ${28 + i * 18} 24 L ${22 + i * 18} 38 L ${12 + i * 18} 38 Z`, DARK, 0)).join('')) +
  line('M 22 56 L 78 56 M 22 70 L 62 70', GRAY, 3);

const park = () => tree(32, 50, 1.1) + rect(52, 64, 40, 7, 2, WOOD) + line('M 56 71 L 56 86 M 88 71 L 88 86', O, 4) + rect(52, 52, 40, 6, 2, WOOD) + line('M 8 88 L 94 88', GREEN, 5);

const outside = () => sun(76, 22, 10) + cloud(32, 22, 0.6) + tree(30, 62, 0.9) + line('M 4 90 Q 50 80 96 90', GREEN, 6) + path('M 60 90 L 64 80 L 68 90 M 74 90 L 78 82 L 82 90', 'none', 2.5).replace(`stroke="${O}"`, `stroke="${GREEN}"`);

const restaurant = () =>
  plate(50, 60, 26, 26) +
  path('M 8 22 L 8 36 Q 8 44 14 44 L 14 88 Q 16 92 18 88 L 18 44 Q 24 44 24 36 L 24 22', GRAY, 2.5) +
  path('M 86 20 Q 96 30 92 56 L 90 56 L 90 88 Q 88 92 86 88 Z', GRAY, 2.5) +
  star(50, 14, 8);

export const PLACES: Record<string, () => string> = {
  home: () => svg(house()),
  school: () => svg(school()),
  bathroom: () => svg(toilet()),
  toilet: () => svg(toilet()),
  bedroom: () => svg(bed() + rect(66, 10, 22, 22, 2, '#1e3a8a') + at(77, 21, 0.25, path('M 6 -30 A 30 30 0 1 0 30 9 A 24 24 0 1 1 6 -30 Z', YEL))),
  bed: () => svg(bed()),
  kitchen: () => svg(stove()),
  'living room': () => svg(sofa() + rect(36, 6, 28, 18, 2, '#1f2937') + line('M 44 24 L 40 30 M 56 24 L 60 30', O, 2.5)),
  outside: () => svg(outside()),
  park: () => svg(park()),
  playground: () => svg(slide()),
  store: () => svg(shopFront()),
  shop: () => svg(shopFront()),
  restaurant: () => svg(restaurant()),
  hospital: () => svg(hospital()),
  "doctor's office": () => svg(hospital() + circle(84, 18, 12, WHITE, 2.5) + line('M 78 18 Q 78 28 84 28 Q 90 28 90 18', TEAL, 2.5)),
  church: () => svg(church()),
  library: () => svg(library()),
  beach: () => svg(beach()),
  car: () => svg(car()),
  bus: () => svg(bus()),
  pool: () => svg(pool()),
  zoo: () => svg(lion()),
  movies: () => svg(clapper()),
  "friend's house": () => svg(house('#bbf7d0', TEAL) + heart(50, 40, 7, PINK)),
  shower: () =>
    svg(
      line('M 20 92 L 20 18 Q 20 10 28 10 L 58 10 L 58 18', GRAY, 6) +
        path('M 44 18 L 72 18 L 66 28 L 50 28 Z', GRAY) +
        [46, 54, 62, 70].map((x, i) => line(`M ${x - 2} ${36 + (i % 2) * 6} L ${x - 6} ${50 + (i % 2) * 6} M ${x - 4} ${62} L ${x - 8} ${76}`, WATER, 3.5)).join(''),
    ),
  bath: () =>
    svg(
      path('M 8 50 L 92 50 L 86 76 Q 84 84 76 84 L 24 84 Q 16 84 14 76 Z', WHITE) +
        rect(4, 44, 92, 8, 4, LIGHT) +
        circle(30, 40, 7, '#e0f2fe', 2) +
        circle(42, 34, 9, '#e0f2fe', 2) +
        circle(56, 40, 7, '#e0f2fe', 2) +
        line('M 80 44 L 80 18 Q 80 10 72 10 L 66 10', GRAY, 5) +
        line('M 24 84 L 20 94 M 76 84 L 80 94', O, 4),
    ),
  airplane: () => svg(g('rotate(-30 50 50)', path('M 10 50 Q 10 42 22 42 L 80 42 Q 94 42 94 50 Q 94 58 80 58 L 22 58 Q 10 58 10 50 Z', WHITE) + path('M 44 42 L 32 12 L 44 12 L 62 42 Z', SKY) + path('M 44 58 L 32 88 L 44 88 L 62 58 Z', SKY) + path('M 14 44 L 8 30 L 18 30 L 26 42 Z', SKY))),
  train: () =>
    svg(rect(14, 22, 64, 54, 8, BLUE) + rect(22, 30, 20, 16, 2, SKY, 2.5) + rect(50, 30, 20, 16, 2, SKY, 2.5) + rect(10, 66, 72, 8, 3, NAVY) + wheel(30, 80, 8) + wheel(62, 80, 8) + line('M 4 92 L 96 92', O, 3) + rect(78, 50, 14, 22, 3, RED)),
  bike: () =>
    svg(
      circle(24, 66, 16, 'none', 4) +
        circle(76, 66, 16, 'none', 4) +
        line('M 24 66 L 42 40 L 66 40 L 76 66 M 42 40 L 52 66 L 66 40 M 52 66 L 24 66', RED, 4) +
        line('M 38 34 L 48 34 M 66 40 L 62 28 L 72 26', O, 4),
    ),
  farm: () => svg(rect(20, 44, 60, 46, 2, '#dc2626') + path('M 14 46 L 50 16 L 86 46 Z', '#7f1d1d') + path('M 38 90 L 38 64 L 62 64 L 62 90', WHITE, 3) + line('M 38 64 L 62 90 M 62 64 L 38 90', WHITE, 3) + rect(44, 36, 12, 12, 2, WHITE, 2.5)),
  city: () => svg(rect(8, 40, 22, 50, 2, '#93c5fd') + rect(30, 18, 26, 72, 2, '#60a5fa') + rect(56, 34, 18, 56, 2, '#a5b4fc') + rect(74, 50, 18, 40, 2, '#93c5fd') + [24, 34, 44, 54, 64, 74].map((y) => rect(36, y, 5, 5, 1, YEL, 1.5) + rect(46, y, 5, 5, 1, YEL, 1.5)).join('')),
  party: () => svg(path('M 30 90 L 50 30 L 70 90 Z', PINK) + line('M 38 70 L 62 70 M 44 52 L 56 52', YEL, 4) + circle(50, 26, 6, YEL, 2.5) + star(18, 22, 7, BLUE, 2) + star(84, 30, 7, LIME, 2) + circle(20, 60, 4, ORANGE, 2) + circle(82, 64, 4, PURPLE, 2)),
  dentist: () => svg(path('M 22 24 Q 22 10 36 10 Q 44 10 50 16 Q 56 10 64 10 Q 78 10 78 24 Q 78 40 72 56 L 66 84 Q 62 92 58 84 L 54 64 Q 50 58 46 64 L 42 84 Q 38 92 34 84 L 28 56 Q 22 40 22 24 Z', WHITE) + line('M 34 22 Q 38 18 44 20', SKY, 3)),
  gym: () => svg(rect(28, 44, 44, 10, 3, GRAY) + rect(14, 30, 12, 38, 3, DARK) + rect(74, 30, 12, 38, 3, DARK) + rect(6, 36, 8, 26, 3, DARK) + rect(86, 36, 8, 26, 3, DARK)),
};
