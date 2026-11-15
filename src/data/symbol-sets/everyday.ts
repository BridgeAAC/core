import {
  O, SKIN, HAIR, BLUE, SKY, NAVY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, TEAL, GRAY, DARK, LIGHT, WHITE, BROWN,
  WOOD, CREAM, WATER, svg, circle, ellipse, dot, rect, path, line, dashed, text, g, flip, at, arrow, curvedArrow, star,
  sun, moon, cloud, drop, clockFace, calendar, ball, box, person, book, tree, groundLine, face, steam, limb, openHand,
} from './draw';

const horizon = (skyFill: string) => rect(6, 6, 88, 88, 14, skyFill, 4);

const dayIcon = (label: string, color: string) => () => svg(calendar(label, color));

const tile = (label: string, fill: string, fg: string, dots = 0) => {
  const size = label.length >= 3 ? 34 : label.length === 2 ? 44 : 54;
  const y = dots ? 54 : 66;
  let marks = '';
  if (dots) {
    const per = Math.min(dots, 5);
    const rows = Math.ceil(dots / 5);
    for (let i = 0; i < dots; i++) {
      const r = Math.floor(i / 5);
      const c = i % 5;
      const n = r === rows - 1 ? dots - r * 5 : per;
      const x0 = 50 - ((n - 1) * 12) / 2;
      marks += circle(x0 + c * 12, 70 + r * 12, 4.2, fg, 1.5);
    }
  }
  return svg(rect(8, 8, 84, 84, 16, fill, 4) + text(50, y, label, size, fg, 900) + marks);
};

const NUMBER_COLORS = ['#bfdbfe', '#fde68a', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa', '#a5f3fc', '#fbcfe8'];
const NUMBER_FG = [NAVY, '#92400e', '#166534', '#9f1239', '#5b21b6', '#9a3412', '#155e75', '#9d174d'];

const numberSymbols: Record<string, () => string> = {};
for (let n = 0; n <= 100; n++) {
  const k = n % NUMBER_COLORS.length;
  numberSymbols[String(n)] = () => tile(String(n), NUMBER_COLORS[k], NUMBER_FG[k], n >= 1 && n <= 10 ? n : 0);
}

const splat = (fill: string) =>
  path(
    'M 50 12 Q 60 14 62 26 Q 72 14 82 22 Q 88 32 78 40 Q 92 46 88 60 Q 82 70 72 66 Q 76 82 64 86 Q 54 88 50 78 Q 44 92 32 86 Q 22 80 28 68 Q 12 72 10 58 Q 10 46 22 44 Q 10 34 18 24 Q 28 16 38 26 Q 40 12 50 12 Z',
    fill,
    3.5,
  ) + ellipse(40, 38, 6, 4, 'rgba(255,255,255,0.45)', 0);

const colorSymbols: Record<string, () => string> = {};
for (const [name, hex] of [
  ['red', '#ef4444'], ['yellow', '#facc15'], ['green', '#22c55e'], ['blue', '#3b82f6'], ['purple', '#8b5cf6'],
  ['pink', '#f472b6'], ['brown', '#92400e'], ['black', '#1f2937'], ['white', '#ffffff'], ['gray', '#9ca3af'], ['gold', '#eab308'],
] as const) {
  colorSymbols[name] = () => svg(splat(hex));
}

const tv = (screen: string) => rect(8, 16, 84, 58, 6, DARK) + rect(14, 22, 72, 46, 3, screen, 2) + line('M 36 74 L 30 88 M 64 74 L 70 88 M 26 88 L 74 88', O, 4);

const toothbrush = () =>
  g('rotate(-30 50 50)', rect(14, 46, 62, 10, 5, SKY) + rect(70, 42, 20, 12, 3, WHITE, 2.5) + line('M 74 42 L 74 34 M 79 42 L 79 34 M 84 42 L 84 34 M 89 42 L 89 34', SKY, 3));

const shoe = () =>
  path('M 10 72 L 12 40 Q 14 34 22 36 L 40 40 Q 48 54 66 56 L 84 60 Q 92 62 92 72 L 92 78 L 10 78 Z', RED) +
  rect(8, 76, 86, 8, 4, WHITE) +
  line('M 34 46 L 44 42 M 38 52 L 48 48', WHITE, 3);

const shirt = (fill = BLUE) =>
  path('M 34 14 L 18 22 L 6 40 L 20 48 L 26 40 L 26 88 L 74 88 L 74 40 L 80 48 L 94 40 L 82 22 L 66 14 Q 58 24 50 24 Q 42 24 34 14 Z', fill);

const pants = () =>
  path('M 24 12 L 76 12 L 80 90 L 58 90 L 50 40 L 42 90 L 20 90 Z', NAVY) + line('M 24 22 L 76 22', O, 2.5);

const coat = () => shirt('#f97316') + line('M 50 26 L 50 88', O, 3) + dot(44, 44, 2.5) + dot(44, 60, 2.5) + dot(44, 76, 2.5) + path('M 34 14 L 44 34 L 50 24 L 56 34 L 66 14', 'none', 2.5);

const hat = () => ellipse(50, 70, 44, 12, PURPLE) + path('M 24 68 Q 22 24 50 24 Q 78 24 76 68 Z', PURPLE) + rect(24, 56, 52, 8, 2, YEL, 2.5);

const sock = () => path('M 34 10 L 62 10 L 62 56 L 80 70 Q 90 80 80 88 Q 72 94 62 86 L 38 66 Q 32 60 34 52 Z', '#a7f3d0') + rect(34, 10, 28, 12, 2, TEAL, 2.5) + line('M 34 32 L 62 32 M 34 42 L 62 42', TEAL, 3);

const glasses = () => circle(28, 52, 18, '#e0f2fe') + circle(72, 52, 18, '#e0f2fe') + line('M 46 50 Q 50 44 54 50 M 10 50 L 4 40 M 90 50 L 96 40', O, 4);

const phone = () => rect(30, 8, 40, 84, 8, DARK) + rect(34, 16, 32, 62, 2, SKY, 2) + circle(50, 85, 3, GRAY, 1.5);

const tablet = () => rect(10, 18, 80, 64, 8, DARK) + rect(16, 24, 68, 52, 2, '#a7f3d0', 2) + rect(24, 32, 14, 14, 3, BLUE, 2) + rect(43, 32, 14, 14, 3, ORANGE, 2) + rect(62, 32, 14, 14, 3, PINK, 2) + rect(24, 52, 14, 14, 3, LIME, 2) + rect(43, 52, 14, 14, 3, YEL, 2) + rect(62, 52, 14, 14, 3, PURPLE, 2);

const computer = () => rect(14, 16, 72, 48, 5, DARK) + rect(19, 21, 62, 38, 2, SKY, 2) + path('M 6 72 L 94 72 L 88 84 L 12 84 Z', GRAY) + path('M 14 64 L 86 64 L 94 72 L 6 72 Z', LIGHT);

const note = (x: number, y: number, s = 1, fill = PURPLE) =>
  at(x, y, s, ellipse(-6, 18, 9, 7, fill) + ellipse(24, 12, 9, 7, fill) + line('M 2 18 L 2 -16 L 32 -22 L 32 12', O, 4) + line('M 2 -16 L 32 -22 L 32 -12 L 2 -6 Z', O, 4));

const dog = () =>
  ellipse(52, 64, 28, 18, '#d6a26a') +
  limbs4('#d6a26a') +
  circle(26, 40, 16, '#d6a26a') +
  path('M 14 30 Q 6 40 12 56 Q 20 50 20 34 Z', BROWN, 2.5) +
  path('M 34 28 Q 40 38 36 52 Q 30 48 30 32 Z', BROWN, 2.5) +
  dot(22, 38, 2.5) +
  dot(31, 38, 2.5) +
  ellipse(24, 47, 4, 3, O, 1) +
  line('M 80 56 Q 92 44 88 34', '#d6a26a', 6) +
  line('M 80 56 Q 92 44 88 34', O, 0);

function limbs4(fill: string) {
  return [30, 42, 62, 74].map((x) => rect(x, 72, 8, 18, 3, fill, 2.5)).join('');
}

const cat = () =>
  ellipse(56, 66, 26, 18, GRAY) +
  limbs4(GRAY) +
  path('M 12 28 L 16 12 L 26 22 L 36 12 L 40 28 Q 44 44 26 48 Q 8 44 12 28 Z', GRAY) +
  dot(20, 32, 2.5) +
  dot(32, 32, 2.5) +
  path('M 24 38 L 28 38 L 26 41 Z', PINK, 1.5) +
  line('M 8 38 L 18 40 M 8 44 L 18 42 M 44 38 L 34 40 M 44 44 L 34 42', O, 1.5) +
  line('M 82 62 Q 96 50 90 34', O, 10) +
  line('M 82 62 Q 96 50 90 34', GRAY, 6);

const bird = () =>
  ellipse(50, 56, 30, 24, SKY) +
  path('M 40 52 Q 54 40 66 54 Q 54 62 40 52 Z', BLUE, 2.5) +
  dot(30, 46, 3) +
  path('M 18 50 L 6 54 L 18 58 Z', ORANGE, 2) +
  path('M 78 50 L 94 40 L 90 58 Z', BLUE, 2.5) +
  line('M 44 80 L 42 90 M 56 80 L 58 90', ORANGE, 3);

const flower = () =>
  line('M 50 54 L 50 92', GREEN, 5) +
  path('M 50 76 Q 64 62 76 68 Q 66 80 50 76 Z', LIME, 2.5) +
  [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (i * Math.PI) / 3;
    return circle(50 + Math.cos(a) * 16, 34 + Math.sin(a) * 16, 11, PINK, 2.5);
  }).join('') +
  circle(50, 34, 10, YEL);

const blocks = () =>
  rect(10, 56, 30, 30, 3, RED) + text(25, 79, 'A', 22, WHITE) + rect(42, 56, 30, 30, 3, BLUE) + text(57, 79, 'B', 22, WHITE) + rect(26, 24, 30, 30, 3, YEL) + text(41, 47, 'C', 22, O);

const puzzle = () =>
  path('M 14 14 L 44 14 Q 44 4 52 4 Q 60 4 60 14 L 86 14 L 86 40 Q 96 40 96 48 Q 96 56 86 56 L 86 86 L 56 86 Q 56 76 48 76 Q 40 76 40 86 L 14 86 L 14 56 Q 24 56 24 48 Q 24 40 14 40 Z', LIME);

const bubbles = () => circle(30, 60, 18, '#e0f2fe', 3) + circle(64, 36, 22, '#ede9fe', 3) + circle(72, 76, 10, '#fce7f3', 3) + circle(26, 24, 8, '#e0f2fe', 2.5) + ellipse(58, 28, 5, 3, WHITE, 0) + ellipse(24, 54, 4, 2.5, WHITE, 0);

const doll = () => person({ x: 50, y: 54, s: 1, shirt: PINK, pants: PURPLE, hair: 'pony', hairColor: '#f59e0b', skirt: true });

const teddy = () =>
  circle(28, 22, 9, '#b45309') +
  circle(72, 22, 9, '#b45309') +
  ellipse(50, 70, 24, 22, '#d97706') +
  circle(50, 36, 22, '#d97706') +
  ellipse(50, 44, 9, 7, CREAM, 2.5) +
  dot(42, 32, 2.5) +
  dot(58, 32, 2.5) +
  dot(50, 42, 2.5) +
  circle(26, 66, 8, '#d97706') +
  circle(74, 66, 8, '#d97706') +
  circle(38, 90, 8, '#d97706') +
  circle(62, 90, 8, '#d97706');

export const EVERYDAY: Record<string, () => string> = {
  now: () => svg(clockFace(46, 46, 34, 12, 0) + arrow(92, 92, 72, 72, RED, 6, 12)),
  later: () => svg(clockFace(36, 52, 26, 3, 0) + curvedArrow('M 66 26 Q 92 50 70 78', 70, 78, 2.2, BLUE)),
  soon: () => svg(clockFace(42, 52, 32, 12, 50) + arrow(80, 50, 96, 50, GREEN, 5, 9)),
  today: () => svg(calendar('', RED) + star(50, 64, 16)),
  tomorrow: () => svg(calendar('', BLUE) + arrow(30, 66, 72, 66, GREEN, 7, 14)),
  yesterday: () => svg(calendar('', ORANGE) + arrow(72, 66, 30, 66, ORANGE, 7, 14)),
  morning: () => svg(horizon('#fef3c7') + sun(50, 64, 12) + path('M 10 72 Q 50 60 90 72 L 90 82 Q 90 90 82 90 L 18 90 Q 10 90 10 82 Z', LIME)),
  afternoon: () => svg(horizon('#bae6fd') + sun(50, 34, 14) + path('M 10 76 Q 50 64 90 76 L 90 82 Q 90 90 82 90 L 18 90 Q 10 90 10 82 Z', LIME)),
  evening: () => svg(horizon('#fdba74') + sun(50, 68, 13) + path('M 10 70 L 90 70 L 90 82 Q 90 90 82 90 L 18 90 Q 10 90 10 82 Z', '#7c3aed')),
  night: () => svg(horizon(NAVY) + moon(44, 46, 22) + star(76, 24, 6, YEL, 2) + star(70, 70, 5, YEL, 2) + star(24, 78, 4, YEL, 2)),
  always: () => svg(curvedArrow('M 50 14 A 36 36 0 1 1 18 32', 22, 26, -Math.PI / 2 - 0.9, GREEN, 7) + clockFace(50, 50, 18, 12, 0)),
  never: () => svg(clockFace(50, 50, 30, 4, 0) + circle(50, 50, 42, 'none', 6).replace(`stroke="${O}"`, `stroke="${RED}"`) + line('M 21 79 L 79 21', RED, 7)),
  monday: dayIcon('MON', BLUE),
  tuesday: dayIcon('TUE', ORANGE),
  wednesday: dayIcon('WED', GREEN),
  thursday: dayIcon('THU', PURPLE),
  friday: dayIcon('FRI', PINK),
  saturday: dayIcon('SAT', TEAL),
  sunday: dayIcon('SUN', RED),
  week: () =>
    svg(
      rect(8, 22, 84, 56, 8, WHITE, 4) +
        path('M 8 30 Q 8 22 16 22 L 84 22 Q 92 22 92 30 L 92 38 L 8 38 Z', BLUE, 4) +
        [BLUE, ORANGE, GREEN, PURPLE, PINK, TEAL, RED].map((c, i) => circle(18 + i * 10.7, 58, 4.5, c, 2)).join(''),
    ),
  minute: () => svg(clockFace(50, 50, 38, 12, 10) + `<path d="M 50 50 L 50 18 A 32 32 0 0 1 66 22.3 Z" fill="${RED}" opacity="0.35"/>`),
  hour: () => svg(path('M 50 50 L 50 12 A 38 38 0 1 1 49.9 12 Z', '#bfdbfe', 0) + clockFace(50, 50, 38, 1, 0, 'none')),
  again: () => svg(curvedArrow('M 74 32 A 30 30 0 1 0 80 58', 80, 60, Math.PI / 2 - 0.3, BLUE, 7) + curvedArrow('M 26 68 A 30 30 0 0 1 22 40', 22, 40, -Math.PI / 2 - 0.3, BLUE, 7)),
  first: () => svg(rect(34, 40, 32, 52, 3, YEL) + rect(4, 60, 30, 32, 3, LIGHT) + rect(66, 70, 30, 22, 3, LIGHT) + text(50, 76, '1', 28, O) + star(50, 22, 12)),
  last: () => svg(ball(18, 60, 9, LIGHT) + ball(42, 60, 9, LIGHT) + ball(66, 60, 9, LIGHT) + ball(86, 60, 9, RED) + arrow(86, 18, 86, 42, RED, 5, 10)),
  next: () => svg(rect(8, 30, 34, 40, 6, LIGHT) + rect(58, 30, 34, 40, 6, '#bbf7d0') + arrow(40, 50, 62, 50, GREEN, 6, 12)),
  ...numberSymbols,
  ...colorSymbols,

  sleep: () => svg(rect(6, 54, 88, 24, 6, '#bfdbfe') + circle(22, 50, 11, SKIN) + path('M 11 48 Q 12 38 22 38 Q 32 38 33 46 Q 26 42 22 42 Q 16 42 11 48 Z', HAIR, 2) + line('M 18 50 Q 20 52 22 50 M 25 50 Q 27 52 29 50', O, 1.8) + path('M 34 46 L 90 46 Q 94 46 94 50 L 94 64 L 34 64 Z', BLUE) + text(62, 30, 'z', 14, BLUE) + text(72, 22, 'z', 18, BLUE) + text(84, 14, 'Z', 22, BLUE)),
  walk: () => svg(person({ x: 50, walk: true, pose: 'down', shirt: TEAL }) + groundLine(94) + arrow(70, 20, 92, 20, GREEN, 5, 10)),
  run: () => svg(person({ x: 56, walk: true, pose: 'run', shirt: ORANGE }) + line('M 6 40 L 26 40 M 2 56 L 26 56', GRAY, 5)),
  jump: () => svg(person({ x: 50, y: 42, pose: 'up', shirt: LIME, face: 'grin' }) + groundLine(94) + line('M 36 86 L 32 92 M 64 86 L 68 92', GRAY, 3)),
  sit: () => svg(rect(26, 58, 50, 8, 3, WOOD) + line('M 30 66 L 30 92 M 72 66 L 72 92 M 30 58 L 30 24', BROWN, 5) + person({ x: 40, y: 46, shirt: BLUE, sit: true })),
  stand: () => svg(person({ x: 50, shirt: GREEN, pose: 'down' }) + groundLine(92) + arrow(84, 80, 84, 20, BLUE, 5, 10)),
  dance: () => svg(person({ x: 46, walk: true, pose: 'up', shirt: PINK, pants: PURPLE, hair: 'pony', face: 'grin' }) + note(76, 30, 0.5) + note(14, 62, 0.4, BLUE)),
  sing: () => svg(person({ x: 38, shirt: PURPLE, face: 'open' }) + note(62, 34, 0.55) + note(80, 66, 0.45, BLUE)),
  swim: () => svg(rect(6, 54, 88, 40, 10, WATER) + circle(40, 46, 10, SKIN) + path('M 30 44 Q 30 34 40 34 Q 50 34 50 44 Q 46 38 40 38 Q 34 38 30 44 Z', HAIR, 2) + dot(44, 45, 2) + limb('M 52 52 Q 66 36 80 44', SKIN) + limb('M 30 54 Q 18 46 10 52', SKIN) + line('M 10 66 Q 24 60 38 66 T 66 66 T 92 66', WHITE, 3)),
  'wash hands': () =>
    svg(
      rect(8, 74, 84, 20, 8, WHITE) +
        line('M 62 8 L 62 22 Q 62 28 56 28 L 50 28', GRAY, 7) +
        drop(48, 38, 0.45) +
        g('rotate(-20 36 58)', openHand(36, 62, 0.75)) +
        g('rotate(20 64 58)', flip(openHand(36, 62, 0.75))) +
        circle(24, 40, 5, '#e0f2fe', 2) +
        circle(78, 44, 6, '#e0f2fe', 2) +
        circle(70, 34, 4, '#e0f2fe', 2),
    ),
  'brush teeth': () => svg(face({ eyes: 'happy', mouth: 'teeth' }) + g('translate(32 30) scale(0.7)', toothbrush())),
  cry: () =>
    svg(
      face({ eyes: 'closed', brow: 'worried', mouth: 'yawn', fill: SKY }) +
        path('M 34 48 Q 26 62 32 70 Q 38 62 34 48 Z', WATER, 2) +
        path('M 66 48 Q 74 62 68 70 Q 62 62 66 48 Z', WATER, 2),
    ),
  laugh: () => svg(face({ eyes: 'happy', mouth: 'grin', blush: true }) + text(14, 22, 'ha', 14, ORANGE) + text(86, 22, 'ha', 14, ORANGE)),
  push: () => svg(person({ x: 34, pose: 'give', shirt: BLUE, walk: true }) + box(62, 46, 30, WOOD) + arrow(64, 32, 92, 32, RED, 5, 10)),
  pull: () => svg(flip(person({ x: 34, pose: 'give', shirt: BLUE, walk: true })) + line('M 32 48 L 62 48', BROWN, 3) + box(8, 54, 26, WOOD) + arrow(36, 30, 64, 30, RED, 5, 10)),
  throw: () => svg(person({ x: 40, pose: 'wave', shirt: ORANGE }) + ball(80, 22, 9, RED) + dashed('M 64 22 Q 70 14 72 18', GRAY, 3) + line('M 66 30 L 72 24 M 62 34 L 70 32', GRAY, 3)),
  catch: () => svg(person({ x: 40, pose: 'reach', shirt: GREEN }) + ball(80, 14, 10, RED) + dashed('M 92 4 Q 96 10 90 12', GRAY, 3)),
  cook: () => svg(path('M 14 46 L 70 46 L 66 80 Q 64 88 56 88 L 28 88 Q 20 88 18 80 Z', GRAY) + line('M 70 52 L 92 48', O, 6) + ellipse(42, 46, 28, 6, '#fb923c', 2.5) + steam(32, 34) + steam(50, 30)),
  draw: () => svg(rect(10, 14, 64, 72, 4, WHITE) + sun(30, 34, 7) + path('M 18 76 L 34 54 L 46 68 L 56 58 L 68 76 Z', LIME, 2.5) + g('rotate(35 74 52)', rect(68, 18, 12, 50, 2, RED) + path('M 68 68 L 80 68 L 74 80 Z', CREAM))),
  cut: () => svg(circle(30, 72, 12, RED) + circle(30, 72, 5, WHITE, 2) + circle(60, 82, 12, RED) + circle(60, 82, 5, WHITE, 2) + path('M 38 62 L 80 10 L 84 14 L 48 68 Z', GRAY, 2.5) + path('M 52 74 L 90 30 L 94 36 L 60 78 Z', GRAY, 2.5)),
  build: () => svg(blocks()),
  watch: () => svg(tv('#bae6fd') + star(50, 44, 12)),
  share: () => svg(person({ x: 22, s: 0.8, pose: 'give', shirt: BLUE }) + flip(person({ x: 22, s: 0.8, pose: 'give', shirt: PINK, hair: 'long', pants: PURPLE })) + ball(50, 40, 9, YEL)),
  try: () => svg(person({ x: 40, shirt: TEAL, pose: 'up', face: 'grin' }) + star(80, 70, 12) + dashed('M 70 30 Q 84 40 80 56', GRAY, 3)),
  ball: () => svg(ball(50, 52, 34, RED)),
  toy: () => svg(teddy()),
  toys: () => svg(teddy()),
  teddy: () => svg(teddy()),
  book: () => svg(book(18, 14, 64, 74, BLUE)),
  tv: () => svg(tv('#bae6fd') + path('M 42 34 L 62 46 L 42 58 Z', WHITE, 2.5)),
  tablet: () => svg(tablet()),
  phone: () => svg(phone()),
  computer: () => svg(computer()),
  music: () => svg(note(40, 46, 1.2)),
  game: () => svg(path('M 20 34 Q 8 34 8 54 Q 8 80 22 80 Q 30 80 36 70 L 64 70 Q 70 80 78 80 Q 92 80 92 54 Q 92 34 80 34 Z', DARK) + line('M 24 50 L 24 62 M 18 56 L 30 56', WHITE, 4) + circle(72, 50, 4, RED, 1.5) + circle(80, 58, 4, BLUE, 1.5)),
  bubbles: () => svg(bubbles()),
  blocks: () => svg(blocks()),
  puzzle: () => svg(puzzle()),
  doll: () => svg(doll()),
  dog: () => svg(dog()),
  cat: () => svg(cat()),
  bird: () => svg(bird()),
  shoes: () => svg(shoe()),
  shirt: () => svg(shirt()),
  pants: () => svg(pants()),
  coat: () => svg(coat()),
  jacket: () => svg(coat()),
  hat: () => svg(hat()),
  socks: () => svg(sock()),
  glasses: () => svg(glasses()),
  toothbrush: () => svg(toothbrush()),
  sun: () => svg(sun(50, 50, 22)),
  sunny: () => svg(sun(50, 50, 22)),
  rain: () => svg(cloud(50, 36, 1.2, LIGHT) + drop(30, 70, 0.6) + drop(50, 80, 0.6) + drop(70, 70, 0.6)),
  snow: () => svg(cloud(50, 36, 1.2, LIGHT) + line('M 30 66 L 30 82 M 23 70 L 37 78 M 23 78 L 37 70 M 64 66 L 64 82 M 57 70 L 71 78 M 57 78 L 71 70', '#60a5fa', 3)),
  cloudy: () => svg(sun(66, 36, 12) + cloud(46, 58, 1.2, LIGHT)),
  flower: () => svg(flower()),
  tree: () => svg(tree(50, 60, 1.3)),
  bag: () => svg(rect(16, 34, 68, 56, 10, BLUE) + path('M 34 34 Q 34 14 50 14 Q 66 14 66 34', 'none', 5) + rect(30, 52, 40, 22, 4, SKY, 2.5)),
  backpack: () => svg(rect(20, 22, 60, 70, 16, RED) + path('M 38 22 Q 38 8 50 8 Q 62 8 62 22', 'none', 4) + rect(30, 54, 40, 26, 6, '#fb7185', 2.5) + line('M 30 64 L 70 64', O, 2.5)),
  money: () => svg(rect(8, 28, 84, 44, 6, '#86efac') + circle(50, 50, 13, '#bbf7d0', 2.5) + text(50, 57, '$', 18, '#166534') + dot(20, 50, 3, '#166534') + dot(80, 50, 3, '#166534')),
  light: () => svg(path('M 32 54 Q 20 44 20 30 Q 20 8 50 8 Q 80 8 80 30 Q 80 44 68 54 L 66 66 L 34 66 Z', YEL) + rect(36, 66, 28, 14, 3, GRAY) + line('M 4 30 L 12 30 M 88 30 L 96 30 M 12 8 L 18 14 M 88 8 L 82 14', ORANGE, 4)),
};
